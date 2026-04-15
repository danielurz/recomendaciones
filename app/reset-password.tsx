// Pantalla de restablecimiento de contraseña: se abre desde el deep link del email de reset.
// Lee el token JWT de reset desde los parámetros de URL y lo envía al backend junto con la nueva contraseña.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>(); // token de reset recibido por deep link del email
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false); // true = muestra la pantalla de éxito

  // Valida los campos localmente, luego envía el token y la nueva contraseña al backend
  const handleReset = async () => {
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'El enlace es inválido o ha expirado');
        return;
      }
      setDone(true); // cambia a la pantalla de confirmación
    } catch {
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Contraseña actualizada</Text>
          <Text style={styles.successText}>
            Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.
          </Text>
          <Pressable style={styles.button} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.inner}>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Elige una contraseña segura para tu cuenta.</Text>

          <Text style={styles.label}>Nueva contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Confirmar contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Repite la contraseña"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Restablecer contraseña</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#11181C', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#687076', marginBottom: 28, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: '#11181C', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#11181C',
    backgroundColor: '#fafafa',
  },
  error: { color: '#e53935', fontSize: 14, marginTop: 8 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 16 },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#11181C', textAlign: 'center' },
  successText: { fontSize: 15, color: '#687076', textAlign: 'center', lineHeight: 22 },
});
