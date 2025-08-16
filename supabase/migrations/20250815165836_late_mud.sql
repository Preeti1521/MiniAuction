/*
  # Auction System Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `created_at` (timestamp)
    
    - `auctions`
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `starting_price` (decimal)
      - `bid_increment` (decimal)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `status` (enum: draft, active, ended, cancelled)
      - `created_at` (timestamp)
    
    - `bids`
      - `id` (uuid, primary key)
      - `auction_id` (uuid, references auctions)
      - `bidder_id` (uuid, references profiles)
      - `amount` (decimal)
      - `created_at` (timestamp)
    
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `auction_id` (uuid, references auctions)
      - `type` (enum: new_bid, outbid, auction_ended, bid_accepted, bid_rejected, counter_offer)
      - `message` (text)
      - `read` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Profiles are public readable, users can update their own
    - Auctions are publicly readable, users can create their own
    - Bids are publicly readable, users can create bids on active auctions
    - Notifications are private to the user
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now()
);

-- Create auction status enum
CREATE TYPE auction_status AS ENUM ('draft', 'active', 'ended', 'cancelled');

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  starting_price decimal(10,2) NOT NULL CHECK (starting_price > 0),
  bid_increment decimal(10,2) NOT NULL CHECK (bid_increment > 0),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL CHECK (end_time > start_time),
  status auction_status DEFAULT 'draft',
  highest_bid decimal(10,2) DEFAULT 0,
  highest_bidder_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES auctions(id) ON DELETE CASCADE NOT NULL,
  bidder_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now()
);

-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'new_bid', 'outbid', 'auction_ended', 'bid_accepted', 'bid_rejected', 'counter_offer'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  auction_id uuid REFERENCES auctions(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Auctions policies
CREATE POLICY "Auctions are publicly readable"
  ON auctions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create auctions"
  ON auctions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own auctions"
  ON auctions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Bids policies
CREATE POLICY "Bids are publicly readable"
  ON bids FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can place bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

-- Notifications policies
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update auction status based on time
CREATE OR REPLACE FUNCTION update_auction_status()
RETURNS void AS $$
BEGIN
  -- Update auctions to active if start time has passed
  UPDATE auctions 
  SET status = 'active' 
  WHERE status = 'draft' 
    AND start_time <= now();
  
  -- Update auctions to ended if end time has passed
  UPDATE auctions 
  SET status = 'ended' 
  WHERE status = 'active' 
    AND end_time <= now();
END;
$$ LANGUAGE plpgsql;

-- Function to handle new bid
CREATE OR REPLACE FUNCTION handle_new_bid()
RETURNS trigger AS $$
BEGIN
  -- Update auction's highest bid
  UPDATE auctions 
  SET 
    highest_bid = NEW.amount,
    highest_bidder_id = NEW.bidder_id
  WHERE id = NEW.auction_id;
  
  -- Notify previous highest bidder they've been outbid
  INSERT INTO notifications (user_id, auction_id, type, message)
  SELECT 
    auctions.highest_bidder_id,
    NEW.auction_id,
    'outbid',
    'You have been outbid on "' || auctions.title || '"'
  FROM auctions 
  WHERE auctions.id = NEW.auction_id 
    AND auctions.highest_bidder_id IS NOT NULL 
    AND auctions.highest_bidder_id != NEW.bidder_id;
  
  -- Notify all participants about new bid
  INSERT INTO notifications (user_id, auction_id, type, message)
  SELECT DISTINCT
    CASE 
      WHEN bids.bidder_id = NEW.bidder_id THEN auctions.seller_id
      ELSE bids.bidder_id
    END as user_id,
    NEW.auction_id,
    'new_bid',
    'New bid of $' || NEW.amount || ' placed on "' || auctions.title || '"'
  FROM bids
  JOIN auctions ON auctions.id = bids.auction_id
  WHERE bids.auction_id = NEW.auction_id
    AND CASE 
          WHEN bids.bidder_id = NEW.bidder_id THEN auctions.seller_id
          ELSE bids.bidder_id
        END != NEW.bidder_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new bids
DROP TRIGGER IF EXISTS on_bid_created ON bids;
CREATE TRIGGER on_bid_created
  AFTER INSERT ON bids
  FOR EACH ROW EXECUTE FUNCTION handle_new_bid();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS auctions_status_idx ON auctions(status);
CREATE INDEX IF NOT EXISTS auctions_start_time_idx ON auctions(start_time);
CREATE INDEX IF NOT EXISTS auctions_end_time_idx ON auctions(end_time);
CREATE INDEX IF NOT EXISTS bids_auction_id_idx ON bids(auction_id);
CREATE INDEX IF NOT EXISTS bids_created_at_idx ON bids(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);