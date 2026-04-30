import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  turmasApi,
  planejamentosApi,
  feriadosApi,
  Turma, PlanejamentoAula, Feriado // Assegure-se que Feriado está exportado
} from '@/lib/database';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Importa o novo serviço de feriados externos
import { externalHolidaysApi } from '@/lib/externalHolidaysApi';

export default function PlanejamentoPage() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('');
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(new Date());
  const [planejamentos, setPlanejamentos] = useState<PlanejamentoAula[]>([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]); // Seus feriados, agora incluindo os nacionais sincronizados
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [planejamentoAtual, setPlanejamentoAtual] = useState<PlanejamentoAula | null>(null);

  // Estados para formulários
  const [conteudo, setConteudo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [nomeFeriado, setNomeFeriado] = useState('');

  // carregarDados é definido ANTES de ser chamado em useEffect, resolvendo o ReferenceError.
  const carregarDados = useCallback(async () => {
    try {
      const professorId = user?.role === 'professor' ? user.professorId : undefined;
      const turmasData = await turmasApi.getTurmas(professorId);
      setTurmas(turmasData);

      const feriadosData = await feriadosApi.getFeriados();
      setFeriados(feriadosData); // Este agora conterá feriados nacionais e locais

      if (turmaSelecionada) {
        const planejamentosData = await planejamentosApi.getPlanejamentosByTurma(turmaSelecionada);
        setPlanejamentos(planejamentosData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do planejamento:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do planejamento.",
        variant: "destructive"
      });
    }
  }, [turmaSelecionada, toast]);

  // Lógica de sincronização de feriados nacionais
  const syncNationalHolidays = useCallback(async (year: number) => {
    try {
      const result = await externalHolidaysApi.getNationalHolidays(year);

      if (result.added > 0) {
        toast({
          title: "Sincronização de Feriados",
          description: result.message,
        });
      } else {
        toast({
          title: "Sincronização de Feriados",
          description: `Nenhum novo feriado nacional de ${year} para adicionar.`,
          variant: "secondary"
        });
      }
      
      // Recarregar feriados após sincronização
      const feriadosData = await feriadosApi.getFeriados();
      setFeriados(feriadosData);
    } catch (error) {
      console.error(`Erro ao sincronizar feriados nacionais de ${year}:`, error);
      toast({
        title: "Erro de Sincronização",
        description: `Falha ao sincronizar feriados nacionais de ${year}.`,
        variant: "destructive"
      });
    }
  }, [toast]);

  // UseEffect para carregar os dados e SINCRONIZAR feriados ao montar o componente
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const lastSyncYear = localStorage.getItem('last_holiday_sync_year');

    const initialLoadAndSync = async () => {
        if (!lastSyncYear || parseInt(lastSyncYear) < currentYear) {
            try {
                // Sincroniza o ano atual
                await syncNationalHolidays(currentYear);
                localStorage.setItem('last_holiday_sync_year', String(currentYear));

                // Sincroniza o próximo ano (opcional, pode ser feito em outro momento)
                await syncNationalHolidays(nextYear);
            } catch (error) {
                console.error("Erro durante a sincronização inicial de feriados:", error);
            } finally {
                // Sempre carrega os dados do DB local após tentar sincronizar
                carregarDados();
            }
        } else {
            // Se já sincronizou para o ano, apenas carrega dados
            carregarDados();
        }
    };

    initialLoadAndSync();

  }, [carregarDados, syncNationalHolidays]);


  const handleSalvarPlanejamento = async () => {
    if (!turmaSelecionada || !dataSelecionada || !conteudo.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');

    try {
      if (planejamentoAtual) {
        await planejamentosApi.updatePlanejamento(planejamentoAtual.id, {
          turmaId: turmaSelecionada,
          data: dataFormatada,
          conteudo,
          observacoes
        });
        toast({
          title: "Sucesso",
          description: "Planejamento atualizado com sucesso!"
        });
      } else {
        await planejamentosApi.addPlanejamento({
          turmaId: turmaSelecionada,
          data: dataFormatada,
          conteudo,
          observacoes
        });
        toast({
          title: "Sucesso",
          description: "Planejamento adicionado com sucesso!"
        });
      }

      await carregarDados();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar planejamento:", error);
      let errorMessage = "Erro ao salvar planejamento.";
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

  const handleAdicionarFeriado = async () => {
    if (!dataSelecionada || !nomeFeriado.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    const dataFormatada = format(dataSelecionada, 'yyyy-MM-dd');

    try {
      const existingFeriados = await feriadosApi.getFeriados(); // Busca todos os feriados, incluindo os nacionais
      const isDuplicate = existingFeriados.some(f => f.data === dataFormatada);

      if (isDuplicate) {
        toast({
          title: "Erro",
          description: "Já existe um feriado cadastrado para esta data.",
          variant: "destructive"
        });
        return;
      }

      await feriadosApi.addFeriado({
        data: dataFormatada,
        nome: nomeFeriado
      });

      await carregarDados(); // Recarrega para exibir o novo feriado
      setIsHolidayDialogOpen(false);
      setNomeFeriado('');

      toast({
        title: "Sucesso",
        description: "Feriado adicionado com sucesso!"
      });
    } catch (error: any) {
      console.error("Erro ao adicionar feriado:", error);
      let errorMessage = "Erro ao adicionar feriado.";
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

  const handleEditarPlanejamento = (planejamento: PlanejamentoAula) => {
    setPlanejamentoAtual(planejamento);
    setConteudo(planejamento.conteudo);
    setObservacoes(planejamento.observacoes || '');
    setDataSelecionada(new Date(planejamento.data + 'T00:00:00'));
    setIsDialogOpen(true);
  };

  const handleExcluirPlanejamento = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este planejamento?')) {
      return;
    }
    try {
      await planejamentosApi.deletePlanejamento(id);
      await carregarDados();
      toast({
        title: "Sucesso",
        description: "Planejamento excluído com sucesso!"
      });
    } catch (error: any) {
      console.error("Erro ao excluir planejamento:", error);
      let errorMessage = "Erro ao excluir planejamento.";
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
    setPlanejamentoAtual(null);
    setConteudo('');
    setObservacoes('');
  };

  const getPlanejamentoDoDia = (data: Date) => {
    if (!turmaSelecionada) return null;
    const dataFormatada = format(data, 'yyyy-MM-dd');
    return planejamentos.find(p => p.data === dataFormatada);
  };

  const getFeriadoDoDia = (data: Date) => {
    const dataFormatada = format(data, 'yyyy-MM-dd');
    return feriados.find(f => f.data === dataFormatada);
  };

  const modifiers = {
    planejado: (date: Date) => !!getPlanejamentoDoDia(date),
    feriado: (date: Date) => !!getFeriadoDoDia(date)
  };

  const modifiersClassNames = {
    planejado: 'bg-blue-100 text-blue-900 font-medium',
    feriado: 'bg-red-100 text-red-900 font-medium'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Planejamento Acadêmico</h1>
        <div className="flex gap-2">
          {/* O botão "Adicionar Feriado" é para adicionar feriados MANUAIS, locais.
              A sincronização automática acontece em segundo plano. */}
          <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Feriado (Manual)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Feriado (Manual)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome-feriado">Nome do Feriado</Label>
                  <Input
                    id="nome-feriado"
                    value={nomeFeriado}
                    onChange={(e) => setNomeFeriado(e.target.value)}
                    placeholder="Ex: Natal, Carnaval..."
                  />
                </div>
                <div>
                  <Label>Data do Feriado</Label>
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={setDataSelecionada}
                    className="rounded-md border mt-2"
                  />
                </div>
                <Button onClick={handleAdicionarFeriado} className="w-full">
                  Adicionar Feriado
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {/* Opcional: Um botão para forçar a sincronização de feriados nacionais */}
          <Button variant="outline" onClick={() => syncNationalHolidays(new Date().getFullYear())}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Sincronizar Feriados Nacionais
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seleção de Turma e Calendário */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome} - {turma.ano}º {turma.semestre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {turmaSelecionada && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Calendário de Planejamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                    <span className="text-sm">Planejado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span className="text-sm">Feriado</span>
                  </div>
                </div>
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  locale={ptBR}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detalhes do Dia Selecionado */}
        <div className="space-y-4">
          {dataSelecionada && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getFeriadoDoDia(dataSelecionada) && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Feriado: {getFeriadoDoDia(dataSelecionada)?.nome}
                  </Badge>
                )}

                {turmaSelecionada && (
                  <>
                    {getPlanejamentoDoDia(dataSelecionada) ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Conteúdo Planejado:</h4>
                          <p className="text-sm text-blue-800">
                            {getPlanejamentoDoDia(dataSelecionada)?.conteudo}
                          </p>
                          {getPlanejamentoDoDia(dataSelecionada)?.observacoes && (
                            <>
                              <h4 className="font-medium text-blue-900 mt-2 mb-1">Observações:</h4>
                              <p className="text-sm text-blue-700">
                                {getPlanejamentoDoDia(dataSelecionada)?.observacoes}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarPlanejamento(getPlanejamentoDoDia(dataSelecionada)!)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleExcluirPlanejamento(getPlanejamentoDoDia(dataSelecionada)!.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full" onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Planejamento
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              {planejamentoAtual ? 'Editar' : 'Adicionar'} Planejamento
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="conteudo">Conteúdo da Aula *</Label>
                              <Textarea
                                id="conteudo"
                                value={conteudo}
                                onChange={(e) => setConteudo(e.target.value)}
                                placeholder="Descreva o que será ensinado neste dia..."
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label htmlFor="observacoes">Observações</Label>
                              <Textarea
                                id="observacoes"
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Observações adicionais..."
                                rows={3}
                              />
                            </div>
                            <Button onClick={handleSalvarPlanejamento} className="w-full">
                              {planejamentoAtual ? 'Atualizar' : 'Salvar'} Planejamento
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}