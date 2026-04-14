import { router } from 'expo-router';
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

import { Colors } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'Error al procesar la solicitud');
        return;
      }
      setSent(true);
    } catch {
      setError('No se pudo conectar al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />

      <View style={styles.card}>
        {sent ? (
          <>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.title}>Revisa tu correo</Text>
            <Text style={styles.subtitle}>
              Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </Text>
            <Pressable style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </Text>

            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Enviar enlace</Text>
              }
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  successIcon: { fontSize: 40, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#11181C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#687076', marginBottom: 20, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: '600', color: '#11181C', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#11181C',
    backgroundColor: '#fafafa',
  },
  error: { color: '#e53935', fontSize: 13, marginTop: 8 },
  button: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
