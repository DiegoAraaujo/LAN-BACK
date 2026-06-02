import type { Request, Response } from "express";
import type { CreateProfessional } from "./services/CreateProfessional.js";
import type { ListProfessionals } from "./services/ListProfessionals.js";
import type { UpdateProfessional } from "./services/UpdateProfessional.js";
import type { DeleteProfessional } from "./services/DeleteProfessional.js";
import {
  createProfessionalSchema,
  professionalIdParamSchema,
  updateProfessionalSchema,
} from "./professionalsSchema.js";
import { ProfessionalMappers } from "./professionalsMappers.js";
import type { ListProfessionalsByServiceId } from "./services/ListProfessionalsByServiceId.js";

export class ProfessionalsController {
  constructor(
    private createProfessional: CreateProfessional,
    private listProfessionals: ListProfessionals,
    private updateProfessional: UpdateProfessional,
    private removeProfessional: DeleteProfessional,
    private listProfessionalsByServiceId: ListProfessionalsByServiceId,
  ) {}

  async create(request: Request, response: Response): Promise<Response> {
    const data = createProfessionalSchema.parse(request.body);

    const { id: userId } = request.user;
    const { servicesIds, ...restOfData } = data;

    const professional = await this.createProfessional.execute({
      ...restOfData,
      userId,
      servicesIds: servicesIds || [],
    });

    return response
      .status(201)
      .json(ProfessionalMappers.toResponse(professional));
  }

  async list(request: Request, response: Response): Promise<Response> {
    const { id: userId } = request.user;

    const search =
      typeof request.query.search === "string"
        ? request.query.search
        : undefined;

    const professionals = await this.listProfessionals.execute({
      userId,
      search,
    });

    return response
      .status(200)
      .json(
        professionals.map((p) =>
          ProfessionalMappers.toResponse(p.professional, p.services),
        ),
      );
  }

  async listProfessionalsByService(
    request: Request,
    response: Response,
  ): Promise<Response> {
    const { id: userId } = request.user;

    const { id: serviceId } = professionalIdParamSchema.parse(request.params);

    const professionals = await this.listProfessionalsByServiceId.execute({
      userId,
      serviceId,
    });

    return response
      .status(200)
      .json(professionals.map((p) => ProfessionalMappers.toResponse(p)));
  }

  async update(
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<Response> {
    const { id } = professionalIdParamSchema.parse(request.params);
    const data = updateProfessionalSchema.parse(request.body);

    const { id: userId } = request.user;

    const updated = await this.updateProfessional.execute({
      id,
      userId,
      ...data,
    });

    return response.status(200).json(ProfessionalMappers.toResponse(updated));
  }

  async remove(
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<Response> {
    const { id } = professionalIdParamSchema.parse(request.params);
    const { id: userId } = request.user;

    await this.removeProfessional.execute({ id, userId });

    return response.sendStatus(204);
  }
}
