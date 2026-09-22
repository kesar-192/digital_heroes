-- =============================================================================
-- Digital Heroes · Migration 0002 · Atomic draw publish
-- The draw engine (lib/draw/*) computes winning numbers, pool amounts, and
-- each subscriber's match/prize in plain TypeScript, so it's unit-testable
-- with no DB dependency. This function is the ONLY place that persists the
-- result — it does the draws UPDATE and the draw_entries bulk INSERT in one
-- transaction, so a mid-write failure can never leave a published draw with
-- partial entries.
-- =============================================================================

create or replace function public.publish_draw(
  p_draw_id            uuid,
  p_winning_numbers    smallint[],
  p_active_subscriber_count integer,
  p_pool_total_minor   bigint,
  p_jackpot_carried_in_minor bigint,
  p_pool_match_5_minor bigint,
  p_pool_match_4_minor bigint,
  p_pool_match_3_minor bigint,
  p_jackpot_rolled_over_minor bigint,
  p_entries            jsonb   -- [{user_id, scores_snapshot, matched_count, tier, prize_minor}, ...]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.draws set
    status                     = 'published',
    winning_numbers            = p_winning_numbers,
    active_subscriber_count    = p_active_subscriber_count,
    pool_total_minor           = p_pool_total_minor,
    jackpot_carried_in_minor   = p_jackpot_carried_in_minor,
    pool_match_5_minor         = p_pool_match_5_minor,
    pool_match_4_minor         = p_pool_match_4_minor,
    pool_match_3_minor         = p_pool_match_3_minor,
    jackpot_rolled_over_minor  = p_jackpot_rolled_over_minor,
    published_at               = now(),
    published_by               = auth.uid()
  where id = p_draw_id and status <> 'published';

  if not found then
    raise exception 'Draw not found or already published';
  end if;

  insert into public.draw_entries
    (draw_id, user_id, scores_snapshot, matched_count, tier, prize_minor)
  select
    p_draw_id,
    (e->>'user_id')::uuid,
    array(select jsonb_array_elements_text(e->'scores_snapshot'))::smallint[],
    (e->>'matched_count')::smallint,
    nullif(e->>'tier', '')::public.match_tier,
    (e->>'prize_minor')::bigint
  from jsonb_array_elements(p_entries) as e;
end;
$$;

-- Only callable by an authenticated admin (also re-checked inside the
-- function body, since grants alone don't enforce role).
revoke all on function public.publish_draw from public;
grant execute on function public.publish_draw to authenticated;
