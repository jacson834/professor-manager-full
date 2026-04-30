# ProfessorManager

Sistema de gestão escolar para controle de presenças, notas, turmas e alunos.

## Tecnologias

- **Frontend**: React + Vite + TypeScript + TailwindCSS + Shadcn UI
- **Backend**: Express.js + SQLite + TypeScript
- **Database**: SQLite (arquivo local)
- **PDF**: jsPDF + jspdf-autotable

## Funcionalidades

### Autenticação e Usuários
- Login com usuário/senha
- Dois níveis de acesso: Admin e Professor
- Controle de professores por usuário (cada professor vê apenas suas turmas)

### Gestão de Professores
- Cadastro de professores com nome, email, matéria e telefone

### Gestão de Turmas
- Criação e edição de turmas
- Vinculação de professores às turmas
-turmas

### Gestão de Alunos
- Cadastro de alunos com nome, matrícula, dados pessoais
- Alunos organizados por turma
- Geração automática de dados de teste (nomes aleatórios + presenças)

### Controle de Presenças
- **Modo Diário**: Registro de presença/falta individual
- **Modo Mensal**: Visualização em tabela com todos os dias do mês
- Botões P (Presente) / F (Falta) com cores distintas
- Exportação de relatório mensal para PDF (paisagem)
- Bordinhas de separação entre dias na visualização mensal

### Lançamento de Notas
- Notas por avaliação e bimestre
- Cálculo automático de médias

### Planejamento de Aulas
- Planejamento por turma e data
- Calendário visualizar
- Sincronização automática de feriados nacionais do Brasil (API Calendarific)
- Tradução automática dos nomes dos feriados para português

### Agenda Pessoal
- Eventos com título, descrição, data, horário e tipo
- Tipos: pessoal, trabalho, reunião, lembrete

### Análises e Rankings
- Ranking de alunos por turma (média de notas + presença)
- Ranking de turmas
- Alertas de alunos em risco (baixa nota ou falta)

### Relatórios
- **Relatório Individual**: Dados completos do aluno (notas, presença, médias)
- **Relatório de Turma**: Lista de todos os alunos com estatísticas
- Exportação PDF em orientação paisagem

### Recursos Administrativos
- Backup/Restore de dados (JSON)
- Limpeza total de dados
- Migração de usuários para vincular a professores
- Geração de dados de teste (alunos + presenças aleatórias)
- Configurações do sistema

## Configuração

### Pré-requisitos
- Node.js 18+
- npm

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

### Criando o Primeiro Acesso

1. Acesse http://localhost:8080
2. Faça login com: `admin` / `12345678`
3. Crie um professor na página Professores
4. Crie um usuário professor com username igual ao nome do professor
5. O sistema automaticamente vinculará usuário ao professor

## Estrutura do Banco de Dados

- **professores**: Cadastro de professores
- **turmas**: Turmas associadas a professores
- **alunos**: Alunos associados a turmas
- **presencas**: Registro de presenças/faltas por data
- **notas**: Notas por aluno, avaliação e bimestre
- **planejamentos**: Planejamento de aulas por turma
- **feriados**: Feriados escolares (nacionais + locais)
- **eventos**: Agenda pessoal
- **alertas_alunos**: Alertas de alunos em risco
- **usuarios**: Usuários do sistema (admin/professor)

## API Endpoints

- `/api/professores` - CRUD Professores
- `/api/turmas` - CRUD Turmas (suporta filtro por professorId)
- `/api/alunos` - CRUD Alunos (suporta filtro por professorId)
- `/api/presencas` - CRUD Presenças
- `/api/notas` - CRUD Notas
- `/api/planejamentos` - CRUD Planejamentos
- `/api/feriados` - CRUD Feriados + sincronização nacional
- `/api/eventos` - CRUD Eventos
- `/api/alertas-alunos` - CRUD Alertas
- `/api/usuarios` - CRUD Usuários
- `/api/login` - Autenticação
- `/api/settings` - Configurações
- `/api/admin/clear-all-data` - Limpar todos os dados
- `/api/admin/migrate-professor-usuario` - Vincular usuários a professores
- `/api/admin/generate-test-data` - Gerar dados de teste
- `/api/admin/import-data` - Importar backup

## Configuração de Rede

O sistema pode ser configurado para acesso em rede local:

1. Backend: define o IP da máquina na rede (ex: 10.83.0.40:3000)
2. Frontend: proxy no Vite redireciona requisições /api para o backend

## Licença

MIT