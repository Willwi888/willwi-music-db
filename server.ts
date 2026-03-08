import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data.json");

// Default Data
let globalData = {
  songs: [
    {
      id: '1',
      title: '再愛一次',
      versionLabel: 'Original',
      coverUrl: 'https://picsum.photos/id/26/400/400',
      language: 'Mandarin',
      projectType: 'Indie',
      releaseDate: '2023-10-15',
      isEditorPick: true,
      isrc: 'TW-A01-23-00001',
      spotifyId: '4uLU6hMCjMI75M1A2tKZBC', 
      lyrics: "走在 熟悉的街角\n回憶 像是海浪拍打\n每一個呼吸\n都是你的氣息\n再愛一次\n能不能\n再愛一次",
      description: "一首關於失去與重逢的抒情搖滾。",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
      musixmatchUrl: "https://www.musixmatch.com/artist/Willwi",
      youtubeMusicUrl: "https://music.youtube.com/channel/WillwiID",
      spotifyLink: "https://open.spotify.com/artist/3ascZ8Rb2KDw4QyCy29Om4",
      appleMusicLink: "https://music.apple.com/us/artist/willwi/1798471457"
    },
    {
      id: '2',
      title: '泡麵之歌',
      coverUrl: 'https://picsum.photos/id/192/400/400',
      language: 'Japanese',
      projectType: 'PaoMien',
      releaseDate: '2024-01-20',
      isEditorPick: false,
      isrc: 'TW-A01-24-00002',
      description: "深夜肚子餓時的即興創作。",
      musixmatchUrl: "https://www.musixmatch.com/artist/Willwi",
      youtubeMusicUrl: "https://music.youtube.com/channel/WillwiID",
      spotifyLink: "https://open.spotify.com/artist/3ascZ8Rb2KDw4QyCy29Om4",
      appleMusicLink: "https://music.apple.com/us/artist/willwi/1798471457"
    }
  ],
  settings: {
    interactiveOtp: "2026",
    latestVideoUrl: "",
    countdownTargetDate: "",
    isPlayerEnabled: true
  }
};

// Load data from file if exists
if (fs.existsSync(DATA_FILE)) {
  try {
    const fileContent = fs.readFileSync(DATA_FILE, "utf-8");
    globalData = JSON.parse(fileContent);
  } catch (e) {
    console.error("Failed to load data.json", e);
  }
}

const saveData = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(globalData, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // --- API Routes ---

  // Get all data
  app.get("/api/data", (req, res) => {
    res.json(globalData);
  });

  // Update settings
  app.post("/api/settings", (req, res) => {
    globalData.settings = { ...globalData.settings, ...req.body };
    saveData();
    res.json(globalData.settings);
  });

  // Songs CRUD
  app.get("/api/songs", (req, res) => {
    res.json(globalData.songs);
  });

  app.post("/api/songs", (req, res) => {
    const song = req.body;
    const index = globalData.songs.findIndex((s: any) => s.id === song.id);
    if (index >= 0) {
      globalData.songs[index] = song;
    } else {
      globalData.songs.push(song);
    }
    saveData();
    res.json({ success: true });
  });

  app.delete("/api/songs/:id", (req, res) => {
    globalData.songs = globalData.songs.filter((s: any) => s.id !== req.params.id);
    saveData();
    res.json({ success: true });
  });

  app.post("/api/songs/bulk", (req, res) => {
    globalData.songs = req.body;
    saveData();
    res.json({ success: true });
  });

  app.delete("/api/songs", (req, res) => {
    globalData.songs = [];
    saveData();
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
