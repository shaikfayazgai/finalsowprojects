# Build context = backend/  (so we can COPY shared/ + the service)
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 SERVICE_PORT=8000

WORKDIR /app

# Shared library deps cover every service.
COPY shared/requirements.txt /app/shared/requirements.txt
RUN pip install --no-cache-dir -r /app/shared/requirements.txt

COPY shared/ /app/shared/
COPY services/email-service/ /app/

EXPOSE 8000
CMD ["sh", "-c", "uvicorn email_app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
