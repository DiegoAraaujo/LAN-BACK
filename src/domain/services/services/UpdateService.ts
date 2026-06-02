import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { Service } from "../ServiceEntity.js";

interface IRequest {
  id: string;
  userId: string;
  name?: string | undefined;
  price?: number | undefined;
  description?: string | undefined | null;
}

export class UpdateService {
  constructor(private servicesRepository: IServicesRepository) {}

  async execute({
    id,
    userId,
    name,
    price,
    description,
  }: IRequest): Promise<Service> {
    const service = await this.servicesRepository.findById(id, userId);

    if (!service) {
      throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
    }

    if (name) {
      const serviceWithSameName = await this.servicesRepository.findByName(
        name,
        userId,
      );

      if (serviceWithSameName && serviceWithSameName.id !== id) {
        throw new AppError(
          "A service with this name already exists.",
          400,
          "SERVICE_ALREADY_EXISTS",
        );
      }
      service.name = name;
    }

    if (price !== undefined) service.price = price;
    if (description !== undefined) service.description = description;

    return await this.servicesRepository.update(service);
  }
}

