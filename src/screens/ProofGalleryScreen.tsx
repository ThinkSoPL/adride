import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useProofPhotoCamera } from '../modules/proof-photos';
import type { ProofPhoto } from '../modules/proof-photos';
import type { AppStackParamList, ProofGalleryScreenProps } from '../navigation/types';
import { ProofPhotoItem } from '../components/ProofPhotoItem';

export function ProofGalleryScreen({ route }: ProofGalleryScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { driverId, campaignId } = route.params;

  const [photos, setPhotos] = useState<ProofPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);

  const handlePhotoUploaded = useCallback((newPhoto: ProofPhoto) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    setCameraVisible(false);
  }, []);

  const {
    cameraRef,
    hasPermission,
    isUploading,
    uploadError,
    takePhoto,
    clearError,
  } = useProofPhotoCamera(driverId, campaignId, handlePhotoUploaded);

  const loadPhotos = useCallback(async () => {
    if (!driverId || !campaignId) {
      setLoadError('Brak danych kierowcy lub kampanii');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from('proof_photos')
      .select('*')
      .eq('driver_id', driverId)
      .eq('campaign_id', campaignId)
      .order('photo_timestamp', { ascending: false });

    if (error) {
      setLoadError('Nie udało się pobrać zdjęć');
      setLoading(false);
      return;
    }

    setPhotos(
      (data ?? []).map((p) => ({
        id: p.id,
        createdAt: new Date(p.created_at),
        driverId: p.driver_id,
        campaignId: p.campaign_id,
        storagePath: p.storage_path,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracyMeters: p.accuracy_meters,
        photoTimestamp: new Date(p.photo_timestamp),
      })),
    );
    setLoading(false);
  }, [driverId, campaignId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setCameraVisible(true)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginRight: 4 })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dodaj zdjęcie dowodowe"
        >
          <Text style={styles.headerButton}>+ Zdjęcie</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const renderPhotoItem = useCallback(
    ({ item }: { item: ProofPhoto }) => <ProofPhotoItem photo={item} />,
    [],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{loadError}</Text>
        <Pressable style={styles.retryButton} onPress={loadPhotos}>
          <Text style={styles.retryText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  const showCameraModal = cameraVisible && hasPermission === true;
  const showPermissionModal = cameraVisible && hasPermission === false;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {photos.length > 0 ? (
        <FlatList
          data={photos}
          renderItem={renderPhotoItem}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>Brak zdjęć dowodowych</Text>
          <Text style={styles.emptyText}>
            Dodaj zdjęcia z przejazdów, aby udowodnić zasięg kampanii.
          </Text>
          <Pressable
            onPress={() => setCameraVisible(true)}
            style={styles.addPhotoButton}
            accessibilityRole="button"
          >
            <Text style={styles.addPhotoButtonText}>+ Zrób zdjęcie</Text>
          </Pressable>
        </View>
      )}

      {/* Camera Modal */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        onRequestClose={() => !isUploading && setCameraVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />

          <View style={styles.cameraFooter}>
            <Pressable
              onPress={() => setCameraVisible(false)}
              style={({ pressed }) => [
                styles.cameraButton,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              disabled={isUploading}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Anuluj</Text>
            </Pressable>

            <Pressable
              onPress={takePhoto}
              style={({ pressed }) => [
                styles.snapButton,
                pressed && styles.snapButtonPressed,
                isUploading && styles.snapButtonDisabled,
              ]}
              disabled={isUploading}
              accessibilityRole="button"
              accessibilityLabel="Zrób zdjęcie"
            >
              {isUploading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.snapButtonText}>📸</Text>
              )}
            </Pressable>

            <View style={styles.cameraButton} />
          </View>

          {uploadError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText} numberOfLines={3}>
                {uploadError}
              </Text>
              <Pressable onPress={clearError} hitSlop={8}>
                <Text style={styles.errorClose}>✕</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Permission Modal */}
      <Modal
        visible={showPermissionModal}
        animationType="fade"
        onRequestClose={() => setCameraVisible(false)}
        transparent={false}
      >
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Brak dostępu do kamery</Text>
          <Text style={styles.permissionText}>
            Przyznaj uprawnienia do kamery w ustawieniach urządzenia, aby móc dodawać zdjęcia
            dowodowe.
          </Text>
          <Pressable
            onPress={() => setCameraVisible(false)}
            style={styles.permissionButton}
            accessibilityRole="button"
          >
            <Text style={styles.permissionButtonText}>Zamknij</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0D12' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0D12',
    padding: 24,
  },
  errorTitle: {
    color: '#FC8181',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1E2A38',
    borderRadius: 8,
  },
  retryText: { color: '#FF6B35', fontSize: 14 },
  columnWrapper: { gap: 4, paddingHorizontal: 8 },
  listContent: { paddingVertical: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addPhotoButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
    justifyContent: 'center',
  },
  addPhotoButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  headerButton: { color: '#FF6B35', fontSize: 14, fontWeight: '600' },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraFooter: {
    backgroundColor: '#0A0D12',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 32,
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapButtonPressed: { backgroundColor: '#FF9A35' },
  snapButtonDisabled: { opacity: 0.6 },
  snapButtonText: { fontSize: 28 },
  cancelButton: { backgroundColor: 'rgba(255,107,53,0.2)' },
  cancelButtonPressed: { backgroundColor: 'rgba(255,107,53,0.4)' },
  cancelButtonText: { color: '#FF6B35', fontSize: 12, fontWeight: '600' },
  errorBanner: {
    position: 'absolute',
    bottom: 130,
    left: 16,
    right: 16,
    backgroundColor: '#FC8181',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: '#742A2A', fontSize: 13, fontWeight: '500', flex: 1 },
  errorClose: { color: '#742A2A', fontSize: 16, fontWeight: 'bold' },

  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0D12',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E6EDF3',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minHeight: 44,
    justifyContent: 'center',
  },
  permissionButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
