-- Null out any preferredPromptTemplateId references before deleting templates
UPDATE `User` SET `preferredPromptTemplateId` = NULL WHERE `preferredPromptTemplateId` IS NOT NULL;

-- Remove captions that reference AI requests (Restrict FK), then AI requests, then templates
DELETE FROM `Caption` WHERE `aiRequestId` IN (SELECT `id` FROM `AIRequest`);
DELETE FROM `AIRequest`;
DELETE FROM `PromptTemplate`;

-- Drop old unique constraint and index
DROP INDEX `PromptTemplate_name_version_key` ON `PromptTemplate`;
DROP INDEX `PromptTemplate_taskType_isActive_version_idx` ON `PromptTemplate`;

-- Add userId column (non-nullable — table is empty at this point)
ALTER TABLE `PromptTemplate` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- Add foreign key
ALTER TABLE `PromptTemplate` ADD CONSTRAINT `PromptTemplate_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new unique constraint and index
CREATE UNIQUE INDEX `PromptTemplate_userId_name_version_key` ON `PromptTemplate`(`userId`, `name`, `version`);
CREATE INDEX `PromptTemplate_userId_taskType_isActive_version_idx` ON `PromptTemplate`(`userId`, `taskType`, `isActive`, `version` DESC);
