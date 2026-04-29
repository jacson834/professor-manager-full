import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  professoresApi,
  turmasApi,
  alunosApi,
  Turma, Professor
} from '@/lib/database';
import { Plus, Edit, Trash2, Users, GraduationCap, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    professorId: '',
    ano: '',
    observacao: '',
    minPassingGrade: 6.0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTurmas();
    loadProfessores();
  }, []);

  const loadTurmas = async () => {
    try {
      const data = await turmasApi.getTurmas();
      setTurmas(data);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar turmas do servidor.",
        variant: "destructive"
      });
    }
  };

  const loadProfessores = async () => {
    try {
      const data = await professoresApi.getProfessores();
      setProfessores(data);
    } catch (error) {
      console.error("Erro ao carregar professores para seleção:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar professores para seleção.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.professorId || !formData.ano) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const finalMinPassingGrade = parseFloat(String(formData.minPassingGrade));
    if (isNaN(finalMinPassingGrade) || finalMinPassingGrade < 0 || finalMinPassingGrade > 10) {
      toast({
        title: "Erro",
        description: "A média mínima para aprovação deve ser um número entre 0 e 10.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingTurma) {
        await turmasApi.updateTurma(editingTurma.id, { ...formData, minPassingGrade: finalMinPassingGrade });
        toast({
          title: "Sucesso",
          description: "Turma atualizada com sucesso!"
        });
      } else {
        await turmasApi.addTurma({ ...formData, minPassingGrade: finalMinPassingGrade });
        toast({
          title: "Sucesso",
          description: "Turma cadastrada com sucesso!"
        });
      }
      
      await loadTurmas();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao salvar turma:", error);
      let errorMessage = "Erro ao salvar turma.";
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

  const handleEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setFormData({
      nome: turma.nome,
      professorId: turma.professorId,
      ano: turma.ano,
      observacao: turma.observacao || '',
      minPassingGrade: turma.minPassingGrade !== undefined && turma.minPassingGrade !== null ? turma.minPassingGrade : 6.0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const alunosDaTurma = await alunosApi.getAlunosByTurma(id);
      
      if (alunosDaTurma.length > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir uma turma com alunos cadastrados.",
          variant: "destructive"
        });
        return;
      }

      if (window.confirm('Tem certeza que deseja excluir esta turma?')) {
        await turmasApi.deleteTurma(id);
        await loadTurmas();
        toast({
          title: "Sucesso",
          description: "Turma excluída com sucesso!"
        });
      }
    } catch (error: any) {
      console.error("Erro ao deletar turma:", error);
      let errorMessage = "Erro ao deletar turma.";
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

  const resetForm = () => {
    setFormData({ nome: '', professorId: '', ano: '', observacao: '', minPassingGrade: 6.0 });
    setEditingTurma(null);
  };

  const getProfessorNome = (professorId: string) => {
    const professor = professores.find(p => p.id === professorId);
    return professor ? professor.nome : 'Professor não encontrado';
  };

  const getAlunosCount = async (turmaId: string) => {
    try {
        const alunosDaTurma = await alunosApi.getAlunosByTurma(turmaId);
        return alunosDaTurma.length;
    } catch (error) {
        console.error("Erro ao obter contagem de alunos para a turma:", turmaId, error);
        return 0;
    }
  };

  const [alunosCountMap, setAlunosCountMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      for (const turma of turmas) {
        counts[turma.id] = await getAlunosCount(turma.id);
      }
      setAlunosCountMap(counts);
    };
    if (turmas.length > 0) {
      fetchCounts();
    }
  }, [turmas]);


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Turmas</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de turmas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary-hover">
              <Plus size={16} className="mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTurma ? 'Editar Turma' : 'Nova Turma'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Turma *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: 9º A, Turma Matutino..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="professor">Professor *</Label>
                <Select 
                  value={formData.professorId} 
                  onValueChange={(value) => setFormData({...formData, professorId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map((professor) => (
                      <SelectItem key={professor.id} value={professor.id}>
                        {professor.nome} - {professor.materia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ano">Ano *</Label>
                <Input
                  id="ano"
                  value={formData.ano}
                  onChange={(e) => setFormData({...formData, ano: e.target.value})}
                  placeholder="Ex: 2024, 2025..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="minPassingGrade">Média Mínima Aprovação (0-10)</Label>
                <Input
                  id="minPassingGrade"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.minPassingGrade}
                  onChange={(e) => setFormData({...formData, minPassingGrade: parseFloat(e.target.value)})}
                  placeholder="Ex: 6.0"
                />
              </div>
              <div>
                <Label htmlFor="observacao">Observação</Label>
                <Input
                  id="observacao"
                  value={formData.observacao}
                  onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                  placeholder="Informações adicionais sobre a turma..."
                />
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
                  {editingTurma ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de turmas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {turmas.length === 0 ? (
          <Card className="col-span-full shadow-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma turma cadastrada
              </h3>
              <p className="text-muted-foreground text-center">
                Clique em "Nova Turma" para começar a cadastrar turmas.
              </p>
            </CardContent>
          </Card>
        ) : (
          turmas.map((turma) => (
            <Card key={turma.id} className="shadow-card border-border hover:shadow-elegant transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">{turma.nome}</CardTitle>
                    <div className="flex space-x-2 mt-2">
                      <Badge variant="outline">
                        {turma.ano}
                      </Badge>
                      <Badge variant="secondary">
                        Média Min: {turma.minPassingGrade?.toFixed(1) || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(turma)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(turma.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <GraduationCap size={14} className="mr-2" />
                  <span>{getProfessorNome(turma.professorId)}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users size={14} className="mr-2" />
                  <span>{alunosCountMap[turma.id] !== undefined ? `${alunosCountMap[turma.id]} alunos` : 'Carregando...'}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                  Criada em {new Date(turma.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full"
                        onClick={() => navigate(`/turmas/${turma.id}/overview`)}>
                        <Eye size={16} className="mr-2" /> Visão Geral
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}