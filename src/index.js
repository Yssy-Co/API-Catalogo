const tracer = require('dd-trace').init({
  logInjection: true,
  service: 'api-catalogo',
  env: 'yssy-demo',
  runtimeMetrics: true
});

var winston = require('winston');
winston.add(new winston.transports.Console())

const { GraphQLServer } = require('graphql-yoga')
const { makeSchema, objectType, intArg, stringArg } = require('@nexus/schema')
const { PrismaClient } = require('@prisma/client')
const { nexusPrismaPlugin } = require('nexus-prisma')

const Item = objectType({
  name: 'Item',
  definition(t) {
    t.model.id()
    t.model.codigo()
    t.model.valor()
    t.model.descricao()
    t.model.nome()
  },
});

const Query = objectType({
  name: 'Query',
  definition(t) {
  t.crud.item();

  t.list.field('item', {
    type: 'Item',
    resolve: (_, _args, ctx) => {
      return ctx.prisma.item.findMany();
    },
  })
  }
})

const prisma = new PrismaClient({
  debug: true,
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

prisma.$on('query', e => {  
  /*var child = tracer.startSpan('prisma.query', {childOf: tracer.scope().active().context()});

  child._spanContext._traceId = tracer.scope().active().context()._traceId;
  child._spanContext._parentId = tracer.scope().active().context()._spanId;

  child.setTag('query', e.query);
  child.setTag('params', JSON.parse(e.params));  
  */
  winston.info(e);  
});

new GraphQLServer({
  schema: makeSchema({
    types: [Query, Item],
    plugins: [nexusPrismaPlugin()],
    outputs: {
      schema: __dirname + '/../schema.graphql',
      typegen: __dirname + '/generated/nexus.ts',
    },
  }),
  context: { prisma },
}).start(() =>
  console.log(
    `🚀 Server ready at: http://localhost:4000\n⭐️ See sample queries: http://pris.ly/e/js/graphql#using-the-graphql-api`,
  ),
)

module.exports = { Item }