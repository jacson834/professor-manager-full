import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

// Importar o componente de Layout
import Layout from './components/Layout';

// Importar todos os componentes das páginas que devem aparecer dentro do layout
import Index from "./pages/Index"; // Este é o Dashboard
import NotFound from "./pages/NotFound";
import ProfessoresPage from './components/ProfessoresPage';
import TurmasPage from './components/TurmasPage';
import AlunosPage from './components/AlunosPage';
import PresencaPage from './components/PresencaPage';
import NotasPage from './components/NotasPage'; // Página de Notas
import PlanejamentoPage from './components/PlanejamentoPage';
import AnalysesPage from './components/AnalysesPage';
import RelatoriosPage from './components/RelatoriosPage';
import ConfiguracoesPage from './components/ConfiguracoesPage';
import AgendaPessoalPage from './components/AgendaPessoalPage';
import TurmaOverviewPage from './components/TurmaOverviewPage'; // Visão Geral da Turma

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota Pai que renderiza o Layout */}
            {/* Todas as rotas aninhadas aqui usarão o Layout */}
            <Route path="/" element={<Layout />}>
              {/* index: Rota padrão para o caminho pai (renderiza o Dashboard em '/') */}
              <Route index element={<Index />} />

              {/* Rotas Aninhadas: Todas essas páginas serão renderizadas DENTRO do <Outlet /> do Layout */}
              <Route path="professores" element={<ProfessoresPage />} />
              <Route path="turmas" element={<TurmasPage />} />
              {/* Rota para a Visão Geral da Turma, aceita turmaId como parâmetro */}
              <Route path="turmas/:turmaId/overview" element={<TurmaOverviewPage />} />
              <Route path="alunos" element={<AlunosPage />} />
              <Route path="presenca" element={<PresencaPage />} />
              {/* Rota para NotasPage AGORA COM PARAMETROS DE URL para turmaId e alunoId */}
              <Route path="notas/:turmaId/:alunoId" element={<NotasPage />} /> {/* <--- VERIFIQUE ESTA LINHA! */}
              <Route path="planejamento" element={<PlanejamentoPage />} />
              <Route path="analises" element={<AnalysesPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
              <Route path="agenda" element={<AgendaPessoalPage />} />

              {/* Rota Catch-all para 404 dentro do Layout (DEVE SER A ÚLTIMA ROTA ANINHADA) */}
              <Route path="*" element={<NotFound />} />
            </Route>
            {/* Se houver rotas que não devem ter o layout (ex: /login, /cadastro), elas ficariam AQUI FORA:
            <Route path="/login" element={<LoginPage />} />
            */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;