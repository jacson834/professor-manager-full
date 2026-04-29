// src/lib/database.ts
import axios from 'axios';

// URL base do seu backend. Certifique-se de que corresponde à porta que o backend está rodando (padrão 3000)
const API_BASE_URL = 'http://localhost:3000/api';

// --- Interfaces (Mantenha as mesmas, elas são compatíveis com o backend) ---
// Elas devem refletir a estrutura dos dados no seu banco de dados SQLite
export interface Professor {
  id: string;
  nome: string;
  email: string;
  materia: string;
  telefone: string;
  createdAt: string;
}

export interface Turma {
  id: string;
  nome: string;
  professorId: string;
  ano: string;
  semestre?: string;
  observacao?: string;
  createdAt: string;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turmaId: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  responsavel: string;
  createdAt: string;
}

export interface Presenca {
  id: string;
  alunoId: string;
  turmaId: string;
  data: string;
  presente: boolean; // 0 ou 1 no SQLite, boolean no TS
  observacao?: string;
  createdAt: string;
}

export interface Nota {
  id: string;
  alunoId: string;
  turmaId: string;
  avaliacao: string;
  nota: number; // REAL no SQLite
  dataAvaliacao: string;
  observacao?: string;
  createdAt: string;
}

export interface PlanejamentoAula {
  id: string;
  turmaId: string;
  data: string;
  conteudo: string;
  observacoes?: string;
  createdAt: string;
}

export interface Feriado {
  id: string;
  data: string;
  nome: string;
  createdAt: string;
}

export interface EventoAgenda {
  id: string;
  titulo: string;
  descricao?: string;
  data: string;
  horario: string;
  tipo: 'pessoal' | 'trabalho' | 'reuniao' | 'lembrete';
  createdAt: string;
}

// --- Funções para interagir com a API de Professores ---
export const professoresApi = {
  getProfessores: async (): Promise<Professor[]> => {
    const response = await axios.get(`${API_BASE_URL}/professores`);
    return response.data.professores; // Ajuste para a chave 'professores' que o backend retorna
  },

  addProfessor: async (professor: Omit<Professor, 'id' | 'createdAt'>): Promise<Professor> => {
    const response = await axios.post(`${API_BASE_URL}/professores`, professor);
    return response.data;
  },

  updateProfessor: async (id: string, data: Partial<Professor>): Promise<Professor> => {
    const response = await axios.put(`${API_BASE_URL}/professores/${id}`, data);
    return response.data;
  },

  deleteProfessor: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/professores/${id}`);
  }
};

// --- Funções para interagir com a API de Turmas ---
export const turmasApi = {
  getTurmas: async (): Promise<Turma[]> => {
    const response = await axios.get(`${API_BASE_URL}/turmas`);
    return response.data.turmas;
  },

  addTurma: async (turma: Omit<Turma, 'id' | 'createdAt'>): Promise<Turma> => {
    const response = await axios.post(`${API_BASE_URL}/turmas`, turma);
    return response.data;
  },

  updateTurma: async (id: string, data: Partial<Turma>): Promise<Turma> => {
    const response = await axios.put(`${API_BASE_URL}/turmas/${id}`, data);
    return response.data;
  },

  deleteTurma: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/turmas/${id}`);
  }
};

// --- Funções para interagir com a API de Alunos ---
export const alunosApi = {
  getAlunos: async (): Promise<Aluno[]> => {
    const response = await axios.get(`${API_BASE_URL}/alunos`);
    return response.data.alunos;
  },

  getAlunosByTurma: async (turmaId: string): Promise<Aluno[]> => {
    const response = await axios.get(`${API_BASE_URL}/alunos/turma/${turmaId}`);
    return response.data.alunos;
  },

  addAluno: async (aluno: Omit<Aluno, 'id' | 'createdAt'>): Promise<Aluno> => {
    const response = await axios.post(`${API_BASE_URL}/alunos`, aluno);
    return response.data;
  },

  updateAluno: async (id: string, data: Partial<Aluno>): Promise<Aluno> => {
    const response = await axios.put(`${API_BASE_URL}/alunos/${id}`, data);
    return response.data;
  },

  deleteAluno: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/alunos/${id}`);
  }
};

// --- Funções para interagir com a API de Presenças ---
export const presencasApi = {
  getPresencas: async (): Promise<Presenca[]> => {
    const response = await axios.get(`${API_BASE_URL}/presencas`);
    return response.data.presencas;
  },
  getPresencasByAluno: async (alunoId: string): Promise<Presenca[]> => {
    const response = await axios.get(`${API_BASE_URL}/presencas/aluno/${alunoId}`);
    return response.data.presencas;
  },
  getPresencasByTurma: async (turmaId: string): Promise<Presenca[]> => {
    const response = await axios.get(`${API_BASE_URL}/presencas/turma/${turmaId}`);
    return response.data.presencas;
  },
  addPresenca: async (presenca: Omit<Presenca, 'id' | 'createdAt'>): Promise<Presenca> => {
    const response = await axios.post(`${API_BASE_URL}/presencas`, presenca);
    return response.data;
  },
  updatePresenca: async (id: string, data: Partial<Presenca>): Promise<Presenca> => {
    const response = await axios.put(`${API_BASE_URL}/presencas/${id}`, data);
    return response.data;
  },
  deletePresenca: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/presencas/${id}`);
  }
};

