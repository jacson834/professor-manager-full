// backend/src/server.ts
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const currentDir = __dirname;
const settingsFilePath = path.resolve(currentDir, '..', 'settings.json');
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '8h';
const UNASSIGNED_PROFESSOR_ID = '__unassigned__';

type AppUserRole = 'admin' | 'professor';

interface AuthenticatedUser {
  id: string;
  username: string;
  nome: string;
  role: AppUserRole;
  professorId?: string | null;
}

interface AuthenticatedRequest extends express.Request {
  user?: AuthenticatedUser;
}

function getTokenFromRequest(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso permitido apenas para administradores.' });
  }
  next();
}

function requireProfessor(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  if (!req.user || req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Acesso permitido apenas para professores.' });
  }
  next();
}

function requireProfessorWithVinculo(req: AuthenticatedRequest, res: express.Response): string | null {
  const professorId = req.user?.professorId;
  if (!professorId) {
    res.status(403).json({ error: 'Professor sem vínculo ativo. Contate o administrador.' });
    return null;
  }
  return professorId;
}

function parsePagination(query: any) {
  const limitRaw = Number(query.limit);
  const offsetRaw = Number(query.offset);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : null;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  return { limit, offset };
}

function ensureUnassignedProfessorExists(callback: (err?: Error | null) => void) {
  db.get(`SELECT id FROM professores WHERE id = ?`, [UNASSIGNED_PROFESSOR_ID], (checkErr, row: any) => {
    if (checkErr) {
      callback(checkErr);
      return;
    }
    if (row) {
      callback(null);
      return;
    }

    db.run(
      `INSERT INTO professores (id, nome, email, materia, telefone, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [UNASSIGNED_PROFESSOR_ID, 'Sem Professor', `sem-professor-${Date.now()}@interno.local`, 'Não definida', '', new Date().toISOString()],
      (insertErr) => {
        callback(insertErr || null);
      }
    );
  });
}

app.use(cors());
app.use(express.json());

const dbPath = path.resolve(currentDir, '..', 'data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    // CORREÇÃO: Usar dbPath em vez de db.filename
    console.log('Conectado ao banco de dados SQLite em:', dbPath);
    db.serialize(() => {
      // Tabela de Professores
      db.run(`CREATE TABLE IF NOT EXISTS professores (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        materia TEXT NOT NULL,
        telefone TEXT,
        createdAt TEXT NOT NULL
      )`);

      // Tabela de Turmas - Adicionado minPassingGrade
      db.run(`CREATE TABLE IF NOT EXISTS turmas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        professorId TEXT NOT NULL,
        ano TEXT NOT NULL,
        semestre TEXT,
        observacao TEXT,
        minPassingGrade REAL DEFAULT 6.0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (professorId) REFERENCES professores(id) ON DELETE CASCADE
      )`);

      // Tabela de Alunos
      db.run(`CREATE TABLE IF NOT EXISTS alunos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        matricula TEXT NOT NULL UNIQUE,
        turmaId TEXT NOT NULL,
        email TEXT,
        telefone TEXT,
        dataNascimento TEXT,
        responsavel TEXT,
        responsavelTelefone TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (turmaId) REFERENCES turmas(id) ON DELETE CASCADE
      )`);

      db.all(`PRAGMA table_info(alunos)`, [], (pragmaErr, columns: any[]) => {
        if (pragmaErr) {
          console.error('Erro ao verificar colunas da tabela alunos:', pragmaErr.message);
          return;
        }
        const hasResponsavelTelefone = columns?.some((col) => col.name === 'responsavelTelefone');
        if (!hasResponsavelTelefone) {
          db.run(`ALTER TABLE alunos ADD COLUMN responsavelTelefone TEXT`, (alterErr) => {
            if (alterErr) {
              console.error('Erro ao adicionar coluna responsavelTelefone:', alterErr.message);
            }
          });
        }
      });

      // Tabela de Presencas
      db.run(`CREATE TABLE IF NOT EXISTS presencas (
        id TEXT PRIMARY KEY,
        alunoId TEXT NOT NULL,
        turmaId TEXT NOT NULL,
        data TEXT NOT NULL,
        presente INTEGER NOT NULL, -- 0 para falso, 1 para verdadeiro
        observacao TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (alunoId) REFERENCES alunos(id) ON DELETE CASCADE,
        FOREIGN KEY (turmaId) REFERENCES turmas(id) ON DELETE CASCADE
      )`);

      // Tabela de Notas - Adicionado bimestre
      db.run(`CREATE TABLE IF NOT EXISTS notas (
        id TEXT PRIMARY KEY,
        alunoId TEXT NOT NULL,
        turmaId TEXT NOT NULL,
        avaliacao TEXT NOT NULL,
        nota REAL NOT NULL,
        dataAvaliacao TEXT NOT NULL,
        bimestre TEXT NOT NULL, -- NOVO CAMPO: Bimestre (ex: "1", "2", "3", "4")
        observacao TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (alunoId) REFERENCES alunos(id) ON DELETE CASCADE,
        FOREIGN KEY (turmaId) REFERENCES turmas(id) ON DELETE CASCADE
      )`);

      // Tabela de Planejamentos de Aula
      db.run(`CREATE TABLE IF NOT EXISTS planejamentos (
        id TEXT PRIMARY KEY,
        turmaId TEXT NOT NULL,
        data TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        observacoes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (turmaId) REFERENCES turmas(id) ON DELETE CASCADE
      )`);

      // Tabela de Feriados
      db.run(`CREATE TABLE IF NOT EXISTS feriados (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL UNIQUE,
        nome TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`);

      // Tabela de Alertas de Alunos
      db.run(`CREATE TABLE IF NOT EXISTS alertas_alunos (
        id TEXT PRIMARY KEY,
        alunoId TEXT NOT NULL,
        tipoAlerta TEXT NOT NULL,
        observacao TEXT,
        dataRegistro TEXT NOT NULL,
        dataResolucao TEXT,
        status TEXT NOT NULL, -- 'ativo' | 'arquivado' | 'reaberto'
        createdAt TEXT NOT NULL
      )`);

      // Tabela de Eventos da Agenda
      db.run(`CREATE TABLE IF NOT EXISTS eventos (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        data TEXT NOT NULL,
        horario TEXT NOT NULL,
        tipo TEXT NOT NULL, -- 'pessoal' | 'trabalho' | 'reuniao' | 'lembrete'
        createdAt TEXT NOT NULL
      )`);

      // Tabela de Usuários
      db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nome TEXT NOT NULL,
        role TEXT NOT NULL, -- 'admin' ou 'professor'
        professorId TEXT, -- Vinculo com professor (para usuarios professor)
        createdAt TEXT NOT NULL
      )`);

      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_turmas_professorId ON turmas(professorId)',
        'CREATE INDEX IF NOT EXISTS idx_alunos_turmaId ON alunos(turmaId)',
        'CREATE INDEX IF NOT EXISTS idx_presencas_turma_data ON presencas(turmaId, data)',
        'CREATE INDEX IF NOT EXISTS idx_presencas_aluno_data ON presencas(alunoId, data)',
        'CREATE INDEX IF NOT EXISTS idx_notas_turma_bimestre ON notas(turmaId, bimestre)',
        'CREATE INDEX IF NOT EXISTS idx_notas_aluno_bimestre ON notas(alunoId, bimestre)',
        'CREATE INDEX IF NOT EXISTS idx_notas_dataAvaliacao ON notas(dataAvaliacao)',
        'CREATE INDEX IF NOT EXISTS idx_planejamentos_turma_data ON planejamentos(turmaId, data)',
        'CREATE INDEX IF NOT EXISTS idx_eventos_data_horario ON eventos(data, horario)'
      ];

      indexes.forEach((sql) => {
        db.run(sql, (indexErr) => {
          if (indexErr) {
            console.error('Erro ao criar índice:', indexErr.message);
          }
        });
      });

      db.get(`SELECT id FROM professores WHERE id = ?`, [UNASSIGNED_PROFESSOR_ID], (err, row: any) => {
        if (err) {
          console.error('Erro ao verificar professor não atribuído:', err.message);
          return;
        }
        if (!row) {
          db.run(
            `INSERT INTO professores (id, nome, email, materia, telefone, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [UNASSIGNED_PROFESSOR_ID, 'Sem Professor', 'sem-professor@interno.local', 'Não definida', '', new Date().toISOString()]
          );
        }
      });

      // Inserir Administrador padrão se não existir
      db.get(`SELECT id FROM usuarios WHERE username = 'admin'`, [], (err, row) => {
        if (!row) {
          const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
          const createdAt = new Date().toISOString();
          const hashedPassword = bcrypt.hashSync('12345678', 10);
          db.run(
            `INSERT INTO usuarios (id, username, password, nome, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, 'admin', hashedPassword, 'Administrador Global', 'admin', createdAt]
          );
        }
      });

      // Inserir Professor-1 padrão se não existir (comentado para não criar automaticamente)
      // db.get(`SELECT id FROM usuarios WHERE username = 'professor1'`, [], (err, row) => {
      //   if (!row) {
      //     const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      //     const createdAt = new Date().toISOString();
      //     db.run(
      //       `INSERT INTO usuarios (id, username, password, nome, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      //       [id, 'professor1', '12345678', 'Professor Um', 'professor', createdAt]
      //     );
      //   }
      // });

      // Sementes de dados para testes (Executadas após a criação das tabelas)
      const seedData = () => {
        db.serialize(() => {
          db.get(`SELECT id FROM professores LIMIT 1`, [], (err, profRow: any) => {
            const professorId = profRow ? profRow.id : 'prof-teste-1';
            if (!profRow) {
              db.run(`INSERT INTO professores (id, nome, email, materia, telefone, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
                [professorId, 'Professor Teste', 'teste@escola.com', 'Matemática', '1199999999', new Date().toISOString()]);
            }

            db.get(`SELECT id FROM turmas WHERE nome = '9 a Matutino'`, [], (err, turmaRow: any) => {
              const turmaId = turmaRow ? turmaRow.id : 'turma-9a-mat';
              if (!turmaRow) {
                db.run(`INSERT INTO turmas (id, nome, professorId, ano, semestre, observacao, minPassingGrade, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [turmaId, '9 a Matutino', professorId, '2024', '1º Semestre', 'Turma de Testes', 6.0, new Date().toISOString()]);
              }

              const alunosTeste = [
                { nome: 'Ana Silva', matricula: '1001' },
                { nome: 'Bruno Souza', matricula: '1002' },
                { nome: 'Carla Lima', matricula: '1003' },
                { nome: 'Daniel Oliveira', matricula: '1004' },
                { nome: 'Eduarda Santos', matricula: '1005' },
                { nome: 'Felipe Costa', matricula: '1006' },
                { nome: 'Giovanna Pereira', matricula: '1007' },
                { nome: 'Henrique Rocha', matricula: '1008' },
                { nome: 'Isabela Martins', matricula: '1009' },
                { nome: 'João Victor', matricula: '1010' },
              ];

              alunosTeste.forEach(aluno => {
                db.get(`SELECT id FROM alunos WHERE matricula = ?`, [aluno.matricula], (err: any, exists: any) => {
                  if (!exists) {
                    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
                    db.run(`INSERT INTO alunos (id, nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [id, aluno.nome, aluno.matricula, turmaId, `${aluno.nome.toLowerCase().replace(' ', '.')}@email.com`, '1100000000', '2008-01-01', 'Responsável Teste', new Date().toISOString()]);
                  }
                });
              });
console.log('Sementes de dados aplicadas com sucesso.');
            });

            // Vincular usuarios professor aos professores correspondentes
            db.all(`SELECT id, username FROM usuarios WHERE role = 'professor'`, [], (err, users: any[]) => {
              if (!err && users) {
                users.forEach((user) => {
                  const nomeBusca = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                  db.get(`SELECT id FROM professores WHERE nome LIKE ?`, [`${nomeBusca}%`], (err, prof: any) => {
                    if (prof) {
                      db.run(`UPDATE usuarios SET professorId = ? WHERE id = ?`, [prof.id, user.id]);
                    }
                  });
                });
              }
            });
          });
        });
      };

// seedData(); // Comentado para não criar dados de teste automaticamente

      console.log('Tabelas verificadas/creadas com sucesso.');
    });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor Backend ProfessorManager funcionando!');
});

app.use('/api', (req: AuthenticatedRequest, res, next) => {
  if (req.path === '/login') {
    return next();
  }
  return requireAuth(req, res, next);
});

app.use('/api/admin', requireAdmin);

// --- Rotas de Autenticação e Usuários ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  db.get(`SELECT * FROM usuarios WHERE username = ?`, [username], async (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    let isValidPassword = false;
    const storedPassword = row.password || '';

    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
      isValidPassword = await bcrypt.compare(password, storedPassword);
    } else {
      isValidPassword = password === storedPassword;
      if (isValidPassword) {
        const upgradedHash = await bcrypt.hash(password, 10);
        db.run(`UPDATE usuarios SET password = ? WHERE id = ?`, [upgradedHash, row.id]);
      }
    }

    if (!isValidPassword) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const user: AuthenticatedUser = {
      id: row.id,
      username: row.username,
      nome: row.nome,
      role: row.role,
      professorId: row.professorId || null
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ 
      token,
      user
    });
  });
});

app.get('/api/dashboard/summary', (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const whereTurma = user.role === 'professor' ? ' WHERE professorId = ?' : '';
  const turmaParams = user.role === 'professor' ? [user.professorId] : [];

  db.get(`SELECT COUNT(*) as total FROM turmas${whereTurma}`, turmaParams, (turmasErr, turmasRow: any) => {
    if (turmasErr) return res.status(500).json({ error: turmasErr.message });

    const turmaIdsQuery = `SELECT id FROM turmas${whereTurma}`;
    db.all(turmaIdsQuery, turmaParams, (turmasIdsErr, turmasIds: any[]) => {
      if (turmasIdsErr) return res.status(500).json({ error: turmasIdsErr.message });
      const turmaIds = turmasIds.map((t) => t.id);
      if (turmaIds.length === 0) {
        return res.json({
          totalProfessores: user.role === 'admin' ? 0 : undefined,
          totalTurmas: turmasRow?.total || 0,
          totalAlunos: 0,
          totalPresencas: 0,
          totalNotas: 0,
          mediaGeral: 0
        });
      }

      const placeholders = turmaIds.map(() => '?').join(',');
      const alunosSql = `SELECT COUNT(*) as total FROM alunos WHERE turmaId IN (${placeholders})`;
      const presencasSql = `SELECT COUNT(*) as total FROM presencas p INNER JOIN alunos a ON a.id = p.alunoId WHERE p.turmaId IN (${placeholders})`;
      const notasSql = `SELECT COUNT(*) as total, AVG(n.nota) as media FROM notas n INNER JOIN alunos a ON a.id = n.alunoId WHERE n.turmaId IN (${placeholders})`;

      db.get(alunosSql, turmaIds, (alunosErr, alunosRow: any) => {
        if (alunosErr) return res.status(500).json({ error: alunosErr.message });
        db.get(presencasSql, turmaIds, (presencasErr, presencasRow: any) => {
          if (presencasErr) return res.status(500).json({ error: presencasErr.message });
          db.get(notasSql, turmaIds, (notasErr, notasRow: any) => {
            if (notasErr) return res.status(500).json({ error: notasErr.message });

            const finish = (totalProfessores?: number) => {
              res.json({
                totalProfessores,
                totalTurmas: turmasRow?.total || 0,
                totalAlunos: alunosRow?.total || 0,
                totalPresencas: presencasRow?.total || 0,
                totalNotas: notasRow?.total || 0,
                mediaGeral: notasRow?.media ? Math.round(Number(notasRow.media) * 10) / 10 : 0
              });
            };

            if (user.role === 'admin') {
              db.get('SELECT COUNT(*) as total FROM professores', [], (profErr, profRow: any) => {
                if (profErr) return res.status(500).json({ error: profErr.message });
                finish(profRow?.total || 0);
              });
            } else {
              finish(undefined);
            }
          });
        });
      });
    });
  });
});

app.post('/api/admin/migrate-professor-usuario', (req, res) => {
  db.all(`SELECT id, username FROM usuarios WHERE role = 'professor'`, [], (err, users: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    let updated = 0;
    const checkNext = (index: number) => {
      if (index >= users.length) {
        res.json({ message: `Atualizados ${updated} usuários`, updated });
        return;
      }
      
      const user = users[index];
      const nomeBusca = user.username.toLowerCase();
      
      db.get(`SELECT id FROM professores WHERE LOWER(nome) LIKE ?`, [`%${nomeBusca}%`], (err, prof: any) => {
        if (prof) {
          db.run(`UPDATE usuarios SET professorId = ? WHERE id = ?`, [prof.id, user.id], (err) => {
            if (!err) updated++;
            checkNext(index + 1);
          });
        } else {
          checkNext(index + 1);
        }
      });
    };
    
    checkNext(0);
  });
});

app.get('/api/usuarios', requireAdmin, (req, res) => {
  db.all('SELECT id, username, nome, role FROM usuarios', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ usuarios: rows });
  });
});

app.post('/api/usuarios', requireAdmin, (req, res) => {
  const { username, password, nome, role } = req.body;
  if (!username || !password || !nome || !role) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const createdAt = new Date().toISOString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(
    `INSERT INTO usuarios (id, username, password, nome, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, username, hashedPassword, nome, role, createdAt],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (role === 'professor') {
        const professorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        db.run(
          `INSERT INTO professores (id, nome, email, telefone, materia, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
          [professorId, nome, `${username}@escola.com`, '', 'Não definida', createdAt],
          (err) => {
            if (err) {
              console.error('Erro ao criar professor:', err);
            } else {
              db.run(`UPDATE usuarios SET professorId = ? WHERE id = ?`, [professorId, userId]);
            }
          }
        );
      }
      
      res.status(201).json({ success: true });
    }
  );
});

app.delete('/api/usuarios/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  if (req.user?.id === id) {
    return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário.' });
  }
  db.run(`DELETE FROM usuarios WHERE id = ?`, id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(204).send();
  });
});

app.put('/api/usuarios/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { username, nome, role, password } = req.body;

  if (!username || !nome || !role) {
    return res.status(400).json({ error: 'Username, nome e role são obrigatórios.' });
  }

  if (!['admin', 'professor'].includes(role)) {
    return res.status(400).json({ error: 'Role inválida.' });
  }

  if (req.user?.id === id && role !== 'admin') {
    return res.status(400).json({ error: 'Você não pode remover seu próprio acesso de administrador.' });
  }

  db.get(`SELECT id FROM usuarios WHERE username = ? AND id != ?`, [username, id], (err, existing: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (existing) {
      return res.status(409).json({ error: 'Já existe outro usuário com este username.' });
    }

    const finishUpdate = (hashedPassword?: string) => {
      const sql = hashedPassword
        ? `UPDATE usuarios SET username = ?, nome = ?, role = ?, password = ? WHERE id = ?`
        : `UPDATE usuarios SET username = ?, nome = ?, role = ? WHERE id = ?`;
      const params = hashedPassword
        ? [username, nome, role, hashedPassword, id]
        : [username, nome, role, id];

      db.run(sql, params, function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        return res.json({ success: true });
      });
    };

    if (password && String(password).trim()) {
      const hashedPassword = bcrypt.hashSync(String(password), 10);
      finishUpdate(hashedPassword);
    } else {
      finishUpdate();
    }
  });
});

// --- Rotas para Professores ---
app.get('/api/professores', requireAdmin, (req, res) => {
  db.all('SELECT * FROM professores WHERE id != ?', [UNASSIGNED_PROFESSOR_ID], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ professores: rows });
  });
});

app.post('/api/professores', requireAdmin, (req, res) => {
  const { nome, email, materia, telefone } = req.body;
  if (!nome || !email || !materia) {
    return res.status(400).json({ error: 'Nome, Email e Matéria são obrigatórios.' });
  }

  db.get(`SELECT id FROM professores WHERE email = ?`, [email], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.status(409).json({ error: 'Já existe um professor com este email.' });
      return;
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO professores (id, nome, email, materia, telefone, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nome, email, materia, telefone, createdAt],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ id, nome, email, materia, telefone, createdAt });
      }
    );
  });
});

app.put('/api/professores/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { nome, email, materia, telefone } = req.body;

  if (!nome || !email || !materia) {
    return res.status(400).json({ error: 'Nome, Email e Matéria são obrigatórios.' });
  }

  db.get(`SELECT id FROM professores WHERE email = ? AND id != ?`, [email, id], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.status(409).json({ error: 'Já existe outro professor com este email.' });
      return;
    }

    db.run(
      `UPDATE professores SET nome = ?, email = ?, materia = ?, telefone = ? WHERE id = ?`,
      [nome, email, materia, telefone, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Professor não encontrado.' });
          return;
        }
        res.json({ id, nome, email, materia, telefone });
      }
    );
  });
});

app.delete('/api/professores/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  db.get(`SELECT COUNT(*) as count FROM turmas WHERE professorId = ?`, [id], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row.count > 0) {
      res.status(409).json({ error: 'Não é possível excluir o professor: Existem turmas associadas a ele.' });
      return;
    }

    db.run(`DELETE FROM professores WHERE id = ?`, id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Professor não encontrado.' });
        return;
      }
      res.status(204).send();
    });
  });
});

// --- Rotas para Turmas - Ajuste para minPassingGrade
app.get('/api/turmas', (req: AuthenticatedRequest, res) => {
  const { professorId } = req.query;
  const loggedUser = req.user;
  let query = 'SELECT * FROM turmas';
  let params: any[] = [];

  if (loggedUser?.role === 'professor') {
    if (!loggedUser.professorId) {
      return res.json({ turmas: [] });
    }
    query += ' WHERE professorId = ?';
    params.push(loggedUser.professorId);
  } else if (professorId) {
    query += ' WHERE professorId = ?';
    params.push(professorId);
  }
  
  db.all(query, params, (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const turmas = rows.map((row: any) => ({
        ...row,
        minPassingGrade: typeof row.minPassingGrade === 'number' ? row.minPassingGrade : 6.0
    }));
    res.json({ turmas: turmas });
  });
});

app.get('/api/turmas/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM turmas WHERE id = ?', [id], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Turma não encontrada.' });
      return;
    }
    const turma = {
        ...row,
        minPassingGrade: typeof row.minPassingGrade === 'number' ? row.minPassingGrade : 6.0
    };
    res.json({ turma: turma });
  });
});

app.post('/api/turmas', (req: AuthenticatedRequest, res) => {
  let { nome, professorId, ano, semestre, observacao, minPassingGrade } = req.body;

  if (req.user?.role === 'professor') {
    professorId = req.user.professorId;
  } else if (!professorId) {
    professorId = UNASSIGNED_PROFESSOR_ID;
  }

  if (!nome || !professorId || !ano) {
    return res.status(400).json({ error: 'Nome, Professor ID e Ano são obrigatórios.' });
  }

  const continueInsert = () => {
    const parsedMinPassingGrade = parseFloat(minPassingGrade);
    const finalMinPassingGrade = !isNaN(parsedMinPassingGrade) && parsedMinPassingGrade >= 0 && parsedMinPassingGrade <= 10 ? parsedMinPassingGrade : 6.0;
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO turmas (id, nome, professorId, ano, semestre, observacao, minPassingGrade, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nome, professorId, ano, semestre || null, observacao || null, finalMinPassingGrade, createdAt],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ id, nome, professorId, ano, semestre, observacao, minPassingGrade: finalMinPassingGrade, createdAt });
      }
    );
  };

  if (professorId === UNASSIGNED_PROFESSOR_ID) {
    ensureUnassignedProfessorExists((unassignedErr) => {
      if (unassignedErr) {
        return res.status(500).json({ error: `Erro ao preparar professor padrão: ${unassignedErr.message}` });
      }
      continueInsert();
    });
    return;
  }

  continueInsert();
});

app.put('/api/turmas/:id', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  let { nome, professorId, ano, semestre, observacao, minPassingGrade } = req.body;

  if (req.user?.role === 'professor') {
    if (!req.user.professorId) {
      return res.status(403).json({ error: 'Professor sem vínculo ativo. Contate o administrador.' });
    }
    db.get('SELECT id FROM turmas WHERE id = ? AND professorId = ?', [id, req.user.professorId], (accessErr, turmaRow: any) => {
      if (accessErr) {
        return res.status(500).json({ error: accessErr.message });
      }
      if (!turmaRow) {
        return res.status(403).json({ error: 'Você não pode editar turmas de outro professor.' });
      }

      professorId = req.user?.professorId;

      if (!nome || !professorId || !ano) {
        return res.status(400).json({ error: 'Nome, Professor ID e Ano são obrigatórios.' });
      }

      const parsedMinPassingGrade = parseFloat(minPassingGrade);
      const finalMinPassingGrade = !isNaN(parsedMinPassingGrade) && parsedMinPassingGrade >= 0 && parsedMinPassingGrade <= 10 ? parsedMinPassingGrade : 6.0;

      db.run(
        `UPDATE turmas SET nome = ?, professorId = ?, ano = ?, semestre = ?, observacao = ?, minPassingGrade = ? WHERE id = ?`,
        [nome, professorId, ano, semestre || null, observacao || null, finalMinPassingGrade, id],
        function (err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          if (this.changes === 0) {
            res.status(404).json({ error: 'Turma não encontrada.' });
            return;
          }
          res.json({ id, nome, professorId, ano, semestre, observacao, minPassingGrade: finalMinPassingGrade });
        }
      );
    });
    return;
  }

  if (!professorId) {
    professorId = UNASSIGNED_PROFESSOR_ID;
  }

  const runAdminUpdate = () => {
    if (!nome || !professorId || !ano) {
      return res.status(400).json({ error: 'Nome, Professor ID e Ano são obrigatórios.' });
    }

    const parsedMinPassingGrade = parseFloat(minPassingGrade);
    const finalMinPassingGrade = !isNaN(parsedMinPassingGrade) && parsedMinPassingGrade >= 0 && parsedMinPassingGrade <= 10 ? parsedMinPassingGrade : 6.0;

    db.run(
      `UPDATE turmas SET nome = ?, professorId = ?, ano = ?, semestre = ?, observacao = ?, minPassingGrade = ? WHERE id = ?`,
      [nome, professorId, ano, semestre || null, observacao || null, finalMinPassingGrade, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Turma não encontrada.' });
          return;
        }
        res.json({ id, nome, professorId, ano, semestre, observacao, minPassingGrade: finalMinPassingGrade });
      }
    );
  };

  if (professorId === UNASSIGNED_PROFESSOR_ID) {
    ensureUnassignedProfessorExists((unassignedErr) => {
      if (unassignedErr) {
        return res.status(500).json({ error: `Erro ao preparar professor padrão: ${unassignedErr.message}` });
      }
      runAdminUpdate();
    });
    return;
  }

  runAdminUpdate();
});

app.delete('/api/turmas/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM turmas WHERE id = ?`, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Turma não encontrada.' });
      return;
    }
    res.status(204).send();
  });
});


// --- Rotas para Alunos ---
app.get('/api/alunos', (req: AuthenticatedRequest, res) => {
  const { professorId, turmaId } = req.query;
  const { limit, offset } = parsePagination(req.query);
  const loggedUser = req.user;
  const targetProfessorId = loggedUser?.role === 'professor' ? loggedUser.professorId : professorId;

  if (targetProfessorId) {
    db.all('SELECT * FROM turmas WHERE professorId = ?', [targetProfessorId], (err, turmas: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const turmaIds = turmas.map(t => t.id);
      if (turmaIds.length === 0) {
        res.json({ alunos: [], total: 0, limit, offset });
        return;
      }
      const placeholders = turmaIds.map(() => '?').join(',');
      let baseWhere = ` FROM alunos WHERE turmaId IN (${placeholders})`;
      const whereParams: any[] = [...turmaIds];
      if (turmaId) {
        baseWhere += ' AND turmaId = ?';
        whereParams.push(turmaId);
      }
      db.get(`SELECT COUNT(*) as total${baseWhere}`, whereParams, (countErr, countRow: any) => {
        if (countErr) {
          res.status(500).json({ error: countErr.message });
          return;
        }
        let dataSql = `SELECT *${baseWhere} ORDER BY nome COLLATE NOCASE ASC`;
        const dataParams: any[] = [...whereParams];
        if (limit !== null) {
          dataSql += ' LIMIT ? OFFSET ?';
          dataParams.push(limit, offset);
        }
        db.all(dataSql, dataParams, (err, rows: any[]) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ alunos: rows, total: countRow?.total || rows.length, limit, offset });
        });
      });
    });
  } else {
    let baseWhere = ' FROM alunos';
    const whereParams: any[] = [];
    if (turmaId) {
      baseWhere += ' WHERE turmaId = ?';
      whereParams.push(turmaId);
    }
    db.get(`SELECT COUNT(*) as total${baseWhere}`, whereParams, (countErr, countRow: any) => {
      if (countErr) {
        res.status(500).json({ error: countErr.message });
        return;
      }
      let dataSql = `SELECT *${baseWhere} ORDER BY nome COLLATE NOCASE ASC`;
      const dataParams: any[] = [...whereParams];
      if (limit !== null) {
        dataSql += ' LIMIT ? OFFSET ?';
        dataParams.push(limit, offset);
      }
      db.all(dataSql, dataParams, (err, rows: any[]) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ alunos: rows, total: countRow?.total || rows.length, limit, offset });
      });
    });
  }
});

app.get('/api/alunos/turma/:turmaId', (req, res) => {
  const { turmaId } = req.params;
  db.all('SELECT * FROM alunos WHERE turmaId = ?', [turmaId], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ alunos: rows });
  });
});

app.get('/api/alunos/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM alunos WHERE id = ?', [id], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Aluno não encontrado.' });
      return;
    }
    res.json({ aluno: row });
  });
});

