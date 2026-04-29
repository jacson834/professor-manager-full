# ProfessorManager

Sistema de gestão escolar para controle de presenças, notas, turmas e alunos.

## Tecnologias

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: Express.js + SQLite + TypeScript
- **Database**: SQLite (arquivo local)

##Funcionalidades

- Autenticação com Roles (Admin/Professor)
- Gestão de Professores
- Gestão de Turmas
- Gestão de Alunos
- Controle de Presenças (Diário e Mensal)
- Lançamento de Notas por Bimestre
- Planejamento de Aulas
- Agenda Pessoal
- Análises e Rankings
- Relatórios
- Backup/Restore de Dados

## Configuração

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

1. Clone o repositório
2. Instale as dependências do frontend:
```bash
npm install
```

3. Instale as dependências do backend:
```bash
cd backend
npm install
```

### Executando

1. Inicie o backend:
```bash
cd backend
npm start
```
Servidor rodando em http://localhost:3000

2. Inicie o frontend (outro terminal):
```bash
npm run dev
```
Frontend rodando em http://localhost:8080

## Usuários Padrão

| Login | Senha | Role |
|-------|------|------|
| admin | 12345678 | admin |
| professor1 | 12345678 | professor |

## Estrutura do Banco de Dados

- **professores**: Cadastro de professores
- **turmas**: Turmas associadas a professores
- **alunos**: Alunos asociados a turmas
- **presencas**: Registro de presenças/faltas
- **notas**: Notas por aluno e bimestre
- **planejamentos**: Planejamento de aulas
- **feriados**: Feriados escolares
- **eventos**: Agenda pessoal
- **alertas_alunos**: Alertas de alunos em risco
- **usuarios**: Usuários do sistema

## API Endpoints

- `/api/professores` - CRUD Professores
- `/api/turmas` - CRUD Turmas
- `/api/alunos` - CRUD Alunos
- `/api/presencas` - CRUD Presenças
- `/api/notas` - CRUD Notas
- `/api/planejamentos` - CRUD Planejamentos
- `/api/feriados` - CRUD Feriados
- `/api/eventos` - CRUD Eventos
- `/api/alertas-alunos` - CRUD Alertas
- `/api/usuarios` - CRUD Usuários
- `/api/login` - Autenticação
- `/api/settings` - Configurações

## Licença

MIT