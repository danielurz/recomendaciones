import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { Colors } from '@/constants/theme';
import ReviewModal, { type Review as ModalReview } from '@/components/ReviewModal';

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
          <Text style={[styles.badgeText, { color: review.is_recommended ? '#2e7d32' : '#c62828' }]}>
            {review.is_recommended ? 'Recomienda' : 'No recomienda'}
          </Text>
        </View>
      </View>

      <Text style={styles.cardProduct}>{review.product_name}</Text>
      <Text style={styles.cardPrice}>${Number(review.product_price).toLocaleString('es-CO')}</Text>
      <Text style={styles.cardContent} numberOfLines={3}>{review.content}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.footerStat}>👍 {review.upvotes}</Text>
        <Text style={styles.footerStat}>👎 {review.downvotes}</Text>
        <Text style={styles.footerStat}>💬 {review.comment_count}</Text>
        <Text style={styles.footerLocation} numberOfLines={1}>{review.business_location_text}</Text>
      </View>
    </Pressable>
  );
}

export default function SearchScreen() {
  const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();

  const [query, setQuery] = useState(initialQuery ?? '');
  const [results, setResults] = useState<Review[]>([]);
  const [summary, setSummary] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ModalReview | null>(null);
  useEffect(() => {
    if (initialQuery?.trim()) {
      setQuery(initialQuery);
      runSearch(initialQuery.trim());
    }
  }, [initialQuery]);

  const runSearch = async (q: string) => {
    setResults([]);
    setSummary('');
    setSearched(true);
    setLoadingResults(true);
    setLoadingSummary(true);

    const encoded = encodeURIComponent(q);

    // Resultados: llegan rápido, luego se pasan al summary para no repetir el trabajo
    fetch(`${API_URL}/api/search/results?q=${encoded}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) return [];
        setResults(json.data.results);
        setLoadingResults(false);
        return json.data.results;
      })
      .then(reviewResults => {
        // Summary IA: recibe los resultados ya obtenidos, solo genera el texto
        return fetch(`${API_URL}/api/search/summary?q=${encoded}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: reviewResults }),
        });
      })
      .then(r => r.json())
      .then(json => { if (json.success) setSummary(json.data.summary); })
      .finally(() => setLoadingSummary(false));
  };

  const handleSearch = () => {
    if (query.trim()) runSearch(query.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar con IA..."
          placeholderTextColor="#aaa"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus={!initialQuery}
        />
        <Pressable style={styles.searchBtn} onPress={handleSearch} disabled={loadingResults}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </Pressable>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          !searched ? (
            <Text style={styles.hint}>Escribe algo para buscar reseñas con IA.</Text>
          ) : (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Conclusión de la IA</Text>
              {loadingSummary ? (
                <View style={styles.summaryLoading}>
                  <ActivityIndicator size="small" color={Colors.light.tint} />
                  <Text style={styles.summaryLoadingText}>Analizando reseñas...</Text>
                </View>
              ) : (
                <Text style={styles.summaryText}>{summary}</Text>
              )}

              {searched && (
                <Text style={styles.resultsLabel}>
                  {loadingResults
                    ? 'Buscando reseñas...'
                    : `${results.length} reseña${results.length !== 1 ? 's' : ''} encontrada${results.length !== 1 ? 's' : ''}`
                  }
                </Text>
              )}
            </View>
          )
        }
        ListEmptyComponent={
          searched && !loadingResults ? (
            <Text style={styles.empty}>No se encontraron reseñas para esta búsqueda.</Text>
          ) : loadingResults ? (
            <ActivityIndicator style={{ marginTop: 16 }} color={Colors.light.tint} />
          ) : null
        }
        renderItem={({ item }) => <ReviewCard review={item} onPress={setSelectedReview} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Search bar
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
  backBtn: { justifyContent: 'center', paddingRight: 4 },
  backBtnText: { fontSize: 22, color: Colors.light.tint, fontWeight: '600' },

  list: { padding: 12 },
  hint: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 40 },
  empty: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 16 },

  // Summary box
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.tint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLoadingText: { color: '#aaa', fontSize: 13 },
  summaryText: { fontSize: 14, color: '#333', lineHeight: 21 },
  resultsLabel: { fontSize: 12, color: '#999', marginTop: 4 },

  // Card (igual que feed)
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
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 38, height: 38 },
  avatarFallback: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardUsername: { fontSize: 13, fontWeight: '600', color: '#11181C' },
  cardBusiness: { fontSize: 12, color: '#687076' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#e8f5e9' },
  badgeRed: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardProduct: { fontSize: 15, fontWeight: '700', color: '#11181C', marginBottom: 2 },
  cardPrice: { fontSize: 13, color: Colors.light.tint, fontWeight: '600', marginBottom: 8 },
  cardContent: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerStat: { fontSize: 13, color: '#687076' },
  footerLocation: { flex: 1, fontSize: 12, color: '#aaa', textAlign: 'right' },
});
