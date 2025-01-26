import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { VideoKYC } from '@/components/VideoKYC';

export default function VKYCScreen() {
  const [isVerifying, setIsVerifying] = useState(false);

  const startVerification = () => {
    setIsVerifying(true);
  };

  const endVerification = () => {
    setIsVerifying(false);
  };

  if (isVerifying) {
    return <VideoKYC onComplete={endVerification} />;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E4F1FF', dark: '#152A4A' }}
      headerImage={
        <MaterialIcons
          size={310}
          color="#4A90E2"
          name="security"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Deepfake Detection</ThemedText>
        <ThemedText style={styles.subtitle}>AI-powered fraud prevention</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Try Real-time Detection</ThemedText>
        <TouchableOpacity 
          style={styles.verificationButton} 
          onPress={startVerification}
        >
          <View style={styles.buttonIconContainer}>
            <MaterialIcons name="videocam" size={24} color="#4A90E2" />
          </View>
          <ThemedText style={styles.buttonText}>Start Live Verification</ThemedText>
          <ThemedText style={styles.buttonSubtext}>Video & Audio Analysis</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Watch Demo Videos</ThemedText>
        
        <TouchableOpacity 
          style={styles.demoButton} 
          onPress={startVerification}
        >
          <View style={styles.buttonIconContainer}>
            <MaterialIcons name="warning" size={24} color="#FF6B6B" />
          </View>
          <ThemedText style={styles.buttonText}>Deepfake Example 1</ThemedText>
          <ThemedText style={styles.buttonSubtext}>Face Swap Detection • 0:45</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.demoButton} 
          onPress={startVerification}
        >
          <View style={styles.buttonIconContainer}>
            <MaterialIcons name="record-voice-over" size={24} color="#FF6B6B" />
          </View>
          <ThemedText style={styles.buttonText}>Deepfake Example 2</ThemedText>
          <ThemedText style={styles.buttonSubtext}>Voice Cloning Demo • 1:20</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.demoButton} 
          onPress={startVerification}
        >
          <View style={styles.buttonIconContainer}>
            <MaterialIcons name="sync-problem" size={24} color="#FF6B6B" />
          </View>
          <ThemedText style={styles.buttonText}>Deepfake Example 3</ThemedText>
          <ThemedText style={styles.buttonSubtext}>Lip Sync Issues • 0:55</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.infoContainer}>
        <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
          <MaterialIcons name="info" size={20} color="#4A90E2" /> What We Detect
        </ThemedText>
        <ThemedText style={styles.infoText}>• Facial manipulation & inconsistencies</ThemedText>
        <ThemedText style={styles.infoText}>• Synthetic voice patterns</ThemedText>
        <ThemedText style={styles.infoText}>• Audio-visual sync issues</ThemedText>
        <ThemedText style={styles.infoText}>• Unnatural facial movements</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  verificationButton: {
    backgroundColor: '#4A90E215',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A90E230',
  },
  demoButton: {
    backgroundColor: '#FF6B6B08',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B20',
  },
  buttonIconContainer: {
    backgroundColor: '#ffffff15',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    opacity: 0.6,
  },
  infoContainer: {
    marginTop: 8,
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#4A90E208',
    borderWidth: 1,
    borderColor: '#4A90E215',
  },
  infoTitle: {
    fontSize: 18,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 15,
    opacity: 0.8,
    paddingLeft: 24,
  },
});