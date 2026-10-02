import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './lib/auth/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { MinhasAvaliacoesScreen } from './screens/MinhasAvaliacoesScreen';
import { ResponderScreen } from './screens/ResponderScreen';

export type RootStackParamList = {
  Login: undefined;
  MinhasAvaliacoes: undefined;
  Responder: { avaliacaoId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

function Navegacao() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {usuario ? (
        <>
          <Stack.Screen name="MinhasAvaliacoes" component={MinhasAvaliacoesScreen} options={{ title: 'Minhas avaliações' }} />
          <Stack.Screen name="Responder" component={ResponderScreen} options={{ title: 'Responder avaliação' }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <Navegacao />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
