# Guitar Tuner Boilerplate (Expo + TypeScript)

Boilerplate para app afinador de guitarra com:

- `react-native-audio-record` para captura de áudio PCM
- algoritmo `YIN` em TypeScript puro
- `useTuner` para orquestração de captura + detecção
- utilitários `pitchDetector` e `noteUtils`
- `TunerScreen` com agulha animada e grid de cordas padrão

## Preview

<div align="center">
  <img src="docs/screenshot.png" alt="Guitar Tuner App" width="320" />
</div>

---

## Estrutura

- src/hooks/useTuner.ts
- src/utils/pitchDetector.ts
- src/utils/noteUtils.ts
- src/services/audio/audioCapture.ts
- src/screens/TunerScreen.tsx
- src/components/TunerNeedle.tsx
- src/components/StringGrid.tsx
- src/constants/tuning.ts
- src/config/audioConfig.ts
- src/types/tuner.ts

## Dependências

Já incluído:

- `react-native-audio-record`

## Rodar o projeto

```bash
npm install
npm run start
```

## Importante sobre Expo

`react-native-audio-record` é módulo nativo. Portanto:

1. Não funciona no Expo Go padrão.
2. Use **Dev Build**.
3. Gere projetos nativos com prebuild:

```bash
npx expo prebuild
```

Depois rode em dispositivo/emulador:

```bash
npm run android
# ou
npm run ios
```

## Permissões

As permissões já foram configuradas em `app.json`:

- Android: `RECORD_AUDIO`
- iOS: `NSMicrophoneUsageDescription`

## Ajustes de precisão aplicados

- `sampleRate`: 44100
- `frameSize`: 2048
- overlap: 75% (hop 512)
- YIN threshold: 0.08
- smoothing: EMA simples (`alpha: 0.2`)
- gate de silêncio por RMS
