import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

interface NotaAluno {
  disciplina: string;
  bimestre1: number;
  bimestre2: number;
  bimestre3: number;
  bimestre4: number;
  media: number;
  status: 'aprovado' | 'recuperacao' | 'reprovado';
  faltas: number;
  cargaHoraria: number;
}

interface Aluno {
  id: string;
  nome: string;
  turma: string;
  numero: number;
  notas: NotaAluno[];
}

export default function BoletimPage() {
  const [alunos] = useState<Aluno[]>([
    {
      id: '1',
      nome: 'Ana Silva Santos',
      turma: '7º Ano A',
      numero: 1,
      notas: [
        {
          disciplina: 'Matemática',
          bimestre1: 8.5,
          bimestre2: 7.0,
          bimestre3: 8.8,
          bimestre4: 9.2,
          media: 8.4,
          status: 'aprovado',
          faltas: 3,
          cargaHoraria: 160
        },
        {
          disciplina: 'Português',
          bimestre1: 9.0,
          bimestre2: 8.5,
          bimestre3: 8.2,
          bimestre4: 9.5,
          media: 8.8,
          status: 'aprovado',
          faltas: 2,
          cargaHoraria: 160
        },
        {
          disciplina: 'História',
          bimestre1: 7.5,
          bimestre2: 6.8,
          bimestre3: 7.2,
          bimestre4: 8.0,
          media: 7.4,
          status: 'aprovado',
          faltas: 5,
          cargaHoraria: 120
        },
        {
          disciplina: 'Geografia',
          bimestre1: 6.0,
          bimestre2: 5.5,
          bimestre3: 6.8,
          bimestre4: 7.2,
          media: 6.4,
          status: 'recuperacao',
          faltas: 8,
          cargaHoraria: 120
        },
        {
          disciplina: 'Ciências',
          bimestre1: 8.0,
          bimestre2: 7.5,
          bimestre3: 8.3,
          bimestre4: 8.7,
          media: 8.1,
          status: 'aprovado',
          faltas: 1,
          cargaHoraria: 120
        }
      ]
    },
    {
      id: '2',
      nome: 'Bruno Costa Lima',
      turma: '7º Ano A',
      numero: 2,
      notas: [
        {
          disciplina: 'Matemática',
          bimestre1: 5.5,
          bimestre2: 6.0,
          bimestre3: 5.8,
          bimestre4: 6.2,
          media: 5.9,
          status: 'recuperacao',
          faltas: 12,
          cargaHoraria: 160
        },
        {
          disciplina: 'Português',
          bimestre1: 7.0,
          bimestre2: 6.5,
          bimestre3: 7.2,
          bimestre4: 7.8,
          media: 7.1,
          status: 'aprovado',
          faltas: 6,
          cargaHoraria: 160
        },
        {
          disciplina: 'História',
          bimestre1: 8.0,
          bimestre2: 7.5,
          bimestre3: 8.2,
          bimestre4: 8.5,
          media: 8.1,
          status: 'aprovado',
          faltas: 4,
          cargaHoraria: 120
        },
        {
          disciplina: 'Geografia',
          bimestre1: 6.5,
          bimestre2: 7.0,
          bimestre3: 6.8,
          bimestre4: 7.2,
          media: 6.9,
          status: 'aprovado',
          faltas: 7,
          cargaHoraria: 120
        },
        {
          disciplina: 'Ciências',
          bimestre1: 4.5,
          bimestre2: 5.0,
          bimestre3: 4.8,
          bimestre4: 5.2,
          media: 4.9,
          status: 'reprovado',
          faltas: 15,
          cargaHoraria: 120
        }
      ]
    }
  ]);

  const [alunoSelecionado, setAlunoSelecionado] = useState<string>(alunos[0]?.id || '');
  const [turmas] = useState(['6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B', '8º Ano A', '8º Ano B']);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('7º Ano A');

  const alunosFiltrados = alunos.filter(aluno => aluno.turma === turmaSelecionada);
  const aluno = alunosFiltrados.find(a => a.id === alunoSelecionado);

  const getStatusColor = (status: NotaAluno['status']) => {
    switch (status) {
      case 'aprovado':
        return 'bg-success text-success-foreground';
      case 'recuperacao':
        return 'bg-warning text-warning-foreground';
      case 'reprovado':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: NotaAluno['status']) => {
    switch (status) {
      case 'aprovado':
        return 'Aprovado';
      case 'recuperacao':
        return 'Recuperação';
      case 'reprovado':
        return 'Reprovado';
      default:
        return 'Pendente';
    }
  };

  const getPercentualPresenca = (faltas: number, cargaHoraria: number) => {
    const totalAulas = cargaHoraria / 4; // Assumindo 4 horas/aula por semana
    return Math.max(0, ((totalAulas - faltas) / totalAulas) * 100);
  };

  const getTendencia = (notas: number[]) => {
    const ultimasNotas = notas.slice(-2);
    if (ultimasNotas.length < 2) return 'stable';
    return ultimasNotas[1] > ultimasNotas[0] ? 'up' : ultimasNotas[1] < ultimasNotas[0] ? 'down' : 'stable';
  };

  const estatisticasGerais = aluno ? {
    mediaGeral: (aluno.notas.reduce((acc, nota) => acc + nota.media, 0) / aluno.notas.length).toFixed(1),
    disciplinasAprovadas: aluno.notas.filter(n => n.status === 'aprovado').length,
    disciplinasRecuperacao: aluno.notas.filter(n => n.status === 'recuperacao').length,
    disciplinasReprovadas: aluno.notas.filter(n => n.status === 'reprovado').length,
    totalFaltas: aluno.notas.reduce((acc, nota) => acc + nota.faltas, 0)
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boletim Online</h1>
          <p className="text-muted-foreground">Visualização completa das notas dos alunos</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary-hover">
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {turmas.map(turma => (
              <SelectItem key={turma} value={turma}>{turma}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione um aluno" />
          </SelectTrigger>
          <SelectContent>
            {alunosFiltrados.map(aluno => (
              <SelectItem key={aluno.id} value={aluno.id}>
                {aluno.numero.toString().padStart(2, '0')} - {aluno.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {aluno && (
        <>
          {/* Informações do Aluno */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Boletim de {aluno.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="text-lg font-semibold">{aluno.numero.toString().padStart(2, '0')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turma</p>
                  <p className="text-lg font-semibold">{aluno.turma}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Geral</p>
                  <p className="text-lg font-semibold">{estatisticasGerais?.mediaGeral}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Faltas</p>
                  <p className="text-lg font-semibold">{estatisticasGerais?.totalFaltas}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Situação</p>
                  <div className="flex items-center gap-1">
                    {estatisticasGerais?.disciplinasReprovadas === 0 && estatisticasGerais?.disciplinasRecuperacao === 0 ? (
                      <Award className="h-4 w-4 text-success" />
                    ) : estatisticasGerais?.disciplinasReprovadas > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                    <span className="text-sm font-medium">
                      {estatisticasGerais?.disciplinasReprovadas === 0 && estatisticasGerais?.disciplinasRecuperacao === 0 
                        ? 'Aprovado' 
                        : estatisticasGerais?.disciplinasReprovadas > 0 
                        ? 'Pendências' 
                        : 'Recuperação'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aprovadas</p>
                    <p className="text-2xl font-bold text-success">{estatisticasGerais?.disciplinasAprovadas}</p>
                  </div>
                  <Award className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recuperação</p>
                    <p className="text-2xl font-bold text-warning">{estatisticasGerais?.disciplinasRecuperacao}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reprovadas</p>
                    <p className="text-2xl font-bold text-destructive">{estatisticasGerais?.disciplinasReprovadas}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Média Geral</p>
                    <p className="text-2xl font-bold">{estatisticasGerais?.mediaGeral}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Notas por Disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="text-center">1º Bim</TableHead>
                    <TableHead className="text-center">2º Bim</TableHead>
                    <TableHead className="text-center">3º Bim</TableHead>
                    <TableHead className="text-center">4º Bim</TableHead>
                    <TableHead className="text-center">Média</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead className="text-center">Presença</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Tendência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aluno.notas.map((nota) => {
                    const percentualPresenca = getPercentualPresenca(nota.faltas, nota.cargaHoraria);
                    const tendencia = getTendencia([nota.bimestre1, nota.bimestre2, nota.bimestre3, nota.bimestre4]);
                    
                    return (
                      <TableRow key={nota.disciplina}>
                        <TableCell className="font-medium">{nota.disciplina}</TableCell>
                        <TableCell className="text-center">{nota.bimestre1.toFixed(1)}</TableCell>
                        <TableCell className="text-center">{nota.bimestre2.toFixed(1)}</TableCell>
                        <TableCell className="text-center">{nota.bimestre3.toFixed(1)}</TableCell>
                        <TableCell className="text-center">{nota.bimestre4.toFixed(1)}</TableCell>
                        <TableCell className="text-center font-semibold">{nota.media.toFixed(1)}</TableCell>
                        <TableCell className="text-center">{nota.faltas}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <Progress value={percentualPresenca} className="w-16 h-2" />
                            <span className="text-xs">{percentualPresenca.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusColor(nota.status)}>
                            {getStatusText(nota.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {tendencia === 'up' && <TrendingUp className="h-4 w-4 text-success mx-auto" />}
                          {tendencia === 'down' && <TrendingDown className="h-4 w-4 text-destructive mx-auto" />}
                          {tendencia === 'stable' && <div className="h-4 w-4 bg-muted rounded mx-auto" />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}