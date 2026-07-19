import { BookingRepository } from "../repositories/booking.repository";
import { PropertyService } from "./property.service";
import { NotificationService } from "./notification.service";
import { CreateBookingDto } from "../dtos/booking.dto";
import Property from "../models/property.model";

type OwnerBookingDecisionStatus = 'approved' | 'rejected';

export class BookingService {
  private bookingRepository = new BookingRepository();
  private propertyService = new PropertyService();
  private notificationService = new NotificationService();

  private toId(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value._id) return value._id.toString();
    return value.toString();
  }

  async createBooking(data: CreateBookingDto, userId: string) {
    const property = await Property.findById(data.propertyId);
    if (!property) throw new Error("Property not found");

    if (property.owner.toString() === userId) {
      throw new Error("You cannot book your own property");
    }

    if (property.status !== 'available' && property.status !== 'approved') {
      throw new Error("Property is not available for booking requests");
    }

    const alreadyApproved = await this.bookingRepository.findApprovedByProperty(data.propertyId);
    if (alreadyApproved) {
      throw new Error("Property is already rented");
    }

    const existing = await this.bookingRepository.findExistingByPropertyAndUser(data.propertyId, userId);
    if (existing) {
      throw new Error("You have already booked this property");
    }

    const booking = await this.bookingRepository.create({
      ...data,
      user: userId,
      owner: property.owner.toString(),
    });

    const propertyOwnerId = property.owner.toString();
    if (propertyOwnerId) {
      await this.notificationService.createNotification(
        propertyOwnerId,
        `New booking request received for "${property.title}".`,
        'general',
        data.propertyId
      );
    }

    await this.notificationService.createNotification(
      userId,
      `Booking request sent for "${property.title}".`,
      'general',
      data.propertyId
    );

    return await this.bookingRepository.findById(booking._id.toString());
  }

  async getBookingsByProperty(propertyId: string, ownerId: string) {
    const property = await this.propertyService.getPropertyById(propertyId);
    const propertyOwnerId = property ? this.toId((property as any).owner) : "";
    if (!property || propertyOwnerId !== ownerId) throw new Error("Unauthorized");

    return await this.bookingRepository.findByProperty(propertyId);
  }

  async getBookingsByUser(userId: string) {
    return await this.bookingRepository.findByUser(userId);
  }

  async getOwnerBookingRequests(ownerId: string) {
    return await this.bookingRepository.findByOwner(ownerId);
  }

  async getBookingByIdForParticipant(bookingId: string, requesterId: string) {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const bookingUserId = this.toId(booking.user);
    const bookingOwnerId = this.toId((booking as any).owner);

    if (bookingUserId !== requesterId && bookingOwnerId !== requesterId) {
      throw new Error("Unauthorized");
    }

    return booking;
  }

  async getAllBookingsForAdmin() {
    return await this.bookingRepository.findAll();
  }

  async updateBookingStatus(bookingId: string, status: OwnerBookingDecisionStatus, ownerId: string) {
    const currentBooking = await this.bookingRepository.findById(bookingId);
    if (!currentBooking) throw new Error("Booking not found");

    const bookingPropertyId = this.toId(currentBooking.property);
    const bookingUserId = this.toId(currentBooking.user);
    const bookingOwnerId = this.toId((currentBooking as any).owner);

    if (bookingOwnerId !== ownerId) {
      throw new Error("Unauthorized");
    }

    if (currentBooking.status !== 'pending') {
      throw new Error("Only pending requests can be updated");
    }

    if (status === 'approved') {
      const approved = await this.bookingRepository.findApprovedByProperty(bookingPropertyId);
      if (approved && approved._id.toString() !== bookingId) {
        throw new Error("This property already has an approved booking");
      }
    }

    const booking = await this.bookingRepository.updateStatus(bookingId, status);
    if (booking) {
      await this.notificationService.createNotification(
        booking.user.toString(),
        `Your booking request has been ${status}.`,
        'status_update',
        booking.property.toString()
      );

      if (status === 'approved') {
        await Property.findByIdAndUpdate(
          bookingPropertyId,
          {
            $set: {
              assignedTo: bookingUserId,
              status: 'booked'
            }
          },
          { new: true }
        );

        await this.bookingRepository.rejectAllOthersForProperty(bookingPropertyId, bookingUserId);

        await this.notificationService.createNotification(
          ownerId,
          `You approved a booking request for one of your properties.`,
          'status_update',
          bookingPropertyId
        );
      }
    }
    return booking;
  }

  async cancelBookingByUser(bookingId: string, userId: string) {
    const currentBooking = await this.bookingRepository.findById(bookingId);
    if (!currentBooking) {
      throw new Error("Booking not found");
    }

    const bookingUserId = this.toId(currentBooking.user);
    const bookingOwnerId = this.toId((currentBooking as any).owner);
    const bookingPropertyId = this.toId(currentBooking.property);

    if (bookingUserId !== userId) {
      throw new Error("Unauthorized");
    }

    if (currentBooking.status !== 'pending') {
      throw new Error("Only pending bookings can be cancelled");
    }

    const booking = await this.bookingRepository.updateStatus(bookingId, 'cancelled');

    if (booking) {
      const propertyTitle = typeof currentBooking.property === "object" && (currentBooking.property as any)?.title
        ? (currentBooking.property as any).title
        : "the property";

      await this.notificationService.createNotification(
        bookingOwnerId,
        `A booking request for "${propertyTitle}" was cancelled by the user.`,
        'status_update',
        bookingPropertyId
      );

      await this.notificationService.createNotification(
        userId,
        `You cancelled your booking request for "${propertyTitle}".`,
        'status_update',
        bookingPropertyId
      );
    }

    return booking;
  }
}
