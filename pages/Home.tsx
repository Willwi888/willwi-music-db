import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getLanguageColor } from '../types';
import { useTranslation } from '../context/LanguageContext';
import CountdownTimer from '../components/CountdownTimer';

// Willwi Official Hero Image
const ARTIST_HERO_IMAGE = "https://p17.zdusercontent.com/attachment/572742/nGBWtmpTNA1gAhYLblesSXoiZ?token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..DuNguqol2WAk3WiKEt2srw.Mbfpe6C7F0kNE5DFsRseRfcLpnmsFIJX6bbXNEIUD8vwVC42QZeqW2_-5mxN3DnaFJZ_jmssgO1yGm440mPn2JGjfN6LCYLEKR3XZl4w9DnHsnClS3IbVUkRZWlmhMaxWj3TI3K6hz-1ZSVYRSLDVZxMLLIzrC5X_6o_4E--8wu1cRwuPTlOef1AEgDS5ynUn4Dy7MS7sgZmhiw3Vcu1jxnIKwdnIZJm1VaZf9_9EXwmxDISSDzzZFp5J3sSW9D1vKO8oM8hzB-CXggM0R44sHQutGNCcKc5pt2F9UZSVfw.1y_aP3hPN5ziOiWi6Kf9hw"; 

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const Home: React.FC = () => {
  const { songs, latestVideoUrl, countdownTargetDate } = useData();
  const { t } = useTranslation();
  const featured = songs.find(s => s.isEditorPick) || songs[0];

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <div className="relative min-h-[calc(100vh-64px)] bg-brand-darker flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Content (Text) */}
        <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-16 py-12 lg:py-20 order-2 lg:order-1">
            <div className="max-w-xl mx-auto lg:mx-0">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter uppercase mb-4 drop-shadow-2xl">
                WILLWI
              </h1>
              
              <div className="h-1 w-24 bg-brand-accent mb-8 shadow-[0_0_15px_rgba(56,189,248,0.6)]"></div>
              
              <h2 className="text-3xl md:text-4xl font-bold tracking-widest text-white mb-6 uppercase leading-tight flex items-center gap-4">
                威爾維
                <span className="text-xs border border-brand-accent text-brand-accent px-2 py-1 rounded tracking-widest">資料庫</span>
              </h2>
              
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-12 font-light max-w-lg border-l-2 border-slate-600 pl-6">
                 2月25日重生。
                 <br/>
                 只是為了留下存在過的痕跡。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <Link 
                    to="/database" 
                    className="px-8 py-4 bg-brand-accent text-brand-darker font-black text-center uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-lg shadow-brand-accent/20 rounded-sm"
                >
                  資料庫
                </Link>
                <Link 
                    to="/interactive" 
                    className="px-8 py-4 border border-slate-400 text-slate-100 font-bold text-center uppercase tracking-widest hover:border-white hover:text-white hover:bg-white/5 transition-all backdrop-blur-sm rounded-sm"
                >
                  互動工作室
                </Link>
              </div>

              {/* Countdown Timer */}
              {countdownTargetDate && (
                <div className="mb-16">
                  <h3 className="text-brand-accent text-xs font-bold uppercase tracking-[0.2em] mb-4">NEW RELEASE COUNTDOWN</h3>
                  <CountdownTimer targetDate={countdownTargetDate} />
                </div>
              )}

              {/* Latest Video Embed */}
              {latestVideoUrl && (
                <div className="mb-16 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 max-w-md">
                    <div className="px-4 py-2 bg-slate-900 border-b border-white/10 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">LATEST VIDEO</span>
                    </div>
                    <iframe 
                        className="w-full aspect-video" 
                        src={`https://www.youtube.com/embed/${getYoutubeId(latestVideoUrl)}?controls=1&showinfo=0&rel=0`} 
                        title="YouTube player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen>
                    </iframe>
                </div>
              )}
            </div>
        </div>
        
        {/* Right Content (Image) */}
        <div className="relative w-full lg:w-1/2 h-[50vh] lg:h-auto min-h-[500px] order-1 lg:order-2 bg-slate-800 overflow-hidden flex items-end justify-center">
          <img 
              src={ARTIST_HERO_IMAGE} 
              alt="Willwi" 
              className="w-auto h-full max-h-screen object-contain object-bottom relative z-10"
          />
          
          {/* Subtle Glow behind the person */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none z-0"></div>

          {/* Gradient Overlays */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-brand-darker to-transparent z-20 hidden lg:block"></div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-darker to-transparent z-20 lg:hidden"></div>
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
    </div>
  );
};

export default Home;