export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      charities: {
        Row: {
          id: string
          name: string
          slug: string
          tagline: string | null
          description: string | null
          image_path: string | null
          website_url: string | null
          is_featured: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          tagline?: string | null
          description?: string | null
          image_path?: string | null
          website_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          tagline?: string | null
          description?: string | null
          image_path?: string | null
          website_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      charity_contributions: {
        Row: {
          amount_minor: number
          charity_id: string
          created_at: string
          currency: string
          id: string
          source: Database["public"]["Enums"]["contribution_source"]
          stripe_reference: string | null
          user_id: string | null
        }
        Insert: {
          amount_minor: number
          charity_id: string
          created_at?: string
          currency?: string
          id?: string
          source: Database["public"]["Enums"]["contribution_source"]
          stripe_reference?: string | null
          user_id?: string | null
        }
        Update: {
          amount_minor?: number
          charity_id?: string
          created_at?: string
          currency?: string
          id?: string
          source?: Database["public"]["Enums"]["contribution_source"]
          stripe_reference?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "charity_contributions_charity_id_fkey"
            columns: ["charity_id"]
            isOneToOne: false
            referencedRelation: "charities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charity_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      charity_events: {
        Row: {
          charity_id: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          charity_id: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          charity_id?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "charity_events_charity_id_fkey"
            columns: ["charity_id"]
            isOneToOne: false
            referencedRelation: "charities"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_entries: {
        Row: {
          created_at: string
          draw_id: string
          id: string
          matched_count: number
          prize_minor: number
          scores_snapshot: number[]
          tier: Database["public"]["Enums"]["match_tier"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          draw_id: string
          id?: string
          matched_count?: number
          prize_minor?: number
          scores_snapshot: number[]
          tier?: Database["public"]["Enums"]["match_tier"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          draw_id?: string
          id?: string
          matched_count?: number
          prize_minor?: number
          scores_snapshot?: number[]
          tier?: Database["public"]["Enums"]["match_tier"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draw_entries_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      draw_simulations: {
        Row: {
          created_at: string
          created_by: string | null
          draw_id: string
          draw_type: Database["public"]["Enums"]["draw_type"]
          id: string
          result: Json
          winning_numbers: number[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          draw_id: string
          draw_type: Database["public"]["Enums"]["draw_type"]
          id?: string
          result: Json
          winning_numbers: number[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          draw_id?: string
          draw_type?: Database["public"]["Enums"]["draw_type"]
          id?: string
          result?: Json
          winning_numbers?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "draw_simulations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draw_simulations_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "draws"
            referencedColumns: ["id"]
          },
        ]
      }
      draws: {
        Row: {
          active_subscriber_count: number | null
          created_at: string
          draw_type: Database["public"]["Enums"]["draw_type"]
          id: string
          jackpot_carried_in_minor: number
          jackpot_rolled_over_minor: number
          period: string
          pool_match_3_minor: number
          pool_match_4_minor: number
          pool_match_5_minor: number
          pool_total_minor: number
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["draw_status"]
          updated_at: string
          winning_numbers: number[] | null
        }
        Insert: {
          active_subscriber_count?: number | null
          created_at?: string
          draw_type?: Database["public"]["Enums"]["draw_type"]
          id?: string
          jackpot_carried_in_minor?: number
          jackpot_rolled_over_minor?: number
          period: string
          pool_match_3_minor?: number
          pool_match_4_minor?: number
          pool_match_5_minor?: number
          pool_total_minor?: number
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["draw_status"]
          updated_at?: string
          winning_numbers?: number[] | null
        }
        Update: {
          active_subscriber_count?: number | null
          created_at?: string
          draw_type?: Database["public"]["Enums"]["draw_type"]
          id?: string
          jackpot_carried_in_minor?: number
          jackpot_rolled_over_minor?: number
          period?: string
          pool_match_3_minor?: number
          pool_match_4_minor?: number
          pool_match_5_minor?: number
          pool_total_minor?: number
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["draw_status"]
          updated_at?: string
          winning_numbers?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "draws_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: boolean
          min_charity_percent: number
          prize_pool_percent: number
          share_match_3: number
          share_match_4: number
          share_match_5: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          min_charity_percent?: number
          prize_pool_percent?: number
          share_match_3?: number
          share_match_4?: number
          share_match_5?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          min_charity_percent?: number
          prize_pool_percent?: number
          share_match_3?: number
          share_match_4?: number
          share_match_5?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          charity_id: string | null
          charity_percent: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          charity_id?: string | null
          charity_percent?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          charity_id?: string | null
          charity_percent?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_charity_id_fkey"
            columns: ["charity_id"]
            isOneToOne: false
            referencedRelation: "charities"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          created_at: string
          id: string
          score_date: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          score_date: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          score_date?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_minor: number
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_interval: Database["public"]["Enums"]["plan_interval"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_minor: number
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_interval: Database["public"]["Enums"]["plan_interval"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_minor?: number
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_interval?: Database["public"]["Enums"]["plan_interval"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      winner_verifications: {
        Row: {
          created_at: string
          draw_entry_id: string
          id: string
          paid_at: string | null
          payout_status: Database["public"]["Enums"]["payout_status"]
          proof_path: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draw_entry_id: string
          id?: string
          paid_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"]
          proof_path: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          draw_entry_id?: string
          id?: string
          paid_at?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"]
          proof_path?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winner_verifications_draw_entry_id_fkey"
            columns: ["draw_entry_id"]
            isOneToOne: true
            referencedRelation: "draw_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winner_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winner_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json }
      charity_impact_total: { Args: never; Returns: number }
      has_active_subscription: { Args: { p_user?: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      publish_draw: {
        Args: {
          p_active_subscriber_count: number
          p_draw_id: string
          p_entries: Json
          p_jackpot_carried_in_minor: number
          p_jackpot_rolled_over_minor: number
          p_pool_match_3_minor: number
          p_pool_match_4_minor: number
          p_pool_match_5_minor: number
          p_pool_total_minor: number
          p_winning_numbers: number[]
        }
        Returns: undefined
      }
    }
    Enums: {
      contribution_source: "subscription" | "donation"
      draw_status: "draft" | "simulated" | "published"
      draw_type: "random" | "algorithmic"
      match_tier: "match_5" | "match_4" | "match_3"
      payout_status: "pending" | "paid"
      plan_interval: "month" | "year"
      subscription_status:
        | "incomplete"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "lapsed"
      user_role: "subscriber" | "admin"
      verification_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contribution_source: ["subscription", "donation"],
      draw_status: ["draft", "simulated", "published"],
      draw_type: ["random", "algorithmic"],
      match_tier: ["match_5", "match_4", "match_3"],
      payout_status: ["pending", "paid"],
      plan_interval: ["month", "year"],
      subscription_status: [
        "incomplete",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "lapsed",
      ],
      user_role: ["subscriber", "admin"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
