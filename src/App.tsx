import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

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
import LoginPage from './pages/LoginPage';
import UsuariosPage from './components/UsuariosPage';

const queryClient = new QueryClient();

function ProtectedRoute({ children, roleRequired }: { children: React.ReactNode, roleRequired?: 'admin' | 'professor' }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roleRequired && user.role !== roleRequired && user.role !== 'admin') {
    return <div className="flex h-screen items-center justify-center">Você não tem permissão para acessar esta página.</div>;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Index />} />
                <Route path="professores" element={
                  <ProtectedRoute roleRequired="admin">
                    <ProfessoresPage />
                  </ProtectedRoute>
                } />
                <Route path="turmas" element={<TurmasPage />} />
                <Route path="turmas/:turmaId/overview" element={<TurmaOverviewPage />} />
                <Route path="alunos" element={<AlunosPage />} />
                <Route path="presenca" element={
                  <ProtectedRoute roleRequired="professor">
                    <PresencaPage />
                  </ProtectedRoute>
                } />
                <Route path="notas/:turmaId/:alunoId" element={<NotasPage />} />
                <Route path="planejamento" element={
                  <ProtectedRoute roleRequired="professor">
                    <PlanejamentoPage />
                  </ProtectedRoute>
                } />
                <Route path="analises" element={<AnalysesPage />} />
                <Route path="relatorios" element={<RelatoriosPage />} />
                <Route path="configuracoes" element={
                  <ProtectedRoute roleRequired="admin">
                    <ConfiguracoesPage />
                  </ProtectedRoute>
                } />
                <Route path="usuarios" element={
                  <ProtectedRoute roleRequired="admin">
                    <UsuariosPage />
                  </ProtectedRoute>
                } />
                <Route path="agenda" element={
                  <ProtectedRoute roleRequired="professor">
                    <AgendaPessoalPage />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
