export interface AppointmentProps {
  id?: string;
  userId: string;
  customerId: string;
  registeredById: string;
  appointmentDate: Date;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount?: number;
  paidAt?: Date | null;
  paymentMethod:
    | "DEBIT_CARD"
    | "CREDIT_CARD"
    | "CASH"
    | "PIX"
    | "OTHER"
    | null;
  paymentStatus: "PAID" | "PENDING" | "PARTIAL";
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Appointment {
  private props: AppointmentProps;

  constructor(props: AppointmentProps) {
    this.props = {
      ...props,
    };
  }

  get id(): string {
    if (!this.props.id) {
      throw new Error("Appointment ID has not been initialized.");
    }
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get customerId(): string {
    return this.props.customerId;
  }
  get registeredById(): string {
    return this.props.registeredById;
  }
  get appointmentDate(): Date {
    return this.props.appointmentDate;
  }
  get subtotal(): number {
    return this.props.subtotal;
  }
  get discount(): number {
    return this.props.discount;
  }
  get total(): number {
    return this.props.total;
  }
  get paidAmount(): number { return this.props.paidAmount ?? 0; }
  get paidAt(): Date | null { return this.props.paidAt ?? null; }
  get paymentMethod() {
    return this.props.paymentMethod;
  }
  get paymentStatus() {
    return this.props.paymentStatus;
  }
  get notes(): string | null {
    return this.props.notes ?? null;
  }
  get createdAt(): Date {
    return this.props.createdAt!;
  }
  get updatedAt(): Date {
    return this.props.updatedAt!;
  }
  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  set userId(userId: string) {
    this.props.userId = userId;
  }

  set customerId(customerId: string) {
    this.props.customerId = customerId;
  }

  set registeredById(registeredById: string) {
    this.props.registeredById = registeredById;
  }

  set appointmentDate(date: Date) {
    this.props.appointmentDate = date;
  }

  set subtotal(subtotal: number) {
    this.props.subtotal = subtotal;
  }

  set discount(discount: number) {
    this.props.discount = discount;
  }

  set total(total: number) {
    this.props.total = total;
  }

  set paymentMethod(
    method: "DEBIT_CARD" | "CREDIT_CARD" | "CASH" | "PIX" | "OTHER" | null,
  ) {
    this.props.paymentMethod = method;
  }

  set paymentStatus(status: "PAID" | "PENDING" | "PARTIAL") {
    this.props.paymentStatus = status;
  }

  set notes(notes: string | null) {
    this.props.notes = notes;
  }
}
