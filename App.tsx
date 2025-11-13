import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthScreen } from './src/screens/AuthScreen';
import { MainNavigator } from './src/navigation/MainNavigator';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { ResourceTypesProvider } from './src/contexts/ResourceTypesContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticate = () => {
    // TODO: Replace with proper OAuth authentication flow in Phase 2
    // WARNING: Development only - bypassing authentication
    // In Phase 1, we just set authenticated to true
    // In Phase 2, this will handle the OAuth flow
    setIsAuthenticated(true);
  };

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ResourceTypesProvider>
          <NotificationProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              {isAuthenticated ? (
                <MainNavigator />
              ) : (
                <AuthScreen onAuthenticate={handleAuthenticate} />
              )}
            </NavigationContainer>
          </NotificationProvider>
        </ResourceTypesProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
