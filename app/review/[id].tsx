import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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
  user_id: string;
  product_name: string;
  product_price: number;
  content: string;
  is_recommended: boolean;
  business_name: string;
  business_location_text: string;
  google_place_name: string | null;
  place_confirmed: boolean;
  score: number | null;
  created_at: string;
  updated_at: string;
  username: string;
  avatar_url: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
};

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
};

function Avatar({ url, name, size = 38 }: { url: string | null; name: string; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.avatar, style, { backgroundColor: Colors.light.tint }]}>
      {url
        ? <Image source={{ uri: url }} style={[styles.avatarImg, style]} />
        : <Text style={[styles.avatarFallback, { fontSize: size * 0.4 }]}>{name[0].toUpperCase()}</Text>
      }
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ReviewDetailScreen() {
  const { id, data } = useLocalSearchParams<{ id: string; data?: string }>();
  const { user, token } = useAuth();

  const [review, setReview] = useState<Review | null>(data ? JSON.parse(data) : null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews/${id}/comments`)
      .then(r => r.json())
      .then(json => { if (json.success) setComments(json.data); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async (vote: 1 | -1) => {
    if (!user || !token || voting) return;
    setVoting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vote }),
      });
      const json = await res.json();
      if (json.success && review) {
        setReview({
          ...review,
          upvotes: vote === 1 ? review.upvotes + 1 : review.upvotes,
          downvotes: vote === -1 ? review.downvotes + 1 : review.downvotes,
        });
      }
    } finally {
      setVoting(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !token || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setComments(prev => [...prev, { ...json.data, username: user!.username, avatar_url: user!.avatar_url }]);
        setCommentText('');
        if (review) setReview({ ...review, comment_count: review.comment_count + 1 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!review) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Reseña no encontrada.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Autor */}
          <View style={styles.authorRow}>
            <Avatar url={review.avatar_url} name={review.username} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>@{review.username}</Text>
              <Text style={styles.authorDate}>{formatDate(review.created_at)}</Text>
            </View>
            <View style={[styles.badge, review.is_recommended ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={[styles.badgeText, { color: review.is_recommended ? '#2e7d32' : '#c62828' }]}>
                {review.is_recommended ? 'Recomienda' : 'No recomienda'}
              </Text>
            </View>
          </View>

          {/* Comercio */}
          <View style={styles.businessBox}>
            <Text style={styles.businessName}>{review.google_place_name ?? review.business_name}</Text>
            <Text style={styles.businessLocation}>{review.business_location_text}</Text>
            {review.place_confirmed && (
              <Text style={styles.confirmedTag}>Verificado en Google Maps</Text>
            )}
          </View>

          {/* Producto */}
          <View style={styles.productRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{review.product_name}</Text>
              <Text style={styles.productPrice}>${Number(review.product_price).toLocaleString('es-CO')}</Text>
            </View>
            {review.score !== null && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{Number(review.score).toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Contenido */}
          <Text style={styles.content}>{review.content}</Text>

          {/* Votos */}
          <View style={styles.votesRow}>
            <Pressable
              style={[styles.voteBtn, styles.upvoteBtn]}
              onPress={() => handleVote(1)}
              disabled={!user || voting}
            >
              <Text style={styles.voteBtnText}>👍 {review.upvotes}</Text>
            </Pressable>
            <Pressable
              style={[styles.voteBtn, styles.downvoteBtn]}
              onPress={() => handleVote(-1)}
              disabled={!user || voting}
            >
              <Text style={styles.voteBtnText}>👎 {review.downvotes}</Text>
            </Pressable>
          </View>

          {!user && (
            <Text style={styles.loginHint}>
              <Text style={styles.loginHintLink} onPress={() => router.push('/(auth)/login')}>Inicia sesión</Text>
              {' '}para votar y comentar.
            </Text>
          )}

          {/* Comentarios */}
          <Text style={styles.commentsTitle}>Comentarios ({review.comment_count})</Text>

          {loading
            ? <ActivityIndicator style={{ marginTop: 12 }} color={Colors.light.tint} />
            : comments.length === 0
            ? <Text style={styles.noComments}>Sé el primero en comentar.</Text>
            : comments.map(c => (
              <View key={c.id} style={styles.commentItem}>
                <Avatar url={c.avatar_url} name={c.username} size={32} />
                <View style={styles.commentBody}>
                  <Text style={styles.commentUsername}>@{c.username}</Text>
                  <Text style={styles.commentContent}>{c.content}</Text>
                  <Text style={styles.commentDate}>{formatDate(c.created_at)}</Text>
                </View>
              </View>
            ))
          }

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Input comentario */}
        {user && (
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escribe un comentario..."
              placeholderTextColor="#aaa"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
              onPress={handleComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.sendBtnText}>Enviar</Text>
              }
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  errorText: { fontSize: 16, color: '#999', marginBottom: 16 },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { alignSelf: 'flex-start' },
  backBtnText: { color: Colors.light.tint, fontSize: 15, fontWeight: '600' },

  scroll: { padding: 16, gap: 16 },

  // Autor
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: {},
  avatarFallback: { color: '#fff', fontWeight: '700' },
  authorName: { fontSize: 14, fontWeight: '700', color: '#11181C' },
  authorDate: { fontSize: 12, color: '#999' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeGreen: { backgroundColor: '#e8f5e9' },
  badgeRed: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 12, fontWeight: '700' },

  // Comercio
  businessBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  businessName: { fontSize: 16, fontWeight: '800', color: '#11181C' },
  businessLocation: { fontSize: 13, color: '#687076' },
  confirmedTag: { fontSize: 11, color: Colors.light.tint, fontWeight: '600', marginTop: 2 },

  // Producto
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  productName: { fontSize: 15, fontWeight: '700', color: '#11181C', marginBottom: 4 },
  productPrice: { fontSize: 14, color: Colors.light.tint, fontWeight: '600' },
  scoreBadge: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  scoreText: { color: '#fff', fontWeight: '800', fontSize: 18 },

  // Contenido
  content: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },

  // Votos
  votesRow: { flexDirection: 'row', gap: 12 },
  voteBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  upvoteBtn: { backgroundColor: '#e8f5e9' },
  downvoteBtn: { backgroundColor: '#ffebee' },
  voteBtnText: { fontSize: 15, fontWeight: '700', color: '#11181C' },
  loginHint: { fontSize: 13, color: '#687076', textAlign: 'center' },
  loginHintLink: { color: Colors.light.tint, fontWeight: '600' },

  // Comentarios
  commentsTitle: { fontSize: 15, fontWeight: '700', color: '#11181C', marginTop: 4 },
  noComments: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 8 },
  commentItem: { flexDirection: 'row', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  commentBody: { flex: 1, gap: 2 },
  commentUsername: { fontSize: 13, fontWeight: '700', color: '#11181C' },
  commentContent: { fontSize: 14, color: '#444', lineHeight: 20 },
  commentDate: { fontSize: 11, color: '#aaa', marginTop: 2 },

  // Input comentario
  commentInputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#11181C',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
