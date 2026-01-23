import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getLanguageColor } from '../types';
import { useTranslation } from '../context/LanguageContext';
import PricingCards from '../components/PricingCards';

// Willwi Official Hero Image
const ARTIST_HERO_IMAGE = "https://p17.zdusercontent.com/attachment/572742/nGBWtmpTNA1gAhYLblesSXoiZ?token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..DuNguqol2WAk3WiKEt2srw.Mbfpe6C7F0kNE5DFsRseRfcLpnmsFIJX6bbXNEIUD8vwVC42QZeqW2_-5mxN3DnaFJZ_jmssgO1yGm440mPn2JGjfN6LCYLEKR3XZl4w9DnHsnClS3IbVUkRZWlmhMaxWj3TI3K6hz-1ZSVYRSLDVZxMLLIzrC5X_6o_4E--8wu1cRwuPTlOef1AEgDS5ynUn4Dy7MS7sgZmhiw3Vcu1jxnIKwdnIZJm1VaZf9_9EXwmxDISSDzzZFp5J3sSW9D1vKO8oM8hzB-CXggM0R44sHQutGNCcKc5pt2F9UZSVfw.1y_aP3hPN5ziOiWi6Kf9hw"; 

const Home: React.FC = () => {
  const { songs } = useData();
  const { t, language } = useTranslation();
  const featured = songs.find(s => s.isEditorPick) || songs[0];
  const isEn = language === 'en';

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section with Pricing Cards */}
      <div className="relative min-h-screen bg-brand-darker overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={ARTIST_HERO_IMAGE} 
            alt="Willwi" 
            className="w-full h-full object-cover object-top opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-darker/80 via-brand-darker/90 to-brand-darker"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          {/* Official Badge */}
          <div className="mb-6">
            <span className="bg-brand-gold/20 text-brand-gold text-xs font-bold px-4 py-2 rounded-full border border-brand-gold/30 uppercase tracking-widest">
              {isEn ? 'Official Verified' : '官方認證'}
            </span>
          </div>

          {/* Logo */}
          <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter uppercase mb-4 drop-shadow-2xl">
            WILLWI
          </h1>

          {/* Tagline */}
          <p className="text-slate-300 text-lg md:text-xl mb-4 tracking-widest uppercase">
            {isEn ? 'Official Platform' : '官方平台'} · {isEn ? 'Participate' : '參與'} & {isEn ? 'Support' : '支持'}
          </p>
          <p className="text-slate-500 text-sm mb-12 max-w-md text-center">
            {isEn 
              ? "This is not a streaming platform. This is WILLWI's creative interaction hub."
              : "這不是串流平台，這是支持 WILLWI 創作的互動基地"}
          </p>

          {/* Pricing Cards */}
          <PricingCards />

          {/* How It Works */}
          <div className="mt-20 w-full max-w-4xl">
            <div className="text-center mb-10">
              <p className="text-brand-accent text-xs uppercase tracking-[0.3em] mb-2">
                {isEn ? 'How It Works' : '操作指南'}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {isEn ? 'Participation Guide' : '參與方式說明'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-slate-700 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">01</span>
                </div>
                <h3 className="text-white font-bold mb-2">{isEn ? 'Choose Plan' : '選擇方式'}</h3>
                <p className="text-slate-500 text-sm">
                  {isEn 
                    ? 'Select your preferred support tier above'
                    : '從上方選擇您的支持方式'}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  {isEn 
                    ? '(Interactive, HD Collection, or Support)'
                    : '(互動體驗、高畫質收藏或音樂食糧)'}
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-slate-700 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">02</span>
                </div>
                <h3 className="text-white font-bold mb-2">{isEn ? 'Secure Payment' : '安全付款'}</h3>
                <p className="text-slate-500 text-sm">
                  {isEn 
                    ? 'Pay securely via Stripe'
                    : '透過 Stripe 安全付款'}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  {isEn 
                    ? 'Credit Card / Apple Pay / Google Pay'
                    : '信用卡 / Apple Pay / Google Pay'}
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-slate-700 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">03</span>
                </div>
                <h3 className="text-white font-bold mb-2">{isEn ? 'Experience & Collect' : '體驗與收藏'}</h3>
                <p className="text-slate-500 text-sm">
                  {isEn 
                    ? 'Enjoy the creative process or receive your work'
                    : '體驗創作過程或獲得成品'}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  {isEn 
                    ? 'Build your connection with WILLWI'
                    : '留下您與 WILLWI 的連結'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Brand / Mission Section */}
      <div className="bg-slate-950 py-24 px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Left: Verification */}
            <div className="space-y-8">
               <h3 className="text-3xl font-bold text-white tracking-wide border-l-4 border-brand-accent pl-6">
                 {t('home_verified_title')}
               </h3>
               <div className="grid grid-cols-1 gap-4 pl-6">
                 {(t('home_verified_items') as string[]).map((item, idx) => (
                   <div key={idx} className="flex items-center gap-4 text-slate-300 group">
                      <div className="w-6 h-6 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30 group-hover:bg-brand-gold group-hover:text-black transition-colors">
                        <svg className="w-3 h-3 text-brand-gold group-hover:text-black" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      </div>
                      <span className="font-medium tracking-wide">{item}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Right: Purpose */}
            <div className="space-y-8 bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
               <div className="flex gap-2 mb-4">
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded border border-slate-700 uppercase tracking-wider">Est. 1995</span>
                  <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded border border-slate-700 uppercase tracking-wider">Sydney / Taipei</span>
               </div>
               <h3 className="text-3xl font-bold text-white tracking-wide">
                 Respecting the Art of Music
               </h3>
               <p className="text-lg text-slate-400 leading-relaxed">
                 {t('home_purpose_text')}
                 <br/><br/>
                 We believe in a fair ecosystem. By offering a "First Song Free, then 80 NTD" model for our interactive studio, we ensure that digital tools support rather than devalue the music industry. It's not about profit; it's about setting a standard of value for every creator.
               </p>
               <div className="pt-8 border-t border-slate-800">
                  <blockquote className="text-xl md:text-2xl font-serif italic text-white mb-4">
                    "{t('home_quote_main')}"
                  </blockquote>
                  <cite className="block text-brand-accent font-bold not-italic tracking-widest text-sm uppercase">
                    — {t('home_quote_sub')}
                  </cite>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Featured Song Section */}
      {featured && (
        <div className="bg-brand-darker py-16 px-6 lg:px-8 border-t border-slate-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-brand-accent text-xs uppercase tracking-[0.3em] mb-2">
                {isEn ? 'Latest Release' : '最新發行'}
              </p>
              <h2 className="text-2xl font-bold text-white">
                {isEn ? 'Featured Track' : '精選作品'}
              </h2>
            </div>
            
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-white/10 hover:border-brand-accent/50 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(featured.language)}`}></span>
                  {featured.language}
                </span>
              </div>
              <Link to={`/song/${featured.id}`} className="flex items-center gap-6 group cursor-pointer">
                <div className="relative w-24 h-24 overflow-hidden rounded-lg flex-shrink-0">
                   <img src={featured.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-white group-hover:text-brand-accent transition-colors truncate">{featured.title}</h3>
                  <p className="text-sm text-slate-400 font-mono mt-1">{featured.releaseDate}</p>
                </div>
                <div className="w-12 h-12 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 group-hover:border-brand-accent group-hover:text-brand-accent group-hover:bg-brand-accent/10 transition-all flex-shrink-0">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </div>
              </Link>
            </div>

            <div className="text-center mt-8">
              <Link 
                to="/database" 
                className="inline-flex items-center gap-2 text-brand-accent hover:text-white transition-colors text-sm uppercase tracking-wider"
              >
                {isEn ? 'View All Catalog' : '瀏覽完整作品庫'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
