import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // <--- CORREÇÃO AQUI
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  turmasApi,
  alunosApi,
  notasApi,
  Turma, Aluno, Nota
} from '@/lib/database';
import { PlusCircle, Edit, Trash2, Award, TrendingUp, BookOpen, Users, ArrowLeft, XCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';


// Interface para a nota no estado local, incluindo um campo para edição
interface EditableNota extends Nota {
  isEditing?: boolean;
}

export default function NotasPage() {
  const { turmaId, alunoId } = useParams<{ turmaId: string; alunoId: string; }>(); // Ler direto dos parâmetros da URL
  const navigate = useNavigate();
  const { toast } = useToast();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [notas, setNotas] = useState<EditableNota[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o formulário de nova nota
  const [newNotaValue, setNewNotaValue] = useState<string>('');
  const [newNotaDescricao, setNewNotaDescricao] = useState<string>('');
  const [newNotaBimestre, setNewNotaBimestre] = useState<string>('1');
  const [newNotaAvaliacao, setNewNotaAvaliacao] = useState<string>('');

  // Estados para edição de nota
  const [editingNotaId, setEditingNotaId] = useState<string | null>(null);
  const [editingNotaValue, setEditingNotaValue] = useState<string>('');
  const [editingNotaDescricao, setEditingNotaDescricao] = useState<string>('');
  const [editingNotaBimestre, setEditingNotaBimestre] = useState<string>('');
  const [editingNotaAvaliacao, setEditingNotaAvaliacao] = useState<string>('');


  const loadData = useCallback(async () => {
    if (!turmaId || !alunoId) {
      toast({ title: "Erro", description: "ID da turma ou do aluno não fornecido na URL.", variant: "destructive" });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [selectedTurma, selectedAluno, alunoNotas] = await Promise.all([
        turmasApi.getTurmaById(turmaId),
        alunosApi.getAlunoById(alunoId),
        notasApi.getNotasByAluno(alunoId)
      ]);

      if (!selectedTurma || !selectedAluno) {
        toast({ title: "Erro", description: "Aluno ou Turma não encontrados.", variant: "destructive" });
        setLoading(false);
        return;
      }

      setTurma(selectedTurma);
      setAluno(selectedAluno);
      setNotas(alunoNotas.map(n => ({ ...n, isEditing: false })));

      const ultimoBimestreLancado = alunoNotas.reduce((maxBim, nota) => {
        return Math.max(maxBim, parseInt(nota.bimestre || '0'));
      }, 0);
      const proximoBimestre = (ultimoBimestreLancado % 4) + 1;
      setNewNotaBimestre(String(proximoBimestre));


    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Falha ao carregar dados do aluno ou da turma.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [turmaId, alunoId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleAddNota = async () => {
    if (!aluno || !turma || !newNotaValue || !newNotaBimestre || !newNotaAvaliacao.trim()) {
      toast({ title: "Erro", description: "Por favor, preencha a avaliação, nota e selecione o bimestre.", variant: "destructive" });
      return;
    }

    const notaNumerica = parseFloat(newNotaValue);
    if (isNaN(notaNumerica) || notaNumerica < 0 || notaNumerica > 10) {
      toast({ title: "Erro", description: "A nota deve ser um número entre 0 e 10.", variant: "destructive" });
      return;
    }

    try {
      const newNota: Omit<Nota, 'id' | 'createdAt'> = {
        alunoId: aluno.id,
        turmaId: turma.id,
        avaliacao: newNotaAvaliacao,
        nota: notaNumerica,
        dataAvaliacao: new Date().toISOString().split('T')[0],
        bimestre: newNotaBimestre,
        observacao: newNotaDescricao,
      };
      await notasApi.addNota(newNota);
      toast({ title: "Sucesso", description: "Nota adicionada com sucesso." });
      setNewNotaValue('');
      setNewNotaDescricao('');
      setNewNotaBimestre(String((parseInt(newNotaBimestre) % 4) + 1));
      setNewNotaAvaliacao('');
      loadData();
    } catch (error: any) {
      console.error("Erro ao adicionar nota:", error);
      toast({ title: "Erro", description: error.message || "Falha ao adicionar nota.", variant: "destructive" });
    }
  };

  const handleEditClick = (nota: EditableNota) => {
    setEditingNotaId(nota.id);
    setEditingNotaValue(String(nota.nota));
    setEditingNotaDescricao(nota.observacao || '');
    setEditingNotaBimestre(nota.bimestre || '1');
    setEditingNotaAvaliacao(nota.avaliacao || '');
  };

  const handleSaveEdit = async (notaId: string) => {
    const notaToUpdate = notas.find(n => n.id === notaId);
    if (!notaToUpdate || !aluno || !turma) return;

    const notaNumerica = parseFloat(editingNotaValue);
    if (isNaN(notaNumerica) || notaNumerica < 0 || notaNumerica > 10) {
      toast({ title: "Erro", description: "A nota deve ser um número entre 0 e 10.", variant: "destructive" });
      return;
    }
    if (!editingNotaAvaliacao.trim()) {
        toast({ title: "Erro", description: "O nome da avaliação é obrigatório.", variant: "destructive" });
        return;
    }

    try {
      const updatedNotaPayload: Partial<Nota> = {
        alunoId: aluno.id,
        turmaId: turma.id,
        avaliacao: editingNotaAvaliacao,
        nota: notaNumerica,
        dataAvaliacao: notaToUpdate.dataAvaliacao,
        bimestre: editingNotaBimestre,
        observacao: editingNotaDescricao,
      };
      await notasApi.updateNota(notaId, updatedNotaPayload);
      toast({ title: "Sucesso", description: "Nota atualizada com sucesso." });
      setEditingNotaId(null);
      loadData();
    } catch (error: any) {
      console.error("Erro ao atualizar nota:", error);
      toast({ title: "Erro", description: error.message || "Falha ao atualizar nota.", variant: "destructive" });
    }
  };

  const handleDeleteNota = async (notaId: string) => {
    try {
      await notasApi.deleteNota(notaId);
      toast({ title: "Sucesso", description: "Nota excluída com sucesso." });
      loadData();
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      toast({ title: "Erro", description: error.message || "Falha ao excluir nota.", variant: "destructive" });
    }
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 7) return 'text-success';
    if (nota >= 5) return 'text-warning';
    return 'text-destructive';
  };

  const getNotaVariant = (nota: number): "default" | "secondary" | "destructive" => {
    if (nota >= 7) return 'default';
    if (nota >= 5) return 'secondary';
    return 'destructive';
  };

  const getMediaTurma = () => { // Esta função é para a média GERAL de todas as notas DO ALUNO ATUAL
    if (notas.length === 0) return 0;
    const soma = notas.reduce((acc, nota) => acc + nota.nota, 0);
    return Math.round((soma / notas.length) * 10) / 10;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => navigate(`/turmas/${turma?.id}/overview`)}>
          <ArrowLeft size={16} className="mr-2" /> Voltar para Visão Geral da Turma
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Notas de {aluno?.nome || 'Aluno Desconhecido'}</h1>
        <p className="text-muted-foreground">Turma: {turma?.nome || 'Desconhecida'} ({turma?.ano || 'N/A'})</p>
      </div>

      <Separator />

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" /> Adicionar Nova Nota
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1">
              <Label htmlFor="newNota">Nota (0-10) *</Label>
              <Input
                id="newNota"
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="Ex: 8.5"
                value={newNotaValue}
                onChange={(e) => setNewNotaValue(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="newBimestre">Bimestre *</Label>
              <Select onValueChange={setNewNotaBimestre} value={newNotaBimestre}>
                <SelectTrigger id="newBimestre" className="w-full mt-1">
                  <SelectValue placeholder="Selecione o Bimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Bimestre</SelectItem>
                  <SelectItem value="2">2º Bimestre</SelectItem>
                  <SelectItem value="3">3º Bimestre</SelectItem>
                  <SelectItem value="4">4º Bimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="newAvaliacao">Avaliação *</Label>
              <Input
                id="newAvaliacao"
                placeholder="Ex: Prova de Matemática, Trabalho sobre Biomas..."
                value={newNotaAvaliacao}
                onChange={(e) => setNewNotaAvaliacao(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>
          <div className="col-span-4">
              <Label htmlFor="newDescricao">Observação (Opcional)</Label>
              <Textarea
                id="newDescricao"
                placeholder="Detalhes adicionais sobre a nota ou trabalho..."
                value={newNotaDescricao}
                onChange={(e) => setNewNotaDescricao(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          <Button onClick={handleAddNota} className="w-full">
            Adicionar Nota
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        Notas Lançadas
      </h2>

      {notas.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma nota lançada para este aluno
            </h3>
            <p className="text-muted-foreground text-center">
              Use o formulário acima para adicionar notas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nota</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Bimestre</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Avaliação</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Observação</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {notas.sort((a, b) => {
                const bimestreA = parseInt(a.bimestre || '0');
                const bimestreB = parseInt(b.bimestre || '0');
                if (bimestreA !== bimestreB) return bimestreA - bimestreB;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }).map((nota) => (
                <tr key={nota.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-2 text-sm font-medium text-foreground">
                    {editingNotaId === nota.id ? (
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={editingNotaValue}
                        onChange={(e) => setEditingNotaValue(e.target.value)}
                        className="w-24"
                      />
                    ) : (
                      <Badge variant={getNotaVariant(nota.nota)} className="text-xs">
                        {nota.nota.toFixed(1)}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-foreground">
                    {editingNotaId === nota.id ? (
                      <Select onValueChange={setEditingNotaBimestre} value={editingNotaBimestre}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Bimestre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1º Bimestre</SelectItem>
                          <SelectItem value="2">2º Bimestre</SelectItem>
                          <SelectItem value="3">3º Bimestre</SelectItem>
                          <SelectItem value="4">4º Bimestre</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      `${nota.bimestre}º Bimestre`
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {editingNotaId === nota.id ? (
                      <Input
                        value={editingNotaAvaliacao}
                        onChange={(e) => setEditingNotaAvaliacao(e.target.value)}
                        className="w-48"
                      />
                    ) : (
                      nota.avaliacao
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {editingNotaId === nota.id ? (
                      <Textarea
                        value={editingNotaDescricao}
                        onChange={(e) => setEditingNotaDescricao(e.target.value)}
                        className="h-12 text-sm w-full"
                      />
                    ) : (
                      nota.observacao || 'N/A'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {new Date(nota.dataAvaliacao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editingNotaId === nota.id ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(nota.id)}>
                          <Save size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingNotaId(null)}>
                          <XCircle size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(nota)}>
                          <Edit size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente esta nota.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteNota(nota.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}