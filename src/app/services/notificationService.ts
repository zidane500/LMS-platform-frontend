import api from "./api";

export interface Notification {
  id: number;
  message: string;
  type: string;
  lu: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await api.get("/notifications");
  return res.data;
}

export async function getNonLues(): Promise<number> {
  const res = await api.get("/notifications/non-lues");
  return res.data.count;
}

export async function marquerLu(id: number): Promise<void> {
  await api.post(`/notifications/${id}/lire`);
}

export async function marquerToutLu(): Promise<void> {
  await api.post("/notifications/tout-lire");
}
export async function supprimerNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
