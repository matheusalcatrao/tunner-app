export const AUDIO_CONFIG = {
  sampleRate: 44100,
  frameSize: 2048,
  overlap: 0.5,
  channels: 1,
  bitsPerSample: 16,
  minFrequency: 70,
  maxFrequency: 450,
  yinThreshold: 0.10,
  rmsGate: 0.003,
  minClarity: 0.20,
  emaAlpha: 0.25,
  uiUpdateIntervalMs: 30,
  ringBufferCapacity: 16384,
} as const;

export const getHopSize = (frameSize: number, overlap: number): number => {
  return Math.max(1, Math.floor(frameSize * (1 - overlap)));
};
