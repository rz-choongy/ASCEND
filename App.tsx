import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { migrate } from './src/db/migrate';
import type { RootStackParamList, TabParamList } from './src/navigation/types';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ClimbSessionScreen } from './src/screens/ClimbSessionScreen';
import { LogScreen } from './src/screens/LogScreen';
import { SessionHistoryScreen } from './src/screens/SessionHistoryScreen';
import { StrengthSessionScreen } from './src/screens/StrengthSessionScreen';
import { colors } from './src/ui';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    migrate();
  }, []);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="ClimbLogger"
            component={ClimbSessionScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="StrengthLogger"
            component={StrengthSessionScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen name="SessionDetail" component={SessionHistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </>
  );
}
