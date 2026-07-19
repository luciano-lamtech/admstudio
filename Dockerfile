# ============================================================
# ADMSTUDIO - Dockerfile único (monorepo)
# STAGE 1: build do frontend (React)
# ============================================================
FROM node:20-alpine AS frontend-build

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .

# Como front e back ficam no mesmo domínio/serviço, a API é chamada
# com caminho relativo (mesma origem) — não precisa de URL completa.
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# ============================================================
# STAGE 2: backend Django, servindo a API e os arquivos do
# React (build) — um único container/serviço.
# ============================================================
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev build-essential pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-build /frontend/build ./frontend_build

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
