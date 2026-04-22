'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import AuctionCreateRecommendation from '@/components/AuctionCreateRecommendation';

export default function CreateAuctionPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startingBid: '',
    reservePrice: '',
    buyNowPrice: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    condition: 'new',
    shippingCost: '0',
    shippingMethod: 'standard'
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Set default start date/time to now (local time)
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 7); // Default 7 days duration

    const toLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const toLocalTime = (d: Date) => {
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${min}`;
    };

    setFormData(prev => ({
      ...prev,
      startDate: toLocalDate(now),
      startTime: toLocalTime(now),
      endDate: toLocalDate(end),
      endTime: toLocalTime(end)
    }));
  }, [isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      let processedCount = 0;
      
      Array.from(files).forEach(file => {
        // Check file size (max 5MB per image)
        if (file.size > 5 * 1024 * 1024) {
          alert(`Image ${file.name} is too large. Maximum size is 5MB per image.`);
          processedCount++;
          if (processedCount === files.length && newImages.length > 0) {
            setImages([...images, ...newImages]);
          }
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new window.Image();
          img.onload = () => {
            // Create canvas to compress image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions (max 1200px width/height)
            let width = img.width;
            let height = img.height;
            const maxSize = 1200;
            
            if (width > height && width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with compression (0.8 quality)
            const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
            newImages.push(compressedImage);
            processedCount++;
            
            if (processedCount === files.length) {
              setImages([...images, ...newImages]);
            }
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is verified
    if (!user?.isVerified) {
      alert('⚠️ Account Verification Required\n\nYou must verify your account before creating auctions.\n\nPlease:\n1. Contact admin for verification\n\nOnce verified, you can create auctions.');
      return;
    }
    
    if (!formData.title || !formData.description || !formData.category || !formData.startingBid) {
      alert('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    // Validate dates
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const now = new Date();
    // Allow 5 min buffer so "now" doesn't fail validation
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (startDateTime < fiveMinAgo) {
      alert('Start date/time cannot be in the past');
      return;
    }

    if (endDateTime <= startDateTime) {
      alert('End date/time must be after start date/time');
      return;
    }

    setLoading(true);
    
    try {
      const api = (await import('@/lib/api')).default;
      
      const auctionData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startingBid: parseFloat(formData.startingBid),
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
        buyNowPrice: formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : null,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        images: images,
        itemCondition: formData.condition,
        shippingInfo: {
          cost: parseFloat(formData.shippingCost),
          method: formData.shippingMethod
        },
        isPrivate: false
      };

      const response = await api.createAuction(auctionData);
      
      if (response.success) {
        alert('🎉 Auction created successfully!\n\nYour auction is now live and visible to all users.');
        
        // Redirect to homepage to see the new auction
        router.push('/');
        
        // Force a page reload to fetch fresh data
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      } else {
        alert(response.message || 'Failed to create auction');
      }
    } catch (error: any) {
      console.error('Create auction error:', error);
      alert(error.message || 'Failed to create auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'collectibles', label: 'Collectibles' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Auction</h1>
          <p className="text-gray-600">List your item and start receiving bids</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., iPhone 15 Pro Max - 256GB"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Describe your item in detail..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="new">New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* AI Pricing Recommendation — shows when category is selected */}
          {formData.category && (
            <AuctionCreateRecommendation
              category={formData.category}
              onApplySuggestion={(field, value) => {
                if (field === 'startingBid') {
                  setFormData(prev => ({ ...prev, startingBid: String(value) }));
                } else if (field === 'duration') {
                  const now = new Date();
                  const end = new Date(now);
                  end.setDate(end.getDate() + value);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const endDate = `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}`;
                  setFormData(prev => ({ ...prev, endDate }));
                }
              }}
            />
          )}          {/* Pricing */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Bid (ETB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="startingBid"
                  value={formData.startingBid}
                  onChange={handleInputChange}
                  placeholder="1000"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reserve Price (ETB)
                </label>
                <input
                  type="number"
                  name="reservePrice"
                  value={formData.reservePrice}
                  onChange={handleInputChange}
                  placeholder="5000"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum price to sell</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buy Now Price (ETB)
                </label>
                <input
                  type="number"
                  name="buyNowPrice"
                  value={formData.buyNowPrice}
                  onChange={handleInputChange}
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Optional instant buy price</p>
              </div>
            </div>
          </div>

          {/* Auction Schedule */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Auction Schedule</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date/Time */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>🟢</span>
                  <span>Start Date & Time</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Auction will start at this date and time
                </p>
              </div>

              {/* End Date/Time */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>🔴</span>
                  <span>End Date & Time</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Auction will end at this date and time
                </p>
              </div>
            </div>

            {/* Duration Display */}
            {formData.startDate && formData.endDate && formData.startTime && formData.endTime && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Duration:</strong> {
                    (() => {
                      const start = new Date(`${formData.startDate}T${formData.startTime}`);
                      const end = new Date(`${formData.endDate}T${formData.endTime}`);
                      const diff = end.getTime() - start.getTime();
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      return `${days} days and ${hours} hours`;
                    })()
                  }
                </p>
              </div>
            )}
          </div>

          {/* Shipping */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Method
                </label>
                <select
                  name="shippingMethod"
                  value={formData.shippingMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="standard">Standard Shipping</option>
                  <option value="express">Express Shipping</option>
                  <option value="pickup">Local Pickup</option>
                  <option value="courier">Courier Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Cost (ETB)
                </label>
                <input
                  type="number"
                  name="shippingCost"
                  value={formData.shippingCost}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Enter 0 for free shipping</p>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Images</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Images <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">📸 Upload up to 10 images. First image will be the main image.</p>
                <p className="text-xs text-gray-500">💾 Maximum 5MB per image. Images will be automatically compressed.</p>
                <p className="text-xs text-green-600">✓ Supported formats: JPG, PNG, WEBP</p>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image src={img} alt={`Upload ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commission Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> A small commission fee will be applied to successful sales to maintain the platform.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
