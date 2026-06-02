import { AppError } from "../../../shared/errors/AppError.js";
import { Customer } from "../CustomerEntity.js";
import type { ICustomersRepository } from "../../../interfaces/ICustomersRepository.js";
import { normalizeContact } from "../../../shared/utils/normalizeContact.js";

interface IRequest {
  userId: string;
  name: string;
  address?: string | undefined;
  status: "ACTIVE" | "INACTIVE";
  contacts?: {
    type: "WHATSAPP" | "INSTAGRAM";
    value: string;
  }[];
}

export class CreateCustomer {
  constructor(private customerRepository: ICustomersRepository) {}

  async execute({
    userId,
    name,
    address,
    status,
    contacts,
  }: IRequest): Promise<Customer> {
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

        if (exists) {
          throw new AppError(
            `${contact.type} already in use.`,
            400,
            "CONTACT_ALREADY_EXISTS",
          );
        }
      }
    }

    const customer = new Customer({
      userId,
      name,
      address: address ?? null,
      status,
      ...(normalizedContacts &&
        normalizedContacts.length > 0 && {
          contacts: normalizedContacts,
        }),
    });
    

    return await this.customerRepository.create(customer);
  }
}
