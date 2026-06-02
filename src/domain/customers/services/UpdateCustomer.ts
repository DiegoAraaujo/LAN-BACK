import { AppError } from "../../../shared/errors/AppError.js";
import { Customer } from "../CustomerEntity.js";
import type { ICustomersRepository } from "../../../interfaces/ICustomersRepository.js";
import { normalizeContact } from "../../../shared/utils/normalizeContact.js";

interface IRequest {
  id: string;
  userId: string;
  name?: string | undefined;
  address?: string | undefined;
  status?: "ACTIVE" | "INACTIVE" | undefined;
  contacts?:
    | {
        type: "WHATSAPP" | "INSTAGRAM";
        value: string;
      }[]
    | undefined;
}

export class UpdateCustomer {
  constructor(private customerRepository: ICustomersRepository) {}

  async execute({
    id,
    userId,
    contacts,
    ...data
  }: IRequest): Promise<Customer> {
    const customer = await this.customerRepository.findById(id, userId);

    if (!customer) {
      throw new AppError(
        "Customer not found or access denied.",
        404,
        "CUSTOMER_NOT_FOUND",
      );
    }

    const normalizedContacts = contacts?.map((c) => ({
      type: c.type,
      value: normalizeContact(c.type, c.value),
    }));

    if (normalizedContacts) {
      for (const contact of normalizedContacts) {
        const exists = await this.customerRepository.findContactByTypeAndValue(
          contact.type,
          contact.value,
          userId,
        );

        if (exists && exists.customerId !== customer.id) {
          throw new AppError(
            `${contact.type} already in use.`,
            400,
            "CONTACT_ALREADY_EXISTS",
          );
        }
      }

      customer.contacts = normalizedContacts;
    }

    if (data.name !== undefined) {
      customer.name = data.name;
    }

    if (data.address !== undefined) {
      customer.address = data.address;
    }

    if (data.status !== undefined) {
      customer.status = data.status;
    }

    return await this.customerRepository.update(customer);
  }
}
