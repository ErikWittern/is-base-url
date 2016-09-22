/**
 * is-base-url
 * A small tool to check whether a given URL is likely to be a base url of a web API
 *
 * Author: Erik Wittern
 * License: MIT
 */
'use strict'

var urlLib = require('url')

module.exports = function (urlStr, opts) {
  // console.log(urlStr)
  opts = opts || {}
  var checkUrlValid = opts.checkUrlValid === false ? false : true

  // return undefined if not a string or empty string
  if (typeof urlStr !== 'string') return

  // return undefined if not a valid url
  if (checkUrlValid && !isValidUrl(urlStr)) return

  // determine features for / against base URL
  var baseUrlFeatures = getBaseUrlFeatures(urlStr)
  // console.log(JSON.stringify(baseUrlFeatures, null, 2))

  // get weights to apply:
  var weights = getWeights(opts)

  // Determine the weights to apply to positive and negative features. These
  // weights compensate the fact that there are different numbers of positive
  // and negative features.
  var numPos = Object.keys(baseUrlFeatures.positive).length
  var numNeg = Object.keys(baseUrlFeatures.negative).length
  var weightPos = 1 / numPos
  var weightNeg = 1 / numNeg
  // var weightsOverall = getWeightsOverall(weights)

  var posScore = 0
  for (var i in baseUrlFeatures.positive) {
    if (baseUrlFeatures.positive[i]) {
      posScore += weightPos * weights.positive[i]
    }
  }

  var negScore = 0
  for (var j in baseUrlFeatures.negative) {
    if (baseUrlFeatures.negative[j]) {
      negScore += weightNeg * weights.negative[j]
    }
  }

  var score = posScore - negScore
  // console.log('%s - %s = %s', posScore, negScore, score)

  return {
    candidateUrl: urlStr,
    score: score,
    features: baseUrlFeatures
  }
}

/**
 * Returns weights assigned to every feature.
 *
 * @param  {object} opts The options passed to isBaseUrl
 * @return {object}      Weights for positive and negative features
 */
var getWeights = function (opts) {
  var weights = {
    positive: {
      containsApiSubstring: 1,
      containsVersionSubstring: 1,
      endsWithVersionSubstring: 1,
      endsWithNumber: 1
    },
    negative: {
      hasQueryString: 1,
      hasFragment: 1,
      containsNonApiSubstring: 1,
      overTwoPaths: 1,
      endsWithFileExtension: 1,
      containsBracket: 1,
      isHomepage: 1
    }
  }

  if (typeof opts.weights !== 'undefined') {
    if (typeof opts.weights.positive !== 'undefined') {
      weights.positive.containsApiSubstring =
        opts.weights.positive.containsApiSubstring || 1
      weights.positive.containsVersionSubstring =
        opts.weights.positive.containsVersionSubstring || 1
      weights.positive.endsWithVersionSubstring =
        opts.weights.positive.endsWithVersionSubstring || 1
      weights.positive.endsWithNumber =
        opts.weights.positive.endsWithNumber || 1
    }
    if (typeof opts.weights.negative !== 'undefined') {
      weights.negative.hasQueryString =
        opts.weights.negative.hasQueryString || 1
      weights.negative.hasFragment =
        opts.weights.negative.hasFragment || 1
      weights.negative.containsNonApiSubstring =
        opts.weights.negative.containsNonApiSubstring || 1
      weights.negative.overTwoPaths =
        opts.weights.negative.overTwoPaths || 1
      weights.negative.endsWithFileExtension =
        opts.weights.negative.endsWithFileExtension || 1
      weights.negative.containsBracket =
        opts.weights.negative.containsBracket || 1
      weights.negative.isHomepage =
        opts.weights.negative.isHomepage || 1
    }
  }

  return weights
}

/**
 * Returns features indicating given URL is a base URL (or not).
 *
 * @param  {string} urlStr
 * @return {object}        Features indicating given string is a base URL or not
 */
