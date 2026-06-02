import type {
  IAppointmentsRepository,
  ISearchWithFiltersResponse,
} from "../../../interfaces/IAppointmentsRepository.js";

interface IRequest {
  userId: string;
  search?: string | undefined;
  paymentStatus?: "PAID" | "PENDING" | undefined;
  year?: number | undefined;
  month?: number | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

interface IResponse {
  data: ISearchWithFiltersResponse[];
  total: number;
  totalPending: number;
}

export class ListAppointments {
  constructor(private appointmentsRepository: IAppointmentsRepository) {}

  async execute(request: IRequest): Promise<IResponse> {
    const {
      userId,
      search,
      paymentStatus,
      year,
      month,
      page = 1,
      limit = 10,
    } = request;

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const { data, total, totalPending } =
      await this.appointmentsRepository.searchWithFilters({
        userId,
        search,
        paymentStatus,
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
        take,
        skip,
      });

    return {
      data,
      total,
      totalPending,
    };
  }
}
