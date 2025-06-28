import React, { useState, useRef } from "react";

// Ordine delle scene per ogni concorrente
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

// Component: Concorrenti management (top-right area)
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
      <h3 style={{margin:0,marginBottom:8}}>Concorrenti</h3>
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

// Main Dashboard component
export default function Dashboard() {
  // Concorrenti: array di oggetti { id, name }
  const [contestants, setContestants] = useState([
    // Esempio iniziale:
    // { id: 1, name: "Mario Rossi" },
    // { id: 2, name: "Anna Bianchi" }
  ]);
  // Indice del concorrente attivo
  const [currentIndex, setCurrentIndex] = useState(0);
  // Indice scena attuale (0 = start)
  const [sceneIdx, setSceneIdx] = useState(0);
  // Stato della scena attuale come stringa
  const [currentScene, setCurrentScene] = useState(SCENE_ORDER[0]);
  // Per generare id unici
  const nextId = useRef(1);

  // Handler: aggiungi concorrente
  function handleAdd(name) {
    setContestants(prev => [
      ...prev,
      { id: nextId.current++, name }
    ]);
    // Se era vuoto, setta subito attivo il primo concorrente
    if (contestants.length === 0) {
      setCurrentIndex(0);
      setSceneIdx(0);
      setCurrentScene(SCENE_ORDER[0]);
    }
  }

  // Handler: modifica nome concorrente
  function handleEdit(id, newName) {
    setContestants(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  }

  // Handler: elimina concorrente
  function handleDelete(id) {
    setContestants(prev => {
      const idx = prev.findIndex(c => c.id === id);
      const updated = prev.filter(c => c.id !== id);

      // Se elimini il concorrente attivo: vai al prossimo
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

  // Flusso scene
  function handleNextScene() {
    // Se nessun concorrente, non fare nulla
    if (contestants.length === 0) return;
    // Se siamo alla classifica, resetta tutto
    if (currentScene === CLASSIFICA_SCENE) {
      setCurrentIndex(0);
      setSceneIdx(0);
      setCurrentScene(SCENE_ORDER[0]);
      return;
    }
    // Se non è l'ultima scena, avanza
    if (sceneIdx < SCENE_ORDER.length - 1) {
      setSceneIdx(s => s + 1);
      setCurrentScene(SCENE_ORDER[sceneIdx + 1]);
    } else {
      // Fine del ciclo per questo concorrente
      if (currentIndex < contestants.length - 1) {
        // Passa al prossimo concorrente, riparti da start
        setCurrentIndex(i => i + 1);
        setSceneIdx(0);
        setCurrentScene(SCENE_ORDER[0]);
      } else {
        // Ultimo concorrente: mostra classifica
        setCurrentScene(CLASSIFICA_SCENE);
      }
    }
  }

  // Esempio di invio scena/concorrente al backend (socket.io)
  // useEffect(() => {
  //   socket.emit("scene", { name: currentScene });
  //   socket.emit("current-contestant", contestants[currentIndex] || null);
  // }, [currentScene, currentIndex, contestants]);

  return (
    <div style={{ position: "relative", minHeight: 600, minWidth: 800 }}>
      {/* Area concorrenti in alto a dx */}
      <ContestantsManager
        contestants={contestants}
        currentIndex={currentIndex}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Area centrale: mostra stato della gara */}
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