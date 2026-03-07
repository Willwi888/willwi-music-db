import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://rzxqseimxhbokrhcdjbi.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(url, key)

export async function fetchAllSongs() {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .neq('id', 'GLOBAL_SYSTEM_CONFIG')
    .order('release_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

/** Group songs by UPC into albums */
export function groupByAlbum(songs) {
  const albums = {}
  const singles = []
  
  for (const s of songs) {
    const upc = (s.upc || '').trim()
    if (!upc) {
      singles.push(s)
      continue
    }
    if (!albums[upc]) {
      albums[upc] = {
        upc,
        title: '',
        cover_url: s.cover_url,
        release_date: s.release_date,
        release_category: s.release_category || 'Single',
        tracks: []
      }
    }
    albums[upc].tracks.push(s)
    // Use the first track's cover if album doesn't have one yet
    if (s.cover_url && !albums[upc].cover_url) {
      albums[upc].cover_url = s.cover_url
    }
  }
  
  // Determine album title from tracks
  for (const upc in albums) {
    const a = albums[upc]
    // Find track without version suffix as the title track
    const titleTrack = a.tracks.find(t => 
      !t.title.includes(' - ') && !t.title.includes('Instrumental') && !t.title.includes('Version')
    ) || a.tracks[0]
    
    if (a.tracks.length >= 5) {
      // For large albums, use a different naming approach
      // Check if all tracks share a common title prefix
      const firstTitle = a.tracks[0].title.split(' - ')[0]
      const allSamePrefix = a.tracks.every(t => t.title.startsWith(firstTitle))
      a.title = allSamePrefix ? firstTitle : titleTrack.title
      a.release_category = 'Album'
    } else if (a.tracks.length >= 2) {
      a.title = titleTrack.title
      a.release_category = a.tracks.length >= 4 ? 'EP' : 'Single'
    } else {
      a.title = titleTrack.title
    }
    
    // Sort tracks by ISRC (usually sequential)
    a.tracks.sort((x, y) => (x.isrc || '').localeCompare(y.isrc || ''))
  }
  
  // Convert to array and add singles as individual "albums"
  const result = Object.values(albums)
  for (const s of singles) {
    result.push({
      upc: '',
      title: s.title,
      cover_url: s.cover_url,
      release_date: s.release_date,
      release_category: 'Single',
      tracks: [s]
    })
  }
  
  // Sort by release date descending
  result.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
  return result
}
