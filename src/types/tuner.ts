export type GuitarStringId = "E2" | "A2" | "D3" | "G3" | "B3" | "E4";

export type TuningStatus =
  | "flat"
  | "in-tune"
  | "sharp"
  | "listening"
  | "analyzing"
  | "silent";

export interface TuningNote {
  id: GuitarStringId;
  label: string;
  midi: number;
  frequencyHz: number;
}

export interface PitchResult {
  frequencyHz: number | null;
  probability: number;
  clarity: number;
}

export interface NoteMatch {
  note: string;
  midi: number;
  targetHz: number;
  cents: number;
}

export interface TunerState {
  isListening: boolean;
  pitchHz: number | null;
  smoothedPitchHz: number | null;
  noteMatch: NoteMatch | null;
  targetString: TuningNote | null;
  status: TuningStatus;
  clarity: number;
  rms: number;
  error: string | null;
}
