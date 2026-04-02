'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Our Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              We believe in creating a transparent, fair, and accessible marketplace where 
              everyone can participate in the excitement of online auctions. Our platform brings 
              together buyers and sellers from all corners of Ethiopia, making it easy to discover 
              unique items and great deals.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Whether you're looking for electronics, vehicles, jewelry, or collectibles, Ethiopian 
              Auction provides a secure and user-friendly environment for all your bidding needs.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-gray-600">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">4.8/5</div>
                <div className="text-gray-600">Rating</div>
              </div>
              <div className="text-center col-span-2">
                <div className="text-4xl font-bold text-blue-600 mb-2">100K+</div>
                <div className="text-gray-600">Items Sold</div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Transparency</h3>
            <p className="text-gray-600 text-sm">Clear bidding process with full visibility</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quality</h3>
            <p className="text-gray-600 text-sm">Verified sellers and authentic items</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Community</h3>
            <p className="text-gray-600 text-sm">Building connections across Ethiopia</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Trust</h3>
            <p className="text-gray-600 text-sm">Secure platform with buyer protection</p>
          </div>
        </div>

        {/* Our Story Section */}
        <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Story</h2>
          
          <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
            <p>
              Ethiopian Auction was founded in 2020 with a simple vision: to create a trusted online 
              marketplace where Ethiopians could buy and sell items through a fair and transparent 
              auction process.
            </p>
            
            <p>
              What started as a small platform has grown into Ethiopia's leading auction website, 
              serving thousands of users every day. We've facilitated over 100,000 successful 
              transactions, connecting buyers and sellers across the country.
            </p>
            
            <p>
              Today, we continue to innovate and improve our platform, adding new features and 
              categories to serve our growing community better. Our commitment to security, 
              transparency, and customer satisfaction remains at the heart of everything we do.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}