import React, { useState } from "react";

const API_URL = "http://localhost:4000/api/scene";

const contestantsList = [
  { name: "Mario Rossi" },
  { name: "Lucia Bianchi" }
];

const songsList = [
  { author: "Queen", title: "Bohemian Rhapsody", file: "Queen - Bohemian Rhapsody.mp4" },
  { author: "Abba", title: "Mamma Mia", file: "Abba - Mamma Mia.mp4" }
];

export default function Dashboard() {
  const [scene, setScene] = useState("start");
  const [selectedContestant, setSelectedContestant] = useState(contestantsList[0]);
  const [selectedSong, setSelectedSong] = useState(songsList[0]);

  // Cambia scena e invia dati corretti
  const changeScene = async (sceneName) => {
    let data = null;
    if (sceneName === "presentazione") {
      data = { contestant: selectedContestant };
    }
    if (sceneName === "show-song" || sceneName === "titolo") {
      data = { song: selectedSong };
    }
    const payload = { scene: { name: sceneName, data } };
    setScene(sceneName);
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    console.log("Risposta dal backend:", json);
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>Dashboard Karaoke</h1>
      <div>
        <label>Scena: </label>
        <select value={scene} onChange={e => changeScene(e.target.value)}>
          <option value="start">Start</option>
          <option value="presentazione">Presentazione</option>
          <option value="show-song">Show Song</option>
          <option value="titolo">Titolo</option>
        </select>
      </div>
      <div>
        <label>Concorrente: </label>
        <select value={selectedContestant.name} onChange={e => setSelectedContestant(contestantsList.find(c => c.name === e.target.value))}>
          {contestantsList.map(c => <option key={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label>Canzone: </label>
        <select value={selectedSong.title} onChange={e => setSelectedSong(songsList.find(s => s.title === e.target.value))}>
          {songsList.map(s => <option key={s.title}>{s.title}</option>)}
        </select>
      </div>
      <button onClick={() => changeScene(scene)}>Invia scena</button>
    </div>
  );
}