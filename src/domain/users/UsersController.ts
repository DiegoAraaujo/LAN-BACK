import type { Request, Response } from "express";
import CreateUserService from "./services/CreateUserService.js";
import { UserMapper } from "./UsersMappers.js";
import UpdateUserService from "./services/UpdateUserService.js";
import { createUserSchema, updateUserSchema } from "./usersSchemas.js";

class UsersController {
  constructor(
    private createUserService: CreateUserService,
    private updateUserService: UpdateUserService,
  ) {}
  async create(req: Request, res: Response): Promise<Response> {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
      throw result.error;
    }

    const user = await this.createUserService.execute(result.data);

    return res.status(201).json(UserMapper.toResponse(user));
  }

  async update(req: Request, res: Response): Promise<Response> {
    const id = req.user.id;

    const result = updateUserSchema.safeParse(req.body);

    if (!result.success) {
      throw result.error;
    }

    const user = await this.updateUserService.execute(id, result.data);

    return res.status(200).json(UserMapper.toResponse(user));
  }
}

export default UsersController;
