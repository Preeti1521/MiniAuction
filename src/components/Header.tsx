import React, { useState } from 'react';
import { Gavel, Bell, User, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { AuthModal } from './AuthModal';
import { NotificationPanel } from './NotificationPanel';

interface HeaderProps {
  onCreateAuction: () => void;
  onDashboard?: () => void;
  onNavigateHome: () => void;
  dashboardButtonText?: string;
}

export function Header({ onCreateAuction, onDashboard, onNavigateHome, dashboardButtonText }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={onNavigateHome}>
              <Gavel className="w-8 h-8 text-amber-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">AuctionHouse</h1>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {onDashboard && (
                    <button
                      onClick={onDashboard}
                      className="inline-flex items-center px-4 py-2 text-amber-600 border border-amber-600 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      {dashboardButtonText || 'Dashboard'}
                    </button>
                  )}
                  
                  <button
                    onClick={onCreateAuction}
                    className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Auction
                  </button>
                  
                  <button 
                    className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => setShowNotifications(true)}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{user.email}</span>
                    </div>
                    
                    <button
                      onClick={handleSignOut}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}