app.post('/api/alunos', (req, res) => {
  const { nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, responsavelTelefone } = req.body;
  if (!nome || !matricula || !turmaId) {
    return res.status(400).json({ error: 'Nome, Matrícula e Turma são obrigatórios.' });
  }

  db.get(`SELECT id FROM alunos WHERE matricula = ?`, [matricula], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.status(409).json({ error: 'Já existe um aluno com esta matrícula.' });
      return;
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO alunos (id, nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, responsavelTelefone, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nome, matricula, turmaId, email || null, telefone || null, dataNascimento || null, responsavel || null, responsavelTelefone || null, createdAt],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ id, nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, responsavelTelefone, createdAt });
      }
    );
  });
});

app.put('/api/alunos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, responsavelTelefone } = req.body;

  if (!nome || !matricula || !turmaId) {
    return res.status(400).json({ error: 'Nome, Matrícula e Turma são obrigatórios.' });
  }

  db.get(`SELECT id FROM alunos WHERE matricula = ? AND id != ?`, [matricula, id], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.status(409).json({ error: 'Já existe outro aluno com esta matrícula.' });
      return;
    }

    db.run(
      `UPDATE alunos SET nome = ?, matricula = ?, turmaId = ?, email = ?, telefone = ?, dataNascimento = ?, responsavel = ?, responsavelTelefone = ? WHERE id = ?`,
      [nome, matricula, turmaId, email || null, telefone || null, dataNascimento || null, responsavel || null, responsavelTelefone || null, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Aluno não encontrado.' });
          return;
        }
        res.json({ id, nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, responsavelTelefone });
      }
    );
  });
});

