import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Users, Edit2, Trash2, Search, RefreshCw, Code } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAllUsers,
  adminUpdateUser,
  adminDeleteUser,
} from "../services/userService";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";
import type { User } from "../types";
import axios from "axios";
import api from "../services/api";

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ✅ State pour le toggle peut_coder en cours
  const [togglingId, setTogglingId] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== "admin") {
    navigate("/app");
    return null;
  }

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers({ role: roleFilter, search: searchQuery });
      setUsers(data);
    } catch {
      toast.error("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);
  useEffect(() => {
    const t = setTimeout(() => loadUsers(), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ✅ Toggle peut_coder
  const handleTogglePeutCoder = async (user: User) => {
    setTogglingId(user.id);
    try {
      const res = await api.post(`/admin/users/${user.id}/toggle-peut-coder`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, peut_coder: res.data.peut_coder } : u,
        ),
      );
      toast.success(
        res.data.peut_coder
          ? `${user.firstName} peut maintenant créer des formations codées`
          : `Droit révoqué pour ${user.firstName}`,
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error))
        toast.error(error.response?.data?.message || "Erreur");
      else toast.error("Une erreur est survenue");
    } finally {
      setTogglingId(null);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const updated = await adminUpdateUser(editingUser.id, {
        prenom: editingUser.firstName,
        nom: editingUser.lastName,
        email: editingUser.email,
        role:
          editingUser.role === "learner"
            ? "apprenant"
            : editingUser.role === "instructor"
              ? "formateur"
              : "admin",
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success("Utilisateur modifié avec succès !");
      setEditingUser(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error))
        toast.error(error.response?.data?.message || "Erreur");
      else toast.error("Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await adminDeleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast.success("Utilisateur supprimé avec succès !");
      setUserToDelete(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error))
        toast.error(error.response?.data?.message || "Erreur");
      else toast.error("Une erreur est survenue");
    } finally {
      setDeleting(false);
    }
  };

  const roleBadgeClass = (role: string) =>
    role === "admin"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : role === "instructor"
        ? "bg-yellow-200 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300"
        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";

  const roleLabel = (role: string) =>
    role === "admin"
      ? "Admin"
      : role === "instructor"
        ? "Formateur"
        : "Apprenant";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" /> Gestion des
              utilisateurs
            </h1>
            <p className="text-gray-500 mt-1">{users.length} utilisateur(s)</p>
          </div>
          <Button variant="outline" onClick={loadUsers} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="apprenant">Apprenants</SelectItem>
              <SelectItem value="formateur">Formateurs</SelectItem>
              <SelectItem value="admin">Administrateurs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              Aucun utilisateur trouvé
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {[...users]
              .sort((a, b) => {
                if (
                  (a.role || "learner") === "admin" &&
                  (b.role || "learner") !== "admin"
                )
                  return -1;
                if (
                  (a.role || "learner") !== "admin" &&
                  (b.role || "learner") === "admin"
                )
                  return 1;
                return 0;
              })
              .map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                        {/* Gauche : avatar + infos */}
                        <div className="flex items-center gap-4 min-w-0">
                          <Avatar className="w-12 h-12 shrink-0">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Milieu : rôle */}
                        <div className="flex justify-center">
                          <Badge
                            className={roleBadgeClass(user.role || "learner")}
                          >
                            {roleLabel(user.role || "learner")}
                          </Badge>
                        </div>

                        {/* Droite : actions */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {user.role === "instructor" && (
                            <button
                              onClick={() => handleTogglePeutCoder(user)}
                              disabled={togglingId === user.id}
                              title={
                                user.peut_coder
                                  ? "Révoquer le droit de créer des formations codées"
                                  : "Autoriser à créer des formations codées"
                              }
                              className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all disabled:opacity-50 ${
                                user.peut_coder
                                  ? "bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300"
                                  : "bg-gray-100 border-gray-300 text-gray-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {togglingId === user.id ? (
                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Code className="w-3 h-3" />
                              )}

                              <span
                                className={`relative w-8 h-4 rounded-full transition-colors ${
                                  user.peut_coder
                                    ? "bg-purple-500"
                                    : "bg-gray-300 dark:bg-slate-600"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                                    user.peut_coder
                                      ? "translate-x-4"
                                      : "translate-x-0"
                                  }`}
                                />
                              </span>

                              <span className="hidden sm:inline">
                                {" "}
                                {user.peut_coder ? "Codé ON" : "Codé OFF"}
                              </span>
                            </button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/app/profile/edit/${user.id}`)
                            }
                            className="gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Modifier
                          </Button>

                          {user.id !== currentUser.id && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setUserToDelete(user)}
                              className="gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* ── Modale modifier ── */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Prénom</Label>
                  <Input
                    value={editingUser.firstName}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nom</Label>
                  <Input
                    value={editingUser.lastName}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>
              {editingUser.role !== "admin" && (
                <div className="space-y-1">
                  <Label>Rôle</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(v) =>
                      setEditingUser({ ...editingUser, role: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Apprenant</SelectItem>
                      <SelectItem value="instructor">Formateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateUser} disabled={saving}>
              {saving ? "Enregistrement..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modale confirmation suppression ── */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte de{" "}
              <strong>
                {userToDelete?.firstName} {userToDelete?.lastName}
              </strong>{" "}
              ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
