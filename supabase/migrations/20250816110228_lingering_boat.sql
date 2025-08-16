/*
  # Fix Bid Validation and Add Missing Functions

  1. Functions
    - Create `update_auction_status()` function to update auction statuses based on time
    - Update `handle_new_bid()` function to properly validate bids and update auction records

  2. Fixes
    - Fix bid validation logic to allow starting price as first bid
    - Ensure proper auction status updates
    - Add better error handling for bid placement
*/

-- Create or replace the update_auction_status function
CREATE OR REPLACE FUNCTION update_auction_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update auctions that should be active
  UPDATE auctions 
  SET status = 'active'
  WHERE status = 'draft' 
    AND start_time <= now() 
    AND end_time > now();
    
  -- Update auctions that should be ended
  UPDATE auctions 
  SET status = 'ended'
  WHERE status IN ('draft', 'active') 
    AND end_time <= now();
END;
$$;

-- Create or replace the handle_new_bid function with proper validation
CREATE OR REPLACE FUNCTION handle_new_bid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auction_record auctions%ROWTYPE;
  current_highest_bid NUMERIC(10,2);
  minimum_bid NUMERIC(10,2);
BEGIN
  -- Get the auction record
  SELECT * INTO auction_record FROM auctions WHERE id = NEW.auction_id;
  
  -- Check if auction exists and is active
  IF auction_record IS NULL THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;
  
  IF auction_record.status != 'active' THEN
    RAISE EXCEPTION 'Auction is not active';
  END IF;
  
  -- Check if auction has ended
  IF auction_record.end_time <= now() THEN
    RAISE EXCEPTION 'Auction has ended';
  END IF;
  
  -- Prevent seller from bidding on their own auction
  IF auction_record.seller_id = NEW.bidder_id THEN
    RAISE EXCEPTION 'Sellers cannot bid on their own auctions';
  END IF;
  
  -- Calculate minimum bid
  current_highest_bid := COALESCE(auction_record.highest_bid, 0);
  
  IF current_highest_bid = 0 THEN
    -- First bid must be at least the starting price
    minimum_bid := auction_record.starting_price;
  ELSE
    -- Subsequent bids must be at least current highest + increment
    minimum_bid := current_highest_bid + auction_record.bid_increment;
  END IF;
  
  -- Validate bid amount
  IF NEW.amount < minimum_bid THEN
    RAISE EXCEPTION 'Bid amount must be at least %', minimum_bid;
  END IF;
  
  -- Update auction with new highest bid
  UPDATE auctions 
  SET 
    highest_bid = NEW.amount,
    highest_bidder_id = NEW.bidder_id
  WHERE id = NEW.auction_id;
  
  -- Create notification for the seller
  INSERT INTO notifications (user_id, auction_id, type, message)
  VALUES (
    auction_record.seller_id,
    NEW.auction_id,
    'new_bid',
    'New bid of $' || NEW.amount || ' placed on your auction "' || auction_record.title || '"'
  );
  
  -- Create notification for previous highest bidder (if exists and different)
  IF auction_record.highest_bidder_id IS NOT NULL 
     AND auction_record.highest_bidder_id != NEW.bidder_id THEN
    INSERT INTO notifications (user_id, auction_id, type, message)
    VALUES (
      auction_record.highest_bidder_id,
      NEW.auction_id,
      'outbid',
      'You have been outbid on "' || auction_record.title || '". New highest bid: $' || NEW.amount
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_auction_status() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_bid() TO authenticated;