declare module "react-native-audio-record" {
  export interface AudioRecordInitOptions {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource?: number;
    wavFile?: string;
  }

  export interface AudioRecordModule {
    init(options: AudioRecordInitOptions): void;
    start(): void;
    stop(): Promise<string>;
    on(event: "data", callback: (data: string) => void): void;
  }

  const AudioRecord: AudioRecordModule;
  export default AudioRecord;
}
