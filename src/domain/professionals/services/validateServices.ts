import type { IServicesRepository } from "../../../interfaces/IServicesRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export async function validateServices(
  repository: IServicesRepository,
  userId: string,
  servicesIds: string[],
): Promise<string[]> {
  const ids = [...new Set(servicesIds)];
  if (ids.length > 0) {
    const services = await repository.findManyByIds(ids, userId);
    if (services.length !== ids.length) {
      throw new AppError("One or more services are unavailable.", 404, "SERVICE_NOT_FOUND");
    }
  }
  return ids;
}
