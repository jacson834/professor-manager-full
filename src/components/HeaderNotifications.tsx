import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  eventosApi,
  alunosApi,
  notasApi,
  presencasApi,
  EventoAgenda,
  Aluno, Nota, Presenca
} from '@/lib/database';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

interface SystemNotification {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'risk' | 'low-grades' | 'low-presence' | 'general';
  date?: string;
  isRead?: boolean;
  lastReadDate?: string;
}

export function HeaderNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const notificationsRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(notificationsRef, () => setIsOpen(false));

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

  const generateNotifications = useCallback((
    allEvents: EventoAgenda[],
    allAlunos: Aluno[],
    allNotas: Nota[],
    allPresencas: Presenca[]
  ) => {
    const newNotifications: SystemNotification[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    allEvents.forEach(event => {
      const eventDateTime = new Date(`${event.data}T${event.horario}`);
      const eventDateOnly = new Date(event.data);
      eventDateOnly.setHours(0, 0, 0, 0);

      if (eventDateOnly.getTime() >= now.getTime() && eventDateOnly.getTime() <= new Date(now.getTime()).setDate(now.getDate() + 2)) {
          newNotifications.push({
             id: `event-${event.id}`,
             title: `Evento: ${event.titulo}`,
             description: `Seu evento "${event.titulo}" (${event.tipo}) está agendado para ${format(eventDateTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`,
             type: 'event',
             date: event.data,
             isRead: false,
           });
      }
    });

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
        newNotifications.push({
          id: `low-grade-${aluno.id}`,
          title: `Aluno em Atenção: ${aluno.nome}`,
          description: `Média geral de ${aluno.nome} está baixa: ${mediaGeral.toFixed(1)}.`,
          type: 'low-grades',
          date: new Date().toISOString().split('T')[0],
          isRead: false,
        });
      }
      if (totalAulas > 0 && percentualPresenca < 75) {
        newNotifications.push({
          id: `low-presence-${aluno.id}`,
          title: `Aluno em Atenção: ${aluno.nome}`,
          description: `Presença de ${aluno.nome} está baixa: ${percentualPresenca}%.`,
          type: 'low-presence',
          date: new Date().toISOString().split('T')[0],
          isRead: false,
        });
      }
    });

    setNotifications(prevNotifications => {
      const today = new Date().toISOString().split('T')[0];

      const updatedNotifications = newNotifications.map(newNotif => {
        const existing = prevNotifications.find(p => p.id === newNotif.id);
        if (existing) {
          if (existing.isRead && existing.lastReadDate !== today) {
            return { ...newNotif, isRead: false };
          }
          return { ...newNotif, isRead: existing.isRead, lastReadDate: existing.lastReadDate };
        }
        return newNotif;
      });

      const uniqueNewNotifications = updatedNotifications.filter(newNotif => !prevNotifications.some(p => p.id === newNotif.id));
      
      return [...uniqueNewNotifications, ...prevNotifications].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    });
  }, []);

  useEffect(() => {
    const checkAndGenerate = async () => {
      const { allEvents, allAlunos, allNotas, allPresencas } = await fetchAllRelevantData();
      generateNotifications(allEvents, allAlunos, allNotas, allPresencas);
    };

    checkAndGenerate();
    const intervalId = setInterval(checkAndGenerate, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchAllRelevantData, generateNotifications]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAsRead = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setNotifications(currentNotifications =>
      currentNotifications.map(n =>
        n.id === id ? { ...n, isRead: true, lastReadDate: today } : n
      )
    );
  };

  const markAllAsRead = () => {
    const today = new Date().toISOString().split('T')[0];
    setNotifications(currentNotifications =>
      currentNotifications.map(n => ({ ...n, isRead: true, lastReadDate: today }))
    );
  };

  return (
    <div className="relative" ref={notificationsRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <BellRing className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-destructive text-white text-xs rounded-full px-1 font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-80 bg-popover rounded-md shadow-md z-50 overflow-hidden border border-border"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Notificações</h2>
            {notifications.some(n => !n.isRead) && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" /> Marcar tudo como lido
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-border ${
                    !notification.isRead ? 'bg-accent hover:bg-accent-foreground/10' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                      {notification.date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(notification.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })} ({formatDistanceToNowStrict(new Date(notification.date), { addSuffix: true, locale: ptBR })})
                        </p>
                      )}
                    </div>
                    {!notification.isRead && (
                      <Button variant="ghost" size="icon" onClick={() => markAsRead(notification.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma notificação por enquanto.
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
