import CreateUserService from "./services/CreateUserService.js";
import UpdateUserService from "./services/UpdateUserService.js";
import UsersRepository from "./UsersRepository.js";

import UsersController from "./UsersController.js";

const usersRepository = new UsersRepository();

const createUserService = new CreateUserService(usersRepository);
const updateUsersService = new UpdateUserService(usersRepository);

export const usersController = new UsersController(
  createUserService,
  updateUsersService,
);
