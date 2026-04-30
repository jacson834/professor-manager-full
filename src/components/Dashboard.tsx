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
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

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
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Total de Alunos',
      value: stats.totalAlunos,
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: 'Presenças Registradas',
      value: stats.totalPresencas,
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Notas Lançadas',
      value: stats.totalNotas,
      icon: Award,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de controle escolar
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-card border-border hover:shadow-elegant transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seção de Eventos Próximos */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Eventos Próximos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum evento agendado para os próximos dias.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{format(new Date(event.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      <Clock size={14} />
                      <span>{event.horario}</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {event.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atividades recentes */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma atividade registrada ainda.
            </p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activity.type === 'nota' && (
                      <Badge 
                        variant={activity.value >= 7 ? 'default' : activity.value >= 5 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {activity.value}
                      </Badge>
                    )}
                    {activity.type === 'presenca' && (
                      <Badge 
                        variant={activity.presente ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {activity.presente ? 'Presente' : 'Falta'}
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
  );
}