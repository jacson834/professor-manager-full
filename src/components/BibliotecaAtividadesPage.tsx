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
import { Plus, Search, Copy, Edit, Trash2, BookOpen, Star, Download, Eye } from 'lucide-react';

interface Atividade {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'exercicio' | 'trabalho' | 'projeto' | 'pesquisa' | 'laboratorio';
  disciplina: string;
  assunto: string;
  nivel: 'fundamental1' | 'fundamental2' | 'medio';
  duracao_estimada: number; // em minutos
  objetivos: string[];
  materiais_necessarios: string[];
  instrucoes: string;
  criterios_avaliacao: string[];
  tags: string[];
  favorita: boolean;
  uso_count: number;
  created_at: string;
  updated_at: string;
}

const tiposAtividade = {
  exercicio: { label: 'Exercício', color: 'bg-blue-500', icon: BookOpen },
  trabalho: { label: 'Trabalho', color: 'bg-green-500', icon: BookOpen },
  projeto: { label: 'Projeto', color: 'bg-purple-500', icon: BookOpen },
  pesquisa: { label: 'Pesquisa', color: 'bg-orange-500', icon: BookOpen },
  laboratorio: { label: 'Laboratório', color: 'bg-red-500', icon: BookOpen }
};

const niveisEnsino = {
  fundamental1: 'Fundamental I (1º ao 5º)',
  fundamental2: 'Fundamental II (6º ao 9º)',
  medio: 'Ensino Médio'
};

