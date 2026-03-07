import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchAllSongs, groupByAlbum } from './supabase'

const fmt = d => { if(!d)return''; try{return new Date(d).toLocaleDateString('zh-TW',{year:'numeric',month:'long',day:'numeric'})}catch{return d} }
const fmtY = d => d ? d.slice(0,4) : ''
const G='rgb(196,169,106)',Gd='rgba(196,169,106,0.10)',Gt='rgba(196,169,106,0.75)',Gf='rgba(196,169,106,0.35)'

const PAYPAL_BUTTONS = {
  sync: { id: 'UZU4M39WRFN5N', label: '手工對歌詞｜參與式創作支持', price: 'NT$320' },
  syncSmall: { id: '8NQSNPLPBVS5L', label: '手工對歌詞｜參與式創作支持', price: 'NT$100' },
  video: { id: 'CD27A99GZHXV4', label: '專屬歌詞動態影片｜創作支持', price: 'NT$2,800' },
}
const LINE_URL = 'https://lin.ee/y96nuSM'

const PLATFORMS = [
  ['Spotify','https://open.spotify.com/artist/3ascZ8Rb2KDw4QyCy29Om4'],
  ['Apple Music','https://music.apple.com/tw/artist/willwi/1798471457'],
  ['YouTube','https://www.youtube.com/@Willwi888'],
  ['YouTube Music','https://music.youtube.com/channel/UCAF8vdEOJ5sBdRuZXL61ASw'],
  ['Amazon Music','https://music.amazon.com/artists/B0DYFC8CTG/willwi'],
  ['TIDAL','https://tidal.com/artist/54856609'],
  ['KKBOX','https://www.kkbox.com/tw/tc/artist/0pXOA9-SBBMNjAaaKS'],
]

/* ══════════ APP ══════════ */
export default function App() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState('home')
  const [selAlbum, setSelAlbum] = useState(null)
  const [selSong, setSelSong] = useState(null)
  const [syncSong, setSyncSong] = useState(null)

  useEffect(() => {
    fetchAllSongs().then(d => { setSongs(d); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const albums = useMemo(() => groupByAlbum(songs), [songs])
  const goHome = () => { setPage('home'); setSelAlbum(null); setSelSong(null); setSyncSong(null) }
  const openAlbum = a => { setSelAlbum(a); setPage('album'); window.scrollTo(0,0) }
  const startSync = s => { setSyncSong(s); setPage('sync-intro'); setSelSong(null); window.scrollTo(0,0) }

  return (
    <div style={{fontFamily:"'DM Sans','Noto Sans TC',sans-serif",background:'#0a0a0a',color:'#ede9e1',minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Noto+Sans+TC:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a}
        ::selection{background:rgba(196,169,106,0.22)}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        input::placeholder{color:#4a4845}
      `}</style>

      <Header page={page} goHome={goHome} setPage={setPage} count={songs.length} />

      <div style={{flex:1}}>
        {page==='home' && <Home albums={albums} loading={loading} error={error} openAlbum={openAlbum} />}
        {page==='album' && selAlbum && <AlbumDetail album={selAlbum} goHome={goHome} openSong={s=>setSelSong(s)} startSync={startSync} />}
        {page==='about' && <AboutPage />}
        {page==='support' && <SupportPage />}
        {page==='sync-intro' && <SyncIntro song={syncSong} onStart={()=>setPage('sync')} />}
        {page==='sync' && <SyncPlay song={syncSong} onDone={()=>setPage('done')} />}
        {page==='done' && <SyncDone song={syncSong} onBack={goHome} />}
      </div>

      {selSong && <SongModal song={selSong} onClose={()=>setSelSong(null)} onSync={()=>startSync(selSong)} />}

      <Footer />
    </div>
  )
}

/* ══════════ HEADER ══════════ */
function Header({ page, goHome, setPage, count }) {
  return (
    <header style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,10,10,0.92)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,0.05)',height:58,display:'flex',alignItems:'center'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={goHome}>
          <div style={{width:28,height:28,borderRadius:'50%',border:`1.5px solid ${G}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:G}}>W</div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:400,letterSpacing:3,color:'#ede9e1',lineHeight:1.2}}>Willwi</div>
            <div style={{fontSize:8,letterSpacing:3,textTransform:'uppercase',color:'#4a4845',fontWeight:300}}>Music Database</div>
          </div>
        </div>
        <nav style={{display:'flex',gap:18,alignItems:'center'}}>
          {[['home','作品'],['about','關於'],['support','支持']].map(([k,l])=>(
            <span key={k} onClick={()=>{if(k==='home')goHome();else setPage(k)}} style={{fontSize:11,color:page===k?Gt:'#8a8680',letterSpacing:1.5,fontWeight:300,cursor:'pointer',transition:'color 0.2s'}}>{l}</span>
          ))}
          <a href="https://willwi.com" target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'#8a8680',letterSpacing:1.5,fontWeight:300,textDecoration:'none'}}>官網</a>
        </nav>
        {count>0 && <span style={{fontSize:10,color:'#4a4845',letterSpacing:1,fontWeight:300,display:'none'}}>{count}</span>}
      </div>
    </header>
  )
}

