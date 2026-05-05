import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/alert-dialog';
import {
  professoresApi,
  turmasApi,
  Professor
} from '@/lib/database';
import { Plus, Edit, Trash2, Mail, Phone, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [professorToDelete, setProfessorToDelete] = useState<Professor | null>(null);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    materia: '',
    telefone: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProfessores();
  }, []);

  const loadProfessores = async () => {
    try {
      const data = await professoresApi.getProfessores();
      setProfessores(data);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar professores do servidor.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.materia) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const todosProfessores = await professoresApi.getProfessores();
      const emailExists = todosProfessores.some(p => 
        p.email === formData.email && p.id !== editingProfessor?.id
      );
      
      if (emailExists) {
        toast({
          title: "Erro",
          description: "Já existe um professor com este email.",
          variant: "destructive"
        });
        return;
      }

      if (editingProfessor) {
        await professoresApi.updateProfessor(editingProfessor.id, formData);
        toast({
          title: "Sucesso",
          description: "Professor atualizado com sucesso!"
        });
      } else {
        await professoresApi.addProfessor(formData);
        toast({
          title: "Sucesso",
          description: "Professor cadastrado com sucesso!"
        });
      }
      
      await loadProfessores();
      closeDialog();
    } catch (error: any) {
      console.error("Erro ao salvar professor:", error);
      let errorMessage = "Erro ao salvar professor.";
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

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormData({
      nome: professor.nome,
      email: professor.email,
      materia: professor.materia,
      telefone: professor.telefone || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const turmasAssociadas = await turmasApi.getTurmas();
      const hasAssociatedTurmas = turmasAssociadas.some(t => t.professorId === id);
      
      if (hasAssociatedTurmas) {
        toast({
          title: "Erro",
          description: "Não é possível excluir o professor: Existem turmas associadas a ele.",
          variant: "destructive"
        });
        return;
      }

      await professoresApi.deleteProfessor(id);
      await loadProfessores();
      toast({
        title: "Sucesso",
        description: "Professor excluído com sucesso!"
      });
    } catch (error: any) {
      console.error("Erro ao deletar professor:", error);
      let errorMessage = "Erro ao deletar professor.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProfessorToDelete(null);
    }
  };

  const openDeleteDialog = (professor: Professor) => {
    setProfessorToDelete(professor);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ nome: '', email: '', materia: '', telefone: '' });
    setEditingProfessor(null);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Professores</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de professores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setIsDialogOpen(false);
              resetForm();
            }
          }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-primary hover:bg-primary-hover">
              <Plus size={16} className="mr-2" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProfessor ? 'Editar Professor' : 'Novo Professor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="materia">Matéria *</Label>
                <Input
                  id="materia"
                  value={formData.materia}
                  onChange={(e) => setFormData({...formData, materia: e.target.value})}
                  placeholder="Matéria que leciona"
                  required
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
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary-hover">
                  {editingProfessor ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de professores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professores.length === 0 ? (
          <Card className="col-span-full shadow-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum professor cadastrado
              </h3>
              <p className="text-muted-foreground text-center">
                Clique em "Novo Professor" para começar a cadastrar professores.
              </p>
            </CardContent>
          </Card>
        ) : (
          professores.map((professor) => (
            <Card key={professor.id} className="shadow-card border-border hover:shadow-elegant transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">{professor.nome}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {professor.materia}
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(professor)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(professor)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail size={14} className="mr-2" />
                  <span>{professor.email}</span>
                </div>
                {professor.telefone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone size={14} className="mr-2" />
                    <span>{professor.telefone}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-3">
                  Cadastrado em {new Date(professor.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir professor</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{professorToDelete?.nome || ''}</strong>. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProfessorToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => professorToDelete && handleDelete(professorToDelete.id)}
            >
              Excluir professor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
