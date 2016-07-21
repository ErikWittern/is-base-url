# is-base-url

A small tool to check whether a given URL is likely to be a base url of a web API. `is-base-url` takes as input a URL string and returns a `score` for how likely it is a base URL. To do so, `is-base-url` considers lexical features of the given URL that either support or discourage the classification as a base URL.

## Usage

Install via:

    npm i is-base-url

Use it via:

    var isBaseUrl = require('is-base-url')

    var result = isBaseUrl('http://api.twitter.com/v1')
    /**
     *  result will look like this:
     *  {
     *   score: 1,
     *   features: {
     *     positive: {
     *       containsApiSubstring: true,
     *       containsVersionSubstring: true,
     *       endsWithVersionSubstring: true,
     *       endsWithNumber: true },
     *     negative: {
     *       hasQueryString: false,
     *       hasFragment: false,
     *       containsNonApiSubstring: false,
     *       overTwoPaths: false,
     *       endsWithFileExtension: false,
     *       containsBracket: false,
     *       isHomepage: false
     *     }
     *   }
     * }
     */

If the given parameter is not a string or not a valid url, is-base-url will return `undefined`. Otherwise, the `score` is a value ranging from -1 to 1. The more positive features are `true`, the higher the score. Reversely, the more negative features are `true`, the lower score. Thus, the higher the value, the more like the given URL is a base URL.

`isBaseUrl` will return `undefined` if 1) the given variable is not a string or 2) if the given string is not a valid URL.

License: MIT
