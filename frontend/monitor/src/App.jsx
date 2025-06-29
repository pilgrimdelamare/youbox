import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:4000";

const VIDEO_FILES = {
  start: "/scenes/start.mp4",
  presentazione: "/scenes/present-contestant.mp4",
  estrazione: "/scenes/draw-song.mp4",
  titolo: "/scenes/show-song.mp4",
  "show-song": "/scenes/show-song.mp4",
  votazione: "/scenes/voting.mp4",
  valutazione: "/scenes/pitch.mp4",
  punteggio: "/scenes/final-score.mp4",
  classifica: "/scenes/start.mp4",
  "classifica-tavoli": "/scenes/classificatavoli.mp4"
};

const OVERLAY_FADE = 400;
const CROSSFADE = 600;
const OVERLAY_DELAY = 400;

const socket = io(BACKEND_URL);

function getVideoSrc(scene, drawnSong) {
  if (scene.name === "esibizione" && drawnSong)
    return `${BACKEND_URL}/songs/${encodeURIComponent(drawnSong.file)}`;
  if (VIDEO_FILES[scene.name])
    return `${BACKEND_URL}${VIDEO_FILES[scene.name]}`;
  return "";
}

function getOverlayContent(scene, drawnSong, currentContestant) {
  if (scene.name === "presentazione" && currentContestant) {
    return (
      <>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 2, color: "#fff", textShadow: "0 0 8px #000" }}>
          STA PER CANTARE...
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, marginTop: 10, color: "#fff", textShadow: "0 0 12px #000" }}>
          {currentContestant.name.toUpperCase()}
        </div>
      </>
    );
  } else if ((scene.name === "titolo" || scene.name === "show-song") && drawnSong) {
    return (
      <>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 2, color: "#fff", textShadow: "0 0 8px #000" }}>
          {drawnSong.author.toUpperCase()}
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, marginTop: 10, color: "#fff", textShadow: "0 0 12px #000" }}>
          {drawnSong.title.toUpperCase()}
        </div>
      </>
    );
  } else if (scene.name === "estrazione") {
    return (
      <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: 2, color: "#fff", textShadow: "0 0 12px #000" }}>
        ESTRAZIONE BRANO
      </div>
    );
  } else if (scene.name === "votazione") {
    return (
      <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: 2, color: "#fff", textShadow: "0 0 12px #000" }}>
        VOTA ORA
      </div>
    );
  } else if (scene.name === "punteggio" && scene.data) {
    const total = (Number(scene.data.public) || 0) + (Number(scene.data.intonation) || 0);
    return (
      <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: 2, color: "#fff", textShadow: "0 0 12px #000" }}>
        PUNTEGGIO: {total}
      </div>
    );
  }
  return null;
}

function overlayKey(scene, drawnSong, currentContestant) {
  if (scene.name === "presentazione" && currentContestant)
    return `presentazione-${currentContestant.name}`;
  if ((scene.name === "titolo" || scene.name === "show-song") && drawnSong)
    return `song-${drawnSong.author}-${drawnSong.title}`;
  if (scene.name === "estrazione") return "estrazione";
  if (scene.name === "votazione") return "votazione";
  if (scene.name === "punteggio" && scene.data)
    return `punteggio-${scene.data.public || 0}-${scene.data.intonation || 0}`;
  return scene.name || "none";
}

const overlayStyle = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textTransform: "uppercase",
  fontFamily: '"Montserrat", "Segoe UI", "Arial", sans-serif',
  letterSpacing: 2,
  zIndex: 10,
  pointerEvents: "none",
  color: "#fff"
};

