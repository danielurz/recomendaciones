import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Usuario no autenticado
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>¿Quieres participar?</Text>
          <Text style={styles.guestSubtitle}>
            Crea una cuenta para publicar reseñas, votar y comentar.
          </Text>
          <Pressable style={styles.buttonPrimary} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.buttonPrimaryText}>Crear cuenta</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.buttonSecondaryText}>Iniciar sesión</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Usuario autenticado
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.reputationBadge}>
          <Text style={styles.reputationText}>⭐ {user.reputation_score} pts</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Mis reseñas</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuItemText}>Editar perfil</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Guest
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  guestIcon: { fontSize: 56, marginBottom: 8 },
  guestTitle: { fontSize: 22, fontWeight: '800', color: '#11181C', textAlign: 'center' },
  guestSubtitle: { fontSize: 14, color: '#687076', textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  buttonPrimary: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  buttonSecondary: {
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonSecondaryText: { color: Colors.light.tint, fontWeight: '700', fontSize: 15 },

  // Authenticated
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#fff' },
  username: { fontSize: 20, fontWeight: '800', color: '#11181C' },
  email: { fontSize: 13, color: '#687076', marginTop: 2 },
  reputationBadge: {
    marginTop: 10,
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  reputationText: { fontSize: 13, color: Colors.light.tint, fontWeight: '600' },

  menu: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: '#fafafa',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  menuItemText: { fontSize: 15, color: '#11181C' },
  menuItemArrow: { fontSize: 20, color: '#aaa' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 18 },

  logoutButton: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffdddd',
  },
  logoutText: { fontSize: 15, color: '#e53935', fontWeight: '600' },
});
