import { Prisma } from "@prisma/client";
import { Customer } from "../domain/customers/CustomerEntity.js";

export type CustomerWithStats = Prisma.CustomerGetPayload<{
  include: {
    contacts: true;
    _count: {
      select: { appointments: true };
    };
    appointments: {
      select: { total: true; paidAmount: true };
    };
  };
}>;

export interface CustomerLoyaltyStats {
  customerId: string;
  visits: number;
  totalSpent: number;
  lastVisit: Date;
  customer: Customer;
}

export interface ICustomersRepository {
  create(customer: Customer): Promise<Customer>;
  findContactByTypeAndValue(
    type: "WHATSAPP" | "INSTAGRAM",
    value: string,
    userId: string,
  ): Promise<{ customerId: string } | null>;
  findById(id: string, userId: string): Promise<Customer | null>;
  delete(id: string): Promise<void>;
  getDashboard(userId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    occasional: number;
    newThisMonth: number;
  }>;
  getLoyaltyRanking(userId: string, limit: number): Promise<CustomerLoyaltyStats[]>;
  findAllWithStats(
    userId: string,
    skip: number,
    take: number,
    search?: string,
    status?: "ACTIVE" | "INACTIVE" | "OCCASIONAL",
  ): Promise<{ data: CustomerWithStats[]; total: number }>;
  update(customer: Customer): Promise<Customer>;
}
