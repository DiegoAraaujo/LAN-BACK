import type { IUserTokensRepository } from "../../../interfaces/IUserTokensRepository.js";

export class RevokeAllSessionsService {
  constructor(private userTokensRepository: IUserTokensRepository) {}

  async execute(userId: string): Promise<void> {
    await this.userTokensRepository.revokeAllForUser(userId);
  }
}
