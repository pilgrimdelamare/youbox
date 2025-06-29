const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

let scene = { name: "standby", data: null };
let contestants = [];
let currentContestant = null;
let drawnSong = null;
let drawnSongs = [];
let intonationScore = 0;
let publicVote = 0;

const songsDir = path.join(__dirname, "../frontend/monitor/public/songs");

function parseSongFile(file) {
  const base = file.replace(/\.mp4$/i, "");
  const sep = base.indexOf(" - ");
  if (sep === -1) return { file, author: "?", title: base };
  return { file, author: base.slice(0, sep), title: base.slice(sep + 3) };
}

function getAllSongs() {
  try {
    if (fs.existsSync(songsDir)) {
      return fs.readdirSync(songsDir).filter(f => f.endsWith(".mp4")).map(parseSongFile);
    }
  } catch(e) { console.error("Errore lettura cartella canzoni:", e); }
  return [];
}

app.use("/scenes", express.static(path.join(__dirname, "../frontend/monitor/public/scenes")));
app.use("/songs", express.static(songsDir));

app.post("/api/scene", (req, res) => {
  const newScene = req.body;

  if (newScene.name === 'start' && scene.name !== 'standby') {
      if (currentContestant) {
          const finalScore = publicVote + intonationScore;
          const contestantIndex = contestants.findIndex(c => c.id === currentContestant.id);
          if (contestantIndex !== -1) {
              contestants[contestantIndex].score = finalScore;
              console.log(`Punteggio finale di ${finalScore} salvato per ${currentContestant.name}.`);
          }
      }
      
      publicVote = 0;
      intonationScore = 0;
      console.log('Punteggi azzerati per il prossimo cantante.');
      
      io.emit('public-vote', publicVote);
      io.emit('intonation-score', intonationScore);
      io.emit('contestants', contestants);
  }
  
  // ===== MODIFICA DEFINITIVA: Inizio (Server) =====
  // Se la scena inviata dalla dashboard è "classifica",
  // ordiniamo i concorrenti per punteggio e alleghiamo i dati.
  if (newScene.name === 'classifica') {
      const sortedContestants = [...contestants].sort((a, b) => (b.score || 0) - (a.score || 0));
      newScene.data = { contestants: sortedContestants };
  }
  // ===== MODIFICA DEFINITIVA: Fine (Server) =====

  scene = newScene;
  scene.actionId = `${newScene.name}-${Date.now()}`;

  // Correzione per la scena 'punteggio' che ha un suffisso numerico
  if (newScene.name.startsWith('punteggio')) {
      scene.data = {
          public: publicVote,
          intonation: intonationScore
      };
  }
  
  io.emit("scene", scene);
  res.json({ ok: true });
});

app.get("/api/contestants", (req, res) => res.json(contestants));
app.post("/api/contestants", (req, res) => {
  contestants = req.body;
  io.emit("contestants", contestants);
  res.json({ ok: true });
});

app.post("/api/current-contestant", (req, res) => {
  currentContestant = req.body;
  io.emit("current-contestant", currentContestant);
  res.json({ ok: true });
});

app.get("/api/draw-song/random", (req, res) => {
  const allSongs = getAllSongs();
  if (!allSongs.length) return res.status(500).json({error: "Nessuna canzone trovata"});
  let available = allSongs.filter(s => !drawnSongs.find(d => d.file === s.file));
  if (available.length === 0) {
    drawnSongs = [];
    available = allSongs;
  }
  const song = available[Math.floor(Math.random() * available.length)];
  drawnSong = song;
  drawnSongs.push(song);
  io.emit("draw-song", song);
  res.json(song);
});

app.post("/api/force-song", (req, res) => {
  const { file } = req.body;
  const song = getAllSongs().find(s => s.file === file);
  if (!song) return res.status(404).json({ error: "Song not found" });
  drawnSong = song;
  io.emit("draw-song", song);
  res.json({ ok: true });
});

io.on("connection", socket => {
  socket.emit("scene", scene);
  socket.emit("draw-song", drawnSong);
  socket.emit("current-contestant", currentContestant);
  socket.emit("contestants", contestants);
  socket.emit("intonation-score", intonationScore);
  socket.emit("public-vote", publicVote);

  socket.on("punteggio", (data) => {
    intonationScore = data.score;
    io.emit("intonation-score", intonationScore);
  });
  
  socket.on("force-intonation", (score) => {
    intonationScore = parseInt(score, 10) || 0;
    io.emit("intonation-score", intonationScore);
  });
  
  socket.on("force-public-vote", (score) => {
    publicVote = parseInt(score, 10) || 0;
    io.emit("public-vote", publicVote);
  });

  socket.on('submit-vote', (voteData) => {
    if (voteData && typeof voteData.rating === 'number') {
      const pointsToAdd = voteData.rating * 10;
      publicVote += pointsToAdd;
      io.emit("public-vote", publicVote);
    }
  });

  socket.on('reaction', (reactionData) => {
    io.emit('reaction', reactionData);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});