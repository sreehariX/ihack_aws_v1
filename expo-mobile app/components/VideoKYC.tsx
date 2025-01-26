import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { MaterialIcons } from '@expo/vector-icons';

interface VideoKYCProps {
  onComplete: () => void;
}

export function VideoKYC({ onComplete }: VideoKYCProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>Deepfake Analysis</ThemedText>
        <View style={styles.analysisStatus}>
          <MaterialIcons name="analytics" size={16} color="#4CAF50" />
          <ThemedText style={styles.statusText}>AI Analysis Active</ThemedText>
        </View>
      </View>

      <View style={styles.cameraPreview}>
        <View style={styles.faceBoundary}>
          <MaterialIcons name="face-retouching-natural" size={120} color="#ffffff50" />
          <ThemedText style={styles.previewText}>Analyzing facial features...</ThemedText>
        </View>
        
        <View style={styles.analysisMetrics}>
          <View style={styles.metricItem}>
            <MaterialIcons name="face" size={20} color="#4CAF50" />
            <ThemedText style={styles.metricText}>Face Authenticity: 98%</ThemedText>
          </View>
          <View style={styles.metricItem}>
            <MaterialIcons name="mic" size={20} color="#4CAF50" />
            <ThemedText style={styles.metricText}>Voice Match: 95%</ThemedText>
          </View>
          <View style={styles.metricItem}>
            <MaterialIcons name="motion-photos-on" size={20} color="#4CAF50" />
            <ThemedText style={styles.metricText}>Motion Natural: 97%</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlButton}>
              <MaterialIcons name="flip-camera-ios" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.controlText}>Camera</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlButton}>
              <MaterialIcons name="speed" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.controlText}>Quality</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlButton}>
              <MaterialIcons name="tune" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.controlText}>Settings</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlItem}>
            <View style={styles.controlButton}>
              <MaterialIcons name="help-outline" size={24} color="#fff" />
            </View>
            <ThemedText style={styles.controlText}>Help</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.hangupContainer}>
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <MaterialIcons name="verified-user" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.instructions}>
        <ThemedText style={styles.instructionText}>
          ✓ Performing multi-factor analysis
        </ThemedText>
        <ThemedText style={styles.instructionText}>
          → Speak the displayed phrase naturally
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceBoundary: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: '#ffffff30',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  previewText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    opacity: 0.7,
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
  completeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    padding: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  analysisMetrics: {
    marginTop: 24,
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff10',
    padding: 8,
    borderRadius: 8,
  },
  metricText: {
    color: '#fff',
    fontSize: 14,
  },
  analysisStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF5020',
    padding: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 14,
  }
});