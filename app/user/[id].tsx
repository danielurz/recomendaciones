// Pantalla de perfil público de un usuario: muestra su reputación y el historial de reseñas.
// Accesible desde el feed al tocar el avatar o el nombre de cualquier usuario.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type UserProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  reputation_score: number;
  created_at: string;
};

type Review = {
  id: string;
  product_name: string;
  product_price: number;
  content: string;
  is_recommended: boolean;
  business_name: string;
  business_location_text: string;
  score: number | null;
  weight: number;
  created_at: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
};

// Convierte el reputation_score del usuario al multiplicador visible en pantalla.
// Espeja la escala definida en backend/src/utils/reputation_multiplier.js
function getMultiplierLabel(score: number): { label: string; color: string } {
  const s = Number(score) || 0;
  if (s >= 25000) return { label: '3.0×', color: '#f59e0b' };
  if (s >= 8000)  return { label: '2.75×', color: '#f59e0b' };
  if (s >= 2000)  return { label: '2.5×', color: '#f59e0b' };
  if (s >= 500)   return { label: '2.25×', color: '#10b981' };
  if (s >= 200)   return { label: '2.0×', color: '#10b981' };
  if (s >= 100)   return { label: '1.75×', color: '#10b981' };
  if (s >= 50)    return { label: '1.5×', color: Colors.light.tint };
  if (s >= 20)    return { label: '1.25×', color: Colors.light.tint };
  return { label: '1.0×', color: '#687076' };
}

// Tarjeta de reseña compacta para el historial del perfil de usuario (sin avatar ni navegación al perfil)
function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardProduct} numberOfLines={1}>{review.product_name}</Text>
          <Text style={styles.cardBusiness} numberOfLines={1}>{review.business_name}</Text>
        </View>
        <View style={[styles.badge, review.is_recommended ? styles.badgeGreen : styles.badgeRed]}>
          <Text style={styles.badgeText}>{review.is_recommended ? 'Recomienda' : 'No recomienda'}</Text>
        </View>
      </View>
      <Text style={styles.cardContent} numberOfLines={2}>{review.content}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.footerStat}>👍 {review.upvotes}</Text>
        <Text style={styles.footerStat}>👎 {review.downvotes}</Text>
        <Text style={styles.footerStat}>💬 {review.comment_count}</Text>
        <Text style={styles.footerPrice}>${Number(review.product_price).toLocaleString('es-CO')}</Text>
      </View>
    </View>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // ID del usuario de la URL dinámica /user/[id]
  const { user } = useAuth(); // usuario autenticado para detectar si es el propio perfil
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Carga el perfil y las reseñas del usuario cuando cambia el ID de la URL
  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/users/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setProfile(json.data.user);
          setReviews(json.data.reviews);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.light.tint} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Usuario no encontrado.</Text>
      </SafeAreaView>
    );
  }

  const { label: multLabel, color: multColor } = getMultiplierLabel(profile.reputation_score);
  const isOwnProfile = user?.id === profile.id;
  const joinYear = new Date(profile.created_at).getFullYear();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Back */}
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backText}>← Volver</Text>
            </Pressable>

            {/* Header perfil */}
            <View style={styles.header}>
              <View style={styles.avatar}>
                {profile.avatar_url
                  ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                  : <Text style={styles.avatarText}>{profile.username[0].toUpperCase()}</Text>
                }
              </View>
              <Text style={styles.username}>@{profile.username}</Text>
              {isOwnProfile && <Text style={styles.ownLabel}>Tu perfil</Text>}
              <Text style={styles.joinDate}>Miembro desde {joinYear}</Text>

              {/* Reputación */}
              <View style={styles.repRow}>
                <View style={[styles.multBadge, { borderColor: multColor }]}>
                  <Text style={[styles.multText, { color: multColor }]}>{multLabel}</Text>
                </View>
                <Text style={styles.repScore}>{Number(profile.reputation_score).toFixed(1)} pts</Text>
              </View>

              {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            </View>

            <Text style={styles.sectionTitle}>
              Reseñas ({reviews.length})
            </Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Este usuario aún no tiene reseñas.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { paddingBottom: 24 },

  backBtn: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  backText: { fontSize: 14, color: Colors.light.tint, fontWeight: '600' },

  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginBottom: 8,
    gap: 4,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatarImg: { width: 76, height: 76 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  username: { fontSize: 20, fontWeight: '800', color: '#11181C' },
  ownLabel: { fontSize: 11, color: Colors.light.tint, fontWeight: '600' },
  joinDate: { fontSize: 12, color: '#aaa', marginBottom: 6 },

  repRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  multBadge: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  multText: { fontSize: 13, fontWeight: '700' },
  repScore: { fontSize: 13, color: '#687076' },

  bio: { fontSize: 13, color: '#687076', textAlign: 'center', marginTop: 6, lineHeight: 19 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#11181C',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardProduct: { fontSize: 14, fontWeight: '700', color: '#11181C' },
  cardBusiness: { fontSize: 12, color: '#687076', marginTop: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#e8f5e9' },
  badgeRed: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#11181C' },
  cardContent: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerStat: { fontSize: 12, color: '#687076' },
  footerPrice: { marginLeft: 'auto', fontSize: 12, color: Colors.light.tint, fontWeight: '600' },

  emptyText: { textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 24 },
  errorText: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 14 },
});
