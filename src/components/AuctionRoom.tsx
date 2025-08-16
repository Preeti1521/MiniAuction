import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Clock, DollarSign, TrendingUp, AlertCircle, Gavel } from 'lucide-react';
import { supabase, Database } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { CountdownTimer } from './CountdownTimer';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format, isBefore, isAfter } from 'date-fns';

type Auction = Database['public']['Tables']['auctions']['Row'] & {
  profiles: { full_name: string | null; email: string } | null;
};

type Bid = Database['public']['Tables']['bids']['Row'] & {
  profiles: { full_name: string | null; email: string } | null;
};

interface AuctionRoomProps {
  auctionId: string;
  onBack: () => void;
}

export function AuctionRoom({ auctionId, onBack }: AuctionRoomProps) {
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAuction();
    loadBids();
    
    // Subscribe to real-time updates
    const auctionSubscription = supabase
      .channel('auction_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          setAuction(prev => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    const bidsSubscription = supabase
      .channel('bid_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          loadBids(); // Reload bids to get profile info
        }
      )
      .subscribe();

    return () => {
      auctionSubscription.unsubscribe();
      bidsSubscription.unsubscribe();
    };
  }, [auctionId]);

  const loadAuction = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          profiles!auctions_seller_id_fkey (full_name, email)
        `)
        .eq('id', auctionId)
        .single();

      if (error) throw error;
      setAuction(data);
    } catch (error: any) {
      toast.error('Failed to load auction');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadBids = async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          profiles!bids_bidder_id_fkey (full_name, email)
        `)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error: any) {
      console.error('Failed to load bids:', error);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auction) return;

    const amount = parseFloat(bidAmount);
    const minimumBid = auction.highest_bid > 0 
      ? auction.highest_bid + auction.bid_increment 
      : auction.starting_price;

    if (amount < minimumBid) {
      toast.error(`Minimum bid is $${minimumBid.toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('bids').insert({
        auction_id: auctionId,
        bidder_id: user.id,
        amount,
      });

      if (error) throw error;

      toast.success('Bid placed successfully!');
      setBidAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const now = new Date();
  const startTime = new Date(auction.start_time);
  const endTime = new Date(auction.end_time);
  
  const isUpcoming = isBefore(now, startTime);
  const isActive = isAfter(now, startTime) && isBefore(now, endTime);
  const isEnded = isAfter(now, endTime) || auction.status === 'ended';

  const currentPrice = auction.highest_bid > 0 ? auction.highest_bid : auction.starting_price;
  const nextMinBid = isActive ? (auction.highest_bid > 0 ? auction.highest_bid + auction.bid_increment : auction.starting_price) : 0;

  const canBid = user && isActive && user.id !== auction.seller_id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Auctions
            </button>

            {isActive && (
              <CountdownTimer
                targetDate={endTime}
                onComplete={() => {
                  setAuction(prev => prev ? { ...prev, status: 'ended' } : null);
                  toast.success('Auction has ended!');
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auction Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.title}</h1>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="w-4 h-4 mr-1" />
                    Sold by: {auction.profiles?.full_name || auction.profiles?.email}
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isUpcoming ? 'bg-blue-100 text-blue-800' :
                  isActive ? 'bg-green-100 text-green-800 animate-pulse' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {isUpcoming ? 'Upcoming' : isActive ? 'Live' : 'Ended'}
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">{auction.description}</p>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Auction Start</div>
                  <div className="font-medium">{format(startTime, 'MMM d, yyyy h:mm a')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Auction End</div>
                  <div className="font-medium">{format(endTime, 'MMM d, yyyy h:mm a')}</div>
                </div>
              </div>
            </div>

            {/* Bidding History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bidding History</h2>
              
              {bids.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No bids placed yet. Be the first to bid!
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {bids.map((bid, index) => (
                      <motion.div
                        key={bid.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          index === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {bid.profiles?.full_name || bid.profiles?.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`text-lg font-bold ${
                          index === 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          ${bid.amount.toFixed(2)}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Price */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-2">
                  {auction.highest_bid > 0 ? 'Current Bid' : 'Starting Price'}
                </div>
                <div className="text-4xl font-bold text-amber-600 mb-4">
                  ${currentPrice.toFixed(2)}
                </div>
                
                {isActive && (
                  <div className="text-sm text-gray-600 mb-4">
                    Next minimum bid: <span className="font-medium">${nextMinBid.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {bids.length} bids
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${auction.bid_increment} increment
                  </div>
                </div>
              </div>
            </div>

            {/* Bidding Form */}
            {canBid ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Place Your Bid</h3>
                
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bid Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min={nextMinBid}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder={nextMinBid.toFixed(2)}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Minimum bid: ${nextMinBid.toFixed(2)}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Gavel className="w-5 h-5" />
                    <span>{submitting ? 'Placing Bid...' : 'Place Bid'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  {!user ? (
                    <p>Sign in to place bids</p>
                  ) : !isActive ? (
                    <p>
                      {isUpcoming ? 'Auction hasn\'t started yet' : 'Auction has ended'}
                    </p>
                  ) : (
                    <p>You cannot bid on your own auction</p>
                  )}
                </div>
              </div>
            )}

            {/* Auction Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Auction Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Starting Price</span>
                  <span className="font-medium">${auction.starting_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bid Increment</span>
                  <span className="font-medium">${auction.bid_increment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bids</span>
                  <span className="font-medium">{bids.length}</span>
                </div>
                {auction.highest_bidder_id && (
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-600">Leading Bidder</span>
                    <span className="font-medium text-green-600">
                      {bids[0]?.profiles?.full_name || bids[0]?.profiles?.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}