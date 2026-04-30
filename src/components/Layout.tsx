import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  ClipboardList, 
  BarChart3, 
  FileText,
  Settings,
  Calendar,
  TrendingUp,
  Menu,
  LogOut
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HeaderNotifications } from '@/components/HeaderNotifications';
import { GlobalSearch } from '@/components/GlobalSearch';
import { AdvancedFilters, FilterCriteria } from '@/components/AdvancedFilters';
import { useAuth } from '@/contexts/AuthContext';

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'professores', label: 'Professores', icon: GraduationCap, path: '/professores' },
  { id: 'turmas', label: 'Turmas', icon: BookOpen, path: '/turmas' },
  { id: 'alunos', label: 'Alunos', icon: Users, path: '/alunos' },
  { id: 'presenca', label: 'Presença', icon: ClipboardList, path: '/presenca' },
  { id: 'agenda', label: 'Agenda Pessoal', icon: Calendar, path: '/agenda' },
  { id: 'planejamento', label: 'Planejamento', icon: Calendar, path: '/planejamento' },
  { id: 'analyses', label: 'Análises', icon: TrendingUp, path: '/analises' },
  { id: 'relatorios', label: 'Relatórios', icon: FileText, path: '/relatorios' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/configuracoes' },
  { id: 'usuarios', label: 'Usuários', icon: Users, path: '/usuarios' },
];

export default function Layout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterCriteria>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApplyFilters = (filters: FilterCriteria) => {
    setCurrentFilters(filters);
  };

  const currentPageLabel = menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div className="overflow-hidden">
            <h1 className="text-xl font-bold text-foreground truncate">
              Sist. Escolar
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Olá, {user?.nome || 'Usuário'}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.filter(item => {
            if (item.path === '/configuracoes' || item.path === '/usuarios' || item.path === '/professores') {
              return user?.role === 'admin';
            }
            if (item.path === '/presenca' || item.path === '/agenda' || item.path === '/planejamento') {
              return user?.role === 'professor';
            }
            return true;
          }).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - desktop only */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-shrink-0 fixed h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar - Sheet drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-card">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-64">
        {/* Header fixo */}
        <header className="bg-gradient-primary shadow-elegant sticky top-0 z-40 flex-shrink-0">
          <div className="px-4 md:px-6 py-4 pl-14 md:pl-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary-foreground truncate">
                {currentPageLabel}
              </h2>
              
              <div className="flex items-center space-x-3">
                <HeaderNotifications />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 p-4 md:p-6">
          <Card className="bg-card shadow-card border-border h-full">
            <div className="p-4 md:p-6 h-full overflow-x-auto">
              <Outlet />
            </div>
          </Card>
        </div>
      </main>

      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      
      <AdvancedFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={currentFilters}
      />
    </div>
  );
}
