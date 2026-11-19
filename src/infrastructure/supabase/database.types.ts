// Tipos de la base escritos a mano según supabase/migrations/0001_bookings.sql.
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
};

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: BookingRow;
        Insert: Omit<BookingRow, "id" | "notes" | "status" | "created_at"> &
          Partial<Pick<BookingRow, "id" | "notes" | "status" | "created_at">>;
        Update: Partial<BookingRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_booked_slots: {
        Args: { p_date: string };
        Returns: { date: string; time: string; duration_min: number }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
