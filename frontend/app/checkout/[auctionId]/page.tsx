'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState('');
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    region: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const auction = {
    id: params.auctionId,
    title: 'iPhone 17 Pro Max - 256GB Space Black',
    image: '/Image/iphone 17 pmax.webp',
    winningBid: 85000,
    seller: {
      name: 'TechStore ET',
      rating: 4.8
    }
  };

  const handleCheckout = async () => {
    if (!selectedPayment) {
      alert('Please select a payment method');
      return;
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.region) {
      alert('Please fill in all shipping details');
      return;
    }

    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      alert('Payment successful! Your order has been confirmed.');
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Congratulations! You won this auction</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                    placeholder="House number, street name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      placeholder="Addis Ababa"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.region}
                      onChange={(e) => setShippingAddress({...shippingAddress, region: e.target.value})}
                      placeholder="Addis Ababa"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {/* Telebirr */}
                <button
                  onClick={() => setSelectedPayment('telebirr')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition ${
                    selectedPayment === 'telebirr'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Telebirr</p>
                      <p className="text-sm text-gray-600">Pay with Telebirr mobile money</p>
                    </div>
                    {selectedPayment === 'telebirr' && (
                      <svg className="w-6 h-6 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Chapa */}
                <button
                  onClick={() => setSelectedPayment('chapa')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition ${
                    selectedPayment === 'chapa'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">C</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Chapa</p>
                      <p className="text-sm text-gray-600">Pay with Chapa payment gateway</p>
                    </div>
                    {selectedPayment === 'chapa' && (
                      <svg className="w-6 h-6 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* CBE Birr */}
                <button
                  onClick={() => setSelectedPayment('cbe-birr')}
                  className={`w-full p-4 border-2 rounded-lg text-left transition ${
                    selectedPayment === 'cbe-birr'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-sm">CBE</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">CBE Birr</p>
                      <p className="text-sm text-gray-600">Pay with Commercial Bank of Ethiopia</p>
                    </div>
                    {selectedPayment === 'cbe-birr' && (
                      <svg className="w-6 h-6 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="mb-4">
                <div className="relative h-32 bg-gray-100 rounded-lg mb-3">
                  <Image
                    src={auction.image}
                    alt={auction.title}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <h3 className="font-bold text-gray-900">{auction.title}</h3>
                <p className="text-sm text-gray-600">Sold by: {auction.seller.name}</p>
              </div>

              <div className="border-t border-b border-gray-200 py-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Winning Bid</span>
                  <span className="font-bold">{auction.winningBid.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-bold text-green-600">Free</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">{auction.winningBid.toLocaleString()} ETB</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || !selectedPayment}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Payment'}
              </button>

              <p className="text-xs text-gray-600 text-center mt-4">
                🔒 Your payment information is secure and encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
