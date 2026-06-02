import type { Customer } from "./CustomerEntity.js";

export class CustomerMapper {
  static toResponse(
    customer: Customer,
    stats?: { totalAppointments: number; totalSpent: number },
  ) {
    const contacts = customer.contacts ?? [];

    const whatsapp = contacts.find((c) => c.type === "WHATSAPP")?.value;
    const instagram = contacts.find((c) => c.type === "INSTAGRAM")?.value;

    return {
      id: customer.id,
      name: customer.name,
      address: customer.address ?? null,
      status: customer.status,
      createdAt: customer.createdAt,
      whatsapp: whatsapp ?? null,
      instagram: instagram ?? null,
      totalAppointments: stats?.totalAppointments ?? 0,
      totalSpent: stats?.totalSpent ?? 0,
    };
  }
}
