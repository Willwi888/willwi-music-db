import { Song } from '../types';

const API_URL = '/api/songs';

export const dbService = {
  async getAllSongs(): Promise<Song[]> {
    const res = await fetch(API_URL);
    if (!res.ok) return [];
    return await res.json();
  },

  async getSong(id: string): Promise<Song | undefined> {
    const songs = await this.getAllSongs();
    return songs.find(s => s.id === id);
  },

  async addSong(song: Song): Promise<void> {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(song)
    });
  },

  async updateSong(song: Song): Promise<void> {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(song)
    });
  },

  async deleteSong(id: string): Promise<void> {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  },

  async bulkAdd(songs: Song[]): Promise<void> {
    await fetch(`${API_URL}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(songs)
    });
  },

  async clearAllSongs(): Promise<void> {
    await fetch(API_URL, { method: 'DELETE' });
  }
};