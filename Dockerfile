FROM alpine:latest

WORKDIR /app
ADD . /app

RUN apk add --update npm
RUN npm install winston graphql-yoga nexus-prisma graphql dd-trace sync-request --save

RUN npx prisma introspect
RUN npx prisma generate

CMD ["node","src"]

EXPOSE 4000