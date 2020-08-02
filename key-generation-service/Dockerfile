FROM node:14
WORKDIR /app
COPY . /app
RUN npm install
ENV PORT=8081
ENV REDIS_HOST=redis
EXPOSE $PORT
HEALTHCHECK --interval=5m --timeout=3s CMD curl -f http://localhost:$PORT || exit 1
CMD ["sh","-c","node index.js"]