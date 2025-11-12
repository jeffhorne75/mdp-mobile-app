import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { peopleApi, organizationsApi } from '../api';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [peopleCount, setPeopleCount] = useState<number>(0);
  const [organizationsCount, setOrganizationsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      
      // Fetch counts for both people and organizations
      const [peopleResponse, organizationsResponse] = await Promise.all([
        peopleApi.getList({ page_number: 1, page_size: 1 }),
        organizationsApi.getList({ page_number: 1, page_size: 1 })
      ]);

      setPeopleCount(peopleResponse.meta?.page?.total_items || 0);
      setOrganizationsCount(organizationsResponse.meta?.page?.total_items || 0);
    } catch (error: any) {
      console.error('Error fetching counts:', error);
      Alert.alert('Error', 'Failed to load counts');
    } finally {
      setLoading(false);
    }
  };

  const navigateToPeople = () => {
    navigation.navigate('People' as never);
  };

  const navigateToOrganizations = () => {
    navigation.navigate('Organizations' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Access your Wicket Member Data Platform data by choosing an option below.</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionCard} 
          onPress={navigateToPeople}
          activeOpacity={0.7}
        >
          <View style={styles.optionHeader}>
            <Ionicons name="people" size={32} color={theme.colors.primary} />
            <Text style={styles.optionTitle}>People</Text>
          </View>
          <Text style={styles.optionCount}>
            {peopleCount.toLocaleString()} {peopleCount === 1 ? 'person' : 'people'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionCard} 
          onPress={navigateToOrganizations}
          activeOpacity={0.7}
        >
          <View style={styles.optionHeader}>
            <Ionicons name="business" size={32} color={theme.colors.primary} />
            <Text style={styles.optionTitle}>Organizations</Text>
          </View>
          <Text style={styles.optionCount}>
            {organizationsCount.toLocaleString()} {organizationsCount === 1 ? 'organization' : 'organizations'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo-wicket.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  optionsContainer: {
    gap: theme.spacing.lg,
  },
  optionCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  optionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  optionCount: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
  },
  logo: {
    height: 60,
    width: 200,
  },
});