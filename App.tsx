// App.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  Button,
  Image,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  PhotoFile,
} from 'react-native-vision-camera';
import LocationFetcher from './src/components/LocationFetcher';

export default function App() {
  /* ⬅ Normal‑screen state */
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<PhotoFile | null>(null);

  /* ⬅ VisionCamera hooks */
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  /* Ask once on mount */
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  /* Capture a picture */
  const onSnap = useCallback(async () => {
    try {
      const captured = await cameraRef.current?.takePhoto();
      if (captured) {
        setPhoto(captured);
        setShowCamera(false);
      }
    } catch (e) {
      console.warn('Camera error:', e);
    }
  }, []);

  /* ───────────────── Camera full‑screen ───────────────── */
  if (showCamera) {
  if (!hasPermission) return <Text style={styles.center}>Waiting for permission…</Text>;
  if (!device)        return <Text style={styles.center}>No camera.</Text>;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 1️⃣ Camera preview fills the screen */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />

      {/* 2️⃣ Overlay lives on a separate layer */}
      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.snap} onPress={onSnap}>
          <Text style={styles.snapTxt}>SNAP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.close} onPress={() => setShowCamera(false)}>
          <Text style={styles.snapTxt}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

  /* ───────────────── Normal screen ───────────────── */
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Current Location</Text>
      <LocationFetcher />

      {!!photo && (
        <>
          <Text style={styles.previewLabel}>Last photo:</Text>
          <Image source={{ uri: 'file://' + photo.path }} style={styles.preview} />
        </>
      )}

      <Button title="Camera" onPress={() => setShowCamera(true)} />
    </SafeAreaView>
  );
}

/* ───────────── styles ───────────── */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F0F8FF' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  center: { flex: 1, textAlign: 'center', textAlignVertical: 'center' },
  previewLabel: { marginTop: 20, marginBottom: 6, fontWeight: '600' },
  preview: { width: '100%', height: 220, borderRadius: 8, marginBottom: 20 },
  /* camera overlay */
  controls: { flex: 1, justifyContent: 'flex-end', flexDirection: 'row', padding: 24 },
  snap: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 8 },
  close: { backgroundColor: '#ff6961', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginLeft: 12 },
  snapTxt: { fontSize: 16, fontWeight: '600' },
  overlay: {
  position: 'absolute',
  bottom: 32,
  width: '100%',
  flexDirection: 'row',
  justifyContent: 'space-evenly',
  paddingHorizontal: 24,
},



});
