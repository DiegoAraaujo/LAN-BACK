import type { IAppointmentsRepository } from "../../../interfaces/IAppointmentsRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

interface IRequest {
  id: string;
  userId: string;
}

export class RemoveAppointment {
  constructor(private appointmentsRepository: IAppointmentsRepository) {}

  async execute(input: IRequest): Promise<void> {
    const appointment = await this.appointmentsRepository.findById(
      input.id,
      input.userId,
    );

    if (!appointment) {
      throw new AppError(
        `Appointment with ID ${input.id} not found.`,
        404,
        "APPOINTMENT_NOT_FOUND",
      );
    }

    await this.appointmentsRepository.delete(input.id);
  }
}
