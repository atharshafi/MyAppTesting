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
  useFrameProcessor,
} from 'react-native-vision-camera';
import { Face, useFaceDetector, FaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import LocationFetcher from './src/components/LocationFetcher';

export default function App() {
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<PhotoFile | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [faceDetectionCount, setFaceDetectionCount] = useState(0);
  const detectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const onSnap = useCallback(async () => {
    if (isTakingPhoto) return;
    
    setIsTakingPhoto(true);
    try {
      const captured = await cameraRef.current?.takePhoto();
      if (captured) {
        setPhoto(captured);
        setShowCamera(false);
      }
    } catch (e) {
      console.warn('Camera error:', e);
    } finally {
      setIsTakingPhoto(false);
      setFaceDetectionCount(0);
      if (detectionTimerRef.current) {
        clearTimeout(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
    }
  }, [isTakingPhoto]);

  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    performanceMode: 'accurate',
    landmarkMode: 'all',
    contourMode: 'all',
    classificationMode: 'all',
    minFaceSize: 0.35,
    trackingEnabled: true,
  }).current;

  const { detectFaces } = useFaceDetector(faceDetectionOptions);

  const isCompleteFace = (face: Face) => {
    // Check for both eyes with good confidence
    const hasBothEyes = face.leftEyeOpenProbability > 0.5 && 
                       face.rightEyeOpenProbability > 0.5;
    
    // Check for mouth (either smiling or neutral)
    const hasMouth = face.smilingProbability !== -1;
    
    // Check face angles are within reasonable range
    const goodAngles = Math.abs(face.rollAngle || 0) < 20 && 
                      Math.abs(face.yawAngle || 0) < 20 &&
                      Math.abs(face.pitchAngle || 0) < 20;
    
    // Face should cover sufficient area
    const goodSize = face.bounds.width > 0.3 && face.bounds.height > 0.3;
    
    return hasBothEyes && hasMouth && goodAngles && goodSize;
  };

  const handleDetectedFaces = Worklets.createRunOnJS((faces: Face[]) => {
    if (faces.length > 0 && !isTakingPhoto) {
      const face = faces[0];
      
      if (isCompleteFace(face)) {
        setFaceDetectionCount(prev => {
          const newCount = prev + 1;
          
          // Require 10 consecutive detections (~0.3-0.5s at 30-60fps)
          if (newCount >= 10 && !detectionTimerRef.current) {
            detectionTimerRef.current = setTimeout(() => {
              onSnap();
            }, 300); // Additional delay
          }
          return newCount;
        });
      } else {
        setFaceDetectionCount(0);
      }
    } else {
      setFaceDetectionCount(0);
      if (detectionTimerRef.current) {
        clearTimeout(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    handleDetectedFaces(faces);
  }, [handleDetectedFaces]);

  useEffect(() => {
    return () => {
      if (detectionTimerRef.current) {
        clearTimeout(detectionTimerRef.current);
      }
    };
  }, []);

  if (showCamera) {
    if (!hasPermission) return <Text style={styles.center}>Waiting for permission…</Text>;
    if (!device) return <Text style={styles.center}>No camera.</Text>;

    return (
      <View style={StyleSheet.absoluteFill}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          photo
          frameProcessor={frameProcessor}
        />
        <View style={styles.overlay}>
          <View style={styles.faceGuide} />
          <TouchableOpacity style={styles.snap} onPress={onSnap}>
            <Text style={styles.snapTxt}>MANUAL CAPTURE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.close} onPress={() => setShowCamera(false)}>
            <Text style={styles.snapTxt}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Face Verification</Text>
      <LocationFetcher />
      {photo && (
        <>
          <Text style={styles.previewLabel}>Last capture:</Text>
          <Image source={{ uri: 'file://' + photo.path }} style={styles.preview} />
        </>
      )}
      <Button title="Open Camera" onPress={() => setShowCamera(true)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F0F8FF' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  center: { flex: 1, textAlign: 'center', textAlignVertical: 'center' },
  previewLabel: { marginTop: 20, marginBottom: 6, fontWeight: '600' },
  preview: { width: '50%', height: 250, borderRadius: 10, marginBottom: 20, alignSelf: 'center', },
  snap: { 
    backgroundColor: '#fff', 
    paddingVertical: 12, 
    paddingHorizontal: 28, 
    borderRadius: 8,
    marginBottom: 20
  },
  close: { 
    backgroundColor: '#ff6961', 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 8 
  },
  snapTxt: { fontSize: 16, fontWeight: '600' },
  overlay: {
    position: 'absolute',
    bottom: 32,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  faceGuide: {
    width: 200,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 100,
    marginBottom: 40,
    backgroundColor: 'transparent'
  }
});