# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Backend Runtime
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# RUN apt-get update && apt-get install -y ... && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend ./backend
COPY verify_deployment.py .

# Copy Built Frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create data directory
RUN mkdir -p data/uploads

EXPOSE 8222

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8222"]
