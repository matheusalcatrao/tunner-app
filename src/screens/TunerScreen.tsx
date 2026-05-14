import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { TunerNeedle } from '../components/TunerNeedle';
import { StringGrid } from '../components/StringGrid';
import { useTuner } from '../hooks/useTuner';
import { useOTAUpdate } from '../hooks/useOTAUpdate';
import type { TuningNote } from '../types/tuner';

export function TunerScreen() {
  const { t } = useTranslation();
  const { state, start, stop, resetError } = useTuner();
  const { otaState, applyUpdate } = useOTAUpdate();
  const [selectedString, setSelectedString] = useState<TuningNote | null>(null);

  // Pulse animation while analyzing
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (state.status === 'analyzing' || state.status === 'listening') {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [state.status, pulseAnim]);

  const cents = useMemo(() => {
    if (!state.noteMatch) {
      return 0;
    }

    if (selectedString && state.smoothedPitchHz) {
      return 1200 * Math.log2(state.smoothedPitchHz / selectedString.frequencyHz);
    }

    return state.noteMatch.cents;
  }, [selectedString, state.noteMatch, state.smoothedPitchHz]);

  const currentTarget = selectedString ?? state.targetString;

  const isAnalyzing = state.status === 'analyzing';
  const statusColor =
    state.status === 'in-tune' ? '#10B981' :
    state.status === 'flat'    ? '#F59E0B' :
    state.status === 'sharp'   ? '#F59E0B' :
    state.status === 'analyzing' ? '#5DE2E7' : '#4B5A8A';

  const rmsWidth = `${Math.min(100, state.rms * 800)}%` as `${number}%`;

  const statusLabel =
    state.status === 'analyzing'
      ? t('status.analyzing')
      : state.status === 'listening'
        ? t('status.listening')
        : state.status === 'in-tune'
          ? t('status.inTune')
          : state.status === 'flat'
            ? t('status.flat')
            : state.status === 'sharp'
              ? t('status.sharp')
              : t('status.silent');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('app.title')}</Text>
        <LanguageSwitcher />
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteLabel}>{t('tuner.note')}</Text>
        <Animated.Text style={[styles.noteValue, { opacity: isAnalyzing ? pulseAnim : 1 }]}>
          {state.noteMatch?.note ?? (isAnalyzing ? '···' : '--')}
        </Animated.Text>
        <Text style={styles.freqValue}>{state.smoothedPitchHz?.toFixed(2) ?? '--'} Hz</Text>
        <Text style={styles.meta}>
          {t('tuner.meta', {
            target: currentTarget?.label ?? '--',
            clarity: (state.clarity * 100).toFixed(0),
          })}
        </Text>

        {/* RMS level bar */}
        <View style={styles.rmsTrack}>
          <View style={[styles.rmsBar, { width: rmsWidth, backgroundColor: statusColor }]} />
        </View>
      </View>

      <TunerNeedle cents={cents} />

      <View style={styles.statusRow}>
        <Animated.View style={[styles.statusDot, { backgroundColor: statusColor, opacity: pulseAnim }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={() => void start()}>
          <Text style={styles.buttonText}>
            {state.isListening ? t('actions.restart') : t('actions.start')}
          </Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonGhost]} onPress={() => void stop()}>
          <Text style={styles.buttonText}>{t('actions.stop')}</Text>
        </Pressable>
      </View>

      {state.error ? (
        <Pressable style={styles.errorBox} onPress={resetError}>
          <Text style={styles.errorText}>{state.error}</Text>
        </Pressable>
      ) : null}

      {otaState.isUpdateAvailable ? (
        <Pressable style={styles.updateBanner} onPress={() => void applyUpdate()}>
          <Text style={styles.updateBannerText}>{t('ota.updateAvailable')}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionTitle}>{t('tuner.defaultStrings')}</Text>
      <StringGrid activeString={currentTarget} onSelectString={setSelectedString} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 18,
    backgroundColor: '#0B1020',
  },
  title: {
    color: '#F0F5FF',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8FA6D5',
    marginTop: -10,
  },
  noteBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B355A',
    backgroundColor: '#141C35',
    padding: 18,
    gap: 4,
  },
  noteLabel: {
    color: '#8EA4CF',
    fontSize: 13,
  },
  noteValue: {
    color: '#E9EEFF',
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '800',
  },
  freqValue: {
    color: '#5DE2E7',
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    marginTop: 4,
    color: '#8EA4CF',
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D97706',
  },
  statusDotGreen: {
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#D9E4FF',
    fontWeight: '600',
  },
  headerRow: {
    gap: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: '#1F8A9E',
    borderColor: '#5DE2E7',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: '#2B355A',
  },
  buttonText: {
    color: '#F0F5FF',
    fontWeight: '700',
  },
  errorBox: {
    borderRadius: 10,
    backgroundColor: '#3F1F25',
    borderWidth: 1,
    borderColor: '#A94C55',
    padding: 10,
  },
  errorText: {
    color: '#FFD2D8',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#AFC1E9',
    fontWeight: '700',
  },
  updateBanner: {
    borderRadius: 10,
    backgroundColor: '#162E40',
    borderWidth: 1,
    borderColor: '#5DE2E7',
    padding: 12,
    alignItems: 'center',
  },
  updateBannerText: {
    color: '#5DE2E7',
    fontWeight: '700',
    fontSize: 13,
  },
  rmsTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E2B4A',
    overflow: 'hidden',
  },
  rmsBar: {
    height: 4,
    borderRadius: 2,
  },
});
