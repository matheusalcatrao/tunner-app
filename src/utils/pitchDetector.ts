import type { PitchResult } from "../types/tuner";

export interface YinOptions {
  sampleRate: number;
  minFrequency: number;
  maxFrequency: number;
  threshold: number;
}

export function differenceFunction(
  frame: Float32Array,
  tauMax: number,
): Float32Array {
  const diff = new Float32Array(tauMax + 1);
  const frameSize = frame.length;

  for (let tau = 1; tau <= tauMax; tau += 1) {
    let sum = 0;
    for (let i = 0; i < frameSize - tau; i += 1) {
      const delta = frame[i] - frame[i + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  return diff;
}

export function cumulativeMeanNormalizedDifference(
  diff: Float32Array,
): Float32Array {
  const cmndf = new Float32Array(diff.length);
  cmndf[0] = 1;

  let runningSum = 0;
  for (let tau = 1; tau < diff.length; tau += 1) {
    runningSum += diff[tau];
    cmndf[tau] = runningSum === 0 ? 1 : (diff[tau] * tau) / runningSum;
  }

  return cmndf;
}

export function absoluteThreshold(
  cmndf: Float32Array,
  threshold: number,
  tauMin: number,
): number | null {
  for (let tau = tauMin; tau < cmndf.length - 1; tau += 1) {
    if (cmndf[tau] < threshold) {
      while (tau + 1 < cmndf.length && cmndf[tau + 1] < cmndf[tau]) {
        tau += 1;
      }
      return tau;
    }
  }

  return null;
}

export function parabolicInterpolation(
  values: Float32Array,
  tau: number,
): number {
  const x0 = tau <= 1 ? tau : tau - 1;
  const x2 = tau + 1 >= values.length ? tau : tau + 1;

  if (x0 === tau || x2 === tau) {
    return tau;
  }

  const s0 = values[x0];
  const s1 = values[tau];
  const s2 = values[x2];
  const denominator = 2 * (2 * s1 - s2 - s0);

  if (denominator === 0) {
    return tau;
  }

  return tau + (s2 - s0) / denominator;
}

export function detectPitchYIN(
  frame: Float32Array,
  options: YinOptions,
): PitchResult {
  const { sampleRate, minFrequency, maxFrequency, threshold } = options;
  const tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const tauMax = Math.min(
    frame.length - 1,
    Math.floor(sampleRate / minFrequency),
  );

  if (tauMin >= tauMax) {
    return { frequencyHz: null, probability: 0, clarity: 0 };
  }

  const diff = differenceFunction(frame, tauMax);
  const cmndf = cumulativeMeanNormalizedDifference(diff);
  const thresholdTau = absoluteThreshold(cmndf, threshold, tauMin);

  let tau = thresholdTau;
  if (tau == null) {
    let minTau = tauMin;
    let minValue = Number.POSITIVE_INFINITY;

    for (let i = tauMin; i <= tauMax; i += 1) {
      if (cmndf[i] < minValue) {
        minValue = cmndf[i];
        minTau = i;
      }
    }

    tau = minTau;
  }

  const refinedTau = parabolicInterpolation(cmndf, tau);
  if (!Number.isFinite(refinedTau) || refinedTau <= 0) {
    return { frequencyHz: null, probability: 0, clarity: 0 };
  }

  const frequencyHz = sampleRate / refinedTau;
  const clarity = Math.max(0, Math.min(1, 1 - cmndf[tau]));

  return {
    frequencyHz: Number.isFinite(frequencyHz) ? frequencyHz : null,
    probability: clarity,
    clarity,
  };
}
