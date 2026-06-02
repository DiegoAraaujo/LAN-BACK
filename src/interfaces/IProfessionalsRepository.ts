import type { Prisma } from "@prisma/client";
import type { Professional } from "../domain/professionals/ProfessionalEntity.js";

export interface ProfessionalWithServices {
  professional: Professional;
  services: Array<{
    id: string;
    name: string;
  }>;
}

export interface IProfessionalsRepository {
  create(professional: Professional): Promise<Professional>;
  update(professional: Professional): Promise<Professional>;
  findById(id: string, userId: string): Promise<Professional | null>;
  findByServiceId(userId: string, serviceId: string): Promise<Professional[]>;
  findByPhone(phone: string): Promise<Professional | null>;
  findAll(userId: string, search?: string): Promise<ProfessionalWithServices[]>;
  hasService(professionalId: string, serviceId: string): Promise<boolean>;
  delete(id: string): Promise<void>;
  findManyByIds(ids: string[], userId: string): Promise<Professional[]>;
}
