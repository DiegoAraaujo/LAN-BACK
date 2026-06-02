import { Service } from "./ServiceEntity.js";

export class ServiceMappers {
  static toResponse(service: Service) {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
    };
  }
}
