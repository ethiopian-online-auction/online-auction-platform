'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Features() {
  const { t } = useLanguage();

  const features = [
    { icon: '🛡️', titleKey: 'secureBidding',   descKey: 'secureBiddingDesc',   gradient: 'from-blue-600 to-cyan-500',    glow: 'rgba(59,130,246,0.4)',  bg: 'from-blue-950 to-blue-900' },
    { icon: '⚡',  titleKey: 'instantUpdates',  descKey: 'instantUpdatesDesc',  gradient: 'from-yellow-500 to-orange-500', glow: 'rgba(234,179,8,0.4)',   bg: 'from-orange-950 to-yellow-900' },
    { icon: '📈', titleKey: 'bestDeals',        descKey: 'bestDealsDesc',       gradient: 'from-purple-600 to-pink-500',   glow: 'rgba(168,85,247,0.4)',  bg: 'from-purple-950 to-pink-900' },
    { icon: '🏆', titleKey: 'verifiedSellers',  descKey: 'verifiedSellersDesc', gradient: 'from-green-500 to-teal-500',    glow: 'rgba(34,197,94,0.4)',   bg: 'from-green-950 to-teal-900' },
  ];

  const stats = [
    { value: '100%', label: 'Secure Payments',    icon: '🔒' },
    { value: 'ETB',  label: 'Ethiopian Currency', icon: '🇪🇹' },
    { value: '24/7', label: 'Platform Available', icon: '⏰' },
    { value: 'ML',   label: 'Fraud Detection',    icon: '🤖' },
  ];

  return (
    <div className="py-12 sm:py-16 lg:py-20 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[300px] bg-blue-600/10 blur-3xl rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium">
            Why Choose BidAmharic
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-4 mb-3">
            Built for Ethiopian Buyers and Sellers
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            A secure, fast, and transparent auction platform designed for Ethiopia
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className={`relative group bg-gradient-to-br ${feature.bg} border border-white/5 rounded-2xl p-5 sm:p-6 text-center overflow-hidden hover:scale-105 transition-all duration-300 cursor-default`}
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ background: `radial-gradient(circle at 50% 0%, ${feature.glow} 0%, transparent 70%)` }}
              />
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl sm:text-3xl shadow-lg`}
                style={{ boxShadow: `0 8px 24px ${feature.glow}` }}
              >
                {feature.icon}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 relative z-10">{t(feature.titleKey)}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed relative z-10">{t(feature.descKey)}</p>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-center hover:bg-white/10 transition-all">
              <div className="text-2xl sm:text-3xl mb-2">{stat.icon}</div>
              <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
              <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
