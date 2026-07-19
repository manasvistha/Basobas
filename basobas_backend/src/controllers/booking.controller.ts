import { Request, Response } from "express";
import { BookingService } from "../services/booking.service";
import { CreateBookingDto } from "../dtos/booking.dto";

export class BookingController {
  private bookingService = new BookingService();

  async createBooking(req: Request, res: Response) {
    try {
      const data: CreateBookingDto = req.body;
      const userId = (req as any).user.id;
      const booking = await this.bookingService.createBooking(data, userId);
      res.status(201).json(booking);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBookingsByProperty(req: Request, res: Response) {
    try {
      const { propertyId } = req.params;
      const ownerId = (req as any).user.id;
      const bookings = await this.bookingService.getBookingsByProperty(propertyId, ownerId);
      res.json(bookings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBookingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const requesterId = (req as any).user.id;
      const booking = await this.bookingService.getBookingByIdForParticipant(id, requesterId);
      res.json(booking);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === "Booking not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async getMyBookings(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const bookings = await this.bookingService.getBookingsByUser(userId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOwnerBookingRequests(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user.id;
      const bookings = await this.bookingService.getOwnerBookingRequests(ownerId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateBookingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ownerId = (req as any).user.id;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }
      const booking = await this.bookingService.updateBookingStatus(id, status, ownerId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      res.json(booking);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async cancelMyBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const booking = await this.bookingService.cancelBookingByUser(id, userId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      res.json(booking);
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === "Booking not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }
}
