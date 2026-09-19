import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConversationsScreen from '../screens/chat/ConversationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import NewGroupScreen from '../screens/chat/NewGroupScreen';
import ContactDossierScreen from '../screens/chat/ContactDossierScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator();

export default function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.paper }, headerTintColor: colors.ink }}>
      <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '' }} />
      <Stack.Screen name="NewGroup" component={NewGroupScreen} options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="ContactDossier" component={ContactDossierScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
