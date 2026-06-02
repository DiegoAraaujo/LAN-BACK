import { hash } from "bcryptjs";
import { AppError } from "../../../shared/errors/AppError.js";
import User from "../UserEntity.js";
import type { IUserRepository } from "../IUserRepository.js";

interface IRequest {
  name: string;
  email: string;
  password: string;
}
type IResponse = User;

class CreateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute({ name, email, password }: IRequest): Promise<IResponse> {
    const userAlreadyExists = await this.userRepository.findByEmail(email);

    if (userAlreadyExists) {
      throw new AppError(
        "This email address is already in use.",
        400,
        "EMAIL_ALREADY_EXISTS",
      );
    }

    const hashedPassword = await hash(password, 8);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    return await this.userRepository.create(user);
  }
}

export default CreateUserService;
