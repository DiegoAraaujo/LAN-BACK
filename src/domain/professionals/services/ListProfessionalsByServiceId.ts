import type { IProfessionalsRepository } from "../../../interfaces/IProfessionalsRepository.js";
import type { Professional } from "../ProfessionalEntity.js";

interface IRequest {
  userId: string;
  serviceId: string;
}

export class ListProfessionalsByServiceId {
  constructor(private professionalsRepository: IProfessionalsRepository) {}

  async execute({ serviceId, userId }: IRequest): Promise<Professional[]> {
    return await this.professionalsRepository.findByServiceId(
      userId,
      serviceId,
    );
  }
}
