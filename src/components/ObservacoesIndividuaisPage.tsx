import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, User, Calendar, MessageSquare, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ObservacaoAluno {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  turma: string;
  data: Date;
  tipo: 'comportamental' | 'pedagogica' | 'elogio' | 'atencao' | 'familiar';
  categoria: 'participacao' | 'disciplina' | 'aprendizagem' | 'social' | 'outro';
  observacao: string;
  acao_necessaria?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  privada: boolean;
  created_at: string;
}

const tiposObservacao = {
  comportamental: { label: 'Comportamental', color: 'bg-blue-500', icon: User },
  pedagogica: { label: 'Pedagógica', color: 'bg-green-500', icon: CheckCircle },
  elogio: { label: 'Elogio', color: 'bg-yellow-500', icon: Star },
  atencao: { label: 'Atenção', color: 'bg-red-500', icon: AlertTriangle },
  familiar: { label: 'Familiar', color: 'bg-purple-500', icon: MessageSquare }
};

const categorias = {
  participacao: 'Participação',
  disciplina: 'Disciplina',
  aprendizagem: 'Aprendizagem',
  social: 'Social',
  outro: 'Outro'
};

const prioridades = {
  baixa: { label: 'Baixa', color: 'bg-gray-500' },
  media: { label: 'Média', color: 'bg-yellow-500' },
  alta: { label: 'Alta', color: 'bg-red-500' }
};