/* ══════════ HOME ══════════ */
function Home({ albums, loading, error, openAlbum }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const cats = [...new Set(albums.map(a=>a.release_category).filter(Boolean))]
  const list = albums.filter(a => {
    const s = q.toLowerCase()
    const ms = !s || a.title.toLowerCase().includes(s) || a.tracks.some(t=>(t.title||'').toLowerCase().includes(s)||(t.isrc||'').toLowerCase().includes(s))
    return ms && (cat==='all'||a.release_category===cat)
  })

  return (
    <>
      <section style={{maxWidth:600,margin:'0 auto',padding:'56px 24px 32px',textAlign:'center',animation:'fadeUp 0.8s ease both'}}>
        <p style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:20,fontWeight:300,color:'rgba(237,233,225,0.7)',letterSpacing:3,lineHeight:1.8}}>我不是在做一個工具。</p>
        <p style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:20,fontWeight:400,color:'rgba(237,233,225,0.88)',letterSpacing:3,lineHeight:1.8}}>我是在留一個地方。</p>
        <div style={{width:32,height:1,background:G,margin:'20px auto',opacity:0.3}} />
        <p style={{fontSize:12.5,lineHeight:2.1,color:'rgba(237,233,225,0.38)',fontWeight:300,letterSpacing:0.4}}>歌詞必須手工對時，不是因為我做不到自動化，而是因為一首歌值得被人坐下來陪完。</p>
        <p style={{fontSize:12.5,lineHeight:2.1,color:'rgba(237,233,225,0.5)',fontWeight:300,letterSpacing:0.5,fontStyle:'italic',marginTop:12}}>不是為了被記得，而是為了記得。<br/>我不等誰回來。我只是留一盞燈。</p>
      </section>

      <div style={{position:'sticky',top:58,zIndex:90,background:'rgba(10,10,10,0.88)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.04)',padding:'8px 0'}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:8,padding:'6px 10px',flex:'1 1 160px',minWidth:120}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="搜尋..." value={q} onChange={e=>setQ(e.target.value)} style={{background:'transparent',border:'none',outline:'none',color:'#ede9e1',fontSize:12,fontFamily:'inherit',width:'100%',fontWeight:300}}/>
            {q&&<button onClick={()=>setQ('')} style={{background:'none',border:'none',color:'#4a4845',fontSize:9,cursor:'pointer',padding:0}}>✕</button>}
          </div>
          <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
            {['all',...cats].map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{background:cat===c?Gd:'rgba(255,255,255,0.02)',border:`1px solid ${cat===c?G:'rgba(255,255,255,0.04)'}`,borderRadius:16,padding:'3px 11px',fontSize:9.5,color:cat===c?Gt:'#8a8680',cursor:'pointer',fontFamily:'inherit',letterSpacing:0.5,fontWeight:300,transition:'all 0.2s'}}>{c==='all'?'全部':c}</button>
            ))}
          </div>
          <span style={{fontSize:9.5,color:'#4a4845',fontWeight:300,marginLeft:'auto',letterSpacing:0.5}}>{list.length} releases</span>
        </div>
      </div>

      <main style={{maxWidth:1100,margin:'0 auto',padding:'20px 24px 60px',flex:1}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'70px 0'}}>
            <div style={{width:80,height:1.5,margin:'0 auto 12px',background:`linear-gradient(90deg,transparent,${G},transparent)`,backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite',borderRadius:1}} />
            <p style={{fontSize:11,color:'#4a4845',letterSpacing:2,fontWeight:300}}>讀取中...</p>
          </div>
        ) : error ? (
          <p style={{textAlign:'center',padding:'70px 0',fontSize:13,color:'#a07050'}}>無法連線：{error}</p>
        ) : list.length===0 ? (
          <p style={{textAlign:'center',padding:'60px 0',fontSize:12,color:'#4a4845'}}>找不到作品</p>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:16}}>
            {list.map((a,i)=><AlbumCard key={a.upc||a.tracks[0]?.id||i} a={a} i={i} onClick={()=>openAlbum(a)} />)}
          </div>
        )}
      </main>
    </>
  )
}

