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
import { Plus, BookOpen, Clock, Target, Users, FileText, Copy, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlanoAula {
  id: string;
  titulo: string;
  disciplina: string;
  turma: string;
  data: Date;
  duracao: number; // em minutos
  tema: string;
  objetivos_gerais: string[];
  objetivos_especificos: string[];
  conteudo_programatico: string;
  metodologia: string[];
  recursos_necessarios: string[];
  desenvolvimento: {
    introducao: string;
    desenvolvimento: string;
    conclusao: string;
  };
  avaliacao: string;
  referencias: string[];
  observacoes: string;
  template_usado?: string;
  status: 'rascunho' | 'finalizado' | 'aplicado';
  created_at: string;
  updated_at: string;
}

interface TemplateAula {
  id: string;
  nome: string;
  descricao: string;
  estrutura: Partial<PlanoAula>;
}

const templates: TemplateAula[] = [
  {
    id: 'tradicional',
    nome: 'Aula Tradicional',
    descricao: 'Modelo clássico com introdução, desenvolvimento e conclusão',
    estrutura: {
      objetivos_gerais: ['Compreender o conteúdo apresentado'],
      metodologia: ['Aula expositiva', 'Exercícios práticos'],
      recursos_necessarios: ['Quadro', 'Apostila', 'Exercícios'],
      desenvolvimento: {
        introducao: 'Revisar conteúdo anterior e apresentar novo tema',
        desenvolvimento: 'Explicação do conteúdo com exemplos práticos',
        conclusao: 'Síntese do conteúdo e esclarecimento de dúvidas'
      }
    }
  },
  {
    id: 'ativa',
    nome: 'Metodologia Ativa',
    descricao: 'Foco na participação ativa dos alunos',
    estrutura: {
      metodologia: ['Discussão em grupos', 'Resolução de problemas', 'Apresentações'],
      recursos_necessarios: ['Material para grupos', 'Questões problema'],
      desenvolvimento: {
        introducao: 'Problematização do tema',
        desenvolvimento: 'Trabalho em grupos e discussões',
        conclusao: 'Apresentação dos resultados e síntese'
      }
    }
  }
];

export default function PlanoAulaAvancadoPage() {
  const [planos, setPlanos] = useState<PlanoAula[]>([
    {
      id: '1',
      titulo: 'Equações de Primeiro Grau',
      disciplina: 'Matemática',
      turma: '7º Ano A',
      data: new Date(2024, 11, 20),
      duracao: 50,
      tema: 'Resolução de equações de primeiro grau',
      objetivos_gerais: ['Compreender o conceito de equação', 'Desenvolver raciocínio lógico'],
      objetivos_especificos: ['Resolver equações simples', 'Aplicar em problemas práticos'],
      conteudo_programatico: 'Definição de equação, termos semelhantes, resolução passo a passo',
      metodologia: ['Aula expositiva', 'Exercícios em dupla', 'Correção coletiva'],
      recursos_necessarios: ['Quadro', 'Lista de exercícios', 'Calculadora'],
      desenvolvimento: {
        introducao: 'Revisar conceitos de expressões algébricas (10 min)',
        desenvolvimento: 'Apresentar conceito de equação e métodos de resolução (25 min)',
        conclusao: 'Exercícios práticos e esclarecimento de dúvidas (15 min)'
      },
      avaliacao: 'Participação em aula e resolução de exercícios',
      referencias: ['Livro didático - Cap. 5', 'Lista de exercícios complementares'],
      observacoes: 'Atenção especial aos alunos com dificuldade em álgebra',
      status: 'finalizado',
      created_at: '2024-12-01',
      updated_at: '2024-12-15'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState<string>('');
  const [novoPlano, setNovoPlano] = useState<Partial<PlanoAula>>({
    titulo: '',
    disciplina: '',
    turma: '',
    data: new Date(),
    duracao: 50,
    tema: '',
    objetivos_gerais: [''],
    objetivos_especificos: [''],
    conteudo_programatico: '',
    metodologia: [''],
    recursos_necessarios: [''],
    desenvolvimento: {
      introducao: '',
      desenvolvimento: '',
      conclusao: ''
    },
    avaliacao: '',
    referencias: [''],
    observacoes: '',
    status: 'rascunho'
  });

  const disciplinas = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia'];
  const turmas = ['6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B', '8º Ano A'];

  const aplicarTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNovoPlano({
        ...novoPlano,
        ...template.estrutura,
        template_usado: template.nome
      });
    }
  };

  const handleSalvarPlano = () => {
    if (!novoPlano.titulo || !novoPlano.disciplina) return;

    const plano: PlanoAula = {
      id: Date.now().toString(),
      titulo: novoPlano.titulo,
      disciplina: novoPlano.disciplina,
      turma: novoPlano.turma || '',
      data: novoPlano.data || new Date(),
      duracao: novoPlano.duracao || 50,
      tema: novoPlano.tema || '',
      objetivos_gerais: novoPlano.objetivos_gerais?.filter(Boolean) || [],
      objetivos_especificos: novoPlano.objetivos_especificos?.filter(Boolean) || [],
      conteudo_programatico: novoPlano.conteudo_programatico || '',
      metodologia: novoPlano.metodologia?.filter(Boolean) || [],
      recursos_necessarios: novoPlano.recursos_necessarios?.filter(Boolean) || [],
      desenvolvimento: novoPlano.desenvolvimento || {
        introducao: '',
        desenvolvimento: '',
        conclusao: ''
      },
      avaliacao: novoPlano.avaliacao || '',
      referencias: novoPlano.referencias?.filter(Boolean) || [],
      observacoes: novoPlano.observacoes || '',
      template_usado: novoPlano.template_usado,
      status: 'rascunho',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setPlanos([plano, ...planos]);
    setIsDialogOpen(false);
  };

  const duplicarPlano = (plano: PlanoAula) => {
    const novoPlano: PlanoAula = {
      ...plano,
      id: Date.now().toString(),
      titulo: `${plano.titulo} (Cópia)`,
      status: 'rascunho',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setPlanos([novoPlano, ...planos]);
  };

  const deletarPlano = (id: string) => {
    setPlanos(planos.filter(p => p.id !== id));
  };

  const addArrayItem = (field: keyof Pick<PlanoAula, 'objetivos_gerais' | 'objetivos_especificos' | 'metodologia' | 'recursos_necessarios' | 'referencias'>) => {
    setNovoPlano({
      ...novoPlano,
      [field]: [...(novoPlano[field] || []), '']
    });
  };

  const updateArrayItem = (field: keyof Pick<PlanoAula, 'objetivos_gerais' | 'objetivos_especificos' | 'metodologia' | 'recursos_necessarios' | 'referencias'>, index: number, value: string) => {
    const items = [...(novoPlano[field] || [])];
    items[index] = value;
    setNovoPlano({ ...novoPlano, [field]: items });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plano de Aula Avançado</h1>
          <p className="text-muted-foreground">Templates e estruturas para planejamento pedagógico</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Plano de Aula</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="template" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
                <TabsTrigger value="metodologia">Metodologia</TabsTrigger>
                <TabsTrigger value="desenvolvimento">Desenvolvimento</TabsTrigger>
              </TabsList>
              
              <TabsContent value="template" className="space-y-4">
                <div>
                  <Label>Escolha um Template</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {templates.map((template) => (
                      <Card key={template.id} 
                            className={`cursor-pointer transition-colors ${templateSelecionado === template.id ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => {
                              setTemplateSelecionado(template.id);
                              aplicarTemplate(template.id);
                            }}>
                        <CardHeader>
                          <CardTitle className="text-lg">{template.nome}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{template.descricao}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setTemplateSelecionado('');
                      setNovoPlano({
                        ...novoPlano,
                        objetivos_gerais: [''],
                        objetivos_especificos: [''],
                        metodologia: [''],
                        recursos_necessarios: [''],
                        desenvolvimento: { introducao: '', desenvolvimento: '', conclusao: '' },
                        referencias: [''],
                        template_usado: undefined
                      });
                    }}
                  >
                    Começar do Zero
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="basico" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="titulo">Título da Aula</Label>
                    <Input
                      id="titulo"
                      value={novoPlano.titulo}
                      onChange={(e) => setNovoPlano({...novoPlano, titulo: e.target.value})}
                      placeholder="Ex: Equações de Primeiro Grau"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tema">Tema</Label>
                    <Input
                      id="tema"
                      value={novoPlano.tema}
                      onChange={(e) => setNovoPlano({...novoPlano, tema: e.target.value})}
                      placeholder="Tema específico da aula"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="disciplina">Disciplina</Label>
                    <Select value={novoPlano.disciplina} onValueChange={(value) => setNovoPlano({...novoPlano, disciplina: value})}>
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
                    <Select value={novoPlano.turma} onValueChange={(value) => setNovoPlano({...novoPlano, turma: value})}>
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
                    <Label htmlFor="duracao">Duração (min)</Label>
                    <Input
                      id="duracao"
                      type="number"
                      value={novoPlano.duracao}
                      onChange={(e) => setNovoPlano({...novoPlano, duracao: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="conteudo">Conteúdo Programático</Label>
                  <Textarea
                    id="conteudo"
                    value={novoPlano.conteudo_programatico}
                    onChange={(e) => setNovoPlano({...novoPlano, conteudo_programatico: e.target.value})}
                    placeholder="Descreva o conteúdo que será abordado..."
                    rows={3}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="objetivos" className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Objetivos Gerais</Label>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('objetivos_gerais')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novoPlano.objetivos_gerais || ['']).map((objetivo, index) => (
                      <Input
                        key={index}
                        value={objetivo}
                        onChange={(e) => updateArrayItem('objetivos_gerais', index, e.target.value)}
                        placeholder={`Objetivo geral ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Objetivos Específicos</Label>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('objetivos_especificos')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novoPlano.objetivos_especificos || ['']).map((objetivo, index) => (
                      <Input
                        key={index}
                        value={objetivo}
                        onChange={(e) => updateArrayItem('objetivos_especificos', index, e.target.value)}
                        placeholder={`Objetivo específico ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metodologia" className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Metodologia</Label>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('metodologia')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novoPlano.metodologia || ['']).map((metodo, index) => (
                      <Input
                        key={index}
                        value={metodo}
                        onChange={(e) => updateArrayItem('metodologia', index, e.target.value)}
                        placeholder={`Metodologia ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Recursos Necessários</Label>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('recursos_necessarios')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novoPlano.recursos_necessarios || ['']).map((recurso, index) => (
                      <Input
                        key={index}
                        value={recurso}
                        onChange={(e) => updateArrayItem('recursos_necessarios', index, e.target.value)}
                        placeholder={`Recurso ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="avaliacao">Avaliação</Label>
                  <Textarea
                    id="avaliacao"
                    value={novoPlano.avaliacao}
                    onChange={(e) => setNovoPlano({...novoPlano, avaliacao: e.target.value})}
                    placeholder="Como a aprendizagem será avaliada..."
                    rows={3}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="desenvolvimento" className="space-y-4">
                <div>
                  <Label htmlFor="introducao">Introdução</Label>
                  <Textarea
                    id="introducao"
                    value={novoPlano.desenvolvimento?.introducao}
                    onChange={(e) => setNovoPlano({
                      ...novoPlano, 
                      desenvolvimento: {
                        ...novoPlano.desenvolvimento,
                        introducao: e.target.value
                      }
                    })}
                    placeholder="Como a aula será iniciada..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="desenvolvimento">Desenvolvimento</Label>
                  <Textarea
                    id="desenvolvimento"
                    value={novoPlano.desenvolvimento?.desenvolvimento}
                    onChange={(e) => setNovoPlano({
                      ...novoPlano, 
                      desenvolvimento: {
                        ...novoPlano.desenvolvimento,
                        desenvolvimento: e.target.value
                      }
                    })}
                    placeholder="Desenvolvimento principal da aula..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="conclusao">Conclusão</Label>
                  <Textarea
                    id="conclusao"
                    value={novoPlano.desenvolvimento?.conclusao}
                    onChange={(e) => setNovoPlano({
                      ...novoPlano, 
                      desenvolvimento: {
                        ...novoPlano.desenvolvimento,
                        conclusao: e.target.value
                      }
                    })}
                    placeholder="Como a aula será finalizada..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Referências</Label>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('referencias')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(novoPlano.referencias || ['']).map((referencia, index) => (
                      <Input
                        key={index}
                        value={referencia}
                        onChange={(e) => updateArrayItem('referencias', index, e.target.value)}
                        placeholder={`Referência ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={novoPlano.observacoes}
                    onChange={(e) => setNovoPlano({...novoPlano, observacoes: e.target.value})}
                    placeholder="Observações adicionais..."
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarPlano}>
                Salvar Plano
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {planos.map((plano) => (
          <Card key={plano.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{plano.disciplina}</Badge>
                    <Badge variant="secondary">{plano.turma}</Badge>
                    <Badge variant={plano.status === 'finalizado' ? 'default' : plano.status === 'aplicado' ? 'destructive' : 'secondary'}>
                      {plano.status === 'rascunho' ? 'Rascunho' : 
                       plano.status === 'finalizado' ? 'Finalizado' : 'Aplicado'}
                    </Badge>
                    {plano.template_usado && (
                      <Badge variant="outline">Template: {plano.template_usado}</Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-xl mb-2">{plano.titulo}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-3">{plano.tema}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {plano.duracao} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {plano.objetivos_gerais.length} objetivos
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {plano.metodologia.length} metodologias
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => duplicarPlano(plano)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deletarPlano(plano.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="objetivos" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
                  <TabsTrigger value="metodologia">Metodologia</TabsTrigger>
                  <TabsTrigger value="desenvolvimento">Desenvolvimento</TabsTrigger>
                  <TabsTrigger value="recursos">Recursos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="objetivos" className="space-y-3 mt-4">
                  {plano.objetivos_gerais.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Objetivos Gerais:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {plano.objetivos_gerais.map((objetivo, index) => (
                          <li key={index}>{objetivo}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {plano.objetivos_especificos.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Objetivos Específicos:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {plano.objetivos_especificos.map((objetivo, index) => (
                          <li key={index}>{objetivo}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="metodologia" className="space-y-3 mt-4">
                  <div>
                    <h4 className="font-medium mb-2">Metodologias:</h4>
                    <div className="flex flex-wrap gap-2">
                      {plano.metodologia.map((metodo, index) => (
                        <Badge key={index} variant="outline">{metodo}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {plano.avaliacao && (
                    <div>
                      <h4 className="font-medium mb-2">Avaliação:</h4>
                      <p className="text-sm text-muted-foreground">{plano.avaliacao}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="desenvolvimento" className="space-y-3 mt-4">
                  {plano.desenvolvimento.introducao && (
                    <div>
                      <h4 className="font-medium mb-1">Introdução:</h4>
                      <p className="text-sm text-muted-foreground">{plano.desenvolvimento.introducao}</p>
                    </div>
                  )}
                  
                  {plano.desenvolvimento.desenvolvimento && (
                    <div>
                      <h4 className="font-medium mb-1">Desenvolvimento:</h4>
                      <p className="text-sm text-muted-foreground">{plano.desenvolvimento.desenvolvimento}</p>
                    </div>
                  )}
                  
                  {plano.desenvolvimento.conclusao && (
                    <div>
                      <h4 className="font-medium mb-1">Conclusão:</h4>
                      <p className="text-sm text-muted-foreground">{plano.desenvolvimento.conclusao}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recursos" className="space-y-3 mt-4">
                  <div>
                    <h4 className="font-medium mb-2">Recursos Necessários:</h4>
                    <div className="flex flex-wrap gap-2">
                      {plano.recursos_necessarios.map((recurso, index) => (
                        <Badge key={index} variant="secondary">{recurso}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  {plano.referencias.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Referências:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {plano.referencias.map((referencia, index) => (
                          <li key={index}>{referencia}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {planos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum plano de aula criado ainda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}