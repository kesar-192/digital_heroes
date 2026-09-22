-- =============================================================================
-- Digital Heroes · Migration 0001 · Core schema, triggers, RLS, storage
-- Run in a NEW Supabase project (SQL editor or `supabase db push`).
-- Money is ALWAYS stored as integer minor units (pence/paise) - never floats.
-- Writes coming from Stripe webhooks / draw publishing use the service_role key,
-- which bypasses RLS. Everything a browser client can do is governed by RLS below.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------
create type public.user_role           as enum ('subscriber', 'admin');
create type public.plan_interval       as enum ('month', 'year');
create type public.subscription_status as enum
  ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'lapsed');
create type public.draw_type           as enum ('random', 'algorithmic');
create type public.draw_status         as enum ('draft', 'simulated', 'published');
create type public.match_tier          as enum ('match_5', 'match_4', 'match_3');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.payout_status       as enum ('pending', 'paid');
create type public.contribution_source as enum ('subscription', 'donation');

-- -----------------------------------------------------------------------------
-- 2. GENERIC HELPERS
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- 3. PLATFORM SETTINGS (singleton row - tune business rules without redeploying)
-- -----------------------------------------------------------------------------
create table public.platform_settings (
  id                     boolean primary key default true check (id),  -- forces one row
  prize_pool_percent     numeric(5,2) not null default 50 check (prize_pool_percent between 0 and 100),
  min_charity_percent    numeric(5,2) not null default 10 check (min_charity_percent between 0 and 100),
  share_match_5          numeric(5,2) not null default 40,
  share_match_4          numeric(5,2) not null default 35,
  share_match_3          numeric(5,2) not null default 25,
  updated_at             timestamptz not null default now(),
  constraint shares_sum_100 check (share_match_5 + share_match_4 + share_match_3 = 100)
);
insert into public.platform_settings default values;
create trigger trg_settings_updated before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. CHARITIES (+ events)
-- -----------------------------------------------------------------------------
create table public.charities (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  tagline      text,
  description  text,
  image_path   text,                       -- path in `charity-media` bucket
  website_url  text,
  is_featured  boolean not null default false,   -- homepage spotlight
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index charities_active_idx on public.charities (is_active, is_featured);
create index charities_fts_idx    on public.charities using gin (to_tsvector('english', name || ' ' || coalesce(description, '')));
create trigger trg_charities_updated before update on public.charities
  for each row execute function public.set_updated_at();

create table public.charity_events (
  id          uuid primary key default gen_random_uuid(),
  charity_id  uuid not null references public.charities(id) on delete cascade,
  title       text not null,
  description text,
  location    text,
  starts_at   timestamptz not null,
  created_at  timestamptz not null default now()
);
create index charity_events_charity_idx on public.charity_events (charity_id, starts_at);

-- -----------------------------------------------------------------------------
-- 5. PROFILES (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text,
  role                public.user_role not null default 'subscriber',
  stripe_customer_id  text unique,
  charity_id          uuid references public.charities(id) on delete set null,
  charity_percent     numeric(5,2) not null default 10 check (charity_percent between 10 and 100),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- RBAC helpers (security definer => avoids RLS recursion on profiles)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Auto-create profile on signup. Charity choice is passed via signUp options.data.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_charity uuid;
  v_percent numeric;
begin
  begin
    v_charity := nullif(new.raw_user_meta_data->>'charity_id', '')::uuid;
    v_percent := coalesce(nullif(new.raw_user_meta_data->>'charity_percent', '')::numeric, 10);
  exception when others then
    v_charity := null; v_percent := 10;
  end;

  insert into public.profiles (id, email, full_name, charity_id, charity_percent)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name',
          v_charity, greatest(v_percent, 10));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Block privilege escalation: only admins (or service role / SQL editor, where
-- auth.uid() is null) may change role or stripe_customer_id.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.email is distinct from old.email then
      raise exception 'Not allowed to modify protected profile fields';
    end if;
  end if;
  return new;
end $$;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- -----------------------------------------------------------------------------
-- 6. SUBSCRIPTIONS (mirror of Stripe state, written ONLY by webhook / service role)
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id   text not null unique,
  stripe_price_id          text not null,
  plan_interval            public.plan_interval not null,
  status                   public.subscription_status not null,
  amount_minor             integer not null check (amount_minor > 0),  -- price per billing period
  currency                 char(3) not null default 'gbp',
  current_period_start     timestamptz not null,
  current_period_end       timestamptz not null,
  cancel_at_period_end     boolean not null default false,
  canceled_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index subscriptions_user_idx   on public.subscriptions (user_id, status);
create index subscriptions_status_idx on public.subscriptions (status, current_period_end);
-- At most one live subscription per user
create unique index subscriptions_one_live_per_user
  on public.subscriptions (user_id) where status in ('trialing', 'active', 'past_due');
create trigger trg_subs_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Real-time entitlement check used by RLS AND callable from API routes via rpc().
create or replace function public.has_active_subscription(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user
      and s.status in ('active', 'trialing')
      and s.current_period_end > now()
  );
$$;

-- -----------------------------------------------------------------------------
-- 7. SCORES (rolling window of 5, one per date)
-- -----------------------------------------------------------------------------
create table public.scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  score_date  date not null check (score_date <= current_date),
  value       smallint not null check (value between 1 and 45),   -- Stableford
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint scores_one_per_date unique (user_id, score_date)
);
create index scores_user_date_idx on public.scores (user_id, score_date desc);
create trigger trg_scores_updated before update on public.scores
  for each row execute function public.set_updated_at();

