import type { Appointment } from "./AppointmentsEntity.js";

export class AppointmentMapper {
  static toResponse(appointment: Appointment) {
    return {
      id: appointment.id,
      customerId: appointment.customerId,
      appointmentDate: appointment.appointmentDate,
      subtotal: appointment.subtotal,
      discount: appointment.discount,
      total: appointment.total,
      paidAmount: appointment.paidAmount,
      remaining: Math.round((appointment.total - appointment.paidAmount) * 100) / 100,
      paidAt: appointment.paidAt,
      paymentStatus: appointment.paymentStatus,
      paymentMethod: appointment.paymentMethod,
      notes: appointment.notes,
    };
  }
}
