import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

function Overlay({ scene, currentContestant, drawnSong }) {
  if (!scene) return null;
  if (scene.name === "presentazione" && currentContestant) {
    return (
      <div className="overlay">
        STA PER CANTARE... <b>{currentContestant.name}</b>
      </div>
    );
  }
  if ((scene.name === "titolo" || scene.name === "show-song") && drawnSong) {
    return (
      <div className="overlay">
        {drawnSong.author} - <b>{drawnSong.title}</b>
      </div>
    );
  }
  if (scene.name === "votazione") {
    return <div className="overlay">VOTA ORA!</div>;
  }
  if (scene.name === "estrazione") {
    return <div className="overlay">ESTRAZIONE IN CORSO...</div>;
  }
  return null;
}

export default function App() {
  const [scene, setScene] = useState(null);
  const [currentContestant, setCurrentContestant] = useState(null);
  const [drawnSong, setDrawnSong] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("scene", sc => {
      setScene(sc);
      if (sc.name !== "presentazione") setCurrentContestant(null);
      if (sc.name !== "titolo" && sc.name !== "show-song") setDrawnSong(null);
    });

    socket.on("current-contestant", data => setCurrentContestant(data));
    socket.on("draw-song", data => setDrawnSong(data));

    // All'avvio, carica la scena corrente dal backend
    fetch("http://localhost:4000/api/scene")
      .then(r => r.json())
      .then(sc => setScene(sc));

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#222", color: "#fff", position: "relative" }}>
      <h1 style={{ textAlign: "center" }}>Monitor Karaoke</h1>
      <div style={{ position: "absolute", top: 50, left: 0, width: "100%" }}>
        <Overlay scene={scene} currentContestant={currentContestant} drawnSong={drawnSong} />
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 0, width: "100%", textAlign: "center" }}>
        <small>Scena attuale: {scene ? scene.name : "N/A"}</small>
      </div>
    </div>
  );
}