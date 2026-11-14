# Etapa 1: Build de la aplicación con Node 20
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
# El lockfile puede haberse generado en Windows y omitir los binarios nativos
# de Rollup para Linux/musl. Resolvemos las dependencias para la plataforma
# del contenedor para que el build sea reproducible en cualquier host.
RUN npm install --no-package-lock
COPY . .
RUN npm run build

# Etapa 2: Servidor Web Nginx ligero para producción
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
