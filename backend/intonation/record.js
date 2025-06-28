const record = require('node-record-lpcm16');
const fs = require('fs-extra');
const path = require('path');

let audioFile = null;
let fileStream = null;
let recordingProcess = null;

function startRecording({ contestant, song, dir = './data/recordings' }) {
  if (recordingProcess) {
    throw new Error('Recording already in progress');
  }
  fs.ensureDirSync(dir);

  const timestamp = Date.now();
  const safeContestant = (contestant || 'unknown').replace(/[^\w]/g, '_');
  const safeSong = (song || 'unknown').replace(/[^\w]/g, '_');
  audioFile = path.join(dir, `${safeContestant}_${safeSong}_${timestamp}.wav`);

  fileStream = fs.createWriteStream(audioFile, { encoding: 'binary' });
  // 16kHz 16bit mono PCM: ottimo per voce e pitch
  recordingProcess = record
    .record({
      sampleRate: 16000,
      threshold: 0,
      verbose: false,
      recordProgram: process.platform === 'win32' ? 'sox' : 'rec', // Sox su Windows
      silence: '20.0', // auto stop dopo 20s di silenzio
    })
    .stream()
    .pipe(fileStream);

  return audioFile;
}

function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!recordingProcess) {
      return reject(new Error('No recording in progress'));
    }
    record.stop();
    fileStream.on('finish', () => {
      const file = audioFile;
      audioFile = null;
      fileStream = null;
      recordingProcess = null;
      resolve(file);
    });
    fileStream.end();
  });
}

module.exports = {
  startRecording,
  stopRecording,
};