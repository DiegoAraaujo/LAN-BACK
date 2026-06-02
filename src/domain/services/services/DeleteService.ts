import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

interface IRequest {
  id: string;
  userId: string;
}
export class DeleteService {
  constructor(private servicesRepository: IServicesRepository) {}

  async execute({ id, userId }: IRequest): Promise<void> {
    const service = await this.servicesRepository.findById(id, userId);

    if (!service) {
      throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
    }

    await this.servicesRepository.delete(id);
  }
}