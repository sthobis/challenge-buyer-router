var redis = require('../redis')

var client = redis()

module.exports = {
  get: get,
  getAll: getAll,
  add: add
}

function get (id, cb) {
  client.hget(
    'buyers',
    id,
    function (err, buyer) {
      if (err) cb(err)
      cb(null, { id: id, offers: JSON.parse(buyer) })
    }
  )
}

function getAll (cb) {
  client.hkeys(
    'buyers',
    function (err, buyers) {
      if (err) cb(err)
      cb(null, buyers)
    }
  )
}

function add (data, cb) {
  client.hset(
    'buyers',
    data.id,
    JSON.stringify(data.offers),
    function (err, res) {
      if (err) cb(err)
      cb(null, res)
    }
  )
}
