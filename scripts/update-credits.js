// 批量更新所有歌曲的 Credits 欄位
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rzxqseimxhbokrhcdjbi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eHFzZWlteGhib2tyaGNkamJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTQxMjAsImV4cCI6MjA4MDUzMDEyMH0.8SD3g8sj-3XHMX3e7u8xHOxuAWVwhG-6lcvAKP3VME0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 固定的 Credits 模板
const FIXED_CREDITS = `© 2025 Willwi Music
℗ 2025 Willwi Music

Main Artist : Willwi 陳威兒
Composer : Tsung Yu Chen
Lyricist : Tsung Yu Chen
Arranger : Willwi
Producer : Will Chen

Recording Engineer | Will Chen
Mixing Engineer | Will Chen
Mastering Engineer | Will Chen

Recording Studio | Willwi Studio, Taipei
Label | Willwi Music`;

async function updateAllCredits() {
  console.log('🎵 開始批量更新 Credits...\n');
  
  // 1. 取得所有歌曲
  const { data: songs, error: fetchError } = await supabase
    .from('songs')
    .select('id, title');
  
  if (fetchError) {
    console.error('❌ 取得歌曲失敗:', fetchError.message);
    return;
  }
  
  console.log(`📋 找到 ${songs.length} 首歌曲\n`);
  
  // 2. 批量更新
  let success = 0;
  let failed = 0;
  
  for (const song of songs) {
    const { error: updateError } = await supabase
      .from('songs')
      .update({ 
        credits: FIXED_CREDITS,
        updated_at: new Date().toISOString()
      })
      .eq('id', song.id);
    
    if (updateError) {
      console.log(`❌ ${song.title}: 更新失敗 - ${updateError.message}`);
      failed++;
    } else {
      console.log(`✅ ${song.title}: 已更新`);
      success++;
    }
  }
  
  console.log('\n========================================');
  console.log(`🎉 完成！成功: ${success} / 失敗: ${failed}`);
  console.log('========================================');
}

updateAllCredits();
