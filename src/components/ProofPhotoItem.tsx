import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import type { ProofPhoto } from '../modules/proof-photos';

interface ProofPhotoItemProps {
  photo: ProofPhoto;
  onPress?: (photo: ProofPhoto) => void;
}

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

export function ProofPhotoItem({ photo, onPress }: ProofPhotoItemProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Storage path looks like "proofs/{campaign}/{driver}/{ts}.jpg"
      // Strip the bucket prefix to get the path within the bucket
      const bucket = 'proofs';
      const pathWithinBucket = photo.storagePath.startsWith(`${bucket}/`)
        ? photo.storagePath.slice(bucket.length + 1)
        : photo.storagePath;

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(pathWithinBucket, SIGNED_URL_EXPIRY_SECONDS);

      if (cancelled) return;

      if (error || !data?.signedUrl) {
        setImageError(true);
        return;
      }
      setImageUrl(data.signedUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [photo.storagePath]);

  const dateLabel = photo.photoTimestamp.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });

  return (
    <Pressable
      onPress={() => onPress?.(photo)}
      style={styles.container}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Zdjęcie z ${dateLabel}`}
    >
      {imageError ? (
        <View style={[styles.image, styles.imageError]}>
          <Text style={styles.imageErrorText}>Błąd ładowania</Text>
        </View>
      ) : imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.image, styles.imageLoading]} />
      )}
      <View style={styles.overlay}>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#111720',
    borderWidth: 1,
    borderColor: '#1E2A38',
    minHeight: 180,
  },
  image: { width: '100%', height: 180 },
  imageLoading: { backgroundColor: '#0D1117' },
  imageError: {
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: { color: '#4A5568', fontSize: 12 },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  date: { color: '#E6EDF3', fontSize: 12, fontWeight: '500' },
});
