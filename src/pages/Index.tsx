// src/pages/Index.tsx
import Dashboard from '@/components/Dashboard'; // Importar o componente Dashboard

// Index agora simplesmente renderiza o Dashboard,
// pois o Layout e a navegação entre páginas são gerenciados pelo App.tsx e Layout.tsx
export default function Index() {
  return (
    <Dashboard />
  );
}