function AlbumCard({ a, i, onClick }) {
  const [h, setH] = useState(false)
  const [err, setErr] = useState(false)
  const img = !err && a.cover_url
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{background:'#111',borderRadius:7,overflow:'hidden',border:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',transition:'transform 0.25s,box-shadow 0.25s',transform:h?'translateY(-3px)':'none',boxShadow:h?'0 14px 28px rgba(0,0,0,0.3)':'none',animation:`fadeUp 0.4s ease ${Math.min(i*0.04,0.7)}s both`}}>
      <div style={{position:'relative',paddingBottom:'100%',overflow:'hidden'}}>
        {img ? <img src={a.cover_url} alt="" onError={()=>setErr(true)} loading="lazy" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s',transform:h?'scale(1.05)':'scale(1)'}} />
        : <div style={{position:'absolute',inset:0,background:'linear-gradient(145deg,#141312,#0b0a09)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:26,color:'rgba(196,169,106,0.06)'}}>♪</span></div>}
        <span style={{position:'absolute',bottom:6,left:6,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(6px)',padding:'2px 7px',borderRadius:3,fontSize:8,color:'rgba(255,255,255,0.5)',letterSpacing:0.8,textTransform:'uppercase',fontWeight:400}}>{a.release_category}</span>
        {a.tracks.length>1 && <span style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.55)',padding:'1px 6px',borderRadius:3,fontSize:8,color:'rgba(196,169,106,0.6)'}}>{a.tracks.length}</span>}
      </div>
      <div style={{padding:'10px 11px 12px'}}>
        <div style={{fontSize:12,fontWeight:400,color:'#ede9e1',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
        <div style={{fontSize:9,color:'#4a4845',fontWeight:300,marginTop:2}}>{fmtY(a.release_date)} · {a.release_category}</div>
        {a.upc && <div style={{fontSize:7.5,color:'#2a2826',fontFamily:'monospace',marginTop:2}}>UPC {a.upc}</div>}
      </div>
    </div>
  )
}

/* ══════════ ALBUM DETAIL ══════════ */
function AlbumDetail({ album, goHome, openSong, startSync }) {
  const [err, setErr] = useState(false)
  const img = !err && album.cover_url
  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:'28px 24px 80px',animation:'fadeUp 0.5s ease both'}}>
      <button onClick={goHome} style={{color:'#8a8680',fontSize:11,letterSpacing:1,fontWeight:300,marginBottom:20,cursor:'pointer',background:'none',border:'none',fontFamily:'inherit'}}>← 返回作品</button>
      <div style={{display:'flex',gap:22,flexWrap:'wrap',marginBottom:28}}>
        <div style={{width:180,height:180,borderRadius:8,overflow:'hidden',flexShrink:0,background:'#0e0e0e'}}>
          {img ? <img src={album.cover_url} alt="" onError={()=>setErr(true)} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          : <div style={{width:'100%',height:'100%',background:'linear-gradient(145deg,#181614,#0c0b0a)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:42,color:'rgba(196,169,106,0.06)'}}>♪</span></div>}
        </div>
        <div style={{flex:1,minWidth:200,display:'flex',flexDirection:'column',justifyContent:'center',gap:5}}>
          <span style={{fontSize:9.5,color:Gt,letterSpacing:3,fontWeight:300,textTransform:'uppercase'}}>{album.release_category}</span>
          <h2 style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:26,fontWeight:300,color:'#ede9e1',letterSpacing:1,lineHeight:1.3}}>{album.title}</h2>
          <p style={{fontSize:11.5,color:Gt,letterSpacing:2,fontWeight:300}}>Willwi 陳威兒</p>
          {album.release_date && <p style={{fontSize:10.5,color:'#4a4845',fontWeight:300}}>{fmt(album.release_date)}</p>}
          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:4}}>
            {album.upc && <span style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:3,padding:'2px 7px',fontSize:8,color:'#4a4845',fontFamily:'monospace'}}>UPC: {album.upc}</span>}
            <span style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:3,padding:'2px 7px',fontSize:8,color:'#4a4845'}}>{album.tracks.length} 首</span>
          </div>
        </div>
      </div>
      <h3 style={{fontSize:9.5,color:'#4a4845',letterSpacing:3,textTransform:'uppercase',marginBottom:12,fontWeight:400}}>曲目 Tracks</h3>
      {album.tracks.map((t,i) => {
        const hasLyrics = t.lyrics && t.lyrics.trim()
        return (
          <div key={t.id} onClick={()=>openSong(t)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 10px',borderBottom:'1px solid rgba(255,255,255,0.03)',cursor:'pointer',borderRadius:4,transition:'background 0.15s',animation:`fadeUp 0.3s ease ${Math.min(i*0.03,0.5)}s both`}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{fontSize:9.5,color:'#2e2c2a',fontFamily:'monospace',width:20,textAlign:'right',flexShrink:0}}>{String(i+1).padStart(2,'0')}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12.5,color:'#ede9e1',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
              <div style={{display:'flex',gap:8,marginTop:1}}>
                {t.language && <span style={{fontSize:8.5,color:'#4a4845'}}>{t.language}</span>}
                {t.isrc && <span style={{fontSize:8,color:'#333',fontFamily:'monospace'}}>ISRC: {t.isrc}</span>}
              </div>
            </div>
            {hasLyrics && <span style={{fontSize:8,color:'#4a4845',border:'1px solid rgba(255,255,255,0.05)',borderRadius:3,padding:'2px 8px',letterSpacing:0.5}}>歌詞</span>}
            {t.is_interactive_active && <span style={{fontSize:8,color:Gt,border:`1px solid ${Gd}`,borderRadius:3,padding:'2px 8px',letterSpacing:0.5}}>可對時</span>}
          </div>
        )
      })}
    </div>
  )
}

