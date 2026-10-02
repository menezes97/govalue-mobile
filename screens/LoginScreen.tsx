import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { CapturaFacial } from '../components/CapturaFacial';
import { ApiError } from '../lib/api/client';
import { ehDesafioFacial } from '../lib/api/types';
import { useAuth } from '../lib/auth/AuthContext';

export function LoginScreen() {
  const { login, loginFace } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tokenFacePendente, setTokenFacePendente] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setErro(null);
    setCarregando(true);
    try {
      const resultado = await login(email.trim(), senha);
      if (ehDesafioFacial(resultado)) {
        setTokenFacePendente(resultado.tokenFacePendente);
      }
      // Login completo: AuthContext já atualizou a sessão, a navegação troca de tela sozinha.
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  async function verificarRosto(imagemBase64: string) {
    setErro(null);
    setCarregando(true);
    try {
      await loginFace(tokenFacePendente!, imagemBase64);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Rosto não reconhecido. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  if (tokenFacePendente) {
    return (
      <View style={styles.container}>
        <Text style={styles.titulo}>Confirme seu rosto</Text>
        {erro && <Text style={styles.erro}>{erro}</Text>}
        <CapturaFacial onCapturar={verificarRosto} enviando={carregando} textoBotao="Verificar rosto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>GoValue</Text>
      {erro && <Text style={styles.erro}>{erro}</Text>}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        autoComplete="password"
        value={senha}
        onChangeText={setSenha}
      />
      {carregando ? <ActivityIndicator /> : <Button title="Entrar" onPress={entrar} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  erro: { color: '#c0392b', textAlign: 'center' },
});
