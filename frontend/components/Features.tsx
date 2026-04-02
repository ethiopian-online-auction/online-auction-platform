'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Features() {
  const { t } = useLanguage();

  const features = [
    {
      icon: '🛡️',
      titleKey: 'secureBidding',
      descKey: 'secureBiddingDesc',
      color: 'bg-blue-50'
    },
    {
      icon: '⚡',
      titleKey: 'instantUpdates',
      descKey: 'instantUpdatesDesc',
      color: 'bg-green-50'
    },
    {
      icon: '📈',
      titleKey: 'bestDeals',
      descKey: 'bestDealsDesc',
      color: 'bg-purple-50'
    },
    {
      icon: '🏆',
      titleKey: 'verifiedSellers',
      descKey: 'verifiedSellersDesc',
      color: 'bg-orange-50'
    }
  ];

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition text-center"
            >
              <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center text-3xl mx-auto mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                {t(feature.titleKey)}
              </h3>
              <p className="text-gray-600">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
