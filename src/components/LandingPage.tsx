import React, { useState } from 'react';
import { Gavel, TrendingUp, Shield, Clock, Users, Star, ArrowRight } from 'lucide-react';
import { AuthModal } from './AuthModal';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onGetStarted();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <main>
          {/* Hero Section */}
          <section className="relative bg-white">
            <div className="container mx-auto px-6 py-24 text-center">
              <h1 className="text-5xl font-bold text-gray-900 md:text-6xl">
                The Future of Online Auctions is Here
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
                Bid, win, and sell with confidence on our secure and feature-rich auction platform. Join thousands of users finding amazing deals and opportunities.
              </p>
              <button
                onClick={handleGetStarted}
                className="mt-8 px-8 py-4 bg-amber-600 text-white font-bold rounded-full text-lg hover:bg-amber-700 transition-transform transform hover:scale-105"
              >
                Get Started Now <ArrowRight className="inline-block ml-2" />
              </button>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900">Why Choose Us?</h2>
                <p className="text-lg text-gray-600 mt-4">A feature-rich platform for all your auction needs.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="p-8 bg-white rounded-lg shadow-lg">
                  <Clock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Real-Time Bidding</h3>
                  <p className="text-gray-600">Experience the thrill of live auctions with instant updates and notifications.</p>
                </div>
                <div className="p-8 bg-white rounded-lg shadow-lg">
                  <Shield className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Secure & Safe</h3>
                  <p className="text-gray-600">Your data and transactions are protected with top-tier security measures.</p>
                </div>
                <div className="p-8 bg-white rounded-lg shadow-lg">
                  <Users className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Active Community</h3>
                  <p className="text-gray-600">Join a vibrant community of buyers and sellers from around the world.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900">What Our Users Say</h2>
                <p className="text-lg text-gray-600 mt-4">We are trusted by thousands of users worldwide.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-4">
                    <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="User" className="w-12 h-12 rounded-full mr-4"/>
                    <div>
                      <h4 className="font-bold text-gray-900">Sarah K.</h4>
                      <div className="flex text-amber-500">
                        <Star className="w-5 h-5" />
                        <Star className="w-5 h-5" />
                        <Star className="w-5 h-5" />
                        <Star className="w-5 h-5" />
                        <Star className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">"This is the best auction platform I've ever used. It's easy to use, secure, and has a great community."</p>
                </div>
                <div className="p-8 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-4">
                    <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="User" className="w-12 h-12 rounded-full mr-4"/>
                    <div>
                      <h4 className="font-bold text-gray-900">Mike D.</h4>
                      <div className="flex text-amber-500">
                        <Star className="w-5 h-5" />
                        <Star className="w-5 h-5" />
                        <Star className="w-5 h-5" />
                        <Star className="w-5 h-5" />
                        <Star className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">"I found some amazing deals on this platform. I highly recommend it to anyone looking for a great auction experience."</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-amber-600 text-white">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
              <p className="text-lg mt-4 mb-8">Join now and start bidding on your favorite items.</p>
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-white text-amber-600 font-bold rounded-full text-lg hover:bg-gray-200 transition-transform transform hover:scale-105"
              >
                Sign Up Now <ArrowRight className="inline-block ml-2" />
              </button>
            </div>
          </section>
        </main>

        <footer className="bg-white py-8">
          <div className="container mx-auto px-6 text-center text-gray-600">
            <p>&copy; 2024 BidHub. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}