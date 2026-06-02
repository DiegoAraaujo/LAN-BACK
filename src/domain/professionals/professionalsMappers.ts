import type { Professional } from "./ProfessionalEntity.js";

export class ProfessionalMappers {
  static toResponse(
    professional: Professional,
    services?: { id: string; name: String }[],
  ) {
    return {
      id: professional.id,
      name: professional.name,
      phone: professional.phone,
      address: professional.address,
      createdAt: professional.createdAt,
      ...(services && services.length > 0 && { services }),
    };
  }
}
