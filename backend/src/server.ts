// backend/src/server.ts
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';

const currentDir = __dirname;
const settingsFilePath = path.resolve(currentDir, '..', 'settings.json');
const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
        createdAt TEXT NOT NULL,
        FOREIGN KEY (turmaId) REFERENCES turmas(id) ON DELETE CASCADE
      )`);

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
        createdAt TEXT NOT NULL
      )`);

      // Inserir Administrador padrão se não existir
      db.get(`SELECT id FROM usuarios WHERE username = 'admin'`, [], (err, row) => {
        if (!row) {
          const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
          const createdAt = new Date().toISOString();
          db.run(
            `INSERT INTO usuarios (id, username, password, nome, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, 'admin', '12345678', 'Administrador Global', 'admin', createdAt]
          );
        }
      });

      // Inserir Professor-1 padrão se não existir
      db.get(`SELECT id FROM usuarios WHERE username = 'professor1'`, [], (err, row) => {
        if (!row) {
          const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
          const createdAt = new Date().toISOString();
          db.run(
            `INSERT INTO usuarios (id, username, password, nome, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, 'professor1', '12345678', 'Professor Um', 'professor', createdAt]
          );
        }
      });

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
          });
        });
      };

seedData();

      console.log('Tabelas verificadas/creadas com sucesso.');
    });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor Backend ProfessorManager funcionando!');
});

// --- Rotas de Autenticação e Usuários ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  db.get(`SELECT * FROM usuarios WHERE username = ? AND password = ?`, [username, password], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }
    res.json({ 
      user: { 
        id: row.id, 
        username: row.username, 
        nome: row.nome, 
        role: row.role 
      } 
    });
  });
});

app.get('/api/usuarios', (req, res) => {
  db.all('SELECT id, username, nome, role FROM usuarios', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ usuarios: rows });
  });
});

app.post('/api/usuarios', (req, res) => {
  const { username, password, nome, role } = req.body;
  if (!username || !password || !nome || !role) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  db.run(
    `INSERT INTO usuarios (id, username, password, nome, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [Date.now().toString(36) + Math.random().toString(36).substr(2), username, password, nome, role, new Date().toISOString()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ success: true });
    }
  );
});

app.delete('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM usuarios WHERE id = ?`, id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(204).send();
  });
});

// --- Rotas para Professores ---
app.get('/api/professores', (req, res) => {
  db.all('SELECT * FROM professores', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ professores: rows });
  });
});

