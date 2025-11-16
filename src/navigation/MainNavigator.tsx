import React from 'react';
import { Image, View, Text, TouchableOpacity } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { PeopleStackNavigator } from './PeopleStackNavigator';
import { OrganizationsStackNavigator } from './OrganizationsStackNavigator';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AboutScreen } from '../screens/AboutScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator: React.FC<{ onTabChange?: (tabName: string) => void }> = ({ onTabChange }) => {
  return (
    <Tab.Navigator
      screenListeners={{
        state: (e) => {
          const state = (e.data as any).state;
          if (state && onTabChange) {
            const currentRoute = state.routes[state.index];
            onTabChange(currentRoute.name);
          }
        },
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'People') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Organizations') {
            iconName = focused ? 'business' : 'business-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="People" 
        component={PeopleStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('People', { screen: 'PeopleList' });
          },
        })}
      />
      <Tab.Screen 
        name="Organizations" 
        component={OrganizationsStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Organizations', { screen: 'OrganizationsList' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  const [currentTabName, setCurrentTabName] = React.useState('Home');

  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
        drawerIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'TabNavigator') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'About') {
            iconName = focused ? 'information-circle' : 'information-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textLight,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.white,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeights.semibold,
        },
        headerTitle: ({ children }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
              source={require('../../assets/icon-wicket.png')} 
              style={{ width: 20, height: 20, marginRight: 8 }} 
              resizeMode="contain"
            />
            <Text style={{ 
              color: theme.colors.white, 
              fontSize: theme.typography.fontSizes.lg,
              fontWeight: theme.typography.fontWeights.semibold 
            }}>
              {children}
            </Text>
          </View>
        ),
      })}
      drawerContent={({ state, descriptors, navigation }) => {
        const currentRoute = state.routes[state.index];
        const isTabNavigatorActive = currentRoute.name === 'TabNavigator';
        const currentTabRoute = isTabNavigatorActive && currentRoute.state 
          ? currentRoute.state.routes[currentRoute.state.index || 0]?.name 
          : 'Home';

        return (
          <View style={{ flex: 1, paddingTop: 50, paddingHorizontal: 20 }}>
            <Text style={{ 
              fontSize: theme.typography.fontSizes.lg,
              fontWeight: theme.typography.fontWeights.bold,
              color: theme.colors.text,
              marginBottom: 20
            }}>
              Navigation
            </Text>
            
            {/* Tab navigation items */}
            <View style={{ marginBottom: 10 }}>
              <Text style={{ 
                fontSize: theme.typography.fontSizes.sm,
                color: theme.colors.textLight,
                marginBottom: 10,
                textTransform: 'uppercase'
              }}>
                Main
              </Text>
              {[
                { name: 'Home', icon: 'home', route: 'TabNavigator' },
                { name: 'People', icon: 'people', route: 'TabNavigator' },
                { name: 'Organizations', icon: 'business', route: 'TabNavigator' }
              ].map((item) => {
                const isActive = isTabNavigatorActive && currentTabRoute === item.name;
                return (
                  <TouchableOpacity 
                    key={item.name} 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: isActive ? 
                        theme.colors.primary + '20' : 'transparent'
                    }}
                    onPress={() => {
                      if (item.name === 'People') {
                        navigation.navigate('TabNavigator', { 
                          screen: 'People',
                          params: { screen: 'PeopleList' }
                        });
                      } else if (item.name === 'Organizations') {
                        navigation.navigate('TabNavigator', { 
                          screen: 'Organizations',
                          params: { screen: 'OrganizationsList' }
                        });
                      } else {
                        navigation.navigate('TabNavigator', { screen: 'Home' });
                      }
                    }}
                  >
                    <Ionicons 
                      name={`${item.icon}-outline` as keyof typeof Ionicons.glyphMap} 
                      size={20} 
                      color={isActive ? 
                        theme.colors.primary : theme.colors.textLight} 
                    />
                    <Text style={{ 
                      marginLeft: 12,
                      color: isActive ? 
                        theme.colors.primary : theme.colors.text,
                      fontSize: theme.typography.fontSizes.md
                    }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Other navigation items */}
            <View style={{ marginTop: 20 }}>
              {['Settings', 'About'].map((item) => (
                <TouchableOpacity 
                  key={item}
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: state.index === (item === 'Settings' ? 1 : 2) ? 
                      theme.colors.primary + '20' : 'transparent'
                  }}
                  onPress={() => navigation.navigate(item)}
                >
                  <Ionicons 
                    name={`${item === 'Settings' ? 'settings' : 'information-circle'}-outline` as keyof typeof Ionicons.glyphMap} 
                    size={20} 
                    color={state.index === (item === 'Settings' ? 1 : 2) ? 
                      theme.colors.primary : theme.colors.textLight} 
                  />
                  <Text style={{ 
                    marginLeft: 12,
                    color: state.index === (item === 'Settings' ? 1 : 2) ? 
                      theme.colors.primary : theme.colors.text,
                    fontSize: theme.typography.fontSizes.md
                  }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }}
    >
      <Drawer.Screen 
        name="TabNavigator" 
        options={{ 
          title: currentTabName,
          drawerItemStyle: { display: 'none' }
        }}
      >
        {() => <TabNavigator onTabChange={setCurrentTabName} />}
      </Drawer.Screen>
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings'
        }}
      />
      <Drawer.Screen 
        name="About" 
        component={AboutScreen}
        options={{
          title: 'About'
        }}
      />
    </Drawer.Navigator>
  );
};