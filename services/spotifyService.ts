import { Song } from "../types";

// 注意：在正式生產環境中，Client Secret 不應直接暴露在前端代碼中。
// 建議透過後端 Proxy 處理 Token 交換。
// 但為了符合目前的純前端架構需求，我們將在此處直接使用。
const CLIENT_ID = 'a64ec262abd745eeaf4db5faf597d19b';
const CLIENT_SECRET = '67657590909b48afbf1fd45e09400b6b';

let accessToken = '';
let tokenExpiration = 0;

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    id: string;
    name: string;
    release_date: string;
    images: { url: string }[];
    external_ids?: { upc?: string; ean?: string };
  };
  external_ids: { isrc?: string };
  external_urls: { spotify: string };
  uri: string;
  track_number?: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  release_date: string;
  total_tracks: number;
  images: { url: string }[];
  external_urls: { spotify: string };
  external_ids?: { upc?: string; ean?: string };
}

export const getSpotifyToken = async () => {
  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Spotify Token Error: ${response.status}`, errorText);
        throw new Error(`Token fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiration = Date.now() + ((data.expires_in - 60) * 1000);
    return accessToken;
  } catch (error) {
    console.error("Spotify Auth Critical Error:", error);
    return null;
  }
};

export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=8`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.tracks?.items || [];
  } catch (error) {
    console.error("Spotify Search Error:", error);
    return [];
  }
};

export const getSpotifyAlbum = async (albumId: string): Promise<SpotifyAlbum | null> => {
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Spotify Album Fetch Error:", error);
    return null;
  }
};

export const searchSpotifyAlbums = async (query: string): Promise<SpotifyAlbum[]> => {
  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.albums?.items || [];
  } catch (error) {
    console.error("Spotify Album Search Error:", error);
    return [];
  }
};

export const getSpotifyAlbumTracks = async (albumId: string): Promise<SpotifyTrack[]> => {
  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!albumResponse.ok) return [];
    const albumData = await albumResponse.json();
    const simplifiedTracks = albumData.items || [];

    if (simplifiedTracks.length === 0) return [];

    const trackIds = simplifiedTracks.map((t: any) => t.id).join(',');
    const fullTracksResponse = await fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!fullTracksResponse.ok) return simplifiedTracks;
    const fullTracksData = await fullTracksResponse.json();
    return fullTracksData.tracks || [];
  } catch (error) {
    console.error("Spotify Album Tracks Error:", error);
    return [];
  }
};