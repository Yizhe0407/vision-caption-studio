import { AIProviderFactory } from "@/src/infrastructure/ai/ai-provider-factory";
import { AuthController } from "@/src/controllers/auth.controller";
import { AdminUserController } from "@/src/controllers/admin-user.controller";
import { UploadController } from "@/src/controllers/upload.controller";
import { JobController } from "@/src/controllers/job.controller";
import { ImageController } from "@/src/controllers/image.controller";
import { ProviderCredentialController } from "@/src/controllers/provider-credential.controller";
import { PromptTemplateController } from "@/src/controllers/prompt-template.controller";
import { AIRequestRepository } from "@/src/repositories/ai-request.repository";
import { CaptionRepository } from "@/src/repositories/caption.repository";
import { ImageRepository } from "@/src/repositories/image.repository";
import { JobRepository } from "@/src/repositories/job.repository";
import { ProviderCredentialRepository } from "@/src/repositories/provider-credential.repository";
import { PromptTemplateRepository } from "@/src/repositories/prompt-template.repository";
import { RefreshTokenRepository } from "@/src/repositories/refresh-token.repository";
import { TagRepository } from "@/src/repositories/tag.repository";
import { UserRepository } from "@/src/repositories/user.repository";
import { AIGenerationService } from "@/src/services/ai-generation.service";
import { AuthService } from "@/src/services/auth.service";
import { AdminUserService } from "@/src/services/admin-user.service";
import { ImageService } from "@/src/services/image.service";
import { JobService } from "@/src/services/job.service";
import { ProviderCredentialService } from "@/src/services/provider-credential.service";
import { PromptTemplateService } from "@/src/services/prompt-template.service";

class AppContainer {
  readonly userRepository = new UserRepository();
  readonly refreshTokenRepository = new RefreshTokenRepository();
  readonly imageRepository = new ImageRepository();
  readonly promptTemplateRepository = new PromptTemplateRepository();
  readonly aiRequestRepository = new AIRequestRepository();
  readonly captionRepository = new CaptionRepository();
  readonly tagRepository = new TagRepository();
  readonly jobRepository = new JobRepository();
  readonly providerCredentialRepository = new ProviderCredentialRepository();
  readonly aiProviderFactory = new AIProviderFactory();

  readonly promptTemplateService = new PromptTemplateService(this.promptTemplateRepository);
  readonly authService = new AuthService(this.userRepository, this.refreshTokenRepository);
  readonly adminUserService = new AdminUserService(this.userRepository);
  readonly imageService = new ImageService(this.imageRepository);
  readonly jobService = new JobService(this.jobRepository);
  readonly providerCredentialService = new ProviderCredentialService(
    this.providerCredentialRepository,
    this.userRepository,
    this.promptTemplateRepository,
  );
  readonly aiGenerationService = new AIGenerationService(
    this.aiProviderFactory,
    this.imageRepository,
    this.promptTemplateRepository,
    this.aiRequestRepository,
    this.captionRepository,
    this.tagRepository,
    this.jobRepository,
    this.providerCredentialService,
    this.userRepository,
  );

  readonly authController = new AuthController(this.authService);
  readonly adminUserController = new AdminUserController(this.adminUserService);
  readonly uploadController = new UploadController(this.imageService, this.jobService);
  readonly jobController = new JobController(this.jobService);
  readonly imageController = new ImageController(
    this.imageRepository,
    this.captionRepository,
    this.tagRepository,
    this.jobRepository,
    this.promptTemplateRepository,
    this.aiRequestRepository,
    this.userRepository,
  );
  readonly providerCredentialController = new ProviderCredentialController(this.providerCredentialService);
  readonly promptTemplateController = new PromptTemplateController(this.promptTemplateService);
}

export const container = new AppContainer();
