FROM python:3.11-slim

# Criar usuário não-root
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser

WORKDIR /app

# Copiar requirements.txt da pasta backend (que está no mesmo nível que o Dockerfile)
# O ponto "." no final copia o arquivo para a pasta atual (/app)
COPY backend/requirements.txt .

# Instalar dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo o conteúdo da pasta backend para dentro do container
COPY backend/ .

# Mudar para usuário não-root
USER appuser

EXPOSE 8000

# MUDANÇA AQUI: Troque o "8000" por "${PORT}"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "${PORT}"]