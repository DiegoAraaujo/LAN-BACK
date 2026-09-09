import type { ICustomersRepository } from "../../../interfaces/ICustomersRepository.js";
import { CustomerMapper } from "../CustomersMappers.js";

type LoyaltyTier = "VIP_GOLD" | "FREQUENT" | "ACTIVE";

function tierFor(totalSpent: number, visits: number): LoyaltyTier {
  if (totalSpent >= 500 || visits >= 20) return "VIP_GOLD";
  if (totalSpent >= 200 || visits >= 8) return "FREQUENT";
  return "ACTIVE";
}

export class GetCustomerLoyaltyReport {
  constructor(private customerRepository: ICustomersRepository) {}

  async execute({ userId }: { userId: string }) {
    const ranking = await this.customerRepository.getLoyaltyRanking(userId, 10);
    return ranking.map(item => ({
      ...CustomerMapper.toResponse(item.customer, {
        totalAppointments: item.visits,
        totalSpent: item.totalSpent,
      }),
      lastVisit: item.lastVisit,
      tier: tierFor(item.totalSpent, item.visits),
    }));
  }
}
