var http = require('http')
var Corsify = require('corsify')
var cuid = require('cuid')
var ReqLogger = require('req-logger')
var HttpHashRouter = require('http-hash-router')
var URL = require('url')
var sendJson = require('send-data/json')

var version = require('../package.json').version
var buyerService = require('../src/services/buyers')

var cors = Corsify({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, accept, content-type'
})
var logger = ReqLogger({ version: version })
var router = HttpHashRouter()

router.set('/', function (req, res) {
  sendJson(req, res, {
    message: 'API is ready'
  })
})
router.set('/buyers/:id', { GET: buyerService.get })
router.set('/buyers/', { POST: buyerService.post })
router.set('/route/', { GET: buyerService.route })

module.exports = function createServer () {
  return http.createServer(cors(handler))
}

function handler (req, res) {
  req.id = cuid()
  logger(req, res, { requestId: req.id }, function (info) {
    console.log(info)
  })
  router(req, res, { query: getQuery(req.url) }, onError.bind(null, req, res))
}

function onError (req, res, err) {
  if (!err) return

  res.statusCode = err.statusCode || 500
  logError(req, res, err)

  sendJson(req, res, {
    error: err.message || http.STATUS_CODES[res.statusCode]
  })
}

function logError (req, res, err) {
  if (process.env.NODE_ENV === 'test') return

  var logType = res.statusCode >= 500 ? 'error' : 'warn'
  console[logType]({
    err: err,
    requestId: req.id,
    statusCode: res.statusCode
  }, err.message)
}

function getQuery (url) {
  return URL.parse(url, true).query
}
