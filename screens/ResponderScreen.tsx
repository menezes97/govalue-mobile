import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, ApiError } from '../lib/api/client';
import type { DetalheAvaliacao, ItemResposta } from '../lib/api/types';
import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Responder'>;

export function ResponderScreen({ route }: Props) {
  const { avaliacaoId } = route.params;
  const queryClient = useQueryClient();
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [inicializado, setInicializado] = useState(false);

  const { data: detalhe, isLoading } = useQuery({
    queryKey: ['minhas-avaliacoes', avaliacaoId],
    queryFn: () => api.get<DetalheAvaliacao>(`/api/minhas-avaliacoes/${avaliacaoId}`),
  });

  // Semeia o estado local com as respostas já salvas, só na primeira carga (não sobrescrever
  // o que o usuário já selecionou na tela se o dado for recarregado depois de salvar).
  if (detalhe && !inicializado) {
    const iniciais: Record<number, number> = {};
    for (const p of detalhe.perguntas) {
      if (p.respostaFuncionarioId !== null) iniciais[p.perguntaId] = p.respostaFuncionarioId;
    }
    setRespostas(iniciais);
    setInicializado(true);
  }

  const alterado = useMemo(() => {
    if (!detalhe) return false;
    return detalhe.perguntas.some((p) => respostas[p.perguntaId] !== (p.respostaFuncionarioId ?? undefined));
  }, [detalhe, respostas]);

  if (isLoading || !detalhe) return <ActivityIndicator style={styles.centro} />;

  async function salvar() {
    setErro(null);
    setSalvando(true);
    try {
      const itens: ItemResposta[] = Object.entries(respostas).map(([perguntaId, respostaId]) => ({
        perguntaId: Number(perguntaId),
        respostaId,
      }));
      const atualizado = await api.put<DetalheAvaliacao>(`/api/minhas-avaliacoes/${avaliacaoId}/respostas`, {
        respostas: itens,
      });
      queryClient.setQueryData(['minhas-avaliacoes', avaliacaoId], atualizado);
      void queryClient.invalidateQueries({ queryKey: ['minhas-avaliacoes'] });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const respondidas = Object.keys(respostas).length;
  const podeSalvar = detalhe.aberta && respondidas > 0 && alterado && !salvando;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>{detalhe.descricao}</Text>
      {!detalhe.aberta && <Text style={styles.avisoEncerrada}>Avaliação encerrada — somente leitura.</Text>}
      {erro && <Text style={styles.erro}>{erro}</Text>}

      {detalhe.perguntas.map((pergunta) => (
        <View key={pergunta.perguntaId} style={styles.pergunta}>
          <Text style={styles.perguntaTexto}>{pergunta.descricao}</Text>
          {pergunta.opcoes.map((opcao) => {
            const selecionada = respostas[pergunta.perguntaId] === opcao.id;
            return (
              <TouchableOpacity
                key={opcao.id}
                disabled={!detalhe.aberta}
                style={[styles.opcao, selecionada && styles.opcaoSelecionada]}
                onPress={() => setRespostas((anterior) => ({ ...anterior, [pergunta.perguntaId]: opcao.id }))}
              >
                <Text style={selecionada ? styles.opcaoTextoSelecionada : styles.opcaoTexto}>{opcao.descricao}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {detalhe.aberta && (
        <Button title={salvando ? 'Salvando…' : 'Salvar respostas'} onPress={salvar} disabled={!podeSalvar} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  centro: { flex: 1, justifyContent: 'center' },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  avisoEncerrada: { color: '#888', fontStyle: 'italic' },
  erro: { color: '#c0392b' },
  pergunta: { gap: 8 },
  perguntaTexto: { fontSize: 15, fontWeight: '600' },
  opcao: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  opcaoSelecionada: { borderColor: '#1e8449', backgroundColor: '#eafaf1' },
  opcaoTexto: { color: '#222' },
  opcaoTextoSelecionada: { color: '#1e8449', fontWeight: '600' },
});