app.delete('/api/alunos/:id', (req, res) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run(`DELETE FROM presencas WHERE alunoId = ?`, [id]);
    db.run(`DELETE FROM notas WHERE alunoId = ?`, [id]);
    db.run(`DELETE FROM alertas_alunos WHERE alunoId = ?`, [id]);
    db.run(`DELETE FROM alunos WHERE id = ?`, [id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Aluno não encontrado.' });
        return;
      }
      res.status(204).send();
    });
  });
});

// --- Rotas para Presencas ---
app.get('/api/presencas', (req: AuthenticatedRequest, res) => {
  if (req.user?.role === 'admin') {
    const { turmaId, alunoId, startDate, endDate } = req.query as any;
    const { limit, offset } = parsePagination(req.query);
    let sql = 'SELECT * FROM presencas WHERE 1=1';
    const params: any[] = [];

    if (turmaId) {
      sql += ' AND turmaId = ?';
      params.push(turmaId);
    }
    if (alunoId) {
      sql += ' AND alunoId = ?';
      params.push(alunoId);
    }
    if (startDate) {
      sql += ' AND data >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND data <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY data DESC, createdAt DESC';
    if (limit !== null) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    db.all(sql, params, (err, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ presencas: rows });
    });
    return;
  }

  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  const { turmaId, alunoId, startDate, endDate } = req.query as any;
  const { limit, offset } = parsePagination(req.query);
  let sql = 'SELECT p.* FROM presencas p INNER JOIN turmas t ON t.id = p.turmaId WHERE t.professorId = ?';
  const params: any[] = [professorId];

  if (turmaId) {
    sql += ' AND p.turmaId = ?';
    params.push(turmaId);
  }
  if (alunoId) {
    sql += ' AND p.alunoId = ?';
    params.push(alunoId);
  }
  if (startDate) {
    sql += ' AND p.data >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND p.data <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY p.data DESC, p.createdAt DESC';
  if (limit !== null) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  db.all(sql, params, (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ presencas: rows });
  });
});

