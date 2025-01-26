import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { audioService } from '@/services/audioService';

interface HashEntry {
  id: number;
  filename: string;
  content_type: string;
  sha256_hash: string;
  created_at: string;
  matched_count: number;
}

export default function SHA256Screen() {
  const [isLoading, setIsLoading] = useState(false);
  const [hashes, setHashes] = useState<HashEntry[]>([]);

  useEffect(() => {
    loadHashes();
  }, []);

  const loadHashes = async () => {
    try {
      const response = await audioService.getStoredHashes();
      setHashes(response);
    } catch (error) {
      console.error('Failed to load hashes:', error);
    }
  };

  const handleUpload = async () => {
    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const checkResult = await audioService.checkAudioHash(result.assets[0].uri);
        
        if (checkResult.matches > 0) {
          Alert.alert(
            '⚠️ Data Leak Detected',
            `We regret to inform you that this content appears to have been leaked.\n\n` +
            `Matched ${checkResult.matches} time(s) in our database.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            '✅ No Leak Detected',
            'This content does not match any known leaks.',
            [{ text: 'OK' }]
          );
        }
        
        // Refresh hashes after check
        await loadHashes();
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFE4FF', dark: '#4A154A' }}
      headerImage={
        <MaterialIcons
          size={310}
          color="#9C27B0"
          name="enhanced-encryption"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Leak Verification</ThemedText>
        <ThemedText style={styles.subtitle}>
          Check if your content has been leaked
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Verify Content</ThemedText>
        <TouchableOpacity 
          style={styles.verificationButton}
          onPress={handleUpload}
          disabled={isLoading}
        >
          <View style={styles.buttonIconContainer}>
            <MaterialIcons name="upload-file" size={24} color="#9C27B0" />
          </View>
          <ThemedText style={styles.buttonText}>Upload File to Check</ThemedText>
          <ThemedText style={styles.buttonSubtext}>Audio & Video Verification</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {hashes.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recent Leaks</ThemedText>
          {hashes.map((hash) => (
            <View key={hash.id} style={styles.leakCard}>
              <View style={styles.leakHeader}>
                <MaterialIcons name="warning" size={20} color="#FF6B6B" />
                <ThemedText style={styles.fileName}>{hash.filename}</ThemedText>
                <ThemedText style={styles.matchCount}>
                  {hash.matched_count}x matched
                </ThemedText>
              </View>
              <ThemedText style={styles.hash}>{hash.sha256_hash}</ThemedText>
              <ThemedText style={styles.timestamp}>
                {new Date(hash.created_at).toLocaleString()}
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      )}

      <ThemedView style={styles.infoContainer}>
        <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
          <MaterialIcons name="info" size={20} color="#9C27B0" /> How It Works
        </ThemedText>
        <ThemedText style={styles.infoText}>• Upload your audio/video file</ThemedText>
        <ThemedText style={styles.infoText}>• We'll check against known leaks</ThemedText>
        <ThemedText style={styles.infoText}>• Get instant verification results</ThemedText>
        <ThemedText style={styles.infoText}>• Stay informed about your content</ThemedText>
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
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  verificationButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#9C27B008',
    borderWidth: 1,
    borderColor: '#9C27B015',
    marginTop: 12,
  },
  buttonIconContainer: {
    backgroundColor: '#9C27B015',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    opacity: 0.6,
  },
  leakCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#9C27B008',
    borderWidth: 1,
    borderColor: '#9C27B015',
    marginTop: 8,
  },
  leakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  matchCount: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  hash: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    opacity: 0.7,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
  },
  infoContainer: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#9C27B008',
    borderWidth: 1,
    borderColor: '#9C27B015',
  },
  infoTitle: {
    fontSize: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 15,
    opacity: 0.8,
    paddingLeft: 24,
    marginBottom: 8,
  },
});