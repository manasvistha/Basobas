import { BookingService } from '../../src/services/booking.service';
import { BookingRepository } from '../../src/repositories/booking.repository';
import { NotificationService } from '../../src/services/notification.service';

jest.mock('../../src/models/property.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

const Property = require('../../src/models/property.model').default as any;
const bookingService = new BookingService();

const mockBookingRepoFindById = () => jest.spyOn(BookingRepository.prototype, 'findById');

describe('BookingService unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createBooking throws when property not found', async () => {
    (Property.findById as jest.Mock).mockResolvedValue(null);
    await expect(bookingService.createBooking({ propertyId: 'p1' } as any, 'u1')).rejects.toThrow('Property not found');
  });

  test('createBooking rejects when user owns property', async () => {
    (Property.findById as jest.Mock).mockResolvedValue({ _id: 'p1', owner: 'u1', status: 'available' });
    await expect(bookingService.createBooking({ propertyId: 'p1' } as any, 'u1')).rejects.toThrow('You cannot book your own property');
  });

  test('createBooking rejects when property unavailable', async () => {
    (Property.findById as jest.Mock).mockResolvedValue({ _id: 'p1', owner: 'u2', status: 'pending' });
    await expect(bookingService.createBooking({ propertyId: 'p1' } as any, 'u3')).rejects.toThrow('Property is not available for booking requests');
  });

  test('createBooking rejects when approved booking exists', async () => {
    (Property.findById as jest.Mock).mockResolvedValue({ _id: 'p1', owner: 'u2', status: 'available' });
    jest.spyOn(BookingRepository.prototype, 'findApprovedByProperty').mockResolvedValue({ _id: 'b-approved' } as any);
    await expect(bookingService.createBooking({ propertyId: 'p1' } as any, 'u3')).rejects.toThrow('Property is already rented');
  });

  test('createBooking rejects when user already booked', async () => {
    (Property.findById as jest.Mock).mockResolvedValue({ _id: 'p1', owner: 'u2', status: 'available' });
    jest.spyOn(BookingRepository.prototype, 'findApprovedByProperty').mockResolvedValue(null as any);
    jest.spyOn(BookingRepository.prototype, 'findExistingByPropertyAndUser').mockResolvedValue({ _id: 'b-existing' } as any);
    await expect(bookingService.createBooking({ propertyId: 'p1' } as any, 'u3')).rejects.toThrow('You have already booked this property');
  });

  test('createBooking creates booking and sends notifications', async () => {
    const bookingRepoCreate = jest.spyOn(BookingRepository.prototype, 'create').mockResolvedValue({ _id: 'b1', property: 'p1', user: 'u3', owner: 'u2', status: 'pending' } as any);
    jest.spyOn(BookingRepository.prototype, 'findApprovedByProperty').mockResolvedValue(null as any);
    jest.spyOn(BookingRepository.prototype, 'findExistingByPropertyAndUser').mockResolvedValue(null as any);
    jest.spyOn(BookingRepository.prototype, 'findById').mockResolvedValue({ _id: 'b1', property: 'p1', user: 'u3', owner: 'u2', status: 'pending' } as any);
    (Property.findById as jest.Mock).mockResolvedValue({ _id: 'p1', title: 'Nice room', owner: { toString: () => 'u2' }, status: 'available' });
    const notifySpy = jest.spyOn(NotificationService.prototype, 'createNotification').mockResolvedValue({} as any);

    const booking = await bookingService.createBooking({ propertyId: 'p1', message: 'hello' } as any, 'u3');

    expect(booking?._id).toBe('b1');
    expect(bookingRepoCreate).toHaveBeenCalled();
    expect(notifySpy).toHaveBeenCalledTimes(2);
  });

  test('updateBookingStatus rejects when booking not found', async () => {
    mockBookingRepoFindById().mockResolvedValue(null as any);
    await expect(bookingService.updateBookingStatus('b1', 'approved', 'owner1')).rejects.toThrow('Booking not found');
  });

  test('updateBookingStatus rejects when owner mismatch', async () => {
    mockBookingRepoFindById().mockResolvedValue({ _id: 'b1', status: 'pending', property: 'p1', user: 'u2', owner: 'owner-real' } as any);
    await expect(bookingService.updateBookingStatus('b1', 'approved', 'owner-other')).rejects.toThrow('Unauthorized');
  });

  test('updateBookingStatus rejects when booking not pending', async () => {
    mockBookingRepoFindById().mockResolvedValue({ _id: 'b1', status: 'approved', property: 'p1', user: 'u2', owner: 'owner-real' } as any);
    await expect(bookingService.updateBookingStatus('b1', 'rejected', 'owner-real')).rejects.toThrow('Only pending requests can be updated');
  });

  test('updateBookingStatus rejects if another approved exists', async () => {
    mockBookingRepoFindById().mockResolvedValue({ _id: 'b1', status: 'pending', property: 'p1', user: 'u2', owner: 'owner-real' } as any);
    jest.spyOn(BookingRepository.prototype, 'findApprovedByProperty').mockResolvedValue({ _id: 'other' } as any);
    await expect(bookingService.updateBookingStatus('b1', 'approved', 'owner-real')).rejects.toThrow('This property already has an approved booking');
  });

  test('updateBookingStatus approves booking and updates property', async () => {
    mockBookingRepoFindById().mockResolvedValue({ _id: 'b1', status: 'pending', property: 'p1', user: 'u2', owner: 'owner-real' } as any);
    jest.spyOn(BookingRepository.prototype, 'findApprovedByProperty').mockResolvedValue(null as any);
    jest.spyOn(BookingRepository.prototype, 'updateStatus').mockResolvedValue({ _id: 'b1', status: 'approved', property: 'p1', user: 'u2', owner: 'owner-real' } as any);
    jest.spyOn(BookingRepository.prototype, 'rejectAllOthersForProperty').mockResolvedValue();
    const notifySpy = jest.spyOn(NotificationService.prototype, 'createNotification').mockResolvedValue({} as any);
    (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const booking = await bookingService.updateBookingStatus('b1', 'approved', 'owner-real');

    expect(booking?.status).toBe('approved');
    expect(notifySpy).toHaveBeenCalled();
    expect(BookingRepository.prototype.rejectAllOthersForProperty).toHaveBeenCalled();
    expect(Property.findByIdAndUpdate).toHaveBeenCalled();
  });

  test('cancelBookingByUser rejects when booking not found', async () => {
    mockBookingRepoFindById().mockResolvedValue(null as any);
    await expect(bookingService.cancelBookingByUser('b1', 'u1')).rejects.toThrow('Booking not found');
  });

  test('cancelBookingByUser rejects unauthorized user', async () => {
    mockBookingRepoFindById().mockResolvedValue({ _id: 'b1', user: 'u-correct', owner: 'owner-real', property: 'p1', status: 'pending' } as any);
    await expect(bookingService.cancelBookingByUser('b1', 'other-user')).rejects.toThrow('Unauthorized');
  });

  test('cancelBookingByUser rejects when status is not pending', async () => {
    mockBookingRepoFindById().mockResolvedValue({ _id: 'b1', user: 'u1', owner: 'owner-real', property: 'p1', status: 'approved' } as any);
    await expect(bookingService.cancelBookingByUser('b1', 'u1')).rejects.toThrow('Only pending bookings can be cancelled');
  });

  test('cancelBookingByUser cancels and notifies', async () => {
    mockBookingRepoFindById().mockResolvedValue({ _id: 'b1', user: 'u1', owner: 'owner-real', property: { _id: 'p1', title: 'Cozy' }, status: 'pending' } as any);
    jest.spyOn(BookingRepository.prototype, 'updateStatus').mockResolvedValue({ _id: 'b1', status: 'cancelled', property: 'p1', user: 'u1', owner: 'owner-real' } as any);
    const notifySpy = jest.spyOn(NotificationService.prototype, 'createNotification').mockResolvedValue({} as any);

    const booking = await bookingService.cancelBookingByUser('b1', 'u1');

    expect(booking?.status).toBe('cancelled');
    expect(notifySpy).toHaveBeenCalledTimes(2);
  });
});
