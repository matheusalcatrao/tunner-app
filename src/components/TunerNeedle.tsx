import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface TunerNeedleProps {
  cents: number;
}

export function TunerNeedle({ cents }: TunerNeedleProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clamped = Math.max(-50, Math.min(50, cents));
    const target = (clamped / 50) * 45;

    Animated.spring(rotateAnim, {
      toValue: target,
      friction: 7,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [cents, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-45, 45],
    outputRange: ['-45deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>-50</Text>
        <Text style={styles.scaleText}>0</Text>
        <Text style={styles.scaleText}>+50</Text>
      </View>
      <View style={styles.gauge}>
        <View style={styles.centerDot} />
        <Animated.View style={[styles.needle, { transform: [{ rotate: rotation }] }]} />
      </View>
      <Text style={styles.centsText}>{cents >= 0 ? '+' : ''}{cents.toFixed(1)} cents</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  scaleRow: {
    width: '88%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    color: '#9FB0D0',
    fontWeight: '600',
  },
  gauge: {
    width: 260,
    height: 140,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 130,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#2D3B66',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    paddingBottom: 12,
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E9EEFF',
    position: 'absolute',
    bottom: 8,
  },
  needle: {
    width: 4,
    height: 112,
    borderRadius: 2,
    backgroundColor: '#5DE2E7',
    position: 'absolute',
    bottom: 12,
  },
  centsText: {
    color: '#DCE6FF',
    fontWeight: '700',
  },
});
