import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { type Review } from '@/components/ReviewModal';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

type Suggestion = {
  place_id: string;
  main_text: string;
  secondary_text: string | null;
  description: string;
};

type PlaceData = {
  google_place_id: string;
  google_place_name: string;
  place_confirmed: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (review: Review) => void;
};

const EMPTY_FORM = {
  product_name: '',
  product_price: '',
  content: '',
  business_name: '',
  business_location_text: '',
  is_recommended: true as boolean,
};

// Genera un session token simple para agrupar llamadas de billing en Google Places
function newSessionToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CreateReviewModal({ visible, onClose, onCreated }: Props) {
  const { user, token } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef(newSessionToken());

  const set = (key: keyof typeof EMPTY_FORM, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setPlaceData(null);
    setSuggestions([]);
    setError('');
    sessionTokenRef.current = newSessionToken();
    onClose();
  };

  const handleBusinessInput = (text: string) => {
    set('business_name', text);
    setPlaceData(null); // El usuario está editando manualmente, limpia la selección previa

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `${API_URL}/api/places/autocomplete?q=${encodeURIComponent(text)}&sessiontoken=${sessionTokenRef.current}`
        );
        const json = await res.json();
        if (json.success) setSuggestions(json.data);
      } catch {
        // Silencioso — el usuario puede escribir manualmente si falla
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (s: Suggestion) => {
    setForm(prev => ({
      ...prev,
      business_name: s.main_text,
      business_location_text: s.secondary_text ?? '',
    }));
    setPlaceData({
      google_place_id: s.place_id,
      google_place_name: s.main_text,
      place_confirmed: true,
    });
    setSuggestions([]);
    // Renueva el session token tras la selección (nueva sesión de billing)
    sessionTokenRef.current = newSessionToken();
  };

  const handleSubmit = async () => {
    if (!token) return;
    const { product_name, product_price, content, business_name, business_location_text } = form;
    if (!product_name.trim() || !product_price.trim() || !content.trim() || !business_name.trim() || !business_location_text.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    const price = parseFloat(product_price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      setError('El precio debe ser un número válido.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product_name: product_name.trim(),
          product_price: price,
          content: content.trim(),
          business_name: business_name.trim(),
          business_location_text: business_location_text.trim(),
          is_recommended: form.is_recommended,
          ...(placeData ?? {}),
        }),
      });
      const json = await res.json();
      if (json.success) {
        onCreated({
          ...json.data,
          username: user!.username,
          avatar_url: user!.avatar_url,
          upvotes: 0,
          downvotes: 0,
          comment_count: 0,
        });
        handleClose();
      } else {
        setError(json.message ?? 'Error al crear la reseña.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modal} onPress={() => {}}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Nueva reseña</Text>
              <Pressable onPress={handleClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Recomienda toggle */}
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleBtn, form.is_recommended && styles.toggleBtnActive]}
                  onPress={() => set('is_recommended', true)}
                >
                  <Text style={[styles.toggleBtnText, form.is_recommended && styles.toggleBtnTextActive]}>
                    👍 Recomienda
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, !form.is_recommended && styles.toggleBtnActiveRed]}
                  onPress={() => set('is_recommended', false)}
                >
                  <Text style={[styles.toggleBtnText, !form.is_recommended && styles.toggleBtnTextActiveRed]}>
                    👎 No recomienda
                  </Text>
                </Pressable>
              </View>

              {/* Comercio con autocomplete */}
              <Text style={styles.label}>Comercio</Text>
              <View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Nombre del comercio"
                    placeholderTextColor="#aaa"
                    value={form.business_name}
                    onChangeText={handleBusinessInput}
                    onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                  />
                  {loadingSuggestions && (
                    <ActivityIndicator style={styles.inputSpinner} size="small" color={Colors.light.tint} />
                  )}
                  {placeData && (
                    <Text style={styles.verifiedBadge}>✓ Maps</Text>
                  )}
                </View>

                {suggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    {suggestions.map(s => (
                      <Pressable
                        key={s.place_id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectSuggestion(s)}
                      >
                        <Text style={styles.suggestionMain}>{s.main_text}</Text>
                        {s.secondary_text && (
                          <Text style={styles.suggestionSub} numberOfLines={1}>{s.secondary_text}</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Ubicación — se autocompleta al seleccionar, pero editable */}
              <Text style={styles.label}>Ubicación</Text>
              <TextInput
                style={styles.input}
                placeholder="Dirección o barrio"
                placeholderTextColor="#aaa"
                value={form.business_location_text}
                onChangeText={v => set('business_location_text', v)}
              />

              {/* Producto */}
              <Text style={styles.label}>Producto o servicio</Text>
              <TextInput
                style={styles.input}
                placeholder="¿Qué compraste o usaste?"
                placeholderTextColor="#aaa"
                value={form.product_name}
                onChangeText={v => set('product_name', v)}
              />

              <Text style={styles.label}>Precio (COP)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 25000"
                placeholderTextColor="#aaa"
                value={form.product_price}
                onChangeText={v => set('product_price', v)}
                keyboardType="numeric"
              />

              {/* Contenido */}
              <Text style={styles.label}>Tu reseña</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Cuéntanos tu experiencia..."
                placeholderTextColor="#aaa"
                value={form.content}
                onChangeText={v => set('content', v)}
                multiline
                numberOfLines={4}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitBtnText}>Publicar reseña</Text>
                }
              </Pressable>

              <View style={{ height: 8 }} />
            </ScrollView>

          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#11181C' },
  closeBtn: { fontSize: 20, color: '#999' },

  scroll: { padding: 16, gap: 6 },

  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#efefef',
  },
  toggleBtnActive: { backgroundColor: '#e8f5e9' },
  toggleBtnActiveRed: { backgroundColor: '#ffebee' },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: '#999' },
  toggleBtnTextActive: { color: '#2e7d32' },
  toggleBtnTextActiveRed: { color: '#c62828' },

  label: { fontSize: 12, fontWeight: '700', color: '#687076', marginTop: 10, marginBottom: 4 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#11181C',
  },
  inputSpinner: { position: 'absolute', right: 10 },
  verifiedBadge: {
    fontSize: 11, fontWeight: '700', color: Colors.light.tint,
    position: 'absolute', right: 10,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },

  suggestionsBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionMain: { fontSize: 14, fontWeight: '600', color: '#11181C' },
  suggestionSub: { fontSize: 12, color: '#687076', marginTop: 1 },

  error: { color: '#e53935', fontSize: 13, textAlign: 'center', marginTop: 8 },

  submitBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
