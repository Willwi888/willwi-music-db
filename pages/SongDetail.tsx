import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Song, Language, ProjectType, getLanguageColor } from '../types';
import { generateMusicCritique } from '../services/geminiService';
import { searchSpotifyTracks, getSpotifyAlbum, SpotifyTrack } from '../services/spotifyService';
import { useTranslation } from '../context/LanguageContext';

// Helper to clean Google Redirect URLs
const cleanGoogleRedirect = (url: string) => {
    try {
        if (url.includes('google.com/url')) {
            const urlObj = new URL(url);
            const q = urlObj.searchParams.get('q');
            if (q) return decodeURIComponent(q);
        }
        return url;
    } catch (e) {
        return url;
    }
};

const SongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSong, updateSong, deleteSong } = useData();
  const { t } = useTranslation();
  
  const [song, setSong] = useState<Song | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [editForm, setEditForm] = useState<Partial<Song>>({});

  // Spotify Update State in Edit Mode
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [searchingSpotify, setSearchingSpotify] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // AI State
  const [aiReview, setAiReview] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // View Mode: Story or Lyric Game
  const [storyMode, setStoryMode] = useState<'desc' | 'maker'>('desc');

  // Image Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      const found = getSong(id);
      if (found) {
        setSong(found);
        setEditForm(found);
      }
    }
  }, [id, getSong, navigate]);

  if (!song) return <div className="text-white text-center mt-20">Loading...</div>;

  const handleSave = async () => {
    if (song && id) {
      setIsSaving(true);
      const success = await updateSong(id, editForm);
      if (success) {
        setSong({ ...song, ...editForm } as Song);
        setIsEditing(false);
        setSyncMessage('');
      } else {
        alert(t('msg_save_error'));
      }
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (id && window.confirm(t('msg_confirm_delete'))) {
        await deleteSong(id);
        navigate('/database');
    }
  };

  const handleAiGenerate = async () => {
    setLoadingAi(true);
    const review = await generateMusicCritique(song);
    setAiReview(review);
    setLoadingAi(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditForm(prev => ({ ...prev, coverUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSpotifySearch = async () => {
    if (!spotifyQuery) return;
    setSearchingSpotify(true);
    const results = await searchSpotifyTracks(spotifyQuery);
    setSpotifyResults(results);
    setSearchingSpotify(false);
  };

  const applySpotifyData = async (track: SpotifyTrack) => {
      setSyncMessage('Fetching Catalog IDs...');
      
      // 1. Fetch full album to get UPC/EAN
      const fullAlbum = await getSpotifyAlbum(track.album.id);
      const upc = fullAlbum?.external_ids?.upc || fullAlbum?.external_ids?.ean || '';
      const largestImage = track.album.images[0]?.url || '';
      
      // 2. Intelligent title parsing
      let finalTitle = track.name;
      let newVersionLabel = editForm.versionLabel;
      
      const parenMatch = track.name.match(/\((.*?)\)/);
      if (parenMatch) {
          newVersionLabel = parenMatch[1];
          finalTitle = track.name.replace(/\s*\(.*?\)/, '').trim();
      } else if (track.name.includes(' - ')) {
          const parts = track.name.split(' - ');
          finalTitle = parts[0].trim();
          newVersionLabel = parts[1].trim();
      }

      setEditForm(prev => ({
          ...prev,
          title: finalTitle,
          releaseDate: track.album.release_date,
          coverUrl: largestImage,
          isrc: track.external_ids.isrc || prev.isrc,
          upc: upc || prev.upc,
          spotifyId: track.id,
          spotifyLink: track.external_urls.spotify, 
          versionLabel: newVersionLabel,
      }));
      
      setShowSpotifySearch(false);
      setSpotifyResults([]);
      setSyncMessage('✅ Synced');
      setTimeout(() => setSyncMessage(''), 3000);
  };

  const getYoutubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(new URL(url).search);
            videoId = urlParams.get('v') || '';
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch(e) {
        return null;
    }
  };

  const getSpotifyEmbedId = (s: Partial<Song>) => {
      const candidates = [s.spotifyId, s.spotifyLink];
      for (const c of candidates) {
          if (!c) continue;
          const urlMatch = c.match(/track\/([a-zA-Z0-9]+)/);
          if (urlMatch) return urlMatch[1];
          const uriMatch = c.match(/track:([a-zA-Z0-9]+)/);
          if (uriMatch) return uriMatch[1];
          if (!c.includes('/') && !c.includes(':') && c.length > 15) return c;
      }
      return null;
  };

  const displayData = isEditing ? { ...song, ...editForm } as Song : song;
  const embedUrl = getYoutubeEmbedUrl(displayData.youtubeUrl);
  const spotifyEmbedId = getSpotifyEmbedId(displayData);

  return (
    <div className="animate-fade-in pb-32">
        <div className="bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="relative">
                <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl" style={{ backgroundImage: `url(${displayData.coverUrl})` }}></div>
                
                <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-shrink-0 w-full md:w-64 group relative">
                         <img src={displayData.coverUrl} alt={displayData.title} className="w-full aspect-square object-cover rounded-xl shadow-lg bg-slate-900 border border-white/5" />
                         {isEditing && (
                             <div className="mt-2 space-y-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded text-xs transition-colors border border-slate-600"
                                >
                                    📷 Upload New Cover
                                </button>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleImageUpload}
                                />
                             </div>
                         )}
                    </div>
                    
                    <div className="flex-grow w-full">
                        <div className="flex justify-between items-start">
                            <div className="w-full">
                                {isEditing ? (
                                    <div className="space-y-4 mb-4">
                                        {/* Spotify Sync Accelerator */}
                                        <div className="bg-green-900/10 border border-green-800/40 rounded-2xl p-5 shadow-inner">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-green-400 font-black uppercase tracking-widest flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                                                    {t('detail_spotify_sync_title')}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    {syncMessage && <span className="text-[10px] text-green-400 font-bold animate-pulse">{syncMessage}</span>}
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setShowSpotifySearch(!showSpotifySearch); setSpotifyQuery(song.title); }} 
                                                        className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest transition-all ${showSpotifySearch ? 'bg-slate-700 text-slate-300' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-950'}`}
                                                    >
                                                        {showSpotifySearch ? 'Cancel' : t('detail_spotify_sync_fetch')}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {showSpotifySearch && (
                                                <div className="mt-4 animate-slide-down">
                                                    <div className="flex gap-2 mb-3">
                                                        <input 
                                                            className="flex-grow bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-green-500 outline-none font-medium"
                                                            value={spotifyQuery}
                                                            onChange={(e) => setSpotifyQuery(e.target.value)}
                                                            placeholder={t('detail_spotify_sync_placeholder')}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSpotifySearch()}
                                                        />
                                                        <button onClick={handleSpotifySearch} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest border border-slate-700">
                                                            {searchingSpotify ? '...' : t('form_search_btn')}
                                                        </button>
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar pr-1 bg-black/20 rounded-xl p-2 border border-white/5">
                                                        {spotifyResults.map(r => (
                                                            <div key={r.id} className="flex items-center gap-4 p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl cursor-pointer transition-all border border-transparent hover:border-green-800/50 group" onClick={() => applySpotifyData(r)}>
                                                                <img src={r.album.images[2]?.url || r.album.images[0]?.url} className="w-12 h-12 rounded-lg shadow-lg group-hover:scale-105 transition-transform" alt="cover"/>
                                                                <div className="flex-grow min-w-0">
                                                                    <div className="text-sm font-bold text-white truncate">{r.name}</div>
                                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">{r.album.name} • {r.album.release_date.split('-')[0]}</div>
                                                                </div>
                                                                <span className="text-[10px] text-green-500 font-black uppercase tracking-tighter border border-green-900/50 px-2 py-1 rounded bg-green-900/10 group-hover:bg-green-600 group-hover:text-white transition-colors">{t('detail_spotify_sync_apply')}</span>
                                                            </div>
                                                        ))}
                                                        {spotifyResults.length === 0 && !searchingSpotify && (
                                                            <div className="text-[10px] text-slate-500 text-center py-8 font-black uppercase tracking-widest opacity-50">Enter track title to find matches</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 block">{t('form_label_title')}</label>
                                                <input 
                                                    className="w-full text-xl font-bold bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-brand-accent outline-none"
                                                    value={editForm.title || ''}
                                                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 block">{t('form_label_version')}</label>
                                                <input 
                                                    className="w-full text-xl bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-300 focus:border-brand-accent outline-none"
                                                    value={editForm.versionLabel || ''}
                                                    onChange={(e) => setEditForm({...editForm, versionLabel: e.target.value})}
                                                    placeholder="e.g. Acoustic Ver."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 flex flex-wrap items-center gap-3">
                                            {displayData.title}
                                            {displayData.versionLabel && <span className="text-lg md:text-2xl text-slate-400 font-normal border border-slate-700 rounded-lg px-3 py-0.5">{displayData.versionLabel}</span>}
                                            <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white transition-all hover:scale-110" title="Edit Song">
                                                ✏️
                                            </button>
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {displayData.isEditorPick && <span className="px-3 py-1 bg-brand-gold text-slate-900 rounded-full text-[10px] font-black tracking-widest uppercase">EDITOR'S PICK</span>}
                                            
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-700/80 border border-slate-600 text-slate-200">
                                                <span className={`w-1.5 h-1.5 rounded-full ${getLanguageColor(displayData.language)}`}></span>
                                                {displayData.language}
                                            </span>

                                            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-[10px] font-bold border border-white/5">{displayData.projectType}</span>
                                            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-[10px] font-bold border border-white/5">{displayData.releaseDate}</span>
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 bg-slate-950/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    {['isrc', 'upc', 'spotifyId'].map(field => (
                                        <div key={field}>
                                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1.5">{field}</div>
                                            {isEditing ? (
                                                 <input 
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono focus:border-brand-accent outline-none"
                                                    value={(editForm as any)[field] || ''}
                                                    onChange={(e) => setEditForm({...editForm, [field]: e.target.value})}
                                                />
                                            ) : (
                                                <div className="font-mono text-xs text-brand-accent select-all font-bold tracking-tighter">{(displayData as any)[field] || '-'}</div>
                                            )}
                                        </div>
                                    ))}
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1.5">MusicBrainz</div>
                                        {isEditing ? (
                                            <input 
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono focus:border-brand-accent outline-none"
                                                value={editForm.musicBrainzId || ''}
                                                onChange={(e) => setEditForm({...editForm, musicBrainzId: e.target.value})}
                                                placeholder="Release Group ID"
                                            />
                                        ) : (
                                            displayData.musicBrainzId ? (
                                                <a 
                                                    href={`https://musicbrainz.org/release-group/${displayData.musicBrainzId}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="font-mono text-xs text-[#eb743b] hover:underline font-bold"
                                                >
                                                    {displayData.musicBrainzId.substring(0,8)}...
                                                </a>
                                            ) : (
                                                <div className="text-xs text-slate-600">-</div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="space-y-8">
                <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest border-l-4 border-brand-accent pl-4">{t('detail_player_header')}</h3>
                    {spotifyEmbedId && (
                        <div className="mb-6 animate-fade-in shadow-2xl">
                            <iframe 
                                style={{borderRadius: '16px'}} 
                                src={`https://open.spotify.com/embed/track/${spotifyEmbedId}?utm_source=generator&theme=0`} 
                                width="100%" 
                                height="152" 
                                frameBorder="0" 
                                allowFullScreen 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                loading="lazy">
                            </iframe>
                        </div>
                    )}
                    
                    {embedUrl ? (
                         <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 mb-6">
                            <iframe 
                                className="w-full h-full" 
                                src={embedUrl} 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen>
                            </iframe>
                        </div>
                    ) : (
                        !isEditing && <div className="p-10 bg-slate-900/50 rounded-2xl text-center text-slate-600 text-xs font-bold uppercase tracking-widest border border-dashed border-slate-700">No Video Available</div>
                    )}

                    {isEditing && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <label className="block text-[10px] text-brand-accent font-black uppercase tracking-widest mb-2">{t('form_label_youtube')}</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-brand-accent outline-none" 
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={editForm.youtubeUrl || ''}
                                onChange={(e) => setEditForm({...editForm, youtubeUrl: e.target.value})}
                            />
                        </div>
                    )}
                </div>

                <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
                     <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest border-l-4 border-brand-accent pl-4">{t('detail_links_header')}</h3>
                     {isEditing ? (
                        <div className="space-y-4">
                            {[
                                {label: t('form_label_spotify'), field: 'spotifyLink'},
                                {label: t('form_label_apple'), field: 'appleMusicLink'},
                                {label: 'Musixmatch URL', field: 'musixmatchUrl'},
                                {label: 'YouTube Music URL', field: 'youtubeMusicUrl'},
                                {label: 'MusicBrainz ID', field: 'musicBrainzId'}
                            ].map(item => (
                                <div key={item.field}>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{item.label}</label>
                                    <input 
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-brand-accent outline-none font-mono" 
                                        value={(editForm as any)[item.field] || ''}
                                        onChange={(e) => setEditForm({...editForm, [item.field]: e.target.value})}
                                        placeholder={item.field === 'musicBrainzId' ? 'Release Group UUID' : ''}
                                    />
                                </div>
                            ))}
                        </div>
                     ) : (
                        <div className="flex flex-col gap-3">
                            {[
                                {name: 'Musixmatch', url: displayData.musixmatchUrl, color: 'hover:bg-brand-accent'},
                                {name: 'YouTube Music', url: displayData.youtubeMusicUrl, color: 'hover:bg-red-600'},
                                {name: 'Spotify', url: displayData.spotifyLink, color: 'hover:bg-green-600'},
                                {name: 'Apple Music', url: displayData.appleMusicLink, color: 'hover:bg-pink-600'},
                                {name: 'MusicBrainz', url: displayData.musicBrainzId ? `https://musicbrainz.org/release-group/${displayData.musicBrainzId}` : null, color: 'hover:bg-[#eb743b]'}
                            ].map(platform => (
                                platform.url && (
                                    <a key={platform.name} href={platform.url} target="_blank" rel="noreferrer" className={`flex items-center justify-between p-4 bg-slate-700/30 border border-white/5 hover:text-white rounded-xl transition-all group ${platform.color}`}>
                                        <span className="font-bold text-sm">{platform.name}</span>
                                        <span className="text-xs opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">↗</span>
                                    </a>
                                )
                            ))}
                        </div>
                     )}
                </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
                 <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 rounded-3xl p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                         <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                                <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">✨</span>
                                Willwi AI Critique
                            </h3>
                            <button 
                                onClick={handleAiGenerate}
                                disabled={loadingAi}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50"
                            >
                                {loadingAi ? t('detail_ai_loading') : t('detail_ai_btn')}
                            </button>
                        </div>
                        <div className="bg-slate-950/60 rounded-2xl p-6 min-h-[120px] text-slate-300 leading-relaxed whitespace-pre-line border border-white/5 font-serif text-lg italic shadow-inner">
                            {aiReview ? aiReview : "Generate a professional music critique using AI based on the current metadata and lyrics."}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
                    <div className="flex gap-8 mb-8 border-b border-slate-700">
                        <button 
                            onClick={() => setStoryMode('desc')}
                            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${storyMode === 'desc' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 hover:text-white'}`}
                        >
                            {t('detail_tab_story')}
                        </button>
                         <button 
                            onClick={() => setStoryMode('maker')}
                            className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${storyMode === 'maker' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 hover:text-white'}`}
                        >
                            🎬 {t('detail_tab_maker')}
                        </button>
                    </div>

                    {storyMode === 'desc' ? (
                         isEditing ? (
                            <textarea 
                                 className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-base text-white h-48 focus:border-brand-accent outline-none shadow-inner"
                                 value={editForm.description || ''}
                                 onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                 placeholder="Tell the story behind this song..."
                            />
                        ) : (
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line text-lg font-light">
                                {displayData.description || "No description provided."}
                            </p>
                        )
                    ) : (
                        <LyricVideoMaker song={displayData} />
                    )}
                </div>

                <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest border-l-4 border-brand-accent pl-4">{t('detail_lyrics_header')}</h3>
                     {isEditing ? (
                        <textarea 
                             className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-base text-white h-[600px] font-mono leading-loose focus:border-brand-accent outline-none shadow-inner"
                             value={editForm.lyrics || ''}
                             onChange={(e) => setEditForm({...editForm, lyrics: e.target.value})}
                        />
                    ) : (
                        <div className="text-slate-300 leading-[2.5rem] whitespace-pre-wrap font-sans text-xl font-light text-center">
                            {displayData.lyrics || <span className="text-slate-600 italic uppercase text-sm tracking-widest">No lyrics available...</span>}
                        </div>
                    )}
                </div>

                 <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
                    <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest border-l-4 border-brand-accent pl-4">{t('form_label_credits')}</h3>
                    {isEditing ? (
                        <textarea 
                             className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white h-32 focus:border-brand-accent outline-none shadow-inner"
                             value={editForm.credits || ''}
                             onChange={(e) => setEditForm({...editForm, credits: e.target.value})}
                             placeholder="Producer: ... Arranger: ... "
                        />
                    ) : (
                        <p className="text-slate-400 text-sm whitespace-pre-line font-mono tracking-tight">
                            {displayData.credits || 'No credits available.'}
                        </p>
                    )}
                 </div>
            </div>
        </div>

        {isEditing && (
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 p-6 z-50 flex flex-col md:flex-row justify-between items-center px-10 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse shadow-[0_0_8px_#38bdf8]"></div>
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Editing Project: {displayData.title}</span>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => { setIsEditing(false); setSyncMessage(''); }} 
                        className="flex-1 md:flex-none px-10 py-3.5 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-black uppercase tracking-widest text-[10px]"
                    >
                        {t('form_btn_cancel')}
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="flex-1 md:flex-none px-12 py-3.5 rounded-full bg-brand-accent hover:bg-sky-400 text-slate-900 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-accent/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {isSaving ? t('form_btn_saving') : t('form_btn_save')}
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-3.5 rounded-full bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-900/50"
                        title="Delete Permanently"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

// Sub-component for the Lyric Video Maker
const LyricVideoMaker: React.FC<{ song: Song }> = ({ song }) => {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle');
    const [lineIndex, setLineIndex] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [syncData, setSyncData] = useState<{time: number, text: string}[]>([]);
    
    const lyricsLines = (song.lyrics || "").split('\n').filter(l => l.trim() !== '');

    useEffect(() => {
        let interval: any;
        if (gameState === 'playing') {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 0.1);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
    };

    const handleStart = () => {
        setGameState('playing');
        setLineIndex(0);
        setElapsedTime(0);
        setSyncData([]);
    };

    const handleSyncLine = () => {
        const currentLine = lyricsLines[lineIndex];
        setSyncData(prev => [...prev, { time: elapsedTime, text: currentLine }]);

        if (lineIndex < lyricsLines.length - 1) {
            setLineIndex(prev => prev + 1);
        } else {
            setGameState('finished');
        }
    };

    const downloadSrt = () => {
        let srtContent = "";
        syncData.forEach((item, index) => {
            const startTime = new Date(item.time * 1000).toISOString().substr(11, 12).replace('.', ',');
            const nextTimeVal = (index < syncData.length - 1) ? syncData[index+1].time : item.time + 3;
            const endTime = new Date(nextTimeVal * 1000).toISOString().substr(11, 12).replace('.', ',');
            srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${item.text}\n\n`;
        });
        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${song.title}_lyrics.srt`;
        a.click();
    };

    if (!song.lyrics) return <div className="text-slate-500 p-10 text-center uppercase tracking-widest text-xs font-bold border border-dashed border-slate-700 rounded-3xl">Please enter lyrics to use this feature.</div>;

    if (gameState === 'finished') {
        return (
            <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl animate-fade-in">
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-3">
                        <span className="text-green-500 text-xl">✔</span> RECORDING FINISHED
                    </h3>
                    <button onClick={() => setGameState('idle')} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">Start Over</button>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="aspect-video bg-black rounded-2xl flex items-center justify-center relative overflow-hidden border border-white/5 shadow-2xl">
                             <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm" style={{ backgroundImage: `url(${song.coverUrl})` }}></div>
                             <div className="relative z-10 text-center">
                                 <div className="text-6xl mb-4 transform scale-150 drop-shadow-lg">🎬</div>
                                 <div className="font-black text-white uppercase tracking-widest text-sm">Sequence Mastered</div>
                             </div>
                        </div>
                        <button 
                            onClick={() => window.alert('Coming Soon: Direct Cloud Rendering')}
                            className="w-full py-4 bg-brand-gold hover:bg-yellow-400 text-slate-900 font-black rounded-xl shadow-xl shadow-yellow-900/20 transition-all uppercase tracking-widest text-xs"
                        >
                            📥 EXPORT MP4 (BETA)
                        </button>
                    </div>

                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Master Timecode (.SRT)</h4>
                             <button onClick={downloadSrt} className="text-[10px] text-brand-accent hover:underline font-black uppercase tracking-widest">Download Data</button>
                        </div>
                        <div className="flex-grow bg-slate-900/50 rounded-2xl p-4 overflow-y-auto max-h-[300px] border border-white/5 font-mono text-[10px] custom-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-600 border-b border-slate-800">
                                        <th className="pb-3 uppercase tracking-tighter">Timecode</th>
                                        <th className="pb-3 uppercase tracking-tighter">Phrase</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {syncData.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="py-2.5 text-brand-accent font-bold pr-4">{formatTime(row.time)}</td>
                                            <td className="py-2.5 text-slate-300">{row.text}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative rounded-[2rem] overflow-hidden aspect-video flex flex-col bg-slate-950 border border-slate-700 shadow-2xl">
             <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900 z-20">
                 <div 
                    className="h-full bg-red-600 transition-all duration-100 ease-linear shadow-[0_0_10px_#dc2626]" 
                    style={{ width: gameState === 'playing' ? `${((lineIndex) / lyricsLines.length) * 100}%` : '0%' }}
                 ></div>
             </div>

             <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-20 scale-110" style={{ backgroundImage: `url(${song.coverUrl})` }}></div>
             
             <div className="relative z-20 flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent">
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">STUDIO MASTER V2.4</div>
                 {gameState === 'playing' && (
                     <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#dc2626]"></div>
                         <span className="text-red-600 font-mono font-black text-2xl tracking-tighter">{formatTime(elapsedTime)}</span>
                     </div>
                 )}
             </div>

             <div className="relative z-10 flex-grow flex flex-col items-center justify-center p-10 w-full max-w-3xl mx-auto">
                 {gameState === 'idle' ? (
                     <div className="text-center space-y-8 bg-black/60 p-12 rounded-[2.5rem] backdrop-blur-md border border-white/5 shadow-2xl">
                         <div>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Initialize Recording</h3>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Prepare audio signal for synchronization</p>
                         </div>
                         <div className="text-left text-xs text-slate-400 space-y-3 bg-slate-900/50 p-6 rounded-2xl border border-white/5 font-mono">
                             <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span> ENSURE AUDIO IS PLAYING LOCALLY</p>
                             <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span> USE 'SYNC' BUTTON FOR EACH LINE START</p>
                             <p className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span> SPACEBAR KEYBIND IS ACTIVE</p>
                         </div>
                         <button 
                            onClick={handleStart}
                            className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-full text-sm uppercase tracking-[0.2em] shadow-xl shadow-red-900/40 transform transition hover:scale-105 active:scale-95"
                        >
                            ● START SESSION
                         </button>
                     </div>
                 ) : (
                     <div className="w-full flex flex-col h-full justify-between pb-8">
                         <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] h-4 transition-all">{lineIndex > 0 ? lyricsLines[lineIndex - 1] : ''}</p>
                            
                            <div className="bg-black/60 backdrop-blur-xl px-10 py-8 rounded-[2rem] border-l-8 border-brand-accent w-full text-center shadow-2xl">
                                <p className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                                    {lyricsLines[lineIndex]}
                                </p>
                            </div>

                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] h-4 transition-all">{lineIndex < lyricsLines.length - 1 ? lyricsLines[lineIndex + 1] : 'SESSION END'}</p>
                         </div>
                         
                         <div className="w-full max-w-md mx-auto">
                            <button 
                                onClick={handleSyncLine}
                                onKeyDown={(e) => { if (e.key === ' ') handleSyncLine(); }}
                                className="w-full py-8 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-3xl text-2xl shadow-[0_20px_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all border-b-[10px] border-slate-300 active:border-b-0 active:translate-y-2 uppercase tracking-widest"
                            >
                                SYNC NOW
                            </button>
                            <div className="flex justify-between mt-4 px-4">
                                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Sequence: {lineIndex + 1} / {lyricsLines.length}</span>
                                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Buffer: Stable</span>
                            </div>
                         </div>
                     </div>
                 )}
             </div>
        </div>
    );
};

export default SongDetail;