export type Status = "confirmed" | "cancelled" | "attended" | "no_show";

export type Restaurant = {
  id: string;
  name: string;
  district: string;
  approved: boolean;
  address: string | null;
  phone: string | null;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  category: string;
  hours: string | null;
  instagram: string | null;
  menu_url: string | null;
};

export type Slot = {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
  discount_far?: number | null;
  discount_mid?: number | null;
  capacity: number;
};

export type Reservation = {
  id: string;
  code: string;
  slot_id: string;
  party_size: number;
  discount_percent?: number | null;
  reservation_name: string;
  phone: string;
  status: Status;
};

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
};
