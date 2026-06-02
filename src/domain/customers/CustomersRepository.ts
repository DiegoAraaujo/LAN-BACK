import { prisma } from "../../shared/database/prisma.js";
import { Customer } from "./CustomerEntity.js";
import type {
  CustomerWithStats,
  ICustomersRepository,
} from "../../interfaces/ICustomersRepository.js";

class CustomersRepository implements ICustomersRepository {
async create(customer: Customer): Promise<Customer> {
  const created = await prisma.customer.create({
    data: {
      userId: customer.userId,
      name: customer.name,
      address: customer.address ?? null,
      status: customer.status,

      ...(customer.contacts &&
        customer.contacts.length > 0 && {
          contacts: {
            create: customer.contacts.map((c) => ({
              type: c.type,
              value: c.value,
              userId: customer.userId,
            })),
          },
        }),
    },
    include: {
      contacts: true,
    },
  });

  return new Customer({ ...created });
}

  async findContactByTypeAndValue(
    type: "WHATSAPP" | "INSTAGRAM",
    value: string,
    userId: string,
  ): Promise<{ customerId: string } | null> {
    const contact = await prisma.contact.findFirst({
      where: {
        type,
        value,
        customer: {
          userId,
          deletedAt: null,
        },
      },
      select: {
        customerId: true,
      },
    });

    return contact;
  }

  async findById(id: string, userId: string): Promise<Customer | null> {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        contacts: true,
      },
    });

    if (!customer) return null;

    return new Customer({ ...customer });
  }

  async update(customer: Customer): Promise<Customer> {
  if (!customer.id) {
    throw new Error("Cannot update a customer without an ID");
  }

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: {
      name: customer.name,
      address: customer.address ?? null,
      status: customer.status,

      ...(customer.contacts !== undefined && {
        contacts: {
          deleteMany: {},
          create: customer.contacts.map((c) => ({
            type: c.type,
            value: c.value,
            userId: customer.userId,
          })),
        },
      }),
    },
    include: {
      contacts: true,
    },
  });

  return new Customer({ ...updated });
}

  async findAllWithStats(
    userId: string,
    skip: number,
    take: number,
    search?: string,
  ): Promise<{ data: CustomerWithStats[]; total: number }> {
    const searchFilter = search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [total, data] = await prisma.$transaction([
      prisma.customer.count({
        where: {
          userId,
          deletedAt: null,
          ...searchFilter,
        },
      }),

      prisma.customer.findMany({
        where: {
          userId,
          deletedAt: null,
          ...searchFilter,
        },
        include: {
          contacts: true,

          _count: { select: { appointments: true } },
          appointments: {
            where: { deletedAt: null },
            select: { total: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
    ]);

    return { data, total };
  }

  async getDashboard(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, active, inactive, newThisMonth] = await Promise.all([
      prisma.customer.count({
        where: { userId, deletedAt: null },
      }),

      prisma.customer.count({
        where: {
          userId,
          deletedAt: null,
          status: "ACTIVE",
        },
      }),

      prisma.customer.count({
        where: {
          userId,
          deletedAt: null,
          status: "INACTIVE",
        },
      }),

      prisma.customer.count({
        where: {
          userId,
          deletedAt: null,
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      newThisMonth,
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default CustomersRepository;
