import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  alunosApi,
  turmasApi,
  notasApi,
  presencasApi,
  Aluno, Turma
} from '@/lib/database';
import { Plus, Edit, Trash2, Mail, Phone, User, Calendar, LayoutGrid, List, Table as TableIcon, Search, ArrowDownAZ, ArrowUpAZ, Hash, Users as UsersIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';


// Definir tipos para os modos de visualização
type ViewMode = 'card' | 'detailed-list';

// Definir tipos para ordenação
type SortCriteria = 'nome' | 'matricula';
type SortDirection = 'asc' | 'desc';

// Definir tipos para busca
type SearchCriteria = 'nome' | 'matricula' | 'turma';


export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [selectedTurma, setSelectedTurma] = useState<string>('todas');
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    turmaId: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    responsavel: ''
  });
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchBy, setSearchBy] = useState<SearchCriteria>('nome');


  useEffect(() => {
    loadAlunos();
    loadTurmas();
  }, []);

  useEffect(() => {
    loadAlunos();
  }, [selectedTurma]);

  const loadAlunos = async () => { // Tornar a função assíncrona
    try {
      const allAlunosData = await alunosApi.getAlunos(); // API Assíncrona
      const filtered = selectedTurma === 'todas'
        ? allAlunosData
        : allAlunosData.filter(aluno => aluno.turmaId === selectedTurma);
      setAlunos(filtered);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar alunos do servidor.",
        variant: "destructive"
      });
    }
  };

  const loadTurmas = async () => { // Tornar a função assíncrona
    try {
      const data = await turmasApi.getTurmas(); // API Assíncrona
      setTurmas(data);
    } catch (error) {
      console.error("Erro ao carregar turmas para seleção:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar turmas para seleção.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => { // Tornar a função assíncrona
    e.preventDefault();
    
    if (!formData.nome || !formData.matricula || !formData.turmaId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const alunosExistentes = await alunosApi.getAlunos(); // API Assíncrona
      const matriculaExists = alunosExistentes.some(a =>
        a.matricula === formData.matricula && a.id !== editingAluno?.id
      );

      if (matriculaExists) {
        toast({
          title: "Erro",
          description: "Já existe um aluno com esta matrícula.",
          variant: "destructive"
        });
        return;
      }

      if (editingAluno) {
        await alunosApi.updateAluno(editingAluno.id, formData); // API Assíncrona
        toast({
          title: "Sucesso",
          description: "Aluno atualizado com sucesso!"
        });
      } else {
        await alunosApi.addAluno(formData); // API Assíncrona
        toast({
          title: "Sucesso",
          description: "Aluno cadastrado com sucesso!"
        });
      }

      await loadAlunos(); // Recarregar dados após a operação
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) { // Capturar erro para exibir no console e no toast
      console.error("Erro ao salvar aluno:", error);
      let errorMessage = "Erro ao salvar aluno.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome,
      matricula: aluno.matricula,
      turmaId: aluno.turmaId,
      email: aluno.email || '', // Garantir que campos opcionais não sejam null/undefined
      telefone: aluno.telefone || '',
      dataNascimento: aluno.dataNascimento || '',
      responsavel: aluno.responsavel || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => { // Tornar a função assíncrona
    if (window.confirm('Tem certeza que deseja excluir este aluno? Todas as notas e presenças serão perdidas.')) {
      try {
        // Remover notas e presenças do aluno
        const notas = await notasApi.getNotasByAluno(id); // API Assíncrona
        const presencas = await presencasApi.getPresencasByAluno(id); // API Assíncrona
        
        // Deletar uma por uma, ou ter um endpoint no backend para deletar em massa por alunoId
        for (const nota of notas) {
            await notasApi.deleteNota(nota.id); // API Assíncrona
        }
        for (const presenca of presencas) {
            await presencasApi.deletePresenca(presenca.id); // API Assíncrona
        }
        
        await alunosApi.deleteAluno(id); // API Assíncrona
        await loadAlunos(); // Recarregar dados após a operação
        toast({
          title: "Sucesso",
          description: "Aluno excluído com sucesso!"
        });
      } catch (error: any) {
        console.error("Erro ao deletar aluno:", error);
        let errorMessage = "Erro ao deletar aluno.";
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({ 
      nome: '', 
      matricula: '', 
      turmaId: '', 
      email: '', 
      telefone: '', 
      dataNascimento: '', 
      responsavel: '' 
    });
    setEditingAluno(null);
  };

  const getTurmaNome = (turmaId: string) => {
    const turma = turmas.find(t => t.id === turmaId);
    return turma ? `${turma.nome} - ${turma.ano}` : 'Turma não encontrada';
  };

  const filteredAndSortedAlunos = useMemo(() => {
    let currentAlunos = selectedTurma === 'todas'
      ? [...alunos]
      : alunos.filter(aluno => aluno.turmaId === selectedTurma);

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentAlunos = currentAlunos.filter(aluno => {
        if (searchBy === 'nome') {
          return aluno.nome.toLowerCase().includes(lowerCaseSearchTerm);
        }
        if (searchBy === 'matricula') {
          return aluno.matricula.toLowerCase().includes(lowerCaseSearchTerm);
        }
        if (searchBy === 'turma') {
          const turmaNome = getTurmaNome(aluno.turmaId).toLowerCase();
          return turmaNome.includes(lowerCaseSearchTerm);
        }
        return false;
      });
    }

    currentAlunos.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortCriteria === 'nome') {
        valA = a.nome.toLowerCase();
        valB = b.nome.toLowerCase();
      } else {
        valA = a.matricula.toLowerCase();
        valB = b.matricula.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return currentAlunos;
  }, [alunos, selectedTurma, searchTerm, searchBy, sortCriteria, sortDirection, turmas]);


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de alunos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary-hover">
              <Plus size={16} className="mr-2" />
              Novo Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="matricula">Matrícula *</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) => setFormData({...formData, matricula: e.target.value})}
                    placeholder="Número da matrícula"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="turma">Turma *</Label>
                <Select 
                  value={formData.turmaId} 
                  onValueChange={(value) => setFormData({...formData, turmaId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} - {turma.ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover">
                  {editingAluno ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro por turma */}
      <Card className="shadow-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="filtroTurma">Filtrar por turma:</Label>
            <Select value={selectedTurma} onValueChange={setSelectedTurma}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedAlunos.length === 0 ? (
          <Card className="col-span-full shadow-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {selectedTurma !== 'todas' ? 'Nenhum aluno nesta turma' : 'Nenhum aluno cadastrado'}
              </h3>
              <p className="text-muted-foreground text-center">
                {selectedTurma !== 'todas'
                  ? 'Selecione outra turma ou cadastre novos alunos.' 
                  : 'Clique em "Novo Aluno" para começar a cadastrar alunos.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedAlunos.map((aluno) => (
            <Card key={aluno.id} className="shadow-card border-border hover:shadow-elegant transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg text-foreground truncate">{aluno.nome}</CardTitle>
                    <div className="flex space-x-2 mt-2 flex-wrap">
                      <Badge variant="outline">
                        {aluno.matricula}
                      </Badge>
                      <Badge variant="secondary">
                        {getTurmaNome(aluno.turmaId)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(aluno)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(aluno.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {aluno.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail size={14} className="mr-2" />
                    <span>{aluno.email}</span>
                  </div>
                )}
                {aluno.telefone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone size={14} className="mr-2" />
                    <span>{aluno.telefone}</span>
                  </div>
                )}
                {aluno.dataNascimento && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar size={14} className="mr-2" />
                    <span>{new Date(aluno.dataNascimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                {aluno.responsavel && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User size={14} className="mr-2" />
                    <span>Resp: {aluno.responsavel}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-3">
                  Cadastrado em {new Date(aluno.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}