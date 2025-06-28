import React, { useEffect, useRef, useState } from "react";
import { detectPitch } from "pitchy";

export default function PitchDetection({ contestant, song, onResult }) {
  const [status, setStatus] = useState("Premi START per avviare la rilevazione");
  const [score, setScore] = useState(null);
  const [listening, setListening] = useState(false);
  const audioRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  async function start() {
    setScore(null);
    setStatus("Ascolto microfono...");
    setListening(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(2048, 1, 1);
    source.connect(processor);
    processor.connect(audioCtx.destination);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const [pitch, clarity] = detectPitch(input, audioCtx.sampleRate);
      if (clarity > 0.95 && pitch > 70 && pitch < 1500) {
        chunksRef.current.push(pitch);
      }
    };
    audioRef.current = { audioCtx, processor };
  }

  function stop() {
    setListening(false);
    setStatus("Elaborazione...");
    if (audioRef.current) {
      audioRef.current.processor.disconnect();
      audioRef.current.audioCtx.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    const pitches = chunksRef.current;
    chunksRef.current = [];
    // Finta media per demo
    const valid = pitches.filter(x => x > 0);
    const score = valid.length ? Math.min(100, (valid.length * 2)).toFixed(1) : "0";
    setScore(score);
    setStatus("Risultato: " + score);
    setTimeout(() => onResult(Number(score)), 1000);
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.9)", color: "#fff", zIndex: 99,
      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
    }}>
      <h2>Analisi Intonazione</h2>
      <p>{contestant?.name} – {song}</p>
      <div style={{ fontSize: 28, marginBottom: 16 }}>{status}</div>
      {score && <div style={{ fontSize: 44, color: "#ff0" }}>Punteggio: {score}</div>}
      {!listening &&
        <button onClick={start} style={{ fontSize: 22, marginRight: 10 }}>START</button>}
      {listening &&
        <button onClick={stop} style={{ fontSize: 22 }}>STOP</button>}
      <button style={{ fontSize: 18, marginTop: 24 }} onClick={() => onResult(score || 0)}>Annulla</button>
    </div>
  );
}