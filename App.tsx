import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types';
import TaskInputScreen from './src/screens/TaskInputScreen';
import TimerScreen from './src/screens/TimerScreen';
import ContinueScreen from './src/screens/ContinueScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { seedDefaultTemplates } from './src/storage/templateStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface ErrorBoundaryState { hasError: boolean }

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Något gick fel</Text>
          <Text style={errorStyles.message}>Starta om appen för att fortsätta.</Text>
          <TouchableOpacity
            style={errorStyles.btn}
            onPress={() => this.setState({ hasError: false })}>
            <Text style={errorStyles.btnText}>Försök igen</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  message: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 32 },
  btn: { borderWidth: 1, borderColor: '#4CAF50', borderRadius: 8, padding: 12, paddingHorizontal: 24 },
  btnText: { color: '#4CAF50', fontSize: 16 },
});

export default function App() {
  useEffect(() => { seedDefaultTemplates(); }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          translucent={Platform.OS === 'android'}
          backgroundColor={Platform.OS === 'android' ? 'transparent' : undefined}
        />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="TaskInput" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TaskInput" component={TaskInputScreen} />
            <Stack.Screen name="Timer" component={TimerScreen} />
            <Stack.Screen name="Continue" component={ContinueScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
