export interface IContact {
  type: "WHATSAPP" | "INSTAGRAM";
  value: string;
}

export interface ICustomerProps {
  id?: string;
  userId: string;
  name: string;
  address?: string | null;
  contacts?: IContact[];
  status: "ACTIVE" | "INACTIVE";
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null | undefined;
}

export class Customer {
  private props: ICustomerProps;

  constructor(props: ICustomerProps) {
    this.props = {
      ...props,
    };
  }

  get id(): string {
    if (!this.props.id) {
      throw new Error("Customer ID is required but was not provided.");
    }
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get contacts(): IContact[] {
    return this.props.contacts ?? [];
  }

  get address(): string | null {
    return this.props.address ?? null;
  }

  get status(): "ACTIVE" | "INACTIVE" {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  set name(name: string) {
    this.props.name = name;
  }

  set contacts(contacts: IContact[]) {
    this.props.contacts = contacts;
  }

  set address(address: string) {
    this.props.address = address;
  }

  set status(status: "ACTIVE" | "INACTIVE") {
    this.props.status = status;
  }

  set deletedAt(value: Date | null) {
    this.props.deletedAt = value;
  }
}
