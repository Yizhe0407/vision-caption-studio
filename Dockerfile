FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

ARG DATABASE_URL="mysql://root:password@mysql:3306/vision_caption_studio"
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
