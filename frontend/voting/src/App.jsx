import React, { useState } from "react";

export default function App() {
  const [vote, setVote] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:4000/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote })
    }).then(() => setSent(true));
  };

  return (
    <div style={{padding: 24, fontFamily: "sans-serif", maxWidth: 400, margin: "auto"}}>
      <h1>YouBox Voting</h1>
      {sent ? (
        <p>Voto inviato, grazie!</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Il tuo voto"
            value={vote}
            onChange={e => setVote(e.target.value)}
            style={{padding: 8, fontSize: 16, width: "70%"}}
          />
          <button type="submit" style={{padding: 8, fontSize: 16, marginLeft: 8}}>VOTA</button>
        </form>
      )}
    </div>
  );
}