// --- Funções para interagir com a API de Notas ---
export const notasApi = {
  getNotas: async (): Promise<Nota[]> => {
    const response = await axios.get(`${API_BASE_URL}/notas`);
    return response.data.notas;
  },
  getNotasByAluno: async (alunoId: string): Promise<Nota[]> => {
    const response = await axios.get(`${API_BASE_URL}/notas/aluno/${alunoId}`);
    return response.data.notas;
  },
  getNotasByTurma: async (turmaId: string): Promise<Nota[]> => {
    const response = await axios.get(`${API_BASE_URL}/notas/turma/${turmaId}`);
    return response.data.notas;
  },
  addNota: async (nota: Omit<Nota, 'id' | 'createdAt'>): Promise<Nota> => {
    const response = await axios.post(`${API_BASE_URL}/notas`, nota);
    return response.data;
  },
  updateNota: async (id: string, data: Partial<Nota>): Promise<Nota> => {
    const response = await axios.put(`${API_BASE_URL}/notas/${id}`, data);
    return response.data;
  },
  deleteNota: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/notas/${id}`);
  }
};

// --- Funções para Planejamentos, Feriados e Eventos (Adicionar conforme necessidade) ---
// Você pode adicionar as APIs para essas entidades aqui, seguindo o mesmo padrão.
// Exemplo:
export const planejamentosApi = {
  getPlanejamentos: async (): Promise<PlanejamentoAula[]> => {
    const response = await axios.get(`${API_BASE_URL}/planejamentos`);
    return response.data.planejamentos;
  },
  addPlanejamento: async (planejamento: Omit<PlanejamentoAula, 'id' | 'createdAt'>): Promise<PlanejamentoAula> => {
    const response = await axios.post(`${API_BASE_URL}/planejamentos`, planejamento);
    return response.data;
  },
  updatePlanejamento: async (id: string, data: Partial<PlanejamentoAula>): Promise<PlanejamentoAula> => {
    const response = await axios.put(`${API_BASE_URL}/planejamentos/${id}`, data);
    return response.data;
  },
  deletePlanejamento: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/planejamentos/${id}`);
  }
};

export const feriadosApi = {
  getFeriados: async (): Promise<Feriado[]> => {
    const response = await axios.get(`${API_BASE_URL}/feriados`);
    return response.data.feriados;
  },
  addFeriado: async (feriado: Omit<Feriado, 'id' | 'createdAt'>): Promise<Feriado> => {
    const response = await axios.post(`${API_BASE_URL}/feriados`, feriado);
    return response.data;
  },
  updateFeriado: async (id: string, data: Partial<Feriado>): Promise<Feriado> => {
    const response = await axios.put(`${API_BASE_URL}/feriados/${id}`, data);
    return response.data;
  },
  deleteFeriado: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/feriados/${id}`);
  }
};

export const eventosApi = {
  getEventos: async (): Promise<EventoAgenda[]> => {
    const response = await axios.get(`${API_BASE_URL}/eventos`);
    return response.data.eventos;
  },
  addEvento: async (evento: Omit<EventoAgenda, 'id' | 'createdAt'>): Promise<EventoAgenda> => {
    const response = await axios.post(`${API_BASE_URL}/eventos`, evento);
    return response.data;
  },
  updateEvento: async (id: string, data: Partial<EventoAgenda>): Promise<EventoAgenda> => {
    const response = await axios.put(`${API_BASE_URL}/eventos/${id}`, data);
    return response.data;
  },
  deleteEvento: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/eventos/${id}`);
  }
};

// Removendo a exportação 'db' direta, pois agora temos exports nomeados
// Se houver algum lugar que ainda usa 'db.getProfessores()', precisará ser atualizado para 'professoresApi.getProfessores()'