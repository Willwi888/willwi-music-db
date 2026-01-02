import { createClient } from '@supabase/supabase-js'
import { Song } from '../types'

// 從環境變數讀取 Supabase 設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數！請檢查 .env 設定')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Supabase 資料庫服務
export const supabaseService = {
  // 取得所有歌曲（按發行日期排序）
  async getAllSongs(): Promise<Song[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('releaseDate', { ascending: false })
      
      if (error) {
        console.error('❌ Supabase 讀取失敗:', error)
        return []
      }
      
      console.log('✅ 成功從 Supabase 讀取', data?.length || 0, '首歌曲')
      return data || []
    } catch (error) {
      console.error('❌ 讀取歌曲失敗:', error)
      return []
    }
  },

  // 取得單一歌曲
  async getSong(id: string): Promise<Song | undefined> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data || undefined
    } catch (error) {
      console.error('❌ 讀取歌曲失敗:', error)
      return undefined
    }
  },

  // 新增歌曲
  async addSong(song: Song): Promise<void> {
    try {
      const { error } = await supabase
        .from('songs')
        .insert([song])
      
      if (error) throw error
      console.log('✅ 成功新增歌曲:', song.title)
    } catch (error) {
      console.error('❌ 新增歌曲失敗:', error)
      throw error
    }
  },

  // 更新歌曲
  async updateSong(song: Song): Promise<void> {
    try {
      const { error } = await supabase
        .from('songs')
        .update(song)
        .eq('id', song.id)
      
      if (error) throw error
      console.log('✅ 成功更新歌曲:', song.title)
    } catch (error) {
      console.error('❌ 更新歌曲失敗:', error)
      throw error
    }
  },

  // 刪除歌曲
  async deleteSong(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      console.log('✅ 成功刪除歌曲')
    } catch (error) {
      console.error('❌ 刪除歌曲失敗:', error)
      throw error
    }
  },

  // 批次新增
  async bulkAdd(songs: Song[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('songs')
        .insert(songs)
      
      if (error) throw error
      console.log('✅ 成功批次新增', songs.length, '首歌曲')
    } catch (error) {
      console.error('❌ 批次新增失敗:', error)
      throw error
    }
  },

  // 清空所有歌曲
  async clearAllSongs(): Promise<void> {
    try {
      // Delete all songs - using neq with impossible UUID to match all rows
      // This is a workaround since Supabase requires a filter condition
      const { error } = await supabase
        .from('songs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Dummy UUID to match all rows
      
      if (error) throw error
      console.log('✅ 成功清空資料庫')
    } catch (error) {
      console.error('❌ 清空失敗:', error)
      throw error
    }
  },

  // 🔥 即時訂閱資料變化（可選功能）
  subscribeToSongs(callback: (payload: { 
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Song | null;
    old: Song | null;
  }) => void) {
    console.log('🔔 開始監聽 Supabase 即時更新')
    return supabase
      .channel('songs_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'songs' },
        (payload) => {
          console.log('🔔 資料庫更新！', payload)
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Song | null,
            old: payload.old as Song | null
          })
        }
      )
      .subscribe()
  }
}
