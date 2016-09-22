'use strict'

var test = require('tape')
var isBaseUrl = require('./index')

test('Passing a variable that is not a string should return undefined', function (t) {
  t.plan(1)

  var result = isBaseUrl([1, 2, 3])

  t.equal(result, undefined)
})

test('Passing a string that is not a valid URL should return undefined', function (t) {
  t.plan(1)

  var result = isBaseUrl('some sting - no url')

  t.equal(result, undefined)
})

test('Passing a string that is not a valid URL should NOT return undefined IF URL checking is disabled', function (t) {
  t.plan(1)

  var result = isBaseUrl('some sting - no url', {
    checkUrlValid: false
  })

  t.notEqual(result, undefined)
})

test('Passing a URL that is obviously a base URL should result in score 1', function (t) {
  t.plan(1)

  var result = isBaseUrl('http://api.twitter.com/v1')

  t.equal(result.score, 1)
})

test('Passing a URL that is either a base URL or not should result in score 0', function (t) {
  t.plan(1)

  var result = isBaseUrl('http://www.twitter.com/erikwittern')

  t.equal(result.score, 0)
})

test('Passing a URL that is not a base URL should result in score < 0', function (t) {
  t.plan(1)

  var result = isBaseUrl('http://www.twitter.com/users.html?order=desc')

  t.true(result.score < 0)
})

test('Passing a URL that is a base URL should result in score > 0', function (t) {
  t.plan(1)

  var result = isBaseUrl('http://api.rottentomatoes.com/')

  t.true(result.score > 0)
})

test('Passing a URL with various features should result in score close to 0', function (t) {
  t.plan(1)

  var result = isBaseUrl('http://api.rottentomatoes.com/v1/users.json?order=desc')

  t.true(result.score < 0.25 && result.score > -0.25)
})

test('Passing a URL with various features should result in score < 0 if one of the negative features is highly weighted', function (t) {
  t.plan(1)

  var result = isBaseUrl('http://api.rottentomatoes.com/v1/users.json?order=desc', {
    weights: {
      negative: {
        hasQueryString: 3
      }
    }
  })

  t.true(result.score < 0)
})

test('Passing a URL where "api" is part of a larger term should return containsApiSubstring = false', function (t) {
  t.plan(1)

  var result = isBaseUrl('http://www.rottenapis.com')

  t.true(!result.features.positive.containsApiSubstring)
})
