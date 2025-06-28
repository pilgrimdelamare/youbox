import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:4000";

const socket = io(BACKEND_URL);

export default function App() {
  const [scene, setScene] = useState({ name: "standby", data: null });
  const [votingOpen, setVotingOpen] = useState(false);
  const [publicScore, setPublicScore] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState(null);
  const [waiting, setWaiting] = useState(false);

  // Ricevi stato scena e votazione al mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/status`)
      .then(res => res.json())
      .then(data => {
        setScene(data.scene);
        setVotingOpen(data.votingOpen);
        setPublicScore(data.publicScore);
      });
  }, []);

  // Aggiorna stato in tempo reale via socket
  useEffect(() => {
    socket.on("scene", newScene => setScene(newScene));
    socket.on("voting-status", ({ open, publicScore }) => {
      setVotingOpen(open);
      setPublicScore(publicScore);
      setHasVoted(false); // reset votazione a ogni nuova votazione
    });
    socket.on("public-score", setPublicScore);
    return () => {
      socket.off("scene");
      socket.off("voting-status");
      socket.off("public-score");
    };
  }, []);

  // Voto: POST al backend
  async function sendVote(vote) {
    setWaiting(true);
    setVoteError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote })
      });
      const data = await res.json();
      if (!res.ok) {
        setVoteError(data.error || "Errore di rete");
        setHasVoted(false);
      } else {
        setHasVoted(true);
      }
    } catch (e) {
      setVoteError("Errore di rete");
    }
    setWaiting(false);
  }

  // Blocca votazione se non scena giusta
  const canVote = votingOpen && scene.name === "votazione";

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>YOUBOX - VOTA IL CONCORRENTE</h1>
      {scene && scene.data && scene.data.name && (
        <div style={styles.contestant}>
          <span>Stai votando:</span>
          <div style={styles.contestantName}>{scene.data.name}</div>
        </div>
      )}
      {!canVote && (
        <div style={styles.closed}>
          {scene.name === "votazione"
            ? "La votazione non è ancora aperta."
            : "La votazione è chiusa!"}
        </div>
      )}
      {canVote && (
        <>
          {!hasVoted ? (
            <div style={styles.voteButtons}>
              {[1,2,3,4,5,6,7,8,9,10].map(val => (
                <button
                  key={val}
                  style={styles.voteBtn}
                  disabled={waiting}
                  onClick={() => sendVote(val)}
                >
                  {val}
                </button>
              ))}
            </div>
          ) : (
            <div style={styles.thanks}>Grazie per il tuo voto!</div>
          )}
          {voteError && <div style={styles.error}>{voteError}</div>}
        </>
      )}
      <div style={styles.footer}>
        Punteggio pubblico attuale: <b>{publicScore}</b>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#100a1c",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 32,
    margin: "32px 0 8px 0"
  },
  contestant: {
    margin: "8px 0 24px 0",
    fontSize: 20,
    textAlign: "center"
  },
  contestantName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffe066"
  },
  closed: {
    fontSize: 28,
    color: "#ff4444",
    margin: "32px"
  },
  voteButtons: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "12px",
    margin: "16px 0"
  },
  voteBtn: {
    fontSize: 30,
    padding: "18px 28px",
    borderRadius: 12,
    border: "none",
    background: "#ffe066",
    color: "#100a1c",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 2px 8px #0004"
  },
  thanks: {
    fontSize: 32,
    color: "#aaffaa",
    margin: "36px 0"
  },
  error: {
    color: "#ff4444",
    margin: "16px"
  },
  footer: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    background: "#222",
    color: "#ffe066",
    fontSize: 22,
    padding: 10,
    textAlign: "center"
  }
};