import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';

// Mock data for demonstration
const mockHashes = {
  leakedHashes: [
    '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    '7d793789ea21c4428c48f285845213b3f40a44c7c8453f0c16e52a4043bc5b60'
  ],
  recentUploads: [
    {
      type: 'video',
      name: 'evidence1.mp4',
      hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
      timestamp: '2024-03-20 14:30',
      isLeaked: true
    },
    {
      type: 'audio',
      name: 'recording2.m4a',
      hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      timestamp: '2024-03-20 14:25',
      isLeaked: false
    }
  ]
};

export default function SHA256Screen() {
  const [selectedType, setSelectedType] = useState<'video' | 'audio' | 'both' | null>(null);

  const handleUpload = (type: 'video' | 'audio' | 'both') => {
    setSelectedType(type);
    // Implement actual upload logic here
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
        <ThemedText type="title">SHA256 Verification</ThemedText>
        <ThemedText style={styles.subtitle}>Verify content authenticity</ThemedText>
      </ThemedView>

      <ThemedView style={styles.uploadSection}>
        <ThemedText type="subtitle">Upload Content</ThemedText>
        
        <View style={styles.uploadOptions}>
          <TouchableOpacity 
            style={[styles.uploadButton, selectedType === 'video' && styles.selectedButton]} 
            onPress={() => handleUpload('video')}
          >
            <MaterialIcons name="videocam" size={24} color="#9C27B0" />
            <ThemedText style={styles.uploadButtonText}>Video</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.uploadButton, selectedType === 'audio' && styles.selectedButton]}
            onPress={() => handleUpload('audio')}
          >
            <MaterialIcons name="mic" size={24} color="#9C27B0" />
            <ThemedText style={styles.uploadButtonText}>Audio</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.uploadButton, selectedType === 'both' && styles.selectedButton]}
            onPress={() => handleUpload('both')}
          >
            <MaterialIcons name="video-library" size={24} color="#9C27B0" />
            <ThemedText style={styles.uploadButtonText}>Video + Audio</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.recentUploads}>
        <ThemedText type="subtitle">Recent Verifications</ThemedText>
        
        {mockHashes.recentUploads.map((upload, index) => (
          <View key={index} style={styles.hashCard}>
            <View style={styles.hashHeader}>
              <View style={styles.fileInfo}>
                <MaterialIcons 
                  name={upload.type === 'video' ? 'videocam' : 'mic'} 
                  size={20} 
                  color="#9C27B0" 
                />
                <ThemedText style={styles.fileName}>{upload.name}</ThemedText>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: upload.isLeaked ? '#FF6B6B15' : '#4CAF5015' }
              ]}>
                <MaterialIcons 
                  name={upload.isLeaked ? 'warning' : 'verified'} 
                  size={16} 
                  color={upload.isLeaked ? '#FF6B6B' : '#4CAF50'} 
                />
                <ThemedText style={[
                  styles.statusText,
                  { color: upload.isLeaked ? '#FF6B6B' : '#4CAF50' }
                ]}>
                  {upload.isLeaked ? 'Leaked' : 'Secure'}
                </ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.hash}>{upload.hash}</ThemedText>
            
            <View style={styles.timeStamp}>
              <MaterialIcons name="access-time" size={16} color="#666" />
              <ThemedText style={styles.timeText}>{upload.timestamp}</ThemedText>
            </View>
          </View>
        ))}
      </ThemedView>

      <ThemedView style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <MaterialIcons name="info" size={20} color="#9C27B0" />
          <ThemedText type="defaultSemiBold">Verification Info</ThemedText>
        </View>
        <ThemedText style={styles.infoText}>
          • Upload your content to verify if it has been leaked
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • We use SHA256 hashing for secure verification
        </ThemedText>
        <ThemedText style={styles.infoText}>
          • Your content remains private and secure
        </ThemedText>
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
  uploadSection: {
    marginBottom: 24,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  uploadButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#9C27B008',
    borderWidth: 1,
    borderColor: '#9C27B015',
    alignItems: 'center',
    gap: 8,
  },
  selectedButton: {
    backgroundColor: '#9C27B015',
    borderColor: '#9C27B030',
  },
  uploadButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  recentUploads: {
    gap: 12,
    marginBottom: 24,
  },
  hashCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#9C27B008',
    borderWidth: 1,
    borderColor: '#9C27B015',
    marginTop: 8,
  },
  hashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hash: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    opacity: 0.7,
  },
  timeStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#9C27B008',
    borderWidth: 1,
    borderColor: '#9C27B015',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.8,
    marginLeft: 28,
    marginBottom: 4,
  },
});