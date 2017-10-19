var body = require('body/json')
var send = require('send-data')
var sendJson = require('send-data/json')

var Buyers = require('../models/buyers')

module.exports = {
  get: get,
  post: post,
  route: route
}

function get (req, res, opts, cb) {
  Buyers.get(opts.params.id, function (err, buyer) {
    if (err) return cb(err)

    sendJson(req, res, buyer)
  })
}

function post (req, res, opts, cb) {
  body(req, res, function (err, buyer) {
    if (err) return cb(err)

    Buyers.add(buyer, function (err) {
      if (err) return cb(err)

      res.statusCode = 201
      sendJson(req, res, buyer)
    })
  })
}

function route (req, res, opts, cb) {
  Buyers.getAll(function (err, buyersId) {
    if (err) return cb(err)

    var currentHighestValue = 0
    var location = ''
    var asyncCallsLeft = buyersId.length

    buyersId.forEach(function (buyerId) {
      Buyers.get(buyerId, function (err, buyer) {
        if (err) return cb(err)

        asyncCallsLeft--
        buyer.offers.forEach(function (offer) {
          if (
            offer.criteria.device.includes(opts.query.device) &&
            offer.criteria.state.includes(opts.query.state) &&
            parseInt(offer.value) > currentHighestValue
          ) {
            currentHighestValue = offer.value
            location = offer.location
          }
        })
        if (asyncCallsLeft === 0) {
          if (location !== '') res.statusCode = 302
          send(req, res, {
            headers: {
              location: location
            }
          })
        }
      })
    })
  })
}
