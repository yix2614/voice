import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Voice</Text>
        <Text style={styles.subtitle}>A clean app shell is ready.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#111111',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0,
  },
  subtitle: {
    marginTop: 10,
    color: '#666666',
    fontSize: 16,
  },
});
