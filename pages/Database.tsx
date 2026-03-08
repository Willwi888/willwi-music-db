import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Language, ProjectType, getLanguageColor, Song } from '../types';
import { useTranslation } from '../context/LanguageContext';

const Database: React.FC = () => {
  const { songs } = useData();
  const { t } = useTranslation();

  const filteredSongs = songs; // Assuming we want to show all for now, or keep filter logic if needed. The screenshot doesn't show filters.

  // Grouping Logic for Grid View
  const releases = useMemo(() => {
    const upcMap: { [upc: string]: Song[] } = {};
    const singles: Song[] = [];

    filteredSongs.forEach(song => {
        if (song.upc && song.upc.trim().length > 0) {
            if (!upcMap[song.upc]) {
                upcMap[song.upc] = [];
            }
            upcMap[song.upc].push(song);
        } else {
            singles.push(song);
        }
    });

    const releaseList: any[] = [];

    Object.entries(upcMap).forEach(([upc, albumSongs]) => {
        const sorted = albumSongs.sort((a,b) => a.title.localeCompare(b.title));
        releaseList.push({
            type: 'ALBUM',
            coverSong: sorted[0],
            songs: sorted,
            releaseDate: sorted[0].releaseDate,
        });
    });

    singles.forEach(song => {
        releaseList.push({
            type: 'SINGLE',
            coverSong: song,
            songs: [song],
            releaseDate: song.releaseDate,
        });
    });

    // Sort by release date descending
    releaseList.sort((a, b) => {
        const dateA = new Date(a.releaseDate || '2000-01-01').getTime();
        const dateB = new Date(b.releaseDate || '2000-01-01').getTime();
        return dateB - dateA;
    });

    return releaseList;
  }, [filteredSongs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-16">
        <div className="text-brand-gold text-xs font-bold tracking-[0.2em] uppercase mb-4">OFFICIAL CHANNEL</div>
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase mb-6">STREAMING</h1>
        <div className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-10">
          DISPLAYING ALL {filteredSongs.length} OFFICIAL RELEASES
        </div>
        <div className="border-l-2 border-slate-700 pl-4">
          <a href="https://open.spotify.com/artist/59uWw2hA38q9y0aZ1s432B" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors">SPOTIFY ARTIST PROFILE</a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {releases.map(release => (
          <Link to={`/song/${release.coverSong.id}`} key={release.coverSong.id} className="group block">
            <div className="relative aspect-square overflow-hidden bg-slate-900 mb-4">
              <img src={release.coverSong.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:opacity-40" alt={release.coverSong.title} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="px-4 py-2 border border-white text-white text-[10px] font-bold tracking-widest hover:bg-white hover:text-black transition-colors uppercase">
                  VIEW TRACKS / 查看軌跡
                </span>
              </div>
            </div>
            <h3 className="text-white font-medium text-sm truncate tracking-wide">{release.coverSong.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-slate-500 text-[10px] font-mono">{release.releaseDate?.substring(0,4) || '2025'} • </span>
              <span className="text-slate-400 text-[10px] border border-slate-700 px-1.5 py-0.5 rounded uppercase tracking-widest">{release.type}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Database;