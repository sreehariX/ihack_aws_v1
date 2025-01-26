import { StyleSheet, TouchableOpacity, View, Dimensions, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { statsData } from '@/utils/mockData';
import { healthService } from '@/services/healthService';
import { useState } from 'react';

const { width } = Dimensions.get('window');

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  gradient: string[];
}

const FeatureCard = ({ title, description, icon, route, gradient }: FeatureCardProps) => (
  <Link href={route} asChild>
    <TouchableOpacity>
      <LinearGradient
        colors={gradient}
        style={styles.featureCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialIcons name={icon} size={32} color="#fff" style={styles.cardIcon} />
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <ThemedText style={styles.cardDescription}>{description}</ThemedText>
        <View style={styles.cardArrow}>
          <MaterialIcons name="arrow-forward" size={24} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  </Link>
);

const StatCard = ({ title, value, icon }: { title: string; value: string; icon: string }) => (
  <View style={styles.statCard}>
    <MaterialIcons name={icon} size={24} color="#4A90E2" />
    <ThemedText style={styles.statValue}>{value}</ThemedText>
    <ThemedText style={styles.statTitle}>{title}</ThemedText>
  </View>
);

export default function HomeScreen() {
  const [healthStatus, setHealthStatus] = useState<string>('Not checked');
  const [isChecking, setIsChecking] = useState(false);

  const checkBackendHealth = async () => {
    setIsChecking(true);
    try {
      const isHealthy = await healthService.checkHealth();
      setHealthStatus(isHealthy ? 'Backend is healthy! ✅' : 'Backend is down ❌');
    } catch (error) {
      setHealthStatus('Connection failed ❌');
    } finally {
      setIsChecking(false);
    }
  };

  const features: FeatureCardProps[] = [
    {
      title: 'Spam Call Detection',
      description: 'Real-time call recording and AI-powered spam detection',
      icon: 'phone-in-talk',
      route: '/(tabs)/spam-call',
      gradient: ['#FF6B6B', '#FF8E8E']
    },
    {
      title: 'Video KYC',
      description: 'Secure verification with facial recognition',
      icon: 'videocam',
      route: '/(tabs)/vkyc',
      gradient: ['#4A90E2', '#63A4FF']
    },
    {
      title: 'Spam Reports',
      description: 'View comprehensive spam detection reports',
      icon: 'assessment',
      route: '/(tabs)/spam-report',
      gradient: ['#50C878', '#63E687']
    },
    {
      title: 'SHA256 Verify',
      description: 'Verify recordings using SHA256 hash',
      icon: 'security',
      route: '/(tabs)/sha256',
      gradient: ['#9B59B6', '#B07CC6']
    }
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8F4F8', dark: '#1D3D47' }}
      headerImage={
        <MaterialIcons
          size={310}
          color="#4A90E2"
          name="security"
          style={[styles.headerImage, {
            transform: [
              { rotate: '-10deg' },
              { scale: 1.2 }
            ]
          }]}
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Spam Detection</ThemedText>
          <ThemedText style={styles.subtitle}>Your security is our priority</ThemedText>
        </ThemedView>

        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsWrapper}
        >
          <View style={styles.statsContainer}>
            <StatCard 
              title="Calls" 
              value={statsData.callsAnalyzed + "+"} 
              icon="analytics" 
            />
            <View style={styles.statsDivider} />
            <StatCard 
              title="Spam" 
              value={statsData.spamDetected} 
              icon="warning" 
            />
            <View style={styles.statsDivider} />
            <StatCard 
              title="Accuracy" 
              value={statsData.accuracyRate + "%"} 
              icon="verified" 
            />
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={[styles.healthButton, isChecking && styles.healthButtonChecking]} 
          onPress={checkBackendHealth}
          disabled={isChecking}
        >
          <MaterialIcons 
            name={isChecking ? "sync" : "cloud-done"} 
            size={20} 
            color="#fff" 
            style={[styles.healthIcon, isChecking && styles.rotating]} 
          />
          <ThemedText style={styles.buttonText}>
            {isChecking ? 'Checking Connection...' : 'Check Backend Status'}
          </ThemedText>
        </TouchableOpacity>
        
        {healthStatus !== 'Not checked' && (
          <ThemedText style={styles.healthStatus}>{healthStatus}</ThemedText>
        )}

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerImage: {
    bottom: -80,
    left: -45,
    position: 'absolute',
    opacity: 0.3,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginTop: 4,
  },
  statsWrapper: {
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E208',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width / 4.5,
  },
  statsDivider: {
    width: 1,
    height: '50%',
    backgroundColor: '#4A90E220',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    textAlign: 'center',
    marginVertical: 4,
  },
  statTitle: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.7,
  },
  healthButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 8,
  },
  healthButtonChecking: {
    opacity: 0.8,
  },
  healthIcon: {
    marginRight: 8,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  healthStatus: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    color: '#fff',
    opacity: 0.9,
    fontSize: 14,
    marginBottom: 16,
  },
  cardArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
});
