import { StyleSheet, View, TouchableOpacity, Alert, Animated } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRecording } from '@/hooks/useRecording';
import { LinearGradient } from 'expo-linear-gradient';
import { audioService} from '@/services/audioService';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { API_CONFIG } from '@/config/api';

interface CallSimulationProps {
  phoneNumber: string;
  isDemo?: boolean;
  selectedDemo?: { id: number };
  onHangUp: () => void;
}

export function CallSimulation({ 
  phoneNumber, 
  isDemo = false,
  selectedDemo,
  onHangUp 
}: CallSimulationProps) {
  const { isRecording, duration, startRecording, stopRecording, hasPermission, showWarning, setShowWarning } = useRecording();
  const sound = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [liveTranscription, setLiveTranscription] = useState<string>('');
  const [finalTranscription, setFinalTranscription] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);
  const transcriptionRequested = useRef(false);
  const [fraudAnalysisTimer, setFraudAnalysisTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [showFraudWarning, setShowFraudWarning] = useState(false);
  const accumulatedTextRef = useRef('');
  const fraudAnalysisTimerRef = useRef<NodeJS.Timeout | null>(null);

  console.log('Component rendered with initial state');

  useEffect(() => {
    if (showWarning) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => setShowWarning(false));
    }
  }, [showWarning]);

  const checkForOTP = (text: string) => {
    const otpPattern = /(otp|one.?time.?password|verification.?code)/i;
    return otpPattern.test(text);
  };

  const playDemoAudio = async () => {
    try {
      if (!selectedDemo?.id) return;
      
      const streamUrl = await audioService.streamDemo(selectedDemo.id);
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { progressUpdateIntervalMillis: 500 },
        onPlaybackStatusUpdate
      );
      sound.current = audioSound;
      await audioSound.playAsync();
    } catch (error) {
      console.error('Error playing demo audio:', error);
      Alert.alert('Error', 'Failed to play demo audio', [{ text: 'OK', onPress: onHangUp }]);
    }
  };

  useEffect(() => {
    
    return () => {
      if (eventSourceRef.current) {
        console.log('Cleaning up SSE connection on unmount');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      transcriptionRequested.current = false;
    };
  }, []);

  const onPlaybackStatusUpdate = async (status: any) => {
    if (!status.isLoaded || !isActive) return;
    
    setPlaybackDuration(status.positionMillis / 1000);

    if (status.didJustFinish) {
      setIsActive(false);
      if (sound.current) {
        await sound.current.unloadAsync();
      }
      onHangUp();
      return;
    }

    
    if (status.isPlaying && !transcriptionRequested.current && !eventSourceRef.current && selectedDemo?.id) {
      try {
        transcriptionRequested.current = true;
        
        const eventSource = new EventSourcePolyfill(
          `${API_CONFIG.BASE_URL}/audio/realtimetranscribe/${selectedDemo.id}`,
          {
            withCredentials: false,
            headers: {
              'Accept': 'text/event-stream',
            },
            heartbeatTimeout: 60000,
          }
        );

        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('SSE Connection opened successfully');
        };
        
        eventSource.onmessage = (event) => {
          try {
            console.log('Received event from EventSource:', event);
            const data = JSON.parse(event.data);
            console.log('Parsed event data:', data);
            
            if (data.live) {
              setLiveTranscription(data.transcription);
            } else {
              setFinalTranscription(prev => {
                const newTranscription = prev ? `${prev} ${data.transcription}` : data.transcription;
                accumulatedTextRef.current = newTranscription;
                return newTranscription;
              });
              setLiveTranscription('');
            }
          } catch (error) {
            console.error('Error in eventSource.onmessage:', error);
          }
        };

  
        const timer = setInterval(async () => {
          if (accumulatedTextRef.current.trim()) {
            console.log('Making POST request to analyze_fraud with text:', accumulatedTextRef.current);
            
            fetch(`${API_CONFIG.BASE_URL}/audio/analyze_fraud`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text: accumulatedTextRef.current })
            })
            .then(response => {
              console.log('Got response from analyze_fraud:', response);
              return response.json();
            })
            .then(result => {
              console.log('Fraud analysis result:', result);
              if (result.classification === 'FRAUD' && result.confidence >= 0.95) {
                setShowFraudWarning(true);
                setTimeout(() => setShowFraudWarning(false), 3000);
              }
            })
            .catch(error => {
              console.error('Error in fraud analysis:', error);
            });
          }
        }, 5000);

        setFraudAnalysisTimer(timer);

        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        };

      } catch (error) {
        console.error('[Transcription Error]:', error);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        transcriptionRequested.current = false;
      }
    }
  };

  const displayTranscription = useMemo(() => {
    return [finalTranscription, liveTranscription].filter(Boolean).join(' ');
  }, [finalTranscription, liveTranscription]);

  useEffect(() => {
    if (isDemo && selectedDemo && isActive) {
      playDemoAudio();
    }

    return () => {
      setIsActive(false);
      transcriptionRequested.current = false;
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, [isDemo, selectedDemo]);

  const initializeRecording = async () => {
    try {
      console.log('Initializing recording...');
      await startRecording();
    } catch (error) {
      console.error('Error initializing recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to initialize recording. Please try again.',
        [{ text: 'OK', onPress: onHangUp }]
      );
    }
  };

  const handleHangUp = async () => {
    console.log('Call ending, cleaning up resources');
    setIsActive(false);
    
    
    if (fraudAnalysisTimerRef.current) {
      clearInterval(fraudAnalysisTimerRef.current);
      fraudAnalysisTimerRef.current = null;
    }
    
   
    accumulatedTextRef.current = '';
    setLiveTranscription('');
    setFinalTranscription('');
    
    if (sound.current) {
      await sound.current.stopAsync();
      await sound.current.unloadAsync();
    }
    onHangUp();
  };

  const displayDuration = isDemo ? playbackDuration : duration;
  const minutes = Math.floor(displayDuration / 60);
  const seconds = Math.floor(displayDuration % 60);
  const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const processAudioChunk = async (chunk: Blob) => {
    await audioStreamingService.sendAudioChunk(chunk);
  };

  const analyzeFraudInTranscription = async (text: string) => {
    try {
      const result = await audioService.analyzeFraud(text);
      if (result.confidence > 0.8 && result.classification === 'FRAUD') {
        setShowWarning(true);
        console.log('High confidence fraud detected:', result);
      }
    } catch (error) {
      console.error('Error analyzing fraud:', error);
    }
  };

  useEffect(() => {
    if (!isActive) {
      console.log('Call ended, stopping fraud analysis');
      if (fraudAnalysisTimerRef.current) {
        clearInterval(fraudAnalysisTimerRef.current);
        fraudAnalysisTimerRef.current = null;
      }
      setShowFraudWarning(false);
      accumulatedTextRef.current = '';
      return;
    }

    console.log('Setting up fraud analysis timer');
    
    const analyzeFraud = async () => {
      const currentText = accumulatedTextRef.current;
      if (!currentText || !isActive) return;
      
      try {
        console.log('Making POST request to analyze_fraud with text:', currentText);
        const response = await fetch(`${API_CONFIG.BASE_URL}/audio/analyze_fraud`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: currentText })
        });
        
        const result = await response.json();
        console.log('Fraud analysis result:', result);
        
        if (result.classification === 'FRAUD' && result.confidence >= 0.95) {
          console.log('⚠️ HIGH RISK: Potential scam call detected!');
          setShowFraudWarning(true);
          
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.delay(3000),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            })
          ]).start(() => setShowFraudWarning(false));

          Alert.alert(
            '⚠️ Warning: Potential Scam',
            'This call shows signs of being a scam. Please be cautious!',
            [{ text: 'I Understand', style: 'cancel' }]
          );
        }
      } catch (error) {
        console.error('Error in fraud analysis:', error);
      }
    };

    fraudAnalysisTimerRef.current = setInterval(analyzeFraud, 15000);
    console.log('Fraud analysis interval set up');

    return () => {
      console.log('Cleaning up fraud analysis timer');
      if (fraudAnalysisTimerRef.current) {
        clearInterval(fraudAnalysisTimerRef.current);
        fraudAnalysisTimerRef.current = null;
      }
      setShowFraudWarning(false);
    };
  }, [isActive]);

  useEffect(() => {
    console.log('Warning state changed:', showFraudWarning);
  }, [showFraudWarning]);

  return (
    <View style={styles.container}>
      <View style={styles.callerInfo}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>
            {phoneNumber.slice(0, 1).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText style={styles.wifiCall}>Wi-Fi call</ThemedText>
        <ThemedText style={styles.callerName}>{phoneNumber}</ThemedText>
        <View style={styles.durationContainer}>
          <MaterialIcons name="wifi" size={16} color="#fff" />
          <ThemedText style={styles.duration}>{durationText}</ThemedText>
        </View>
      </View>

      {displayTranscription && (
        <View style={styles.transcriptionContainer}>
          <ThemedText style={styles.transcriptionText}>
            {displayTranscription}
          </ThemedText>
        </View>
      )}

      <View style={styles.bottomBar}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlButton}>
              <MaterialIcons name="dialpad" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.controlText}>Keypad</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlButton}>
              <MaterialIcons name="mic-off" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.controlText}>Mute</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlButton}>
              <MaterialIcons name="volume-up" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.controlText}>Speaker</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlButton}>
              <MaterialIcons name="more-vert" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.controlText}>More</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.hangupContainer}>
          <TouchableOpacity style={styles.hangupButton} onPress={handleHangUp}>
            <MaterialIcons name="call-end" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isActive && showFraudWarning && (
        <Animated.View 
          style={[styles.warningContainer, { opacity: fadeAnim }]}
        >
          <LinearGradient
            colors={['#FF453A', '#FF6B6B']}
            style={styles.warningGradient}
          >
            <MaterialIcons name="warning" size={24} color="#FFF" />
            <ThemedText style={styles.warningText}>
              ⚠️ Warning: This appears to be a scam call!
            </ThemedText>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: 60,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  wifiCall: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  callerName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    paddingBottom: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  controlItem: {
    alignItems: 'center',
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlText: {
    color: '#fff',
    fontSize: 12,
  },
  hangupContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  hangupButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF453A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  warningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  warningText: {
    color: '#FFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptionContainer: {
    position: 'absolute',
    bottom: 280,
    left: 20,
    right: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transcriptionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'left',
    lineHeight: 24,
  },
});