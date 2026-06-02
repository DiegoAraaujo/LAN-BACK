import type { Request, Response } from "express";

import type { CreateService } from "./services/CreateService.js";
import type { UpdateService } from "./services/UpdateService.js";
import type { ListServices } from "./services/ListServices.js";
import type { DeleteService } from "./services/DeleteService.js";
import type { ListServicesByProfessional } from "./services/ListServicesByProfessional.js";

import {
  createServiceSchema,
  updateServiceSchema,
  professionalIdParamSchema,
  serviceIdParamSchema,
} from "./serviceSchema.js";
import { ServiceMappers } from "./servicesMappers.js";

export class ServicesController {
  constructor(
    private createService: CreateService,
    private updateService: UpdateService,
    private listServices: ListServices,
    private removeService: DeleteService,
    private listServicesByProfessional: ListServicesByProfessional,
  ) {}

  async create(request: Request, response: Response): Promise<Response> {
    const data = createServiceSchema.parse(request.body);

    const { id: userId } = request.user;

    const service = await this.createService.execute({
      ...data,
      userId,
    });

    return response.status(201).json(ServiceMappers.toResponse(service));
  }

  async list(request: Request, response: Response): Promise<Response> {
    const { id: userId } = request.user;

    const search =
      typeof request.query.search === "string"
        ? request.query.search
        : undefined;

    const services = await this.listServices.execute({
      userId,
      search,
    });

    return response.status(200).json(services.map(ServiceMappers.toResponse));
  }

  async update(
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<Response> {
    const { id } = serviceIdParamSchema.parse(request.params);
    const data = updateServiceSchema.parse(request.body);

    const { id: userId } = request.user;

    const updated = await this.updateService.execute({
      id,
      userId,
      ...data,
    });

    return response.status(200).json(ServiceMappers.toResponse(updated));
  }

  async remove(
    request: Request<{ id: string }>,
    response: Response,
  ): Promise<Response> {
    const { id } = serviceIdParamSchema.parse(request.params);
    const { id: userId } = request.user;

    await this.removeService.execute({ id, userId });

    return response.sendStatus(204);
  }

  async listByProfessional(
    request: Request<{ professionalId: string }>,
    response: Response,
  ): Promise<Response> {
    const { professionalId } = professionalIdParamSchema.parse(request.params);
    const { id: userId } = request.user;

    const services = await this.listServicesByProfessional.execute({
      professionalId,
      userId,
    });

    return response.status(200).json(services.map(ServiceMappers.toResponse));
  }
}
