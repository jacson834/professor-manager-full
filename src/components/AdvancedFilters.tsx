import { useState, useEffect } from 'react';
import { Filter, X, Calendar, User, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  turmasApi,
  alunosApi,
  professoresApi,
  Turma, Aluno, Professor
} from '@/lib/database';

export interface FilterCriteria {
  turma?: string;
  professor?: string;
  periodo?: string;
  disciplina?: string;
  dataInicio?: string;
  dataFim?: string;
  notaMinima?: number;
  notaMaxima?: number;
  presencaMinima?: number;
  statusAluno?: 'ativo' | 'inativo';
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterCriteria) => void;
  currentFilters: FilterCriteria;
}

export function AdvancedFilters({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  currentFilters 
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterCriteria>(currentFilters);
  const [professoresList, setProfessoresList] = useState<Professor[]>([]);
  const [turmasList, setTurmasList] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [periodos, setPeriodos] = useState<string[]>([]);

  useEffect(() => {
    const loadFilterData = async () => { // Tornar assíncrona
      try {
        const [professoresData, turmasData] = await Promise.all([
          professoresApi.getProfessores(),
          turmasApi.getTurmas(),
        ]);
        setProfessoresList(professoresData);
        setTurmasList(turmasData);

        setDisciplinas(Array.from(new Set(professoresData.map(p => p.materia))));
     // Linha 60 CORRIGIDA:
setPeriodos(Array.from(new Set(turmasData.map(t => `${t.ano}/${t.semestre || ''}`))).filter(p => p !== '/'));

      } catch (error) {
        console.error("Erro ao carregar dados para filtros avançados:", error);
      }
    };
    loadFilterData();
  }, []);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
    onApplyFilters({});
  };

  const updateFilter = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Filtros Avançados</CardTitle>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filtros de Turma e Professor */}
          <div>
            <h3 className="flex items-center space-x-2 text-lg font-semibold mb-4">
              <BookOpen className="h-4 w-4" />
              <span>Turmas e Professores</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turma">Turma</Label>
                <Select value={filters.turma || ''} onValueChange={(value) => updateFilter('turma', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar turma" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="">Todas as turmas</SelectItem>
                    {turmasList.map(turma => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professor">Professor</Label>
                <Select value={filters.professor || ''} onValueChange={(value) => updateFilter('professor', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar professor" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="">Todos os professores</SelectItem>
                    {professoresList.map(professor => (
                      <SelectItem key={professor.id} value={professor.id}>
                        {professor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disciplina">Disciplina</Label>
                <Select value={filters.disciplina || ''} onValueChange={(value) => updateFilter('disciplina', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar disciplina" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="">Todas as disciplinas</SelectItem>
                    {disciplinas.map(disciplina => (
                      <SelectItem key={disciplina} value={disciplina}>
                        {disciplina}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Período</Label>
                <Select value={filters.periodo || ''} onValueChange={(value) => updateFilter('periodo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar período" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="">Todos os períodos</SelectItem>
                    {periodos.map(periodo => (
                      <SelectItem key={periodo} value={periodo}>
                        {periodo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Filtros de Data */}
          <div>
            <h3 className="flex items-center space-x-2 text-lg font-semibold mb-4">
              <Calendar className="h-4 w-4" />
              <span>Período</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filters.dataInicio || ''}
                  onChange={(e) => updateFilter('dataInicio', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filters.dataFim || ''}
                  onChange={(e) => updateFilter('dataFim', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Filtros de Performance */}
          <div>
            <h3 className="flex items-center space-x-2 text-lg font-semibold mb-4">
              <User className="h-4 w-4" />
              <span>Performance</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notaMinima">Nota Mínima</Label>
                <Input
                  id="notaMinima"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={filters.notaMinima || ''}
                  onChange={(e) => updateFilter('notaMinima', parseFloat(e.target.value))}
                  placeholder="0.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notaMaxima">Nota Máxima</Label>
                <Input
                  id="notaMaxima"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={filters.notaMaxima || ''}
                  onChange={(e) => updateFilter('notaMaxima', parseFloat(e.target.value))}
                  placeholder="10.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presencaMinima">Presença Mínima (%)</Label>
                <Input
                  id="presencaMinima"
                  type="number"
                  min="0"
                  max="100"
                  value={filters.presencaMinima || ''}
                  onChange={(e) => updateFilter('presencaMinima', parseInt(e.target.value))}
                  placeholder="75"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClear}>
              Limpar Filtros
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleApply}>
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}