-- BEFORE INSERT: reject a score that would be instantly evicted (older than all 5)
create or replace function public.scores_before_insert()
returns trigger language plpgsql as $$
declare
  n int; oldest date;
begin
  select count(*), min(score_date) into n, oldest
  from public.scores where user_id = new.user_id;

  if n >= 5 and new.score_date < oldest then
    raise exception 'This date is older than your 5 most recent scores. Edit an existing entry instead.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger trg_scores_before_insert before insert on public.scores
  for each row execute function public.scores_before_insert();

-- AFTER INSERT: FIFO eviction - keep only the 5 latest by date
create or replace function public.scores_after_insert()
returns trigger language plpgsql as $$
begin
  delete from public.scores
  where id in (
    select id from public.scores
    where user_id = new.user_id
    order by score_date desc, created_at desc
    offset 5
  );
  return null;
end $$;
create trigger trg_scores_after_insert after insert on public.scores
  for each row execute function public.scores_after_insert();

-- -----------------------------------------------------------------------------
-- 8. DRAWS (+ simulations)
-- -----------------------------------------------------------------------------
create table public.draws (
  id                        uuid primary key default gen_random_uuid(),
  period                    date not null unique                       -- first day of draw month
                            check (period = date_trunc('month', period)::date),
  draw_type                 public.draw_type not null default 'random',
  status                    public.draw_status not null default 'draft',
  winning_numbers           smallint[] check (
                              winning_numbers is null or (
                                array_length(winning_numbers, 1) = 5
                                and 1 <= all (winning_numbers)
                                and 45 >= all (winning_numbers)
                              )),
  -- Pool snapshot (frozen at publish time)
  active_subscriber_count   integer,
  pool_total_minor          bigint  not null default 0,   -- this month's contributions
  jackpot_carried_in_minor  bigint  not null default 0,   -- rollover from previous draw
  pool_match_5_minor        bigint  not null default 0,   -- includes carried-in jackpot
  pool_match_4_minor        bigint  not null default 0,
  pool_match_3_minor        bigint  not null default 0,
  jackpot_rolled_over_minor bigint  not null default 0,   -- carried to NEXT draw if no 5-match
  published_at              timestamptz,
  published_by              uuid references public.profiles(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint published_has_numbers check (status <> 'published' or winning_numbers is not null)
);
create index draws_status_idx on public.draws (status, period desc);
create trigger trg_draws_updated before update on public.draws
  for each row execute function public.set_updated_at();

-- Immutable once published (protects data integrity of payouts)
create or replace function public.draws_lock_published()
returns trigger language plpgsql as $$
begin
  if old.status = 'published' then
    raise exception 'Published draws are immutable';
  end if;
  return new;
end $$;
create trigger trg_draws_lock before update on public.draws
  for each row execute function public.draws_lock_published();

create table public.draw_simulations (
  id               uuid primary key default gen_random_uuid(),
  draw_id          uuid not null references public.draws(id) on delete cascade,
  draw_type        public.draw_type not null,
  winning_numbers  smallint[] not null,
  result           jsonb not null,     -- {match_5: {winners, prize_each}, ..., rollover}
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now()
);
create index draw_sims_draw_idx on public.draw_simulations (draw_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 9. DRAW ENTRIES (one row per subscriber per published draw)
-- -----------------------------------------------------------------------------
create table public.draw_entries (
  id             uuid primary key default gen_random_uuid(),
  draw_id        uuid not null references public.draws(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  scores_snapshot smallint[] not null,             -- the user's scores at draw time
  matched_count  smallint not null default 0 check (matched_count between 0 and 5),
  tier           public.match_tier,                -- null = no win
  prize_minor    bigint not null default 0,        -- equal share within tier
  created_at     timestamptz not null default now(),
  constraint draw_entries_unique unique (draw_id, user_id),
  constraint tier_matches_count check (
    (tier is null     and matched_count < 3) or
    (tier = 'match_3' and matched_count = 3) or
    (tier = 'match_4' and matched_count = 4) or
    (tier = 'match_5' and matched_count = 5))
);
create index draw_entries_user_idx  on public.draw_entries (user_id, created_at desc);
create index draw_entries_tier_idx  on public.draw_entries (draw_id, tier) where tier is not null;

-- -----------------------------------------------------------------------------
-- 10. WINNER VERIFICATIONS
-- -----------------------------------------------------------------------------
create table public.winner_verifications (
  id              uuid primary key default gen_random_uuid(),
  draw_entry_id   uuid not null unique references public.draw_entries(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  proof_path      text not null,                       -- path in private `winner-proofs` bucket
  status          public.verification_status not null default 'pending',
  review_note     text,
  reviewed_by     uuid references public.profiles(id),
  reviewed_at     timestamptz,
  payout_status   public.payout_status not null default 'pending',
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint paid_requires_approval check (payout_status = 'pending' or status = 'approved')
);
create index winner_ver_status_idx on public.winner_verifications (status, payout_status);
create trigger trg_winner_ver_updated before update on public.winner_verifications
  for each row execute function public.set_updated_at();

-- Users may only swap the proof file (and re-submit after rejection). Everything
-- else (status, payout, reviewer) is admin-only.
create or replace function public.guard_verification_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.payout_status is distinct from old.payout_status
       or new.paid_at is distinct from old.paid_at
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
       or new.draw_entry_id is distinct from old.draw_entry_id
       or new.user_id is distinct from old.user_id then
      raise exception 'Not allowed to modify review or payout fields';
    end if;
    if new.status is distinct from old.status
       and not (old.status = 'rejected' and new.status = 'pending') then
      raise exception 'Not allowed to change verification status';
    end if;
  end if;
  return new;
end $$;
create trigger trg_winner_ver_guard before update on public.winner_verifications
  for each row execute function public.guard_verification_update();

-- -----------------------------------------------------------------------------
-- 11. CHARITY CONTRIBUTIONS LEDGER (subscription share + independent donations)
-- -----------------------------------------------------------------------------
create table public.charity_contributions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id) on delete set null,  -- null = guest donor
  charity_id          uuid not null references public.charities(id),
  source              public.contribution_source not null,
  amount_minor        integer not null check (amount_minor > 0),
  currency            char(3) not null default 'gbp',
  stripe_reference    text unique,          -- invoice id / payment_intent id => webhook idempotency
  created_at          timestamptz not null default now()
);
create index contributions_charity_idx on public.charity_contributions (charity_id, created_at desc);
create index contributions_user_idx    on public.charity_contributions (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.platform_settings      enable row level security;
alter table public.charities              enable row level security;
alter table public.charity_events         enable row level security;
alter table public.profiles               enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.scores                 enable row level security;
alter table public.draws                  enable row level security;
alter table public.draw_simulations       enable row level security;
alter table public.draw_entries           enable row level security;
alter table public.winner_verifications   enable row level security;
alter table public.charity_contributions  enable row level security;

-- platform_settings: everyone authenticated can read; admin edits
create policy settings_read  on public.platform_settings for select to authenticated using (true);
create policy settings_admin on public.platform_settings for all    to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- charities + events: public read (visitors browse), admin CRUD
create policy charities_public_read on public.charities for select to anon, authenticated
  using (is_active or public.is_admin());
create policy charities_admin_write on public.charities for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy events_public_read on public.charity_events for select to anon, authenticated using (true);
create policy events_admin_write on public.charity_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles: own row or admin
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- (insert handled by trigger; delete cascades from auth.users)

-- subscriptions: read own / admin. NO client writes - webhook uses service_role.
create policy subs_select on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- scores: read own / admin; write only while subscribed (admin may edit any)
create policy scores_select on public.scores for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy scores_insert on public.scores for insert to authenticated
  with check ((user_id = auth.uid() and public.has_active_subscription(auth.uid())) or public.is_admin());
create policy scores_update on public.scores for update to authenticated
  using ((user_id = auth.uid() and public.has_active_subscription(auth.uid())) or public.is_admin())
  with check ((user_id = auth.uid() and public.has_active_subscription(auth.uid())) or public.is_admin());
create policy scores_delete on public.scores for delete to authenticated
  using ((user_id = auth.uid() and public.has_active_subscription(auth.uid())) or public.is_admin());

-- draws: subscribers see published only; admin sees/edits all
create policy draws_read_published on public.draws for select to authenticated
  using (status = 'published' or public.is_admin());
create policy draws_admin_write on public.draws for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy sims_admin on public.draw_simulations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- draw_entries: own or admin; created by publish routine (service_role / admin)
create policy entries_select on public.draw_entries for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy entries_admin_write on public.draw_entries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- winner_verifications: winners upload proof for THEIR winning entry only
create policy wv_select on public.winner_verifications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy wv_insert on public.winner_verifications for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending' and payout_status = 'pending'
    and exists (select 1 from public.draw_entries e
                where e.id = draw_entry_id and e.user_id = auth.uid() and e.tier is not null)
  );
create policy wv_update_own on public.winner_verifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());   -- narrowed by guard trigger
create policy wv_admin on public.winner_verifications for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- contributions: own or admin read; writes via service_role (webhooks)
create policy contrib_select on public.charity_contributions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- 13. PUBLIC / ADMIN AGGREGATE FUNCTIONS
-- -----------------------------------------------------------------------------
-- Homepage "impact so far" counter - safe to expose to anon (aggregate only)
create or replace function public.charity_impact_total()
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount_minor), 0)::bigint from public.charity_contributions;
$$;
grant execute on function public.charity_impact_total() to anon, authenticated;