export default function ObservacoesIndividuaisPage() {
  const [observacoes, setObservacoes] = useState<ObservacaoAluno[]>([
    {
      id: '1',
      aluno_id: 'aluno1',
      aluno_nome: 'João Silva',
      turma: '7º Ano A',
      data: new Date(2024, 11, 15),
      tipo: 'comportamental',
      categoria: 'participacao',
      observacao: 'Aluno muito participativo nas discussões em sala de aula. Demonstra interesse pela matéria e faz perguntas pertinentes.',
      prioridade: 'baixa',
      privada: false,
      created_at: '2024-12-15'
    },
    {
      id: '2',
      aluno_id: 'aluno2',
      aluno_nome: 'Maria Santos',
      turma: '7º Ano A',
      data: new Date(2024, 11, 12),
      tipo: 'atencao',
      categoria: 'aprendizagem',
      observacao: 'Apresenta dificuldades na resolução de problemas matemáticos. Necessita de acompanhamento mais próximo.',
      acao_necessaria: 'Agendar aula de reforço e conversar com os pais',
      prioridade: 'alta',
      privada: true,
      created_at: '2024-12-12'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    aluno: '',
    turma: '',
    tipo: '',
    categoria: '',
    prioridade: ''
  });

  const [novaObservacao, setNovaObservacao] = useState<Partial<ObservacaoAluno>>({
    aluno_nome: '',
    turma: '',
    data: new Date(),
    tipo: 'comportamental',
    categoria: 'participacao',
    observacao: '',
    acao_necessaria: '',
    prioridade: 'media',
    privada: false
  });

  // Mock data para alunos e turmas
  const alunos = [
    { id: 'aluno1', nome: 'João Silva', turma: '7º Ano A' },
    { id: 'aluno2', nome: 'Maria Santos', turma: '7º Ano A' },
    { id: 'aluno3', nome: 'Pedro Costa', turma: '7º Ano B' }
  ];
  const turmas = ['6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B', '8º Ano A'];

  const observacoesFiltradas = observacoes.filter(obs => {
    return (
      (!filtros.aluno || obs.aluno_nome.toLowerCase().includes(filtros.aluno.toLowerCase())) &&
      (!filtros.turma || obs.turma === filtros.turma) &&
      (!filtros.tipo || obs.tipo === filtros.tipo) &&
      (!filtros.categoria || obs.categoria === filtros.categoria) &&
      (!filtros.prioridade || obs.prioridade === filtros.prioridade)
    );
  });

  const handleSalvarObservacao = () => {
    if (!novaObservacao.aluno_nome || !novaObservacao.observacao) return;

    const observacao: ObservacaoAluno = {
      id: Date.now().toString(),
      aluno_id: Date.now().toString(),
      aluno_nome: novaObservacao.aluno_nome,
      turma: novaObservacao.turma || '',
      data: novaObservacao.data || new Date(),
      tipo: novaObservacao.tipo as ObservacaoAluno['tipo'],
      categoria: novaObservacao.categoria as ObservacaoAluno['categoria'],
      observacao: novaObservacao.observacao,
      acao_necessaria: novaObservacao.acao_necessaria,
      prioridade: novaObservacao.prioridade as ObservacaoAluno['prioridade'],
      privada: novaObservacao.privada || false,
      created_at: new Date().toISOString()
    };

    setObservacoes([observacao, ...observacoes]);
    setNovaObservacao({
      aluno_nome: '',
      turma: '',
      data: new Date(),
      tipo: 'comportamental',
      categoria: 'participacao',
      observacao: '',
      acao_necessaria: '',
      prioridade: 'media',
      privada: false
    });
    setIsDialogOpen(false);
  };

  const getObservacoesPorAluno = (alunoNome: string) => {
    return observacoes.filter(obs => obs.aluno_nome === alunoNome);
  };

  const alunosComObservacoes = [...new Set(observacoes.map(obs => obs.aluno_nome))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Observações Individuais</h1>
          <p className="text-muted-foreground">Anotações comportamentais e pedagógicas dos alunos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Nova Observação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Observação</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aluno">Aluno</Label>
                  <Select value={novaObservacao.aluno_nome} onValueChange={(value) => {
                    const aluno = alunos.find(a => a.nome === value);
                    setNovaObservacao({
                      ...novaObservacao, 
                      aluno_nome: value,
                      turma: aluno?.turma || ''
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.nome}>
                          {aluno.nome} - {aluno.turma}
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
                    value={novaObservacao.data ? format(novaObservacao.data, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setNovaObservacao({...novaObservacao, data: new Date(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={novaObservacao.tipo} onValueChange={(value) => setNovaObservacao({...novaObservacao, tipo: value as ObservacaoAluno['tipo']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tiposObservacao).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={novaObservacao.categoria} onValueChange={(value) => setNovaObservacao({...novaObservacao, categoria: value as ObservacaoAluno['categoria']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categorias).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={novaObservacao.prioridade} onValueChange={(value) => setNovaObservacao({...novaObservacao, prioridade: value as ObservacaoAluno['prioridade']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(prioridades).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  value={novaObservacao.observacao}
                  onChange={(e) => setNovaObservacao({...novaObservacao, observacao: e.target.value})}
                  placeholder="Descreva a observação sobre o aluno..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="acao">Ação Necessária (Opcional)</Label>
                <Textarea
                  id="acao"
                  value={novaObservacao.acao_necessaria}
                  onChange={(e) => setNovaObservacao({...novaObservacao, acao_necessaria: e.target.value})}
                  placeholder="Ações que devem ser tomadas..."
                  rows={2}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="privada"
                  checked={novaObservacao.privada}
                  onChange={(e) => setNovaObservacao({...novaObservacao, privada: e.target.checked})}
                />
                <Label htmlFor="privada">Observação privada (apenas para o professor)</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSalvarObservacao}>
                  Salvar Observação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="filtro-aluno">Aluno</Label>
              <Input
                id="filtro-aluno"
                placeholder="Nome do aluno..."
                value={filtros.aluno}
                onChange={(e) => setFiltros({...filtros, aluno: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Turma</Label>
              <Select value={filtros.turma} onValueChange={(value) => setFiltros({...filtros, turma: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {turmas.map((turma) => (
                    <SelectItem key={turma} value={turma}>
                      {turma}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros({...filtros, tipo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {Object.entries(tiposObservacao).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Categoria</Label>
              <Select value={filtros.categoria} onValueChange={(value) => setFiltros({...filtros, categoria: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Object.entries(categorias).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Prioridade</Label>
              <Select value={filtros.prioridade} onValueChange={(value) => setFiltros({...filtros, prioridade: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Object.entries(prioridades).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList>
          <TabsTrigger value="lista">Lista de Observações</TabsTrigger>
          <TabsTrigger value="por-aluno">Por Aluno</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="space-y-4">
          {observacoesFiltradas.map((observacao) => {
            const TipoIcon = tiposObservacao[observacao.tipo].icon;
            
            return (
              <Card key={observacao.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TipoIcon className="h-4 w-4" />
                        <Badge className={`${tiposObservacao[observacao.tipo].color} text-white`}>
                          {tiposObservacao[observacao.tipo].label}
                        </Badge>
                        <Badge variant="outline">{categorias[observacao.categoria]}</Badge>
                        <Badge className={`${prioridades[observacao.prioridade].color} text-white`}>
                          {prioridades[observacao.prioridade].label}
                        </Badge>
                        {observacao.privada && (
                          <Badge variant="secondary">Privada</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="font-medium text-foreground">{observacao.aluno_nome}</span>
                        <span>•</span>
                        <span>{observacao.turma}</span>
                        <span>•</span>
                        <span>{format(observacao.data, "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-foreground">{observacao.observacao}</p>
                    </div>
                    
                    {observacao.acao_necessaria && (
                      <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <p className="text-sm font-medium text-yellow-800">Ação Necessária:</p>
                        <p className="text-sm text-yellow-700">{observacao.acao_necessaria}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
        
        <TabsContent value="por-aluno" className="space-y-6">
          {alunosComObservacoes.map((alunoNome) => {
            const observacoesAluno = getObservacoesPorAluno(alunoNome);
            const aluno = observacoesAluno[0];
            
            return (
              <Card key={alunoNome}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {alunoNome} - {aluno.turma}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {observacoesAluno.map((obs) => (
                      <div key={obs.id} className="border-l-4 border-muted pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${tiposObservacao[obs.tipo].color} text-white text-xs`}>
                            {tiposObservacao[obs.tipo].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(obs.data, "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{obs.observacao}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {observacoesFiltradas.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma observação encontrada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}