export default function BibliotecaAtividadesPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([
    {
      id: '1',
      titulo: 'Experimento de Densidade',
      descricao: 'Atividade prática para demonstrar o conceito de densidade usando diferentes líquidos',
      tipo: 'laboratorio',
      disciplina: 'Ciências',
      assunto: 'Densidade',
      nivel: 'fundamental2',
      duracao_estimada: 45,
      objetivos: ['Compreender o conceito de densidade', 'Observar diferentes densidades na prática'],
      materiais_necessarios: ['Água', 'Óleo', 'Mel', 'Recipiente transparente'],
      instrucoes: 'Despeje lentamente os líquidos no recipiente observando a formação de camadas...',
      criterios_avaliacao: ['Participação na atividade', 'Relatório do experimento'],
      tags: ['densidade', 'laboratório', 'física'],
      favorita: true,
      uso_count: 8,
      created_at: '2024-11-15',
      updated_at: '2024-12-01'
    },
    {
      id: '2',
      titulo: 'Redação Argumentativa sobre Meio Ambiente',
      descricao: 'Produção de texto argumentativo sobre preservação ambiental',
      tipo: 'trabalho',
      disciplina: 'Português',
      assunto: 'Redação',
      nivel: 'fundamental2',
      duracao_estimada: 90,
      objetivos: ['Desenvolver argumentação', 'Praticar escrita formal'],
      materiais_necessarios: ['Papel', 'Caneta', 'Textos de apoio'],
      instrucoes: 'Desenvolva uma redação de 20 a 30 linhas defendendo a importância da preservação ambiental...',
      criterios_avaliacao: ['Estrutura textual', 'Argumentação', 'Gramática'],
      tags: ['redação', 'meio ambiente', 'argumentação'],
      favorita: false,
      uso_count: 12,
      created_at: '2024-11-20',
      updated_at: '2024-11-25'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    busca: '',
    disciplina: '',
    tipo: '',
    nivel: '',
    favoritas: false
  });

  const [novaAtividade, setNovaAtividade] = useState<Partial<Atividade>>({
    titulo: '',
    descricao: '',
    tipo: 'exercicio',
    disciplina: '',
    assunto: '',
    nivel: 'fundamental2',
    duracao_estimada: 45,
    objetivos: [''],
    materiais_necessarios: [''],
    instrucoes: '',
    criterios_avaliacao: [''],
    tags: [],
    favorita: false
  });

  const disciplinas = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física'];

  const atividadesFiltradas = atividades.filter(atividade => {
    return (
      (!filtros.busca || atividade.titulo.toLowerCase().includes(filtros.busca.toLowerCase()) ||
                          atividade.descricao.toLowerCase().includes(filtros.busca.toLowerCase())) &&
      (!filtros.disciplina || atividade.disciplina === filtros.disciplina) &&
      (!filtros.tipo || atividade.tipo === filtros.tipo) &&
      (!filtros.nivel || atividade.nivel === filtros.nivel) &&
      (!filtros.favoritas || atividade.favorita)
    );
  });

  const handleSalvarAtividade = () => {
    if (!novaAtividade.titulo || !novaAtividade.disciplina) return;

    const atividade: Atividade = {
      id: Date.now().toString(),
      titulo: novaAtividade.titulo,
      descricao: novaAtividade.descricao || '',
      tipo: novaAtividade.tipo as Atividade['tipo'],
      disciplina: novaAtividade.disciplina,
      assunto: novaAtividade.assunto || '',
      nivel: novaAtividade.nivel as Atividade['nivel'],
      duracao_estimada: novaAtividade.duracao_estimada || 45,
      objetivos: novaAtividade.objetivos?.filter(Boolean) || [],
      materiais_necessarios: novaAtividade.materiais_necessarios?.filter(Boolean) || [],
      instrucoes: novaAtividade.instrucoes || '',
      criterios_avaliacao: novaAtividade.criterios_avaliacao?.filter(Boolean) || [],
      tags: novaAtividade.tags || [],
      favorita: false,
      uso_count: 0,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0]
    };

    setAtividades([...atividades, atividade]);
    setNovaAtividade({
      titulo: '',
      descricao: '',
      tipo: 'exercicio',
      disciplina: '',
      assunto: '',
      nivel: 'fundamental2',
      duracao_estimada: 45,
      objetivos: [''],
      materiais_necessarios: [''],
      instrucoes: '',
      criterios_avaliacao: [''],
      tags: [],
      favorita: false
    });
    setIsDialogOpen(false);
  };

  const toggleFavorita = (id: string) => {
    setAtividades(atividades.map(atividade =>
      atividade.id === id 
        ? { ...atividade, favorita: !atividade.favorita }
        : atividade
    ));
  };

  const handleDuplicar = (atividade: Atividade) => {
    const novaAtividade: Atividade = {
      ...atividade,
      id: Date.now().toString(),
      titulo: `${atividade.titulo} (Cópia)`,
      uso_count: 0,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0]
    };
    setAtividades([...atividades, novaAtividade]);
  };

  const handleDeletar = (id: string) => {
    setAtividades(atividades.filter(a => a.id !== id));
  };

  const addArrayItem = (field: 'objetivos' | 'materiais_necessarios' | 'criterios_avaliacao') => {
    setNovaAtividade({
      ...novaAtividade,
      [field]: [...(novaAtividade[field] || []), '']
    });
  };

  const updateArrayItem = (field: 'objetivos' | 'materiais_necessarios' | 'criterios_avaliacao', index: number, value: string) => {
    const items = [...(novaAtividade[field] || [])];
    items[index] = value;
    setNovaAtividade({ ...novaAtividade, [field]: items });
  };

  const removeArrayItem = (field: 'objetivos' | 'materiais_necessarios' | 'criterios_avaliacao', index: number) => {
    const items = [...(novaAtividade[field] || [])];
    items.splice(index, 1);
    setNovaAtividade({ ...novaAtividade, [field]: items });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Biblioteca de Atividades</h1>
          <p className="text-muted-foreground">Catálogo de exercícios, trabalhos e projetos organizados por disciplina</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Atividade</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
                <TabsTrigger value="instrucoes">Instruções</TabsTrigger>
                <TabsTrigger value="avaliacao">Avaliação</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basico" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="titulo">Título da Atividade</Label>
                    <Input
                      id="titulo"
                      value={novaAtividade.titulo}
                      onChange={(e) => setNovaAtividade({...novaAtividade, titulo: e.target.value})}
                      placeholder="Nome da atividade"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={novaAtividade.descricao}
                      onChange={(e) => setNovaAtividade({...novaAtividade, descricao: e.target.value})}
                      placeholder="Breve descrição da atividade"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select value={novaAtividade.tipo} onValueChange={(value) => setNovaAtividade({...novaAtividade, tipo: value as Atividade['tipo']})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tiposAtividade).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="disciplina">Disciplina</Label>
                    <Select value={novaAtividade.disciplina} onValueChange={(value) => setNovaAtividade({...novaAtividade, disciplina: value})}>
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
                    <Label htmlFor="assunto">Assunto</Label>
                    <Input
                      id="assunto"
                      value={novaAtividade.assunto}
                      onChange={(e) => setNovaAtividade({...novaAtividade, assunto: e.target.value})}
                      placeholder="Tópico específico"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nivel">Nível de Ensino</Label>
                    <Select value={novaAtividade.nivel} onValueChange={(value) => setNovaAtividade({...novaAtividade, nivel: value as Atividade['nivel']})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(niveisEnsino).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="duracao">Duração (minutos)</Label>
                    <Input
                      id="duracao"
                      type="number"
                      value={novaAtividade.duracao_estimada}
                      onChange={(e) => setNovaAtividade({...novaAtividade, duracao_estimada: parseInt(e.target.value)})}
                      placeholder="45"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      value={novaAtividade.tags?.join(', ') || ''}
                      onChange={(e) => setNovaAtividade({...novaAtividade, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                      placeholder="Ex: prática, grupo, individual"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="objetivos" className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Objetivos de Aprendizagem</Label>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('objetivos')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novaAtividade.objetivos || ['']).map((objetivo, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={objetivo}
                          onChange={(e) => updateArrayItem('objetivos', index, e.target.value)}
                          placeholder={`Objetivo ${index + 1}`}
                        />
                        {(novaAtividade.objetivos?.length || 0) > 1 && (
                          <Button variant="outline" size="sm" onClick={() => removeArrayItem('objetivos', index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Materiais Necessários</Label>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('materiais_necessarios')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novaAtividade.materiais_necessarios || ['']).map((material, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={material}
                          onChange={(e) => updateArrayItem('materiais_necessarios', index, e.target.value)}
                          placeholder={`Material ${index + 1}`}
                        />
                        {(novaAtividade.materiais_necessarios?.length || 0) > 1 && (
                          <Button variant="outline" size="sm" onClick={() => removeArrayItem('materiais_necessarios', index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="instrucoes" className="space-y-4">
                <div>
                  <Label htmlFor="instrucoes">Instruções Detalhadas</Label>
                  <Textarea
                    id="instrucoes"
                    value={novaAtividade.instrucoes}
                    onChange={(e) => setNovaAtividade({...novaAtividade, instrucoes: e.target.value})}
                    placeholder="Descreva passo a passo como realizar a atividade..."
                    rows={10}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="avaliacao" className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Critérios de Avaliação</Label>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('criterios_avaliacao')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novaAtividade.criterios_avaliacao || ['']).map((criterio, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={criterio}
                          onChange={(e) => updateArrayItem('criterios_avaliacao', index, e.target.value)}
                          placeholder={`Critério ${index + 1}`}
                        />
                        {(novaAtividade.criterios_avaliacao?.length || 0) > 1 && (
                          <Button variant="outline" size="sm" onClick={() => removeArrayItem('criterios_avaliacao', index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarAtividade}>
                Salvar Atividade
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="busca">Buscar</Label>
              <Input
                id="busca"
                placeholder="Título ou descrição..."
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
              />
            </div>
            
            <div>
              <Label>Disciplina</Label>
              <Select value={filtros.disciplina} onValueChange={(value) => setFiltros({...filtros, disciplina: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {disciplinas.map((disciplina) => (
                    <SelectItem key={disciplina} value={disciplina}>
                      {disciplina}
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
                  {Object.entries(tiposAtividade).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Nível</Label>
              <Select value={filtros.nivel} onValueChange={(value) => setFiltros({...filtros, nivel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {Object.entries(niveisEnsino).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant={filtros.favoritas ? "default" : "outline"}
                onClick={() => setFiltros({...filtros, favoritas: !filtros.favoritas})}
                className="w-full"
              >
                <Star className={`h-4 w-4 mr-2 ${filtros.favoritas ? 'fill-current' : ''}`} />
                Favoritas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {atividadesFiltradas.map((atividade) => {
          const TipoIcon = tiposAtividade[atividade.tipo].icon;
          
          return (
            <Card key={atividade.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <TipoIcon className="h-4 w-4" />
                      <Badge className={`${tiposAtividade[atividade.tipo].color} text-white`}>
                        {tiposAtividade[atividade.tipo].label}
                      </Badge>
                      <Badge variant="outline">{atividade.disciplina}</Badge>
                      <Badge variant="secondary">{niveisEnsino[atividade.nivel]}</Badge>
                      {atividade.favorita && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                    
                    <CardTitle className="text-lg mb-2">{atividade.titulo}</CardTitle>
                    <p className="text-sm text-muted-foreground mb-3">{atividade.descricao}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Assunto:</span>
                        <p className="text-muted-foreground">{atividade.assunto}</p>
                      </div>
                      <div>
                        <span className="font-medium">Duração:</span>
                        <p className="text-muted-foreground">{atividade.duracao_estimada} min</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleFavorita(atividade.id)}
                    >
                      <Star className={`h-4 w-4 ${atividade.favorita ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicar(atividade)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletar(atividade.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="objetivos" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 text-xs">
                    <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
                    <TabsTrigger value="materiais">Materiais</TabsTrigger>
                    <TabsTrigger value="avaliacao">Avaliação</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="objetivos" className="space-y-2 mt-4">
                    <div className="text-sm">
                      <p className="font-medium mb-2">Objetivos:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {atividade.objetivos.map((objetivo, index) => (
                          <li key={index}>{objetivo}</li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="materiais" className="space-y-2 mt-4">
                    <div className="text-sm">
                      <p className="font-medium mb-2">Materiais Necessários:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {atividade.materiais_necessarios.map((material, index) => (
                          <li key={index}>{material}</li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="avaliacao" className="space-y-2 mt-4">
                    <div className="text-sm">
                      <p className="font-medium mb-2">Critérios de Avaliação:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {atividade.criterios_avaliacao.map((criterio, index) => (
                          <li key={index}>{criterio}</li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Usada {atividade.uso_count} vezes</span>
                    {atividade.tags.length > 0 && (
                      <div className="flex gap-1">
                        {atividade.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {atividade.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{atividade.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <span>
                    Criada em {new Date(atividade.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {atividadesFiltradas.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {Object.values(filtros).some(f => f)
                ? 'Nenhuma atividade encontrada com os filtros aplicados'
                : 'Nenhuma atividade cadastrada ainda'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}