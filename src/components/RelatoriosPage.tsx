import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  turmasApi,
  alunosApi,
  notasApi,
  presencasApi,
  Turma, Aluno, Nota, Presenca
} from '@/lib/database';
import { FileText, Download, User, TrendingUp, Calendar, Award, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

interface RelatorioAluno {
  aluno: Aluno;
  notas: Nota[];
  presencas: Presenca[];
  mediaGeral: number;
  percentualPresenca: number;
  totalAulas: number;
  faltas: number;
}

interface RelatorioTurma {
  turma: Turma;
  alunos: RelatorioAluno[];
  mediaGeralTurma: number;
  percentualPresencaTurma: number;
  totalAlunos: number;
  alunosAprovados: number;
  alunosReprovados: number;
  alunosRecuperacao: number;
}

export default function RelatoriosPage() {
  const location = useLocation();
  const initialTurmaIdFromState = location.state?.turmaId;

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [allAlunos, setAllAlunos] = useState<Aluno[]>([]);
  const [allNotas, setAllNotas] = useState<Nota[]>([]);
  const [allPresencas, setAllPresencas] = useState<Presenca[]>([]);

  const [selectedTurma, setSelectedTurma] = useState<string>(initialTurmaIdFromState || '');
  const [selectedAluno, setSelectedAluno] = useState<string>('');
  const [alunosFiltradosPorTurma, setAlunosFiltradosPorTurma] = useState<Aluno[]>([]);

  const [relatorioIndividual, setRelatorioIndividual] = useState<RelatorioAluno | null>(null);
  const [relatorioTurmaData, setRelatorioTurmaData] = useState<RelatorioTurma | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTurmaIdFromState ? 'turma' : 'individual');

  useEffect(() => {
    const loadAllInitialData = async () => {
      setLoadingData(true);
      try {
        const [turmasData, alunosData, notasData, presencasData] = await Promise.all([
          turmasApi.getTurmas(),
          alunosApi.getAlunos(),
          notasApi.getNotas(),
          presencasApi.getPresencas(),
        ]);
        setTurmas(turmasData);
        setAllAlunos(alunosData);
        setAllNotas(notasData);
        setAllPresencas(presencasData);

        if (initialTurmaIdFromState && turmasData.some(t => t.id === initialTurmaIdFromState)) {
            setSelectedTurma(initialTurmaIdFromState);
            setActiveTab('turma');
        }

      } catch (error) {
        console.error("Erro ao carregar dados iniciais para relatórios:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados para relatórios.",
          variant: "destructive"
        });
      } finally {
        setLoadingData(false);
      }
    };
    loadAllInitialData();
  }, [initialTurmaIdFromState, toast]);

  useEffect(() => {
    if (selectedTurma) {
      const filtered = allAlunos.filter(aluno => aluno.turmaId === selectedTurma);
      setAlunosFiltradosPorTurma(filtered);
      setSelectedAluno('');
      setRelatorioIndividual(null);
      if (selectedTurma !== initialTurmaIdFromState) {
        setRelatorioTurmaData(null);
      }
    } else {
      setAlunosFiltradosPorTurma([]);
      setSelectedAluno('');
      setRelatorioIndividual(null);
      setRelatorioTurmaData(null);
    }
  }, [selectedTurma, allAlunos, initialTurmaIdFromState]);

  useEffect(() => {
    if (selectedAluno && !loadingData) {
      gerarRelatorioIndividual();
    } else {
      setRelatorioIndividual(null);
    }
  }, [selectedAluno, allNotas, allPresencas, alunosFiltradosPorTurma, loadingData]);

  useEffect(() => {
    if (!loadingData && selectedTurma === initialTurmaIdFromState && initialTurmaIdFromState) {
        gerarRelatorioDaTurma();
    }
  }, [loadingData, selectedTurma, initialTurmaIdFromState, allAlunos, allNotas, allPresencas, turmas]);

  const gerarRelatorioIndividual = () => {
    if (!selectedAluno) return;

    const aluno = alunosFiltradosPorTurma.find(a => a.id === selectedAluno);
    if (!aluno) return;

    const notas = allNotas.filter(n => n.alunoId === selectedAluno);
    const presencas = allPresencas.filter(p => p.alunoId === selectedAluno);

    const mediaGeral = notas.length > 0
      ? Math.round((notas.reduce((acc, nota) => acc + nota.nota, 0) / notas.length) * 10) / 10
      : 0;

    const totalAulas = presencas.length;
    const presentes = presencas.filter(p => p.presente).length;
    const percentualPresenca = totalAulas > 0 ? Math.round((presentes / totalAulas) * 100) : 0;
    const faltas = totalAulas - presentes;

    setRelatorioIndividual({
      aluno,
      notas,
      presencas,
      mediaGeral,
      percentualPresenca,
      totalAulas,
      faltas
    });
  };

  const gerarRelatorioDaTurma = () => {
    if (!selectedTurma) return;

    const turma = turmas.find(t => t.id === selectedTurma);
    if (!turma) return;

    const alunosData: RelatorioAluno[] = alunosFiltradosPorTurma.map(aluno => {
      const notas = allNotas.filter(n => n.alunoId === aluno.id);
      const presencas = allPresencas.filter(p => p.alunoId === aluno.id);

      const mediaGeral = notas.length > 0
        ? Math.round((notas.reduce((acc, nota) => acc + nota.nota, 0) / notas.length) * 10) / 10
        : 0;

      const totalAulas = presencas.length;
      const presentes = presencas.filter(p => p.presente).length;
      const percentualPresenca = totalAulas > 0 ? Math.round((presentes / totalAulas) * 100) : 0;
      const faltas = totalAulas - presentes;

      return {
        aluno,
        notas,
        presencas,
        mediaGeral,
        percentualPresenca,
        totalAulas,
        faltas
      };
    });

    const mediaGeralTurma = alunosData.length > 0
      ? Math.round((alunosData.reduce((acc, rel) => acc + rel.mediaGeral, 0) / alunosData.length) * 10) / 10
      : 0;

    const percentualPresencaTurma = alunosData.length > 0
      ? Math.round((alunosData.reduce((acc, rel) => acc + rel.percentualPresenca, 0) / alunosData.length))
      : 0;

    const alunosAprovados = alunosData.filter(rel => rel.mediaGeral >= 7).length;
    const alunosRecuperacao = alunosData.filter(rel => rel.mediaGeral >= 5 && rel.mediaGeral < 7).length;
    const alunosReprovados = alunosData.filter(rel => rel.mediaGeral < 5).length;

    setRelatorioTurmaData({
      turma,
      alunos: alunosData,
      mediaGeralTurma,
      percentualPresencaTurma,
      totalAlunos: alunosData.length,
      alunosAprovados,
      alunosReprovados,
      alunosRecuperacao
    });
  };

  const getTurmaNome = (turmaId: string) => {
    const turma = turmas.find(t => t.id === turmaId);
    return turma ? `${turma.nome} - ${turma.ano}` : 'Turma não encontrada';
  };

  const gerarPDFIndividual = () => {
    if (!relatorioIndividual) {
      toast({
        title: "Erro",
        description: "Nenhum relatório individual gerado para exportar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .info-section { margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { background: #f5f5f5; padding: 10px; border-radius: 5px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .nota-alta { color: #22c55e; font-weight: bold; }
            .nota-media { color: #f59e0b; font-weight: bold; }
            .nota-baixa { color: #ef4444; font-weight: bold; }
            .presente { color: #22c55e; }
            .falta { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RELATÓRIO INDIVIDUAL DO ALUNO</h1>
            <h2>${relatorioIndividual.aluno.nome}</h2>
            <p>Turma: ${getTurmaNome(relatorioIndividual.aluno.turmaId)} | Matrícula: ${relatorioIndividual.aluno.matricula}</p>
          </div>

          <div class="info-section">
            <h3>Informações Pessoais</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Nome:</strong> ${relatorioIndividual.aluno.nome}
              </div>
              <div class="info-item">
                <strong>Matrícula:</strong> ${relatorioIndividual.aluno.matricula}
              </div>
              <div class="info-item">
                <strong>Email:</strong> ${relatorioIndividual.aluno.email || 'Não informado'}
              </div>
              <div class="info-item">
                <strong>Telefone:</strong> ${relatorioIndividual.aluno.telefone || 'Não informado'}
              </div>
              <div class="info-item">
                <strong>Data de Nascimento:</strong> ${relatorioIndividual.aluno.dataNascimento ? new Date(relatorioIndividual.aluno.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}
              </div>
              <div class="info-item">
                <strong>Responsável:</strong> ${relatorioIndividual.aluno.responsavel || 'Não informado'}
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>Resumo Acadêmico</h3>
            <div class="info-grid">
              <div class="info-item">
                <strong>Média Geral:</strong>
                <span class="${relatorioIndividual.mediaGeral >= 7 ? 'nota-alta' : relatorioIndividual.mediaGeral >= 5 ? 'nota-media' : 'nota-baixa'}">
                  ${relatorioIndividual.mediaGeral}
                </span>
              </div>
              <div class="info-item">
                <strong>Percentual de Presença:</strong> ${relatorioIndividual.percentualPresenca}%
              </div>
              <div class="info-item">
                <strong>Total de Aulas:</strong> ${relatorioIndividual.totalAulas}
              </div>
              <div class="info-item">
                <strong>Faltas:</strong> ${relatorioIndividual.faltas}
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>Histórico de Notas</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Avaliação</th>
                  <th>Nota</th>
                  <th>Data</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                ${relatorioIndividual.notas.length > 0 ? relatorioIndividual.notas.map(nota => `
                  <tr>
                    <td>${nota.avaliacao}</td>
                    <td class="${nota.nota >= 7 ? 'nota-alta' : nota.nota >= 5 ? 'nota-media' : 'nota-baixa'}">${nota.nota}</td>
                    <td>${new Date(nota.dataAvaliacao).toLocaleDateString('pt-BR')}</td>
                    <td>${nota.observacao || '-'}</td>
                  </tr>
                `).join('') : `<tr><td colspan="4" style="text-align: center;">Nenhuma nota lançada.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="info-section">
            <h3>Histórico de Presenças</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                ${relatorioIndividual.presencas.length > 0 ? relatorioIndividual.presencas
                  .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                  .slice(0, 20) // Limitando a 20 registros para o PDF também
                  .map(presenca => `
                  <tr>
                    <td>${new Date(presenca.data).toLocaleDateString('pt-BR')}</td>
                    <td class="${presenca.presente ? 'presente' : 'falta'}">
                      ${presenca.presente ? 'Presente' : 'Falta'}
                    </td>
                    <td>${presenca.observacao || '-'}</td>
                  </tr>
                `).join('') : `<tr><td colspan="3" style="text-align: center;">Nenhuma presença registrada.</td></tr>`}
              </tbody>
            </table>
            ${relatorioIndividual.presencas.length > 20 ? '<p><em>Mostrando apenas os últimos 20 registros de presença.</em></p>' : ''}
          </div>

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Sistema de Controle Escolar</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "Sucesso",
        description: "Relatório individual gerado com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao gerar relatório individual:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório individual.",
        variant: "destructive"
      });
    }
  };

  const gerarPDFTurma = () => {
    if (!relatorioTurmaData) {
      toast({
        title: "Erro",
        description: "Nenhum relatório de turma gerado para exportar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .info-section { margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
            .info-item { background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            .table th { background-color: #f2f2f2; }
            .nota-alta { color: #22c55e; font-weight: bold; }
            .nota-media { color: #f59e0b; font-weight: bold; }
            .nota-baixa { color: #ef4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RELATÓRIO DA TURMA</h1>
            <h2>${relatorioTurmaData.turma.nome} - ${relatorioTurmaData.turma.ano}</h2>
          </div>

          <div class="info-section">
            <h3>Estatísticas Gerais da Turma</h3>
            <div class="info-grid">
              <div class="info-item">
                <h4>Total de Alunos</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 0;">${relatorioTurmaData.totalAlunos}</p>
              </div>
              <div class="info-item">
                <h4>Média Geral</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 0;" class="${relatorioTurmaData.mediaGeralTurma >= 7 ? 'nota-alta' : relatorioTurmaData.mediaGeralTurma >= 5 ? 'nota-media' : 'nota-baixa'}">${relatorioTurmaData.mediaGeralTurma}</p>
              </div>
              <div class="info-item">
                <h4>Presença Média</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 0;">${relatorioTurmaData.percentualPresencaTurma}%</p>
              </div>
              <div class="info-item">
                <h4>Aprovados</h4>
                <p style="font-size: 24px; font-weight: bold; margin: 0; color: #22c55e;">${relatorioTurmaData.alunosAprovados}</p>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>Situação dos Alunos</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Matrícula</th>
                  <th>Média</th>
                  <th>Presença</th>
                  <th>Faltas</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                ${relatorioTurmaData.alunos.length > 0 ? relatorioTurmaData.alunos
                  .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome))
                  .map(rel => `
                  <tr>
                    <td>${rel.aluno.nome}</td>
                    <td>${rel.aluno.matricula}</td>
                    <td class="${rel.mediaGeral >= 7 ? 'nota-alta' : rel.mediaGeral >= 5 ? 'nota-media' : 'nota-baixa'}">${rel.mediaGeral}</td>
                    <td>${rel.percentualPresenca}%</td>
                    <td>${rel.faltas}</td>
                    <td class="${rel.mediaGeral >= 7 ? 'nota-alta' : rel.mediaGeral >= 5 ? 'nota-media' : 'nota-baixa'}">
                      ${rel.mediaGeral >= 7 ? 'Aprovado' : rel.mediaGeral >= 5 ? 'Recuperação' : 'Reprovado'}
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="6" style="text-align: center;">Nenhum aluno com dados.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Sistema de Controle Escolar</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "Sucesso",
        description: "Relatório da turma gerado com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao gerar relatório da turma:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório da turma.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Gere relatórios individuais ou por turma</p>
      </div>

      {loadingData ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando dados para relatórios...</p>
        </div>
      ) : (
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Relatório Individual</TabsTrigger>
            <TabsTrigger value="turma">Relatório da Turma</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-6">
            {/* Filtros */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Selecionar Aluno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Turma</label>
                    <Select value={selectedTurma} onValueChange={setSelectedTurma}>
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
                  <div>
                    <label className="text-sm font-medium text-foreground">Aluno</label>
                    <Select
                      value={selectedAluno}
                      onValueChange={setSelectedAluno}
                      disabled={!selectedTurma || alunosFiltradosPorTurma.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {alunosFiltradosPorTurma.map((aluno) => (
                          <SelectItem key={aluno.id} value={aluno.id}>
                            {aluno.nome} - {aluno.matricula}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Relatório Individual */}
            {relatorioIndividual && (
              <Card className="shadow-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center">
                      <User className="mr-2" />
                      Relatório Individual - {relatorioIndividual.aluno.nome}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Matrícula: {relatorioIndividual.aluno.matricula} | Turma: {getTurmaNome(relatorioIndividual.aluno.turmaId)}
                    </p>
                  </div>
                  <Button
                    onClick={gerarPDFIndividual}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Download size={16} className="mr-2" />
                    Gerar PDF
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resumo acadêmico */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <TrendingUp className="mr-2" />
                      Resumo Acadêmico
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{relatorioIndividual.mediaGeral}</p>
                        <p className="text-sm text-muted-foreground">Média Geral</p>
                        <Badge
                          variant={relatorioIndividual.mediaGeral >= 7 ? 'default' : relatorioIndividual.mediaGeral >= 5 ? 'secondary' : 'destructive'}
                          className="mt-1"
                        >
                          {relatorioIndividual.mediaGeral >= 7 ? 'Aprovado' : relatorioIndividual.mediaGeral >= 5 ? 'Recuperação' : 'Reprovado'}
                        </Badge>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{relatorioIndividual.percentualPresenca}%</p>
                        <p className="text-sm text-muted-foreground">Presença</p>
                        <Badge
                          variant={relatorioIndividual.percentualPresenca >= 75 ? 'default' : 'destructive'}
                          className="mt-1"
                        >
                          {relatorioIndividual.percentualPresenca >= 75 ? 'Adequado' : 'Insuficiente'}
                        </Badge>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{relatorioIndividual.totalAulas}</p>
                        <p className="text-sm text-muted-foreground">Total de Aulas</p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{relatorioIndividual.faltas}</p>
                        <p className="text-sm text-muted-foreground">Faltas</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notas */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <Award className="mr-2" />
                      Histórico de Notas ({relatorioIndividual.notas.length})
                    </h3>
                    {relatorioIndividual.notas.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Nenhuma nota lançada ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {relatorioIndividual.notas
                          .sort((a, b) => new Date(b.dataAvaliacao).getTime() - new Date(a.dataAvaliacao).getTime())
                          .map((nota) => (
                            <div key={nota.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">{nota.avaliacao}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(nota.dataAvaliacao).toLocaleDateString('pt-BR')}
                                  {nota.observacao && ` • ${nota.observacao}`}
                                </p>
                              </div>
                              <Badge
                                variant={nota.nota >= 7 ? 'default' : nota.nota >= 5 ? 'secondary' : 'destructive'}
                              >
                                {nota.nota}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Presenças */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <Calendar className="mr-2" />
                      Presenças Recentes
                    </h3>
                    {relatorioIndividual.presencas.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Nenhuma presença registrada ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {relatorioIndividual.presencas
                          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .slice(0, 10)
                          .map((presenca) => (
                            <div key={presenca.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div>
                                <p className="font-medium text-foreground">
                                  {new Date(presenca.data).toLocaleDateString('pt-BR')}
                                </p>
                                {presenca.observacao && (
                                  <p className="text-sm text-muted-foreground">{presenca.observacao}</p>
                                )}
                              </div>
                              <Badge variant={presenca.presente ? 'default' : 'destructive'}>
                                {presenca.presente ? 'Presente' : 'Falta'}
                              </Badge>
                            </div>
                          ))}
                        {relatorioIndividual.presencas.length > 10 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            Mostrando apenas os 10 registros mais recentes...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="turma" className="space-y-6">
            {/* Filtros para Turma */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Selecionar Turma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground">Turma</label>
                    <Select value={selectedTurma} onValueChange={setSelectedTurma}>
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
                  <div className="flex items-end">
                    <Button
                      onClick={gerarRelatorioDaTurma}
                      disabled={!selectedTurma || alunosFiltradosPorTurma.length === 0}
                      className="bg-primary hover:bg-primary-hover"
                    >
                      <FileText size={16} className="mr-2" />
                      Gerar Relatório
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Relatório da Turma */}
            {relatorioTurmaData && (
              <Card className="shadow-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center">
                      <Users className="mr-2" />
                      Relatório da Turma - {relatorioTurmaData.turma.nome}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Ano: {relatorioTurmaData.turma.ano} | Total de Alunos: {relatorioTurmaData.totalAlunos}
                    </p>
                  </div>
                  <Button
                    onClick={gerarPDFTurma}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Download size={16} className="mr-2" />
                    Gerar PDF
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Estatísticas gerais */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <TrendingUp className="mr-2" />
                      Estatísticas Gerais
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{relatorioTurmaData.mediaGeralTurma}</p>
                        <p className="text-sm text-muted-foreground">Média Geral</p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{relatorioTurmaData.percentualPresencaTurma}%</p>
                        <p className="text-sm text-muted-foreground">Presença Média</p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-success">{relatorioTurmaData.alunosAprovados}</p>
                        <p className="text-sm text-muted-foreground">Aprovados</p>
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-destructive">{relatorioTurmaData.alunosReprovados}</p>
                        <p className="text-sm text-muted-foreground">Reprovados</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Lista de alunos */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <Award className="mr-2" />
                      Situação dos Alunos
                    </h3>
                    {relatorioTurmaData.alunos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-background border border-border rounded-lg">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Aluno</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Matrícula</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Média</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Presença</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Faltas</th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Situação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {relatorioTurmaData.alunos
                                        .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome))
                                        .map((rel) => (
                                            <tr key={rel.aluno.id} className="border-b border-border hover:bg-muted/30">
                                                <td className="px-4 py-2 text-sm">{rel.aluno.nome}</td>
                                                <td className="px-4 py-2 text-sm">{rel.aluno.matricula}</td>
                                                <td className={`px-4 py-2 text-sm ${rel.mediaGeral >= 7 ? 'text-success' : rel.mediaGeral >= 5 ? 'text-warning' : 'text-destructive'}`}>{rel.mediaGeral}</td>
                                                <td className="px-4 py-2 text-sm">{rel.percentualPresenca}%</td>
                                                <td className="px-4 py-2 text-sm">{rel.faltas}</td>
                                                <td className={`px-4 py-2 text-sm ${rel.mediaGeral >= 7 ? 'text-success' : rel.mediaGeral >= 5 ? 'text-warning' : 'text-destructive'}`}>
                                                    {rel.mediaGeral >= 7 ? 'Aprovado' : rel.mediaGeral >= 5 ? 'Recuperação' : 'Reprovado'}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhum aluno com dados na turma selecionada.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}