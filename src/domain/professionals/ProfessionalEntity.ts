export interface IProfessionalProps {
  id?: string;
  userId: string;
  name: string;
  address: string;
  phone: string;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  servicesIds?: string[];
}

export class Professional {
  private props: IProfessionalProps;

  constructor(props: IProfessionalProps) {
    this.props = {
      ...props,
      servicesIds: props.servicesIds ?? [],
    };
  }

  get id(): string {
    if (!this.props.id) throw new Error("Professional ID is undefined.");

    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  get address(): string {
    return this.props.address;
  }

  set address(address: string) {
    this.props.address = address;
  }

  get phone(): string {
    return this.props.phone;
  }

  set phone(phone: string) {
    this.props.phone = phone;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get servicesIds(): string[] {
    return this.props.servicesIds ?? [];
  }

  set servicesIds(servicesIds: string[]) {
    this.props.servicesIds = servicesIds;
  }
}
