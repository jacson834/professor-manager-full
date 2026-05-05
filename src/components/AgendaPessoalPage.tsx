import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  eventosApi,
  EventoAgenda
} from '@/lib/database';
import { Plus, Edit, Trash2, Calendar, Clock, User, Briefcase, Users, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AgendaPessoalPage() {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<EventoAgenda | null>(null);
  const [editingEvento, setEditingEvento] = useState<EventoAgenda | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: '',
    horario: '',
    tipo: 'pessoal' as 'pessoal' | 'trabalho' | 'reuniao' | 'lembrete'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      const data = await eventosApi.getEventos();
      setEventos(data.sort((a, b) => new Date(a.data + ' ' + a.horario).getTime() - new Date(b.data + ' ' + b.horario).getTime()));
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar eventos do servidor.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data || !formData.horario) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingEvento) {
        await eventosApi.updateEvento(editingEvento.id, formData);
        toast({
          title: "Sucesso",
          description: "Evento atualizado com sucesso!"
        });
      } else {
        await eventosApi.addEvento(formData);
        toast({
          title: "Sucesso",
          description: "Evento adicionado com sucesso!"
        });
      }
      
      await loadEventos();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Erro ao salvar evento:", error);
      let errorMessage = "Erro ao salvar evento.";
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

  const handleEdit = (evento: EventoAgenda) => {
    setEditingEvento(evento);
    setFormData({
      titulo: evento.titulo,
      descricao: evento.descricao || '',
      data: evento.data,
      horario: evento.horario,
      tipo: evento.tipo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await eventosApi.deleteEvento(id);
      await loadEventos();
      toast({
        title: "Sucesso",
        description: "Evento excluído com sucesso!"
      });
    } catch (error: any) {
      console.error("Erro ao deletar evento:", error);
      let errorMessage = "Erro ao deletar evento.";
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
      setEventoToDelete(null);
    }
  };

  const openDeleteDialog = (evento: EventoAgenda) => {
    setEventoToDelete(evento);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ titulo: '', descricao: '', data: '', horario: '', tipo: 'pessoal' });
    setEditingEvento(null);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'trabalho': return <Briefcase size={14} />;
      case 'reuniao': return <Users size={14} />;
      case 'lembrete': return <Bell size={14} />;
      default: return <User size={14} />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'trabalho': return 'bg-blue-100 text-blue-800';
      case 'reuniao': return 'bg-green-100 text-green-800';
      case 'lembrete': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isEventoPassado = (data: string, horario: string) => {
    const eventoDateTime = new Date(`${data}T${horario}`).getTime();
    const agora = new Date().getTime();
    return eventoDateTime < agora;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda Pessoal</h1>
          <p className="text-muted-foreground">Gerencie seus compromissos e lembretes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary-hover">
              <Plus size={16} className="mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEvento ? 'Editar Evento' : 'Novo Evento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ex: Reunião com equipe, Consulta médica..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(value: any) => setFormData({...formData, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoal">Pessoal</SelectItem>
                    <SelectItem value="trabalho">Trabalho</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="lembrete">Lembrete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="horario">Horário *</Label>
                <Input
                  id="horario"
                  type="time"
                  value={formData.horario}
                  onChange={(e) => setFormData({...formData, horario: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Detalhes adicionais do evento..."
                  rows={3}
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
                  {editingEvento ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de eventos */}
      <div className="space-y-4">
        {eventos.length === 0 ? (
          <Card className="shadow-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum evento cadastrado
              </h3>
              <p className="text-muted-foreground text-center">
                Clique em "Novo Evento" para começar a organizar sua agenda.
              </p>
            </CardContent>
          </Card>
        ) : (
          eventos.map((evento) => (
            <Card 
              key={evento.id} 
              className={`shadow-card border-border hover:shadow-elegant transition-shadow duration-200 ${
                isEventoPassado(evento.data, evento.horario) ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg text-foreground">{evento.titulo}</CardTitle>
                      <Badge className={getTipoColor(evento.tipo)}>
                        <div className="flex items-center space-x-1">
                          {getTipoIcon(evento.tipo)}
                          <span className="capitalize">{evento.tipo}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{formatDate(evento.data)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{evento.horario}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(evento)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(evento)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {evento.descricao && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{evento.descricao}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o evento <strong>{eventoToDelete?.titulo || ''}</strong>. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEventoToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => eventoToDelete && handleDelete(eventoToDelete.id)}>
              Excluir evento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
