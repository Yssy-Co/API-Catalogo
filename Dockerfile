FROM alpine:latest

WORKDIR /app
ADD server.js .

RUN apk add --update npm
RUN npm install express express-graphql graphql dd-trace --save

CMD ["node","server.js"]

EXPOSE 4000