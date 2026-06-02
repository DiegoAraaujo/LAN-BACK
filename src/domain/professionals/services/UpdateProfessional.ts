import type { IProfessionalsRepository } from "../../../interfaces/IProfessionalsRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { Professional } from "../ProfessionalEntity.js";

interface IRequest {
  id: string;
  userId: string;
  name?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  servicesIds?: string[] | undefined;
}

export class UpdateProfessional {
  constructor(private professionalsRepository: IProfessionalsRepository) {}

  async execute({
    id,
    userId,
    name,
    address,
    phone,
    servicesIds,
  }: IRequest): Promise<Professional> {
    const professional = await this.professionalsRepository.findById(
      id,
      userId,
    );

    if (!professional) {
      throw new AppError(
        "Professional not found.",
        404,
        "PROFESSIONAL_NOT_FOUND",
      );
    }

    if (phone && phone !== professional.phone) {
      const phoneExists = await this.professionalsRepository.findByPhone(phone);

      if (phoneExists) {
        throw new AppError(
          "A professional with this phone number already exists.",
          409,
          "PROFESSIONAL_ALREADY_EXISTS",
        );
      }
      professional.phone = phone;
    }

    if (name) professional.name = name;
    if (address) professional.address = address;
    if (servicesIds) professional.servicesIds = servicesIds;

    return await this.professionalsRepository.update(professional);
  }
}
