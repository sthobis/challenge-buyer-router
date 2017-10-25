var redis = require('../redis')

var client = redis()

module.exports = {
  get: get,
  getOffers: getOffers,
  add: add
}

/*
 * return buyer instance
 * output: OBJECT
 */
function get (id, cb) {
  client.get(
    `buyers:${id}`,
    function (err, buyer) {
      if (err) cb(err)

      cb(null, { id: id, offers: JSON.parse(buyer) })
    }
  )
}

/*
 * return matching offers based on criteria
 * output:  ARRAY of STRING `{buyerId}:{offerIndex}`
 * example: ['a:1', 'b:0']
 */

function getOffers (criteria, cb) {
  var criteriaKeys = []
  for (var prop in criteria) {
    criteriaKeys.push(`buyers:offers:criteria:${prop}:${criteria[prop]}`)
  }
  client.sinter(
    criteriaKeys,
    function (err, res) {
      if (err) cb(err)

      cb(null, res)
    }
  )
}

/*
 * increase buyers count
 *
 * STRING key value
 * id:buyers 1
 */
function add (buyer, cb) {
  client.incr(
    'id:buyers',
    function (err, res) {
      if (err) cb(err)

      addBuyerId(buyer, cb)
    }
  )
}

/*
 * add new buyer id into buyers set
 *
 * SETS key value
 * buyers [a, b, c]
 */
function addBuyerId (buyer, cb) {
  client.sadd(
    'buyers',
    buyer.id,
    function (err, res) {
      if (err) cb(err)

      addBuyerData(buyer, cb)
    }
  )
}

/*
 * add new buyer data
 *
 * STRING key value
 * buyers:{id} "JSON encoded STRING"
 */
function addBuyerData (buyer, cb) {
  client.set(
    `buyers:${buyer.id}`,
    JSON.stringify(buyer.offers),
    function (err, res) {
      if (err) cb(err)

      addBuyerOffersCriteria(buyer, cb)
    }
  )
}

/*
 * save buyers offers' criteria into multiple sets
 *
 * SETS key value
 * buyers:offers:criteria:device:{device} [a:0, ...]
 * buyers:offers:criteria:hour:{hour} [a:0, ...]
 * buyers:offers:criteria:day:{day} [a:0, ...]
 * buyers:offers:criteria:state:{state} [a:0, ...]
 */
function addBuyerOffersCriteria (buyer, cb) {
  var asyncCallsLeft = 0
  buyer.offers.forEach(function (offer, offerIndex) {
    offer.criteria.device.forEach(function (device) {
      asyncCallsLeft++
      client.sadd(
        `buyers:offers:criteria:device:${device}`,
        `${buyer.id}:${offerIndex}`,
        function (err, res) {
          if (err) cb(err)

          asyncCallsLeft--
        }
      )
    })

    offer.criteria.hour.forEach(function (hour) {
      asyncCallsLeft++
      client.sadd(
        `buyers:offers:criteria:hour:${hour}`,
        `${buyer.id}:${offerIndex}`,
        function (err, res) {
          if (err) cb(err)

          asyncCallsLeft--
        }
      )
    })

    offer.criteria.day.forEach(function (day) {
      asyncCallsLeft++
      client.sadd(
        `buyers:offers:criteria:day:${day}`,
        `${buyer.id}:${offerIndex}`,
        function (err, res) {
          if (err) cb(err)

          asyncCallsLeft--
        }
      )
    })

    offer.criteria.state.forEach(function (state) {
      asyncCallsLeft++
      client.sadd(
        `buyers:offers:criteria:state:${state}`,
        `${buyer.id}:${offerIndex}`,
        function (err, res) {
          if (err) cb(err)

          asyncCallsLeft--
        }
      )
    })
  })

  var waitForOffers = function () {
    if (asyncCallsLeft > 0) {
      setTimeout(waitForOffers, 0)
    } else {
      cb(null, buyer)
    }
  }
  waitForOffers()
}
