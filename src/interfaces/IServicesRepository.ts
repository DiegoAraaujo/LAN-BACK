import type { Service } from "../domain/services/ServiceEntity.js";

export interface IServicesRepository {
  create(service: Service): Promise<Service>;

  update(service: Service): Promise<Service>;
  findById(id: string, userId: string): Promise<Service | null>;
  findByName(name: string, userId: string): Promise<Service | null>;
  findAll(userId: string, search?: string): Promise<Service[]>;
  delete(id: string): Promise<void>;
  findByProfessionalId(
    professionalId: string,
    userId: string,
  ): Promise<Service[]>;
  findManyByIds(ids: string[], userId: string): Promise<Service[]>;
}
