import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/feed/FeedScreen';
import SearchScreen from '../screens/feed/SearchScreen';
import StoryViewerScreen from '../screens/feed/StoryViewerScreen';
import StoryComposerScreen from '../screens/feed/StoryComposerScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import { colors } from '../config/theme';

const Stack = createNativeStackNavigator();

export default function FeedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.paper }, headerTintColor: colors.ink }}>
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={({ navigation }) => ({
          title: 'Feed & Stories',
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('Search')} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18 }}>🔍</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen
        name="StoryViewer"
        component={StoryViewerScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="StoryComposer"
        component={StoryComposerScreen}
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
