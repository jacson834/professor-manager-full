import axios from 'axios';

const API_BASE_URL = 'http://10.1.1.19:3000/api';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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
  minPassingGrade?: number;
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
  presente: boolean;
  observacao?: string;
  createdAt: string;
}

export interface Nota {
  id: string;
  alunoId: string;
  turmaId: string;
  avaliacao: string;
  nota: number;
  dataAvaliacao: string;
  bimestre: string;
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

export interface AlertaAluno {
  id: string;
  alunoId: string;
  tipoAlerta: string;
  observacao?: string;
  dataRegistro: string;
  dataResolucao?: string;
  status: 'ativo' | 'arquivado' | 'reaberto';
}

export const professoresApi = {
  getProfessores: async (): Promise<Professor[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/professores`);
    return data.professores;
  },
  addProfessor: async (professor: Omit<Professor, 'id' | 'createdAt'>): Promise<Professor> => {
    const { data } = await axios.post(`${API_BASE_URL}/professores`, professor);
    return data;
  },
  updateProfessor: async (id: string, data: Partial<Professor>): Promise<Professor> => {
    const response = await axios.put(`${API_BASE_URL}/professores/${id}`, data);
    return response.data;
  },
  deleteProfessor: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/professores/${id}`);
  }
};

export const turmasApi = {
  getTurmas: async (): Promise<Turma[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/turmas`);
    return data.turmas;
  },
  getTurmaById: async (id: string): Promise<Turma | null> => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/turmas/${id}`);
      return data.turma;
    } catch (e) {
      return null;
    }
  },
  addTurma: async (turma: Omit<Turma, 'id' | 'createdAt'>): Promise<Turma> => {
    const { data } = await axios.post(`${API_BASE_URL}/turmas`, turma);
    return data;
  },
  updateTurma: async (id: string, data: Partial<Turma>): Promise<Turma> => {
    const response = await axios.put(`${API_BASE_URL}/turmas/${id}`, data);
    return response.data;
  },
  deleteTurma: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/turmas/${id}`);
  }
};

export const alunosApi = {
  getAlunos: async (): Promise<Aluno[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/alunos`);
    return data.alunos;
  },
  getAlunosByTurma: async (turmaId: string): Promise<Aluno[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/alunos/turma/${turmaId}`);
    return data.alunos;
  },
  getAlunoById: async (id: string): Promise<Aluno | null> => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/alunos/${id}`);
      return data.aluno;
    } catch (e) {
      return null;
    }
  },
  addAluno: async (aluno: Omit<Aluno, 'id' | 'createdAt'>): Promise<Aluno> => {
    const { data } = await axios.post(`${API_BASE_URL}/alunos`, aluno);
    return data;
  },
  updateAluno: async (id: string, data: Partial<Aluno>): Promise<Aluno> => {
    const response = await axios.put(`${API_BASE_URL}/alunos/${id}`, data);
    return response.data;
  },
  deleteAluno: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/alunos/${id}`);
  }
};

export const presencasApi = {
  getPresencas: async (): Promise<Presenca[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/presencas`);
    return data.presencas;
  },
  getPresencasByAluno: async (alunoId: string): Promise<Presenca[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/presencas/aluno/${alunoId}`);
    return data.presencas;
  },
  getPresencasByTurma: async (turmaId: string): Promise<Presenca[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/presencas/turma/${turmaId}`);
    return data.presencas;
  },
  addPresenca: async (presenca: Omit<Presenca, 'id' | 'createdAt'>): Promise<Presenca> => {
    const { data } = await axios.post(`${API_BASE_URL}/presencas`, presenca);
    return data;
  },
  updatePresenca: async (id: string, data: Partial<Presenca>): Promise<Presenca> => {
    const response = await axios.put(`${API_BASE_URL}/presencas/${id}`, data);
    return response.data;
  },
  deletePresenca: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/presencas/${id}`);
  }
};

export const notasApi = {
  getNotas: async (): Promise<Nota[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/notas`);
    return data.notas;
  },
  getNotasByAluno: async (alunoId: string): Promise<Nota[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/notas/aluno/${alunoId}`);
    return data.notas;
  },
  getNotasByTurma: async (turmaId: string): Promise<Nota[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/notas/turma/${turmaId}`);
    return data.notas;
  },
  addNota: async (nota: Omit<Nota, 'id' | 'createdAt'>): Promise<Nota> => {
    const { data } = await axios.post(`${API_BASE_URL}/notas`, nota);
    return data;
  },
  updateNota: async (id: string, data: Partial<Nota>): Promise<Nota> => {
    const response = await axios.put(`${API_BASE_URL}/notas/${id}`, data);
    return response.data;
  },
  deleteNota: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/notas/${id}`);
  }
};

export const planejamentosApi = {
  getPlanejamentos: async (): Promise<PlanejamentoAula[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/planejamentos`);
    return data.planejamentos;
  },
  getPlanejamentosByTurma: async (turmaId: string): Promise<PlanejamentoAula[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/planejamentos/turma/${turmaId}`);
    return data.planejamentos;
  },
  getPlanejamentoByTurmaAndDate: async (turmaId: string, data: string): Promise<PlanejamentoAula | null> => {
    const all = await this.getPlanejamentosByTurma(turmaId);
    return all.find(p => p.data === data) || null;
  },
  addPlanejamento: async (planejamento: Omit<PlanejamentoAula, 'id' | 'createdAt'>): Promise<PlanejamentoAula> => {
    const { data } = await axios.post(`${API_BASE_URL}/planejamentos`, planejamento);
    return data;
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
    const { data } = await axios.get(`${API_BASE_URL}/feriados`);
    return data.feriados;
  },
  addFeriado: async (feriado: Omit<Feriado, 'id' | 'createdAt'>): Promise<Feriado> => {
    const { data } = await axios.post(`${API_BASE_URL}/feriados`, feriado);
    return data;
  },
  deleteFeriado: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/feriados/${id}`);
  }
};

