import User from "./UserEntity.js";

export class UserMapper {
  static toResponse(user: User) {
    return {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
