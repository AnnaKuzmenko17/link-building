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
      cart_items: {
        Row: {
          client_id: string
          created_at: string
          id: string
          site_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          site_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          comment: string
          created_at: string
          created_by: string
          id: string
          order_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          created_by: string
          id?: string
          order_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_id: string
          id: string
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          category: Database["public"]["Enums"]["chat_category"]
          created_at: string
          created_by: string | null
          id: string
          status: Database["public"]["Enums"]["chat_status"]
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["chat_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["chat_status"]
          title?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["chat_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["chat_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          order_id: string
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          order_id: string
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          client_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          client_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          client_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          chat_id: string
          created_at: string
          id: string
          read_by: string[]
          sender_id: string
        }
        Insert: {
          body: string
          chat_id: string
          created_at?: string
          id?: string
          read_by?: string[]
          sender_id: string
        }
        Update: {
          body?: string
          chat_id?: string
          created_at?: string
          id?: string
          read_by?: string[]
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          chat_id: string | null
          client_id: string
          comment: string | null
          content: string | null
          copywriter_id: string | null
          created_at: string
          id: string
          order_number: number
          publish_month: string
          published_url: string | null
          site_id: string
          sourcer_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          chat_id?: string | null
          client_id: string
          comment?: string | null
          content?: string | null
          copywriter_id?: string | null
          created_at?: string
          id?: string
          order_number?: number
          publish_month: string
          published_url?: string | null
          site_id: string
          sourcer_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          chat_id?: string | null
          client_id?: string
          comment?: string | null
          content?: string | null
          copywriter_id?: string | null
          created_at?: string
          id?: string
          order_number?: number
          publish_month?: string
          published_url?: string | null
          site_id?: string
          sourcer_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_copywriter_id_fkey"
            columns: ["copywriter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sourcer_id_fkey"
            columns: ["sourcer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          contact_info: string | null
          countries: string[]
          created_at: string
          created_by: string | null
          description: string | null
          domain: string
          dr: number
          id: string
          keywords_relevance: string | null
          languages: string[]
          link_type: Database["public"]["Enums"]["link_type"]
          needs_changes_at: string | null
          needs_changes_by: string | null
          organic_keywords_count: number
          organic_traffic_count: number
          price: number
          requirements: string | null
          sourcer_notes: string | null
          status: Database["public"]["Enums"]["site_status"]
          top_countries: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          contact_info?: string | null
          countries?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain: string
          dr?: number
          id?: string
          keywords_relevance?: string | null
          languages?: string[]
          link_type?: Database["public"]["Enums"]["link_type"]
          needs_changes_at?: string | null
          needs_changes_by?: string | null
          organic_keywords_count?: number
          organic_traffic_count?: number
          price?: number
          requirements?: string | null
          sourcer_notes?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          top_countries?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          contact_info?: string | null
          countries?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          domain?: string
          dr?: number
          id?: string
          keywords_relevance?: string | null
          languages?: string[]
          link_type?: Database["public"]["Enums"]["link_type"]
          needs_changes_at?: string | null
          needs_changes_by?: string | null
          organic_keywords_count?: number
          organic_traffic_count?: number
          price?: number
          requirements?: string | null
          sourcer_notes?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          top_countries?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_needs_changes_by_fkey"
            columns: ["needs_changes_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          manager_id: string | null
          role: Database["public"]["Enums"]["role"]
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string
          id: string
          last_name?: string
          manager_id?: string | null
          role: Database["public"]["Enums"]["role"]
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          manager_id?: string | null
          role?: Database["public"]["Enums"]["role"]
          status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: [
          {
            foreignKeyName: "users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["role"]
      }
      is_chat_participant: { Args: { p_chat_id: string }; Returns: boolean }
      sourcer_can_access_invoice: {
        Args: { invoice_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      chat_category: "support" | "sales" | "general"
      chat_status: "active" | "archived"
      invoice_status: "draft" | "sent" | "paid"
      link_type: "dofollow" | "nofollow" | "sponsored" | "ugc"
      order_status:
        | "new"
        | "in_progress"
        | "content_sent"
        | "needs_changes"
        | "content_approved"
        | "published"
        | "completed"
        | "canceled"
      role: "client" | "manager" | "copywriter" | "sourcer" | "admin"
      site_status: "pending" | "active" | "archived" | "needs_changes"
      user_status: "pending" | "active" | "disabled"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      chat_category: ["support", "sales", "general"],
      chat_status: ["active", "archived"],
      invoice_status: ["draft", "sent", "paid"],
      link_type: ["dofollow", "nofollow", "sponsored", "ugc"],
      order_status: [
        "new",
        "in_progress",
        "content_sent",
        "needs_changes",
        "content_approved",
        "published",
        "completed",
        "canceled",
      ],
      role: ["client", "manager", "copywriter", "sourcer", "admin"],
      site_status: ["pending", "active", "archived", "needs_changes"],
      user_status: ["pending", "active", "disabled"],
    },
  },
} as const
