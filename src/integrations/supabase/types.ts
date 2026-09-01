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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_branch_mappings: {
        Row: {
          active: boolean | null
          branch: string
          created_at: string
          customer_mapping_id: string
          id: string
          transport_code_id: string | null
          updated_at: string
          vehicle_position_id: string | null
          vendor_branch_code: string | null
          vendor_branch_name: string | null
          warehouse_id: string | null
        }
        Insert: {
          active?: boolean | null
          branch: string
          created_at?: string
          customer_mapping_id: string
          id?: string
          transport_code_id?: string | null
          updated_at?: string
          vehicle_position_id?: string | null
          vendor_branch_code?: string | null
          vendor_branch_name?: string | null
          warehouse_id?: string | null
        }
        Update: {
          active?: boolean | null
          branch?: string
          created_at?: string
          customer_mapping_id?: string
          id?: string
          transport_code_id?: string | null
          updated_at?: string
          vehicle_position_id?: string | null
          vendor_branch_code?: string | null
          vendor_branch_name?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_branch_mappings_customer_mapping_id_fkey"
            columns: ["customer_mapping_id"]
            isOneToOne: false
            referencedRelation: "customer_mappings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_branch_mappings_transport_code_id_fkey"
            columns: ["transport_code_id"]
            isOneToOne: false
            referencedRelation: "transport_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_branch_mappings_vehicle_position_id_fkey"
            columns: ["vehicle_position_id"]
            isOneToOne: false
            referencedRelation: "vehicle_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_branch_mappings_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_mappings: {
        Row: {
          active: boolean | null
          created_at: string
          customer_name: string
          id: string
          salesperson_id: string | null
          updated_at: string
          vat_type: number | null
          vendor_customer_code: string
          vendor_customer_name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          customer_name: string
          id?: string
          salesperson_id?: string | null
          updated_at?: string
          vat_type?: number | null
          vendor_customer_code: string
          vendor_customer_name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          customer_name?: string
          id?: string
          salesperson_id?: string | null
          updated_at?: string
          vat_type?: number | null
          vendor_customer_code?: string
          vendor_customer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_mappings_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespersons"
            referencedColumns: ["id"]
          },
        ]
      }
      email_import_settings: {
        Row: {
          created_at: string
          folder: string
          id: string
          is_enabled: boolean
          last_synced_at: string | null
          sender_filter: string | null
          subject_filter: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          folder?: string
          id?: string
          is_enabled?: boolean
          last_synced_at?: string | null
          sender_filter?: string | null
          subject_filter?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          folder?: string
          id?: string
          is_enabled?: boolean
          last_synced_at?: string | null
          sender_filter?: string | null
          subject_filter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_imports: {
        Row: {
          attachment_id: string
          created_at: string
          error_message: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          message_id: string
          po_id: string | null
          processed_at: string | null
          received_at: string | null
          sender_email: string | null
          sender_name: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          attachment_id: string
          created_at?: string
          error_message?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          message_id: string
          po_id?: string | null
          processed_at?: string | null
          received_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          attachment_id?: string
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          message_id?: string
          po_id?: string | null
          processed_at?: string | null
          received_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_imports_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "po_headers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      export_templates: {
        Row: {
          columns: Json
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          columns: Json
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          columns?: Json
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      po_action_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          po_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          po_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          po_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      po_edit_history: {
        Row: {
          created_at: string
          edited_by: string | null
          field_name: string
          id: string
          new_value: string
          old_value: string
          po_id: string
        }
        Insert: {
          created_at?: string
          edited_by?: string | null
          field_name: string
          id?: string
          new_value: string
          old_value: string
          po_id: string
        }
        Update: {
          created_at?: string
          edited_by?: string | null
          field_name?: string
          id?: string
          new_value?: string
          old_value?: string
          po_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_edit_history_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "po_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      po_headers: {
        Row: {
          branch: string
          created_at: string
          customer_name: string | null
          document_date: string
          due_date: string
          grand_total: number | null
          id: string
          is_customer_mapped: boolean | null
          net_total: number | null
          po_number: string
          remark: string | null
          source_file: string | null
          status: string
          supplier_code: string
          supplier_name: string
          updated_at: string
          user_id: string | null
          vat: number | null
          vendor_branch_code: string | null
          vendor_branch_name: string | null
          vendor_customer_code: string | null
          vendor_customer_name: string | null
        }
        Insert: {
          branch: string
          created_at?: string
          customer_name?: string | null
          document_date: string
          due_date: string
          grand_total?: number | null
          id?: string
          is_customer_mapped?: boolean | null
          net_total?: number | null
          po_number: string
          remark?: string | null
          source_file?: string | null
          status?: string
          supplier_code: string
          supplier_name: string
          updated_at?: string
          user_id?: string | null
          vat?: number | null
          vendor_branch_code?: string | null
          vendor_branch_name?: string | null
          vendor_customer_code?: string | null
          vendor_customer_name?: string | null
        }
        Update: {
          branch?: string
          created_at?: string
          customer_name?: string | null
          document_date?: string
          due_date?: string
          grand_total?: number | null
          id?: string
          is_customer_mapped?: boolean | null
          net_total?: number | null
          po_number?: string
          remark?: string | null
          source_file?: string | null
          status?: string
          supplier_code?: string
          supplier_name?: string
          updated_at?: string
          user_id?: string | null
          vat?: number | null
          vendor_branch_code?: string | null
          vendor_branch_name?: string | null
          vendor_customer_code?: string | null
          vendor_customer_name?: string | null
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
          unit_price: number | null
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
          unit_price?: number | null
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
          unit_price?: number | null
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
      salespersons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      transport_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_positions: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user: {
        Args: { _approved_by: string; _user_id: string }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
