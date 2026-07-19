import { PropertyRepository } from "../repositories/property.repository";
import { NotificationService } from "./notification.service";
import { CreatePropertyDto, UpdatePropertyDto } from "../dtos/property.dto";

export class PropertyService {
  private propertyRepository = new PropertyRepository();
  private notificationService = new NotificationService();

  async createProperty(data: CreatePropertyDto, ownerId: string) {
    const property = await this.propertyRepository.create({ ...data, owner: ownerId });

    // Notify all users about the new property
    try {
      const { UserModel } = await import("../models/user.model");
      const users = await UserModel.find().select("_id name");
      if (users && users.length) {
        const message = `New property listed: ${property.title}`;
        const relatedId = property._id?.toString();
        // Fire-and-forget notifications; don't let failures block property creation
        await Promise.allSettled(
          users.map((u: any) =>
            this.notificationService.createNotification(u._id.toString(), message, "general", relatedId)
          )
        );
      }
    } catch (err: any) {
      console.error("Failed to create notifications for new property:", err?.message || err);
    }

    return property;
  }

  async getAllProperties() {
    const properties = await this.propertyRepository.findAll();
    const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

    const makeFullUrl = (image: string) => {
      if (!image) return image;
      // If already absolute URL, return as is
      if (/^https?:\/\//i.test(image)) return image;
      // Ensure single slash between base and path
      return `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
    };

    return properties.map((property) => {
      property.images = property.images.map((image) => makeFullUrl(image));
      return property;
    });
  }

  async getPropertyById(id: string) {
    const property = await this.propertyRepository.findById(id);
    if (property) {
      const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
      const makeFullUrl = (image: string) => {
        if (!image) return image;
        if (/^https?:\/\//i.test(image)) return image;
        return `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
      };
      property.images = property.images.map((image) => makeFullUrl(image));
    }
    return property;
  }

  async getPropertiesByOwner(ownerId: string) {
    return await this.propertyRepository.findByOwner(ownerId);
  }

  async searchByQuery(query: string) {
    return await this.propertyRepository.findByQuery(query);
  }

  async filterProperties(filters: any) {
    const properties = await this.propertyRepository.filterProperties(filters);
    const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

    const makeFullUrl = (image: string) => {
      if (!image) return image;
      if (/^https?:\/\//i.test(image)) return image;
      return `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
    };

    return properties.map((property) => {
      property.images = property.images.map((image) => makeFullUrl(image));
      return property;
    });
  }

  async updateProperty(id: string, data: UpdatePropertyDto, ownerId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) throw new Error("Property not found");
    
    // Robust ownership check using MongoDB ObjectId equals method
    const isOwner = (property.owner as any).equals ? 
      (property.owner as any).equals(ownerId) : 
      property.owner.toString() === ownerId.toString();
    
    if (!isOwner) {
      console.error(`Ownership check failed: property.owner=${property.owner}, userId=${ownerId}`);
      throw new Error("Unauthorized");
    }

    return await this.propertyRepository.update(id, data);
  }

  async deleteProperty(id: string, ownerId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) throw new Error("Property not found");
    
    // Robust ownership check using MongoDB ObjectId equals method
    const isOwner = (property.owner as any).equals ? 
      (property.owner as any).equals(ownerId) : 
      property.owner.toString() === ownerId.toString();
    
    if (!isOwner) {
      console.error(`Ownership check failed: property.owner=${property.owner}, userId=${ownerId}`);
      throw new Error("Unauthorized");
    }

    return await this.propertyRepository.delete(id);
  }

  // Allow admins to delete properties without owner checks
  async deletePropertyByAdmin(id: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) throw new Error("Property not found");
    return await this.propertyRepository.delete(id);
  }

  async assignProperty(propertyId: string, userId: string, adminId: string) {
    // Only admin can assign
    const property = await this.propertyRepository.assignToUser(propertyId, userId);
    if (property) {
      await this.notificationService.createNotification(
        property.owner.toString(),
        `Your property "${property.title}" has been assigned to a user.`,
        'assignment',
        propertyId
      );
      await this.notificationService.createNotification(
        userId,
        `You have been assigned the property "${property.title}".`,
        'assignment',
        propertyId
      );
    }
    return property;
  }

  async updatePropertyStatus(propertyId: string, status: 'pending' | 'approved' | 'rejected' | 'available' | 'assigned' | 'booked', adminId: string) {
    const property = await this.propertyRepository.updateStatus(propertyId, status);
    if (property) {
      if (status === 'rejected') {
        await this.notificationService.createNotification(
          property.owner.toString(),
          `Your property "${property.title}" was rejected by the admin. Please review and update your listing.`,
          'status_update',
          propertyId
        );
      } else {
        await this.notificationService.createNotification(
          property.owner.toString(),
          `Status of your property "${property.title}" updated to ${status}.`,
          'status_update',
          propertyId
        );
      }
      if (property.assignedTo) {
        await this.notificationService.createNotification(
          property.assignedTo.toString(),
          `Status of property "${property.title}" updated to ${status}.`,
          'status_update',
          propertyId
        );
      }
    }
    return property;
  }
}