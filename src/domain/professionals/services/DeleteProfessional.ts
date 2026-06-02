import type { IProfessionalsRepository } from "../../../interfaces/IProfessionalsRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

interface IRequest {
  id: string;
  userId: string;
}

export class DeleteProfessional {
  constructor(private professionalsRepository: IProfessionalsRepository) {}

  async execute({ id, userId }: IRequest) {
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

    await this.professionalsRepository.delete(id);
  }
}
