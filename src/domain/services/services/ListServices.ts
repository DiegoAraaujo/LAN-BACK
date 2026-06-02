import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import type { Service } from "../ServiceEntity.js";

interface IRequest {
  userId: string;
  search?: string | undefined;
}

export class ListServices {
  constructor(private servicesRepository: IServicesRepository) {}

  async execute({ userId, search }: IRequest): Promise<Service[]> {
    return await this.servicesRepository.findAll(userId, search);
  }
}

