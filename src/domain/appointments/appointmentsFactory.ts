import CustomersRepository from "../customers/CustomersRepository.js";
import { ProfessionalsRepository } from "../professionals/ProfessionalsRepository.js";
import ServicesRepository from "../services/ServicesRepository.js";
import { AppointmentsRepository } from "./AppointmentsRepository.js";
import { AppointmentsController } from "./AppointmentsController.js";
import { CreateAppointment } from "./services/CreateAppointment.js";
import { RemoveAppointment } from "./services/RemoveAppointment.js";
import { UpdateAppointment } from "./services/UpdateAppointment.js";
import { ListAppointments } from "./services/ListAppointments.js";

const appointmentsRepository = new AppointmentsRepository();
const servicesRepository = new ServicesRepository();
const professionalsRepository = new ProfessionalsRepository();
const customersRepository = new CustomersRepository();

const createAppointment = new CreateAppointment(
  appointmentsRepository,
  servicesRepository,
  professionalsRepository,
  customersRepository,
);

const updateAppointment = new UpdateAppointment(
  appointmentsRepository,
  servicesRepository,
  professionalsRepository,
);

const removeAppointment = new RemoveAppointment(appointmentsRepository);

const listAppointments = new ListAppointments(appointmentsRepository);

export const appointmentsController = new AppointmentsController(
  createAppointment,
  updateAppointment,
  removeAppointment,
  listAppointments,
);
