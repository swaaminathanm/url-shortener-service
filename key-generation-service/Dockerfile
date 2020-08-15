FROM node:14
WORKDIR /app
COPY . /app
RUN npm install
ENV PORT=8081
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=keys
ENV DB_USER=postgres
ENV DB_PASSWORD=password
EXPOSE $PORT
HEALTHCHECK --interval=5m --timeout=3s CMD curl -f http://localhost:$PORT || exit 1
ENTRYPOINT ["sh","-c","npm run db:migrate && npm run start"]