-- Admin analytics in one round trip
create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'total_users',          (select count(*) from public.profiles),
    'active_subscribers',   (select count(distinct user_id) from public.subscriptions
                              where status in ('active','trialing') and current_period_end > now()),
    'total_prize_pool_minor',(select coalesce(sum(pool_total_minor),0) from public.draws where status = 'published'),
    'charity_total_minor',  (select coalesce(sum(amount_minor),0) from public.charity_contributions),
    'draws_published',      (select count(*) from public.draws where status = 'published'),
    'pending_verifications',(select count(*) from public.winner_verifications where status = 'pending'),
    'pending_payouts',      (select count(*) from public.winner_verifications
                              where status = 'approved' and payout_status = 'pending')
  );
end $$;

-- -----------------------------------------------------------------------------
-- 14. STORAGE BUCKETS + POLICIES
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('winner-proofs', 'winner-proofs', false),   -- private: screenshots of scores
  ('charity-media', 'charity-media', true)     -- public: charity images
on conflict (id) do nothing;

-- winner-proofs: files live under "<user_id>/<filename>"
create policy proofs_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'winner-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy proofs_read on storage.objects for select to authenticated
  using (bucket_id = 'winner-proofs'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy proofs_replace on storage.objects for update to authenticated
  using (bucket_id = 'winner-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- charity-media: world-readable (bucket is public), admin-only writes
create policy charity_media_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'charity-media' and public.is_admin())
  with check (bucket_id = 'charity-media' and public.is_admin());

-- -----------------------------------------------------------------------------
-- 15. SEED DATA (sample charities so the homepage isn't empty)
-- -----------------------------------------------------------------------------
insert into public.charities (name, slug, tagline, description, is_featured) values
  ('Clean Water Collective', 'clean-water-collective', 'Every round funds a well.',
   'Builds and maintains clean-water infrastructure in rural communities.', true),
  ('Bright Futures Fund', 'bright-futures-fund', 'Education for every child.',
   'Scholarships and school supplies for underserved students.', false),
  ('Green Roots Trust', 'green-roots-trust', 'Plant. Restore. Repeat.',
   'Reforestation and community-led conservation projects.', false);

-- To create your first admin (run once, after signing up through the app):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
