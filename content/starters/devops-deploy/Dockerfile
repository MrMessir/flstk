FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# С package-lock.json ставим строго по lock-файлу (npm ci), иначе обычный install.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
# Не запускаем приложение от root.
USER node
EXPOSE 4000
CMD ["node", "src/index.js"]
