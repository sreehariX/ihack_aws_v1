import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video } from 'expo-av';
import axios from 'axios';

export function VideoKYC({ onComplete }: VideoKYCProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('waiting');
  const [confidence, setConfidence] = useState<number>(0);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const startLivenessSession = async () => {
    try {
      setRecording(true);
      if (cameraRef.current) {
        const videoRecording = await cameraRef.current.recordAsync();
        setRecording(false);
        
        // Create form data with video
        const formData = new FormData();
        formData.append('video', {
          uri: videoRecording.uri,
          type: 'video/mp4',
          name: 'liveness_check.mp4'
        });

        // Start liveness session
        const response = await axios.post('http://your-api-url/video/create-liveness-session', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setSessionId(response.data.session_id);
        pollResults(response.data.session_id);
      }
    } catch (error) {
      console.error('Error starting liveness session:', error);
      Alert.alert('Error', 'Failed to start liveness check');
      setRecording(false);
    }
  };

  const pollResults = async (sid: string) => {
    try {
      const checkResults = async () => {
        const response = await axios.get(`http://your-api-url/video/get-liveness-results/${sid}`);
        
        if (response.data.status === 'SUCCEEDED') {
          setConfidence(response.data.confidence);
          setAnalysisStatus('completed');
          onComplete && onComplete();
        } else if (response.data.status === 'FAILED' || response.data.status === 'EXPIRED') {
          setAnalysisStatus('failed');
          Alert.alert('Error', 'Liveness check failed');
        } else {
          setTimeout(checkResults, 2000);
        }
      };

      checkResults();
    } catch (error) {
      console.error('Error polling results:', error);
      setAnalysisStatus('failed');
    }
  };

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <ThemedText>No access to camera</ThemedText>;
  }

  return (
    <View style={styles.container}>
      <Camera 
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.front}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <ThemedText style={styles.headerText}>Liveness Check</ThemedText>
            <View style={styles.analysisStatus}>
              <MaterialIcons 
                name={analysisStatus === 'completed' ? "check-circle" : "timelapse"} 
                size={16} 
                color={analysisStatus === 'completed' ? "#4CAF50" : "#FFA000"} 
              />
              <ThemedText style={styles.statusText}>
                {analysisStatus === 'completed' ? 'Verified' : 'Analyzing...'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.faceBoundary}>
            <MaterialIcons name="face" size={120} color="#ffffff50" />
            <ThemedText style={styles.previewText}>
              {recording ? 'Recording...' : 'Position your face in the circle'}
            </ThemedText>
          </View>

          <TouchableOpacity 
            style={[styles.recordButton, recording && styles.recordingButton]}
            onPress={recording ? undefined : startLivenessSession}
            disabled={recording}
          >
            <MaterialIcons 
              name={recording ? "stop" : "videocam"} 
              size={32} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles remain the same ...
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 20,
  },
  recordButton: {
    alignSelf: 'center',
    marginBottom: 40,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#f44336',
  }
});