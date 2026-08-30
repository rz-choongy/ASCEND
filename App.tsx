import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
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
import { ThemeProvider, useTheme, type ThemeColors } from './src/ui';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type TabIconProps = {
  name: keyof TabParamList;
  color: string;
  focused: boolean;
};

const TabIcon = ({ name, color, focused }: TabIconProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (name === 'Calendar') {
    return (
      <View style={[styles.tabIconFrame, focused ? styles.tabIconFocused : null]}>
        <View style={[styles.calendarTop, { backgroundColor: color }]} />
        <View style={styles.calendarGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.calendarDot,
                {
                  backgroundColor: index === 1 || index === 4 ? color : colors.borderSoft,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  if (name === 'Progress') {
    return (
      <View style={[styles.tabIconFrame, focused ? styles.tabIconFocused : null]}>
        <View style={styles.progressBars}>
          <View style={[styles.progressBar, { height: 8, backgroundColor: color }]} />
          <View style={[styles.progressBar, { height: 14, backgroundColor: color }]} />
          <View style={[styles.progressBar, { height: 11, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tabIconFrame, focused ? styles.tabIconFocused : null]}>
      <View style={[styles.logCardBack, { borderColor: color }]} />
      <View style={[styles.logCardFront, { borderColor: color }]}>
        <View style={[styles.logLine, { backgroundColor: color }]} />
        <View style={[styles.logLineShort, { backgroundColor: color }]} />
      </View>
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
const FALLBACK_BACKGROUND = '#0a0e14';

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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tabIconFrame: {
      width: 44,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
    },
    tabIconFocused: {
      backgroundColor: colors.accentMuted,
    },
    logCardBack: {
      position: 'absolute',
      width: 15,
      height: 17,
      borderRadius: 4,
      borderWidth: 1.5,
      opacity: 0.45,
      transform: [{ translateX: -3 }, { translateY: -2 }],
    },
    logCardFront: {
      width: 16,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      backgroundColor: colors.background,
      paddingHorizontal: 3,
      justifyContent: 'center',
      gap: 3,
      transform: [{ translateX: 2 }, { translateY: 2 }],
    },
    logLine: {
      width: '100%',
      height: 2,
      borderRadius: 1,
    },
    logLineShort: {
      width: '65%',
      height: 2,
      borderRadius: 1,
    },
    calendarTop: {
      width: 17,
      height: 4,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    calendarGrid: {
      width: 17,
      height: 15,
      borderWidth: 1.5,
      borderTopWidth: 0,
      borderColor: colors.borderSoft,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignContent: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingTop: 2,
    },
    calendarDot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
    },
    progressBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      height: 16,
    },
    progressBar: {
      width: 4,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    },
  });
