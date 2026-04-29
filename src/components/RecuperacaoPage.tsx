import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon, AlertTriangle, CheckCircle, Clock, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProvaRecuperacao {
  id: string;
  disciplina: string;
  professor: string;
  turma: string;
  data: Date;
  horario: string;
  local: string;
  conteudo: string;
  alunosInscritos: string[];
  status: 'agendada' | 'realizada' | 'cancelada';
  notaMinima: number;
  observacoes?: string;
}

interface AlunoRecuperacao {
  id: string;
  nome: string;
  turma: string;
  disciplina: string;
  mediaAtual: number;
  situacao: 'necessaria' | 'inscrito' | 'realizada' | 'aprovado';
  notaRecuperacao?: number;
}

export default function RecuperacaoPage() {
  const [provas, setProvas] = useState<ProvaRecuperacao[]>([
    {
      id: '1',
      disciplina: 'Matemática',
      professor: 'Prof. João Silva',
      turma: '7º Ano A',
      data: new Date(2024, 11, 20),
      horario: '14:00',
      local: 'Sala 101',
      conteudo: 'Álgebra básica, equações do 1º grau, geometria plana',
      alunosInscritos: ['1', '3', '5'],
      status: 'agendada',
      notaMinima: 6.0,
      observacoes: 'Trazer calculadora científica'
    },
    {
      id: '2',
      disciplina: 'Geografia',
      professor: 'Profa. Ana Costa',
      turma: '7º Ano A',
      data: new Date(2024, 11, 22),
      horario: '15:30',
      local: 'Sala 203',
      conteudo: 'Relevo brasileiro, hidrografia, clima',
      alunosInscritos: ['2', '4'],
      status: 'agendada',
      notaMinima: 6.0
    },
    {
      id: '3',
      disciplina: 'Ciências',
      professor: 'Prof. Roberto Souza',
      turma: '8º Ano B',
      data: new Date(2024, 11, 15),
      horario: '13:00',
      local: 'Laboratório',
      conteudo: 'Sistema digestório, sistema respiratório',
      alunosInscritos: ['6', '7'],
      status: 'realizada',
      notaMinima: 6.0
    }
  ]);

  const [alunos] = useState<AlunoRecuperacao[]>([
    {
      id: '1',
      nome: 'Bruno Costa Lima',
      turma: '7º Ano A',
      disciplina: 'Matemática',
      mediaAtual: 5.9,
      situacao: 'inscrito'
    },
    {
      id: '2',
      nome: 'Carla Mendes',
      turma: '7º Ano A',
      disciplina: 'Geografia',
      mediaAtual: 5.8,
      situacao: 'inscrito'
    },
    {
      id: '3',
      nome: 'Diego Santos',
      turma: '7º Ano A',
      disciplina: 'Matemática',
      mediaAtual: 5.2,
      situacao: 'necessaria'
    },
    {
      id: '4',
      nome: 'Elena Rodrigues',
      turma: '7º Ano A',
      disciplina: 'Geografia',
      mediaAtual: 5.5,
      situacao: 'necessaria'
    },
    {
      id: '5',
      nome: 'Fernando Alves',
      turma: '7º Ano A',
      disciplina: 'Matemática',
      mediaAtual: 5.7,
      situacao: 'inscrito'
    },
    {
      id: '6',
      nome: 'Gabriela Lima',
      turma: '8º Ano B',
      disciplina: 'Ciências',
      mediaAtual: 5.3,
      situacao: 'realizada',
      notaRecuperacao: 7.5
    },
    {
      id: '7',
      nome: 'Hugo Martins',
      turma: '8º Ano B',
      disciplina: 'Ciências',
      mediaAtual: 5.8,
      situacao: 'realizada',
      notaRecuperacao: 6.2
    }
  ]);

  const [disciplinas] = useState(['Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Inglês']);
  const [professores] = useState(['Prof. João Silva', 'Profa. Maria Santos', 'Prof. Carlos Lima', 'Profa. Ana Costa', 'Prof. Roberto Souza']);
  const [turmas] = useState(['7º Ano A', '7º Ano B', '8º Ano A', '8º Ano B']);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novaProva, setNovaProva] = useState<Partial<ProvaRecuperacao>>({
    disciplina: '',
    professor: '',
    turma: '',
    data: undefined,
    horario: '',
    local: '',
    conteudo: '',
    alunosInscritos: [],
    status: 'agendada',
    notaMinima: 6.0
  });

  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [filtroTurma, setFiltroTurma] = useState<string>('todas');

  const provasFiltradas = provas.filter(prova => {
    const matchStatus = filtroStatus === 'todas' || prova.status === filtroStatus;
    const matchTurma = filtroTurma === 'todas' || prova.turma === filtroTurma;
    return matchStatus && matchTurma;
  });

  const getStatusColor = (status: ProvaRecuperacao['status']) => {
    switch (status) {
      case 'agendada':
        return 'bg-blue-500 text-white';
      case 'realizada':
        return 'bg-success text-success-foreground';
      case 'cancelada':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: ProvaRecuperacao['status']) => {
    switch (status) {
      case 'agendada':
        return 'Agendada';
      case 'realizada':
        return 'Realizada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Pendente';
    }
  };

  const getSituacaoColor = (situacao: AlunoRecuperacao['situacao']) => {
    switch (situacao) {
      case 'necessaria':
        return 'bg-warning text-warning-foreground';
      case 'inscrito':
        return 'bg-blue-500 text-white';
      case 'realizada':
        return 'bg-accent text-accent-foreground';
      case 'aprovado':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSituacaoText = (situacao: AlunoRecuperacao['situacao']) => {
    switch (situacao) {
      case 'necessaria':
        return 'Necessária';
      case 'inscrito':
        return 'Inscrito';
      case 'realizada':
        return 'Realizada';
      case 'aprovado':
        return 'Aprovado';
      default:
        return 'Pendente';
    }
  };

  const handleSalvarProva = () => {
    if (!novaProva.disciplina || !novaProva.professor || !novaProva.turma || !novaProva.data) return;

    const prova: ProvaRecuperacao = {
      id: Date.now().toString(),
      disciplina: novaProva.disciplina!,
      professor: novaProva.professor!,
      turma: novaProva.turma!,
      data: novaProva.data!,
      horario: novaProva.horario || '14:00',
      local: novaProva.local || '',
      conteudo: novaProva.conteudo || '',
      alunosInscritos: novaProva.alunosInscritos || [],
      status: 'agendada',
      notaMinima: novaProva.notaMinima || 6.0,
      observacoes: novaProva.observacoes
    };

    setProvas([...provas, prova]);
    setNovaProva({
      disciplina: '',
      professor: '',
      turma: '',
      data: undefined,
      horario: '',
      local: '',
      conteudo: '',
      alunosInscritos: [],
      status: 'agendada',
      notaMinima: 6.0
    });
    setIsDialogOpen(false);
  };

  const estatisticas = {
    totalProvas: provas.length,
    provasAgendadas: provas.filter(p => p.status === 'agendada').length,
    provasRealizadas: provas.filter(p => p.status === 'realizada').length,
    alunosRecuperacao: alunos.filter(a => a.situacao === 'necessaria' || a.situacao === 'inscrito').length,
    alunosAprovados: alunos.filter(a => a.situacao === 'aprovado' || (a.situacao === 'realizada' && a.notaRecuperacao && a.notaRecuperacao >= 6.0)).length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recuperação</h1>
          <p className="text-muted-foreground">Gestão de provas de recuperação</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Nova Prova
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agendar Prova de Recuperação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Disciplina</Label>
                  <Select value={novaProva.disciplina} onValueChange={(value) => setNovaProva({...novaProva, disciplina: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinas.map(disciplina => (
                        <SelectItem key={disciplina} value={disciplina}>{disciplina}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Turma</Label>
                  <Select value={novaProva.turma} onValueChange={(value) => setNovaProva({...novaProva, turma: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map(turma => (
                        <SelectItem key={turma} value={turma}>{turma}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Professor</Label>
                <Select value={novaProva.professor} onValueChange={(value) => setNovaProva({...novaProva, professor: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map(professor => (
                      <SelectItem key={professor} value={professor}>{professor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !novaProva.data && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {novaProva.data ? format(novaProva.data, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={novaProva.data}
                        onSelect={(date) => setNovaProva({...novaProva, data: date})}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="horario">Horário</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={novaProva.horario}
                    onChange={(e) => setNovaProva({...novaProva, horario: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="local">Local</Label>
                <Input
                  id="local"
                  value={novaProva.local}
                  onChange={(e) => setNovaProva({...novaProva, local: e.target.value})}
                  placeholder="Sala ou laboratório"
                />
              </div>
              
              <div>
                <Label htmlFor="conteudo">Conteúdo</Label>
                <Textarea
                  id="conteudo"
                  value={novaProva.conteudo}
                  onChange={(e) => setNovaProva({...novaProva, conteudo: e.target.value})}
                  placeholder="Tópicos que serão cobrados na prova"
                />
              </div>
              
              <div>
                <Label htmlFor="notaMinima">Nota Mínima</Label>
                <Input
                  id="notaMinima"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={novaProva.notaMinima}
                  onChange={(e) => setNovaProva({...novaProva, notaMinima: parseFloat(e.target.value) || 6.0})}
                />
              </div>
              
              <Button onClick={handleSalvarProva} className="w-full">
                Agendar Prova
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Provas</p>
                <p className="text-2xl font-bold">{estatisticas.totalProvas}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendadas</p>
                <p className="text-2xl font-bold text-blue-500">{estatisticas.provasAgendadas}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Realizadas</p>
                <p className="text-2xl font-bold text-success">{estatisticas.provasRealizadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Recuperação</p>
                <p className="text-2xl font-bold text-warning">{estatisticas.alunosRecuperacao}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-success">{estatisticas.alunosAprovados}</p>
              </div>
              <Users className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os status</SelectItem>
            <SelectItem value="agendada">Agendadas</SelectItem>
            <SelectItem value="realizada">Realizadas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filtroTurma} onValueChange={setFiltroTurma}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as turmas</SelectItem>
            {turmas.map(turma => (
              <SelectItem key={turma} value={turma}>{turma}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provas de Recuperação */}
      <Card>
        <CardHeader>
          <CardTitle>Provas de Recuperação</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Data/Horário</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Inscritos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {provasFiltradas.map((prova) => (
                <TableRow key={prova.id}>
                  <TableCell className="font-medium">{prova.disciplina}</TableCell>
                  <TableCell>{prova.turma}</TableCell>
                  <TableCell>{prova.professor}</TableCell>
                  <TableCell>
                    <div>
                      <div>{format(prova.data, "dd/MM/yyyy", { locale: ptBR })}</div>
                      <div className="text-sm text-muted-foreground">{prova.horario}</div>
                    </div>
                  </TableCell>
                  <TableCell>{prova.local}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {prova.alunosInscritos.length} alunos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(prova.status)}>
                      {getStatusText(prova.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Situação dos Alunos */}
      <Card>
        <CardHeader>
          <CardTitle>Situação dos Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Média Atual</TableHead>
                <TableHead>Nota Recuperação</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">{aluno.nome}</TableCell>
                  <TableCell>{aluno.turma}</TableCell>
                  <TableCell>{aluno.disciplina}</TableCell>
                  <TableCell>
                    <span className={aluno.mediaAtual < 6.0 ? 'text-destructive font-semibold' : ''}>
                      {aluno.mediaAtual.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {aluno.notaRecuperacao ? (
                      <span className={aluno.notaRecuperacao >= 6.0 ? 'text-success font-semibold' : 'text-warning font-semibold'}>
                        {aluno.notaRecuperacao.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getSituacaoColor(aluno.situacao)}>
                      {getSituacaoText(aluno.situacao)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}