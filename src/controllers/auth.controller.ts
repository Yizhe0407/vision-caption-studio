import { z } from "zod";
import { AuthService } from "@/src/services/auth.service";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(payload: unknown) {
    const parsed = authSchema.parse(payload);
    return this.authService.register(parsed.email, parsed.password);
  }

  async login(payload: unknown) {
    const parsed = authSchema.parse(payload);
    return this.authService.login(parsed.email, parsed.password);
  }

  async refresh(payload: unknown) {
    const parsed = z
      .object({
        refreshToken: z.string().min(1),
      })
      .parse(payload);

    return this.authService.refresh(parsed.refreshToken);
  }

  async logout(payload: unknown) {
    const parsed = z
      .object({
        refreshToken: z.string().min(1),
      })
      .parse(payload);

    await this.authService.logout(parsed.refreshToken);
  }
}
