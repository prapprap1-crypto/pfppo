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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      export_history: {
        Row: {
          exported_at: string
          exported_pos: string[]
          file_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          exported_at?: string
          exported_pos: string[]
          file_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          exported_at?: string
          exported_pos?: string[]
          file_name?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      po_headers: {
        Row: {
          branch: string
          created_at: string
          document_date: string
          due_date: string
          grand_total: number | null
          id: string
          net_total: number | null
          po_number: string
          source_file: string | null
          status: string
          supplier_code: string
          supplier_name: string
          updated_at: string
          user_id: string | null
          vat: number | null
        }
        Insert: {
          branch: string
          created_at?: string
          document_date: string
          due_date: string
          grand_total?: number | null
          id?: string
          net_total?: number | null
          po_number: string
          source_file?: string | null
          status?: string
          supplier_code: string
          supplier_name: string
          updated_at?: string
          user_id?: string | null
          vat?: number | null
        }
        Update: {
          branch?: string
          created_at?: string
          document_date?: string
          due_date?: string
          grand_total?: number | null
          id?: string
          net_total?: number | null
          po_number?: string
          source_file?: string | null
          status?: string
          supplier_code?: string
          supplier_name?: string
          updated_at?: string
          user_id?: string | null
          vat?: number | null
        }
        Relationships: []
      }
      po_items: {
        Row: {
          amount: number
          created_at: string
          customer_description: string | null
          customer_product_code: string
          delivery_date: string | null
          id: string
          is_mapped: boolean | null
          po_id: string
          quantity: number
          unit: string | null
          unit_price: number
          vendor_description: string | null
          vendor_product_code: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_description?: string | null
          customer_product_code: string
          delivery_date?: string | null
          id?: string
          is_mapped?: boolean | null
          po_id: string
          quantity?: number
          unit?: string | null
          unit_price?: number
          vendor_description?: string | null
          vendor_product_code?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_description?: string | null
          customer_product_code?: string
          delivery_date?: string | null
          id?: string
          is_mapped?: boolean | null
          po_id?: string
          quantity?: number
          unit?: string | null
          unit_price?: number
          vendor_description?: string | null
          vendor_product_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "po_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_mappings: {
        Row: {
          active: boolean | null
          created_at: string
          customer_code: string
          customer_desc: string
          id: string
          unit: string | null
          updated_at: string
          vendor_code: string
          vendor_desc: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          customer_code: string
          customer_desc: string
          id?: string
          unit?: string | null
          updated_at?: string
          vendor_code: string
          vendor_desc: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          customer_code?: string
          customer_desc?: string
          id?: string
          unit?: string | null
          updated_at?: string
          vendor_code?: string
          vendor_desc?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
