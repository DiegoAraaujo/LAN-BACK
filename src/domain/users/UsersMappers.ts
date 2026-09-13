import User from "./UserEntity.js";

export class UserMapper {
  static toResponse(user: User) {
    return {
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    };
  }
}
