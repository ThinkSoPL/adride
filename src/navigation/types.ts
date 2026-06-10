import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Auth stack — dostępny bez logowania
export type AuthStackParamList = {
  Login: undefined;
};

// App stack — dostępny po zalogowaniu
export type AppStackParamList = {
  Dashboard: undefined;
  ProofGallery: { driverId: string; campaignId: string };
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type DashboardScreenProps = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;
export type ProofGalleryScreenProps = NativeStackScreenProps<AppStackParamList, 'ProofGallery'>;
