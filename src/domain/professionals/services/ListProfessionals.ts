import type {
  IProfessionalsRepository,
  ProfessionalWithServices,
} from "../../../interfaces/IProfessionalsRepository.js";

interface IRequest {
  userId: string;
  search?: string | undefined;
}

export class ListProfessionals {
  constructor(private professionalsRepository: IProfessionalsRepository) {}

  async execute({
    userId,
    search,
  }: IRequest): Promise<ProfessionalWithServices[]> {
    return await this.professionalsRepository.findAll(userId, search);
  }
}
