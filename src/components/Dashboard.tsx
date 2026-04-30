import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  professoresApi,
  turmasApi,
  alunosApi,
  presencasApi,
  notasApi,
  eventosApi,
} from '@/lib/database';
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Info,
  ClipboardCheck,
  Edit3,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProfessores: 0,
    totalTurmas: 0,
    totalAlunos: 0,
    totalPresencas: 0,
    totalNotas: 0,
    mediaGeral: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const { toast } = useToast();

  const loadStats = useCallback(async () => {
    try {
      const professorId = user?.role === 'professor' ? user.professorId : undefined;
      const [professores, turmas, alunos, presencas, notas] = await Promise.all([
        professoresApi.getProfessores(),
        turmasApi.getTurmas(professorId),
        alunosApi.getAlunos(professorId),
        presencasApi.getPresencas(),
        notasApi.getNotas()
      ]);

      const mediaGeral = notas.length > 0
        ? notas.reduce((acc, nota) => acc + nota.nota, 0) / notas.length
        : 0;

      setStats({
        totalProfessores: professores.length,
        totalTurmas: turmas.length,
        totalAlunos: alunos.length,
        totalPresencas: presencas.length,
        totalNotas: notas.length,
        mediaGeral: Math.round(mediaGeral * 10) / 10
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas do dashboard:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const loadRecentActivities = useCallback(async () => {
    try {
      const professorId = user?.role === 'professor' ? user.professorId : undefined;
      const [allNotas, allPresencas, allAlunos, allTurmas] = await Promise.all([
        notasApi.getNotas(),
        presencasApi.getPresencas(),
        alunosApi.getAlunos(professorId),
        turmasApi.getTurmas(professorId)
      ]);

      const latestNotas = allNotas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
      const latestPresencas = allPresencas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

      const activities = [
        ...latestNotas.map(nota => {
          const aluno = allAlunos.find(a => a.id === nota.alunoId);
          const turma = allTurmas.find(t => t.id === nota.turmaId);
          return {
            type: 'nota',
            description: `Nota ${nota.nota} lançada para ${aluno?.nome || 'Aluno Desconhecido'} - ${turma?.nome || 'Turma Desconhecida'}`,
            date: nota.createdAt,
            value: nota.nota
          };
        }),
        ...latestPresencas.map(presenca => {
          const aluno = allAlunos.find(a => a.id === presenca.alunoId);
          const turma = allTurmas.find(t => t.id === presenca.turmaId);
          return {
            type: 'presenca',
            description: `Presença ${presenca.presente ? 'confirmada' : 'falta'} - ${aluno?.nome || 'Aluno Desconhecido'} (${turma?.nome || 'Turma Desconhecida'})`,
            date: presenca.createdAt,
            presente: presenca.presente
          };
        })
      ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

      setRecentActivities(activities);
    } catch (error) {
      console.error("Erro ao carregar atividades recentes do dashboard:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar atividades recentes.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const loadUpcomingEvents = useCallback(async () => {
    try {
      const allEvents = await eventosApi.getEventos();
      const today = new Date().toISOString().split('T')[0];

      const futureEvents = allEvents
        .filter(event => event.data >= today)
        .sort((a, b) => {
          const dateTimeA = new Date(`${a.data}T${a.horario}`).getTime();
          const dateTimeB = new Date(`${b.data}T${b.horario}`).getTime();
          return dateTimeA - dateTimeB;
        })
        .slice(0, 5);

      setUpcomingEvents(futureEvents);
    } catch (error) {
      console.error("Erro ao carregar eventos próximos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar eventos da agenda.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
    loadRecentActivities();
    loadUpcomingEvents();
  }, [loadStats, loadRecentActivities, loadUpcomingEvents]);

  const statsCards = [
    ...(user?.role === 'admin' ? [{
      title: 'Total de Professores',
      value: stats.totalProfessores,
      icon: GraduationCap,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }] : []),
    {
      title: 'Total de Turmas',
      value: stats.totalTurmas,
      icon: BookOpen,
      color: 'text-foreground',
      bgColor: 'bg-muted'
    },
    {
      title: 'Total de Alunos',
      value: stats.totalAlunos,
      icon: Users,
      color: 'text-foreground',
      bgColor: 'bg-muted'
    },
    {
      title: 'Presenças',
      value: stats.totalPresencas,
      icon: Calendar,
      color: 'text-foreground',
      bgColor: 'bg-muted'
    },
    {
      title: 'Notas Lançadas',
      value: stats.totalNotas,
      icon: Award,
      color: 'text-foreground',
      bgColor: 'bg-muted'
    },
    {
      title: 'Média Geral',
      value: stats.mediaGeral || '—',
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Centro de Comando</h1>
          <p className="text-muted-foreground">
            Visão geral técnica e acesso rápido
          </p>
        </div>
        <div className="flex gap-3">
           <Button asChild size="lg" className="h-12 bg-primary text-primary-foreground hover:bg-primary-hover shadow-none rounded-sm">
             <Link to="/presenca">
               <ClipboardCheck className="mr-2 h-5 w-5" />
               Fazer Chamada
             </Link>
           </Button>
           <Button asChild size="lg" variant="secondary" className="h-12 shadow-none rounded-sm border border-border">
             <Link to="/turmas">
               <Edit3 className="mr-2 h-5 w-5" />
               Lançar Notas
             </Link>
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cards de estatísticas (Densos) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="rounded-sm border-border shadow-none bg-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 text-muted-foreground`} />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-3xl font-mono font-bold text-foreground">
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Atividades recentes */}
          <Card className="rounded-sm border-border shadow-none bg-card">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fluxo de Dados Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  Sem fluxo de dados recente.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          {new Date(activity.date).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {activity.type === 'nota' && (
                          <Badge variant="outline" className="font-mono rounded-sm text-xs">
                            VAL: {activity.value}
                          </Badge>
                        )}
                        {activity.type === 'presenca' && (
                          <Badge variant="outline" className={`font-mono rounded-sm text-xs ${activity.presente ? 'text-primary border-primary/50' : 'text-destructive border-destructive/50'}`}>
                            {activity.presente ? 'PRSN' : 'FLTA'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral (1/3) - Agenda */}
        <div className="space-y-6">
          <Card className="rounded-sm border-border shadow-none bg-card h-full">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Agenda & Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  Cronograma vazio.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors border-l-2 border-l-transparent hover:border-l-primary">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm text-foreground">{event.title}</p>
                        <Badge variant="secondary" className="uppercase text-[10px] rounded-sm font-mono tracking-wider">
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(event.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {event.horario}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-4 border-t border-border">
                <Button variant="ghost" className="w-full text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary" asChild>
                  <Link to="/agenda">
                    Ver Cronograma Completo <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}