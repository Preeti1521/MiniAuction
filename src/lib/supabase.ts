import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      auctions: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          starting_price: number;
          bid_increment: number;
          start_time: string;
          end_time: string;
          status: 'draft' | 'active' | 'ended' | 'cancelled';
          highest_bid: number;
          highest_bidder_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description: string;
          starting_price: number;
          bid_increment: number;
          start_time: string;
          end_time: string;
          status?: 'draft' | 'active' | 'ended' | 'cancelled';
          highest_bid?: number;
          highest_bidder_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          title?: string;
          description?: string;
          starting_price?: number;
          bid_increment?: number;
          start_time?: string;
          end_time?: string;
          status?: 'draft' | 'active' | 'ended' | 'cancelled';
          highest_bid?: number;
          highest_bidder_id?: string | null;
          created_at?: string;
        };
      };
      bids: {
        Row: {
          id: string;
          auction_id: string;
          bidder_id: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          auction_id: string;
          bidder_id: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          auction_id?: string;
          bidder_id?: string;
          amount?: number;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          auction_id: string | null;
          type: 'new_bid' | 'outbid' | 'auction_ended' | 'bid_accepted' | 'bid_rejected' | 'counter_offer';
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          auction_id?: string | null;
          type: 'new_bid' | 'outbid' | 'auction_ended' | 'bid_accepted' | 'bid_rejected' | 'counter_offer';
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          auction_id?: string | null;
          type?: 'new_bid' | 'outbid' | 'auction_ended' | 'bid_accepted' | 'bid_rejected' | 'counter_offer';
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
    };
  };
};