import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  professoresApi,
  turmasApi,
  alunosApi,
  notasApi,
  presencasApi // Adicionar presencasApi
} from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  type: 'professor' | 'turma' | 'aluno' | 'nota' | 'presenca';
  title: string;
  subtitle: string;
  data: any;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    const searchResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    try {
      // Buscar todos os dados de forma assíncrona
      const [professores, turmas, alunos, notas, presencas] = await Promise.all([ // Adicionado presencas aqui
        professoresApi.getProfessores(),
        turmasApi.getTurmas(),
        alunosApi.getAlunos(),
        notasApi.getNotas(),
        presencasApi.getPresencas(), // API Assíncrona
      ]);

      // Buscar professores
      professores.forEach(professor => {
        if (professor.nome.toLowerCase().includes(lowerQuery) ||
            professor.email.toLowerCase().includes(lowerQuery) ||
            professor.materia.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            id: professor.id,
            type: 'professor',
            title: professor.nome,
            subtitle: `${professor.materia} - ${professor.email}`,
            data: professor
          });
        }
      });

      // Buscar turmas
      turmas.forEach(turma => {
        if (turma.nome.toLowerCase().includes(lowerQuery) ||
            turma.ano.toLowerCase().includes(lowerQuery) ||
            (turma.semestre && turma.semestre.toLowerCase().includes(lowerQuery))) {
          const professor = professores.find(p => p.id === turma.professorId);
          searchResults.push({
            id: turma.id,
            type: 'turma',
            title: turma.nome,
            subtitle: `${turma.ano}/${turma.semestre || 'N/A'} - Prof. ${professor?.nome || 'N/A'}`,
            data: turma
          });
        }
      });

      // Buscar alunos
      alunos.forEach(aluno => {
        if (aluno.nome.toLowerCase().includes(lowerQuery) ||
            aluno.email.toLowerCase().includes(lowerQuery) ||
            aluno.matricula.toLowerCase().includes(lowerQuery)) {
          const turma = turmas.find(t => t.id === aluno.turmaId);
          searchResults.push({
            id: aluno.id,
            type: 'aluno',
            title: aluno.nome,
            subtitle: `${aluno.matricula} - ${turma?.nome || 'N/A'}`,
            data: aluno
          });
        }
      });

      // Buscar notas
      notas.forEach(nota => {
        const aluno = alunos.find(a => a.id === nota.alunoId);
        const turma = turmas.find(t => t.id === nota.turmaId);
        
        if ((aluno?.nome && aluno.nome.toLowerCase().includes(lowerQuery)) ||
            (turma?.nome && turma.nome.toLowerCase().includes(lowerQuery)) ||
            nota.avaliacao.toLowerCase().includes(lowerQuery) ||
            String(nota.nota).includes(lowerQuery)) { // Adicionado busca por nota
          searchResults.push({
            id: nota.id,
            type: 'nota',
            title: `Nota ${nota.nota} - ${nota.avaliacao}`,
            subtitle: `${aluno?.nome || 'Aluno Desconhecido'} - ${turma?.nome || 'Turma Desconhecida'}`,
            data: nota
          });
        }
      });

      // Buscar presenças
      presencas.forEach(presenca => {
        const aluno = alunos.find(a => a.id === presenca.alunoId);
        const turma = turmas.find(t => t.id === presenca.turmaId);
        
        if ((aluno?.nome && aluno.nome.toLowerCase().includes(lowerQuery)) ||
            (turma?.nome && turma.nome.toLowerCase().includes(lowerQuery)) ||
            (presenca.presente ? 'presente' : 'falta').includes(lowerQuery)) {
          searchResults.push({
            id: presenca.id,
            type: 'presenca',
            title: `Presença: ${presenca.presente ? 'Presente' : 'Falta'}`,
            subtitle: `${aluno?.nome || 'Aluno Desconhecido'} - ${turma?.nome || 'Turma Desconhecida'} - ${new Date(presenca.data).toLocaleDateString('pt-BR')}`,
            data: presenca
          });
        }
      });

      setResults(searchResults.slice(0, 20)); // Limitar a 20 resultados
    } catch (error) {
      console.error("Erro na busca global:", error);
      toast({
        title: "Erro na Busca",
        description: "Falha ao realizar a busca. Verifique a conexão com o servidor.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'professor': return 'bg-primary text-primary-foreground';
      case 'turma': return 'bg-secondary text-secondary-foreground';
      case 'aluno': return 'bg-accent text-accent-foreground';
      case 'nota': return 'bg-warning text-warning-foreground';
      case 'presenca': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'professor': return 'Professor';
      case 'turma': return 'Turma';
      case 'aluno': return 'Aluno';
      case 'nota': return 'Nota';
      case 'presenca': return 'Presença';
      default: return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-2xl mx-4 shadow-elegant">
        <CardContent className="p-0">
          <div className="flex items-center space-x-2 p-4 border-b border-border">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar professores, turmas, alunos, notas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-base"
              autoFocus
            />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center text-muted-foreground">
                Buscando...
              </div>
            )}

            {!isLoading && query && results.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum resultado encontrado para "{query}"
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="p-2">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getTypeColor(result.type)} variant="secondary">
                          {getTypeLabel(result.type)}
                        </Badge>
                        <span className="font-medium text-foreground">
                          {result.title}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!query && (
              <div className="p-4 text-center text-muted-foreground">
                Digite para começar a pesquisar
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}