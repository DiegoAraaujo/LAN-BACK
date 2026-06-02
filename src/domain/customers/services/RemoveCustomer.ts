import { AppError } from "../../../shared/errors/AppError.js";
import type { ICustomersRepository } from "../../../interfaces/ICustomersRepository.js";

interface IRequest {
  id: string;
  userId: string;
}

export class RemoveCustomer {
  constructor(private customerRepository: ICustomersRepository) {}

  async execute({ id, userId }: IRequest): Promise<void> {
    const customer = await this.customerRepository.findById(id, userId);

    if (!customer) {
      throw new AppError(
        "Customer not found or access denied.",
        404,
        "CUSTOMER_NOT_FOUND",
      );
    }

    await this.customerRepository.delete(id);
  }
}

