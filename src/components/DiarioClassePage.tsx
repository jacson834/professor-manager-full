import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BookOpen, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistroAula {
  id: string;
  data: Date;
  turma: string;
  disciplina: string;
  conteudo: string;
  objetivos: string;
  metodologia: string;
  recursos_utilizados: string;
  observacoes: string;
  presentes: number;
  total_alunos: number;
  created_at: string;
}

export default function DiarioClassePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [registros, setRegistros] = useState<RegistroAula[]>([
    {
      id: '1',
      data: new Date(2024, 11, 15),
      turma: '7º Ano A',
      disciplina: 'Matemática',
      conteudo: 'Equações de primeiro grau - Resolução e aplicações',
      objetivos: 'Compreender e resolver equações de primeiro grau',
      metodologia: 'Aula expositiva com exercícios práticos',
      recursos_utilizados: 'Quadro, apostila, exercícios',
      observacoes: 'Turma participativa, alguns alunos com dificuldade',
      presentes: 28,
      total_alunos: 30,
      created_at: '2024-12-15'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novoRegistro, setNovoRegistro] = useState<Partial<RegistroAula>>({
    data: selectedDate,
    turma: '',
    disciplina: '',
    conteudo: '',
    objetivos: '',
    metodologia: '',
    recursos_utilizados: '',
    observacoes: '',
    presentes: 0,
    total_alunos: 0
  });

  const turmas = ['6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B', '8º Ano A'];
  const disciplinas = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia'];

  const registrosDoDia = registros.filter(registro => 
    selectedDate && registro.data.toDateString() === selectedDate.toDateString()
  );

  const handleSalvar = () => {
    if (!novoRegistro.turma || !novoRegistro.conteudo) return;

    const registro: RegistroAula = {
      id: Date.now().toString(),
      data: novoRegistro.data || new Date(),
      turma: novoRegistro.turma,
      disciplina: novoRegistro.disciplina || '',
      conteudo: novoRegistro.conteudo,
      objetivos: novoRegistro.objetivos || '',
      metodologia: novoRegistro.metodologia || '',
      recursos_utilizados: novoRegistro.recursos_utilizados || '',
      observacoes: novoRegistro.observacoes || '',
      presentes: novoRegistro.presentes || 0,
      total_alunos: novoRegistro.total_alunos || 0,
      created_at: new Date().toISOString()
    };

    setRegistros([...registros, registro]);
    setNovoRegistro({
      data: selectedDate,
      turma: '',
      disciplina: '',
      conteudo: '',
      objetivos: '',
      metodologia: '',
      recursos_utilizados: '',
      observacoes: '',
      presentes: 0,
      total_alunos: 0
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Diário de Classe</h1>
          <p className="text-muted-foreground">Registro detalhado das aulas ministradas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Aula</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Turma</Label>
                  <Select value={novoRegistro.turma} onValueChange={(value) => setNovoRegistro({...novoRegistro, turma: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma) => (
                        <SelectItem key={turma} value={turma}>
                          {turma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Disciplina</Label>
                  <Select value={novoRegistro.disciplina} onValueChange={(value) => setNovoRegistro({...novoRegistro, disciplina: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplinas.map((disciplina) => (
                        <SelectItem key={disciplina} value={disciplina}>
                          {disciplina}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={novoRegistro.data ? format(novoRegistro.data, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setNovoRegistro({...novoRegistro, data: new Date(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Conteúdo Ministrado</Label>
                <Textarea
                  value={novoRegistro.conteudo}
                  onChange={(e) => setNovoRegistro({...novoRegistro, conteudo: e.target.value})}
                  placeholder="Descreva o conteúdo da aula..."
                />
              </div>
              
              <div>
                <Label>Objetivos</Label>
                <Textarea
                  value={novoRegistro.objetivos}
                  onChange={(e) => setNovoRegistro({...novoRegistro, objetivos: e.target.value})}
                  placeholder="Objetivos da aula..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Presentes</Label>
                  <Input
                    type="number"
                    value={novoRegistro.presentes}
                    onChange={(e) => setNovoRegistro({...novoRegistro, presentes: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Total de Alunos</Label>
                  <Input
                    type="number"
                    value={novoRegistro.total_alunos}
                    onChange={(e) => setNovoRegistro({...novoRegistro, total_alunos: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <Button onClick={handleSalvar} className="w-full">
                Salvar Registro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Registros de {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Hoje'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrosDoDia.length > 0 ? (
              <div className="space-y-4">
                {registrosDoDia.map((registro) => (
                  <div key={registro.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-semibold">{registro.turma}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{registro.disciplina}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {registro.presentes}/{registro.total_alunos}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-sm">Conteúdo: </span>
                        <span className="text-sm text-muted-foreground">{registro.conteudo}</span>
                      </div>
                      {registro.objetivos && (
                        <div>
                          <span className="font-medium text-sm">Objetivos: </span>
                          <span className="text-sm text-muted-foreground">{registro.objetivos}</span>
                        </div>
                      )}
                      {registro.observacoes && (
                        <div>
                          <span className="font-medium text-sm">Observações: </span>
                          <span className="text-sm text-muted-foreground">{registro.observacoes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum registro encontrado para esta data
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}