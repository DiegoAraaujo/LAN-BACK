import { Service } from "../ServiceEntity.js";
import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

interface IRequest {
  userId: string;
  name: string;
  price: number;
  description?: string | undefined;
}

export class CreateService {
  constructor(private servicesRepository: IServicesRepository) {}

  async execute({
    userId,
    name,
    price,
    description,
  }: IRequest): Promise<Service> {
    const serviceAlreadyExists = await this.servicesRepository.findByName(
      name,
      userId,
    );

    if (serviceAlreadyExists) {
      throw new AppError(
        "A service with this name already exists.",
        400,
        "SERVICE_ALREADY_EXISTS",
      );
    }

    const service = new Service({
      userId,
      name,
      price,
      description,
    });

    return await this.servicesRepository.create(service);
  }
}

