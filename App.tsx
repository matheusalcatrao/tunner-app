import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { I18nextProvider } from 'react-i18next';

import i18n from './src/i18n';
import { TunerScreen } from './src/screens/TunerScreen';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <TunerScreen />
      </SafeAreaView>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
});
