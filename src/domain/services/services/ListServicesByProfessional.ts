import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { Service } from "../ServiceEntity.js";

interface IRequest {
  professionalId: string;
  userId: string;
}

export class ListServicesByProfessional {
  constructor(private servicesRepository: IServicesRepository) {}

  async execute({ professionalId, userId }: IRequest): Promise<Service[]> {
    if (!professionalId) {
      throw new AppError(
        "Professional ID is required.",
        400,
        "PROFESSIONAL_ID_REQUIRED",
      );
    }

    return await this.servicesRepository.findByProfessionalId(
      professionalId,
      userId,
    );
  }
}

