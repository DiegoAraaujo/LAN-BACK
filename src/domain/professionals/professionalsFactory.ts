import { ProfessionalsController } from "./ProfessionalsController.js";
import { ProfessionalsRepository } from "./ProfessionalsRepository.js";
import { CreateProfessional } from "./services/CreateProfessional.js";
import { DeleteProfessional } from "./services/DeleteProfessional.js";
import { ListProfessionals } from "./services/ListProfessionals.js";
import { ListProfessionalsByServiceId } from "./services/ListProfessionalsByServiceId.js";
import { UpdateProfessional } from "./services/UpdateProfessional.js";
import { ServicesRepository } from "../services/ServicesRepository.js";

const professionalsRepository = new ProfessionalsRepository();

const servicesRepository = new ServicesRepository();
const createProfessional = new CreateProfessional(professionalsRepository, servicesRepository);
const updateProfessional = new UpdateProfessional(professionalsRepository, servicesRepository);

const deleteProfessional = new DeleteProfessional(professionalsRepository);

const listProfessionals = new ListProfessionals(professionalsRepository);
const listProfessionalsByServiceId = new ListProfessionalsByServiceId(
  professionalsRepository,
);

export const professionalsController = new ProfessionalsController(
  createProfessional,
  listProfessionals,
  updateProfessional,
  deleteProfessional,
  listProfessionalsByServiceId,
);
