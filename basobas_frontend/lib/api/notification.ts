import axios from './axios';
import { API } from './endpoints';

export type NotificationItem = {
  _id: string;
  user: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
};


export interface NotificationListResponse {
  data: NotificationItem[];
  total: number;
  page: number;
  pages: number;
}

const toNotificationArray = (payload: any): NotificationItem[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.notifications)) return payload.data.notifications;
  return [];
};

export const getNotifications = async (page = 1, limit = 20): Promise<NotificationListResponse> => {
  const res = await axios.get(API.NOTIFICATION.LIST + `?page=${page}&limit=${limit}`);
  const payload = res?.data;
  const data = toNotificationArray(payload);

  return {
    data,
    total: Number(payload?.total ?? payload?.count ?? data.length ?? 0),
    page: Number(payload?.page ?? 1),
    pages: Number(payload?.pages ?? 1),
  };
};

export const markNotificationRead = async (id: string) => {
  const res = await axios.put(API.NOTIFICATION.MARK_READ(id));
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await axios.put(API.NOTIFICATION.MARK_ALL_READ);
  return res.data;
};

export default {
  getNotifications,
  markNotificationRead,
};
