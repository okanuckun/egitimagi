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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          class_id: string | null
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          author_id: string
          class_id?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          class_id?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          note: string | null
          status: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          status?: string
          student_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          status?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          author_id: string
          class_id: string | null
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          title: string
        }
        Insert: {
          author_id: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          subject: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          subject: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          subject?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_grades: {
        Row: {
          created_at: string
          grade: Database["public"]["Enums"]["homework_grade"]
          graded_at: string | null
          homework_id: string
          id: string
          note: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          grade?: Database["public"]["Enums"]["homework_grade"]
          graded_at?: string | null
          homework_id: string
          id?: string
          note?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          grade?: Database["public"]["Enums"]["homework_grade"]
          graded_at?: string | null
          homework_id?: string
          id?: string
          note?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_grades_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          class_id: string
          ended_at: string | null
          id: string
          room_name: string
          started_at: string
          status: string
          teacher_id: string
          title: string
        }
        Insert: {
          class_id: string
          ended_at?: string | null
          id?: string
          room_name: string
          started_at?: string
          status?: string
          teacher_id: string
          title?: string
        }
        Update: {
          class_id?: string
          ended_at?: string | null
          id?: string
          room_name?: string
          started_at?: string
          status?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answers: Json
          completed_at: string | null
          id: string
          quiz_id: string
          score: number | null
          student_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          id?: string
          quiz_id: string
          score?: number | null
          student_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          id: string
          options: Json
          points: number
          question: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_answer?: number
          id?: string
          options?: Json
          points?: number
          question: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_answer?: number
          id?: string
          options?: Json
          points?: number
          question?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          subject: string
          teacher_id: string
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          subject: string
          teacher_id: string
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          subject?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          full_name: string
          id: string
          parent_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          full_name: string
          id?: string
          parent_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          full_name?: string
          id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_all_roles: {
        Args: never
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      admin_update_user_role: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
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
      is_parent_in_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_parent_of_homework_student: {
        Args: { _homework_id: string; _student_id: string; _user_id: string }
        Returns: boolean
      }
      is_teacher_of_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_teacher_of_homework: {
        Args: { _homework_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent"
      homework_grade: "not_done" | "done" | "well_done"
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
      app_role: ["admin", "teacher", "parent"],
      homework_grade: ["not_done", "done", "well_done"],
    },
  },
} as const
