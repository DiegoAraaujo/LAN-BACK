import type { IUserTokensRepository } from "../../../interfaces/IUserTokensRepository.js";

export class LogoutService {
  constructor(private userTokensRepository: IUserTokensRepository) {}

  async execute({ refreshToken }: { refreshToken: string }): Promise<void> {
    // Possession of the exact refresh token authorizes revoking only that session.
    // deleteMany makes retries and already-expired sessions idempotent.
    await this.userTokensRepository.deleteByRefreshToken(refreshToken);
  }
}
