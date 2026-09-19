import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.paper }, headerTintColor: colors.ink }}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} initialParams={{}} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
