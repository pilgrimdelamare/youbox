const express = require('express');
const router = express.Router();
const path = require('path');
const { startRecording, stopRecording } = require('../intonation/record');
const { analyzePitch } = require('../intonation/analyze');
const fs = require('fs-extra');

let currentRecording = null;
let lastResult = null;

// Avvia registrazione microfono
router.post('/start-recording', (req, res) => {
  try {
    const { contestant, song } = req.body;
    const audioFile = startRecording({ contestant, song });
    currentRecording = { contestant, song, audioFile };
    res.json({ status: 'ok', file: audioFile });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ferma registrazione, analizza e salva risultato
router.post('/stop-recording', async (req, res) => {
  if (!currentRecording) {
    return res.status(400).json({ error: 'No recording in progress' });
  }
  try {
    const file = await stopRecording();
    const result = await analyzePitch(file);

    // Salva il risultato
    const resultsPath = path.join(__dirname, '../../data/results/intonation.json');
    await fs.ensureFile(resultsPath);
    let results = [];
    if (fs.existsSync(resultsPath)) {
      try {
        results = JSON.parse(fs.readFileSync(resultsPath));
      } catch {}
    }
    const entry = {
      contestant: currentRecording.contestant,
      song: currentRecording.song,
      file,
      score: result.score,
      when: Date.now(),
    };
    results.push(entry);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    lastResult = entry;
    currentRecording = null;

    res.json({ status: 'ok', ...entry });
    // Notifica live via socket (se presente)
    req.app.get('io')?.emit('intonationResult', entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ottieni ultimo risultato
router.get('/intonation-result', (req, res) => {
  if (!lastResult) {
    return res.status(404).json({ error: 'No result yet' });
  }
  res.json(lastResult);
});

module.exports = router;