// src/app/services/userService.ts
import api from './api';
import { User } from '../types';
import { mapApiUserToUser } from './authService';

// ─── US 1.6 : Modifier son profil ────────────────────────
// FormData est obligatoire pour envoyer une image
export async function updateProfile(data: {
  prenom: string;
  nom: string;
  telephone?: string;
  date_naissance?: string;
  langue_preferee?: string;
  domaines_cibles?: string[];
  technologies?: string[];
  photo_profil?: File | null;
}): Promise<User> {
  const fd = new FormData();
  fd.append('prenom', data.prenom);
  fd.append('nom', data.nom);
  if (data.telephone)       fd.append('telephone', data.telephone);
  if (data.date_naissance)  fd.append('date_naissance', data.date_naissance);
  if (data.langue_preferee) fd.append('langue_preferee', data.langue_preferee);
  (data.domaines_cibles ?? []).forEach(d => fd.append('domaines_cibles[]', d));
  (data.technologies ?? []).forEach(t => fd.append('technologies[]', t));
  if (data.photo_profil)    fd.append('photo_profil', data.photo_profil);

  const res = await api.post('/users/profile', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapApiUserToUser(res.data.user);
}

// ─── US 1.7 (admin) : Lister tous les utilisateurs ───────
export async function getAllUsers(filters?: { role?: string; search?: string }): Promise<User[]> {
  const params: Record<string, string> = {};
  if (filters?.role   && filters.role   !== 'all') params.role   = filters.role;
  if (filters?.search && filters.search !== '')    params.search = filters.search;
  const res = await api.get('/admin/users', { params });
  return res.data.map(mapApiUserToUser);
}

// ─── US 1.7 (admin) : Modifier un compte ─────────────────
export async function adminUpdateUser(
  userId: string,
  data: { prenom?: string; nom?: string; email?: string; role?: string }
): Promise<User> {
  const res = await api.put(`/admin/users/${userId}`, data);
  return mapApiUserToUser(res.data.user);
}

// ─── US 1.7 (admin) : Supprimer un compte ────────────────
export async function adminDeleteUser(userId: string): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}