app.post('/api/professores', (req, res) => {
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

app.put('/api/professores/:id', (req, res) => {
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

app.delete('/api/professores/:id', (req, res) => {
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
app.get('/api/turmas', (req, res) => {
  db.all('SELECT * FROM turmas', [], (err, rows: any[]) => {
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

app.post('/api/turmas', (req, res) => {
  let { nome, professorId, ano, semestre, observacao, minPassingGrade } = req.body;

  if (!nome || !professorId || !ano) {
    return res.status(400).json({ error: 'Nome, Professor ID e Ano são obrigatórios.' });
  }

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
});

app.put('/api/turmas/:id', (req, res) => {
  const { id } = req.params;
  let { nome, professorId, ano, semestre, observacao, minPassingGrade } = req.body;

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
app.get('/api/alunos', (req, res) => {
  db.all('SELECT * FROM alunos', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ alunos: rows });
  });
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
  const { nome, matricula, turmaId, email, telefone, dataNascimento, responsavel } = req.body;
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
      `INSERT INTO alunos (id, nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nome, matricula, turmaId, email || null, telefone || null, dataNascimento || null, responsavel || null, createdAt],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json({ id, nome, matricula, turmaId, email, telefone, dataNascimento, responsavel, createdAt });
      }
    );
  });
});

app.put('/api/alunos/:id', (req, res) => {
  const { id } = req.params;
  const { nome, matricula, turmaId, email, telefone, dataNascimento, responsavel } = req.body;

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
      `UPDATE alunos SET nome = ?, matricula = ?, turmaId = ?, email = ?, telefone = ?, dataNascimento = ?, responsavel = ? WHERE id = ?`,
      [nome, matricula, turmaId, email || null, telefone || null, dataNascimento || null, responsavel || null, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Aluno não encontrado.' });
          return;
        }
        res.json({ id, nome, matricula, turmaId, email, telefone, dataNascimento, responsavel });
      }
    );
  });
});

app.delete('/api/alunos/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM alunos WHERE id = ?`, id, function (err) {
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

// --- Rotas para Presencas ---
app.get('/api/presencas', (req, res) => {
  db.all('SELECT * FROM presencas', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ presencas: rows });
  });
});

app.get('/api/presencas/aluno/:alunoId', (req, res) => {
  const { alunoId } = req.params;
  db.all('SELECT * FROM presencas WHERE alunoId = ?', [alunoId], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ presencas: rows });
  });
});

app.get('/api/presencas/turma/:turmaId', (req, res) => {
  const { turmaId } = req.params;
  db.all('SELECT * FROM presencas WHERE turmaId = ?', [turmaId], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ presencas: rows });
  });
});

app.post('/api/presencas', (req, res) => {
  const { alunoId, turmaId, data, presente, observacao } = req.body;
  if (!alunoId || !turmaId || !data || typeof presente !== 'boolean') {
    return res.status(400).json({ error: 'Aluno ID, Turma ID, Data e Presente são obrigatórios.' });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const createdAt = new Date().toISOString();
  const presenteInt = presente ? 1 : 0; // SQLite armazena booleanos como 0 ou 1

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
});

app.put('/api/presencas/:id', (req, res) => {
  const { id } = req.params;
  const { alunoId, turmaId, data, presente, observacao } = req.body;

  if (!alunoId || !turmaId || !data || typeof presente !== 'boolean') {
    return res.status(400).json({ error: 'Aluno ID, Turma ID, Data e Presente são obrigatórios.' });
  }
  const presenteInt = presente ? 1 : 0;

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

app.delete('/api/presencas/:id', (req, res) => {
  const { id } = req.params;
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

// --- Rotas para Notas - Ajuste para bimestre
app.get('/api/notas', (req, res) => {
  db.all('SELECT * FROM notas', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ notas: rows });
  });
});

app.get('/api/notas/aluno/:alunoId', (req, res) => {
  const { alunoId } = req.params;
  db.all('SELECT * FROM notas WHERE alunoId = ?', [alunoId], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ notas: rows });
  });
});

app.get('/api/notas/turma/:turmaId', (req, res) => {
  const { turmaId } = req.params;
  db.all('SELECT * FROM notas WHERE turmaId = ?', [turmaId], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ notas: rows });
  });
});

app.post('/api/notas', (req, res) => {
  const { alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao } = req.body;
  if (!alunoId || !turmaId || !avaliacao || nota === undefined || !dataAvaliacao || !bimestre) {
    return res.status(400).json({ error: 'Aluno ID, Turma ID, Avaliação, Nota, Data de Avaliação e Bimestre são obrigatórios.' });
  }
  if (!['1', '2', '3', '4'].includes(bimestre)) {
    return res.status(400).json({ error: 'Bimestre deve ser 1, 2, 3 ou 4.' });
  }

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
});

app.put('/api/notas/:id', (req, res) => {
  const { id } = req.params;
  const { alunoId, turmaId, avaliacao, nota, dataAvaliacao, bimestre, observacao } = req.body;

  if (!alunoId || !turmaId || !avaliacao || nota === undefined || !dataAvaliacao || !bimestre) {
    return res.status(400).json({ error: 'Aluno ID, Turma ID, Avaliação, Nota, Data de Avaliação e Bimestre são obrigatórios.' });
  }
  if (!['1', '2', '3', '4'].includes(bimestre)) {
    return res.status(400).json({ error: 'Bimestre deve ser 1, 2, 3 ou 4.' });
  }

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

app.delete('/api/notas/:id', (req, res) => {
  const { id } = req.params;
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
      'presencas', 'notas', 'planejamentos', 'eventos', 'feriados', 'alertas_alunos', 'alunos', 'turmas', 'professores'
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
                res.json({ success: true, message: 'Todos os dados foram limpos com sucesso!' });
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

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Conexão com o banco de dados SQLite fechada.');
    process.exit(0);
  });
});