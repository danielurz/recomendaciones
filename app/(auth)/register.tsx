// Pantalla de registro: modal transparente para crear una cuenta nueva.
// Tras registrarse con éxito, redirige al login con el parámetro registered=1.
import { Link, router } from 'expo-router';
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

import { Colors } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Llama a la API de registro y redirige al login con un banner de confirmación
  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        // Traduce los errores del backend a mensajes amigables en español
        const errorMessages: Record<string, string> = {
          'Email already registered': 'Este correo ya está registrado.',
          'Username already taken': 'Este nombre de usuario ya está en uso.',
        };
        setError(errorMessages[json.error] ?? json.message ?? 'Error al registrarse');
        return;
      }
      // No hace login automático: redirige al login para que el usuario ingrese sus credenciales
      router.replace({ pathname: '/(auth)/login', params: { registered: '1' } });
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
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Únete a la comunidad de reseñas honestas</Text>

          <Text style={styles.label}>Nombre de usuario</Text>
          <TextInput
            style={styles.input}
            placeholder="tu_usuario"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

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
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Crear cuenta</Text>
            }
          </Pressable>

          <Text style={styles.footerText}>
            ¿Ya tienes cuenta?{' '}
            <Link replace href="/(auth)/login" style={styles.footerLink}>
              Inicia sesión
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
