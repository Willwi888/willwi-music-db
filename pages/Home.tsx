import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getLanguageColor } from '../types';
import { useTranslation } from '../context/LanguageContext';
import PricingCards from '../components/PricingCards';
import OfficialPlatforms from '../components/OfficialPlatforms';

// Willwi Official Hero Image - 2026 形象照
const ARTIST_HERO_IMAGE = "/images/hero-bg.jpg";
// 金色簽名浮水印（用於歌詞影片輸出）
const SIGNATURE_WATERMARK = "/images/signature-gold.png"; 

const Home: React.FC = () => {
  const { songs } = useData();
  const { t, language } = useTranslation();
  const featured = songs.find(s => s.isEditorPick) || songs[0];
  const isEn = language === 'en';

  return (
    <div className="flex flex-col">
      {/* Custom Styles for Breathing Glow */}
      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3), 0 0 40px rgba(251, 191, 36, 0.1); }
          50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.5), 0 0 80px rgba(251, 191, 36, 0.2); }
        }
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
          50% { text-shadow: 0 0 40px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3); }
        }
        .breathing-glow {
          animation: breathe 4s ease-in-out infinite;
        }
        .glow-border {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .text-glow {
          animation: text-glow 3s ease-in-out infinite;
        }
        .gold-gradient {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* 1. Hero Section - 存在宣言 */}
      <div className="relative min-h-screen bg-brand-darker overflow-hidden">
        {/* Background with Breathing Effect */}
        <div className="absolute inset-0 z-0">
          <img 
            src={ARTIST_HERO_IMAGE} 
            alt="Willwi" 
            className="w-full h-full object-cover object-top opacity-30 breathing-glow"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-darker/60 via-brand-darker/85 to-brand-darker"></div>
          
          {/* Gold Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-gold/5 blur-[120px] breathing-glow"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
          {/* Official Badge with Glow */}
          <div className="mb-8">
            <span className="glow-border bg-brand-gold/10 text-brand-gold text-xs font-medium px-5 py-2.5 rounded-full border border-brand-gold/40 uppercase tracking-[0.2em]">
              {isEn ? 'Official' : '官方認證'}
            </span>
          </div>

          {/* Logo with Text Glow */}
          <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter uppercase mb-6 text-glow">
            WILLWI
          </h1>

          {/* 存在宣言 - 核心文字 */}
          <div className="max-w-2xl text-center mb-16">
            <p className="text-xl md:text-2xl text-white/90 font-light leading-relaxed mb-6">
              {isEn 
                ? "I'm not building a tool. I'm leaving a place."
                : "我不是在做一個工具。我是在留一個地方。"}
            </p>
            <p className="text-slate-400 text-base leading-relaxed">
              {isEn 
                ? "This is not a music platform. Not a place to be compared, rated, or consumed."
                : "這裡不是音樂平台，也不是用來被比較、被評分、被消耗的地方。"}
            </p>
          </div>

          {/* Pricing Cards */}
          <PricingCards />

          {/* 關於手工對時 - 帶光暈的卡片 */}
          <div className="mt-24 w-full max-w-3xl">
            <div className="relative">
              {/* Glow Effect Behind Card */}
              <div className="absolute inset-0 bg-brand-gold/10 rounded-3xl blur-2xl breathing-glow"></div>
              
              <div className="relative bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-brand-gold/20 p-10 md:p-14">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-12 h-12 rounded-full bg-brand-darker border border-brand-gold/30 flex items-center justify-center glow-border">
                    <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-sm text-brand-gold uppercase tracking-[0.25em] mb-8 text-center">
                  {isEn ? 'About Handmade Sync' : '關於手工對時'}
                </h3>
                
                <div className="text-center space-y-8">
                  <p className="text-white text-lg md:text-xl leading-relaxed font-light">
                    {isEn 
                      ? "I make lyrics sync by hand, not because automation is impossible, but because a song deserves someone to sit down and walk through it."
                      : "我讓歌詞必須手工對時，不是因為我做不到自動化，而是因為一首歌，值得被人坐下來陪完。"}
                  </p>
                  
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent mx-auto"></div>
                  
                  <p className="text-slate-500 text-sm leading-relaxed max-w-lg mx-auto">
                    {isEn 
                      ? "Not to be remembered, but to remember. I don't wait for anyone to come back. I just leave a light on. So that person in memory has somewhere to stand."
                      : "不是為了被記得，而是為了記得。我不等誰回來。我只是留一盞燈。讓記憶裡的那個人，有一個地方可以站著。"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 參與說明 */}
          <div className="mt-24 w-full max-w-4xl">
            <div className="text-center mb-12">
              <p className="text-brand-gold/80 text-xs uppercase tracking-[0.3em] mb-3">
                {isEn ? 'A Space to Participate' : '這是一個可以參與的空間'}
              </p>
              <h2 className="text-xl md:text-2xl font-light text-white/90">
                {isEn 
                  ? "You walk in, and finish your own version by hand."
                  : "你走進來，親手完成屬於你的版本。"}
              </h2>
              <p className="text-slate-500 text-sm mt-3 max-w-xl mx-auto">
                {isEn 
                  ? "No retakes, no perfect version. The way it is now, is the way it is. This isn't cruelty — life has no remastered edition."
                  : "沒有重來，沒有完美版。此刻的樣子，就是它的樣子。這不是殘酷，而是人生沒有重製版。"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { num: '01', title: isEn ? 'Choose' : '選擇', desc: isEn ? 'Select your support tier' : '選擇您的支持方式' },
                { num: '03', title: isEn ? 'Experience' : '體驗', desc: isEn ? 'Walk through the song' : '陪這首歌走一段' }
              ].map((step, idx) => (
                <div key={idx} className="group bg-slate-900/40 hover:bg-slate-900/60 rounded-xl p-6 border border-slate-800 hover:border-brand-gold/30 transition-all duration-500 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-slate-700 group-hover:border-brand-gold/50 flex items-center justify-center transition-colors duration-500">
                    <span className="text-lg font-light text-slate-400 group-hover:text-brand-gold transition-colors duration-500">{step.num}</span>
                  </div>
                  <h3 className="text-white font-medium mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 關於費用 & 版權說明 */}
      <div className="bg-slate-950 py-28 px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 關於費用 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-gold/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative bg-slate-900/50 hover:bg-slate-900/70 p-10 rounded-2xl border border-slate-800 hover:border-brand-gold/20 transition-all duration-500">
                <div className="w-10 h-10 rounded-full border border-brand-gold/30 flex items-center justify-center mb-6">
                  <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-brand-gold/80 text-xs uppercase tracking-[0.2em] mb-4">
                  {isEn ? 'About Pricing' : '關於費用'}
                </h3>
                <p className="text-xl text-white font-light mb-4">
                  {isEn ? "I don't do free work." : "我不做免費的事。"}
                </p>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {isEn 
                    ? "Not because creation has value, but because time has weight. What you pay for isn't a feature — it's the time you're willing to leave for a song."
                    : "不是因為創作有價，而是因為時間有重量。你付費的不是功能，而是你願意為一首歌留下的時間。"}
                </p>
              </div>
            </div>

            {/* 下載與版權 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-gold/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative bg-slate-900/50 hover:bg-slate-900/70 p-10 rounded-2xl border border-slate-800 hover:border-brand-gold/20 transition-all duration-500">
                <div className="w-10 h-10 rounded-full border border-brand-gold/30 flex items-center justify-center mb-6">
                  <svg className="w-4 h-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-brand-gold/80 text-xs uppercase tracking-[0.2em] mb-4">
                  {isEn ? 'Download & Rights' : '下載與權利'}
                </h3>
                <p className="text-xl text-white font-light mb-4">
                  {isEn 
                    ? "You can download the video you completed."
                    : "你可以下載你完成的歌詞影片。"}
                </p>
                <p className="text-slate-400 leading-relaxed text-sm mb-4">
                  {isEn 
                    ? "That's the record of you walking through this song together."
                    : "那是你陪這首歌走過的紀錄。"}
                </p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {isEn 
                    ? "The rights to the song, lyrics, and recording still belong to the original creator. This is not a licensing platform."
                    : "歌曲、歌詞、錄音的權利，仍屬原創作者所有。這裡不是授權平台。"}
                </p>
              </div>
            </div>

          </div>

          {/* 感謝 */}
          <div className="mt-16 text-center">
            <div className="inline-block">
              <p className="text-slate-500 text-sm italic">
                {isEn 
                  ? '"Every completed version, I\'m grateful for."'
                  : '「每一個完成的版本，我都心懷感謝。」'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Platforms - 官方認證平台 */}
      <OfficialPlatforms />

      {/* 4. 認證與精選 */}
      <div className="bg-brand-darker py-28 px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Left: Verification */}
            <div className="space-y-8">
               <h3 className="text-2xl font-light text-white tracking-wide border-l-2 border-brand-gold pl-6">
                 {t('home_verified_title')}
               </h3>
               <div className="grid grid-cols-1 gap-3 pl-6">
                 {(t('home_verified_items') as string[]).map((item, idx) => (
                   <div key={idx} className="flex items-center gap-4 text-slate-300 group py-2">
                      <div className="w-5 h-5 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30 group-hover:bg-brand-gold/20 transition-colors">
                        <svg className="w-2.5 h-2.5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      </div>
                      <span className="text-sm tracking-wide">{item}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Right: Featured Song */}
            {featured && (
              <div className="space-y-6">
                <div className="flex gap-2 mb-4">
                  <span className="bg-slate-800/50 text-slate-500 text-[10px] px-3 py-1 rounded-full border border-slate-700/50 uppercase tracking-wider">Est. 1995</span>
                  <span className="bg-slate-800/50 text-slate-500 text-[10px] px-3 py-1 rounded-full border border-slate-700/50 uppercase tracking-wider">Sydney / Taipei</span>
                </div>
                
                <p className="text-brand-gold/70 text-xs uppercase tracking-[0.3em]">
                  {isEn ? 'Featured Track' : '精選作品'}
                </p>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-brand-gold/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-slate-800 group-hover:border-brand-gold/30 transition-all duration-500">
                    <div className="flex justify-between items-center mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/50 border border-slate-700/50 text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(featured.language)}`}></span>
                        {featured.language}
                      </span>
                    </div>
                    <Link to={`/song/${featured.id}`} className="flex items-center gap-6 cursor-pointer">
                      <div className="relative w-20 h-20 overflow-hidden rounded-lg flex-shrink-0 ring-1 ring-white/10">
                         <img src={featured.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-medium text-white group-hover:text-brand-gold transition-colors duration-500 truncate">{featured.title}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">{featured.releaseDate}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-brand-gold/50 group-hover:text-brand-gold transition-all duration-500 flex-shrink-0">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="text-right pt-4">
                  <Link 
                    to="/database" 
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-gold transition-colors text-xs uppercase tracking-wider"
                  >
                    {isEn ? 'View All Catalog' : '瀏覽完整作品庫'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
