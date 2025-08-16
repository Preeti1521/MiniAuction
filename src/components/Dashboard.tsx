import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Gavel, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Eye,
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import { supabase, Database } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

type Auction = Database['public']['Tables']['auctions']['Row'] & {
  profiles: { full_name: string | null; email: string } | null;
  bid_count?: number;
};

type DashboardStats = {
  totalAuctions: number;
  activeAuctions: number;
  totalBids: number;
  totalUsers: number;
  recentAuctions: Auction[];
  topAuctions: Auction[];
};

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAuctions: 0,
    activeAuctions: 0,
    totalBids: 0,
    totalUsers: 0,
    recentAuctions: [],
    topAuctions: []
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Update auction statuses first
      await supabase.rpc('update_auction_status');

      // Get total auctions
      const { count: totalAuctions } = await supabase
        .from('auctions')
        .select('*', { count: 'exact', head: true });

      // Get active auctions
      const { count: activeAuctions } = await supabase
        .from('auctions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total bids
      const { count: totalBids } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true });

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get recent auctions with bid counts
      const { data: recentAuctions } = await supabase
        .from('auctions')
        .select(`
          *,
          profiles!auctions_seller_id_fkey (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get top auctions by bid amount
      const { data: topAuctions } = await supabase
        .from('auctions')
        .select(`
          *,
          profiles!auctions_seller_id_fkey (full_name, email)
        `)
        .order('highest_bid', { ascending: false })
        .limit(5);

      // Get bid counts for each auction
      const auctionIds = [...(recentAuctions || []), ...(topAuctions || [])].map(a => a.id);
      const { data: bidCounts } = await supabase
        .from('bids')
        .select('auction_id')
        .in('auction_id', auctionIds);

      const bidCountMap = bidCounts?.reduce((acc, bid) => {
        acc[bid.auction_id] = (acc[bid.auction_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const enrichedRecentAuctions = recentAuctions?.map(auction => ({
        ...auction,
        bid_count: bidCountMap[auction.id] || 0
      })) || [];

      const enrichedTopAuctions = topAuctions?.map(auction => ({
        ...auction,
        bid_count: bidCountMap[auction.id] || 0
      })) || [];

      setStats({
        totalAuctions: totalAuctions || 0,
        activeAuctions: activeAuctions || 0,
        totalBids: totalBids || 0,
        totalUsers: totalUsers || 0,
        recentAuctions: enrichedRecentAuctions,
        topAuctions: enrichedTopAuctions
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Monitor and manage all auction activities' : 'Track your auction activities and performance'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Auctions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAuctions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gavel className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Auctions</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeAuctions}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bids</p>
                <p className="text-3xl font-bold text-amber-600">{stats.totalBids}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Auctions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Auctions</h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {stats.recentAuctions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No auctions found
                </div>
              ) : (
                stats.recentAuctions.map((auction) => (
                  <div key={auction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{auction.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">
                          by {auction.profiles?.full_name || auction.profiles?.email}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          auction.status === 'active' ? 'bg-green-100 text-green-800' :
                          auction.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {auction.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600">
                        ${(auction.highest_bid > 0 ? auction.highest_bid : auction.starting_price).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {auction.bid_count || 0} bids
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Auctions by Value */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Auctions by Value</h2>
              <Award className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {stats.topAuctions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No auctions found
                </div>
              ) : (
                stats.topAuctions.map((auction, index) => (
                  <div key={auction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">{auction.title}</h3>
                        <div className="text-sm text-gray-500">
                          {auction.bid_count || 0} bids
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${(auction.highest_bid > 0 ? auction.highest_bid : auction.starting_price).toFixed(2)}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        auction.status === 'active' ? 'bg-green-100 text-green-800' :
                        auction.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {auction.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Controls</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-blue-900">Manage Users</div>
                </button>
                
                <button className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                  <Gavel className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-green-900">Manage Auctions</div>
                </button>
                
                <button className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
                  <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-purple-900">Analytics</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}