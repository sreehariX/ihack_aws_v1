import { Audio } from 'expo-av';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { websocketService } from '@/services/websocketService';
import { Alert, Platform, Linking } from 'react-native';
import { audioService } from '@/services/audioService';

export function useRecording() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const chunkInterval = useRef<NodeJS.Timeout | null>(null);
  const chunkDuration = 200; // 200ms chunks

  useEffect(() => {
    checkPermissions();
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const checkPermissions = async () => {
    try {
      // First check if we already have permissions
      const { status: existingStatus } = await Audio.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setHasPermission(true);
        return true;
      }

      // If not, request permissions
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        const granted = await checkPermissions();
        if (!granted) return;
      }

      const recordingOptions = {
        android: {
          extension: '.raw',
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
        },
        ios: {
          extension: '.raw',
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 16000,
        }
      };

      console.log('Starting recording with options:', recordingOptions);
      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions,
        onRecordingStatusUpdate,
        200 // 200ms chunks
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      audioStreamingService.connect((text) => {
        console.log('Received transcription:', text);
        if (text.toLowerCase().includes('otp')) {
          setShowWarning(true);
        }
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const processChunk = async () => {
    if (!recording) return;

    try {
      // Create a new recording for the next chunk
      const status = await recording.getStatusAsync();
      if (!status.isRecording) return;

      // Stop current recording
      await recording.stopAndUnloadAsync();
      const uri = await recording.getURI();
      
      if (!uri) return;

      console.log('Processing chunk at:', duration);

      // Upload and process the chunk
      const uploadResponse = await audioService.uploadAudio(uri, {
        category: "chunk",
        description: "Live transcription chunk",
        duration: 5
      });

      if (uploadResponse?.id) {
        const transcribeResponse = await audioService.transcribeAudio(uploadResponse.id);
        console.log('Transcribe response:', transcribeResponse);
        
        if (transcribeResponse.has_otp) {
          setShowWarning(true);
        }
      }

      // Start new recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onRecordingStatusUpdate,
        100
      );
      setRecording(newRecording);

    } catch (error) {
      console.error('Error processing chunk:', error);
    }
  };

  const onRecordingStatusUpdate = async (status: any) => {
    if (status.isRecording) {
      setDuration(status.durationMillis / 1000);
      
      try {
        const uri = await recording?.getURI();
        if (!uri) return;

        const response = await fetch(uri);
        const blob = await response.blob();
        console.log('Sending audio chunk, size:', blob.size);
        await audioStreamingService.sendAudioChunk(blob);
      } catch (error) {
        console.error('Error sending audio chunk:', error);
      }
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        audioStreamingService.disconnect();
        setRecording(null);
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    hasPermission,
    showWarning,
    setShowWarning
  };
}