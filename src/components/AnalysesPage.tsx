import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import {
  turmasApi,
  alunosApi,
  notasApi,
  presencasApi,
  alertasAlunosApi,
  Turma, Aluno, Nota, Presenca, AlertaAluno
} from '@/lib/database';
import {
  AlertTriangle,
  TrendingDown,
  Trophy,
  Medal,
  Award,
  Users,
  Target,
  Calendar,
  BookOpen,
  CheckCircle,
  Archive,
  RefreshCcw,
  ClipboardList,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interfaces existentes
interface AlunoRisco {
  aluno: Aluno;
  turma: Turma;
  mediaGeral: number;
  percentualPresenca: number;
  totalAulas: number;
  faltas: number;
  nivelRisco: 'alto' | 'medio' | 'baixo';
  problemas: string[];
}

interface RankingAluno {
  aluno: Aluno;
  turma: Turma;
  mediaGeral: number;
  percentualPresenca: number;
  posicao: number;
}

interface RankingTurma {
  turma: Turma;
  mediaGeral: number;
  percentualPresenca: number;
  totalAlunos: number;
  alunosAprovados: number;
  posicao: number;
}

// Interface para o histórico de alertas (mantida)
interface AlertaAlunoHistorico extends AlertaAluno {
  aluno?: Aluno;
  turma?: Turma;
}


export default function AnalysesPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [allAlunos, setAllAlunos] = useState<Aluno[]>([]);
  const [allNotas, setAllNotas] = useState<Nota[]>([]);
  const [allPresencas, setAllPresencas] = useState<Presenca[]>([]);

  const [activeAlerts, setActiveAlerts] = useState<AlunoRisco[]>([]);
  const [archivedAlerts, setArchivedAlerts] = useState<AlertaAlunoHistorico[]>([]);

  const [selectedTurma, setSelectedTurma] = useState<string>('todas');
  const [rankingAlunos, setRankingAlunos] = useState<RankingAluno[]>([]);
  const [rankingTurmas, setRankingTurmas] = useState<RankingTurma[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);
  const [selectedAlertProblem, setSelectedAlertProblem] = useState<{ aluno: Aluno; turma: Turma; problema: string; nivelRisco: string; } | null>(null);
  const [observationText, setObservationText] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- FUNÇÕES DE ANÁLISE E RANKING (useCallback com dependências estáveis) ---
  // Analisar Alunos em Risco
  const analisarAlunosRiscoInternal = useCallback(() => { // Removidos parâmetros, usar estados diretamente
    const alunosParaAnalise = selectedTurma === 'todas'
      ? allAlunos // Usar allAlunos do estado
      : allAlunos.filter(aluno => aluno.turmaId === selectedTurma);

    const alunosComRiscoAtivo: AlunoRisco[] = [];

    alunosParaAnalise.forEach(aluno => {
      const notas = allNotas.filter(n => n.alunoId === aluno.id); // Usar allNotas do estado
      const presencas = allPresencas.filter(p => p.alunoId === aluno.id); // Usar allPresencas do estado
      const turma = turmas.find(t => t.id === aluno.turmaId); // Usar turmas do estado

      if (!turma) {
          console.warn(`Turma não encontrada para o aluno: ${aluno.nome} (ID: ${aluno.id}). Ignorando risco.`);
          return;
      }

      const mediaGeral = notas.length > 0
        ? Math.round((notas.reduce((acc, nota) => acc + nota.nota, 0) / notas.length) * 10) / 10
        : 0;

      const totalAulas = presencas.length;
      const presentes = presencas.filter(p => p.presente).length;
      const percentualPresenca = totalAulas > 0 ? Math.round((presentes / totalAulas) * 100) : 100;
      const faltas = totalAulas - presentes;

      const problemas: string[] = [];
      let nivelRisco: 'alto' | 'medio' | 'baixo' = 'baixo';

      // Critérios de risco acadêmico
      if (mediaGeral < 5 && notas.length > 0) {
        problemas.push('Média muito baixa (< 5.0)');
        nivelRisco = 'alto';
      } else if (mediaGeral < 6 && notas.length > 0) {
        problemas.push('Média baixa (< 6.0)');
        nivelRisco = nivelRisco === 'baixo' ? 'medio' : nivelRisco;
      }

      // Critérios de risco de presença
      if (percentualPresenca < 60 && totalAulas > 0) {
        problemas.push('Presença muito baixa (< 60%)');
        nivelRisco = 'alto';
      } else if (percentualPresenca < 75 && totalAulas > 0) {
        problemas.push('Presença baixa (< 75%)');
        nivelRisco = nivelRisco === 'baixo' ? 'medio' : nivelRisco;
      }

      // Critério adicional: muitas faltas
      if (faltas > 10) {
        problemas.push(`Muitas faltas (${faltas})`);
        nivelRisco = nivelRisco === 'baixo' ? 'medio' : nivelRisco;
      }

      // Critério adicional: sem notas lançadas
      if (notas.length === 0 && totalAulas > 0) {
        problemas.push('Nenhuma nota lançada');
        nivelRisco = nivelRisco === 'baixo' ? 'medio' : nivelRisco;
      }

      if (problemas.length > 0) {
        alunosComRiscoAtivo.push({
          aluno,
          turma,
          mediaGeral,
          percentualPresenca,
          totalAulas,
          faltas,
          nivelRisco,
          problemas
        });
      }
    });

    alunosComRiscoAtivo.sort((a, b) => {
      const ordemRisco = { alto: 3, medio: 2, baixo: 1 };
      if (ordemRisco[a.nivelRisco] !== ordemRisco[b.nivelRisco]) {
        return ordemRisco[b.nivelRisco] - ordemRisco[a.nivelRisco];
      }
      return a.mediaGeral - b.mediaGeral;
    });

    setActiveAlerts(alunosComRiscoAtivo);
  }, [selectedTurma, allAlunos, allNotas, allPresencas, turmas]); // Dependem dos estados que contêm os dados


  // Gerar Rankings
  const gerarRankings = useCallback(() => { // Removidos parâmetros, usar estados diretamente
    const alunosParaRanking = selectedTurma === 'todas'
      ? allAlunos // Usar allAlunos do estado
      : allAlunos.filter(aluno => aluno.turmaId === selectedTurma);

    const rankingAlunosData: RankingAluno[] = [];

    alunosParaRanking.forEach(aluno => {
      const notas = allNotas.filter(n => n.alunoId === aluno.id); // Usar allNotas do estado
      const presencas = allPresencas.filter(p => p.alunoId === aluno.id); // Usar allPresencas do estado
      const turma = turmas.find(t => t.id === aluno.turmaId); // Usar turmas do estado

      if (!turma) return;

      const mediaGeral = notas.length > 0
        ? Math.round((notas.reduce((acc, nota) => acc + nota.nota, 0) / notas.length) * 10) / 10
        : 0;

      const totalAulas = presencas.length;
      const presentes = presencas.filter(p => p.presente).length;
      const percentualPresenca = totalAulas > 0 ? Math.round((presentes / totalAulas) * 100) : 100;

      if (notas.length > 0 || presencas.length > 0) {
        rankingAlunosData.push({
          aluno,
          turma,
          mediaGeral,
          percentualPresenca,
          posicao: 0
        });
      }
    });

    rankingAlunosData.sort((a, b) => {
      if (a.mediaGeral !== b.mediaGeral) {
        return b.mediaGeral - a.mediaGeral;
      }
      return b.percentualPresenca - a.percentualPresenca;
    });

    rankingAlunosData.forEach((item, index) => {
      item.posicao = index + 1;
    });

    setRankingAlunos(rankingAlunosData.slice(0, 20));

    const rankingTurmasData: RankingTurma[] = [];

    const turmasParaRanking = selectedTurma === 'todas'
      ? turmas // Usar turmas do estado
      : turmas.filter(t => t.id === selectedTurma);

    turmasParaRanking.forEach(turma => {
      const alunosDaTurma = allAlunos.filter(a => a.turmaId === turma.id); // Usar allAlunos do estado
      if (alunosDaTurma.length === 0) return;

      let somaMedias = 0;
      let somaPercentuaisPresenca = 0;
      let alunosComNotas = 0;
      let alunosComPresenca = 0;
      let alunosAprovados = 0;

      alunosDaTurma.forEach(aluno => {
        const notasAluno = allNotas.filter(n => n.alunoId === aluno.id); // Usar allNotas do estado
        const presencasAluno = allPresencas.filter(p => p.alunoId === aluno.id); // Usar allPresencas do estado

        if (notasAluno.length > 0) {
          const mediaAluno = notasAluno.reduce((acc, nota) => acc + nota.nota, 0) / notasAluno.length;
          somaMedias += mediaAluno;
          alunosComNotas++;

          if (mediaAluno >= 7) {
            alunosAprovados++;
          }
        }

        const totalAulasAluno = presencasAluno.length;
        const presentesAluno = presencasAluno.filter(p => p.presente).length;
        if (totalAulasAluno > 0) {
          const percentualPresencaAluno = (presentesAluno / totalAulasAluno) * 100;
          somaPercentuaisPresenca += percentualPresencaAluno;
          alunosComPresenca++;
        }
      });

      const mediaGeralTurma = alunosComNotas > 0 ? Math.round((somaMedias / alunosComNotas) * 10) / 10 : 0;
      const percentualPresencaTurma = alunosComPresenca > 0 ? Math.round(somaPercentuaisPresenca / alunosComPresenca) : 100;

      rankingTurmasData.push({
        turma,
        mediaGeral: mediaGeralTurma,
        percentualPresenca: percentualPresencaTurma,
        totalAlunos: alunosDaTurma.length,
        alunosAprovados,
        posicao: 0
      });
    });

    rankingTurmasData.sort((a, b) => b.mediaGeral - a.mediaGeral);

    rankingTurmasData.forEach((item, index) => {
      item.posicao = index + 1;
    });

    setRankingTurmas(rankingTurmasData);
  }, [allAlunos, allNotas, allPresencas, selectedTurma, turmas]);


  // Função para carregar todos os dados (base e alertas)
  const loadAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [turmasData, alunosData, notasData, presencasData, alertasData] = await Promise.all([
        turmasApi.getTurmas(),
        alunosApi.getAlunos(),
        notasApi.getNotas(),
        presencasApi.getPresencas(),
        alertasAlunosApi.getAlerts(),
      ]);
      setTurmas(turmasData);
      setAllAlunos(alunosData);
      setAllNotas(notasData);
      setAllPresencas(presencasData);

      const mappedAlerts = alertasData.map((alert: AlertaAluno) => {
        const aluno = alunosData.find(a => a.id === alert.alunoId);
        const turma = turmasData.find(t => t.id === aluno?.turmaId);
        return {
          ...alert,
          aluno: aluno || {} as Aluno,
          turma: turma || {} as Turma
        };
      });

      const currentArchived = mappedAlerts.filter(alert => alert.status === 'arquivado' || alert.status === 'reaberto')
        .sort((a, b) => new Date(b.dataRegistro).getTime() - new Date(a.dataRegistro).getTime());

      setArchivedAlerts(currentArchived);

      // Não chamar analisarAlunosRiscoInternal e gerarRankings diretamente aqui.
      // O useEffect abaixo, que depende dos estados de dados, fará isso.

    } catch (error) {
      console.error("Erro ao carregar dados para análises:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados para análises.",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  }, [toast]); // Depende apenas de 'toast' (estável)


  // Novo useEffect: Dispara a análise e ranking quando os DADOS BRUTOS ou a turma selecionada mudam
  useEffect(() => {
    if (!loadingData && allAlunos.length > 0) { // Garante que os dados brutos já foram carregados
      analisarAlunosRiscoInternal(); // Agora sem parâmetros, usa os estados
      gerarRankings(); // Agora sem parâmetros, usa os estados
    }
  }, [loadingData, selectedTurma, allAlunos, allNotas, allPresencas, turmas, analisarAlunosRiscoInternal, gerarRankings]); // Dependências: todos os estados de dados brutos e as funções de callback

  // Efeito para carregar dados ao montar o componente
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);


  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'alto': return 'text-destructive';
      case 'medio': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskVariant = (nivel: string): "default" | "secondary" | "destructive" => {
    switch (nivel) {
      case 'alto': return 'destructive';
      case 'medio': return 'secondary';
      default: return 'default';
    }
  };

  const getRankingIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="h-5 w-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{posicao}</span>;
    }
  };

  // --- LÓGICA DO NOVO RECURSO: Gerenciar Ação de Alerta na Badge ---
  const handleProblemBadgeClick = (aluno: Aluno, problemaText: string, nivelRisco: string) => {
    const turmaDoAluno = turmas.find(t => t.id === aluno.turmaId);
    if (!turmaDoAluno) {
        console.error(`Turma não encontrada para o aluno ${aluno.nome}. Não é possível processar o alerta.`);
        toast({
            title: "Erro na Ação",
            description: "Turma do aluno não encontrada. Alerta não pode ser processado.",
            variant: "destructive"
        });
        return;
    }

    if (problemaText.includes('nota lançada')) {
      navigate('/notas', { state: { alunoId: aluno.id, turmaId: aluno.turmaId } });
      return;
    }

    setSelectedAlertProblem({ aluno, turma: turmaDoAluno, problema: problemaText, nivelRisco });
    setObservationText('');
    setIsObservationDialogOpen(true);
  };

  const handleSaveObservationAndArchive = async () => {
    if (!selectedAlertProblem || !selectedAlertProblem.turma) {
        console.error("Erro: selectedAlertProblem ou turma é nulo ao tentar salvar observação.");
        toast({
            title: "Erro Interno",
            description: "Dados do alerta não disponíveis. Tente novamente.",
            variant: "destructive"
        });
        return;
    }

    setIsObservationDialogOpen(false);
    setLoadingData(true); // Ativa o loading enquanto a ação é processada

    try {
      const { aluno, problema } = selectedAlertProblem;
      
      await alertasAlunosApi.addAlert({
        alunoId: aluno.id,
        tipoAlerta: problema,
        observacao: observationText,
        status: 'arquivado'
      });
      
      toast({
        title: "Observação Registrada",
        description: `Ação para "${problema}" de ${aluno.nome} registrada.`,
        variant: "default"
      });
      
      await loadAllData(); // Recarregar todos os dados após a ação para atualizar as listas
      
    } catch (error: any) {
      console.error("Erro ao salvar observação:", error);
      toast({
        title: "Erro ao Registrar Ação",
        description: error.message || "Falha ao registrar observação para o alerta.",
        variant: "destructive"
      });
    } finally {
      setSelectedAlertProblem(null);
      setObservationText('');
      setLoadingData(false);
    }
  };

  const handleReopenAlert = async (alertaHistorico: AlertaAlunoHistorico) => {
    if (!window.confirm(`Tem certeza que deseja reabrir o alerta para ${alertaHistorico.aluno?.nome} (${alertaHistorico.tipoAlerta})? Ele reaparecerá em "Alunos em Risco".`)) {
      return;
    }
    setLoadingData(true);
    try {
      await alertasAlunosApi.addAlert({
        alunoId: alertaHistorico.alunoId,
        tipoAlerta: alertaHistorico.tipoAlerta,
        observacao: `Alerta reaberto. Motivo: ${observationText || 'Não especificado'}. (Reaberto em ${new Date().toLocaleDateString('pt-BR')})`,
        status: 'reaberto'
      });
      
      toast({
        title: "Alerta Reaberto",
        description: "Alerta movido de volta para a lista de Alunos em Risco (se persistir).",
        variant: "default"
      });
      await loadAllData();
    } catch (error: any) {
      console.error("Erro ao reabrir alerta:", error);
      toast({
        title: "Erro ao Reabrir",
        description: error.message || "Falha ao reabrir alerta.",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const isProblemObservedRecently = useCallback((alunoId: string, problemaText: string): boolean => {
    const lastObservation = archivedAlerts
      .filter(alert => alert.alunoId === alunoId && alert.tipoAlerta === problemaText)
      .sort((a, b) => new Date(b.dataRegistro).getTime() - new Date(a.dataRegistro).getTime())[0];

    if (lastObservation) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(lastObservation.dataRegistro).getTime() > sevenDaysAgo.getTime();
    }
    return false;
  }, [archivedAlerts]);


  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Análises de Performance</h1>
        <p className="text-muted-foreground">Identificação de alunos em risco e rankings de performance</p>
      </div>

      {/* Filtro */}
      <Card className="shadow-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-foreground">Filtrar por turma:</label>
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

      {loadingData ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando dados para análises...</p>
        </div>
      ) : (
        <Tabs defaultValue="risco" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="risco">Alunos em Risco</TabsTrigger>
            <TabsTrigger value="ranking-alunos">Ranking de Alunos</TabsTrigger>
            <TabsTrigger value="historico-alertas">Histórico de Alertas</TabsTrigger>
          </TabsList>

          {/* Alunos em Risco (Ativos) */}
          <TabsContent value="risco" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Alunos em Situação de Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Target size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum aluno em risco identificado
                    </h3>
                    <p className="text-muted-foreground">
                      Todos os alunos estão com bom desempenho acadêmico e frequência adequada.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Encontrados <strong>{activeAlerts.length}</strong> alunos que precisam de atenção especial.
                      </AlertDescription>
                    </Alert>

                    {activeAlerts.map((alunoRisco) => (
                      <Card key={alunoRisco.aluno.id} className={`border-l-4 ${alunoRisco.nivelRisco === 'alto' ? 'border-l-destructive' : 'border-l-warning'}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-foreground">
                                  {alunoRisco.aluno.nome}
                                </h4>
                                <Badge variant={getRiskVariant(alunoRisco.nivelRisco)}>
                                  Risco {alunoRisco.nivelRisco}
                                </Badge>
                                <Badge variant="outline">
                                  {alunoRisco.turma.nome}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">Média</p>
                                  <p className={`text-lg font-bold ${alunoRisco.mediaGeral < 5 ? 'text-destructive' : alunoRisco.mediaGeral < 6 ? 'text-warning' : 'text-success'}`}>
                                    {alunoRisco.mediaGeral || '—'}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">Presença</p>
                                  <p className={`text-lg font-bold ${alunoRisco.percentualPresenca < 60 ? 'text-destructive' : alunoRisco.percentualPresenca < 75 ? 'text-warning' : 'text-success'}`}>
                                    {alunoRisco.percentualPresenca}%
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">Faltas</p>
                                  <p className="text-lg font-bold text-foreground">
                                    {alunoRisco.faltas}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">Total Aulas</p>
                                  <p className="text-lg font-bold text-foreground">
                                    {alunoRisco.totalAulas}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground mb-1">Problemas identificados:</p>
                                <div className="flex flex-wrap gap-2">
                                  {alunoRisco.problemas.map((problema, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className={`text-xs cursor-pointer ${isProblemObservedRecently(alunoRisco.aluno.id, problema) ? 'line-through opacity-70' : 'hover:bg-muted-foreground'}`}
                                      onClick={() => handleProblemBadgeClick(alunoRisco.aluno, problema, alunoRisco.nivelRisco)}
                                      title={isProblemObservedRecently(alunoRisco.aluno.id, problema) ? `Observação recente para: "${problema}"` : `Clique para ${problema.includes('nota lançada') ? 'lançar nota' : 'adicionar observação'}`}
                                    >
                                      {problema}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-center gap-2">
                              <TrendingDown className={`h-8 w-8 ${getRiskColor(alunoRisco.nivelRisco)}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking de Alunos */}
          <TabsContent value="ranking-alunos" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top 20 Melhores Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingAlunos.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum aluno com notas lançadas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankingAlunos.map((ranking) => (
                      <div key={ranking.aluno.id} className={`flex items-center justify-between p-4 rounded-lg ${ranking.posicao <= 3 ? 'bg-gradient-primary/10' : 'bg-muted/30'}`}>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10">
                            {getRankingIcon(ranking.posicao)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{ranking.aluno.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {ranking.turma.nome} • Matrícula: {ranking.aluno.matricula}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Média</p>
                            <p className="text-lg font-bold text-success">{ranking.mediaGeral}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Presença</p>
                            <p className="text-lg font-bold text-foreground">{ranking.percentualPresenca}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking de Turmas */}
          <TabsContent value="ranking-turmas" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Ranking de Turmas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingTurmas.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma turma com dados suficientes.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankingTurmas.map((ranking) => (
                      <div key={ranking.turma.id} className={`p-4 rounded-lg border ${ranking.posicao <= 3 ? 'bg-gradient-primary/10 border-primary/20' : 'bg-muted/30 border-border'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-10 h-10">
                              {getRankingIcon(ranking.posicao)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{ranking.turma.nome}</h4>
                              <p className="text-sm text-muted-foreground">
                                {ranking.turma.ano} • {ranking.turma.semestre}º Semestre
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Média</p>
                              <p className="text-lg font-bold text-success">{ranking.mediaGeral}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Presença</p>
                            <p className="text-lg font-bold text-foreground">{ranking.percentualPresenca}%</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Alunos</p>
                            <p className="font-semibold text-foreground">{ranking.totalAlunos}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Aprovados</p>
                            <p className="font-semibold text-success">{ranking.alunosAprovados}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Taxa Aprovação</p>
                            <p className="font-semibold text-foreground">
                              {ranking.totalAlunos > 0 ? Math.round((ranking.alunosAprovados / ranking.totalAlunos) * 100) : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico de Alertas */}
          <TabsContent value="historico-alertas" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <ClipboardList className="h-5 w-5" />
                  Histórico de Alertas e Ações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {archivedAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Archive size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum alerta arquivado ou reaberto
                    </h3>
                    <p className="text-muted-foreground">
                      Alertas visualizados ou reabertos aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {archivedAlerts.map((alerta) => (
                      <Card key={alerta.id} className={`border-l-4 ${alerta.status === 'arquivado' ? 'border-l-success' : 'border-l-warning'} p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {alerta.aluno?.nome || 'Aluno Desconhecido'} - {alerta.tipoAlerta}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Turma: {alerta.turma?.nome || 'Desconhecida'} • Registrado: {new Date(alerta.dataRegistro).toLocaleDateString('pt-BR')}
                            </p>
                            {alerta.dataResolucao && alerta.status === 'arquivado' && (
                              <p className="text-xs text-muted-foreground">
                                Arquivado em: {new Date(alerta.dataResolucao).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <Badge variant={alerta.status === 'arquivado' ? 'default' : 'secondary'} className="capitalize">
                            {alerta.status === 'arquivado' ? 'Arquivado' : 'Reaberto'}
                          </Badge>
                        </div>
                        {alerta.observacao && (
                          <div className="text-sm text-foreground bg-muted/50 p-3 rounded mt-2">
                            <p className="font-medium">Observação:</p>
                            <p className="whitespace-pre-line">{alerta.observacao}</p>
                          </div>
                        )}
                        <div className="flex justify-end mt-3">
                          {alerta.status === 'arquivado' && (
                            <Button variant="outline" size="sm" onClick={() => handleReopenAlert(alerta)}>
                              <RefreshCcw size={14} className="mr-1" /> Reabrir Alerta
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de Observação */}
      <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Observação para Alerta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Aluno: <span className="font-semibold">{selectedAlertProblem?.aluno.nome}</span> ({selectedAlertProblem?.turma.nome})
            </p>
            <p className="text-sm text-muted-foreground">
              Problema: <span className="font-medium">{selectedAlertProblem?.problema}</span>
            </p>
            <div>
              <Label htmlFor="observacao-alerta">Observação</Label>
              <Textarea
                id="observacao-alerta"
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
                placeholder="Ex: Conversado com pais e aluno, Plano de recuperação iniciado."
                rows={5}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsObservationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveObservationAndArchive}>
              Salvar e Arquivar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}