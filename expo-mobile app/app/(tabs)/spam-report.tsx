import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { API_CONFIG } from '@/config/api';
import ParallaxScrollView from '@/components/ParallaxScrollView';

interface SpamReport {
  id: number;
  phone_number: string;
  description: string;
  reports_count: number;
  created_at: string;
}

export default function SpamReportScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const [reports, setReports] = useState<SpamReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/spam-reports/`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load spam reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/spam-reports/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          description: description.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit report');

      Alert.alert('Success', 'Report submitted successfully');
      setPhoneNumber('');
      setDescription('');
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFE4E4', dark: '#4A1515' }}
      headerImage={
        <MaterialIcons
          size={310}
          color="#FF6B6B"
          name="report"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Report Spam Number</ThemedText>
          <ThemedText style={styles.subtitle}>Help others stay safe</ThemedText>
        </ThemedView>

        <ThemedView style={styles.formContainer}>
          <TextInput
            style={[styles.input, { color: '#FFF' }]}
            placeholder="Enter phone number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor="#666"
          />
          
          <TextInput
            style={[styles.input, styles.descriptionInput, { color: '#FFF' }]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor="#666"
          />

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialIcons name="report" size={24} color="#FFF" />
                <ThemedText style={styles.buttonText}>Submit Report</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.reportsContainer}>
          <ThemedText type="subtitle">Recent Reports</ThemedText>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#FF6B6B" />
          ) : (
            <ScrollView style={styles.reportsList}>
              {reports.map((report) => (
                <ThemedView key={report.id} style={styles.reportItem}>
                  <View style={styles.reportHeader}>
                    <ThemedText style={styles.phoneNumber}>{report.phone_number}</ThemedText>
                    <View style={styles.badge}>
                      <MaterialIcons name="warning" size={16} color="#FF6B6B" />
                      <ThemedText style={styles.reportsCount}>
                        {report.reports_count} {report.reports_count === 1 ? 'report' : 'reports'}
                      </ThemedText>
                    </View>
                  </View>
                  
                  {report.description && (
                    <ThemedText style={styles.description}>{report.description}</ThemedText>
                  )}
                  
                  <View style={styles.dateContainer}>
                    <MaterialIcons name="access-time" size={14} color="#999" />
                    <ThemedText style={styles.date}>
                      {formatDate(report.created_at)}
                    </ThemedText>
                  </View>
                </ThemedView>
              ))}
            </ScrollView>
          )}
        </ThemedView>

        <ThemedView style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={20} color="#FF6B6B" />
            <ThemedText type="defaultSemiBold">Reporting Guidelines</ThemedText>
          </View>
          <ThemedText style={styles.infoText}>• Include country code in phone numbers</ThemedText>
          <ThemedText style={styles.infoText}>• Describe the type of spam call</ThemedText>
          <ThemedText style={styles.infoText}>• Report immediately after receiving</ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerImage: {
    bottom: -90,
    left: -35,
    position: 'absolute',
    opacity: 0.3,
  },
  titleContainer: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  formContainer: {
    gap: 12,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FF6B6B08',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B15',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reportsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  reportsList: {
    maxHeight: 400,
  },
  reportItem: {
    backgroundColor: '#FF6B6B08',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B15',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF6B6B15',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportsCount: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF6B6B08',
    borderWidth: 1,
    borderColor: '#FF6B6B15',
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