app.get('/api/presencas/aluno/:alunoId', requireProfessor, (req: AuthenticatedRequest, res) => {
  const { alunoId } = req.params;
  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  db.all('SELECT p.* FROM presencas p INNER JOIN turmas t ON t.id = p.turmaId WHERE p.alunoId = ? AND t.professorId = ?', [alunoId, professorId], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ presencas: rows });
  });
});

app.get('/api/presencas/turma/:turmaId', requireProfessor, (req: AuthenticatedRequest, res) => {
  const { turmaId } = req.params;
  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  db.get('SELECT id FROM turmas WHERE id = ? AND professorId = ?', [turmaId, professorId], (accessErr, turma: any) => {
    if (accessErr) return res.status(500).json({ error: accessErr.message });
    if (!turma) return res.status(403).json({ error: 'Acesso negado para esta turma.' });
    db.all('SELECT * FROM presencas WHERE turmaId = ?', [turmaId], (err, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ presencas: rows });
    });
  });
});

app.post('/api/presencas', requireProfessor, (req: AuthenticatedRequest, res) => {
  const { alunoId, turmaId, data, presente, observacao } = req.body;
  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  if (!alunoId || !turmaId || !data || typeof presente !== 'boolean') {
    return res.status(400).json({ error: 'Aluno ID, Turma ID, Data e Presente são obrigatórios.' });
  }

  db.get(
    `SELECT a.id FROM alunos a INNER JOIN turmas t ON t.id = a.turmaId WHERE a.id = ? AND a.turmaId = ? AND t.professorId = ?`,
    [alunoId, turmaId, professorId],
    (accessErr, acesso: any) => {
      if (accessErr) return res.status(500).json({ error: accessErr.message });
      if (!acesso) return res.status(403).json({ error: 'Você não pode registrar presença para esta turma/aluno.' });

      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const createdAt = new Date().toISOString();
      const presenteInt = presente ? 1 : 0;
      db.run(
        `INSERT INTO presencas (id, alunoId, turmaId, data, presente, observacao, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, alunoId, turmaId, data, presenteInt, observacao || null, createdAt],
        function (err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.status(201).json({ id, alunoId, turmaId, data, presente, observacao, createdAt });
        }
      );
    }
  );
});

app.put('/api/presencas/:id', requireProfessor, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { alunoId, turmaId, data, presente, observacao } = req.body;
  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;

  if (!alunoId || !turmaId || !data || typeof presente !== 'boolean') {
    return res.status(400).json({ error: 'Aluno ID, Turma ID, Data e Presente são obrigatórios.' });
  }
  const presenteInt = presente ? 1 : 0;

  db.get('SELECT p.id FROM presencas p INNER JOIN turmas t ON t.id = p.turmaId WHERE p.id = ? AND t.professorId = ?', [id, professorId], (accessErr, row: any) => {
    if (accessErr) return res.status(500).json({ error: accessErr.message });
    if (!row) return res.status(403).json({ error: 'Você não pode alterar esta presença.' });
    db.run(
      `UPDATE presencas SET alunoId = ?, turmaId = ?, data = ?, presente = ?, observacao = ? WHERE id = ?`,
      [alunoId, turmaId, data, presenteInt, observacao || null, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Presença não encontrada.' });
          return;
        }
        res.json({ id, alunoId, turmaId, data, presente, observacao });
      }
    );
  });
});

app.delete('/api/presencas/:id', requireProfessor, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  db.get('SELECT p.id FROM presencas p INNER JOIN turmas t ON t.id = p.turmaId WHERE p.id = ? AND t.professorId = ?', [id, professorId], (accessErr, row: any) => {
    if (accessErr) return res.status(500).json({ error: accessErr.message });
    if (!row) return res.status(403).json({ error: 'Você não pode excluir esta presença.' });
    db.run(`DELETE FROM presencas WHERE id = ?`, id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Presença não encontrada.' });
        return;
      }
      res.status(204).send();
    });
  });
});

// --- Rotas para Notas - Ajuste para bimestre
app.get('/api/notas', (req: AuthenticatedRequest, res) => {
  if (req.user?.role === 'admin') {
    const { turmaId, alunoId, bimestre, startDate, endDate } = req.query as any;
    const { limit, offset } = parsePagination(req.query);
    let sql = 'SELECT * FROM notas WHERE 1=1';
    const params: any[] = [];

    if (turmaId) {
      sql += ' AND turmaId = ?';
      params.push(turmaId);
    }
    if (alunoId) {
      sql += ' AND alunoId = ?';
      params.push(alunoId);
    }
    if (bimestre) {
      sql += ' AND bimestre = ?';
      params.push(bimestre);
    }
    if (startDate) {
      sql += ' AND dataAvaliacao >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND dataAvaliacao <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY dataAvaliacao DESC, createdAt DESC';
    if (limit !== null) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    db.all(sql, params, (err, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ notas: rows });
    });
    return;
  }

  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  const { turmaId, alunoId, bimestre, startDate, endDate } = req.query as any;
  const { limit, offset } = parsePagination(req.query);
  let sql = 'SELECT n.* FROM notas n INNER JOIN turmas t ON t.id = n.turmaId WHERE t.professorId = ?';
  const params: any[] = [professorId];

  if (turmaId) {
    sql += ' AND n.turmaId = ?';
    params.push(turmaId);
  }
  if (alunoId) {
    sql += ' AND n.alunoId = ?';
    params.push(alunoId);
  }
  if (bimestre) {
    sql += ' AND n.bimestre = ?';
    params.push(bimestre);
  }
  if (startDate) {
    sql += ' AND n.dataAvaliacao >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND n.dataAvaliacao <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY n.dataAvaliacao DESC, n.createdAt DESC';
  if (limit !== null) {
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }

  db.all(sql, params, (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ notas: rows });
  });
});

app.get('/api/notas/aluno/:alunoId', (req: AuthenticatedRequest, res) => {
  const { alunoId } = req.params;
  if (req.user?.role === 'admin') {
    db.all('SELECT * FROM notas WHERE alunoId = ?', [alunoId], (err, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ notas: rows });
    });
    return;
  }

  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  db.all('SELECT n.* FROM notas n INNER JOIN turmas t ON t.id = n.turmaId WHERE n.alunoId = ? AND t.professorId = ?', [alunoId, professorId], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ notas: rows });
  });
});

app.get('/api/notas/turma/:turmaId', (req: AuthenticatedRequest, res) => {
  const { turmaId } = req.params;
  if (req.user?.role === 'admin') {
    db.all('SELECT * FROM notas WHERE turmaId = ?', [turmaId], (err, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ notas: rows });
    });
    return;
  }

  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  db.get('SELECT id FROM turmas WHERE id = ? AND professorId = ?', [turmaId, professorId], (accessErr, turma: any) => {
    if (accessErr) return res.status(500).json({ error: accessErr.message });
    if (!turma) return res.status(403).json({ error: 'Acesso negado para esta turma.' });
    db.all('SELECT * FROM notas WHERE turmaId = ?', [turmaId], (err, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ notas: rows });
    });
  });
});

app.post('/api/notas', requireProfessor, (req: AuthenticatedRequest, res) => {
  const { alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao } = req.body;
  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  if (!alunoId || !turmaId || !avaliacao || nota === undefined || !dataAvaliacao || !bimestre) {
    return res.status(400).json({ error: 'Aluno ID, Turma ID, Avaliação, Nota, Data de Avaliação e Bimestre são obrigatórios.' });
  }
  if (!['1', '2', '3', '4'].includes(bimestre)) {
    return res.status(400).json({ error: 'Bimestre deve ser 1, 2, 3 ou 4.' });
  }

  db.get(
    `SELECT a.id FROM alunos a INNER JOIN turmas t ON t.id = a.turmaId WHERE a.id = ? AND a.turmaId = ? AND t.professorId = ?`,
    [alunoId, turmaId, professorId],
    (accessErr, acesso: any) => {
      if (accessErr) return res.status(500).json({ error: accessErr.message });
      if (!acesso) return res.status(403).json({ error: 'Você não pode lançar nota para esta turma/aluno.' });

      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const createdAt = new Date().toISOString();
      db.run(
        `INSERT INTO notas (id, alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao || null, createdAt],
        function (err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.status(201).json({ id, alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao, createdAt });
        }
      );
    }
  );
});

