FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile
RUN pnpm prisma:generate

COPY . .

EXPOSE 3000

CMD ["pnpm", "exec", "next", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
