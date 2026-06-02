import type {
  IProfessionalsRepository,
  ProfessionalWithServices,
} from "../../interfaces/IProfessionalsRepository.js";
import { prisma } from "../../shared/database/prisma.js";
import { Professional } from "./ProfessionalEntity.js";

export class ProfessionalsRepository implements IProfessionalsRepository {
  async create(professional: Professional): Promise<Professional> {
    const created = await prisma.professional.create({
      data: {
        user: { connect: { id: professional.userId } },
        name: professional.name,
        address: professional.address,
        phone: professional.phone,

        ...(professional.servicesIds &&
          professional.servicesIds.length > 0 && {
            authorizedServices: {
              createMany: {
                data: professional.servicesIds.map((serviceId) => ({
                  serviceId,
                })),
              },
            },
          }),
      },
      include: {
        authorizedServices: true,
      },
    });

    return new Professional({
      id: created.id,
      userId: created.userId,
      name: created.name,
      address: created.address,
      phone: created.phone,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      deletedAt: created.deletedAt,
      servicesIds: created.authorizedServices.map((as) => as.serviceId),
    });
  }

  async update(professional: Professional): Promise<Professional> {
    const updated = await prisma.professional.update({
      where: { id: professional.id },
      data: {
        name: professional.name,
        address: professional.address,
        phone: professional.phone,
        ...(professional.servicesIds && {
          authorizedServices: {
            deleteMany: {},
            createMany: {
              data: professional.servicesIds.map((serviceId) => ({
                serviceId,
              })),
            },
          },
        }),
      },
      include: {
        authorizedServices: true,
      },
    });

    return new Professional({
      ...updated,
      servicesIds: updated.authorizedServices.map((as) => as.serviceId),
    });
  }

  async findById(id: string, userId: string): Promise<Professional | null> {
    const professional = await prisma.professional.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        authorizedServices: true,
      },
    });

    if (!professional) return null;

    return new Professional({
      ...professional,
      servicesIds: professional.authorizedServices.map((as) => as.serviceId),
    });
  }

  async findManyByIds(ids: string[], userId: string): Promise<Professional[]> {
    const professionals = await prisma.professional.findMany({
      where: {
        id: { in: ids },
        userId,
        deletedAt: null,
      },
      include: {
        authorizedServices: true,
      },
    });

    return professionals.map(
      (p) =>
        new Professional({
          ...p,
          servicesIds: p.authorizedServices.map((as) => as.serviceId),
        }),
    );
  }
  
  async findByPhone(phone: string): Promise<Professional | null> {
    const professional = await prisma.professional.findFirst({
      where: {
        phone,
        deletedAt: null,
      },
      include: {
        authorizedServices: true,
      },
    });

    if (!professional) return null;

    return new Professional({
      ...professional,
      servicesIds: professional.authorizedServices.map(
        ({ serviceId }) => serviceId,
      ),
    });
  }

  async findAll(
    userId: string,
    search?: string,
  ): Promise<ProfessionalWithServices[]> {
    const professionals = await prisma.professional.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: "insensitive" as const },
        }),
      },
      include: {
        authorizedServices: {
          include: {
            service: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return professionals.map((s) => {
      const { authorizedServices, ...rawData } = s;

      return {
        professional: new Professional(rawData),
        services: authorizedServices.map((as) => {
          return { id: as.service.id, name: as.service.name };
        }),
      };
    });
  }

  async findByServiceId(
    userId: string,
    serviceId: string,
  ): Promise<Professional[]> {
    const professionals = await prisma.professional.findMany({
      where: {
        userId,
        deletedAt: null,
        authorizedServices: {
          some: {
            serviceId,
          },
        },
      },
      include: {
        authorizedServices: true,
      },
      orderBy: { name: "asc" },
    });

    return professionals.map(
      (p) =>
        new Professional({
          ...p,
          servicesIds: (p.authorizedServices ?? []).map((as) => as.serviceId),
        }),
    );
  }

  async hasService(
    professionalId: string,
    serviceId: string,
  ): Promise<boolean> {
    const professionalService = await prisma.professionalService.findUnique({
      where: {
        professionalId_serviceId: {
          professionalId,
          serviceId,
        },
      },
    });

    return !!professionalService;
  }

  async delete(id: string): Promise<void> {
    await prisma.professional.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