app.put('/api/notas/:id', requireProfessor, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao } = req.body;
  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;

  if (!alunoId || !turmaId || !avaliacao || nota === undefined || !dataAvaliacao || !bimestre) {
    return res.status(400).json({ error: 'Aluno ID, Turma ID, Avaliação, Nota, Data de Avaliação e Bimestre são obrigatórios.' });
  }
  if (!['1', '2', '3', '4'].includes(bimestre)) {
    return res.status(400).json({ error: 'Bimestre deve ser 1, 2, 3 ou 4.' });
  }

  db.get('SELECT n.id FROM notas n INNER JOIN turmas t ON t.id = n.turmaId WHERE n.id = ? AND t.professorId = ?', [id, professorId], (accessErr, row: any) => {
    if (accessErr) return res.status(500).json({ error: accessErr.message });
    if (!row) return res.status(403).json({ error: 'Você não pode alterar esta nota.' });
    db.run(
      `UPDATE notas SET alunoId = ?, turmaId = ?, avaliacao = ?, nota = ?, dataAvaliacao = ?, bimestre = ?, observacao = ? WHERE id = ?`,
      [alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao || null, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Nota não encontrada.' });
          return;
        }
        res.json({ id, alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao });
      }
    );
  });
});

app.delete('/api/notas/:id', requireProfessor, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const professorId = requireProfessorWithVinculo(req, res);
  if (!professorId) return;
  db.get('SELECT n.id FROM notas n INNER JOIN turmas t ON t.id = n.turmaId WHERE n.id = ? AND t.professorId = ?', [id, professorId], (accessErr, row: any) => {
    if (accessErr) return res.status(500).json({ error: accessErr.message });
    if (!row) return res.status(403).json({ error: 'Você não pode excluir esta nota.' });
    db.run(`DELETE FROM notas WHERE id = ?`, id, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Nota não encontrada.' });
        return;
      }
      res.status(204).send();
    });
  });
});