/* ══════════ SONG MODAL ══════════ */
function SongModal({ song, onClose, onSync }) {
  const [err, setErr] = useState(false)
  const img = !err && song.cover_url
  const hasLyrics = song.lyrics && song.lyrics.trim()
  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'fadeIn 0.2s',overflowY:'auto'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#131210',borderRadius:12,maxWidth:540,width:'100%',maxHeight:'85vh',overflowY:'auto',border:'1px solid rgba(255,255,255,0.06)',position:'relative',animation:'fadeUp 0.3s ease'}}>
        <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'rgba(255,255,255,0.05)',border:'none',borderRadius:'50%',width:28,height:28,color:'#555',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:10}}>✕</button>
        <div style={{display:'flex',gap:18,padding:'24px 24px 18px',flexWrap:'wrap'}}>
          <div style={{width:130,height:130,borderRadius:8,flexShrink:0,overflow:'hidden',background:'#0e0e0e'}}>
            {img ? <img src={song.cover_url} alt="" onError={()=>setErr(true)} style={{width:'100%',height:'100%',objectFit:'cover'}} />
            : <div style={{width:'100%',height:'100%',background:'linear-gradient(145deg,#181614,#0c0b0a)',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:32,color:'rgba(196,169,106,0.06)'}}>♪</span></div>}
          </div>
          <div style={{flex:1,minWidth:150,display:'flex',flexDirection:'column',justifyContent:'center',gap:4}}>
            <h2 style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:20,fontWeight:300,color:'#ede9e1',letterSpacing:1,lineHeight:1.3}}>{song.title}</h2>
            <p style={{fontSize:11,color:Gt,fontWeight:300,letterSpacing:2}}>Willwi 陳威兒</p>
            {song.release_date && <p style={{fontSize:10,color:'#4a4845',fontWeight:300}}>{fmt(song.release_date)}</p>}
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:3}}>
              {song.language && <span style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:3,padding:'1px 7px',fontSize:8,color:'#4a4845',fontFamily:'monospace'}}>{song.language}</span>}
              {song.isrc && <span style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:3,padding:'1px 7px',fontSize:8,color:'#4a4845',fontFamily:'monospace'}}>ISRC: {song.isrc}</span>}
            </div>
          </div>
        </div>
        {hasLyrics && (
          <div style={{padding:'0 24px 18px',borderTop:'1px solid rgba(255,255,255,0.04)',paddingTop:18}}>
            <h4 style={{fontSize:9,color:'#4a4845',letterSpacing:3,textTransform:'uppercase',marginBottom:10,fontWeight:400}}>歌詞 Lyrics</h4>
            <pre style={{fontSize:12.5,lineHeight:2,color:'rgba(237,233,225,0.6)',fontFamily:"'DM Sans','Noto Sans TC',sans-serif",whiteSpace:'pre-wrap',fontWeight:300}}>{song.lyrics}</pre>
          </div>
        )}
        {hasLyrics && song.is_interactive_active && (
          <div style={{padding:'0 24px 22px',textAlign:'center'}}>
            <button onClick={onSync} style={{background:Gd,border:`1px solid ${G}`,borderRadius:6,padding:'8px 24px',color:Gt,fontSize:11,letterSpacing:1.5,fontWeight:300,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>開始對時</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════ ABOUT ══════════ */
function AboutPage() {
  const items = [
    ['關於手工對時','有些歌，不該被匆匆略過。\n你會坐下來，陪它走一段。慢一點也沒關係。\n你只是在尋找，那一句該落在哪裡。'],
    ['最好的版本','你現在做的，就是最好的版本。\n因為它是真實的。'],
    ['時間','時間不是免費的。這裡也不是。\n不是因為創作有價，而是因為時間有重量。\n如果這個網站要存在、要被維護、要被好好對待，它必須被尊重。\n你付費的不是功能，而是你願意為一首歌留下的時間。'],
    ['版權','歌曲與歌詞仍屬原創者。\n這不是授權，也不是買賣。只是一次共同的完成。'],
    ['謝謝','我不打分數。我不比較。\n每一個完成的版本，我都心懷感謝。\n謝謝你，願意坐下來陪一首歌。'],
  ]
  return (
    <section style={{maxWidth:580,margin:'0 auto',padding:'52px 28px 80px',animation:'fadeUp 0.6s ease both'}}>
      <h2 style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:24,fontWeight:300,color:'rgba(237,233,225,0.85)',letterSpacing:3,marginBottom:32}}>關於這裡</h2>
      {items.map(([t,p],i)=>(
        <div key={i} style={{paddingBottom:20,marginBottom:20,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          <h3 style={{fontSize:12,color:Gt,letterSpacing:2,fontWeight:400,marginBottom:8}}>{t}</h3>
          <p style={{fontSize:12.5,lineHeight:2.1,color:'rgba(237,233,225,0.45)',fontWeight:300,whiteSpace:'pre-line',letterSpacing:0.3}}>{p}</p>
        </div>
      ))}
    </section>
  )
}

/* ══════════ SUPPORT / PAYMENT ══════════ */
function SupportPage() {
  return (
    <section style={{maxWidth:560,margin:'0 auto',padding:'52px 28px 80px',animation:'fadeUp 0.6s ease both'}}>
      <h2 style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:24,fontWeight:300,color:'rgba(237,233,225,0.85)',letterSpacing:3,marginBottom:12}}>支持</h2>
      <p style={{fontSize:12.5,lineHeight:2,color:'rgba(237,233,225,0.4)',fontWeight:300,marginBottom:32,letterSpacing:0.3}}>
        不是因為創作有價，而是因為時間有重量。<br/>
        你付費的不是功能，而是你願意為一首歌留下的時間。
      </p>

      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {[PAYPAL_BUTTONS.syncSmall, PAYPAL_BUTTONS.sync, PAYPAL_BUTTONS.video].map(b => (
          <a key={b.id} href={`https://www.paypal.com/ncp/payment/${b.id}`} target="_blank" rel="noopener noreferrer"
            style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:8,textDecoration:'none',transition:'all 0.2s',cursor:'pointer'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(196,169,106,0.2)';e.currentTarget.style.background='rgba(196,169,106,0.04)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.05)';e.currentTarget.style.background='rgba(255,255,255,0.02)'}}>
            <div>
              <div style={{fontSize:13,color:'#ede9e1',fontWeight:400,marginBottom:3}}>{b.price}</div>
              <div style={{fontSize:10,color:'#8a8680',fontWeight:300,letterSpacing:0.5}}>{b.label}</div>
            </div>
            <span style={{fontSize:10,color:Gt,border:`1px solid ${Gd}`,borderRadius:4,padding:'4px 12px',letterSpacing:1}}>PayPal</span>
          </a>
        ))}
      </div>

      <div style={{marginTop:28,textAlign:'center'}}>
        <a href={LINE_URL} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'#8a8680',letterSpacing:1.5,fontWeight:300,textDecoration:'none',transition:'color 0.2s'}}>
          LINE 聯繫 →
        </a>
      </div>

      <div style={{marginTop:36,padding:'16px 18px',background:'rgba(255,255,255,0.02)',borderRadius:8,border:'1px solid rgba(255,255,255,0.04)'}}>
        <p style={{fontSize:10,color:'#4a4845',letterSpacing:2,marginBottom:8,fontWeight:400}}>下載與權利說明</p>
        <p style={{fontSize:11,lineHeight:1.9,color:'rgba(237,233,225,0.32)',fontWeight:300,letterSpacing:0.3}}>
          你可以下載你完成的歌詞影片。那是你陪這首歌走過的紀錄。<br/>
          但下載，不代表任何著作權轉移。歌曲、歌詞、錄音的權利，仍屬原創作者所有。<br/>
          這裡不是授權平台，也不提供轉售、商用或二次授權。
        </p>
      </div>
    </section>
  )
}

