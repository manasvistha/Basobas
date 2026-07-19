import { PropertyService } from '../../src/services/property.service';
import { PropertyRepository } from '../../src/repositories/property.repository';
import { NotificationService } from '../../src/services/notification.service';

const propertyService = new PropertyService();

describe('PropertyService unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASE_URL = 'http://api.test';
  });

  test('getAllProperties normalizes relative image URLs', async () => {
    jest.spyOn(PropertyRepository.prototype, 'findAll').mockResolvedValue([
      { _id: 'p1', title: 'Room', images: ['/img1.png', 'http://cdn/img2.png'] },
    ] as any);

    const properties = await propertyService.getAllProperties();

    expect(properties[0].images[0]).toBe('http://api.test/img1.png');
    expect(properties[0].images[1]).toBe('http://cdn/img2.png');
  });

  test('updateProperty throws when property missing', async () => {
    jest.spyOn(PropertyRepository.prototype, 'findById').mockResolvedValue(null as any);
    await expect(propertyService.updateProperty('p1', { title: 'x' } as any, 'owner1')).rejects.toThrow('Property not found');
  });

  test('updateProperty throws when user is not owner', async () => {
    jest.spyOn(PropertyRepository.prototype, 'findById').mockResolvedValue({ _id: 'p1', owner: 'owner-real', images: [] } as any);
    await expect(propertyService.updateProperty('p1', { title: 'x' } as any, 'different-user')).rejects.toThrow('Unauthorized');
  });

  test('deleteProperty throws when user is not owner', async () => {
    jest.spyOn(PropertyRepository.prototype, 'findById').mockResolvedValue({ _id: 'p1', owner: 'owner-real', images: [] } as any);
    await expect(propertyService.deleteProperty('p1', 'other')).rejects.toThrow('Unauthorized');
  });

  test('updatePropertyStatus notifies owner and assignee', async () => {
    const notifySpy = jest.spyOn(NotificationService.prototype, 'createNotification').mockResolvedValue({} as any);
    jest.spyOn(PropertyRepository.prototype, 'updateStatus').mockResolvedValue({
      _id: 'p1',
      owner: { toString: () => 'owner1' },
      assignedTo: { toString: () => 'assignee1' },
      title: 'Great spot',
    } as any);

    const property = await propertyService.updatePropertyStatus('p1', 'approved', 'admin1');

    expect(property?._id).toBe('p1');
    expect(notifySpy).toHaveBeenCalledTimes(2);
  });
});
