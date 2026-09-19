import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect, useMemo, useState } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrate } from './src/db/migrate';
import type { RootStackParamList, TabParamList } from './src/navigation/types';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ClimbSessionScreen } from './src/screens/ClimbSessionScreen';
import { GymEditScreen } from './src/screens/GymEditScreen';
import { GymSelectScreen } from './src/screens/GymSelectScreen';
import { LogScreen } from './src/screens/LogScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { SessionHistoryScreen } from './src/screens/SessionHistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StrengthSessionScreen } from './src/screens/StrengthSessionScreen';
import {
  CalendarTabIcon,
  LogTabIcon,
  ProgressTabIcon,
  ThemeProvider,
  useTheme,
} from './src/ui';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type TabIconProps = {
  name: keyof TabParamList;
  color: string;
};

// A UITabBar item carries no chrome of its own -- the tint colour alone says
// which tab is selected, so the icon is drawn bare.
const TabIcon = ({ name, color }: TabIconProps) => {
  if (name === 'Calendar') return <CalendarTabIcon size={25} color={color} />;
  if (name === 'Progress') return <ProgressTabIcon size={25} color={color} />;
  return <LogTabIcon size={25} color={color} />;
};

function TabNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // Labelled, hairline-topped, system-tinted: the iOS tab bar. Height is
        // left to the navigator so the home-indicator inset is respected.
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: -0.05,
          marginTop: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
      })}
    >
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { colors, mode } = useTheme();

  // Hand the navigator the theme's own ground colour so pushes and modal
  // presentations never flash the default white between screens.
  const navTheme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.background,
        border: colors.separator,
        text: colors.textPrimary,
        primary: colors.accent,
      },
    };
  }, [mode, colors]);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
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
          <Stack.Screen
            name="GymSelect"
            component={GymSelectScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="GymEdit"
            component={GymEditScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="SessionDetail" component={SessionHistoryScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
    </SafeAreaProvider>
  );
}

// Matches darkColors.background — used only before the DB (and therefore ThemeProvider,
// which reads the persisted theme preference from it) is confirmed ready.
const FALLBACK_BACKGROUND = '#000000';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      migrate();
      setIsReady(true);
    } catch (e) {
      setInitError(e instanceof Error ? e.message : 'Failed to initialise database.');
    }
  }, []);

  useEffect(() => {
    // Fetch and apply an OTA update immediately on launch, instead of
    // waiting for the default "downloads now, applies next launch"
    // behavior -- one reopen picks up new changes rather than two.
    if (__DEV__) return;
    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // No network, no update server reachable, etc. -- non-fatal, keep using the current bundle.
      }
    })();
  }, []);

  if (initError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: FALLBACK_BACKGROUND, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#ff453a', fontSize: 17, fontWeight: '600', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ color: 'rgba(235,235,245,0.62)', fontSize: 15, textAlign: 'center' }}>{initError}</Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: FALLBACK_BACKGROUND }} />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
