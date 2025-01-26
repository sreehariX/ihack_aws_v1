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
      <ThemedView style={styles.container}>
        <ThemedText type="title">Leak Verification</ThemedText>
        
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleUpload}
          disabled={isLoading}
        >
          <MaterialIcons name="upload-file" size={24} color="#9C27B0" />
          <ThemedText style={styles.uploadButtonText}>
            Upload File to Check
          </ThemedText>
        </TouchableOpacity>

        {hashes.length > 0 && (
          <ThemedView style={styles.hashesContainer}>
            <ThemedText type="subtitle">Known Leaks</ThemedText>
            {hashes.map((hash) => (
              <View key={hash.id} style={styles.hashCard}>
                <View style={styles.hashHeader}>
                  <ThemedText style={styles.fileName}>{hash.filename}</ThemedText>
                  <View style={styles.matchCount}>
                    <MaterialIcons name="warning" size={16} color="#FF6B6B" />
                    <ThemedText style={styles.matchCountText}>
                      {hash.matched_count}x matched
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.hash}>{hash.sha256_hash}</ThemedText>
                <ThemedText style={styles.timestamp}>
                  {new Date(hash.created_at).toLocaleString()}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        )}
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
  container: {
    gap: 24,
  },
  uploadButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#9C27B008',
    borderWidth: 1,
    borderColor: '#9C27B015',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  hashesContainer: {
    gap: 12,
  },
  hashCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#9C27B008',
    borderWidth: 1,
    borderColor: '#9C27B015',
    marginTop: 8,
  },
  hashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
  },
  matchCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchCountText: {
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
});