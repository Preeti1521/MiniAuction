import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AuctionCard } from './components/AuctionCard';
import { CreateAuctionModal } from './components/CreateAuctionModal';
import { AuctionRoom } from './components/AuctionRoom';
import { useAuth } from './hooks/useAuth';
import { supabase, Database } from './lib/supabase';
import { Search, Filter, TrendingUp } from 'lucide-react';

type Auction = Database['public']['Tables']['auctions']['Row'] & {
  profiles: { full_name: string | null; email: string } | null;
};

function App() {
  const { loading: authLoading } = useAuth();
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'auctions' | 'dashboard'>('landing');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && user) {
      loadAuctions();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user && currentView === 'landing') {
      setCurrentView('auctions');
    } else if (!user && currentView !== 'landing') {
      setCurrentView('landing');
    }
  }, [user, currentView]);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      
      // Update auction statuses first
      await supabase.rpc('update_auction_status');
      
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          profiles!auctions_seller_id_fkey (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);
    
    const isUpcoming = now < startTime;
    const isActive = now >= startTime && now < endTime && auction.status !== 'ended';
    const isEnded = now >= endTime || auction.status === 'ended';
    
    switch (statusFilter) {
      case 'upcoming':
        return matchesSearch && isUpcoming;
      case 'active':
        return matchesSearch && isActive;
      case 'ended':
        return matchesSearch && isEnded;
      default:
        return matchesSearch;
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage onGetStarted={() => setCurrentView('auctions')} />
        <Toaster position="top-right" />
      </>
    );
  }

  if (selectedAuctionId) {
    return (
      <>
        <AuctionRoom 
          auctionId={selectedAuctionId} 
          onBack={() => setSelectedAuctionId(null)} 
        />
        <Toaster position="top-right" />
      </>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <>
        <Header 
          onCreateAuction={() => setShowCreateModal(true)}
          onDashboard={() => setCurrentView('auctions')}
          onNavigateHome={() => setCurrentView('landing')}
          dashboardButtonText="Auctions"
        />
        <Dashboard />
        <CreateAuctionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onAuctionCreated={loadAuctions}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onCreateAuction={() => setShowCreateModal(true)}
        onDashboard={() => setCurrentView('dashboard')}
        onNavigateHome={() => setCurrentView('landing')}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search auctions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none bg-white"
              >
                <option value="all">All Auctions</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Live</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No auctions found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Be the first to create an auction!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onClick={() => setSelectedAuctionId(auction.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAuctionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAuctionCreated={loadAuctions}
      />

      <Toaster position="top-right" />
    </div>
  );
}

export default App;