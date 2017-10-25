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
  var timestamp = new Date(opts.query.timestamp)
  var criteria = {
    device: opts.query.device,
    hour: timestamp.getUTCHours(),
    day: timestamp.getUTCDay(),
    state: opts.query.state
  }

  Buyers.getOffers(criteria, function (err, offers) {
    if (err) cb(err)

    var highestValue = 0
    var location = ''
    var asyncCallsLeft = 0
    offers.forEach(function (offer) {
      var buyerId = offer.substring(0, 1)
      var offerIndex = parseInt(offer.substring(2, 3))
      asyncCallsLeft++
      Buyers.get(buyerId, function (err, buyer) {
        if (err) cb(err)

        if (buyer.offers[offerIndex].value > highestValue) {
          highestValue = buyer.offers[offerIndex].value
          location = buyer.offers[offerIndex].location
        }
        asyncCallsLeft--
      })
    })

    var waitForOffers = function () {
      if (asyncCallsLeft > 0) {
        setTimeout(waitForOffers, 0)
      } else {
        if (location !== '') res.statusCode = 302
        send(req, res, {
          headers: {
            location: location
          }
        })
      }
    }
    waitForOffers()
  })
}
