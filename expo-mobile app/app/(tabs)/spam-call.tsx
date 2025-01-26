import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { generateRandomNumber } from '@/utils/mockData';
import { CallSimulation } from '@/components/CallSimulation';
import { MaterialIcons } from '@expo/vector-icons';
import { audioService } from '@/services/audioService';
import { API_CONFIG } from '@/config/api';

export default function SpamCallScreen() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [demoAudios, setDemoAudios] = useState([]);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const randomNumber = generateRandomNumber();

  useEffect(() => {
    loadDemoAudios();
  }, []);

  const loadDemoAudios = async () => {
    try {
      const demos = await audioService.getDemoAudios();
      setDemoAudios(demos);
    } catch (error) {
      console.error('Failed to load demos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecordingSimulation = () => {
    setSelectedDemo(null);
    setIsSimulating(true);
  };

  const startDemoSimulation = (demo) => {
    setSelectedDemo(demo);
    setIsSimulating(true);
  };

  const endSimulation = () => {
    setIsSimulating(false);
    setSelectedDemo(null);
  };

  if (isSimulating) {
    return (
      <CallSimulation 
        phoneNumber={randomNumber}
        isDemo={!!selectedDemo}
        selectedDemo={selectedDemo}
        onHangUp={endSimulation}
        setShowWarning={setShowWarning}
      />
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFE4E4', dark: '#4A1515' }}
      headerImage={
        <MaterialIcons
          size={310}
          color="#FF6B6B"
          name="phone-in-talk"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Spam Call Simulator</ThemedText>
        <ThemedText style={styles.subtitle}>Learn to identify spam calls</ThemedText>
      </ThemedView>

      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.simulationButton, styles.recordButton]} 
          onPress={startRecordingSimulation}
        >
          <MaterialIcons name="mic" size={24} color="#FF6B6B" />
          <ThemedText style={[styles.buttonText, styles.recordText]}>
            Record Your Own Demo
          </ThemedText>
          <ThemedText style={styles.buttonSubtext}>
            Be the scammer • Practice Mode
          </ThemedText>
        </TouchableOpacity>

        {demoAudios.map((demo) => (
          <TouchableOpacity 
            key={demo.id}
            style={styles.simulationButton} 
            onPress={() => startDemoSimulation(demo)}
          >
            <View style={styles.buttonIconContainer}>
              <MaterialIcons 
                name={getIconForCategory(demo.category)} 
                size={24} 
                color="#FF6B6B" 
              />
            </View>
            <ThemedText style={styles.buttonText}>{demo.title}</ThemedText>
            <ThemedText style={styles.buttonSubtext}>
              {demo.category} • {formatDuration(demo.duration)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ThemedView style={styles.infoContainer}>
        <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
          <MaterialIcons name="info" size={20} color="#FF6B6B" /> Tips to Identify Spam
        </ThemedText>
        <ThemedText style={styles.infoText}>• Listen for unnatural background noise</ThemedText>
        <ThemedText style={styles.infoText}>• Watch for pressure tactics or urgency</ThemedText>
        <ThemedText style={styles.infoText}>• Be alert to requests for personal info</ThemedText>
        <ThemedText style={styles.infoText}>• Notice robotic or scripted responses</ThemedText>
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
  buttonContainer: {
    gap: 12,
  },
  simulationButton: {
    backgroundColor: '#FF6B6B08',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B20',
  },
  buttonIconContainer: {
    backgroundColor: '#FF6B6B15',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    flexShrink: 1,
  },
  buttonSubtext: {
    fontSize: 14,
    opacity: 0.6,
    flexShrink: 1,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    backgroundColor: '#FF6B6B10',
    borderStyle: 'dashed',
    padding: 16,
  },
  recordText: {
    color: '#FF6B6B',
    flexShrink: 1,
  },
  infoContainer: {
    marginTop: 32,
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FF6B6B08',
    borderWidth: 1,
    borderColor: '#FF6B6B15',
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

const getIconForCategory = (category: string) => {
  switch (category.toLowerCase()) {
    case 'bank scam': return 'account-balance';
    case 'tech support': return 'computer';
    case 'authority scam': return 'local-police';
    default: return 'warning';
  }
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};