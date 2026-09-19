import type { IProfessionalsRepository } from "../../../interfaces/IProfessionalsRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { Professional } from "../ProfessionalEntity.js";
import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import { validateServices } from "./validateServices.js";

interface IRequest {
  userId: string;
  name: string;
  address: string;
  phone: string;
  profileImage?: string | null | undefined;
  servicesIds?: string[];
}

export class CreateProfessional {
  constructor(
    private professionalsRepository: IProfessionalsRepository,
    private servicesRepository: IServicesRepository,
  ) {}

  async execute({
    userId,
    name,
    address,
    phone,
    profileImage,
    servicesIds,
  }: IRequest): Promise<Professional> {
    const validatedIds = await validateServices(this.servicesRepository, userId, servicesIds ?? []);
    const professionalExists =
      await this.professionalsRepository.findByPhone(phone);

    if (professionalExists) {
      throw new AppError(
        "A professional with this phone number already exists.",
        409,
        "PROFESSIONAL_ALREADY_EXISTS",
      );
    }
    
    const professional = new Professional({
      userId: userId,
      name: name,
      address: address,
      phone: phone,
      ...(profileImage !== undefined && { profileImage }),
      servicesIds: validatedIds,
    });

    return await this.professionalsRepository.create(professional);
  }
}
