import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Users, BookOpen, Plus, Edit } from 'lucide-react';

interface Aula {
  id: string;
  disciplina: string;
  professor: string;
  turma: string;
  horario: string;
  sala: string;
  diaSemana: number; // 0-6 (domingo-sábado)
}

const diasSemana = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

const horarios = [
  '07:00 - 07:50',
  '07:50 - 08:40',
  '08:40 - 09:30',
  '09:50 - 10:40',
  '10:40 - 11:30',
  '11:30 - 12:20',
  '13:00 - 13:50',
  '13:50 - 14:40',
  '14:40 - 15:30',
  '15:50 - 16:40'
];

export default function HorariosPage() {
  const [aulas, setAulas] = useState<Aula[]>([
    {
      id: '1',
      disciplina: 'Matemática',
      professor: 'Prof. João Silva',
      turma: '7º Ano A',
      horario: '07:00 - 07:50',
      sala: 'Sala 101',
      diaSemana: 1
    },
    {
      id: '2',
      disciplina: 'Português',
      professor: 'Profa. Maria Santos',
      turma: '7º Ano A',
      horario: '07:50 - 08:40',
      sala: 'Sala 102',
      diaSemana: 1
    },
    {
      id: '3',
      disciplina: 'História',
      professor: 'Prof. Carlos Lima',
      turma: '7º Ano A',
      horario: '08:40 - 09:30',
      sala: 'Sala 103',
      diaSemana: 1
    },
    {
      id: '4',
      disciplina: 'Matemática',
      professor: 'Prof. João Silva',
      turma: '8º Ano B',
      horario: '09:50 - 10:40',
      sala: 'Sala 101',
      diaSemana: 1
    }
  ]);

  const [turmas] = useState(['6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B', '8º Ano A', '8º Ano B', '9º Ano A', '9º Ano B']);
  const [professores] = useState(['Prof. João Silva', 'Profa. Maria Santos', 'Prof. Carlos Lima', 'Profa. Ana Costa']);
  const [disciplinas] = useState(['Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Inglês', 'Educação Física']);

  const [visualizacao, setVisualizacao] = useState<'turma' | 'professor'>('turma');
  const [filtroSelecionado, setFiltroSelecionado] = useState<string>('7º Ano A');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novaAula, setNovaAula] = useState<Partial<Aula>>({
    disciplina: '',
    professor: '',
    turma: '',
    horario: '',
    sala: '',
    diaSemana: 1
  });

  const aulasFiltradas = aulas.filter(aula => 
    visualizacao === 'turma' ? aula.turma === filtroSelecionado : aula.professor === filtroSelecionado
  );

  const getAulaPorDiaHorario = (dia: number, horario: string) => {
    return aulasFiltradas.find(aula => aula.diaSemana === dia && aula.horario === horario);
  };

  const handleSalvarAula = () => {
    if (!novaAula.disciplina || !novaAula.professor || !novaAula.turma || !novaAula.horario) return;

    const aula: Aula = {
      id: Date.now().toString(),
      disciplina: novaAula.disciplina!,
      professor: novaAula.professor!,
      turma: novaAula.turma!,
      horario: novaAula.horario!,
      sala: novaAula.sala || '',
      diaSemana: novaAula.diaSemana || 1
    };

    setAulas([...aulas, aula]);
    setNovaAula({
      disciplina: '',
      professor: '',
      turma: '',
      horario: '',
      sala: '',
      diaSemana: 1
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Horários de Aula</h1>
          <p className="text-muted-foreground">Grade horária por turma e professor</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Aula</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Disciplina</Label>
                <Select value={novaAula.disciplina} onValueChange={(value) => setNovaAula({...novaAula, disciplina: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinas.map(disciplina => (
                      <SelectItem key={disciplina} value={disciplina}>{disciplina}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Professor</Label>
                <Select value={novaAula.professor} onValueChange={(value) => setNovaAula({...novaAula, professor: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map(professor => (
                      <SelectItem key={professor} value={professor}>{professor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Turma</Label>
                <Select value={novaAula.turma} onValueChange={(value) => setNovaAula({...novaAula, turma: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map(turma => (
                      <SelectItem key={turma} value={turma}>{turma}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dia da Semana</Label>
                  <Select value={novaAula.diaSemana?.toString()} onValueChange={(value) => setNovaAula({...novaAula, diaSemana: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {diasSemana.slice(1, 6).map((dia, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>{dia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Horário</Label>
                  <Select value={novaAula.horario} onValueChange={(value) => setNovaAula({...novaAula, horario: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {horarios.map(horario => (
                        <SelectItem key={horario} value={horario}>{horario}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="sala">Sala</Label>
                <Input
                  id="sala"
                  value={novaAula.sala}
                  onChange={(e) => setNovaAula({...novaAula, sala: e.target.value})}
                  placeholder="Ex: Sala 101"
                />
              </div>
              
              <Button onClick={handleSalvarAula} className="w-full">
                Salvar Aula
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Tabs value={visualizacao} onValueChange={(value) => setVisualizacao(value as 'turma' | 'professor')}>
          <TabsList>
            <TabsTrigger value="turma">Por Turma</TabsTrigger>
            <TabsTrigger value="professor">Por Professor</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select value={filtroSelecionado} onValueChange={setFiltroSelecionado}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(visualizacao === 'turma' ? turmas : professores).map(item => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grade Horária */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Grade Horária - {filtroSelecionado}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 gap-1 min-w-[800px]">
              {/* Header */}
              <div className="bg-muted p-3 rounded text-center font-semibold">
                Horário
              </div>
              {diasSemana.slice(1, 6).map(dia => (
                <div key={dia} className="bg-muted p-3 rounded text-center font-semibold">
                  {dia}
                </div>
              ))}
              
              {/* Grade */}
              {horarios.map(horario => (
                <>
                  <div key={horario} className="bg-muted/50 p-3 rounded text-center text-sm font-medium">
                    {horario}
                  </div>
                  {[1, 2, 3, 4, 5].map(dia => {
                    const aula = getAulaPorDiaHorario(dia, horario);
                    return (
                      <div key={`${dia}-${horario}`} className="border rounded p-2 min-h-[80px]">
                        {aula ? (
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-xs">
                              {aula.disciplina}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {visualizacao === 'turma' ? aula.professor : aula.turma}
                            </div>
                            {aula.sala && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {aula.sala}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                            Livre
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {diasSemana.slice(1, 6).map((dia, index) => {
          const aulasDoDia = aulasFiltradas.filter(aula => aula.diaSemana === index + 1);
          return (
            <Card key={dia}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{dia}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {aulasDoDia.length} aulas
                  </div>
                  {aulasDoDia.slice(0, 3).map(aula => (
                    <div key={aula.id} className="text-xs">
                      <div className="font-medium">{aula.disciplina}</div>
                      <div className="text-muted-foreground">{aula.horario}</div>
                    </div>
                  ))}
                  {aulasDoDia.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{aulasDoDia.length - 3} mais
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}