import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  UserPlus, 
  Trash2, 
  UserCog,
  Edit,
  KeyRound,
  Users, 
  ShieldCheck, 
  UserCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  nome: string;
  role: 'admin' | 'professor';
}

export default function UsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    nome: '',
    role: 'professor' as 'admin' | 'professor'
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState({
    username: '',
    nome: '',
    role: 'professor' as 'admin' | 'professor',
    password: ''
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get('/api/usuarios');
      setUsers(data.usuarios);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao carregar usuários.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/usuarios', newUser);
      toast({ title: "Sucesso", description: "Usuário criado com sucesso!" });
      setNewUser({ username: '', password: '', nome: '', role: 'professor' });
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error || "Falha ao criar usuário.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await axios.delete(`/api/usuarios/${id}`);
      toast({ title: "Sucesso", description: "Usuário removido!" });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao excluir usuário.",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUserId(user.id);
    setEditUser({
      username: user.username,
      nome: user.nome,
      role: user.role,
      password: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    try {
      await axios.put(`/api/usuarios/${editingUserId}`, {
        username: editUser.username,
        nome: editUser.nome,
        role: editUser.role,
        password: editUser.password || undefined
      });
      toast({
        title: 'Sucesso',
        description: editUser.password ? 'Usuário atualizado e senha redefinida.' : 'Usuário atualizado com sucesso.'
      });
      setIsEditDialogOpen(false);
      setEditingUserId(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao atualizar usuário.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie os acessos ao sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  value={newUser.nome} 
                  onChange={e => setNewUser({...newUser, nome: e.target.value})} 
                  placeholder="Ex: João Silva" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Nome de Usuário (Login)</Label>
                <Input 
                  value={newUser.username} 
                  onChange={e => setNewUser({...newUser, username: e.target.value})} 
                  placeholder="ex: joao.silva" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input 
                  type="password" 
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                  placeholder="••••••••" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Nível de Acesso</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(val: 'admin' | 'professor') => setNewUser({...newUser, role: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Salvar Usuário</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando usuários...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-sm">
                    <th className="p-3 font-medium">Usuário</th>
                    <th className="p-3 font-medium">Nome</th>
                    <th className="p-3 font-medium">Nível</th>
                    <th className="p-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-mono text-sm">{user.username}</td>
                      <td className="p-3 text-sm">{user.nome}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {user.role === 'admin' ? 'Administrador' : 'Professor'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          className="mr-1"
                          title="Editar usuário / trocar senha"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDeleteDialog(user)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={editUser.nome}
                onChange={e => setEditUser({ ...editUser, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nome de Usuário (Login)</Label>
              <Input
                value={editUser.username}
                onChange={e => setEditUser({ ...editUser, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select
                value={editUser.role}
                onValueChange={(val: 'admin' | 'professor') => setEditUser({ ...editUser, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Nova Senha (opcional)</Label>
              <Input
                type="password"
                value={editUser.password}
                onChange={e => setEditUser({ ...editUser, password: e.target.value })}
                placeholder="Deixe em branco para manter"
              />
            </div>
            <Button type="submit" className="w-full">Salvar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir o usuário <strong>{userToDelete?.username || ''}</strong>. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}>
              Excluir usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
