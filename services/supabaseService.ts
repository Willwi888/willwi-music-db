import { supabase, Song, Transaction } from './supabaseClient';

// ==================== SONGS ====================

// 公開：讀取所有歌曲（唯讀）
export async function getAllSongs(): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .order('release_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
  return data || [];
}

// 公開：讀取單首歌曲
export async function getSongById(id: string): Promise<Song | null> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching song:', error);
    return null;
  }
  return data;
}

// 公開：讀取互動啟用的歌曲
export async function getInteractiveSongs(): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('is_interactive_active', true)
    .order('release_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching interactive songs:', error);
    return [];
  }
  return data || [];
}

// 公開：依語言篩選歌曲
export async function getSongsByLanguage(language: string): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('language', language)
    .order('release_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching songs by language:', error);
    return [];
  }
  return data || [];
}

// 公開：搜尋歌曲
export async function searchSongs(query: string): Promise<Song[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .or(`title.ilike.%${query}%,isrc.ilike.%${query}%,upc.ilike.%${query}%`)
    .order('release_date', { ascending: false });
  
  if (error) {
    console.error('Error searching songs:', error);
    return [];
  }
  return data || [];
}

// ==================== ADMIN OPERATIONS ====================
// 這些操作需要管理員權限（透過 RLS 或 service_role key）

// 管理員：新增歌曲
export async function createSong(song: Partial<Song>): Promise<Song | null> {
  const { data, error } = await supabase
    .from('songs')
    .insert([{
      ...song,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating song:', error);
    throw new Error(error.message);
  }
  return data;
}

// 管理員：更新歌曲
export async function updateSong(id: string, updates: Partial<Song>): Promise<Song | null> {
  const { data, error } = await supabase
    .from('songs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating song:', error);
    throw new Error(error.message);
  }
  return data;
}

// 管理員：刪除歌曲
export async function deleteSong(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting song:', error);
    throw new Error(error.message);
  }
  return true;
}

// ==================== TRANSACTIONS ====================

// 管理員：讀取所有交易
export async function getAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return data || [];
}

// 建立交易記錄
export async function createTransaction(transaction: Partial<Transaction>): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      ...transaction,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating transaction:', error);
    throw new Error(error.message);
  }
  return data;
}

// 更新交易狀態
export async function updateTransactionStatus(id: string, status: string, accessCode?: string): Promise<boolean> {
  const updates: any = { status };
  if (accessCode) {
    updates.access_code = accessCode;
  }
  
  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating transaction:', error);
    throw new Error(error.message);
  }
  return true;
}

// ==================== REAL-TIME SUBSCRIPTION ====================

// 訂閱歌曲變更（即時同步）
export function subscribeSongs(callback: (songs: Song[]) => void) {
  // 初始載入
  getAllSongs().then(callback);
  
  // 即時訂閱
  const subscription = supabase
    .channel('songs_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'songs' },
      () => {
        getAllSongs().then(callback);
      }
    )
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}

// ==================== BACKUP & RESTORE ====================

// 導出所有資料為 JSON
export async function exportAllData(): Promise<string> {
  const songs = await getAllSongs();
  const transactions = await getAllTransactions();
  
  const exportData = {
    exportDate: new Date().toISOString(),
    songs,
    transactions
  };
  
  return JSON.stringify(exportData, null, 2);
}

// 從 JSON 匯入資料（管理員）
export async function importSongsFromJson(jsonData: string): Promise<{ success: number; failed: number }> {
  const data = JSON.parse(jsonData);
  const songs = data.songs || data;
  
  let success = 0;
  let failed = 0;
  
  for (const song of songs) {
    try {
      // 檢查是否已存在
      const existing = await getSongById(song.id);
      if (existing) {
        await updateSong(song.id, song);
      } else {
        await createSong(song);
      }
      success++;
    } catch (e) {
      console.error('Failed to import song:', song.title, e);
      failed++;
    }
  }
  
  return { success, failed };
}
