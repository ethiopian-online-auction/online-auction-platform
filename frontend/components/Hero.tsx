'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Hero() {
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { key: 'electronics', icon: '💻' },
    { key: 'vehicles', icon: '🚗' },
    { key: 'jewelry', icon: '💎' },
    { key: 'homeGarden', icon: '🏡' }
  ];

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/auctions?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/auctions');
    }
  };

  const handleCategoryClick = (category: string) => {
    router.push(`/auctions?category=${encodeURIComponent(t(category))}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 text-gray-900 relative overflow-hidden border-4 border-gray-300 rounded-3xl mx-4 my-6 shadow-2xl">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50 rounded-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('searchPlaceholder')}
              className="flex-1 px-6 py-4 rounded-full bg-white text-gray-900 border-2 border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 shadow-lg placeholder-gray-400 hover:border-gray-400 transition-all"
            />
            <button 
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 border-2 border-blue-700 hover:border-blue-800"
            >
              {t('searchButton')}
            </button>
          </form>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat.key)}
              className="px-6 py-3 bg-white hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-500 rounded-full font-medium transition-all flex items-center gap-2 hover:scale-110 transform shadow-md hover:shadow-xl text-gray-700 hover:text-blue-600 active:scale-95"
            >
              <span className="text-xl">{cat.icon}</span>
              <span>{t(cat.key)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
