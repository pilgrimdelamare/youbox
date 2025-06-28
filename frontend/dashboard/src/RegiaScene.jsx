const SCENES = [
  { name: "standby", label: "Standby", needs: [] },
  { name: "start", label: "Start video", video: "start.mp4" },
  { name: "presentazione", label: "Presentazione", needs: ["contestant"], video: "present-contestant.mp4" },
  { name: "estrazione", label: "Estrazione", video: "draw-song.mp4" },
  { name: "titolo", label: "Titolo brano", needs: ["author", "title"], video: "show-song.mp4" },
  { name: "esibizione", label: "Esibizione", needs: ["file"], video: "canzone estratta" },
  { name: "votazione", label: "Votazione", video: "voting.mp4" },
  { name: "valutazione", label: "Valutazione", video: "pitch.mp4" },
  { name: "punteggio", label: "Punteggio", needs: ["public", "intonation"], video: "final-score.mp4" },
  { name: "classifica", label: "Classifica", needs: ["ranking"], video: "start.mp4" },
];

// Usa una funzione per inviare la scena con i dati richiesti
function changeScene(sceneName, data) {
  fetch("http://localhost:4000/api/scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: sceneName, data }),
  });
}