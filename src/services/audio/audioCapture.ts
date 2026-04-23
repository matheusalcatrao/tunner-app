import { Buffer } from "buffer";
import { Audio } from "expo-av";
import { Platform } from "react-native";
import AudioRecord from "react-native-audio-record";

type ChunkListener = (samples: Float32Array) => void;

export interface AudioCaptureConfig {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

let started = false;
let currentListener: ((data: string) => void) | null = null;

function decodeBase64PCM(data: string): Float32Array {
  const bytes = Buffer.from(data, "base64");
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const samples = new Float32Array(sampleCount);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < sampleCount; i += 1) {
    const sample = view.getInt16(i * 2, true);
    samples[i] = sample / 32768;
  }

  return samples;
}

export function setupAudioCapture(
  config: AudioCaptureConfig,
  onChunk: ChunkListener,
): void {
  AudioRecord.init({
    sampleRate: config.sampleRate,
    channels: config.channels,
    bitsPerSample: config.bitsPerSample,
    audioSource: 1,
    wavFile: "tuner-session.wav",
  });

  // Replace listener so we never accumulate duplicate handlers
  currentListener = (data: string) => {
    onChunk(decodeBase64PCM(data));
  };
  AudioRecord.on("data", currentListener);
}

export async function startAudioCapture(): Promise<void> {
  // iOS: request microphone permission and configure audio session
  if (Platform.OS === "ios") {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      throw new Error("Permissão de microfone negada. Vá em Ajustes > Guitar Tuner e permita o microfone.");
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }

  AudioRecord.start();
  started = true;
}

export async function stopAudioCapture(): Promise<void> {
  if (!started) {
    return;
  }

  currentListener = null;
  await AudioRecord.stop();
  started = false;
}