export const eventosApi = {
  getEventos: async (): Promise<EventoAgenda[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/eventos`);
    return data.eventos;
  },
  addEvento: async (evento: Omit<EventoAgenda, 'id' | 'createdAt'>): Promise<EventoAgenda> => {
    const { data } = await axios.post(`${API_BASE_URL}/eventos`, evento);
    return data;
  },
  updateEvento: async (id: string, data: Partial<EventoAgenda>): Promise<EventoAgenda> => {
    const response = await axios.put(`${API_BASE_URL}/eventos/${id}`, data);
    return response.data;
  },
  deleteEvento: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/eventos/${id}`);
  }
};

export const alertasAlunosApi = {
  getAlerts: async (): Promise<AlertaAluno[]> => {
    const { data } = await axios.get(`${API_BASE_URL}/alertas-alunos`);
    return data.alertas;
  },
  addAlert: async (alert: Omit<AlertaAluno, 'id' | 'dataRegistro' | 'dataResolucao'>): Promise<AlertaAluno> => {
    const { data } = await axios.post(`${API_BASE_URL}/alertas-alunos`, alert);
    return data;
  },
  updateAlert: async (id: string, data: Partial<AlertaAluno>): Promise<AlertaAluno> => {
    const response = await axios.put(`${API_BASE_URL}/alertas-alunos/${id}`, data);
    return response.data;
  },
  deleteAlert: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/alertas-alunos/${id}`);
  }
};

export interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    professors: Professor[];
    turmas: Turma[];
    alunos: Aluno[];
    presencas: Presenca[];
    notas: Nota[];
    planejamentos: PlanejamentoAula[];
    feriados: Feriado[];
    eventos: EventoAgenda[];
    alertas: AlertaAluno[];
  };
}

export const backupApi = {
  exportData: async (): Promise<BackupData> => {
    const [professores, turmas, alunos, presencas, notas, planejamentos, feriados, eventos, alertas] = await Promise.all([
      professoresApi.getProfessores(),
      turmasApi.getTurmas(),
      alunosApi.getAlunos(),
      presencasApi.getPresencas(),
      notasApi.getNotas(),
      planejamentosApi.getPlanejamentos(),
      feriadosApi.getFeriados(),
      eventosApi.getEventos(),
      alertasAlunosApi.getAlerts(),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        professors: professores,
        turmas: turmas,
        alunos: alunos,
        presencas: presencas,
        notas: notas,
        planejamentos: planejamentos,
        feriados: feriados,
        eventos: eventos,
        alertas: alertas
      }
    };
  },

  importData: async (backup: BackupData): Promise<void> => {
    if (!backup.data) return;
    
    await axios.post(`${API_BASE_URL}/admin/import-data`, {
      professores: backup.data.professors || [],
      turmas: backup.data.turmas || [],
      alunos: backup.data.alunos || [],
      presencas: backup.data.presencas || [],
      notas: backup.data.notas || [],
      planejamentos: backup.data.planejamentos || [],
      feriados: backup.data.feriados || [],
      eventos: backup.data.eventos || [],
      alertas_alunos: backup.data.alertas || []
    });
  }
};