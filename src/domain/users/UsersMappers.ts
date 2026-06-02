import User from "./UserEntity.js";

// export interface IUserDTO {
//   id: string;
//   name: string;
//   email: string;
//   createdAt?: Date | undefined;
// }

export class UserMapper {
  static toResponse(user: User) {
    return {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
