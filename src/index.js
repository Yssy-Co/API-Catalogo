const tracer = require('dd-trace').init({
  logInjection: true,
  service: 'api-catalogo',
  env: 'yssy-demo',
  runtimeMetrics: true
});

const opentracing = require('opentracing')

opentracing.initGlobalTracer(tracer)

var winston = require('winston');
winston.add(new winston.transports.Console())

const { GraphQLServer } = require('graphql-yoga')
const { makeSchema, objectType, intArg, stringArg } = require('@nexus/schema')
const { PrismaClient } = require('@prisma/client')
const { nexusPrismaPlugin } = require('nexus-prisma')

var request = require('sync-request');
const { child } = require('winston');

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

prisma.$use( async (params, next) => {
  
  // Adicionar verificação/foreach aqui

  var endpoint = "http://"+process.env.API_ESTOQUE+"/conferir-estoque";
  winston.info("Endereço de API de Estoque: "+endpoint);  

  var result = await next(params)

  resultado = result;

  result.forEach(function(item, index, object){
    //console.log(item)
    var child = tracer.startSpan('prisma.middleware', {childOf: tracer.scope().active().context()})
    child.setTag('item', item);
    var headers = {}
    tracer.inject(tracer.scope().active().context(), opentracing.FORMAT_HTTP_HEADERS, headers)
    res = request('GET', endpoint);
    if (res.statusCode != 200)
    {
      winston.info("Sem estoque do item "+item.codigo);
      resultado.splice(index,1);
    }
    child.finish()
  });  

  return resultado;
});

/*
prisma.$on('query', e => {  
  /*var child = tracer.startSpan('prisma.query', {childOf: tracer.scope().active().context()});

  child._spanContext._traceId = tracer.scope().active().context()._traceId;
  child._spanContext._parentId = tracer.scope().active().context()._spanId;

  child.setTag('query', e.query);
  child.setTag('params', JSON.parse(e.params));  
  */
  //winston.info(e);
  /*
  var endpoint = "http://"+process.env.API_ESTOQUE+"/conferir-estoque";
  winston.info("Endereço de API de Estoque: "+endpoint)  
    
  fetch(endpoint)  
  .then(function(res){
    if (res.ok) {
      return res.text()
    }
    else{
      winston.warn("Não consta no estoque");      
    }
  }   
  )
  .then(function(body){
    if (body) {
      winston.info(body) 
    }
  }
  )  
});
*/
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