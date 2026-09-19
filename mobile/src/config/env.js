import { Platform } from 'react-native';

// Android emulators run in their own network namespace: 10.0.2.2 is the
// special alias the emulator provides for the host machine's localhost.
// iOS simulator and Expo's web preview can both reach the host directly.
// A real physical device needs the host machine's LAN IP instead — that
// can't be auto-detected, so set EXPO_PUBLIC_API_HOST if you're testing on
// one (e.g. EXPO_PUBLIC_API_HOST=192.168.1.23 npx expo start).
const HOST = process.env.EXPO_PUBLIC_API_HOST || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const API_ORIGIN = `http://${HOST}:5000`;
export const API_URL = `${API_ORIGIN}/api`;