// --- Rotas para Planejamentos ---
app.get('/api/planejamentos', (req, res) => {
  db.all('SELECT * FROM planejamentos', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ planejamentos: rows });
  });
});

app.get('/api/planejamentos/turma/:turmaId', (req, res) => {
  const { turmaId } = req.params;
  db.all('SELECT * FROM planejamentos WHERE turmaId = ?', [turmaId], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ planejamentos: rows });
  });
});


app.post('/api/planejamentos', (req, res) => {
  const { turmaId, data, conteudo, observacoes } = req.body;
  if (!turmaId || !data || !conteudo) {
    return res.status(400).json({ error: 'Turma ID, Data e Conteúdo são obrigatórios.' });
  }
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO planejamentos (id, turmaId, data, conteudo, observacoes, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, turmaId, data, conteudo, observacoes || null, createdAt],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id, turmaId, data, conteudo, observacoes, createdAt });
    }
  );
});

app.put('/api/planejamentos/:id', (req, res) => {
  const { id } = req.params;
  const { turmaId, data, conteudo, observacoes } = req.body;
  if (!turmaId || !data || !conteudo) {
    return res.status(400).json({ error: 'Turma ID, Data e Conteúdo são obrigatórios.' });
  }
  db.run(
    `UPDATE planejamentos SET turmaId = ?, data = ?, conteudo = ?, observacoes = ? WHERE id = ?`,
    [turmaId, data, conteudo, observacoes || null, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Planejamento não encontrado.' });
        return;
      }
      res.json({ id, turmaId, data, conteudo, observacoes });
    }
  );
});

app.delete('/api/planejamentos/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM planejamentos WHERE id = ?`, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Planejamento não encontrado.' });
      return;
    }
    res.status(204).send();
  });
});

// --- Rotas para Feriados ---
app.get('/api/feriados', (req, res) => {
  db.all('SELECT * FROM feriados', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ feriados: rows });
  });
});

app.post('/api/feriados', (req, res) => {
  const { data, nome } = req.body;
  if (!data || !nome) {
    return res.status(400).json({ error: 'Data e Nome são obrigatórios.' });
  }
  db.get(`SELECT id FROM feriados WHERE data = ?`, [data], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      return res.status(409).json({ error: 'Já existe um feriado cadastrado para esta data.' });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const createdAt = new Date().toISOString();
    db.run(
      `INSERT INTO feriados (id, data, nome, createdAt) VALUES (?, ?, ?, ?)`,
      [id, data, nome, createdAt],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ id, data, nome, createdAt });
      }
    );
  });
});

app.put('/api/feriados/:id', (req, res) => {
  const { id } = req.params;
  const { data, nome } = req.body;
  if (!data || !nome) {
    return res.status(400).json({ error: 'Data e Nome são obrigatórios.' });
  }
  db.get(`SELECT id FROM feriados WHERE data = ? AND id != ?`, [data, id], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      return res.status(409).json({ error: 'Já existe outro feriado cadastrado para esta data.' });
    }
    db.run(
      `UPDATE feriados SET data = ?, nome = ? WHERE id = ?`,
      [data, nome, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Feriado não encontrado.' });
          return;
        }
        res.json({ id, data, nome });
      }
    );
  });
});

app.delete('/api/feriados/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM feriados WHERE id = ?`, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Feriado não encontrado.' });
      return;
    }
    res.status(204).send();
  });
});

