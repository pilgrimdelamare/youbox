const fs = require('fs');
const wav = require('wav-decoder');
const Pitchfinder = require('pitchfinder');

async function analyzePitch(wavPath) {
  const buffer = fs.readFileSync(wavPath);
  const audioData = await wav.decode(buffer);
  const samples = audioData.channelData[0];
  const sampleRate = audioData.sampleRate;
  const detectPitch = Pitchfinder.YIN({ sampleRate });

  const frameSize = 1024;
  const hopSize = 512;
  let detected = [];
  for (let i = 0; i + frameSize < samples.length; i += hopSize) {
    const frame = samples.slice(i, i + frameSize);
    const freq = detectPitch(frame);
    detected.push(freq || null);
  }
  const voicedFrames = detected.filter(f => !!f);
  const voicedRatio = voicedFrames.length / detected.length;

  let pitchStability = 0;
  if (voicedFrames.length > 1) {
    const mean = voicedFrames.reduce((a, b) => a + b, 0) / voicedFrames.length;
    const variance = voicedFrames.reduce((acc, f) => acc + Math.pow(f - mean, 2), 0) / (voicedFrames.length - 1);
    pitchStability = 1 - (Math.sqrt(variance) / mean);
  }

  let score = voicedRatio * 0.8 + (pitchStability > 0 ? pitchStability * 0.2 : 0);
  score = Math.round(score * 100);

  if (score < 1) score = 1;
  if (score > 100) score = 100;

  return {
    score,
    pitchFrames: voicedFrames.length,
    totalFrames: detected.length,
    detected,
  };
}

module.exports = {
  analyzePitch,
};