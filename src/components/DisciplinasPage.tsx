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
import { Plus, BookOpen, Clock, Users, Edit, Trash2, GraduationCap } from 'lucide-react';

interface Disciplina {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  cargaHoraria: number;
  serie: string;
  professor: string;
  status: 'ativa' | 'inativa';
  prerequisitos?: string[];
}

const series = ['6º Ano', '7º Ano', '8º Ano', '9º Ano'];
const professores = ['Prof. João Silva', 'Profa. Maria Santos', 'Prof. Carlos Lima', 'Profa. Ana Costa', 'Prof. Roberto Souza'];

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([
    {
      id: '1',
      nome: 'Matemática',
      codigo: 'MAT001',
      descricao: 'Disciplina de matemática fundamental com foco em álgebra e geometria',
      cargaHoraria: 160,
      serie: '7º Ano',
      professor: 'Prof. João Silva',
      status: 'ativa'
    },
    {
      id: '2',
      nome: 'Português',
      codigo: 'POR001',
      descricao: 'Língua portuguesa, literatura e produção textual',
      cargaHoraria: 160,
      serie: '7º Ano',
      professor: 'Profa. Maria Santos',
      status: 'ativa'
    },
    {
      id: '3',
      nome: 'História',
      codigo: 'HIS001',
      descricao: 'História do Brasil e geral, focando no período medieval e moderno',
      cargaHoraria: 120,
      serie: '7º Ano',
      professor: 'Prof. Carlos Lima',
      status: 'ativa'
    },
    {
      id: '4',
      nome: 'Geografia',
      codigo: 'GEO001',
      descricao: 'Geografia física e humana do Brasil e do mundo',
      cargaHoraria: 120,
      serie: '7º Ano',
      professor: 'Profa. Ana Costa',
      status: 'ativa'
    },
    {
      id: '5',
      nome: 'Ciências',
      codigo: 'CIE001',
      descricao: 'Ciências naturais com foco em biologia e física básica',
      cargaHoraria: 120,
      serie: '7º Ano',
      professor: 'Prof. Roberto Souza',
      status: 'ativa'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editandoDisciplina, setEditandoDisciplina] = useState<Disciplina | null>(null);
  const [novaDisciplina, setNovaDisciplina] = useState<Partial<Disciplina>>({
    nome: '',
    codigo: '',
    descricao: '',
    cargaHoraria: 0,
    serie: '',
    professor: '',
    status: 'ativa'
  });

  const [filtroSerie, setFiltroSerie] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [busca, setBusca] = useState('');

  const disciplinasFiltradas = disciplinas.filter(disciplina => {
    const matchBusca = disciplina.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      disciplina.codigo.toLowerCase().includes(busca.toLowerCase()) ||
                      disciplina.professor.toLowerCase().includes(busca.toLowerCase());
    const matchSerie = filtroSerie === 'todas' || disciplina.serie === filtroSerie;
    const matchStatus = filtroStatus === 'todas' || disciplina.status === filtroStatus;
    
    return matchBusca && matchSerie && matchStatus;
  });

  const handleSalvarDisciplina = () => {
    if (!novaDisciplina.nome || !novaDisciplina.codigo || !novaDisciplina.serie || !novaDisciplina.professor) return;

    const disciplina: Disciplina = {
      id: editandoDisciplina?.id || Date.now().toString(),
      nome: novaDisciplina.nome!,
      codigo: novaDisciplina.codigo!,
      descricao: novaDisciplina.descricao || '',
      cargaHoraria: novaDisciplina.cargaHoraria || 0,
      serie: novaDisciplina.serie!,
      professor: novaDisciplina.professor!,
      status: novaDisciplina.status as 'ativa' | 'inativa'
    };

    if (editandoDisciplina) {
      setDisciplinas(disciplinas.map(d => d.id === editandoDisciplina.id ? disciplina : d));
    } else {
      setDisciplinas([...disciplinas, disciplina]);
    }

    setNovaDisciplina({
      nome: '',
      codigo: '',
      descricao: '',
      cargaHoraria: 0,
      serie: '',
      professor: '',
      status: 'ativa'
    });
    setEditandoDisciplina(null);
    setIsDialogOpen(false);
  };

  const handleEditarDisciplina = (disciplina: Disciplina) => {
    setEditandoDisciplina(disciplina);
    setNovaDisciplina(disciplina);
    setIsDialogOpen(true);
  };

  const handleExcluirDisciplina = (id: string) => {
    setDisciplinas(disciplinas.filter(d => d.id !== id));
  };

  const estatisticas = {
    total: disciplinas.length,
    ativas: disciplinas.filter(d => d.status === 'ativa').length,
    inativas: disciplinas.filter(d => d.status === 'inativa').length,
    cargaHorariaTotal: disciplinas.reduce((acc, d) => acc + d.cargaHoraria, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Disciplinas</h1>
          <p className="text-muted-foreground">Cadastro e gestão de matérias</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary hover:bg-primary-hover"
              onClick={() => {
                setEditandoDisciplina(null);
                setNovaDisciplina({
                  nome: '',
                  codigo: '',
                  descricao: '',
                  cargaHoraria: 0,
                  serie: '',
                  professor: '',
                  status: 'ativa'
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editandoDisciplina ? 'Editar Disciplina' : 'Adicionar Disciplina'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={novaDisciplina.nome}
                    onChange={(e) => setNovaDisciplina({...novaDisciplina, nome: e.target.value})}
                    placeholder="Nome da disciplina"
                  />
                </div>
                
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={novaDisciplina.codigo}
                    onChange={(e) => setNovaDisciplina({...novaDisciplina, codigo: e.target.value})}
                    placeholder="Ex: MAT001"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={novaDisciplina.descricao}
                  onChange={(e) => setNovaDisciplina({...novaDisciplina, descricao: e.target.value})}
                  placeholder="Descrição da disciplina"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargaHoraria">Carga Horária</Label>
                  <Input
                    id="cargaHoraria"
                    type="number"
                    value={novaDisciplina.cargaHoraria}
                    onChange={(e) => setNovaDisciplina({...novaDisciplina, cargaHoraria: parseInt(e.target.value) || 0})}
                    placeholder="Horas/ano"
                  />
                </div>
                
                <div>
                  <Label>Série</Label>
                  <Select value={novaDisciplina.serie} onValueChange={(value) => setNovaDisciplina({...novaDisciplina, serie: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {series.map(serie => (
                        <SelectItem key={serie} value={serie}>{serie}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Professor</Label>
                  <Select value={novaDisciplina.professor} onValueChange={(value) => setNovaDisciplina({...novaDisciplina, professor: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {professores.map(professor => (
                        <SelectItem key={professor} value={professor}>{professor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select value={novaDisciplina.status} onValueChange={(value) => setNovaDisciplina({...novaDisciplina, status: value as 'ativa' | 'inativa'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="inativa">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleSalvarDisciplina} className="w-full">
                {editandoDisciplina ? 'Atualizar' : 'Salvar'} Disciplina
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-success">{estatisticas.ativas}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativas</p>
                <p className="text-2xl font-bold text-muted-foreground">{estatisticas.inativas}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Carga Horária</p>
                <p className="text-2xl font-bold">{estatisticas.cargaHorariaTotal}h</p>
              </div>
              <Clock className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, código ou professor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            
            <Select value={filtroSerie} onValueChange={setFiltroSerie}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as séries</SelectItem>
                {series.map(serie => (
                  <SelectItem key={serie} value={serie}>{serie}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="inativa">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Disciplinas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Disciplinas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Carga Horária</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplinasFiltradas.map((disciplina) => (
                <TableRow key={disciplina.id}>
                  <TableCell className="font-mono">{disciplina.codigo}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{disciplina.nome}</div>
                      {disciplina.descricao && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {disciplina.descricao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{disciplina.serie}</Badge>
                  </TableCell>
                  <TableCell>{disciplina.professor}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {disciplina.cargaHoraria}h
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={disciplina.status === 'ativa' ? 'default' : 'secondary'}
                      className={disciplina.status === 'ativa' ? 'bg-success text-success-foreground' : ''}
                    >
                      {disciplina.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditarDisciplina(disciplina)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluirDisciplina(disciplina.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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