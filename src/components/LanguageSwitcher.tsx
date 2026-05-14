import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { SupportedLanguage } from '../i18n';

const OPTIONS: { code: SupportedLanguage; labelKey: 'language.en' | 'language.pt' | 'language.es' }[] = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'pt', labelKey: 'language.pt' },
  { code: 'es', labelKey: 'language.es' },
];

function baseLanguage(lng: string | undefined): SupportedLanguage {
  const raw = (lng ?? 'en').split('-')[0] ?? 'en';
  if (raw === 'pt' || raw === 'es' || raw === 'en') {
    return raw;
  }
  return 'en';
}

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const active = baseLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={t('language.label')}>
      <Text style={styles.caption}>{t('language.label')}</Text>
      <View style={styles.row}>
        {OPTIONS.map(({ code, labelKey }) => {
          const selected = active === code;
          return (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => void i18n.changeLanguage(code)}
              style={[styles.chip, selected && styles.chipActive]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{t(labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  caption: {
    color: '#8EA4CF',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2B355A',
    backgroundColor: '#141C35',
  },
  chipActive: {
    borderColor: '#5DE2E7',
    backgroundColor: '#18264A',
  },
  chipText: {
    color: '#D8E4FF',
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#5DE2E7',
  },
});
