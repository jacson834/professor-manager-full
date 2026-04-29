// src/components/TurmaOverviewPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  turmasApi,
  alunosApi,
  notasApi,
  professoresApi,
  Turma, Aluno, Nota, Professor
} from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, Users, Award, TrendingUp } from 'lucide-react';

// Interface para um aluno com suas notas e projeções
interface AlunoComDesempenho extends Aluno {
  notasPorBimestre: { [key: string]: Nota[] };
  somaPontosBimestral: { [key: string]: number };
  mediaGeralAtual: number;
  mediaFinalProjetada: number;
  situacao: 'Aprovado' | 'Recuperação' | 'Reprovado' | 'Em Andamento';
  statusProjecao: 'Já Aprovado' | 'Reprovado Antecipado' | 'Precisa de X' | 'Em Aberto';
  pontosNecessariosRestantes?: number;
  bimestresCompletos: number;
}

export default function TurmaOverviewPage() {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunosComDesempenho, setAlunosComDesempenho] = useState<AlunoComDesempenho[]>([]);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para obter o nome do professor (continua sendo um useCallback)
  const getProfessorNome = useCallback((professorId: string) => {
    const professor = professores.find(p => p.id === professorId);
    return professor ? professor.nome : 'Professor Desconhecido';
  }, [professores]);


  // Função principal para carregar dados da turma, alunos e notas (agora é um useCallback)
  const loadTurmaData = useCallback(async () => {
    if (!turmaId) {
      toast({ title: "Erro", description: "ID da turma não fornecido.", variant: "destructive" });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [allTurmas, allProfessores, alunosDaTurma, notasDaTurma] = await Promise.all([
        turmasApi.getTurmas(),
        professoresApi.getProfessores(),
        alunosApi.getAlunosByTurma(turmaId),
        notasApi.getNotasByTurma(turmaId)
      ]);

      setProfessores(allProfessores);
      const selectedTurma = allTurmas.find(t => t.id === turmaId);

      if (!selectedTurma) {
        toast({ title: "Erro", description: "Turma não encontrada.", variant: "destructive" });
        setLoading(false);
        return;
      }
      setTurma(selectedTurma);

      const processedAlunos: AlunoComDesempenho[] = alunosDaTurma.map(aluno => {
        const notasDoAluno = notasDaTurma.filter(n => n.alunoId === aluno.id);
        const notasPorBimestre: { [key: string]: Nota[] } = { '1': [], '2': [], '3': [], '4': [] };
        const somaPontosBimestral: { [key: string]: number } = { '1': 0, '2': 0, '3': 0, '4': 0 };
        let somaMediasBimestraisExistentesParaGeral = 0;
        let bimestresCompletos = 0;
        
        let mediaGeralAtual = 0;
        let mediaFinalProjetada = 0;

        for (let i = 1; i <= 4; i++) {
          const bimestreKey = String(i);
          const notasNoBimestre = notasDoAluno.filter(n => n.bimestre === bimestreKey);
          notasPorBimestre[bimestreKey] = notasNoBimestre;

          if (notasNoBimestre.length > 0) {
            const somaNotasBimestre = notasNoBimestre.reduce((acc, n) => acc + n.nota, 0);
            somaPontosBimestral[bimestreKey] = somaNotasBimestre;
            
            const mediaIndividualBimestre = somaNotasBimestre / notasNoBimestre.length;
            somaMediasBimestraisExistentesParaGeral += mediaIndividualBimestre;
            bimestresCompletos++;

          } else {
              somaPontosBimestral[bimestreKey] = 0;
          }
        }

        mediaGeralAtual = bimestresCompletos > 0 ? somaMediasBimestraisExistentesParaGeral / bimestresCompletos : 0;
        mediaFinalProjetada = bimestresCompletos > 0 ? somaMediasBimestraisExistentesParaGeral / bimestresCompletos : 0;


        const minPassingGrade = selectedTurma.minPassingGrade || 6.0;
        const totalBimestres = 4;
        const pontosTotalNecessarios = minPassingGrade * totalBimestres;
        const pontosObtidosAteAgora = somaMediasBimestraisExistentesParaGeral;

        let situacao: 'Aprovado' | 'Recuperação' | 'Reprovado' | 'Em Andamento' = 'Em Andamento';
        let statusProjecao: 'Já Aprovado' | 'Reprovado Antecipado' | 'Precisa de X' | 'Em Aberto' = 'Em Aberto';
        let pontosNecessariosRestantes: number | undefined = undefined;

        const bimestresRestantes = totalBimestres - bimestresCompletos;

        if (bimestresCompletos === totalBimestres) {
            if (mediaGeralAtual >= minPassingGrade) {
                situacao = 'Aprovado';
            } else if (mediaGeralAtual >= minPassingGrade - 1.0) {
                situacao = 'Recuperação';
            } else {
                situacao = 'Reprovado';
            }
            statusProjecao = 'Em Aberto';
        } else {
            if ((pontosObtidosAteAgora + (bimestresRestantes * 0)) / totalBimestres >= minPassingGrade) {
              situacao = 'Aprovado';
              statusProjecao = 'Já Aprovado';
            }
            else if ((pontosObtidosAteAgora + (bimestresRestantes * 10)) / totalBimestres < minPassingGrade) {
              situacao = 'Reprovado';
              statusProjecao = 'Reprovado Antecipado';
            }
            else if (bimestresRestantes > 0) {
              const pontosFaltantes = pontosTotalNecessarios - pontosObtidosAteAgora;
              const mediaNecessariaPorBimestre = pontosFaltantes / bimestresRestantes;

              if (mediaNecessariaPorBimestre <= 10) {
                statusProjecao = 'Precisa de X';
                pontosNecessariosRestantes = Math.round(mediaNecessariaPorBimestre * 10) / 10;
                situacao = 'Em Andamento';
              } else {
                  situacao = 'Recuperação';
                  statusProjecao = 'Reprovado Antecipado';
              }
            }
        }

        return {
          ...aluno,
          notasPorBimestre,
          somaPontosBimestral,
          mediaBimestral: (aluno as any).mediaBimestral || {}, // Mantido para compatibilidade, mas somaPontosBimestral é o foco
          mediaGeralAtual: Math.round(mediaGeralAtual * 10) / 10,
          mediaFinalProjetada: Math.round(mediaFinalProjetada * 10) / 10,
          situacao,
          statusProjecao,
          pontosNecessariosRestantes,
          bimestresCompletos
        };
      });

      setAlunosComDesempenho(processedAlunos.sort((a,b) => a.nome.localeCompare(b.nome)));
      
    } catch (error) {
      console.error("Erro ao carregar dados da turma:", error);
      toast({ title: "Erro", description: "Falha ao carregar visão geral da turma.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [turmaId, toast]); // REMOVIDO getProfessorNome das dependências do useCallback loadTurmaData

  // O useEffect agora só depende de loadTurmaData (que é um useCallback e está estável)
  useEffect(() => {
    loadTurmaData();
  }, [loadTurmaData]);


  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Carregando visão geral da turma...</p>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">Turma não encontrada</h3>
        <Button onClick={() => navigate('/turmas')}>Voltar para Turmas</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => navigate('/turmas')}>
          <ArrowLeft size={16} className="mr-2" /> Voltar para Turmas
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Visão Geral da Turma: {turma.nome}
          </h1>
          <p className="text-muted-foreground">
            Ano: {turma.ano} • Professor: {getProfessorNome(turma.professorId)} • Média Aprovação: {turma.minPassingGrade?.toFixed(1) || 'N/A'}
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Award size={16} className="mr-2" /> Gerar Relatório da Turma
        </Button>
      </div>

      <Separator />

      <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-6 w-6" />
        Desempenho dos Alunos
      </h2>

      {alunosComDesempenho.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum aluno cadastrado nesta turma
            </h3>
            <p className="text-muted-foreground text-center">
              Adicione alunos a esta turma para visualizar o desempenho.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nome do Aluno</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">1º Bim. Pontos</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">2º Bim. Pontos</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">3º Bim. Pontos</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">4º Bim. Pontos</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">Média Geral</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">Média Final Proj.</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Situação</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {alunosComDesempenho.map((aluno) => (
                <tr key={aluno.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-2 text-sm font-medium text-foreground">{aluno.nome}</td>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <td key={i} className={`px-4 py-2 text-sm text-center ${aluno.somaPontosBimestral[String(i + 1)] < (turma?.minPassingGrade || 6.0) && aluno.notasPorBimestre[String(i+1)].length > 0 ? 'text-destructive' : ''}`}>
                      {aluno.notasPorBimestre[String(i + 1)].length > 0
                        ? (aluno.somaPontosBimestral[String(i + 1)]).toFixed(1)
                        : '—'
                      }
                    </td>
                  ))}
                  <td className={`px-4 py-2 text-sm text-center ${aluno.mediaGeralAtual < (turma?.minPassingGrade || 6.0) && aluno.bimestresCompletos > 0 ? 'text-destructive' : ''}`}>
                    {aluno.mediaGeralAtual.toFixed(1)}
                  </td>
                  <td className={`px-4 py-2 text-sm text-center ${aluno.statusProjecao === 'Reprovado Antecipado' ? 'text-destructive' : aluno.statusProjecao === 'Precisa de X' ? 'text-warning' : ''}`}>
                    {aluno.bimestresCompletos === 4
                        ? aluno.mediaFinalProjetada.toFixed(1)
                        : aluno.mediaFinalProjetada.toFixed(1) + (aluno.statusProjecao === 'Reprovado Antecipado' ? '*' : '')
                    }
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <Badge
                      variant={
                        aluno.situacao === 'Aprovado' ? 'default' :
                        aluno.situacao === 'Recuperação' ? 'secondary' :
                        aluno.situacao === 'Reprovado' ? 'destructive' : 'outline'
                      }
                    >
                      {aluno.situacao}
                    </Badge>
                    {aluno.statusProjecao === 'Precisa de X' && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Precisa: {aluno.pontosNecessariosRestantes?.toFixed(1)}
                        </p>
                    )}
                    {aluno.statusProjecao === 'Reprovado Antecipado' && (
                        <p className="text-xs text-destructive mt-1">Reprov. antecipada</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/notas/${turma.id}/${aluno.id}`)}>
                      <Award size={16} /> Notas
                    </Button>
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