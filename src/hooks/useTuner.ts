import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { AUDIO_CONFIG, getHopSize } from "../config/audioConfig";
import { nearestGuitarString, frequencyToNoteMatch } from "../utils/noteUtils";
import { detectPitchYIN } from "../utils/pitchDetector";
import {
  setupAudioCapture,
  startAudioCapture,
  stopAudioCapture,
} from "../services/audio/audioCapture";
import type { TunerState } from "../types/tuner";

interface UseTunerOptions {
  sampleRate?: number;
  frameSize?: number;
  overlap?: number;
  yinThreshold?: number;
  minFrequency?: number;
  maxFrequency?: number;
  rmsGate?: number;
  minClarity?: number;
  emaAlpha?: number;
  uiUpdateIntervalMs?: number;
}

const INITIAL_STATE: TunerState = {
  isListening: false,
  pitchHz: null,
  smoothedPitchHz: null,
  noteMatch: null,
  targetString: null,
  status: "silent",
  clarity: 0,
  rms: 0,
  error: null,
};

function computeRMS(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i += 1) {
    sum += frame[i] * frame[i];
  }
  return Math.sqrt(sum / frame.length);
}

function applyHannWindow(frame: Float32Array): Float32Array {
  const output = new Float32Array(frame.length);

  for (let i = 0; i < frame.length; i += 1) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frame.length - 1)));
    output[i] = frame[i] * window;
  }

  return output;
}

export function useTuner(options: UseTunerOptions = {}) {
  const config = useMemo(
    () => ({
      sampleRate: options.sampleRate ?? AUDIO_CONFIG.sampleRate,
      frameSize: options.frameSize ?? AUDIO_CONFIG.frameSize,
      overlap: options.overlap ?? AUDIO_CONFIG.overlap,
      yinThreshold: options.yinThreshold ?? AUDIO_CONFIG.yinThreshold,
      minFrequency: options.minFrequency ?? AUDIO_CONFIG.minFrequency,
      maxFrequency: options.maxFrequency ?? AUDIO_CONFIG.maxFrequency,
      rmsGate: options.rmsGate ?? AUDIO_CONFIG.rmsGate,
      minClarity: options.minClarity ?? AUDIO_CONFIG.minClarity,
      emaAlpha: options.emaAlpha ?? AUDIO_CONFIG.emaAlpha,
      uiUpdateIntervalMs:
        options.uiUpdateIntervalMs ?? AUDIO_CONFIG.uiUpdateIntervalMs,
      channels: AUDIO_CONFIG.channels,
      bitsPerSample: AUDIO_CONFIG.bitsPerSample,
    }),
    [options],
  );

  const [state, setState] = useState<TunerState>(INITIAL_STATE);

  // Float32Array ring buffer — avoid slow number[] push/splice
  const ringBufRef = useRef(new Float32Array(AUDIO_CONFIG.ringBufferCapacity));
  const ringCountRef = useRef(0);
  const smoothedPitchRef = useRef<number | null>(null);
  const lastUiUpdateRef = useRef<number>(0);
  const isListeningRef = useRef(false);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Permission",
        message: "The tuner needs microphone access to detect guitar pitch.",
        buttonPositive: "Allow",
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const processFrame = useCallback(
    (frame: Float32Array) => {
      const rms = computeRMS(frame);
      if (rms < config.rmsGate) {
        setState((prev) => ({
          ...prev,
          pitchHz: null,
          noteMatch: null,
          targetString: null,
          status: prev.isListening ? "silent" : prev.status,
          clarity: 0,
          rms: 0,
        }));
        return;
      }

      const windowed = applyHannWindow(frame);
      const result = detectPitchYIN(windowed, {
        sampleRate: config.sampleRate,
        minFrequency: config.minFrequency,
        maxFrequency: config.maxFrequency,
        threshold: config.yinThreshold,
      });

      if (!result.frequencyHz || result.clarity < config.minClarity) {
        setState((prev) => ({
          ...prev,
          pitchHz: result.frequencyHz,
          clarity: result.clarity,
          rms,
          status: prev.isListening ? "analyzing" : prev.status,
        }));
        return;
      }

      const previousSmooth = smoothedPitchRef.current ?? result.frequencyHz;
      const smoothed =
        previousSmooth +
        config.emaAlpha * (result.frequencyHz - previousSmooth);
      smoothedPitchRef.current = smoothed;

      const now = Date.now();
      if (now - lastUiUpdateRef.current < config.uiUpdateIntervalMs) {
        return;
      }
      lastUiUpdateRef.current = now;

      const noteMatch = frequencyToNoteMatch(smoothed);
      const targetString = nearestGuitarString(smoothed);

      let status: TunerState["status"] = "in-tune";
      if (noteMatch.cents < -5) {
        status = "flat";
      } else if (noteMatch.cents > 5) {
        status = "sharp";
      }

      setState((prev) => ({
        ...prev,
        pitchHz: result.frequencyHz,
        smoothedPitchHz: smoothed,
        noteMatch,
        targetString,
        status,
        clarity: result.clarity,
        rms,
        error: null,
      }));
    },
    [config],
  );

  const onAudioChunk = useCallback(
    (chunk: Float32Array) => {
      if (!isListeningRef.current) {
        return;
      }

      const ring = ringBufRef.current;
      const capacity = ring.length;
      let count = ringCountRef.current;

      // Append chunk into ring buffer (drop oldest if overflow)
      const available = capacity - count;
      if (chunk.length > available) {
        // Shift out oldest to make room
        const excess = chunk.length - available;
        ring.copyWithin(0, excess, count);
        count -= excess;
      }
      ring.set(chunk, count);
      count += chunk.length;
      ringCountRef.current = count;

      const { frameSize, overlap } = config;
      const hopSize = getHopSize(frameSize, overlap);

      while (ringCountRef.current >= frameSize) {
        // Slice frame without allocating new array from JS heap
        const frame = ring.subarray(0, frameSize);
        processFrame(new Float32Array(frame));
        // Shift hop using optimised typed-array memcpy
        ring.copyWithin(0, hopSize, ringCountRef.current);
        ringCountRef.current -= hopSize;
      }
    },
    [config, processFrame],
  );

  const start = useCallback(async () => {
    const allowed = await requestMicPermission();
    if (!allowed) {
      setState((prev) => ({ ...prev, error: "Microphone permission denied." }));
      return;
    }

    try {
      // Always stop and reset before starting/restarting
      isListeningRef.current = false;
      await stopAudioCapture();

      ringBufRef.current.fill(0);
      ringCountRef.current = 0;
      smoothedPitchRef.current = null;
      setupAudioCapture(
        {
          sampleRate: config.sampleRate,
          channels: config.channels,
          bitsPerSample: config.bitsPerSample,
        },
        onAudioChunk,
      );
      startAudioCapture();
      isListeningRef.current = true;

      setState((prev) => ({
        ...prev,
        isListening: true,
        status: "listening",
        error: null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        error:
          "Falha ao iniciar captura de áudio. Em Expo Go, use Dev Build após prebuild para módulos nativos.",
      }));
    }
  }, [
    config.bitsPerSample,
    config.channels,
    config.sampleRate,
    onAudioChunk,
    requestMicPermission,
  ]);

  const stop = useCallback(async () => {
    isListeningRef.current = false;
    await stopAudioCapture();
    setState((prev) => ({
      ...prev,
      isListening: false,
      status: "silent",
    }));
  }, []);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      void stopAudioCapture();
    };
  }, []);

  return {
    state,
    start,
    stop,
    resetError,
  };
}
