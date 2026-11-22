// Tipos de la base escritos a mano según supabase/migrations/.
// Se pueden regenerar con: npx supabase gen types typescript --project-id <id>

export type BookingRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  service: string;
  date: string;
  time: string;
  duration_min: number;
  status: string;
  created_at: string;
  google_event_id: string | null;
};

export type GoogleCalendarConnectionRow = {
  id: number;
  email: string;
  refresh_token_enc: string;
  calendar_id: string;
  sync_events: boolean;
  respect_busy: boolean;
  connected_at: string;
  connected_by: string | null;
  last_error: string | null;
  last_error_at: string | null;
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AvailabilityRow = {
  id: number;
  week: Json;
  overrides: Json;
  updated_at: string;
  updated_by: string | null;
};

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: BookingRow;
        Insert: Omit<BookingRow, "id" | "notes" | "status" | "created_at" | "google_event_id"> &
          Partial<Pick<BookingRow, "id" | "notes" | "status" | "created_at" | "google_event_id">>;
        Update: Partial<BookingRow>;
        Relationships: [];
      };
      google_calendar_connection: {
        Row: GoogleCalendarConnectionRow;
        Insert: Partial<GoogleCalendarConnectionRow> & Pick<GoogleCalendarConnectionRow, "email" | "refresh_token_enc">;
        Update: Partial<GoogleCalendarConnectionRow>;
        Relationships: [];
      };
      availability: {
        Row: AvailabilityRow;
        Insert: Partial<AvailabilityRow> & Pick<AvailabilityRow, "week">;
        Update: Partial<Omit<AvailabilityRow, "id">>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_booked_slots: {
        Args: { p_date: string };
        Returns: { date: string; time: string; duration_min: number }[];
      };
      get_availability: { Args: Record<string, never>; Returns: Json };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      consume_login_attempt: { Args: { p_key: string; p_max: number; p_window_seconds: number }; Returns: number };
      consume_rate_limit: { Args: { p_key: string; p_max: number; p_window_seconds: number }; Returns: number };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
