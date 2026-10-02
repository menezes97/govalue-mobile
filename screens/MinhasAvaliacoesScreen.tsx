import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '../lib/api/client';
import type { ResumoAvaliacao } from '../lib/api/types';
import { useAuth } from '../lib/auth/AuthContext';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'MinhasAvaliacoes'>;

export function MinhasAvaliacoesScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['minhas-avaliacoes'],
    queryFn: () => api.get<ResumoAvaliacao[]>('/api/minhas-avaliacoes'),
  });

  if (isLoading) return <ActivityIndicator style={styles.centro} />;
  if (error) return <Text style={styles.erro}>Não foi possível carregar suas avaliações.</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.avaliacaoId)}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhuma avaliação por enquanto.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTopo}>
              <Text style={styles.cardTitulo}>{item.descricao}</Text>
              <Text style={item.aberta ? styles.badgeAberta : styles.badgeEncerrada}>
                {item.aberta ? 'Aberta' : 'Encerrada'}
              </Text>
            </View>
            <Text style={styles.cardSub}>
              {item.tipo} · até {new Date(item.dataFimVigencia).toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.cardProgresso}>
              {item.respondidas}/{item.totalPerguntas} respondidas
            </Text>
            <Button
              title={item.aberta ? 'Responder' : 'Ver respostas'}
              onPress={() => navigation.navigate('Responder', { avaliacaoId: item.avaliacaoId })}
            />
          </View>
        )}
      />
      <Button title="Sair" color="#c0392b" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  centro: { flex: 1, justifyContent: 'center' },
  erro: { textAlign: 'center', margin: 24, color: '#c0392b' },
  vazio: { textAlign: 'center', margin: 24, color: '#666' },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, gap: 4 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitulo: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  cardSub: { color: '#666' },
  cardProgresso: { color: '#444', marginBottom: 6 },
  badgeAberta: { color: '#1e8449', fontWeight: '600' },
  badgeEncerrada: { color: '#888', fontWeight: '600' },
});