/* ══════════ SYNC FLOW ══════════ */
function SyncIntro({ song, onStart }) {
  return (
    <section style={{maxWidth:500,margin:'0 auto',padding:'72px 28px',textAlign:'center',animation:'fadeUp 0.6s ease both'}}>
      <p style={{fontSize:11,color:Gf,letterSpacing:3,marginBottom:8,fontWeight:300}}>歌詞對時</p>
      <h2 style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:22,fontWeight:300,color:'rgba(237,233,225,0.85)',letterSpacing:2,marginBottom:36}}>{song?.title}</h2>
      <div style={{maxWidth:380,margin:'0 auto',textAlign:'left'}}>
        <p style={{fontSize:13,lineHeight:2.2,color:'rgba(237,233,225,0.48)',fontWeight:300}}>在你開始之前，我想先說一件事。</p>
        <p style={{fontSize:13,lineHeight:2.2,color:'rgba(237,233,225,0.48)',fontWeight:300,marginTop:12}}>接下來的時間，沒有再來一次，沒有修到完美。<br/>你會慢一點，快一點，有些地方對不準，有些地方會歪。</p>
        <p style={{fontSize:13,lineHeight:2.2,color:'rgba(237,233,225,0.62)',fontWeight:400,marginTop:12}}>那是你真的在這首歌裡的證據。</p>
      </div>
      <button onClick={onStart} style={{marginTop:40,background:Gd,border:`1px solid ${G}`,borderRadius:6,padding:'9px 28px',color:Gt,fontSize:12,letterSpacing:2,fontWeight:300,cursor:'pointer',fontFamily:'inherit'}}>如果你準備好了，我們就開始</button>
    </section>
  )
}

