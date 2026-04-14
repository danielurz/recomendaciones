import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export type Review = {
  id: string;
  user_id: string;
  product_name: string;
  product_price: number;
  content: string;
  is_recommended: boolean;
  business_name: string;
  business_location_text: string;
  google_place_name?: string | null;
  place_confirmed?: boolean;
  score?: number | null;
  created_at: string;
  username: string;
  avatar_url: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
};

function SkeletonComments() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <>
      {[0, 1, 2].map(i => (
        <Animated.View key={i} style={[styles.skeletonItem, { opacity }]}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonBody}>
            <View style={styles.skeletonName} />
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
          </View>
        </Animated.View>
      ))}
    </>
  );
}

function Avatar({ url, name, size = 38 }: { url: string | null; name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {url
        ? <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        : <Text style={[styles.avatarFallback, { fontSize: size * 0.4 }]}>{name[0].toUpperCase()}</Text>
      }
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

type Props = {
  review: Review | null;
  onClose: () => void;
};

export default function ReviewModal({ review, onClose }: Props) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [localReview, setLocalReview] = useState<Review | null>(null);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!review) return;
    setLocalReview(review);
    setComments([]);
    setCommentText('');
    setUserVote(null);
    setLoadingComments(true);
    fetch(`${API_URL}/api/reviews/${review.id}/comments`)
      .then(r => r.json())
      .then(json => { if (json.success) setComments(json.data); })
      .finally(() => setLoadingComments(false));
  }, [review?.id]);

  const handleVote = async (vote: 1 | -1) => {
    if (!user || !token || voting || !localReview) return;
    setVoting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews/${localReview.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vote }),
      });
      const json = await res.json();
      if (json.success) {
        let { upvotes, downvotes } = localReview;

        if (json.data === null) {
          // Toggle off: el usuario quitó su voto
          if (userVote === 1) upvotes--;
          if (userVote === -1) downvotes--;
          setUserVote(null);
        } else if (userVote === null) {
          // Voto nuevo
          if (vote === 1) upvotes++;
          else downvotes++;
          setUserVote(vote);
        } else {
          // Cambió el voto (de 👍 a 👎 o viceversa)
          if (userVote === 1) upvotes--;
          else downvotes--;
          if (vote === 1) upvotes++;
          else downvotes++;
          setUserVote(vote);
        }

        setLocalReview({ ...localReview, upvotes, downvotes });
      }
    } finally {
      setVoting(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !token || submitting || !localReview) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews/${localReview.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setComments(prev => [...prev, { ...json.data, username: user!.username, avatar_url: user!.avatar_url }]);
        setCommentText('');
        setLocalReview({ ...localReview, comment_count: localReview.comment_count + 1 });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={!!review} transparent animationType="fade" onRequestClose={onClose}>
      {/* Overlay — toca afuera para cerrar */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Modal centrado — detiene propagación para no cerrarse al tocar adentro */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modal} onPress={() => {}}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reseña</Text>
              <Pressable onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {localReview && (
              <>
                <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* Autor */}
                  <View style={styles.authorRow}>
                    <Avatar url={localReview.avatar_url} name={localReview.username} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.authorName}>@{localReview.username}</Text>
                      <Text style={styles.authorDate}>{formatDate(localReview.created_at)}</Text>
                    </View>
                    <View style={[styles.badge, localReview.is_recommended ? styles.badgeGreen : styles.badgeRed]}>
                      <Text style={[styles.badgeText, { color: localReview.is_recommended ? '#2e7d32' : '#c62828' }]}>
                        {localReview.is_recommended ? 'Recomienda' : 'No recomienda'}
                      </Text>
                    </View>
                  </View>

                  {/* Comercio */}
                  <View style={styles.businessBox}>
                    <Text style={styles.businessName}>{localReview.google_place_name ?? localReview.business_name}</Text>
                    <Text style={styles.businessLocation}>{localReview.business_location_text}</Text>
                    {localReview.place_confirmed && (
                      <Text style={styles.confirmedTag}>Verificado en Google Maps</Text>
                    )}
                  </View>

                  {/* Producto */}
                  <View style={styles.productRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{localReview.product_name}</Text>
                      <Text style={styles.productPrice}>${Number(localReview.product_price).toLocaleString('es-CO')}</Text>
                    </View>
                    {localReview.score != null && (
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreText}>{Number(localReview.score).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Contenido */}
                  <Text style={styles.content}>{localReview.content}</Text>

                  {/* Votos */}
                  <View style={styles.votesRow}>
                    <Pressable style={[styles.voteBtn, styles.upvoteBtn, userVote === 1 && styles.upvoteBtnActive]} onPress={() => handleVote(1)} disabled={!user || voting}>
                      <Text style={styles.voteBtnText}>👍 {localReview.upvotes}</Text>
                    </Pressable>
                    <Pressable style={[styles.voteBtn, styles.downvoteBtn, userVote === -1 && styles.downvoteBtnActive]} onPress={() => handleVote(-1)} disabled={!user || voting}>
                      <Text style={styles.voteBtnText}>👎 {localReview.downvotes}</Text>
                    </Pressable>
                  </View>

                  {!user && (
                    <Text style={styles.loginHint}>
                      <Text style={styles.loginHintLink} onPress={() => { onClose(); router.push('/(auth)/login'); }}>
                        Inicia sesión
                      </Text>{' '}para votar y comentar.
                    </Text>
                  )}

                  {/* Comentarios */}
                  <Text style={styles.commentsTitle}>Comentarios ({localReview.comment_count})</Text>

                  {loadingComments
                    ? <SkeletonComments />
                    : comments.length === 0
                    ? <Text style={styles.noComments}>Sé el primero en comentar.</Text>
                    : comments.map(c => (
                      <View key={c.id} style={styles.commentItem}>
                        <Avatar url={c.avatar_url} name={c.username} size={30} />
                        <View style={styles.commentBody}>
                          <Text style={styles.commentUsername}>@{c.username}</Text>
                          <Text style={styles.commentContent}>{c.content}</Text>
                          <Text style={styles.commentDate}>{formatDate(c.created_at)}</Text>
                        </View>
                      </View>
                    ))
                  }
                  <View style={{ height: 8 }} />
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
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  closeBtn: { fontSize: 20, color: '#999' },

  scroll: { padding: 16, gap: 12 },

  avatar: { backgroundColor: Colors.light.tint, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarFallback: { color: '#fff', fontWeight: '700' },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorName: { fontSize: 13, fontWeight: '700', color: '#11181C' },
  authorDate: { fontSize: 11, color: '#999' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#e8f5e9' },
  badgeRed: { backgroundColor: '#ffebee' },
  badgeText: { fontSize: 11, fontWeight: '700' },

  businessBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 3 },
  businessName: { fontSize: 15, fontWeight: '800', color: '#11181C' },
  businessLocation: { fontSize: 12, color: '#687076' },
  confirmedTag: { fontSize: 10, color: Colors.light.tint, fontWeight: '600' },

  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  productName: { fontSize: 14, fontWeight: '700', color: '#11181C', marginBottom: 2 },
  productPrice: { fontSize: 13, color: Colors.light.tint, fontWeight: '600' },
  scoreBadge: { backgroundColor: Colors.light.tint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  scoreText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  content: { fontSize: 14, color: '#333', lineHeight: 21, backgroundColor: '#fff', borderRadius: 12, padding: 12 },

  votesRow: { flexDirection: 'row', gap: 10 },
  voteBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  upvoteBtn: { backgroundColor: '#e8f5e9' },
  upvoteBtnActive: { backgroundColor: '#a5d6a7' },
  downvoteBtn: { backgroundColor: '#ffebee' },
  downvoteBtnActive: { backgroundColor: '#ef9a9a' },
  voteBtnText: { fontSize: 14, fontWeight: '700', color: '#11181C' },
  loginHint: { fontSize: 12, color: '#687076', textAlign: 'center' },
  loginHintLink: { color: Colors.light.tint, fontWeight: '600' },

  commentsTitle: { fontSize: 14, fontWeight: '700', color: '#11181C' },
  noComments: { color: '#aaa', fontSize: 13, textAlign: 'center' },
  commentItem: { flexDirection: 'row', gap: 8, backgroundColor: '#fff', borderRadius: 10, padding: 10 },
  commentBody: { flex: 1, gap: 2 },
  commentUsername: { fontSize: 12, fontWeight: '700', color: '#11181C' },
  commentContent: { fontSize: 13, color: '#444', lineHeight: 18 },
  commentDate: { fontSize: 10, color: '#aaa' },

  commentInputRow: {
    flexDirection: 'row', padding: 10, gap: 8,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#11181C', maxHeight: 80,
  },
  sendBtn: { backgroundColor: Colors.light.tint, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  skeletonItem: { flexDirection: 'row', gap: 8, backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8 },
  skeletonAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#e0e0e0' },
  skeletonBody: { flex: 1, gap: 6, justifyContent: 'center' },
  skeletonName: { width: '35%', height: 10, borderRadius: 5, backgroundColor: '#e0e0e0' },
  skeletonLine: { width: '100%', height: 10, borderRadius: 5, backgroundColor: '#e0e0e0' },
});
