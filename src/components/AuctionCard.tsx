import React from 'react';
import { Clock, DollarSign, User, Calendar } from 'lucide-react';
import { format, formatDistanceToNow, isBefore, isAfter } from 'date-fns';
import { Database } from '../lib/supabase';

type Auction = Database['public']['Tables']['auctions']['Row'] & {
  profiles: { full_name: string | null; email: string } | null;
};

interface AuctionCardProps {
  auction: Auction;
  onClick: () => void;
}

export function AuctionCard({ auction, onClick }: AuctionCardProps) {
  const now = new Date();
  const startTime = new Date(auction.start_time);
  const endTime = new Date(auction.end_time);
  
  const isUpcoming = isBefore(now, startTime);
  const isActive = isAfter(now, startTime) && isBefore(now, endTime);
  const isEnded = isAfter(now, endTime) || auction.status === 'ended';

  const getStatusColor = () => {
    if (isUpcoming) return 'bg-blue-100 text-blue-800';
    if (isActive) return 'bg-green-100 text-green-800';
    if (isEnded) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (isUpcoming) return 'Upcoming';
    if (isActive) return 'Live';
    if (isEnded) return 'Ended';
    return 'Draft';
  };

  const getTimeText = () => {
    if (isUpcoming) return `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`;
    if (isActive) return `Ends ${formatDistanceToNow(endTime, { addSuffix: true })}`;
    if (isEnded) return `Ended ${formatDistanceToNow(endTime, { addSuffix: true })}`;
    return '';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      <div className="aspect-video bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-amber-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-amber-800">
            ${auction.highest_bid > 0 ? auction.highest_bid : auction.starting_price}
          </div>
          <div className="text-sm text-amber-600">
            {auction.highest_bid > 0 ? 'Current Bid' : 'Starting Price'}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {isActive && (
            <div className="flex items-center text-red-600 text-sm font-medium">
              <Clock className="w-4 h-4 mr-1" />
              Live
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
          {auction.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {auction.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <User className="w-4 h-4 mr-2" />
            Seller: {auction.profiles?.full_name || auction.profiles?.email || 'Anonymous'}
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            {getTimeText()}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Increment: ${auction.bid_increment}
            </span>
            {auction.highest_bid > 0 && (
              <span className="text-green-600 font-medium">
                {/* Calculate number of bids based on increment */}
                {Math.floor((auction.highest_bid - auction.starting_price) / auction.bid_increment) + 1} bids
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}