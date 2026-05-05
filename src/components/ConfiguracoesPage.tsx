import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  professoresApi,
  turmasApi,
  alunosApi,
  presencasApi,
  notasApi,
  planejamentosApi,
  feriadosApi,
  alertasAlunosApi,
  eventosApi,
  backupApi,
} from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { FileDown, FileUp, Eraser, Settings, Info, Cloud, Save, Users, Database, Wrench } from 'lucide-react';
import axios from 'axios';

interface AppSettings {
  institutionName: string;
  currentAcademicYear: string;
  darkMode: boolean;
  notifications: boolean;
  globalSearch: boolean;
}

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | 'import' | 'clear' | 'migrate'>(null);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    institutionName: '',
    currentAcademicYear: new Date().getFullYear().toString(),
    darkMode: false,
    notifications: true,
    globalSearch: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const STORAGE_KEYS = {
    professores: 'pm_professores',
    turmas: 'pm_turmas',
    alunos: 'pm_alunos',
    presencas: 'pm_presencas',
    notas: 'pm_notas',
    planejamentos: 'pm_planejamentos',
    feriados: 'pm_feriados',
    eventos: 'pm_eventos',
    alertas: 'pm_alertas'
  };

  const clearLocalStorage = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  };

  // ÚNICA DECLARAÇÃO DO ESTADO 'stats'
  const [stats, setStats] = useState({
    totalProfessores: 0,
    totalTurmas: 0,
    totalAlunos: 0,
    totalEventos: 0,
  });

  // ÚNICO useEffect para carregar estatísticas e configurações
    useEffect(() => {
      const fetchStatsAndSettings = async () => {
        try {
          const settingsResponse = await axios.get('/api/settings');
          if (settingsResponse.data) {
            setAppSettings(settingsResponse.data);
          }

          const [professores, turmas, alunos, eventos] = await Promise.all([
            professoresApi.getProfessores(),
            turmasApi.getTurmas(),
            alunosApi.getAlunos(),
            eventosApi.getEventos()
          ]);

          setStats({
            totalProfessores: professores.length,
            totalTurmas: turmas.length,
            totalAlunos: alunos.length,
            totalEventos: eventos.length,
          });

        } catch (error) {
          console.error("Erro ao carregar estatísticas ou configurações:", error);
          toast({
            title: "Erro",
            description: "Falha ao carregar estatísticas ou configurações.",
            variant: "destructive"
          });
        }
      };
      fetchStatsAndSettings();
    }, [toast]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await axios.post('/api/settings', appSettings);
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
        variant: "default"
      });
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.error || "Falha ao salvar configurações.",
        variant: "destructive"
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const backup = await backupApi.exportData();
      
      const jsonString = JSON.stringify(backup.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `professor_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso!",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro fatal ao exportar dados:", error);
      toast({
        title: "Erro",
        description: "Falha ao exportar dados. Verifique o console.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXMLData = async () => {
    setIsExporting(true);
    try {
      const results = await Promise.allSettled([
        professoresApi.getProfessores(),
        turmasApi.getTurmas(),
        alunosApi.getAlunos(),
        presencasApi.getPresencas(),
        notasApi.getNotas(),
        planejamentosApi.getPlanejamentos(),
        feriadosApi.getFeriados(),
        eventosApi.getEventos(),
        alertasAlunosApi.getAlerts().then(res => res.alertas)
      ]);

      const [
        professoresRes, turmasRes, alunosRes,
        presencasRes, notasRes, planejamentosRes,
        feriadosRes, eventosRes, alertasRes
      ] = results;

      const allData = {
        professores: professoresRes.status === 'fulfilled' ? professoresRes.value : [],
        turmas: turmasRes.status === 'fulfilled' ? turmasRes.value : [],
        alunos: alunosRes.status === 'fulfilled' ? alunosRes.value : [],
        presencas: presencasRes.status === 'fulfilled' ? presencasRes.value : [],
        notas: notasRes.status === 'fulfilled' ? notasRes.value : [],
        planejamentos: planejamentosRes.status === 'fulfilled' ? planejamentosRes.value : [],
        feriados: feriadosRes.status === 'fulfilled' ? feriadosRes.value : [],
        eventos: eventosRes.status === 'fulfilled' ? eventosRes.value : [],
        alertas: alertasRes.status === 'fulfilled' ? alertasRes.value : []
      };
      
      const convertToXML = (obj: any, rootName: string = 'root'): string => {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
        
        const convertObject = (data: any, indent: string = '  '): string => {
          let result = '';
          
          if (Array.isArray(data)) {
            data.forEach((item, index) => {
              const idAttr = item.id ? ` id="${item.id}"` : '';
              result += `${indent}<item${idAttr}>\n`;
              result += convertObject(item, indent + '  ');
              result += `${indent}</item>\n`;
            });
          } else if (typeof data === 'object' && data !== null) {
            Object.entries(data).forEach(([key, value]) => {
              const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
              if (Array.isArray(value)) {
                result += `${indent}<${safeKey}>\n`;
                result += convertObject(value, indent + '  ');
                result += `${indent}</${safeKey}>\n`;
              } else if (typeof value === 'object' && value !== null) {
                result += `${indent}<${safeKey}>\n`;
                result += convertObject(value, indent + '  ');
                result += `${indent}</${safeKey}>\n`;
              } else {
                result += `${indent}<${safeKey}>${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${safeKey}>\n`;
              }
            });
          }
          
          return result;
        };
        
        xml += convertObject(allData);
        xml += `</${rootName}>`;
        return xml;
      };
      
      const xmlString = convertToXML(allData, 'backup-escola');
      const blob = new Blob([xmlString], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `professor_manager_backup_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const failedRequests = results.filter(res => res.status === 'rejected');
      if (failedRequests.length > 0) {
        toast({
          title: "Exportação Parcial",
          description: `Dados exportados, mas falha ao buscar ${failedRequests.length} tipo(s) de dados para XML. Verifique o console.`,
          variant: "warning"
        });
        failedRequests.forEach(res => console.error("Detalhes da falha na exportação XML:", (res as PromiseRejectedResult).reason));
      } else {
        toast({
          title: "Sucesso",
          description: "Dados exportados em XML com sucesso!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Erro fatal ao exportar XML:", error);
      toast({
        title: "Erro",
        description: "Falha geral ao iniciar a exportação XML. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToImport(e.target.files[0]);
    } else {
      setFileToImport(null);
    }
  };

  const handleImportData = async () => {
    if (!fileToImport) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo selecionado para importar.",
        variant: "destructive"
      });
      return;
    }
    
    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let importedData: any;
        
        if (fileToImport.name.endsWith('.json')) {
          importedData = JSON.parse(content);
        } else {
          toast({
            title: "Formato não suportado",
            description: "Por favor, use arquivos JSON.",
            variant: "destructive",
          });
          setIsImporting(false);
          return;
        }

        await backupApi.importData(importedData);

        toast({
          title: "Sucesso",
          description: "Dados importados com sucesso!",
          variant: "default"
        });
        
        window.location.reload();
        
      } catch (error: any) {
        console.error("Erro na importação de dados:", error);
        toast({
          title: "Erro na importação",
          description: error.message || "Não foi possível importar os dados. Verifique o formato do arquivo.",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    };
    
    reader.readAsText(fileToImport);
  };

  const clearAllData = async () => {
    setIsLoading(true);
    try {
      await axios.post('/api/admin/clear-all-data');

      toast({
        title: "Sucesso",
        description: "Dados limpos com sucesso!",
        variant: "default"
      });

      window.location.reload();

    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      toast({
        title: "Erro",
        description: "Falha ao limpar todos os dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const migrateProfessorUsuario = async () => {
    try {
      const response = await axios.post('/api/admin/migrate-professor-usuario');
      toast({
        title: "Sucesso",
        description: response.data.message,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro na migração:", error);
      toast({
        title: "Erro",
        description: "Falha na migração de professor-usuário.",
        variant: "destructive"
      });
    }
  };

  const runConfirmedAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === 'import') {
      await handleImportData();
      return;
    }
    if (action === 'clear') {
      await clearAllData();
      return;
    }
    if (action === 'migrate') {
      await migrateProfessorUsuario();
    }
  };

  const runVacuum = async () => {
    try {
      const response = await axios.post('/api/admin/vacuum');
      toast({ title: 'Sucesso', description: response.data.message || 'Otimização concluída.' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao executar otimização do banco.',
        variant: 'destructive'
      });
    }
  };

  const downloadDbBackup = async () => {
    try {
      const response = await axios.get('/api/admin/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-db-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.db`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Sucesso', description: 'Backup do banco baixado com sucesso.' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao gerar backup do banco.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações gerais do sistema</p>
      </div>

      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="backup">Backup & Restauração</TabsTrigger>
          <TabsTrigger value="admin">Administração</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Backup e Restauração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <FileDown className="h-4 w-4" />
                  Exportar Dados
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Faça um backup de todos os dados do sistema em um arquivo local (JSON ou XML).
                  Recomendamos fazer backup regularmente para proteger seus dados.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    {isExporting ? 'Exportando JSON...' : 'Exportar JSON'}
                  </Button>
                  <Button
                    onClick={handleExportXMLData}
                    disabled={isExporting}
                    className="bg-secondary hover:bg-secondary-hover"
                  >
                    {isExporting ? 'Exportando XML...' : 'Exportar XML'}
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <FileUp className="h-4 w-4" />
                  Importar Dados
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Restaure dados a partir de um arquivo de backup.
                  <span className="font-bold text-destructive"> Isso sobrescreverá os dados existentes no backend!</span>
                </p>
                <Input type="file" accept=".json,.xml" onChange={handleImportFileChange} className="mb-3" />
                <Button onClick={() => setConfirmAction('import')} disabled={!fileToImport || isImporting} className="bg-primary hover:bg-primary-hover">
                  {isImporting ? 'Importando...' : 'Importar Dados'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Funcionalidade de importação para o backend é conceitual e requer desenvolvimento de APIs específicas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Info className="h-5 w-5" />
                Opções de Administração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Vincular Professores a Usuários
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                 associa usuários professor aos seus registros de professor correspondentes.
                </p>
                <Button onClick={() => setConfirmAction('migrate')} variant="outline">
                  Executar Migração
                </Button>
              </div>
              <Separator className="my-6" />
              <div className="mb-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4" />
                  Backup Técnico do Banco (.db)
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Gera e baixa uma cópia técnica completa do arquivo SQLite.
                </p>
                <Button onClick={downloadDbBackup} variant="outline">
                  Baixar Backup .db
                </Button>
              </div>
              <Separator className="my-6" />
              <div className="mb-6">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4" />
                  Otimização do Banco
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Executa manutenção VACUUM para reduzir fragmentação e melhorar performance.
                </p>
                <Button onClick={runVacuum} variant="outline">
                  Executar VACUUM
                </Button>
              </div>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Eraser className="h-4 w-4 text-destructive" />
                  Limpar Todos os Dados
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Apaga todos os dados (professores, turmas, alunos, notas, etc.) permanentemente do banco de dados.
                  <span className="font-bold text-destructive"> Esta ação é irreversível!</span>
                </p>
                <Button onClick={() => setConfirmAction('clear')} disabled={isLoading} variant="destructive">
                  {isLoading ? 'Limpando...' : 'Limpar Tudo'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Funcionalidade de limpeza total para o backend é conceitual e requer desenvolvimento de API específica.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">Geral</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Informações da Escola</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Nome da Instituição</Label>
                        <Input 
                          placeholder="Nome da Escola" 
                          className="mt-2"
                          value={appSettings.institutionName}
                          onChange={(e) => setAppSettings({...appSettings, institutionName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Ano Letivo Atual</Label>
                        <Input 
                          placeholder="2024" 
                          className="mt-2"
                          value={appSettings.currentAcademicYear}
                          onChange={(e) => setAppSettings({...appSettings, currentAcademicYear: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Recursos</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Modo Escuro</Label>
                          <p className="text-xs text-muted-foreground">
                            Ativa ou desativa o tema escuro da aplicação.
                          </p>
                        </div>
                        <Switch 
                          checked={appSettings.darkMode}
                          onCheckedChange={(checked) => setAppSettings({...appSettings, darkMode: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Notificações</Label>
                          <p className="text-xs text-muted-foreground">
                            Receber alertas do sistema.
                          </p>
                        </div>
                        <Switch 
                          checked={appSettings.notifications}
                          onCheckedChange={(checked) => setAppSettings({...appSettings, notifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Busca Global</Label>
                          <p className="text-xs text-muted-foreground">
                            Pesquisa rápida em todos os dados.
                          </p>
                        </div>
                        <Switch 
                          checked={appSettings.globalSearch}
                          onCheckedChange={(checked) => setAppSettings({...appSettings, globalSearch: checked})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingSettings ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Estatísticas do Sistema (Do Backend)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {stats.totalProfessores}
                      </div>
                      <div className="text-sm text-muted-foreground">Professores</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {stats.totalTurmas}
                      </div>
                      <div className="text-sm text-muted-foreground">Turmas</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {stats.totalAlunos}
                      </div>
                      <div className="text-sm text-muted-foreground">Alunos</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {stats.totalEventos}
                      </div>
                      <div className="text-sm text-muted-foreground">Eventos</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">
                    💡 Sobre o Sistema
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Sistema de Gestão Escolar v1.0 - Os dados agora são persistidos em um banco de dados no backend.
                    Faça backups regulares usando a aba "Backup & Restauração".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'import' && 'Importar dados'}
              {confirmAction === 'clear' && 'Limpar todos os dados'}
              {confirmAction === 'migrate' && 'Vincular professores e usuários'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'import' && 'Importar dados sobrescreverá os dados existentes. Esta ação é irreversível.'}
              {confirmAction === 'clear' && 'Esta ação limpará TODOS os dados do banco de dados permanentemente. Esta ação é irreversível!'}
              {confirmAction === 'migrate' && 'Deseja vincular usuários professores aos seus professores correspondentes?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirmedAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
