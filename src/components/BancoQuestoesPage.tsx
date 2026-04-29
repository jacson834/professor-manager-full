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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Copy, Trash2, FileQuestion, Filter } from 'lucide-react';

interface Questao {
  id: string;
  enunciado: string;
  tipo: 'multipla_escolha' | 'verdadeiro_falso' | 'dissertativa' | 'objetiva';
  disciplina: string;
  assunto: string;
  dificuldade: 'facil' | 'media' | 'dificil';
  alternativas?: string[];
  resposta_correta?: string | number;
  explicacao?: string;
  tags: string[];
  created_at: string;
  used_count: number;
}

const tiposQuestao = {
  multipla_escolha: 'Múltipla Escolha',
  verdadeiro_falso: 'Verdadeiro/Falso',
  dissertativa: 'Dissertativa',
  objetiva: 'Objetiva'
};

const nivelDificuldade = {
  facil: { label: 'Fácil', color: 'bg-green-500' },
  media: { label: 'Média', color: 'bg-yellow-500' },
  dificil: { label: 'Difícil', color: 'bg-red-500' }
};

export default function BancoQuestoesPage() {
  const [questoes, setQuestoes] = useState<Questao[]>([
    {
      id: '1',
      enunciado: 'Qual é o resultado da equação 2x + 4 = 10?',
      tipo: 'multipla_escolha',
      disciplina: 'Matemática',
      assunto: 'Equações',
      dificuldade: 'facil',
      alternativas: ['x = 2', 'x = 3', 'x = 4', 'x = 5'],
      resposta_correta: 1,
      explicacao: 'Resolvendo: 2x + 4 = 10, temos 2x = 6, logo x = 3',
      tags: ['equação', 'álgebra'],
      created_at: '2024-12-01',
      used_count: 5
    },
    {
      id: '2',
      enunciado: 'O Brasil foi descoberto em 1500?',
      tipo: 'verdadeiro_falso',
      disciplina: 'História',
      assunto: 'Brasil Colônia',
      dificuldade: 'facil',
      resposta_correta: 'verdadeiro',
      explicacao: 'Pedro Álvares Cabral chegou ao Brasil em 22 de abril de 1500',
      tags: ['descobrimento', 'brasil'],
      created_at: '2024-11-28',
      used_count: 3
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    busca: '',
    disciplina: '',
    tipo: '',
    dificuldade: '',
    assunto: ''
  });

  const [novaQuestao, setNovaQuestao] = useState<Partial<Questao>>({
    enunciado: '',
    tipo: 'multipla_escolha',
    disciplina: '',
    assunto: '',
    dificuldade: 'media',
    alternativas: ['', '', '', ''],
    resposta_correta: 0,
    explicacao: '',
    tags: []
  });

  const disciplinas = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia'];
  
  const questoesFiltradas = questoes.filter(questao => {
    return (
      (!filtros.busca || questao.enunciado.toLowerCase().includes(filtros.busca.toLowerCase())) &&
      (!filtros.disciplina || questao.disciplina === filtros.disciplina) &&
      (!filtros.tipo || questao.tipo === filtros.tipo) &&
      (!filtros.dificuldade || questao.dificuldade === filtros.dificuldade) &&
      (!filtros.assunto || questao.assunto.toLowerCase().includes(filtros.assunto.toLowerCase()))
    );
  });

  const handleSalvarQuestao = () => {
    if (!novaQuestao.enunciado || !novaQuestao.disciplina) return;

    const questao: Questao = {
      id: Date.now().toString(),
      enunciado: novaQuestao.enunciado,
      tipo: novaQuestao.tipo as Questao['tipo'],
      disciplina: novaQuestao.disciplina,
      assunto: novaQuestao.assunto || '',
      dificuldade: novaQuestao.dificuldade as Questao['dificuldade'],
      alternativas: novaQuestao.tipo === 'multipla_escolha' ? novaQuestao.alternativas : undefined,
      resposta_correta: novaQuestao.resposta_correta,
      explicacao: novaQuestao.explicacao,
      tags: novaQuestao.tags || [],
      created_at: new Date().toISOString().split('T')[0],
      used_count: 0
    };

    setQuestoes([...questoes, questao]);
    setNovaQuestao({
      enunciado: '',
      tipo: 'multipla_escolha',
      disciplina: '',
      assunto: '',
      dificuldade: 'media',
      alternativas: ['', '', '', ''],
      resposta_correta: 0,
      explicacao: '',
      tags: []
    });
    setIsDialogOpen(false);
  };

  const handleDuplicarQuestao = (questao: Questao) => {
    const novaQuestao: Questao = {
      ...questao,
      id: Date.now().toString(),
      enunciado: `${questao.enunciado} (Cópia)`,
      used_count: 0,
      created_at: new Date().toISOString().split('T')[0]
    };
    setQuestoes([...questoes, novaQuestao]);
  };

  const handleDeletarQuestao = (id: string) => {
    setQuestoes(questoes.filter(q => q.id !== id));
  };

  const updateAlternativa = (index: number, value: string) => {
    const novasAlternativas = [...(novaQuestao.alternativas || ['', '', '', ''])];
    novasAlternativas[index] = value;
    setNovaQuestao({...novaQuestao, alternativas: novasAlternativas});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banco de Questões</h1>
          <p className="text-muted-foreground">Crie e gerencie questões para provas e avaliações</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Nova Questão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Questão</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basico">Informações Básicas</TabsTrigger>
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basico" className="space-y-4">
                <div>
                  <Label htmlFor="enunciado">Enunciado da Questão</Label>
                  <Textarea
                    id="enunciado"
                    value={novaQuestao.enunciado}
                    onChange={(e) => setNovaQuestao({...novaQuestao, enunciado: e.target.value})}
                    placeholder="Digite o enunciado da questão..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Questão</Label>
                    <Select value={novaQuestao.tipo} onValueChange={(value) => setNovaQuestao({...novaQuestao, tipo: value as Questao['tipo']})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tiposQuestao).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dificuldade">Dificuldade</Label>
                    <Select value={novaQuestao.dificuldade} onValueChange={(value) => setNovaQuestao({...novaQuestao, dificuldade: value as Questao['dificuldade']})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(nivelDificuldade).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="disciplina">Disciplina</Label>
                    <Select value={novaQuestao.disciplina} onValueChange={(value) => setNovaQuestao({...novaQuestao, disciplina: value})}>
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
                      value={novaQuestao.assunto}
                      onChange={(e) => setNovaQuestao({...novaQuestao, assunto: e.target.value})}
                      placeholder="Ex: Equações, Guerra Fria..."
                    />
                  </div>
                </div>

                {novaQuestao.tipo === 'multipla_escolha' && (
                  <div>
                    <Label>Alternativas</Label>
                    <div className="space-y-2">
                      {(novaQuestao.alternativas || ['', '', '', '']).map((alt, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroup value={novaQuestao.resposta_correta?.toString()} 
                                    onValueChange={(value) => setNovaQuestao({...novaQuestao, resposta_correta: parseInt(value)})}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={index.toString()} id={`alt-${index}`} />
                              <Label htmlFor={`alt-${index}`} className="text-sm">
                                {String.fromCharCode(65 + index)}
                              </Label>
                            </div>
                          </RadioGroup>
                          <Input
                            value={alt}
                            onChange={(e) => updateAlternativa(index, e.target.value)}
                            placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecione o círculo da alternativa correta
                    </p>
                  </div>
                )}

                {novaQuestao.tipo === 'verdadeiro_falso' && (
                  <div>
                    <Label>Resposta Correta</Label>
                    <RadioGroup value={novaQuestao.resposta_correta?.toString()} 
                              onValueChange={(value) => setNovaQuestao({...novaQuestao, resposta_correta: value})}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="verdadeiro" id="verdadeiro" />
                        <Label htmlFor="verdadeiro">Verdadeiro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="falso" id="falso" />
                        <Label htmlFor="falso">Falso</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="detalhes" className="space-y-4">
                <div>
                  <Label htmlFor="explicacao">Explicação da Resposta</Label>
                  <Textarea
                    id="explicacao"
                    value={novaQuestao.explicacao}
                    onChange={(e) => setNovaQuestao({...novaQuestao, explicacao: e.target.value})}
                    placeholder="Explique por que esta é a resposta correta..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={novaQuestao.tags?.join(', ') || ''}
                    onChange={(e) => setNovaQuestao({...novaQuestao, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                    placeholder="Ex: álgebra, equação, matemática básica"
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarQuestao}>
                Salvar Questão
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="busca">Buscar</Label>
              <Input
                id="busca"
                placeholder="Buscar questões..."
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
                  {Object.entries(tiposQuestao).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Dificuldade</Label>
              <Select value={filtros.dificuldade} onValueChange={(value) => setFiltros({...filtros, dificuldade: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Object.entries(nivelDificuldade).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Assunto</Label>
              <Input
                placeholder="Filtrar por assunto..."
                value={filtros.assunto}
                onChange={(e) => setFiltros({...filtros, assunto: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Questões */}
      <div className="space-y-4">
        {questoesFiltradas.map((questao) => (
          <Card key={questao.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{tiposQuestao[questao.tipo]}</Badge>
                    <Badge className={`${nivelDificuldade[questao.dificuldade].color} text-white`}>
                      {nivelDificuldade[questao.dificuldade].label}
                    </Badge>
                    <Badge variant="secondary">{questao.disciplina}</Badge>
                    {questao.assunto && (
                      <Badge variant="outline">{questao.assunto}</Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {questao.enunciado}
                  </h3>
                  
                  {questao.alternativas && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {questao.alternativas.map((alt, index) => (
                        <div key={index} className={`${questao.resposta_correta === index ? 'text-green-600 font-medium' : ''}`}>
                          {String.fromCharCode(65 + index)}) {alt}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {questao.tipo === 'verdadeiro_falso' && (
                    <div className="text-sm">
                      <span className={`${questao.resposta_correta === 'verdadeiro' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        Verdadeiro
                      </span>
                      {' / '}
                      <span className={`${questao.resposta_correta === 'falso' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        Falso
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicarQuestao(questao)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletarQuestao(questao.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {(questao.explicacao || questao.tags.length > 0) && (
              <CardContent className="pt-0">
                {questao.explicacao && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-foreground mb-1">Explicação:</p>
                    <p className="text-sm text-muted-foreground">{questao.explicacao}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {questao.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>Tags:</span>
                        {questao.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span>Usada {questao.used_count} vezes</span>
                    <span>Criada em {new Date(questao.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {questoesFiltradas.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {Object.values(filtros).some(f => f) 
                ? 'Nenhuma questão encontrada com os filtros aplicados' 
                : 'Nenhuma questão cadastrada ainda'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}