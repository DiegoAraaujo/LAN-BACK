import type { IUserRepository } from "../IUserRepository.js";
import User from "../UserEntity.js";
import { AppError } from "../../../shared/errors/AppError.js";

interface IUpdateUserRequest {
  name?: string | undefined;
  email?: string | undefined;
}
type IResponse = User;

class UpdateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, data: IUpdateUserRequest): Promise<IResponse> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppError("User not found.", 404, "USER_NOT_FOUND");
    }

    if (data.email && data.email !== user.email) {
      const emailExists = await this.userRepository.findByEmail(data.email);

      if (emailExists) {
        throw new AppError(
          "Email already in use.",
          400,
          "EMAIL_ALREADY_EXISTS",
        );
      }

      user.email = data.email;
    }

    if (data.name) {
      user.name = data.name;
    }

    return await this.userRepository.update(user);
  }
}

export default UpdateUserService;
