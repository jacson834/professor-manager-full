import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Download, Eye, Trash2, Plus, Folder, Search } from 'lucide-react';

interface Material {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'apostila' | 'apresentacao' | 'exercicio' | 'video' | 'outro';
  disciplina: string;
  turma: string;
  arquivo: string;
  tamanho: string;
  dataUpload: string;
  downloads: number;
}

const tiposMaterial = {
  apostila: { label: 'Apostila', color: 'bg-blue-500', icon: FileText },
  apresentacao: { label: 'Apresentação', color: 'bg-green-500', icon: FileText },
  exercicio: { label: 'Exercício', color: 'bg-orange-500', icon: FileText },
  video: { label: 'Vídeo', color: 'bg-red-500', icon: FileText },
  outro: { label: 'Outro', color: 'bg-gray-500', icon: FileText }
};

export default function MaterialDidaticoPage() {
  const [materiais, setMateriais] = useState<Material[]>([
    {
      id: '1',
      titulo: 'Apostila de Matemática - Álgebra',
      descricao: 'Material completo sobre equações de primeiro grau',
      tipo: 'apostila',
      disciplina: 'Matemática',
      turma: '7º Ano A',
      arquivo: 'apostila-algebra.pdf',
      tamanho: '2.5 MB',
      dataUpload: '2024-12-01',
      downloads: 23
    },
    {
      id: '2',
      titulo: 'Apresentação - Sistema Solar',
      descricao: 'Slides sobre planetas e características do sistema solar',
      tipo: 'apresentacao',
      disciplina: 'Ciências',
      turma: '6º Ano B',
      arquivo: 'sistema-solar.pptx',
      tamanho: '15.8 MB',
      dataUpload: '2024-11-28',
      downloads: 18
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: '',
    disciplina: '',
    turma: ''
  });

  const [novoMaterial, setNovoMaterial] = useState<Partial<Material>>({
    titulo: '',
    descricao: '',
    tipo: 'apostila',
    disciplina: '',
    turma: '',
    arquivo: '',
    tamanho: '',
    downloads: 0
  });

  const disciplinas = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia'];
  const turmas = ['6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B', '8º Ano A', '9º Ano A'];

  const materiaisFiltrados = materiais.filter(material => {
    return (
      (!filtros.busca || material.titulo.toLowerCase().includes(filtros.busca.toLowerCase())) &&
      (!filtros.tipo || material.tipo === filtros.tipo) &&
      (!filtros.disciplina || material.disciplina === filtros.disciplina) &&
      (!filtros.turma || material.turma === filtros.turma)
    );
  });

  const handleUpload = () => {
    if (!novoMaterial.titulo) return;

    const material: Material = {
      id: Date.now().toString(),
      titulo: novoMaterial.titulo,
      descricao: novoMaterial.descricao || '',
      tipo: novoMaterial.tipo as Material['tipo'],
      disciplina: novoMaterial.disciplina || '',
      turma: novoMaterial.turma || '',
      arquivo: novoMaterial.arquivo || 'arquivo.pdf',
      tamanho: novoMaterial.tamanho || '1.0 MB',
      dataUpload: new Date().toISOString().split('T')[0],
      downloads: 0
    };

    setMateriais([...materiais, material]);
    setNovoMaterial({
      titulo: '',
      descricao: '',
      tipo: 'apostila',
      disciplina: '',
      turma: '',
      arquivo: '',
      tamanho: '',
      downloads: 0
    });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setMateriais(materiais.filter(m => m.id !== id));
  };

  const handleDownload = (id: string) => {
    const material = materiais.find(m => m.id === id);
    if (material) {
      setMateriais(materiais.map(m => 
        m.id === id ? { ...m, downloads: m.downloads + 1 } : m
      ));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Material Didático</h1>
          <p className="text-muted-foreground">Gerencie arquivos, apostilas e apresentações</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={novoMaterial.titulo}
                  onChange={(e) => setNovoMaterial({...novoMaterial, titulo: e.target.value})}
                  placeholder="Nome do material"
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={novoMaterial.descricao}
                  onChange={(e) => setNovoMaterial({...novoMaterial, descricao: e.target.value})}
                  placeholder="Descrição do material"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={novoMaterial.tipo} onValueChange={(value) => setNovoMaterial({...novoMaterial, tipo: value as Material['tipo']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(tiposMaterial).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="disciplina">Disciplina</Label>
                  <Select value={novoMaterial.disciplina} onValueChange={(value) => setNovoMaterial({...novoMaterial, disciplina: value})}>
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
              </div>
              
              <div>
                <Label htmlFor="turma">Turma</Label>
                <Select value={novoMaterial.turma} onValueChange={(value) => setNovoMaterial({...novoMaterial, turma: value})}>
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
                <Label htmlFor="arquivo">Arquivo</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <Folder className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste o arquivo</p>
                  <Input
                    id="arquivo"
                    type="file"
                    className="hidden"
                    onChange={(e) => setNovoMaterial({...novoMaterial, arquivo: e.target.files?.[0]?.name || ''})}
                  />
                </div>
              </div>
              
              <Button onClick={handleUpload} className="w-full">
                Fazer Upload
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="busca">Buscar</Label>
              <Input
                id="busca"
                placeholder="Digite para buscar..."
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="filtro-tipo">Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros({...filtros, tipo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {Object.entries(tiposMaterial).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filtro-disciplina">Disciplina</Label>
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
              <Label htmlFor="filtro-turma">Turma</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de Materiais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materiaisFiltrados.map((material) => {
          const TipoIcon = tiposMaterial[material.tipo].icon;
          
          return (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <TipoIcon className="h-5 w-5 text-muted-foreground" />
                    <Badge className={`${tiposMaterial[material.tipo].color} text-white`}>
                      {tiposMaterial[material.tipo].label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(material.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(material.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(material.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                
                <CardTitle className="text-lg">{material.titulo}</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {material.descricao && (
                    <p className="text-sm text-muted-foreground">{material.descricao}</p>
                  )}
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Disciplina:</span>
                      <span className="font-medium">{material.disciplina}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Turma:</span>
                      <span className="font-medium">{material.turma}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tamanho:</span>
                      <span className="font-medium">{material.tamanho}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Downloads:</span>
                      <span className="font-medium">{material.downloads}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Enviado em {new Date(material.dataUpload).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {materiaisFiltrados.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filtros.busca || filtros.tipo || filtros.disciplina || filtros.turma
                ? 'Nenhum material encontrado com os filtros aplicados'
                : 'Nenhum material cadastrado ainda'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}