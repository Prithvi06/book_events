export type SlotCategory = 'Cat 1' | 'Cat 2' | 'Cat 3';

export interface TimeSlot {
  id: number;
  category: SlotCategory;
  start_time: string; // ISO 8601 UTC
  end_time: string; // ISO 8601 UTC
  booked_by_user_id: number | null;
  booked_by_name: string | null;
}

