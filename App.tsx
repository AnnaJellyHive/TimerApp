import 'react-native-get-random-values';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types';
import TaskInputScreen from './src/screens/TaskInputScreen';
import TimerScreen from './src/screens/TimerScreen';
import ContinueScreen from './src/screens/ContinueScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="TaskInput" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="TaskInput" component={TaskInputScreen} />
          <Stack.Screen name="Timer" component={TimerScreen} />
          <Stack.Screen name="Continue" component={ContinueScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
