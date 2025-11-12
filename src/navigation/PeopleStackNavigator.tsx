import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { PeopleListScreen } from '../screens/PeopleListScreen';
import { PersonDetailsScreen } from '../screens/PersonDetailsScreen';
import { theme } from '../theme';

export type PeopleStackParamList = {
  PeopleList: undefined;
  PersonDetails: { personId: string };
};

const Stack = createStackNavigator<PeopleStackParamList>();

export const PeopleStackNavigator: React.FC = () => {
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
        name="PeopleList"
        component={PeopleListScreen}
        options={{ title: 'People', headerShown: false }}
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
                People
              </Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};