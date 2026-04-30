import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  turmasApi,
  alunosApi,
  presencasApi,
  Turma, Aluno, Presenca
} from '@/lib/database';
import { Calendar, Users, Check, X, Save, Search, ArrowDownAZ, ArrowUpAZ, Hash, LayoutGrid, Table as TableIcon, Info, Edit, Trash2, ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Definir tipos para os modos de visualização
type ViewMode = 'card' | 'detailed-list';

// Definir tipos para ordenação
type SortCriteria = 'nome' | 'matricula';
type SortDirection = 'asc' | 'desc';

// Definir tipos para busca
type SearchCriteria = 'nome' | 'matricula';

export default function PresencaPage() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [presencaData, setPresencaData] = useState<{[key: string]: {presente: boolean, observacao: string}}>({});
  const { toast } = useToast();

  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchBy, setSearchBy] = useState<SearchCriteria>('nome');

  const [viewMode, setViewMode] = useState<ViewMode>('detailed-list');
  const [pageMode, setPageMode] = useState<'diario' | 'mensal'>('diario');

  const [mesSelecionado, setMesSelecionado] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [presencasMensais, setPresencasMensais] = useState<Presenca[]>([]);
  const [loadingMensal, setLoadingMensal] = useState(false);


  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        const professorId = user?.role === 'professor' ? user.professorId : undefined;
        const data = await turmasApi.getTurmas(professorId);
        setTurmas(data);
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar turmas.",
          variant: "destructive"
        });
      }
    };
    fetchTurmas();
  }, [user]);

  useEffect(() => {
    const fetchAlunosAndPresencas = async () => {
      if (!selectedTurma) return;
      
      try {
        const alunosData = await alunosApi.getAlunosByTurma(selectedTurma);
        setAlunos(alunosData);

        const allPresencasForTurma = await presencasApi.getPresencasByTurma(selectedTurma);
        const presencasDate = allPresencasForTurma.filter(p => p.data === selectedDate);
        setPresencas(presencasDate);

        const data: {[key: string]: {presente: boolean, observacao: string}} = {};
        alunosData.forEach(aluno => {
          const existingPresenca = presencasDate.find(p => p.alunoId === aluno.id);
          data[aluno.id] = {
            presente: existingPresenca ? existingPresenca.presente : false,
            observacao: existingPresenca ? existingPresenca.observacao || '' : ''
          };
        });
        setPresencaData(data);
      } catch (error) {
        console.error("Erro ao carregar dados de presença:", error);
      }
    };

    fetchAlunosAndPresencas();
  }, [selectedTurma, selectedDate]);

  useEffect(() => {
    const fetchPresencasMensais = async () => {
      if (!selectedTurma || pageMode !== 'mensal') return;
      
      try {
        const allPresencas = await presencasApi.getPresencasByTurma(selectedTurma);
        const mesStr = mesSelecionado;
        const presencasDoMes = allPresencas.filter(p => p.data.startsWith(mesStr));
        setPresencasMensais(presencasDoMes);
      } catch (error) {
        console.error("Erro ao carregar presenças mensais:", error);
      }
    };

    fetchPresencasMensais();
  }, [selectedTurma, mesSelecionado, pageMode]);

  const handleSavePresencas = async () => {
    if (!selectedTurma || !selectedDate) {
      toast({
        title: "Erro",
        description: "Selecione uma turma e data.",
        variant: "destructive"
      });
      return;
    }

    try {
      const existingPresencas = await presencasApi.getPresencasByTurma(selectedTurma);
      const presencasForCurrentDate = existingPresencas.filter(p => p.data === selectedDate);

      for (const aluno of filteredAndSortedAlunos) {
        const dadosPresenca = presencaData[aluno.id];
        const existingRecord = presencasForCurrentDate.find(p => p.alunoId === aluno.id);

        if (dadosPresenca !== undefined) {
          const presenteStatus = Boolean(dadosPresenca.presente);

          if (existingRecord) {
            await presencasApi.updatePresenca(existingRecord.id, {
              alunoId: aluno.id,
              turmaId: selectedTurma,
              data: selectedDate,
              presente: presenteStatus,
              observacao: dadosPresenca.observacao
            });
          } else {
            await presencasApi.addPresenca({
              alunoId: aluno.id,
              turmaId: selectedTurma,
              data: selectedDate,
              presente: presenteStatus,
              observacao: dadosPresenca.observacao
            });
          }
        }
      }

      toast({
        title: "Sucesso",
        description: "Presenças salvas com sucesso!"
      });

      await fetchAlunosAndPresencasOnSave();
    } catch (error: any) {
      console.error("Erro ao salvar presenças:", error);
      let errorMessage = "Erro ao salvar presenças.";
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

  const fetchAlunosAndPresencasOnSave = async () => {
    if (selectedTurma) {
      try {
        const alunosData = await alunosApi.getAlunosByTurma(selectedTurma);
        setAlunos(alunosData);

        const allPresencasForTurma = await presencasApi.getPresencasByTurma(selectedTurma);

        const data: {[key: string]: {presente: boolean, observacao: string}} = {};
        const presencasDate = allPresencasForTurma.filter(p => p.data === selectedDate);
        
        alunosData.forEach(aluno => {
          const existingPresenca = presencasDate.find(p => p.alunoId === aluno.id);
          data[aluno.id] = {
            presente: existingPresenca ? existingPresenca.presente : false,
            observacao: existingPresenca ? existingPresenca.observacao || '' : ''
          };
        });
        
        setPresencaData(data);
        setPresencas(presencasDate);
      } catch (error) {
        console.error("Erro ao recarregar dados após salvar:", error);
      }
    }
  };

  const handlePresencaChange = (alunoId: string, presente: boolean) => {
    setPresencaData(prev => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        presente,
        observacao: prev[alunoId]?.observacao || ''
      }
    }));
  };

  const handleObservacaoChange = (alunoId: string, observacao: string) => {
    setPresencaData(prev => ({
      ...prev,
      [alunoId]: {
        ...prev[alunoId],
        presente: prev[alunoId]?.presente ?? false,
        observacao
      }
    }));
  };

  const exportToPDF = () => {
    if (!selectedTurma || !turmas.find(t => t.id === selectedTurma)) {
      toast({
        title: "Erro",
        description: "Selecione uma turma.",
        variant: "destructive"
      });
      return;
    }

    const turma = turmas.find(t => t.id === selectedTurma);
    const [ano, mes] = mesSelecionado.split('-');
    const mesNome = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleString('pt-BR', { month: 'long' });

    const doc = new jsPDF('l');
    
    doc.setFontSize(16);
    doc.text(`Relatório de Presenças - ${turma?.nome}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`${mesNome} de ${ano}`, 14, 28);

    const tableData = alunos.map(aluno => {
      const presencasAluno = presencasMensais.filter(p => p.alunoId === aluno.id);
      const presentes = presencasAluno.filter(p => p.presente).length;
      const total = presencasAluno.length;
      const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;

      const days: string[] = [];
      for (let d = 1; d <= 31; d++) {
        const dataStr = `${mesSelecionado}-${String(d).padStart(2, '0')}`;
        const p = presencasAluno.find(p => p.data === dataStr);
        days.push(p ? (p.presente ? 'P' : 'F') : '-');
      }

      return [
        aluno.nome,
        aluno.matricula,
        ...days.slice(0, 31),
        `${percentual}%`
      ];
    });

    const header = ['Aluno', 'Matrícula', ...Array.from({ length: 31 }, (_, i) => String(i + 1)), '%'];

    autoTable(doc, {
      head: [header],
      body: tableData,
      startY: 35,
      styles: { fontSize: 6 },
      headStyles: { fontSize: 6, fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 10 },
      }
    });

    doc.save(`presencas_${turma?.nome}_${mesSelecionado}.pdf`);
    
    toast({
      title: "Sucesso",
      description: "PDF exportado com sucesso!"
    });
  };


  // Lógica de Busca e Ordenação
  const filteredAndSortedAlunos = useMemo(() => {
    let currentAlunos = [...alunos]; // Alunos da turma selecionada

    // 1. Aplica a Busca
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentAlunos = currentAlunos.filter(aluno => {
        if (searchBy === 'nome') {
          return aluno.nome.toLowerCase().includes(lowerCaseSearchTerm);
        }
        if (searchBy === 'matricula') {
          return aluno.matricula.toLowerCase().includes(lowerCaseSearchTerm);
        }
        return false;
      });
    }

    // 2. Aplica a Ordenação
    currentAlunos.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      if (sortCriteria === 'nome') {
        valA = a.nome.toLowerCase();
        valB = b.nome.toLowerCase();
      } else { // sortCriteria === 'matricula'
        valA = a.matricula.toLowerCase();
        valB = b.matricula.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return currentAlunos;
  }, [alunos, searchTerm, searchBy, sortCriteria, sortDirection]);


  const getPresencaStats = () => {
    const total = filteredAndSortedAlunos.length;
    const presentes = filteredAndSortedAlunos.filter(aluno => presencaData[aluno.id]?.presente).length;
    const faltas = total - presentes;
    
    return { total, presentes, faltas };
  };

  const stats = getPresencaStats();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controle de Presença</h1>
          <p className="text-muted-foreground">Registre a presença dos alunos</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={pageMode === 'diario' ? 'default' : 'outline'} onClick={() => setPageMode('diario')}>
            <Calendar size={16} className="mr-2" />Diário
          </Button>
          <Button variant={pageMode === 'mensal' ? 'default' : 'outline'} onClick={() => setPageMode('mensal')}>
            <Eye size={16} className="mr-2" />Mensal
          </Button>
        </div>
      </div>

      {/* Filtros, Busca, Ordenação e Modos de Visualização */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Controles de Visualização e Filtro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Filtro por Turma e Data */}
            <div>
              <Label htmlFor="turma">Turma</Label>
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
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          
          <Separator />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Controles de Busca */}
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  className="pl-9 pr-2 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={searchBy} onValueChange={(value) => setSearchBy(value as SearchCriteria)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Buscar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="matricula">Matrícula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Controles de Ordenação */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="sortOrder">Ordenar por:</Label>
              <Select value={sortCriteria} onValueChange={(value) => setSortCriteria(value as SortCriteria)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Critério" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="matricula">Matrícula</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                title="Alternar Direção de Ordenação"
              >
                {sortDirection === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpAZ size={18} />}
              </Button>
            </div>

            {/* Botões de Modo de Visualização */}
            <div className="flex space-x-2 md:ml-auto mt-4 md:mt-0">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('card')}
                title="Visualização em Cards"
              >
                <LayoutGrid size={18} />
              </Button>
              <Button
                variant={viewMode === 'detailed-list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('detailed-list')}
                title="Visualização em Lista Detalhada"
              >
                <TableIcon size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização Mensal */}
      {pageMode === 'mensal' && selectedTurma && (
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between">
              <span>Presenças do Mês</span>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => {
                  const [ano, mes] = mesSelecionado.split('-');
                  const data = new Date(parseInt(ano), parseInt(mes) - 1, 0);
                  data.setMonth(data.getMonth() - 1);
                  setMesSelecionado(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`);
                }}>
                  <ChevronLeft size={18} />
                </Button>
                <Input type="month" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="w-36" />
                <Button variant="ghost" size="icon" onClick={() => {
                  const [ano, mes] = mesSelecionado.split('-');
                  const data = new Date(parseInt(ano), parseInt(mes) - 1, 0);
                  data.setMonth(data.getMonth() + 1);
                  setMesSelecionado(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`);
                }}>
                  <ChevronRight size={18} />
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download size={16} className="mr-1" />
                  PDF
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMensal ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : (
              <>
                {alunos.length === 0 ? (
                  <p className="text-muted-foreground">Selecione uma turma para ver as presenças.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-background border border-border rounded-lg">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">Aluno</th>
                          {Array.from({ length: 31 }, (_, i) => {
                            const dia = i + 1;
                            const data = new Date(parseInt(mesSelecionado.split('-')[0]), parseInt(mesSelecionado.split('-')[1]) - 1, dia);
                            const diaSemana = data.getDay();
                            if (data.getMonth() !== parseInt(mesSelecionado.split('-')[1]) - 1) return null;
                            return (
                              <th key={dia} className={`px-1 py-2 text-center text-xs font-medium border-l border-border/50 ${diaSemana === 0 || diaSemana === 6 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {String(dia).padStart(2, '0')}
                              </th>
                            );
                          })}
                          <th className="px-2 py-2 text-center text-sm font-medium text-muted-foreground">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alunos.map(aluno => {
                          const presencasAluno = presencasMensais.filter(p => p.alunoId === aluno.id);
                          const presentes = presencasAluno.filter(p => p.presente).length;
                          const total = presencasAluno.length;
                          const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0;
                          const prefixo = mesSelecionado + '-';
                          return (
                            <tr key={aluno.id} className="border-b border-border hover:bg-muted/30">
                              <td className="px-3 py-2 text-sm text-foreground font-medium">{aluno.nome}</td>
                              {Array.from({ length: 31 }, (_, i) => {
                                const dia = i + 1;
                                const data = new Date(parseInt(mesSelecionado.split('-')[0]), parseInt(mesSelecionado.split('-')[1]) - 1, dia);
                                if (data.getMonth() !== parseInt(mesSelecionado.split('-')[1]) - 1) return null;
                                const dataStr = `${prefixo}${String(dia).padStart(2, '0')}`;
                                const presenca = presencasAluno.find(p => p.data === dataStr);
                                return (
                                  <td key={dia} className="px-1 py-1 text-center border-l border-border/50">
                                    {presenca ? (
                                      presenca.presente ? (
                                        <Check size={14} className="text-success mx-auto" />
                                      ) : (
                                        <X size={14} className="text-destructive mx-auto" />
                                      )
                                    ) : (
                                      <span className="text-muted-foreground/30">-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-2 py-2 text-center">
                                <span className={`font-bold ${percentual >= 75 ? 'text-success' : percentual >= 50 ? 'text-warning' : 'text-destructive'}`}>
                                  {percentual}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTurma && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Check className="h-8 w-8 text-success mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.presentes}</p>
                    <p className="text-sm text-muted-foreground">Presentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <X className="h-8 w-8 text-destructive mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.faltas}</p>
                    <p className="text-sm text-muted-foreground">Faltas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Renderização Condicional do Modo de Visualização */}
          {pageMode === 'diario' && filteredAndSortedAlunos.length === 0 ? (
            <Card className="col-span-full shadow-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? `Nenhum aluno encontrado para "${searchTerm}"` : 'Nenhum aluno encontrado nesta turma com a data selecionada.'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente outro termo de busca ou critério.' : 'Cadastre alunos nesta turma ou selecione outra data.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Modo de Visualização em Cards */}
              {viewMode === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedAlunos.map((aluno) => {
                    const dadosPresenca = presencaData[aluno.id] || { presente: false, observacao: '' };
                    return (
                      <Card key={aluno.id} className="shadow-card border-border hover:shadow-elegant transition-shadow duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg text-foreground">{aluno.nome}</CardTitle>
                              <div className="flex space-x-2 mt-2">
                                <Badge variant="outline">
                                  {aluno.matricula}
                                </Badge>
                                <Badge
                                  variant={dadosPresenca.presente ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {dadosPresenca.presente ? "Presente" : "Falta"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                type="button"
                                onClick={() => handlePresencaChange(aluno.id, true)}
                                className={`w-8 h-8 rounded border font-bold text-sm ${
                                  dadosPresenca.presente 
                                    ? 'bg-success text-white border-success' 
                                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                }`}
                              >
                                P
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePresencaChange(aluno.id, false)}
                                className={`w-8 h-8 rounded border font-bold text-sm ${
                                  !dadosPresenca.presente && dadosPresenca.presente !== undefined
                                    ? 'bg-destructive text-white border-destructive' 
                                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                }`}
                              >
                                F
                              </button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Label htmlFor={`obs-card-${aluno.id}`} className="mr-1">Obs:</Label>
                            <Input
                              id={`obs-card-${aluno.id}`}
                              placeholder="Observações (opcional)"
                              value={dadosPresenca.observacao}
                              onChange={(e) => handleObservacaoChange(aluno.id, e.target.value)}
                              className="h-8 text-sm flex-1"
                            />
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Cadastrado em {new Date(aluno.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Modo de Visualização em Lista Detalhada (Tabela) */}
              {viewMode === 'detailed-list' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-background border border-border rounded-lg">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nome</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Matrícula</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Observações</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedAlunos.map((aluno) => {
                        const dadosPresenca = presencaData[aluno.id] || { presente: false, observacao: '' };
                        return (
                          <tr key={aluno.id} className="border-b border-border hover:bg-muted/30">
                            <td className="px-4 py-2 text-sm text-foreground">{aluno.nome}</td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">{aluno.matricula}</td>
                            <td className="px-4 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handlePresencaChange(aluno.id, true)}
                                  className={`w-8 h-8 rounded border font-bold text-sm ${
                                    dadosPresenca.presente 
                                      ? 'bg-success text-white border-success' 
                                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                  }`}
                                >
                                  P
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePresencaChange(aluno.id, false)}
                                  className={`w-8 h-8 rounded border font-bold text-sm ${
                                    !dadosPresenca.presente && dadosPresenca.presente !== undefined
                                      ? 'bg-destructive text-white border-destructive' 
                                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                  }`}
                                >
                                  F
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <Textarea
                                placeholder="Observações (opcional)"
                                value={dadosPresenca.observacao}
                                onChange={(e) => handleObservacaoChange(aluno.id, e.target.value)}
                                className="h-12 text-sm w-full"
                              />
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {/* Botões de edição/deleção aqui, se forem aplicáveis no contexto de presença */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => alert(`Ações para ${aluno.nome}`)} // Placeholder
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Info size={16} /> {/* Ícone de informação para ações */}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
      {/* Botões Salvar e Editar no final da página */}
      {pageMode === 'diario' && selectedTurma && (
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            onClick={handleSavePresencas}
            className="bg-primary hover:bg-primary-hover"
          >
            <Save size={16} className="mr-2" />
            Salvar Lançamento de Presenças de Hoje
          </Button>
          <Button
            variant="outline"
            onClick={() => toast({ title: "Editar Presenças", description: "Edite as presenças diretamente nos campos acima para a data e turma selecionadas." })}
          >
            <Edit size={16} className="mr-2" />
            Editar Presenças
          </Button>
        </div>
      )}
    </div>
  );
}