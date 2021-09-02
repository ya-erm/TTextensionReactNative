import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { BottomTabParamList, TabPortfolioParamList, TabSettingsParamList } from '../types';
import Colors from '/constants/Colors';
import useColorScheme from '/hooks/useColorScheme';
import PortfolioScreen from '/screens/PortfolioScreen';
import SelectAccountScreen from '/screens/SelectAccountScreen';
import SettingsScreen from '/screens/SettingsScreen';

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="Settings"
      screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors[colorScheme].tint }}
    >
      <BottomTab.Screen
        name="Portfolio"
        component={TabPortfolioNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="list-outline" color={color} />,
        }}
      />
      <BottomTab.Screen
        name="Settings"
        component={TabSettingsNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="settings-outline" color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

// You can explore the built-in icon families and icons on the web at:
// https://icons.expo.fyi/
function TabBarIcon(props: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const TabPortfolioStack = createStackNavigator<TabPortfolioParamList>();

function TabPortfolioNavigator() {
  return (
    <TabPortfolioStack.Navigator>
      <TabPortfolioStack.Screen
        name="PortfolioScreen"
        component={PortfolioScreen}
        options={{ headerTitle: 'Portfolio' }}
      />
    </TabPortfolioStack.Navigator>
  );
}

const TabSettingsStack = createStackNavigator<TabSettingsParamList>();

function TabSettingsNavigator() {
  return (
    <TabSettingsStack.Navigator>
      <TabSettingsStack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ headerTitle: 'Settings' }}
      />
      <TabSettingsStack.Screen
        name="SelectAccountScreen"
        component={SelectAccountScreen}
        options={{ headerTitle: 'Select account' }}
      />
    </TabSettingsStack.Navigator>
  );
}
