#!/usr/bin/env bash
# Levanta el stack completo verificando primero las credenciales de MongoDB.
set -euo pipefail

if [ ! -f .env ]; then
    cp .env.example .env
    echo "==> .env creado a partir de .env.example"
fi

echo "==> Levantando MongoDB..."
docker compose up -d mongo

echo "==> Verificando credenciales de MongoDB..."
mongo_ready=0
for _ in $(seq 1 30); do
    if docker compose exec -T mongo sh -c \
        'mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval "db.adminCommand({ ping: 1 }).ok" >/dev/null 2>&1'; then
        mongo_ready=1
        break
    fi
    sleep 2
done

if [ "$mongo_ready" -ne 1 ]; then
    echo ""
    echo "ERROR: MongoDB no aceptó las credenciales definidas en .env."
    echo ""
    echo "Mongo solo crea el usuario root la PRIMERA vez que inicializa el volumen."
    echo "Si el volumen ya existía con otra contraseña, cambiar .env no la actualiza"
    echo "y el healthcheck falla con 'SCRAM authentication failed, storedKey mismatch'."
    echo ""
    echo "Opciones:"
    echo "  1) Restaurar en .env la contraseña con la que se creó el volumen y reintentar."
    echo "  2) Si no la recuerdas, recrear el volumen (BORRA LOS DATOS):"
    echo "       docker compose down -v && ./start.sh"
    echo ""
    echo "Para confirmar la causa: docker compose logs mongo | grep 'storedKey mismatch'"
    exit 1
fi

echo "==> Credenciales correctas. Levantando el resto del stack..."
docker compose up -d --build
docker compose ps