app.post('/api/feriados/sync-national', (req, res) => {
  const { year } = req.body;
  if (!year) {
    return res.status(400).json({ error: 'Ano é obrigatório.' });
  }

  const axios = require('axios');
  const API_KEY = '6CJsBMxYVtaFJyJkFMhvOXK2vIE0BLkz';

  const translations: Record<string, string> = {
    "New Year's Day": "Ano Novo",
    "Carnival": "Carnaval",
    "Tiradentes Day": "Tiradentes",
    "Good Friday": "Sexta-feira Santa",
    "Easter Sunday": "Páscoa",
    "Labour Day": "Dia do Trabalho",
    "Labor Day": "Dia do Trabalho",
    "Corpus Christi": "Corpus Christi",
    "Independence Day": "Dia da Independência",
    "Our Lady of the Apparition": "N. S. da Aparição",
    "Brazilian Air Force Day": "Dia da Força Aérea Brasileira",
    "Children's Day": "Dia das Crianças",
    "All Souls' Day": "Finados",
    "Proclamation of the Republic": "Proclamação da República",
    "Black Awareness Day": "Dia da Consciência Negra",
    "National Day of Thanksgiving": "Dia de Ação de Graças",
    "Christmas Day": "Natal",
    "Dia de Nossa Senhora da Conceição": "Dia de Nossa Senhora da Conceição"
  };

  const getTranslation = (name: string): string => {
    return translations[name] || name;
  };
  
  axios.get(`https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=BR&year=${year}&type=national`)
    .then((response: any) => {
      const holidays = response.data.response.holidays;
      
      if (!holidays || holidays.length === 0) {
        return res.json({ message: 'Nenhum feriado nacional encontrado para este ano.', added: 0 });
      }

      // Primeiro, traduzir todos os feriados existentes no banco
      db.all(`SELECT * FROM feriados`, [], (err, rows: any[]) => {
        if (!err && rows) {
          rows.forEach((f: any) => {
            const translated = getTranslation(f.nome);
            if (translated !== f.nome) {
              db.run(`UPDATE feriados SET nome = ? WHERE id = ?`, [translated, f.id]);
            }
          });
        }

        let added = 0;
        let processed = 0;

      holidays.forEach((h: any) => {
        const data = h.date.iso;
        const nomeIngles = h.name;
        const nome = getTranslation(nomeIngles);

        db.get(`SELECT id FROM feriados WHERE data = ?`, [data], (err, row: any) => {
          if (err || row) {
            processed++;
            if (processed === holidays.length) {
              res.json({ message: `${added} feriados nacionais de ${year} foram sincronizados.`, added });
            }
            return;
          }

          const id = Date.now().toString(36) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
          const createdAt = new Date().toISOString();
          
          db.run(`INSERT INTO feriados (id, data, nome, createdAt) VALUES (?, ?, ?, ?)`, [id, data, nome, createdAt], (err) => {
            if (!err) added++;
            processed++;
            if (processed === holidays.length) {
              res.json({ message: `${added} feriados nacionais de ${year} foram sincronizados.`, added });
            }
          });
        });
        });
      });
    })
    .catch((error: any) => {
      console.error('Erro ao buscar feriados:', error.message);
      res.status(500).json({ error: 'Falha ao buscar feriados da API externa.' });
    });
});

// --- Rotas para Eventos ---
app.get('/api/eventos', (req, res) => {
  db.all('SELECT * FROM eventos', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ eventos: rows });
  });
});

app.post('/api/eventos', (req, res) => {
  const { titulo, descricao, data, horario, tipo } = req.body;
  if (!titulo || !data || !horario || !tipo) {
    return res.status(400).json({ error: 'Título, Data, Horário e Tipo são obrigatórios.' });
  }
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO eventos (id, titulo, descricao, data, horario, tipo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, titulo, descricao || null, data, horario, tipo, createdAt],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id, titulo, descricao, data, horario, tipo, createdAt });
    }
  );
});

app.put('/api/eventos/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, data, horario, tipo } = req.body;
  if (!titulo || !data || !horario || !tipo) {
    return res.status(400).json({ error: 'Título, Data, Horário e Tipo são obrigatórios.' });
  }
  db.run(
    `UPDATE eventos SET titulo = ?, descricao = ?, data = ?, horario = ?, tipo = ? WHERE id = ?`,
    [titulo, descricao || null, data, horario, tipo, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Evento não encontrado.' });
        return;
      }
      res.json({ id, titulo, descricao, data, horario, tipo });
    }
  );
});

app.delete('/api/eventos/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM eventos WHERE id = ?`, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Evento não encontrado.' });
      return;
    }
    res.status(204).send();
  });
});

// --- Rotas para Alertas de Alunos ---
app.get('/api/alertas-alunos', (req, res) => {
  db.all('SELECT * FROM alertas_alunos', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ alertas: rows });
  });
});

app.post('/api/alertas-alunos', (req, res) => {
  const { alunoId, tipoAlerta, observacao, status } = req.body;
  if (!alunoId || !tipoAlerta || !status) {
    return res.status(400).json({ error: 'Aluno ID, Tipo de Alerta e Status são obrigatórios.' });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const dataRegistro = new Date().toISOString();

  db.run(
    `INSERT INTO alertas_alunos (id, alunoId, tipoAlerta, observacao, dataRegistro, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, alunoId, tipoAlerta, observacao || null, dataRegistro, status],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id, alunoId, tipoAlerta, observacao, dataRegistro, status });
    }
  );
});

app.put('/api/alertas-alunos/:id', (req, res) => {
  const { id } = req.params;
  const { alunoId, tipoAlerta, observacao, dataResolucao, status } = req.body;

  if (!alunoId || !tipoAlerta || !status) {
    return res.status(400).json({ error: 'Aluno ID, Tipo de Alerta e Status são obrigatórios.' });
  }

  db.run(
    `UPDATE alertas_alunos SET alunoId = ?, tipoAlerta = ?, observacao = ?, dataResolucao = ?, status = ? WHERE id = ?`,
    [alunoId, tipoAlerta, observacao || null, dataResolucao || null, status, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Alerta de Aluno não encontrado.' });
        return;
      }
      res.json({ id, alunoId, tipoAlerta, observacao, dataResolucao, status });
    }
  );
});

app.delete('/api/alertas-alunos/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM alertas_alunos WHERE id = ?`, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Alerta de Aluno não encontrado.' });
      return;
    }
    res.status(204).send();
  });
});