var getBaseUrlFeatures = function (urlStr) {
  var result = {
    positive: {},
    negative: {}
  }
  var urlObj = urlLib.parse(urlStr)

  // POSITIVE features:
  // ------------------
  // strings pointing to API:
  result.positive.containsApiSubstring = /[\.|\/|\?|&]api[\.|\/|\?|&]?/gi.test(urlStr)

  // version numbers within URL:
  result.positive.containsVersionSubstring = /v[0-9]|[0-9]\.[0-9]/gi.test(urlStr)

  // version numbers at the end of an URL:
  result.positive.endsWithVersionSubstring = /v[0-9]$|[0-9]\.[0-9]$/gi.test(urlStr)

  // ends on a number (from version or date):
  result.positive.endsWithNumber = /[0-9]$/.test(urlStr)

  // NEGATIVE features:
  // ------------------
  // no query string, please:
  result.negative.hasQueryString = (urlObj.search !== null)

  // no fragment, please:
  result.negative.hasFragment = (urlStr.indexOf('#') !== -1)

  // no known non-API strings, please:
  result.negative.containsNonApiSubstring = /schema|w3\.org/gi.test(urlStr)

  // number of paths:
  var numPaths
  if (typeof urlObj.pathname === 'undefined' ||
    urlObj.pathname === null ||
    urlObj.pathname === '' ||
    urlObj.pathname === '/') {
    numPaths = 0
  } else {
    numPaths = urlObj.pathname.split('/').length - 1
  }

  // having over 2 paths:
  result.negative.overTwoPaths = numPaths > 2

  // no ending in static resource, please:
  var urlNoQueryHash = urlStr.split('#')[0].split('?')[0]
  if ((urlNoQueryHash.match(/\//g) || []).length > 2) {
    result.negative.endsWithFileExtension = /\.[a-zA-Z0-9]{2,5}$/gi.test(urlNoQueryHash)
  } else {
    result.negative.endsWithFileExtension = false
  }

  // contains {, }, <, >, [, ], (, or ):
  result.negative.containsBracket = /{|}|<|>|\[|\]|\(|\)/g.test(urlStr)

  // is it the homepage:
  result.negative.isHomepage = (urlStr === getHomepage(urlStr))

  return result
}

/**
 * Returns the 'home'page of the given URL string.
 *
 * @param  {string} urlStr
 * @return {string}        Homepage, e.g., 'http://www.test.com' for
 * given 'http://api.test.com/users'
 */
var getHomepage = function (urlStr) {
  if (typeof urlStr === 'undefined') return null
  var urlObj = urlLib.parse(urlStr)
  var subDomain = getSubdomain(urlStr)
  var hostname = urlObj.hostname
  // if there is a sub domain, replace it with 'www':
  if (subDomain) {
    hostname = 'www.' + hostname.substring(subDomain.length + 1)
  }
  return urlObj.protocol + (urlObj.slashes ? '//' : '') + hostname
}

/**
 * Returns the subdomain of a given URL string.
 *
 * @param  {string} urlStr
 * @return {string}
 */
var getSubdomain = function (urlStr) {
  if (typeof urlStr === 'undefined') return null
  var regex = /(?:http[s]*\:\/\/)*(.*?)\.(?=[^\/]*\..{2,5})/i
  var result = urlStr.match(regex)
  if (result) {
    return result[1]
  }
  return null
}

/**
 * Kick-ass is-valid-URL implementation.
 *
 * Based on: https://mathiasbynens.be/demo/url-regex
 * And:      https://gist.github.com/dperini/729294
 *
 * @param  {string}  str
 * @return {Boolean}      True, if given string is a valid URL, false if not
 */
var isValidUrl = function (str) {
  var re_url = new RegExp(
    '^' +
      // protocol identifier
      '(?:(?:https?|ftp)://)' +
      // user:pass authentication
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:' +
        // IP address exclusion
        // private & local networks
        '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
        '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
        '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broacast addresses
        // (first & last IP address of each class)
        '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
        '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
        '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
      '|' +
        // host name
        '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
        // domain name
        '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
        // TLD identifier
        '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
        // TLD may end with dot
        '\\.?' +
      ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:[/?#]\\S*)?' +
    '$', 'i'
  )
  return re_url.test(str)
}
