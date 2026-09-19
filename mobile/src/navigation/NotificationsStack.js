import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator();

export default function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.paper }, headerTintColor: colors.ink }}>
      <Stack.Screen name="NotificationsHome" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
