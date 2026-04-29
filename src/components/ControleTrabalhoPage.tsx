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
import { Plus, FileText, Calendar, Clock, CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Trabalho {
  id: string;
  titulo: string;
  descricao: string;
  disciplina: string;
  turma: string;
  data_entrega: Date;
  tipo: 'individual' | 'grupo' | 'projeto' | 'pesquisa';
  status: 'ativo' | 'encerrado';
  nota_maxima: number;
  instrucoes: string;
  criterios_avaliacao: string[];
  anexos: string[];
  created_at: string;
}

interface EntregaTrabalho {
  id: string;
  trabalho_id: string;
  aluno_nome: string;
  aluno_id: string;
  data_entrega: Date;
  status: 'entregue' | 'atrasado' | 'pendente';
  arquivo?: string;
  observacoes?: string;
  nota?: number;
  feedback?: string;
}

const tiposTrabalho = {
  individual: { label: 'Individual', color: 'bg-blue-500' },
  grupo: { label: 'Em Grupo', color: 'bg-green-500' },
  projeto: { label: 'Projeto', color: 'bg-purple-500' },
  pesquisa: { label: 'Pesquisa', color: 'bg-orange-500' }
};

const statusEntrega = {
  entregue: { label: 'Entregue', color: 'bg-green-500', icon: CheckCircle },
  atrasado: { label: 'Atrasado', color: 'bg-red-500', icon: XCircle },
  pendente: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock }
};

