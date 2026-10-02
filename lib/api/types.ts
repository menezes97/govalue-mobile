// Tipos que espelham os DTOs do backend GoValue (br.com.govalue.web.dto).
// Copiados de govalue/frontend/src/api/types.ts, mantendo só o que o fluxo do funcionário usa.

export type Perfil = 'ADMIN' | 'FUNCIONARIO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  funcionarioId: number | null;
  gestor: boolean;
}

export interface LoginResponse {
  token: string;
  expiraEm: string;
  usuario: Usuario;
}

/** Só presente quando a verificação facial está ativada: senha OK, falta o segundo fator. */
export interface LoginDesafioFacialResponse {
  tokenFacePendente: string;
  expiraEm: string;
}

export type LoginResultado = LoginResponse | LoginDesafioFacialResponse;

export function ehDesafioFacial(resultado: LoginResultado): resultado is LoginDesafioFacialResponse {
  return 'tokenFacePendente' in resultado;
}

export interface ApiErrorBody {
  status: number;
  mensagem: string;
  campos: Record<string, string>;
  timestamp: string;
}

// ---------- fluxo de avaliação (funcionário) ----------

export interface OpcaoResposta {
  id: number;
  descricao: string;
}

export interface PerguntaRespondivel {
  perguntaId: number;
  descricao: string;
  opcoes: OpcaoResposta[];
  respostaFuncionarioId: number | null;
  respostaGestorId: number | null;
}

export interface DetalheAvaliacao {
  avaliacaoId: number;
  descricao: string;
  tipo: string;
  dataInicioVigencia: string;
  dataFimVigencia: string;
  aberta: boolean;
  funcionarioId: number;
  funcionarioNome: string;
  perguntas: PerguntaRespondivel[];
}

export interface ResumoAvaliacao {
  avaliacaoId: number;
  descricao: string;
  tipo: string;
  dataInicioVigencia: string;
  dataFimVigencia: string;
  aberta: boolean;
  totalPerguntas: number;
  respondidas: number;
}

export interface ItemResposta {
  perguntaId: number;
  respostaId: number;
}
