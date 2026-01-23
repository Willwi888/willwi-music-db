import React from 'react';

interface Platform {
  name: string;
  url: string;
  icon: string;
  color: string;
  verified: boolean;
}

const OFFICIAL_PLATFORMS: Platform[] = [
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/artist/3ascZ8Rb2KDw4QyCy29Om4',
    icon: '🎵',
    color: 'from-green-600 to-green-800',
    verified: true
  },
  {
    name: 'Apple Music',
    url: 'https://music.apple.com/us/artist/willwi/1798471457',
    icon: '🍎',
    color: 'from-pink-500 to-red-600',
    verified: true
  },
  {
    name: 'YouTube Music',
    url: 'https://music.youtube.com/channel/UCAF8vdEOJ5sBdRuZXL61ASw',
    icon: '▶️',
    color: 'from-red-600 to-red-800',
    verified: true
  },
  {
    name: 'KKBOX',
    url: 'https://www.kkbox.com/tw/tc/artist/0pXOA9-SBBMNjAaaKS',
    icon: '🎧',
    color: 'from-blue-500 to-blue-700',
    verified: true
  },
  {
    name: 'TIDAL',
    url: 'https://tidal.com/artist/54856609',
    icon: '🌊',
    color: 'from-slate-700 to-slate-900',
    verified: true
  },
  {
    name: 'Musixmatch Pro',
    url: 'https://pro.musixmatch.com/roster/artist/64081678',
    icon: '📝',
    color: 'from-orange-500 to-orange-700',
    verified: true
  },
  {
    name: 'MusicBrainz',
    url: 'https://musicbrainz.org/artist/526cc0f8-da20-4d2d-86a5-4bf841a6ba3c',
    icon: '🗄️',
    color: 'from-yellow-600 to-yellow-800',
    verified: true
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@Willwi888',
    icon: '📺',
    color: 'from-red-500 to-red-700',
    verified: true
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@willwi888',
    icon: '🎬',
    color: 'from-slate-800 to-pink-600',
    verified: true
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/Willwi888',
    icon: '📘',
    color: 'from-blue-600 to-blue-800',
    verified: true
  },
  {
    name: 'Official Website',
    url: 'https://willwi.com/',
    icon: '🌐',
    color: 'from-brand-gold to-yellow-600',
    verified: true
  }
];

const OfficialPlatforms: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold/10 border border-brand-gold/30 rounded-full mb-4">
            <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse"></span>
            <span className="text-brand-gold text-xs font-bold uppercase tracking-widest">Verified Artist</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Official Platforms
          </h2>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {OFFICIAL_PLATFORMS.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                group relative overflow-hidden
                bg-gradient-to-br ${platform.color}
                p-4 rounded-xl
                border border-white/10
                hover:border-white/30
                hover:scale-105 hover:shadow-2xl
                transition-all duration-300
                flex flex-col items-center justify-center
                min-h-[120px]
              `}
            >
              {/* Verified Badge */}
              {platform.verified && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Icon */}
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {platform.icon}
              </span>

              {/* Name */}
              <span className="text-white text-sm font-bold text-center leading-tight">
                {platform.name}
              </span>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-xl"></div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OfficialPlatforms;
