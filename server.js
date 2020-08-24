const tracer = require('dd-trace').init({
    logInjection: true
});

var express = require('express');
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
var winston = require('winston');

winston.add(new winston.transports.Console())

var schema = buildSchema(`
  type Query {
    hello: String
  }
`);

var root = { hello: () => 'Hello world!' };

var app = express();

function loggingMiddleware(req, res, next) {
    if (req.url.startsWith('')) {      
      winston.info(req);      
    }
    next();
  }
  app.use(loggingMiddleware);

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
app.listen(4000, () => console.log('Now browse to localhost:4000/graphql'));