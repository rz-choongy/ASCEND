import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Tabs: undefined;
  ClimbLogger: { sessionId: string; gymId?: string };
  StrengthLogger: { sessionId: string };
  SessionDetail: { sessionId: string };
  ExerciseProgress: { exerciseKey: string; exerciseName: string };
  GymSelect: { returnToSessionId?: string } | undefined;
  GymEdit: { returnToSessionId?: string; gymId?: string; parentId?: string } | undefined;
  Settings: undefined;
  KilterConnect: undefined;
  Changelog: undefined;
  Categories: undefined;
};

export type TabParamList = {
  Log: undefined;
  Calendar: undefined;
  Progress: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;
