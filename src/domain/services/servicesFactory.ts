import { CreateService } from "./services/CreateService.js";
import { DeleteService } from "./services/DeleteService.js";
import { ListServicesByProfessional } from "./services/ListServicesByProfessional.js";
import { ListServices } from "./services/ListServices.js";
import { UpdateService } from "./services/UpdateService.js";
import { ServicesController } from "./ServicesController.js";
import ServicesRepository from "./ServicesRepository.js";

const servicesRepository = new ServicesRepository();

const createService = new CreateService(servicesRepository);
const deleteService = new DeleteService(servicesRepository);
const listServicesService = new ListServices(servicesRepository);
const updateService = new UpdateService(servicesRepository);
const listServicesByProfissional = new ListServicesByProfessional(
  servicesRepository,
);

export const servicesController = new ServicesController(
  createService,
  updateService,
  listServicesService,
  deleteService,
  listServicesByProfissional,
);
