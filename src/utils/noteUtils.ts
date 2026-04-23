import { STANDARD_GUITAR_TUNING } from "../constants/tuning";
import type { NoteMatch, TuningNote } from "../types/tuner";

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export function frequencyToMidi(frequencyHz: number, a4Hz = 440): number {
  return 69 + 12 * Math.log2(frequencyHz / a4Hz);
}

export function midiToFrequency(midi: number, a4Hz = 440): number {
  return a4Hz * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number): string {
  const normalized = Math.round(midi);
  const octave = Math.floor(normalized / 12) - 1;
  const note = NOTE_NAMES[((normalized % 12) + 12) % 12];
  return `${note}${octave}`;
}

export function nearestGuitarString(frequencyHz: number): TuningNote {
  return STANDARD_GUITAR_TUNING.reduce((closest, current) => {
    const bestDistance = Math.abs(closest.frequencyHz - frequencyHz);
    const currentDistance = Math.abs(current.frequencyHz - frequencyHz);
    return currentDistance < bestDistance ? current : closest;
  }, STANDARD_GUITAR_TUNING[0]);
}

export function frequencyToNoteMatch(
  frequencyHz: number,
  a4Hz = 440,
): NoteMatch {
  const midi = frequencyToMidi(frequencyHz, a4Hz);
  const roundedMidi = Math.round(midi);
  const targetHz = midiToFrequency(roundedMidi, a4Hz);
  const cents = 1200 * Math.log2(frequencyHz / targetHz);

  return {
    note: midiToNoteName(roundedMidi),
    midi: roundedMidi,
    targetHz,
    cents,
  };
}
