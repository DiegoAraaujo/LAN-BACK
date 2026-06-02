import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/database/prisma.js";
import { Service } from "./ServiceEntity.js";
import type { IServicesRepository } from "../../interfaces/IServicesRepository.js";

export class ServicesRepository implements IServicesRepository {
  async create(service: Service): Promise<Service> {
    const created = await prisma.service.create({
      data: {
        userId: service.userId,
        name: service.name,
        price: new Prisma.Decimal(service.price),
        description: service.description,
      },
    });

    return new Service({ ...created, price: created.price.toNumber() });
  }

  async update(service: Service): Promise<Service> {
    const updated = await prisma.service.update({
      where: { id: service.id },
      data: {
        name: service.name,
        price: new Prisma.Decimal(service.price),
        description: service.description,
      },
    });

    return new Service({ ...updated, price: updated.price.toNumber() });
  }

  async findById(id: string, userId: string): Promise<Service | null> {
    const service = await prisma.service.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!service) return null;

    return new Service({ ...service, price: service.price.toNumber() });
  }

  async findManyByIds(ids: string[], userId: string): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: {
        id: { in: ids },
        userId,
        deletedAt: null,
      },
    });

    return services.map(
      (s) => new Service({ ...s, price: s.price.toNumber() }),
    );
  }

  async findByName(name: string, userId: string): Promise<Service | null> {
    const service = await prisma.service.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        userId,
        deletedAt: null,
      },
    });

    if (!service) return null;

    return new Service({ ...service, price: service.price.toNumber() });
  }

  async findAll(userId: string, search?: string): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
      },
      orderBy: { name: "asc" },
    });

    return services.map(
      (s) => new Service({ ...s, price: s.price.toNumber() }),
    );
  }

  async delete(id: string): Promise<void> {
    await prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByProfessionalId(
    professionalId: string,
    userId: string,
  ): Promise<Service[]> {
    const services = await prisma.service.findMany({
      where: {
        userId,
        deletedAt: null,
        professionals: {
          some: {
            professionalId: professionalId,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return services.map(
      (s) => new Service({ ...s, price: s.price.toNumber() }),
    );
  }
}

export default ServicesRepository;
