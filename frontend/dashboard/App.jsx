import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:4000";

const SCENES = [
  "start",
  "presentazione",
  "estrazione",
  "titolo",
  "esibizione",
  "votazione",
  "valutazione",
  "punteggio",
  "classifica-tavoli"
];
const CLASSIFICA = "classifica";

const socket = io(BACKEND_URL);

// --- Componenti UI Riutilizzabili ---
const Panel = ({ children, style }) => ( <div style={{ width: "100%", background: "#183569", borderRadius: 10, padding: 18, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", ...style }}> {children} </div> );
const Title = ({ children }) => ( <h3 style={{ marginTop: 0, color: "#ffe066", textAlign: "left" }}> {children} </h3> );
const Input = ({...props}) => ( <input {...props} style={{ fontSize: 18, borderRadius: 6, border: "1px solid #ffe066", padding: "6px 10px", background: "#f5f5f51a", color: "#ffe066", flex: 1 }} /> );

export default function App() {
  const [contestants, setContestants] = useState([]);
  const [currentContestantIndex, setCurrentContestantIndex] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [scene, setScene] = useState({ name: "standby", data: null });
  const [drawnSong, setDrawnSong] = useState(null);
  const [contestantInput, setContestantInput] = useState("");
  const [songs, setSongs] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [intonationScore, setIntonationScore] = useState(0);
  const [manualIntonationScore, setManualIntonationScore] = useState("");
  const [publicVote, setPublicVote] = useState(0);
  const [manualPublicVote, setManualPublicVote] = useState("");

  const nextId = useRef(1);
  const editInputRef = useRef();

  useEffect(() => {
    socket.on("scene", setScene);
    socket.on("draw-song", setDrawnSong);
    socket.on("contestants", (list) => { if (Array.isArray(list)) setContestants(list.map((c, i) => ({ ...c, id: c.id ?? i, score: c.score }))) });
    socket.on("intonation-score", setIntonationScore);
    socket.on("public-vote", setPublicVote);

    fetch(`${BACKEND_URL}/api/contestants`).then(res => res.json()).then(list => { if (Array.isArray(list)) setContestants(list.map((c, i) => ({ ...c, id: c.id ?? i, score: c.score }))) });
    fetchSongs();
    return () => {
      socket.off("scene");
      socket.off("draw-song");
      socket.off("contestants");
      socket.off("intonation-score");
      socket.off("public-vote");
    };
  }, []);

  // Questo useEffect ora ha il solo compito di inviare i dati al server
  // quando cambiano, senza calcolare nulla.
  useEffect(() => {
    if (contestants.length === 0) return;

    let sceneName = sceneIndex < SCENES.length ? SCENES[sceneIndex] : CLASSIFICA;
    const currentContestant = contestants[currentContestantIndex] || null;

    // Aggiungiamo il suffisso dinamico per le scene legate al concorrente
    if (['estrazione', 'titolo', 'esibizione', 'votazione', 'valutazione', 'punteggio'].includes(sceneName)) {
      sceneName = `${sceneName}-${currentContestantIndex + 1}`;
    }
    
    let body = { name: sceneName, data: null };
    
    if (sceneName.startsWith('punteggio')) {
      body.data = { public: publicVote, intonation: intonationScore };
    }

    fetch(`${BACKEND_URL}/api/scene`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    
    if (sceneName !== CLASSIFICA && currentContestant) {
        fetch(`${BACKEND_URL}/api/current-contestant`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(currentContestant) });
    }
  }, [currentContestantIndex, sceneIndex, contestants]);

  function fetchSongs() {
    fetch(`${BACKEND_URL}/songs`).then(res => res.text()).then(html => {
        const matches = Array.from(html.matchAll(/href="([^"]+\.mp4)"/g));
        setSongs(matches.map(m => decodeURIComponent(m[1])));
      });
  }

  function addContestant() {
    if (contestantInput.trim() === "") return;
    const newContestant = { id: nextId.current++, name: contestantInput.trim(), score: null };
    const updated = [ ...contestants, newContestant ];
    setContestants(updated);
    fetch(`${BACKEND_URL}/api/contestants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    setContestantInput("");
  }

  function editContestant(index, newName) {
    const updated = contestants.map((c, i) => i === index ? { ...c, name: newName } : c );
    setContestants(updated);
    fetch(`${BACKEND_URL}/api/contestants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    setEditingIndex(null); setEditingName("");
  }

  function removeContestant(index) {
    if (index === currentContestantIndex) return;
    const updated = contestants.filter((_, i) => i !== index);
    setContestants(updated);
    fetch(`${BACKEND_URL}/api/contestants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    if (index < currentContestantIndex) setCurrentContestantIndex(i => Math.max(0, i - 1));
    setEditingIndex(null); setEditingName("");
  }

  function moveContestant(index, direction) {
    if (index === currentContestantIndex) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= contestants.length || newIndex === currentContestantIndex) return;
    const updated = [...contestants];
    const [removed] = updated.splice(index, 1);
    updated.splice(newIndex, 0, removed);
    setContestants(updated);
    fetch(`${BACKEND_URL}/api/contestants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    if (currentContestantIndex > index && currentContestantIndex <= newIndex) setCurrentContestantIndex(i => i - 1);
    else if (currentContestantIndex < index && currentContestantIndex >= newIndex) setCurrentContestantIndex(i => i + 1);
    setEditingIndex(null); setEditingName("");
  }

  function nextScene() {
    if (contestants.length === 0) return;
    if (sceneIndex >= SCENES.length -1) { // Quando siamo all'ultima scena di un cantante
      if (currentContestantIndex < contestants.length - 1) { 
        // Passa al prossimo concorrente e ricomincia dalla prima scena
        setCurrentContestantIndex(i => i + 1); 
        setSceneIndex(0); 
      } else {
        // Se era l'ultimo concorrente, vai alla classifica finale
        setSceneIndex(SCENES.length); 
      }
    } else {
      // Altrimenti, vai semplicemente alla scena successiva
      setSceneIndex(i => i + 1);
    }
    setEditingIndex(null); setEditingName("");
  }

  function changeScene(name) {
    if (name === CLASSIFICA) { 
      setSceneIndex(SCENES.length); 
      return; 
    }
    const idx = SCENES.indexOf(name);
    if (idx !== -1) {
      setSceneIndex(idx);
    }
  }

  function selectContestant(index) { setCurrentContestantIndex(index); setSceneIndex(0); }
  function forceSong(file) { fetch(`${BACKEND_URL}/api/force-song`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file }) }); }
  
  function handleForceIntonation(e) {
    e.preventDefault();
    if (manualIntonationScore.trim() !== "") {
        socket.emit("force-intonation", parseInt(manualIntonationScore, 10));
        setManualIntonationScore("");
    }
  }

  function handleForcePublicVote(e) {
    e.preventDefault();
    if (manualPublicVote.trim() !== "") {
        socket.emit("force-public-vote", parseInt(manualPublicVote, 10));
        setManualPublicVote("");
    }
  }

  useEffect(() => { if (editingIndex !== null && editInputRef.current) editInputRef.current.focus(); }, [editingIndex]);

  return (
    <div style={{ width: "100vw", height: "100vh", minHeight: "100vh", minWidth: "100vw", boxSizing: "border-box", padding: 0, margin: 0, display: "flex", flexDirection: "column", fontFamily: "sans-serif", background: "#134074" }}>
      <div style={{ display: "flex", flex: "1 1 auto", minHeight: 0, flexWrap: "wrap", width: "100%", boxSizing: "border-box" }}>
        <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", padding: "3vw 2vw", gap: 16, boxSizing: 'border-box' }}>
          <Panel>
            <Title>Scenari</Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, width: "100%" }}>
              {[...SCENES, CLASSIFICA].map((name) => {
                const isClassificaCantanti = name === CLASSIFICA;
                const label = isClassificaCantanti ? "CLASSIFICA CANTANTI" : name.toUpperCase().replace('-', ' ');
                const isActive = (sceneIndex === SCENES.length && isClassificaCantanti) || (sceneIndex < SCENES.length && SCENES[sceneIndex] === name);
                return ( <button key={name} style={{ flex: '1 1 40%', minWidth: 110, padding: "8px", background: isActive ? "#38b000" : "#ffe066", color: isActive ? "#fff" : "#134074", fontWeight: "bold", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", textTransform: "uppercase" }} onClick={() => changeScene(name)}> {label} </button> )
              })}
            </div>
            <button style={{ marginTop: 8, padding: "20px 48px", background: "#ffe066", color: "#134074", fontWeight: "bold", fontSize: 23, border: "none", borderRadius: 10, cursor: "pointer", letterSpacing: 1, width: '100%' }} onClick={nextScene} >
              ➔ Scena successiva
            </button>
            <div style={{marginTop:10, fontSize: 16, color:"#ffe066"}}>Scena attuale: <b>{scene.name.toUpperCase()}</b></div>
            <div style={{marginTop:10, fontSize: 16, color:"#ffe066"}}>Concorrente attivo: <b>{contestants.length > 0 && sceneIndex !== SCENES.length ? contestants[currentContestantIndex]?.name : <i>nessuno</i>}</b></div>
          </Panel>
          <Panel>
            <Title>Estrazione brano</Title>
            <ul style={{ maxHeight: "16vh", overflowY: "auto", color: "#fff", fontSize: 17, width: "100%", listStyle: 'none', paddingLeft: 0, marginBottom: 8 }}>
              {songs.map(file => (
                <li key={file} style={{marginBottom:4, display: "flex", alignItems: "center", justifyContent: 'space-between'}}>
                  <span>{file}</span>
                  <button style={{ marginLeft: 10, background: "#ffe066", color: "#134074", border: "none", borderRadius: 6, fontWeight: "bold", padding: "2px 10px", cursor: "pointer" }} onClick={() => forceSong(file)} >Forza</button>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 16, color:"#ffe066" }}> <b>Brano estratto:</b>{" "} {drawnSong ? <span><b>{drawnSong.author}</b> - <b>{drawnSong.title}</b> <i>({drawnSong.file})</i></span> : <i>Nessun brano estratto</i>} </div>
          </Panel>
        </div>
        <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", padding: "3vw 2vw", gap: 16, boxSizing: 'border-box' }}>
          <Panel>
            <Title>Concorrenti</Title>
            <form onSubmit={e => { e.preventDefault(); addContestant(); }} style={{ display: "flex", gap: 8, marginBottom: 8, width: "100%" }}>
              <Input placeholder="Nome concorrente" value={contestantInput} onChange={e => setContestantInput(e.target.value)} />
              <button type="submit" style={{ background: "#ffe066", color: "#134074", border: "none", borderRadius: 6, fontWeight: "bold", padding: "6px 16px", cursor: "pointer" }}>Aggiungi</button>
            </form>
            <ul style={{ padding: 0, margin: 0, listStyle: "none", textAlign: "left", minHeight: 34, maxHeight: 360, overflowY: contestants.length > 10 ? "auto" : "visible", fontSize: 18, width: "100%" }}>
              {contestants.map((c, i) => (
                <li key={c.id ?? i} style={{ margin: "2px 0", display: "flex", alignItems: "center", justifyContent: "flex-start", cursor: "default", background: currentContestantIndex === i ? "#ffe06622" : "none", color: currentContestantIndex === i ? "#ffe066" : "#fff", borderRadius: 4, padding: "2px 6px", width: "100%" }}>
                  {i !== currentContestantIndex ? (
                    <>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                      {editingIndex === i ? (
                        <>
                          <button style={{ marginRight: 4, background: "#ffe066", color: "#134074", border: "none", borderRadius: 6, fontWeight: "bold", padding: "2px 8px", cursor: "pointer" }} title="Salva" onClick={() => { if (editingName.trim()) { editContestant(i, editingName.trim()); } }}>💾</button>
                          <button style={{ marginRight: 8, background: "#ffe066", color: "#134074", border: "none", borderRadius: 6, fontWeight: "bold", padding: "2px 8px", cursor: "pointer" }} title="Annulla" onClick={() => { setEditingIndex(null); setEditingName(""); }}>✖</button>
                          <input ref={editInputRef} value={editingName} onChange={e => setEditingName(e.target.value)} style={{ fontSize: 16, borderRadius: 4, border: "1px solid #ffe066", padding: "2px 5px", marginRight: 8 }} onKeyDown={e => { if (e.key === "Enter" && editingName.trim()) { editContestant(i, editingName.trim()); } if (e.key === "Escape") { setEditingIndex(null); setEditingName(""); } }} />
                        </>
                      ) : ( <button style={{ marginRight: 6, background: "#ffe066", color: "#134074", border: "none", borderRadius: 6, fontWeight: "bold", padding: "2px 8px", cursor: "pointer" }} title="Modifica nome" onClick={() => { setEditingIndex(i); setEditingName(c.name); }}>✏️</button> )}
                        <button style={{ marginRight: 10, background: "#ffe066", color: "#134074", border: "none", borderRadius: 6, fontWeight: "bold", padding: "2px 8px", cursor: "pointer" }} title="Elimina concorrente" onClick={() => removeContestant(i)}>🗑️</button>
                      <button style={{ background: "transparent", border: "none", color: "#ffe066", cursor: "pointer", fontSize: 18, marginRight: 2 }} disabled={i === 0 || (i-1) === currentContestantIndex} onClick={() => moveContestant(i, -1)} title="Sposta su" >↑</button>
                      <button style={{ background: "transparent", border: "none", color: "#ffe066", cursor: "pointer", fontSize: 18, marginRight: 8 }} disabled={i === contestants.length - 1 || (i+1) === currentContestantIndex} onClick={() => moveContestant(i, 1)} title="Sposta giù" >↓</button>
                        </div>
                      <span style={{ cursor: "pointer", fontWeight: "normal", color: "#fff", flexGrow: 1 }} onClick={() => selectContestant(i)} title="Rendi attivo">{c.name} {c.score != null && `(${c.score} pts)`}</span>
                    </>
                  ) : ( <span style={{ fontWeight: "bold", color: "#ffe066", minWidth: 60, textAlign: "left" }}> {c.name} {c.score != null && `(${c.score} pts)`} </span> )}
                </li>
              ))}
            </ul>
          </Panel>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                <div style={{ background: "#f2f2f2", borderRadius: 10, padding: 18, textAlign: "center", color: '#134074' }}>
                    <h3 style={{margin:"0 0 10px 0"}}>Voto Pubblico</h3>
                    <div style={{fontSize: 56, fontWeight: 900}}>{publicVote}</div>
                    <form onSubmit={handleForcePublicVote} style={{display: 'flex', gap: 8, marginTop: 10}}>
                        <input type="number" value={manualPublicVote} onChange={e => setManualPublicVote(e.target.value)} placeholder="Forza voto" style={{flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', color: '#134074', background: '#e0e0e0'}} />
                        <button type="submit" style={{background: '#134074', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', padding: '0 12px'}}>OK</button>
                    </form>
                </div>
                <div style={{ background: "#f2f2f2", borderRadius: 10, padding: 18, textAlign: "center", color: '#134074' }}>
                    <h3 style={{margin:"0 0 10px 0"}}>Intonazione</h3>
                    <div style={{fontSize: 56, fontWeight: 900}}>{intonationScore} / 100</div>
                    <form onSubmit={handleForceIntonation} style={{display: 'flex', gap: 8, marginTop: 10}}>
                        <input type="number" value={manualIntonationScore} onChange={e => setManualIntonationScore(e.target.value)} placeholder="Forza voto" style={{flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', color: '#134074', background: '#e0e0e0'}} />
                        <button type="submit" style={{background: '#134074', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', padding: '0 12px'}}>OK</button>
                    </form>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
