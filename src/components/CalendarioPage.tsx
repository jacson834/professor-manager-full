import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: Date;
  hora: string;
  tipo: 'evento' | 'feriado' | 'reuniao' | 'prova';
  local?: string;
  turmas?: string[];
}

const tiposEvento = {
  evento: { label: 'Evento', color: 'bg-blue-500' },
  feriado: { label: 'Feriado', color: 'bg-red-500' },
  reuniao: { label: 'Reunião', color: 'bg-green-500' },
  prova: { label: 'Prova', color: 'bg-orange-500' }
};

export default function CalendarioPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventos, setEventos] = useState<Evento[]>([
    {
      id: '1',
      titulo: 'Reunião de Pais',
      descricao: 'Reunião bimestral com os pais dos alunos',
      data: new Date(2024, 11, 15),
      hora: '19:00',
      tipo: 'reuniao',
      local: 'Auditório Principal',
      turmas: ['6º Ano A', '6º Ano B']
    },
    {
      id: '2',
      titulo: 'Prova de Matemática',
      descricao: 'Avaliação do 4º bimestre',
      data: new Date(2024, 11, 20),
      hora: '08:00',
      tipo: 'prova',
      turmas: ['7º Ano A']
    },
    {
      id: '3',
      titulo: 'Festa Junina',
      descricao: 'Festa tradicional da escola',
      data: new Date(2024, 11, 25),
      hora: '14:00',
      tipo: 'evento',
      local: 'Pátio da Escola'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novoEvento, setNovoEvento] = useState<Partial<Evento>>({
    titulo: '',
    descricao: '',
    data: selectedDate,
    hora: '',
    tipo: 'evento',
    local: '',
    turmas: []
  });

  const eventosDoMes = eventos.filter(evento => 
    selectedDate && 
    evento.data.getMonth() === selectedDate.getMonth() &&
    evento.data.getFullYear() === selectedDate.getFullYear()
  );

  const eventosDoDia = eventos.filter(evento => 
    selectedDate && 
    evento.data.toDateString() === selectedDate.toDateString()
  );

  const handleSalvarEvento = () => {
    if (!novoEvento.titulo || !novoEvento.data) return;

    const evento: Evento = {
      id: Date.now().toString(),
      titulo: novoEvento.titulo,
      descricao: novoEvento.descricao || '',
      data: novoEvento.data,
      hora: novoEvento.hora || '08:00',
      tipo: novoEvento.tipo as Evento['tipo'],
      local: novoEvento.local,
      turmas: novoEvento.turmas
    };

    setEventos([...eventos, evento]);
    setNovoEvento({
      titulo: '',
      descricao: '',
      data: selectedDate,
      hora: '',
      tipo: 'evento',
      local: '',
      turmas: []
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendário Escolar</h1>
          <p className="text-muted-foreground">Gerencie eventos, feriados, reuniões e provas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Evento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={novoEvento.titulo}
                  onChange={(e) => setNovoEvento({...novoEvento, titulo: e.target.value})}
                  placeholder="Nome do evento"
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={novoEvento.descricao}
                  onChange={(e) => setNovoEvento({...novoEvento, descricao: e.target.value})}
                  placeholder="Detalhes do evento"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={novoEvento.tipo} onValueChange={(value) => setNovoEvento({...novoEvento, tipo: value as Evento['tipo']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tiposEvento).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="hora">Horário</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={novoEvento.hora}
                    onChange={(e) => setNovoEvento({...novoEvento, hora: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="local">Local</Label>
                <Input
                  id="local"
                  value={novoEvento.local}
                  onChange={(e) => setNovoEvento({...novoEvento, local: e.target.value})}
                  placeholder="Local do evento"
                />
              </div>
              
              <Button onClick={handleSalvarEvento} className="w-full">
                Salvar Evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Eventos do Dia */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione uma data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventosDoDia.length > 0 ? (
              <div className="space-y-4">
                {eventosDoDia.map((evento) => (
                  <div key={evento.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            className={`${tiposEvento[evento.tipo].color} text-white`}
                          >
                            {tiposEvento[evento.tipo].label}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {evento.hora}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-foreground">{evento.titulo}</h3>
                        {evento.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{evento.descricao}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {evento.local && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {evento.local}
                            </span>
                          )}
                          {evento.turmas && evento.turmas.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {evento.turmas.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum evento agendado para este dia
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de Eventos do Mês */}
      <Card>
        <CardHeader>
          <CardTitle>
            Eventos de {selectedDate && format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventosDoMes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventosDoMes.map((evento) => (
                <div key={evento.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${tiposEvento[evento.tipo].color} text-white`}>
                      {tiposEvento[evento.tipo].label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(evento.data, "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-1">{evento.titulo}</h3>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {evento.hora}
                    </div>
                    {evento.local && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {evento.local}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum evento neste mês
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}