export default function ControleTrabalhoPage() {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([
    {
      id: '1',
      titulo: 'Projeto Sistema Solar',
      descricao: 'Pesquisa completa sobre planetas do sistema solar',
      disciplina: 'Ciências',
      turma: '6º Ano A',
      data_entrega: new Date(2024, 11, 20),
      tipo: 'projeto',
      status: 'ativo',
      nota_maxima: 10,
      instrucoes: 'Pesquisar sobre cada planeta, incluindo características físicas e curiosidades',
      criterios_avaliacao: ['Conteúdo', 'Apresentação', 'Criatividade'],
      anexos: [],
      created_at: '2024-12-01'
    }
  ]);

  const [entregas, setEntregas] = useState<EntregaTrabalho[]>([
    {
      id: '1',
      trabalho_id: '1',
      aluno_nome: 'João Silva',
      aluno_id: 'aluno1',
      data_entrega: new Date(2024, 11, 18),
      status: 'entregue',
      arquivo: 'projeto-sistema-solar.pdf',
      nota: 9.0,
      feedback: 'Excelente trabalho, muito bem pesquisado!'
    },
    {
      id: '2',
      trabalho_id: '1',
      aluno_nome: 'Maria Santos',
      aluno_id: 'aluno2',
      data_entrega: new Date(2024, 11, 22),
      status: 'atrasado',
      arquivo: 'sistema-solar-maria.pdf',
      observacoes: 'Entregue com 2 dias de atraso'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novoTrabalho, setNovoTrabalho] = useState<Partial<Trabalho>>({
    titulo: '',
    descricao: '',
    disciplina: '',
    turma: '',
    data_entrega: new Date(),
    tipo: 'individual',
    nota_maxima: 10,
    instrucoes: '',
    criterios_avaliacao: [''],
    anexos: []
  });

  const disciplinas = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia'];
  const turmas = ['6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B', '8º Ano A'];

  const handleSalvarTrabalho = () => {
    if (!novoTrabalho.titulo || !novoTrabalho.turma) return;

    const trabalho: Trabalho = {
      id: Date.now().toString(),
      titulo: novoTrabalho.titulo,
      descricao: novoTrabalho.descricao || '',
      disciplina: novoTrabalho.disciplina || '',
      turma: novoTrabalho.turma,
      data_entrega: novoTrabalho.data_entrega || new Date(),
      tipo: novoTrabalho.tipo as Trabalho['tipo'],
      status: 'ativo',
      nota_maxima: novoTrabalho.nota_maxima || 10,
      instrucoes: novoTrabalho.instrucoes || '',
      criterios_avaliacao: novoTrabalho.criterios_avaliacao?.filter(Boolean) || [],
      anexos: [],
      created_at: new Date().toISOString()
    };

    setTrabalhos([...trabalhos, trabalho]);
    setNovoTrabalho({
      titulo: '',
      descricao: '',
      disciplina: '',
      turma: '',
      data_entrega: new Date(),
      tipo: 'individual',
      nota_maxima: 10,
      instrucoes: '',
      criterios_avaliacao: [''],
      anexos: []
    });
    setIsDialogOpen(false);
  };

  const getEntregasPorTrabalho = (trabalhoId: string) => {
    return entregas.filter(e => e.trabalho_id === trabalhoId);
  };

  const getEstatisticasTrabalho = (trabalhoId: string) => {
    const entregasTrabalho = getEntregasPorTrabalho(trabalhoId);
    const total = entregasTrabalho.length;
    const entregues = entregasTrabalho.filter(e => e.status === 'entregue').length;
    const atrasados = entregasTrabalho.filter(e => e.status === 'atrasado').length;
    const pendentes = entregasTrabalho.filter(e => e.status === 'pendente').length;
    
    return { total, entregues, atrasados, pendentes };
  };

  const addCriterio = () => {
    setNovoTrabalho({
      ...novoTrabalho,
      criterios_avaliacao: [...(novoTrabalho.criterios_avaliacao || []), '']
    });
  };

  const updateCriterio = (index: number, value: string) => {
    const criterios = [...(novoTrabalho.criterios_avaliacao || [])];
    criterios[index] = value;
    setNovoTrabalho({ ...novoTrabalho, criterios_avaliacao: criterios });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Trabalhos</h1>
          <p className="text-muted-foreground">Gerencie entrega e correção de atividades</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Novo Trabalho
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Trabalho</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basico" className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título do Trabalho</Label>
                  <Input
                    id="titulo"
                    value={novoTrabalho.titulo}
                    onChange={(e) => setNovoTrabalho({...novoTrabalho, titulo: e.target.value})}
                    placeholder="Nome do trabalho"
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={novoTrabalho.descricao}
                    onChange={(e) => setNovoTrabalho({...novoTrabalho, descricao: e.target.value})}
                    placeholder="Breve descrição do trabalho"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="disciplina">Disciplina</Label>
                    <Select value={novoTrabalho.disciplina} onValueChange={(value) => setNovoTrabalho({...novoTrabalho, disciplina: value})}>
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
                    <Label htmlFor="turma">Turma</Label>
                    <Select value={novoTrabalho.turma} onValueChange={(value) => setNovoTrabalho({...novoTrabalho, turma: value})}>
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
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={novoTrabalho.tipo} onValueChange={(value) => setNovoTrabalho({...novoTrabalho, tipo: value as Trabalho['tipo']})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tiposTrabalho).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="data_entrega">Data de Entrega</Label>
                    <Input
                      id="data_entrega"
                      type="date"
                      value={novoTrabalho.data_entrega ? format(novoTrabalho.data_entrega, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setNovoTrabalho({...novoTrabalho, data_entrega: new Date(e.target.value)})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nota_maxima">Nota Máxima</Label>
                    <Input
                      id="nota_maxima"
                      type="number"
                      step="0.1"
                      value={novoTrabalho.nota_maxima}
                      onChange={(e) => setNovoTrabalho({...novoTrabalho, nota_maxima: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="detalhes" className="space-y-4">
                <div>
                  <Label htmlFor="instrucoes">Instruções</Label>
                  <Textarea
                    id="instrucoes"
                    value={novoTrabalho.instrucoes}
                    onChange={(e) => setNovoTrabalho({...novoTrabalho, instrucoes: e.target.value})}
                    placeholder="Instruções detalhadas para o trabalho..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Critérios de Avaliação</Label>
                    <Button variant="outline" size="sm" onClick={addCriterio}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novoTrabalho.criterios_avaliacao || ['']).map((criterio, index) => (
                      <Input
                        key={index}
                        value={criterio}
                        onChange={(e) => updateCriterio(index, e.target.value)}
                        placeholder={`Critério ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarTrabalho}>
                Criar Trabalho
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {trabalhos.map((trabalho) => {
          const estatisticas = getEstatisticasTrabalho(trabalho.id);
          const entregasTrabalho = getEntregasPorTrabalho(trabalho.id);
          
          return (
            <Card key={trabalho.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${tiposTrabalho[trabalho.tipo].color} text-white`}>
                        {tiposTrabalho[trabalho.tipo].label}
                      </Badge>
                      <Badge variant="outline">{trabalho.disciplina}</Badge>
                      <Badge variant="secondary">{trabalho.turma}</Badge>
                      <Badge variant={trabalho.status === 'ativo' ? 'default' : 'secondary'}>
                        {trabalho.status === 'ativo' ? 'Ativo' : 'Encerrado'}
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-xl mb-2">{trabalho.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground mb-3">{trabalho.descricao}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Entrega: {format(trabalho.data_entrega, "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Nota máxima: {trabalho.nota_maxima}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="entregas" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="entregas">
                      Entregas ({estatisticas.total})
                    </TabsTrigger>
                    <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="entregas" className="space-y-4">
                    {/* Estatísticas */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-foreground">{estatisticas.total}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{estatisticas.entregues}</div>
                        <div className="text-sm text-muted-foreground">Entregues</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{estatisticas.atrasados}</div>
                        <div className="text-sm text-muted-foreground">Atrasados</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
                        <div className="text-sm text-muted-foreground">Pendentes</div>
                      </div>
                    </div>
                    
                    {/* Lista de Entregas */}
                    <div className="space-y-2">
                      {entregasTrabalho.map((entrega) => {
                        const StatusIcon = statusEntrega[entrega.status].icon;
                        
                        return (
                          <div key={entrega.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <StatusIcon className="h-4 w-4" />
                                <div>
                                  <p className="font-medium">{entrega.aluno_nome}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(entrega.data_entrega, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className={`${statusEntrega[entrega.status].color} text-white`}>
                                  {statusEntrega[entrega.status].label}
                                </Badge>
                                {entrega.nota && (
                                  <Badge variant="outline">
                                    Nota: {entrega.nota}
                                  </Badge>
                                )}
                                {entrega.arquivo && (
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {(entrega.observacoes || entrega.feedback) && (
                              <div className="mt-3 pt-3 border-t text-sm">
                                {entrega.observacoes && (
                                  <p className="text-muted-foreground">
                                    <span className="font-medium">Observações:</span> {entrega.observacoes}
                                  </p>
                                )}
                                {entrega.feedback && (
                                  <p className="text-green-600">
                                    <span className="font-medium">Feedback:</span> {entrega.feedback}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="detalhes" className="space-y-4">
                    {trabalho.instrucoes && (
                      <div>
                        <h4 className="font-medium mb-2">Instruções:</h4>
                        <p className="text-sm text-muted-foreground">{trabalho.instrucoes}</p>
                      </div>
                    )}
                    
                    {trabalho.criterios_avaliacao.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Critérios de Avaliação:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {trabalho.criterios_avaliacao.map((criterio, index) => (
                            <li key={index}>{criterio}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {trabalhos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum trabalho cadastrado ainda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}