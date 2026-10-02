import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AUTH_STORAGE_KEY, api, onUnauthorized } from '../api/client';
import { ehDesafioFacial, type LoginResponse, type LoginResultado, type Usuario } from '../api/types';

interface AuthContextValue {
  usuario: Usuario | null;
  /** true enquanto ainda não sabemos se existe uma sessão salva (leitura do SecureStore é assíncrona). */
  carregando: boolean;
  login: (email: string, senha: string) => Promise<LoginResultado>;
  loginFace: (tokenFacePendente: string, imagemBase64: string) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MAX_TIMEOUT = 2_147_483_647; // maior atraso aceito por setTimeout (~24,8 dias).

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<LoginResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistirSessao = useCallback(async (nova: LoginResponse | null) => {
    if (nova) {
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(nova));
    } else {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    }
    setSessao(nova);
  }, []);

  const logout = useCallback(() => {
    void persistirSessao(null);
  }, [persistirSessao]);

  // Lê a sessão salva uma vez, ao montar — equivalente ao carregarSessao() síncrono do web,
  // só que aqui precisa ser um efeito porque SecureStore.getItemAsync nunca é síncrono.
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
        if (raw) {
          const salva = JSON.parse(raw) as LoginResponse;
          if (new Date(salva.expiraEm).getTime() > Date.now()) {
            setSessao(salva);
          } else {
            await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
          }
        }
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  useEffect(() => {
    onUnauthorized(logout);
  }, [logout]);

  // Desloga sozinho quando o token expira, em vez de esperar o próximo 401.
  useEffect(() => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (!sessao) return;
    const restante = new Date(sessao.expiraEm).getTime() - Date.now();
    logoutTimer.current = setTimeout(logout, Math.min(Math.max(restante, 0), MAX_TIMEOUT));
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [sessao, logout]);

  const login = useCallback(async (email: string, senha: string) => {
    const resultado = await api.post<LoginResultado>('/api/auth/login', { email, senha });
    if (ehDesafioFacial(resultado)) return resultado;

    await persistirSessao(resultado);
    return resultado;
  }, [persistirSessao]);

  // Segundo passo do login, só chamado quando login() devolveu um desafio facial pendente.
  const loginFace = useCallback(async (tokenFacePendente: string, imagemBase64: string) => {
    const resposta = await api.post<LoginResponse>('/api/auth/login/face', { tokenFacePendente, imagemBase64 });
    await persistirSessao(resposta);
    return resposta.usuario;
  }, [persistirSessao]);

  const value = useMemo<AuthContextValue>(
    () => ({ usuario: sessao?.usuario ?? null, carregando, login, loginFace, logout }),
    [sessao, carregando, login, loginFace, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
