const { record } = require('node-record-lpcm16');
const fs = require('fs');

const file = fs.createWriteStream('test.wav');
const rec = record.start({
  device: 'default',
  sampleRate: 48000,
  channels: 2
});
rec.pipe(file);

console.log('Recording... Premi CTRL+C per fermare.');

process.on('SIGINT', () => {
  record.stop();
  file.end();
  console.log('Stopped.');
  process.exit();
});