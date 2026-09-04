import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect, useMemo, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
  WorkSans_800ExtraBold,
} from '@expo-google-fonts/work-sans';
import { NavigationContainer } from '@react-navigation/native';
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
  type ThemeColors,
} from './src/ui';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type TabIconProps = {
  name: keyof TabParamList;
  color: string;
  focused: boolean;
};

// Icon set is Main.dc.html's (Direction A) tab bar, used as the canonical
// version -- Direction A's own screens draw their tab icons slightly
// differently from each other, so this picks one consistent set for the app.
const TabIcon = ({ name, color, focused }: TabIconProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.tabIconFrame, focused ? styles.tabIconFocused : null]}>
      {name === 'Calendar' ? (
        <CalendarTabIcon color={color} />
      ) : name === 'Progress' ? (
        <ProgressTabIcon color={color} />
      ) : (
        <LogTabIcon color={color} />
      )}
    </View>
  );
};

function TabNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={route.name} color={color} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { mode } = useTheme();

  return (
    <SafeAreaProvider>
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
const FALLBACK_BACKGROUND = '#141a24';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
    WorkSans_800ExtraBold,
  });

  useEffect(() => {
    try {
      migrate();
      setIsReady(true);
    } catch (e) {
      setInitError(e instanceof Error ? e.message : 'Failed to initialise database.');
    }
  }, []);

  useEffect(() => {
    if (fontError) {
      setInitError(fontError.message);
    }
  }, [fontError]);

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
          <Text style={{ color: '#f2564a', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ color: '#a9b2c3', fontSize: 14, textAlign: 'center' }}>{initError}</Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (!isReady || !fontsLoaded) {
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tabIconFrame: {
      width: 44,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 0,
    },
    tabIconFocused: {
      backgroundColor: colors.accentMuted,
    },
  });
