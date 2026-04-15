// Pantalla de inicio de sesión: modal transparente que aparece sobre el feed.
// Acepta el parámetro ?registered=1 para mostrar un banner de bienvenida tras el registro.
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen() {
  const { login } = useAuth();
  const { registered } = useLocalSearchParams<{ registered?: string }>(); // viene de register tras crear cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Llama a la API de login, guarda la sesión en AuthContext y navega al feed
  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        // Traduce los errores del backend a mensajes amigables en español
        const errorMessages: Record<string, string> = {
          'Email not found': 'No existe una cuenta con ese correo.',
          'Wrong password': 'Contraseña incorrecta.',
        };
        setError(errorMessages[json.error] ?? json.message ?? 'Error al iniciar sesión');
        return;
      }
      // Persiste token y datos del usuario en AsyncStorage a través de AuthContext
      await login(json.data.token, json.data.user);
      router.replace('/(tabs)');
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
      {/* Toca fuera de la card para cerrar */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />

      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {registered === '1' && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>
                Cuenta creada exitosamente. Ingresa tus datos para entrar.
              </Text>
            </View>
          )}

          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Ingresa tus datos para continuar</Text>

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

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </Link>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Entrar</Text>
            }
          </Pressable>

          <Text style={styles.footerText}>
            ¿No tienes cuenta?{' '}
            <Link replace href="/(auth)/register" style={styles.footerLink}>
              Regístrate
            </Link>
          </Text>
        </ScrollView>
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
  title: { fontSize: 24, fontWeight: '800', color: '#11181C', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#687076', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#11181C', marginTop: 12, marginBottom: 6 },
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
  successBanner: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#43a047',
  },
  successText: { color: '#2e7d32', fontSize: 13, fontWeight: '500' },
  forgotLink: { color: Colors.light.tint, fontSize: 13, textAlign: 'right', marginTop: 8 },
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
  footerText: { textAlign: 'center', color: '#687076', fontSize: 13, marginTop: 20 },
  footerLink: { color: Colors.light.tint, fontWeight: '600' },
});
