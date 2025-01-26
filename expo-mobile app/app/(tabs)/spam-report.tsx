import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { spamNumbers } from '@/utils/mockData';

export default function SpamReportScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8FFE4', dark: '#1F4A15' }}
      headerImage={
        <MaterialIcons
          size={310}
          color="#4CAF50"
          name="report"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Spam Reports</ThemedText>
        <ThemedText style={styles.subtitle}>Community-reported spam numbers</ThemedText>
      </ThemedView>

      <ThemedView style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialIcons name="phone-disabled" size={24} color="#4CAF50" />
          <ThemedText style={styles.statNumber}>152</ThemedText>
          <ThemedText style={styles.statLabel}>Total Reports</ThemedText>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="location-on" size={24} color="#4CAF50" />
          <ThemedText style={styles.statNumber}>23</ThemedText>
          <ThemedText style={styles.statLabel}>Cities</ThemedText>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="block" size={24} color="#4CAF50" />
          <ThemedText style={styles.statNumber}>89%</ThemedText>
          <ThemedText style={styles.statLabel}>Blocked</ThemedText>
        </View>
      </ThemedView>

      {spamNumbers.map((item, index) => (
        <TouchableOpacity key={index}>
          <ThemedView style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.phoneContainer}>
                <MaterialIcons 
                  name={item.probability > 0.8 ? "warning" : "info"} 
                  size={20} 
                  color={item.probability > 0.8 ? "#FF6B6B" : "#4CAF50"} 
                />
                <ThemedText type="defaultSemiBold" style={styles.phoneNumber}>
                  {item.number}
                </ThemedText>
              </View>
              <View style={[
                styles.probabilityBadge,
                { backgroundColor: item.probability > 0.8 ? '#FF6B6B15' : '#4CAF5015' }
              ]}>
                <ThemedText style={[
                  styles.probabilityText,
                  { color: item.probability > 0.8 ? '#FF6B6B' : '#4CAF50' }
                ]}>
                  {(item.probability * 100).toFixed(0)}% Spam
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.reportDetails}>
              <View style={styles.detailItem}>
                <MaterialIcons name="report" size={16} color="#666" />
                <ThemedText style={styles.detailText}>
                  {item.reports} reports
                </ThemedText>
              </View>
              <View style={styles.detailItem}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <ThemedText style={styles.detailText}>
                  {item.location}
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        </TouchableOpacity>
      ))}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#4CAF5008',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF5015',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#4CAF5008',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4CAF5015',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneNumber: {
    fontSize: 16,
  },
  probabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  probabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    opacity: 0.8,
  },
});