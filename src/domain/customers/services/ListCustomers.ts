import { Customer } from "../CustomerEntity.js";
import type { ICustomersRepository } from "../../../interfaces/ICustomersRepository.js";

interface IRequest {
  userId: string;
  page: number;
  limit: number;
  search?: string | undefined;
  status?: "ACTIVE" | "INACTIVE" | "OCCASIONAL" | undefined;
}

interface IResponse {
  customers: {
    customer: Customer;
    totalAppointments: number;
    totalSpent: number;
  }[];
  total: number;
}
export class ListCustomers {
  constructor(private customerRepository: ICustomersRepository) {}

  async execute({
    userId,
    page = 1,
    limit = 10,
    search,
    status,
  }: IRequest): Promise<IResponse> {
    const skip = (page - 1) * limit;

    const { data, total } = await this.customerRepository.findAllWithStats(
      userId,
      skip,
      limit,
      search,
      status,
    );

    const mapped = data.map((raw) => {
      const totalSpent = raw.appointments.reduce((acc, app) => {
        return acc + Number(app.paidAmount);
      }, 0);

      const customerEntity = new Customer({
        userId: raw.userId,
        id: raw.id,
        name: raw.name,
        address: raw.address,
        status: raw.status,
        createdAt: raw.createdAt,
        contacts: raw.contacts ?? [],
      });

      return {
        customer: customerEntity,
        totalAppointments: raw._count.appointments,
        totalSpent: totalSpent,
      };
    });

    return {
      customers: mapped,
      total,
    };
  }
}
