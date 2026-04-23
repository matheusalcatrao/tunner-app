import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STANDARD_GUITAR_TUNING } from '../constants/tuning';
import type { TuningNote } from '../types/tuner';

interface StringGridProps {
  activeString: TuningNote | null;
  onSelectString?: (value: TuningNote) => void;
}

export function StringGrid({ activeString, onSelectString }: StringGridProps) {
  return (
    <View style={styles.grid}>
      {STANDARD_GUITAR_TUNING.map((item) => {
        const isActive = activeString?.id === item.id;

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelectString?.(item)}
            style={[styles.card, isActive && styles.cardActive]}
          >
            <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]}>{item.label}</Text>
            <Text style={styles.cardSubtitle}>{item.frequencyHz.toFixed(2)} Hz</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '31.5%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B355A',
    backgroundColor: '#141C35',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardActive: {
    borderColor: '#5DE2E7',
    backgroundColor: '#18264A',
  },
  cardTitle: {
    color: '#D8E4FF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardTitleActive: {
    color: '#5DE2E7',
  },
  cardSubtitle: {
    marginTop: 2,
    color: '#8EA4CF',
    fontSize: 12,
  },
});
