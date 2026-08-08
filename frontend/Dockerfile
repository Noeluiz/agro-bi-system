FROM node:20-alpine

WORKDIR /app

# Cria um usuário não-privilegiado para rodar a aplicação
RUN addgroup -S appuser && adduser -S -G appuser appuser

COPY package.json ./
RUN npm install

COPY . .

# Garante permissão de escrita para o usuário não-root
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 5173

CMD ["npm", "run", "dev"]
