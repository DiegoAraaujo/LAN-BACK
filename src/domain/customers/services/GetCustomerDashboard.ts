import type { ICustomersRepository } from "../../../interfaces/ICustomersRepository.js";

interface IRequest {
  userId: string;
}

interface IResponse {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

export class GetCustomerDashboard {
  constructor(private customerRepository: ICustomersRepository) {}

  async execute({ userId }: IRequest): Promise<IResponse> {
    return await this.customerRepository.getDashboard(userId);
  }
}
