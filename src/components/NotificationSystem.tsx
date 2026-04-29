import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  eventosApi,
  alunosApi,
  notasApi,
  presencasApi,
  Turma, Aluno, Nota, Presenca, EventoAgenda // Importar interfaces
} from '@/lib/database';
import { BellRing, AlertTriangle, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SystemAlert {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'risk' | 'low-grades' | 'low-presence' | 'general';
  date?: string;
}

export function NotificationSystem() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);

  const fetchAllRelevantData = useCallback(async () => {
    try {
      const [allEvents, allAlunos, allNotas, allPresencas] = await Promise.all([
        eventosApi.getEventos(),
        alunosApi.getAlunos(),
        notasApi.getNotas(),
        presencasApi.getPresencas(),
      ]);
      return { allEvents, allAlunos, allNotas, allPresencas };
    } catch (error) {
      console.error("Erro ao buscar dados para notificações:", error);
      toast({
        title: "Erro nas Notificações",
        description: "Falha ao carregar dados para gerar alertas.",
        variant: "destructive"
      });
      return { allEvents: [], allAlunos: [], allNotas: [], allPresencas: [] };
    }
  }, [toast]);

  const generateAlerts = useCallback((
    allEvents: EventoAgenda[],
    allAlunos: Aluno[],
    allNotas: Nota[],
    allPresencas: Presenca[]
  ) => {
    const newAlerts: SystemAlert[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // --- Alertas de Eventos Próximos ---
    allEvents.forEach(event => {
      const eventDateTime = new Date(`${event.data}T${event.horario}`);
      const eventDateOnly = new Date(event.data);
      eventDateOnly.setHours(0, 0, 0, 0);

      if (eventDateOnly.getTime() === now.getTime() && eventDateTime.getTime() > new Date().getTime()) {
        newAlerts.push({
          id: `event-today-${event.id}`,
          title: `Evento Hoje: ${event.titulo}`,
          description: `Seu evento "${event.titulo}" (${event.tipo}) está agendado para ${format(eventDateTime, 'HH:mm', { locale: ptBR })}.`,
          type: 'event',
          date: event.data
        });
      }
      else if (eventDateOnly.getTime() === tomorrow.getTime()) {
        newAlerts.push({
          id: `event-tomorrow-${event.id}`,
          title: `Evento Amanhã: ${event.titulo}`,
          description: `Lembrete: "${event.titulo}" (${event.tipo}) amanhã às ${format(eventDateTime, 'HH:mm', { locale: ptBR })}.`,
          type: 'event',
          date: event.data
        });
      }
      else if (eventDateOnly.getTime() === dayAfterTomorrow.getTime()) {
        newAlerts.push({
          id: `event-soon-${event.id}`,
          title: `Evento Breve: ${event.titulo}`,
          description: `Seu evento "${event.titulo}" está agendado para ${format(eventDateTime, 'dd/MM', { locale: ptBR })}.`,
          type: 'event',
          date: event.data
        });
      }
    });

    // --- Alertas de Alunos em Risco (Simplificado) ---
    allAlunos.forEach(aluno => {
      const notasAluno = allNotas.filter(n => n.alunoId === aluno.id);
      const presencasAluno = allPresencas.filter(p => p.alunoId === aluno.id);

      const mediaGeral = notasAluno.length > 0
        ? notasAluno.reduce((acc, nota) => acc + nota.nota, 0) / notasAluno.length
        : 0;
      const totalAulas = presencasAluno.length;
      const presentes = presencasAluno.filter(p => p.presente).length;
      const percentualPresenca = totalAulas > 0 ? Math.round((presentes / totalAulas) * 100) : 100;

      if (mediaGeral > 0 && mediaGeral < 6) {
        newAlerts.push({
          id: `low-grade-${aluno.id}`,
          title: `Aluno em Atenção: ${aluno.nome}`,
          description: `Média geral de ${aluno.nome} está baixa: ${mediaGeral.toFixed(1)}.`, // <--- CORREÇÃO AQUI
          type: 'low-grades',
        });
      }
      if (totalAulas > 0 && percentualPresenca < 75) {
        newAlerts.push({
          id: `low-presence-${aluno.id}`,
          title: `Aluno em Atenção: ${aluno.nome}`,
          description: `Presença de ${aluno.nome} está baixa: ${percentualPresenca}%.`,
          type: 'low-presence',
        });
      }
    });

    setAlerts(newAlerts);
  }, []);

  useEffect(() => {
    const checkAndNotify = async () => {
      const currentTime = Date.now();
      if (currentTime - lastCheckTime < 60 * 1000) {
        return;
      }

      const { allEvents, allAlunos, allNotas, allPresencas } = await fetchAllRelevantData();
      generateAlerts(allEvents, allAlunos, allNotas, allPresencas);
      setLastCheckTime(currentTime);
    };

    checkAndNotify();

    const intervalId = setInterval(checkAndNotify, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchAllRelevantData, generateAlerts, lastCheckTime]);


  useEffect(() => {
    alerts.forEach(alert => {
      toast({
        title: alert.title,
        description: alert.description,
        variant: alert.type === 'risk' || alert.type === 'low-grades' || alert.type === 'low-presence' ? 'destructive' : 'default',
        duration: alert.type === 'event' ? 5000 : 8000,
        action: alert.type === 'risk' ? { label: "Ver Aluno", onClick: () => console.log('Navegar para aluno') } : undefined,
      });
    });
  }, [alerts, toast]);

  return null;
}