function SyncPlay({ song, onDone }) {
  const lines = (song?.lyrics||'').split('\n').filter(l=>l.trim())
  const [cur, setCur] = useState(0)
  if(!lines.length) return <p style={{textAlign:'center',padding:'80px',color:'#4a4845',fontSize:12}}>此歌曲尚無歌詞</p>
  const tap = () => { if(cur<lines.length-1) setCur(cur+1); else setTimeout(onDone,400) }

  return (
    <section style={{maxWidth:500,margin:'0 auto',padding:'56px 24px 80px',textAlign:'center',cursor:'pointer',animation:'fadeIn 0.4s'}} onClick={tap}>
      <p style={{fontSize:10,color:'#4a4845',letterSpacing:3,marginBottom:4,fontWeight:300}}>{song?.title}</p>
      <p style={{fontSize:9,color:'#333',letterSpacing:2,marginBottom:36}}>{cur+1} / {lines.length}</p>
      <div style={{minHeight:90,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 12px'}}>
        <p key={cur} style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:20,fontWeight:300,color:'rgba(237,233,225,0.85)',letterSpacing:2,lineHeight:1.8,animation:'fadeUp 0.3s ease both'}}>{lines[cur]}</p>
      </div>
      <p style={{marginTop:40,fontSize:11,color:'rgba(237,233,225,0.28)',fontWeight:300,lineHeight:1.9,letterSpacing:0.4}}>
        你不需要急，這首歌不會走。<br/>在你覺得「對了」的時候，輕輕點一下。
      </p>
      <div style={{marginTop:24,display:'flex',gap:2.5,justifyContent:'center',flexWrap:'wrap'}}>
        {lines.map((_,i)=><div key={i} style={{width:i<cur?10:i===cur?14:6,height:1.5,borderRadius:1,background:i<cur?G:i===cur?'rgba(196,169,106,0.4)':'rgba(255,255,255,0.04)',transition:'all 0.3s'}} />)}
      </div>
    </section>
  )
}

