import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function CreateScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.placeholder}>Crear reseña — próximamente</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  placeholder: { fontSize: 16, color: '#999' },
});