export default function App() {
  const [scene, setScene] = useState({ name: "standby", data: null });
  const [drawnSong, setDrawnSong] = useState(null);
  const [currentContestant, setCurrentContestant] = useState(null);
  const [videoError, setVideoError] = useState(null);

  const [prevScene, setPrevScene] = useState(null);
  const [prevDrawnSong, setPrevDrawnSong] = useState(null);
  const [prevContestant, setPrevContestant] = useState(null);
  const [isCrossfading, setIsCrossfading] = useState(false);

  const [overlayContent, setOverlayContent] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayFadingIn, setOverlayFadingIn] = useState(false);
  const [currentOverlayKey, setCurrentOverlayKey] = useState("");
  const overlayTimeoutRef = useRef();

  // ===== MODIFICA CHIRURGICA: Inizio (1/3) =====
  const [reactions, setReactions] = useState([]);
  // ===== MODIFICA CHIRURGICA: Fine (1/3) =====

  useEffect(() => {
    const newOverlay = getOverlayContent(scene, drawnSong, currentContestant);
    const newKey = overlayKey(scene, drawnSong, currentContestant);

    if (currentOverlayKey && newKey !== currentOverlayKey) {
      setOverlayFadingIn(false);
      setTimeout(() => {
        setOverlayVisible(false);
        setTimeout(() => {
          setOverlayContent(newOverlay);
          setCurrentOverlayKey(newKey);
          if (newOverlay) {
            setOverlayVisible(true);
            setTimeout(() => {
              setOverlayFadingIn(true);
            }, 10);
          }
        }, 50);
      }, OVERLAY_FADE);
    } else if (!currentOverlayKey && newOverlay) {
      setOverlayContent(newOverlay);
      setCurrentOverlayKey(newKey);
      setOverlayVisible(true);
      setTimeout(() => setOverlayFadingIn(true), 10);
    }
  }, [scene, drawnSong, currentContestant]);

  useEffect(() => {
    socket.on("scene", newScene => {
      if (scene.name !== newScene.name) {
        setPrevScene(scene);
        setPrevDrawnSong(drawnSong);
        setPrevContestant(currentContestant);
        setIsCrossfading(true);

        setOverlayFadingIn(false);
        setTimeout(() => setOverlayVisible(false), OVERLAY_FADE);

        if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = setTimeout(() => {
          const nextOverlay = getOverlayContent(newScene, drawnSong, currentContestant);
          const nextKey = overlayKey(newScene, drawnSong, currentContestant);
          setOverlayContent(nextOverlay);
          setCurrentOverlayKey(nextKey);
          if (nextOverlay) {
            setOverlayVisible(true);
            setTimeout(() => setOverlayFadingIn(true), 10);
          }
        }, CROSSFADE + OVERLAY_DELAY);

        setTimeout(() => setIsCrossfading(false), CROSSFADE);
      }
      setScene(newScene);
      setVideoError(null);
    });
    socket.on("draw-song", setDrawnSong);
    socket.on("current-contestant", setCurrentContestant);

    // ===== MODIFICA CHIRURGICA: Inizio (2/3) =====
    const handleReaction = (reaction) => {
        const newReaction = {
            id: Date.now() + Math.random(),
            type: reaction.type,
            style: {
                position: 'absolute',
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                fontSize: '4rem',
                animation: 'fadeAndFloat 2s forwards',
                zIndex: 20,
                textShadow: '0 0 10px black'
            }
        };
        setReactions(prev => [...prev, newReaction]);

        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== newReaction.id));
        }, 2000);
    };

    socket.on('reaction', handleReaction);
    // ===== MODIFICA CHIRURGICA: Fine (2/3) =====

    return () => {
      socket.off("scene");
      socket.off("draw-song");
      socket.off("current-contestant");
      socket.off('reaction', handleReaction); // Non dimenticare di pulire il nuovo listener
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, [scene, drawnSong, currentContestant]);

  useEffect(() => {
    if (scene.name === "estrazione" && !drawnSong) {
      fetch(`${BACKEND_URL}/api/draw-song/random`)
        .then(res => res.json())
        .then(setDrawnSong);
    }
    if (scene.name !== "estrazione" && scene.name !== "titolo" && scene.name !== "show-song" && scene.name !== "esibizione") {
      setDrawnSong(null);
    }
  }, [scene.name]);

  function handleVideoError(e) {
    setVideoError("Errore nel caricamento del video: " + getVideoSrc(scene, drawnSong));
    console.error("Video error:", e);
  }

  if (scene.name === "standby") {
    return <div style={{ width: "100vw", height: "100vh", background: "#000" }} />;
  }

  const videoSrc = getVideoSrc(scene, drawnSong);
  const loopVideo = scene.name !== "esibizione";
  const prevVideoSrc = prevScene ? getVideoSrc(prevScene, prevDrawnSong) : null;
  const prevLoop = prevScene && prevScene.name !== "esibizione";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        position: "fixed",
        left: 0,
        top: 0,
        overflow: "hidden",
        fontFamily: '"Montserrat", "Segoe UI", "Arial", sans-serif'
      }}
    >
      <link href="https://fonts.googleapis.com/css?family=Montserrat:700,900&display=swap" rel="stylesheet" />
      
      {/* ===== MODIFICA CHIRURGICA: Inizio (3/3) ===== */}
      <style>
          {`
              @keyframes fadeAndFloat {
                  0% {
                      transform: translateY(0) scale(1);
                      opacity: 1;
                  }
                  100% {
                      transform: translateY(-100px) scale(1.5);
                      opacity: 0;
                  }
              }
          `}
      </style>
      {reactions.map(reaction => (
          <div key={reaction.id} style={reaction.style}>
              {reaction.type === 'heart' ? '❤️' : '🍅'}
          </div>
      ))}
      {/* ===== MODIFICA CHIRURGICA: Fine (3/3) ===== */}

      {isCrossfading && prevVideoSrc && (
        <video
          src={prevVideoSrc}
          autoPlay
          loop={prevLoop}
          controls={false}
          style={{
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
            background: "#000",
            display: "block",
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 1,
            opacity: isCrossfading ? 1 : 0,
            transition: `opacity ${CROSSFADE}ms`
          }}
        />
      )}
      {videoSrc && !videoError && (
        <video
          key={videoSrc}
          src={videoSrc}
          autoPlay
          loop={loopVideo}
          controls={false}
          style={{
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
            background: "#000",
            display: "block",
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 2,
            opacity: isCrossfading ? 0 : 1,
            transition: `opacity ${CROSSFADE}ms`
          }}
          onError={handleVideoError}
        />
      )}
      {videoError && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
          color: "red", background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, zIndex: 100
        }}>
          {videoError}
        </div>
      )}

      {overlayVisible && overlayContent && (
        <div style={{
          ...overlayStyle,
          opacity: overlayFadingIn ? 1 : 0,
          transition: `opacity ${OVERLAY_FADE}ms`
        }}>
          {overlayContent}
        </div>
      )}
    </div>
  );
}