function SyncDone({ song, onBack }) {
  return (
    <section style={{maxWidth:480,margin:'0 auto',padding:'72px 28px',textAlign:'center',animation:'fadeUp 0.6s ease both'}}>
      <div style={{width:40,height:1,background:G,margin:'0 auto 24px',opacity:0.4}} />
      <p style={{fontFamily:"'Cormorant Garamond','Noto Sans TC',serif",fontSize:18,fontWeight:300,color:'rgba(237,233,225,0.7)',letterSpacing:2,lineHeight:2}}>
        這不是一個完美的版本。<br/>這是一個屬於你的版本。
      </p>
      <p style={{fontSize:13,color:'rgba(237,233,225,0.38)',fontWeight:300,marginTop:16}}>你願意把它留下來，真好。</p>
      <div style={{marginTop:32,display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        <a href={`https://www.paypal.com/ncp/payment/${PAYPAL_BUTTONS.video.id}`} target="_blank" rel="noopener noreferrer"
          style={{background:Gd,border:`1px solid ${G}`,borderRadius:6,padding:'8px 22px',color:Gt,fontSize:11,letterSpacing:1.5,fontWeight:300,textDecoration:'none',fontFamily:'inherit'}}>
          下載歌詞影片（{PAYPAL_BUTTONS.video.price}）
        </a>
        <button onClick={onBack} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:6,padding:'8px 22px',color:'#8a8680',fontSize:11,letterSpacing:1.5,fontWeight:300,cursor:'pointer',fontFamily:'inherit'}}>回到作品</button>
      </div>
      <div style={{marginTop:36,padding:'14px 18px',background:'rgba(255,255,255,0.02)',borderRadius:8,border:'1px solid rgba(255,255,255,0.04)',textAlign:'left'}}>
        <p style={{fontSize:10,color:'#4a4845',letterSpacing:2,marginBottom:8}}>下載與權利說明</p>
        <p style={{fontSize:10.5,lineHeight:1.9,color:'rgba(237,233,225,0.3)',fontWeight:300}}>
          你可以下載你完成的歌詞影片。那是你陪這首歌走過的紀錄。<br/>
          但下載，不代表任何著作權轉移。歌曲、歌詞、錄音的權利，仍屬原創作者所有。
        </p>
      </div>
    </section>
  )
}

/* ══════════ FOOTER ══════════ */
function Footer() {
  return (
    <footer style={{borderTop:'1px solid rgba(255,255,255,0.04)',padding:'28px 24px',textAlign:'center'}}>
      <p style={{fontSize:10,color:'#4a4845',letterSpacing:2,marginBottom:4,fontWeight:300}}>© Willwi Music · 陳威兒</p>
      <p style={{fontSize:10.5,color:'#222',fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',letterSpacing:1}}>As always, enjoy and take care.</p>
      <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:12,flexWrap:'wrap'}}>
        {PLATFORMS.map(([n,u])=><a key={n} href={u} target="_blank" rel="noopener noreferrer" style={{fontSize:9,color:'#3a3836',letterSpacing:1.2,fontWeight:300,textDecoration:'none'}}>{n}</a>)}
      </div>
    </footer>
  )
}