// --- Rota de Administração: Limpar Todos os Dados ---
app.post('/api/admin/clear-all-data', (req, res) => {
  // ATENÇÃO: Esta é uma operação DESTRUTIVA.
  // Em produção, isso exigiria autenticação e autorização de administrador.

  db.serialize(() => {
    const tablesToClear = [
      'presencas', 'notas', 'planejamentos', 'eventos', 'feriados', 'alertas_alunos', 'alunos', 'turmas', 'professores', 'usuarios'
    ];

    let errors: string[] = [];
    let completedCount = 0;
    
    db.run('PRAGMA foreign_keys = OFF;', (pragmaErr) => {
      if (pragmaErr) {
        errors.push(`Erro ao desativar FKs: ${pragmaErr.message}`);
      }

      tablesToClear.forEach(tableName => {
        db.run(`DELETE FROM ${tableName}`, function(err) {
          if (err) {
            console.error(`Erro ao limpar tabela ${tableName}:`, err.message);
            errors.push(`Erro ao limpar ${tableName}: ${err.message}`);
          } else {
            console.log(`Tabela ${tableName} limpa. Registros afetados: ${this.changes}`);
          }
          completedCount++;
          if (completedCount === tablesToClear.length) {
            db.run('PRAGMA foreign_keys = ON;', (pragmaErrOn) => {
              if (pragmaErrOn) {
                errors.push(`Erro ao reativar FKs: ${pragmaErrOn.message}`);
              }
              if (errors.length > 0) {
                res.status(500).json({ success: false, message: 'Erro ao limpar dados de algumas tabelas.', errors });
              } else {
                const adminId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                const hashedPassword = bcrypt.hashSync('12345678', 10);
                db.run(`INSERT INTO usuarios (id, username, password, nome, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
                  [adminId, 'admin', hashedPassword, 'Administrador', 'admin', new Date().toISOString()]);
                res.json({ success: true, message: 'Todos os dados foram limpos com sucesso! Recrie o banco se necessário.' });
              }
            });
          }
        });
      });
    });
  });
});

// --- Rota de Administração: Importar Todos os Dados ---
app.post('/api/admin/import-data', (req, res) => {
  const importedData = req.body;

  if (!importedData || typeof importedData !== 'object') {
    return res.status(400).json({ error: 'Dados de importação inválidos.' });
  }

  db.serialize(() => {
    db.run('PRAGMA foreign_keys = OFF;');

    const tablesToClear = [
      'presencas', 'notas', 'planejamentos', 'eventos', 'feriados', 'alertas_alunos', 'alunos', 'turmas', 'professores'
    ];

    const insertionOrder = [
      'professores', 'turmas', 'alunos', 'presencas', 'notas', 'planejamentos', 'feriados', 'eventos', 'alertas_alunos'
    ];

    let errors: string[] = [];
    
    const executeBatch = (statements: { sql: string; params: any[]; }[], callback: (err?: Error) => void) => {
      let currentStatement = 0;
      const runNext = () => {
        if (currentStatement < statements.length) {
          const stmt = statements[currentStatement];
          db.run(stmt.sql, stmt.params, function(err) {
            if (err) {
              console.error(`Erro ao executar SQL: ${err.message} (SQL: ${stmt.sql})`);
              return callback(err);
            }
            currentStatement++;
            runNext();
          });
        } else {
          callback();
        }
      };
      runNext();
    };

    let clearStatements: { sql: string; params: any[]; }[] = [];
    tablesToClear.forEach(tableName => {
        clearStatements.push({ sql: `DELETE FROM ${tableName}`, params: [] });
    });

    executeBatch(clearStatements, (err) => {
      if (err) {
        db.run('PRAGMA foreign_keys = ON;');
        return res.status(500).json({ success: false, message: 'Erro ao limpar dados existentes antes da importação.', errors: [err.message] });
      }

      let insertStatements: { sql: string; params: any[]; }[] = [];

      insertionOrder.forEach(tableName => {
        const records = (importedData as any)[tableName] || [];
        records.forEach((record: any) => {
          const keys = Object.keys(record);
          const values = Object.values(record);
          const placeholders = keys.map(() => '?').join(', ');
          const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
          insertStatements.push({ sql, params: values });
        });
      });

      executeBatch(insertStatements, (err) => {
        db.run('PRAGMA foreign_keys = ON;');

        if (err) {
          return res.status(500).json({ success: false, message: 'Erro ao inserir dados importados.', errors: [err.message] });
        }

        res.json({ success: true, message: 'Dados importados e restaurados com sucesso!' });
      });
    });
  });
});


// --- Rota para Configurações ---

app.get('/api/settings', (req, res) => {
  fs.readFile(settingsFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') { // Arquivo não encontrado, retorna configurações padrão
        return res.json({
          institutionName: 'Nome da Instituição Padrão',
          currentAcademicYear: new Date().getFullYear().toString(),
          darkMode: false,
          notifications: true,
          globalSearch: true
        });
      }
      console.error('Erro ao ler settings.json:', err);
      return res.status(500).json({ error: 'Erro ao carregar configurações.' });
    }
    try {
      const settings = JSON.parse(data);
      res.json(settings);
    } catch (parseError: any) {
      console.error('Erro ao parsear settings.json:', parseError);
      res.status(500).json({ error: 'Erro ao parsear configurações.' });
    }
  });
});

app.post('/api/settings', (req, res) => {
  const newSettings = req.body;

  const validKeys = ['institutionName', 'currentAcademicYear', 'darkMode', 'notifications', 'globalSearch'];
  const isValid = Object.keys(newSettings).every(key => validKeys.includes(key));
  if (!isValid) {
    return res.status(400).json({ error: 'Dados de configuração inválidos.' });
  }

  fs.writeFile(settingsFilePath, JSON.stringify(newSettings, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Erro ao salvar settings.json:', err);
      return res.status(500).json({ error: 'Erro ao salvar configurações.' });
    }
    res.json({ message: 'Configurações salvas com sucesso!', settings: newSettings });
  });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor backend rodando em http://0.0.0.0:${PORT}`);
});

// --- Rota para Gerar Dados de Teste ---
app.post('/api/admin/generate-test-data', (req, res) => {
  const { turmaId, quantidadeAlunos, diasPresenca } = req.body;
  
  if (!turmaId) {
    return res.status(400).json({ error: 'ID da turma é obrigatório.' });
  }
  
  const numAlunos = quantidadeAlunos || 20;
  const numDias = diasPresenca || 20;
  
  const nomes = [
    'Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Giovanna', 'Henrique', 'Isabela', 'João',
    'Karine', 'Lucas', 'Mariana', 'Nicolas', 'Olivia', 'Paulo', 'Queila', 'Rafael', 'Sofia', 'Thiago',
    'Ursula', 'Vinícius', 'Wagner', 'Xavier', 'Yasmin', 'Zara', 'André', 'Bianca', 'Caio', 'Débora'
  ];
  
  const sobrenomes = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
    'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Torres', 'Andrade', 'Cardoso', 'Herrera', 'Melo', 'Barbosa'
  ];
  
  const randomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  
  const createdAt = new Date().toISOString();
  const alunoIds: string[] = [];
  
  db.serialize(() => {
    const baseMatricula = Date.now().toString().slice(-8);

    for (let i = 0; i < numAlunos; i++) {
      const nome = `${randomItem(nomes)} ${randomItem(sobrenomes)}`;
      const matricula = `${baseMatricula}${String(i + 1).padStart(3, '0')}`;
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2) + i;
      alunoIds.push(id);
      
      db.run(
        `INSERT INTO alunos (id, nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, nome, matricula, turmaId, `${matricula}@escola.com`, '', '2010-01-01', 'Responsável', createdAt],
        (err) => {
          if (err) {
            console.error('Erro ao inserir aluno de teste:', err.message);
          }
        }
      );
    }
    
    let presencasCriadas = 0;
    let notasCriadas = 0;

    const generateSchoolDays2025 = () => {
      const dates: string[] = [];
      const start = new Date('2025-01-01T00:00:00');
      const end = new Date('2025-12-31T00:00:00');
      const cursor = new Date(start);
      while (cursor <= end) {
        const day = cursor.getDay();
        if (day !== 0 && day !== 6) {
          dates.push(cursor.toISOString().split('T')[0]);
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      return dates;
    };

    const schoolDays2025 = generateSchoolDays2025();
    const fallbackDays: string[] = [];
    if (schoolDays2025.length === 0) {
      const today = new Date();
      for (let d = 1; d <= numDias; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
          fallbackDays.push(date.toISOString().split('T')[0]);
        }
      }
    }

    const daysToUse = schoolDays2025.length > 0 ? schoolDays2025 : fallbackDays;

    daysToUse.forEach((dataStr) => {
      alunoIds.forEach((alunoId) => {
        const presente = Math.random() < 0.88 ? 1 : 0;
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2) + Math.random();
        db.run(
          `INSERT INTO presencas (id, alunoId, turmaId, data, presente, observacao, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, alunoId, turmaId, dataStr, presente, null, createdAt],
          (err) => {
            if (err) {
              console.error('Erro ao inserir presença de teste:', err.message);
            }
          }
        );
        presencasCriadas++;
      });
    });

    const avaliacoesPorBimestre = ['Prova 1', 'Prova 2', 'Trabalho', 'Participação'];
    const bimestreDate = {
      '1': '2025-03-20',
      '2': '2025-06-20',
      '3': '2025-09-20',
      '4': '2025-11-20'
    } as Record<string, string>;

    const randomNota = () => {
      const value = 4.5 + Math.random() * 5.5;
      return Math.round(value * 10) / 10;
    };

    alunoIds.forEach((alunoId) => {
      ['1', '2', '3', '4'].forEach((bimestre) => {
        avaliacoesPorBimestre.forEach((avaliacao) => {
          const id = Date.now().toString(36) + Math.random().toString(36).substr(2) + Math.random();
          db.run(
            `INSERT INTO notas (id, alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, alunoId, turmaId, avaliacao, randomNota(), bimestreDate[bimestre], bimestre, null, createdAt],
            (err) => {
              if (err) {
                console.error('Erro ao inserir nota de teste:', err.message);
              }
            }
          );
          notasCriadas++;
        });
      });
    });

    res.json({ 
      message: `Criados ${numAlunos} alunos, ${presencasCriadas} presenças (ano letivo 2025) e ${notasCriadas} notas!`, 
      alunos: numAlunos,
      presencas: presencasCriadas,
      notas: notasCriadas,
      ano: 2025
    });
  });
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Conexão com o banco de dados SQLite fechada.');
    process.exit(0);
  });
});

app.post('/api/admin/vacuum', (req, res) => {
  db.run('VACUUM', (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: true, message: 'Otimização (VACUUM) concluída com sucesso.' });
  });
});

app.get('/api/admin/backup', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.db`;
  const backupPath = path.resolve(currentDir, '..', backupFileName);

  fs.copyFile(dbPath, backupPath, (err) => {
    if (err) {
      return res.status(500).json({ error: `Falha ao criar backup: ${err.message}` });
    }
    return res.download(backupPath, backupFileName, (downloadErr) => {
      if (downloadErr) {
        console.error('Erro no download de backup:', downloadErr.message);
      }
      fs.unlink(backupPath, () => {});
    });
  });
});
