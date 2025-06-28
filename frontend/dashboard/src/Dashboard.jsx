import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const SCENE_ORDER = [
  "start",
  "presentazione",
  "estrazione",
  "titolo",
  "esibizione",
  "votazione",
  "valutazione",
  "punteggio"
];
const CLASSIFICA_SCENE = "classifica";
const BACKEND_URL = "http://localhost:4000";

function ContestantsManager({
  contestants,
  currentIndex,
  onAdd,
  onEdit,
  onDelete
}) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 350,
        background: "#f9f9f9",
        borderRadius: 8,
        boxShadow: "0 2px 8px #0002",
        padding: 16,
        zIndex: 100
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 8 }}>Concorrenti</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {contestants.map((c, i) => (
          <li
            key={c.id}
            style={{
              background: i === currentIndex ? "#d5f5e3" : "transparent",
              borderRadius: 5,
              marginBottom: 4,
              padding: "2px 0 2px 4px",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span style={{ fontWeight: 600, width: 22 }}>{i + 1}.</span>
            {editId === c.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && editName.trim()) {
                      onEdit(c.id, editName.trim());
                      setEditId(null);
                    }
                    if (e.key === "Escape") {
                      setEditId(null);
                    }
                  }}
                  style={{ flex: 1, marginRight: 4 }}
                />
                <button
                  onClick={() => {
                    if (editName.trim()) {
                      onEdit(c.id, editName.trim());
                      setEditId(null);
                    }
                  }}
                  title="Salva"
                >💾</button>
                <button onClick={() => setEditId(null)} title="Annulla">✖</button>
              </>
            ) : (
              <>
                <span style={{
                  flex: 1,
                  fontWeight: i === currentIndex ? 700 : 400,
                  color: i === currentIndex ? "#148f51" : "#222"
                }}>
                  {c.name}
                </span>
                <button onClick={() => { setEditId(c.id); setEditName(c.name); }} title="Modifica nome">
                  ✏️
                </button>
                <button onClick={() => onDelete(c.id)} title="Elimina concorrente">
                  🗑️
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (newName.trim()) {
            onAdd(newName.trim());
            setNewName("");
          }
        }}
        style={{ display: "flex", marginTop: 8, gap: 4 }}
      >
        <input
          placeholder="Aggiungi concorrente"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">➕</button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const [contestants, setContestants] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [currentScene, setCurrentScene] = useState(SCENE_ORDER[0]);
  const nextId = useRef(1);

  // socket.io
  const socketRef = useRef(null);
  useEffect(() => {
    socketRef.current = io(BACKEND_URL);
    return () => { socketRef.current.disconnect(); };
  }, []);

  // Aggiorna la scena e il concorrente corrente ogni volta che cambiano
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit("scene", { name: currentScene });
      socketRef.current.emit("current-contestant", contestants[currentIndex] || null);
    }
  }, [currentScene, currentIndex, contestants]);

  // Gestione concorrenti: aggiunta
  function handleAdd(name) {
    setContestants(prev => {
      const updated = [...prev, { id: nextId.current++, name }];
      // Se era vuoto, resetta indici
      if (prev.length === 0) {
        setCurrentIndex(0);
        setSceneIdx(0);
        setCurrentScene(SCENE_ORDER[0]);
      }
      return updated;
    });
  }

  // Gestione concorrenti: modifica
  function handleEdit(id, newName) {
    setContestants(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  }

  // Gestione concorrenti: elimina
  function handleDelete(id) {
    setContestants(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1) return prev;
      const updated = prev.filter(c => c.id !== id);

      // Se elimino il concorrente attivo:
      if (idx === currentIndex) {
        if (updated.length === 0) {
          setCurrentIndex(0);
          setSceneIdx(0);
          setCurrentScene(SCENE_ORDER[0]);
        } else if (currentIndex >= updated.length) {
          setCurrentIndex(updated.length - 1);
          setSceneIdx(0);
          setCurrentScene(SCENE_ORDER[0]);
        } else {
          setSceneIdx(0);
          setCurrentScene(SCENE_ORDER[0]);
        }
      } else if (idx < currentIndex) {
        setCurrentIndex(i => Math.max(0, i - 1));
      }
      return updated;
    });
  }

  // Avanzamento scena/concorrente
  function handleNextScene() {
    if (contestants.length === 0) return;

    if (currentScene === CLASSIFICA_SCENE) {
      // Reset gara
      setCurrentIndex(0);
      setSceneIdx(0);
      setCurrentScene(SCENE_ORDER[0]);
      return;
    }

    if (sceneIdx < SCENE_ORDER.length - 1) {
      // Avanza alla scena successiva per lo stesso concorrente
      setSceneIdx(s => s + 1);
      setCurrentScene(SCENE_ORDER[sceneIdx + 1]);
    } else {
      // Ultima scena per il concorrente attuale
      if (currentIndex < contestants.length - 1) {
        // Passa al prossimo concorrente
        setCurrentIndex(i => i + 1);
        setSceneIdx(0);
        setCurrentScene(SCENE_ORDER[0]);
      } else {
        // Tutti i concorrenti hanno terminato: mostra classifica
        setCurrentScene(CLASSIFICA_SCENE);
      }
    }
  }

  // Se il numero di concorrenti si riduce a 0, resetta tutto
  useEffect(() => {
    if (contestants.length === 0) {
      setCurrentIndex(0);
      setSceneIdx(0);
      setCurrentScene(SCENE_ORDER[0]);
    } else if (currentIndex >= contestants.length) {
      setCurrentIndex(contestants.length - 1);
      setSceneIdx(0);
      setCurrentScene(SCENE_ORDER[0]);
    }
  }, [contestants.length]);

  return (
    <div style={{ position: "relative", minHeight: 600, minWidth: 800 }}>
      <ContestantsManager
        contestants={contestants}
        currentIndex={currentIndex}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <div style={{
        margin: "0 auto",
        paddingTop: 100,
        textAlign: "center",
        maxWidth: 600
      }}>
        <h1>Dashboard Gara</h1>
        <div style={{ fontSize: 22, margin: "24px 0 8px" }}>
          Scena attuale: <b>{currentScene}</b>
        </div>
        {currentScene !== CLASSIFICA_SCENE && contestants[currentIndex] && (
          <div style={{ fontSize: 18, marginBottom: 8 }}>
            Concorrente: <b>{contestants[currentIndex].name}</b> ({currentIndex + 1}/{contestants.length})
          </div>
        )}
        {currentScene === CLASSIFICA_SCENE && (
          <div style={{ fontSize: 18, color: "#0984e3", margin: "24px 0" }}>
            <b>Classifica finale</b>
            {/* Qui puoi aggiungere la logica per mostrare la classifica */}
          </div>
        )}
        <button
          onClick={handleNextScene}
          style={{
            fontSize: 20,
            padding: "10px 32px",
            marginTop: 32,
            background: "#27ae60",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer"
          }}
        >
          Scena successiva
        </button>
      </div>
    </div>
  );
}