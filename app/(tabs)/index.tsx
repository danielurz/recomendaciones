import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import ReviewModal, { type Review as ModalReview } from '@/components/ReviewModal';
import CreateReviewModal from '@/components/CreateReviewModal';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type Review = {
  id: string;
  product_name: string;
  product_price: number;
  content: string;
  is_recommended: boolean;
  business_name: string;
  business_location_text: string;
  score: number | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
  comment_count: number;
  upvotes: number;
  downvotes: number;
};

function ReviewCard({ review, onPress }: { review: Review; onPress: (r: Review) => void }) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(review)}>
      {/* Header: avatar + usuario + comercio */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {review.avatar_url
            ? <Image source={{ uri: review.avatar_url }} style={styles.avatarImg} />
            : <Text style={styles.avatarFallback}>{review.username[0].toUpperCase()}</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardUsername}>@{review.username}</Text>
          <Text style={styles.cardBusiness} numberOfLines={1}>{review.business_name}</Text>
        </View>
        <View style={[styles.badge, review.is_recommended ? styles.badgeGreen : styles.badgeRed]}>
          <Text style={styles.badgeText}>{review.is_recommended ? 'Recomienda' : 'No recomienda'}</Text>
        </View>
      </View>

      {/* Producto */}
      <Text style={styles.cardProduct}>{review.product_name}</Text>
      <Text style={styles.cardPrice}>${Number(review.product_price).toLocaleString('es-CO')}</Text>

      {/* Contenido */}
      <Text style={styles.cardContent} numberOfLines={3}>{review.content}</Text>

      {/* Footer: stats */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerStat}>👍 {review.upvotes}</Text>
        <Text style={styles.footerStat}>👎 {review.downvotes}</Text>
        <Text style={styles.footerStat}>💬 {review.comment_count}</Text>
        <Text style={styles.footerLocation} numberOfLines={1}>{review.business_location_text}</Text>
      </View>
    </Pressable>
  );
}

export default function FeedScreen() {
  const { user, logout } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<ModalReview | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews`)
      .then(r => r.json())
      .then(json => { if (json.success) setReviews(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({ pathname: '/(tabs)/search', params: { q: searchQuery.trim() } });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.username}>@{user?.username ?? 'invitado'}</Text>
        </View>
        {user && (
          <View style={styles.topActions}>
            <Pressable style={styles.createBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.createBtnText}>+ Reseña</Text>
            </Pressable>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar con IA..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </Pressable>
      </View>

      {/* Feed */}
      {loading
        ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color={Colors.light.tint} />
        : (
          <FlatList
            data={reviews}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ReviewCard review={item} onPress={setSelectedReview} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>No hay reseñas aún.</Text>}
          />
        )
      }

      <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />
      <CreateReviewModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={review => setReviews(prev => [review, ...prev])}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: { fontSize: 12, color: '#687076' },
  username: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  topActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  createBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
  },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e53935',
  },
  logoutText: { color: '#e53935', fontSize: 13, fontWeight: '600' },

  // Search
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#11181C',
  },
  searchBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // List
  list: { padding: 12, gap: 12 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 38, height: 38 },
  avatarFallback: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardUsername: { fontSize: 13, fontWeight: '600', color: '#11181C' },
  cardBusiness: { fontSize: 12, color: '#687076' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#e8f5e9' },
  badgeRed: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#11181C' },
  cardProduct: { fontSize: 15, fontWeight: '700', color: '#11181C', marginBottom: 2 },
  cardPrice: { fontSize: 13, color: Colors.light.tint, fontWeight: '600', marginBottom: 8 },
  cardContent: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerStat: { fontSize: 13, color: '#687076' },
  footerLocation: { flex: 1, fontSize: 12, color: '#aaa', textAlign: 'right' },
});
