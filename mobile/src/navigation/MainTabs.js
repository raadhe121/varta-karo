import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedStack from './FeedStack';
import ChatStack from './ChatStack';
import NotificationsStack from './NotificationsStack';
import ProfileStack from './ProfileStack';
import { useSocket } from '../hooks/useSocket';
import { useNotificationStore } from '../store/notificationStore';
import { fetchUnreadCount } from '../api/notifications.api';
import { colors } from '../config/theme';
import IncomingCallOverlay from '../components/call/IncomingCallOverlay';
import ActiveCallOverlay from '../components/call/ActiveCallOverlay';

const Tab = createBottomTabNavigator();

// Tab route names are deliberately distinct from the screen names nested
// inside each stack (e.g. FeedStack's root screen is also called "Feed") --
// React Navigation warns and misbehaves when a tab and a screen nested
// inside it share a name, so the tabs are suffixed "Tab" and given an
// explicit tabBarLabel/title for what the user actually sees.
const ICONS = { FeedTab: '📰', ChatTab: '💬', NotificationsTab: '🔔', ProfileTab: '👤' };

export default function MainTabs() {
  // Owning the socket connection here (rendered for every authenticated
  // screen) mirrors the web client's AppNav: it's the one place that keeps
  // presence/message/notification listeners alive no matter which tab is
  // focused, rather than only while the Chat tab happens to be mounted.
  useSocket();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    fetchUnreadCount().then(({ count }) => setUnreadCount(count));
  }, [setUnreadCount]);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.inkSoft,
          tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
          tabBarBadge: route.name === 'NotificationsTab' && unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent },
        })}
      >
        <Tab.Screen name="FeedTab" component={FeedStack} options={{ tabBarLabel: 'Feed' }} />
        <Tab.Screen name="ChatTab" component={ChatStack} options={{ tabBarLabel: 'Chat' }} />
        <Tab.Screen name="NotificationsTab" component={NotificationsStack} options={{ tabBarLabel: 'Notifications' }} />
        <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />
      </Tab.Navigator>
      <IncomingCallOverlay />
      <ActiveCallOverlay />
    </View>
  );
}
