FROM python:3.11-slim

WORKDIR /app

# Cria um usuário não-privilegiado para rodar a aplicação (princípio do menor privilégio)
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Garante que o usuário não-root possui permissão de escrita no diretório
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
