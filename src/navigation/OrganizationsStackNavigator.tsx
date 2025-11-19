import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { OrganizationsListScreen } from '../screens/OrganizationsListScreen';
import { OrganizationDetailsScreen } from '../screens/OrganizationDetailsScreen';
import { PersonDetailsScreen } from '../screens/PersonDetailsScreen';
import { theme } from '../theme';

export type OrganizationsStackParamList = {
  OrganizationsList: undefined;
  OrganizationDetails: { organizationId: string };
  PersonDetails: { personId: string };
};

const Stack = createStackNavigator<OrganizationsStackParamList>();

export const OrganizationsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeights.semibold,
        },
      }}
    >
      <Stack.Screen
        name="OrganizationsList"
        component={OrganizationsListScreen}
        options={{ title: 'Organizations', headerShown: false }}
      />
      <Stack.Screen
        name="OrganizationDetails"
        component={OrganizationDetailsScreen}
        options={({ navigation }) => ({
          title: 'Organization Details',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 16,
              }}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={theme.colors.white}
                style={{ marginRight: 4 }}
              />
              <Text style={{
                color: theme.colors.white,
                fontSize: 17,
                fontWeight: theme.typography.fontWeights.medium,
              }}>
                Back
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="PersonDetails"
        component={PersonDetailsScreen}
        options={({ navigation }) => ({
          title: 'Person Details',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: 16,
              }}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={theme.colors.white}
                style={{ marginRight: 4 }}
              />
              <Text style={{
                color: theme.colors.white,
                fontSize: 17,
                fontWeight: theme.typography.fontWeights.medium,
              }}>
                Back
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};