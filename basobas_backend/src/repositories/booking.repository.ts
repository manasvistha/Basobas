import Booking, { IBooking } from "../models/booking.model";
import { CreateBookingDto } from "../dtos/booking.dto";

export class BookingRepository {
  async create(data: CreateBookingDto & { user: string; owner: string }): Promise<IBooking> {
    const booking = new Booking({
      property: data.propertyId,
      user: data.user,
      owner: data.owner,
      message: data.message,
      tenantInfo: data.tenantInfo || undefined,
      payment: data.payment || undefined
    });
    return await booking.save();
  }

  async findByProperty(propertyId: string): Promise<IBooking[]> {
    return await Booking.find({ property: propertyId })
      .populate('user', 'name email')
      .populate('owner', 'name email')
      .populate('property', 'title location price status images image imageUrl')
      .sort({ createdAt: -1 });
  }

  async findByUser(userId: string): Promise<IBooking[]> {
    return await Booking.find({ user: userId })
      .populate('property', 'title location price status images image imageUrl')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
  }

  async findByOwner(ownerId: string): Promise<IBooking[]> {
    return await Booking.find({ owner: ownerId })
      .populate('user', 'name email')
      .populate('property', 'title location price status images image imageUrl')
      .sort({ createdAt: -1 });
  }

  async findAll(): Promise<IBooking[]> {
    return await Booking.find({})
      .populate('user', 'name email')
      .populate('owner', 'name email')
      .populate('property', 'title location price status images image imageUrl')
      .sort({ createdAt: -1 });
  }

  async updateStatus(bookingId: string, status: 'pending' | 'approved' | 'rejected' | 'cancelled'): Promise<IBooking | null> {
    return await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
  }

  async updateOwner(bookingId: string, ownerId: string): Promise<IBooking | null> {
    return await Booking.findByIdAndUpdate(bookingId, { owner: ownerId }, { new: true });
  }

  async findById(id: string): Promise<IBooking | null> {
    return await Booking.findById(id)
      .populate('user', 'name email')
      .populate('owner', 'name email')
      .populate('property', 'title location price status images image imageUrl owner');
  }

  async findExistingByPropertyAndUser(propertyId: string, userId: string): Promise<IBooking | null> {
    return await Booking.findOne({ property: propertyId, user: userId });
  }

  async findApprovedByProperty(propertyId: string): Promise<IBooking | null> {
    return await Booking.findOne({ property: propertyId, status: 'approved' });
  }

  async rejectAllOthersForProperty(propertyId: string, approvedUserId: string): Promise<void> {
    await Booking.updateMany(
      {
        property: propertyId,
        user: { $ne: approvedUserId },
        status: { $in: ['pending', 'approved'] }
      },
      { $set: { status: 'rejected' } }
    );
  }
}
