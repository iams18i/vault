FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

ENV NUXT_HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "dev"]
