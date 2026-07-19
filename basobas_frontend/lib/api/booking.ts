import axios from './axios';
import { API } from './endpoints';

export interface Booking {
  _id: string;
  property: string | { _id: string; title?: string; location?: string; price?: number; status?: string };
  user: string | { _id: string; name?: string; email?: string };
  owner?: string | { _id: string; name?: string; email?: string };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantInfo {
  name?: string;
  email?: string;
  phone?: string;
  idNumber?: string;
}

export interface PaymentInfo {
  method: string;
  amount: number;
  currency?: string;
  status?: 'pending' | 'success' | 'failed';
  transactionId?: string;
  meta?: any;
}

export const createBooking = async (payload: { propertyId: string; message?: string; tenantInfo?: TenantInfo; payment?: PaymentInfo }) => {
  const response = await axios.post(API.BOOKING.CREATE, payload);
  return response.data as Booking;
};

export const getMyBookings = async () => {
  const response = await axios.get(API.BOOKING.MY);
  return response.data as Booking[];
};

export const getOwnerBookingRequests = async () => {
  const response = await axios.get(API.BOOKING.OWNER_REQUESTS);
  return response.data as Booking[];
};

export const getBookingsByProperty = async (propertyId: string) => {
  const response = await axios.get(API.BOOKING.BY_PROPERTY(propertyId));
  return response.data as Booking[];
};

export const getBookingById = async (bookingId: string) => {
  const response = await axios.get(API.BOOKING.GET(bookingId));
  return response.data as Booking;
};

export const updateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
  const response = await axios.put(API.BOOKING.UPDATE_STATUS(bookingId), { status });
  return response.data as Booking;
};

export const cancelBooking = async (bookingId: string) => {
  const response = await axios.patch(API.BOOKING.CANCEL(bookingId));
  return response.data as Booking;
};
