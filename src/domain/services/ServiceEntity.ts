export interface IServiceProps {
  id?: string;
  userId: string;
  name: string;
  price: number;
  description?: string | null | undefined;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Service {
  private props: IServiceProps;

  constructor(props: IServiceProps) {
    this.props = {
      ...props,
    };
  }

  get id(): string {
    if (!this.props.id) {
      throw new Error("Service ID is required but was not provided.");
    }
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get price(): number {
    return this.props.price;
  }

  get description(): string | null {
    return this.props.description ?? null;
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

  set name(value: string) {
    this.props.name = value;
  }

  set price(value: number) {
    if (value < 0) throw new Error("Price cannot be negative.");
    this.props.price = value;
  }

  set description(value: string | null) {
    this.props.description = value;
  }

  set deletedAt(value: Date | null) {
    this.props.deletedAt = value;
  }
}
