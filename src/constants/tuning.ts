import type { TuningNote } from "../types/tuner";

const midiToFrequency = (midi: number, a4Hz = 440): number => {
  return a4Hz * Math.pow(2, (midi - 69) / 12);
};

export const STANDARD_GUITAR_TUNING: TuningNote[] = [
  { id: "E2", label: "E2", midi: 40, frequencyHz: midiToFrequency(40) },
  { id: "A2", label: "A2", midi: 45, frequencyHz: midiToFrequency(45) },
  { id: "D3", label: "D3", midi: 50, frequencyHz: midiToFrequency(50) },
  { id: "G3", label: "G3", midi: 55, frequencyHz: midiToFrequency(55) },
  { id: "B3", label: "B3", midi: 59, frequencyHz: midiToFrequency(59) },
  { id: "E4", label: "E4", midi: 64, frequencyHz: midiToFrequency(64) },
];
