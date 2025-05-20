(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([[332],{

/***/ 455:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

/*
 * Notifier - the internal object responsible for delegating between the client exposed API, the
 * chain of transforms necessary to turn an item into something that can be sent to Rollbar, and the
 * queue which handles the communcation with the Rollbar API servers.
 *
 * @param queue - an object that conforms to the interface: addItem(item, callback)
 * @param options - an object representing the options to be set for this notifier, this should have
 * any defaults already set by the caller
 */
function Notifier(queue, options) {
  this.queue = queue;
  this.options = options;
  this.transforms = [];
  this.diagnostic = {};
}

/*
 * configure - updates the options for this notifier with the passed in object
 *
 * @param options - an object which gets merged with the current options set on this notifier
 * @returns this
 */
Notifier.prototype.configure = function (options) {
  this.queue && this.queue.configure(options);
  var oldOptions = this.options;
  this.options = _.merge(oldOptions, options);
  return this;
};

/*
 * addTransform - adds a transform onto the end of the queue of transforms for this notifier
 *
 * @param transform - a function which takes three arguments:
 *    * item: An Object representing the data to eventually be sent to Rollbar
 *    * options: The current value of the options for this notifier
 *    * callback: function(err: (Null|Error), item: (Null|Object)) the transform must call this
 *    callback with a null value for error if it wants the processing chain to continue, otherwise
 *    with an error to terminate the processing. The item should be the updated item after this
 *    transform is finished modifying it.
 */
Notifier.prototype.addTransform = function (transform) {
  if (_.isFunction(transform)) {
    this.transforms.push(transform);
  }
  return this;
};

/*
 * log - the internal log function which applies the configured transforms and then pushes onto the
 * queue to be sent to the backend.
 *
 * @param item - An object with the following structure:
 *    message [String] - An optional string to be sent to rollbar
 *    error [Error] - An optional error
 *
 * @param callback - A function of type function(err, resp) which will be called with exactly one
 * null argument and one non-null argument. The callback will be called once, either during the
 * transform stage if an error occurs inside a transform, or in response to the communication with
 * the backend. The second argument will be the response from the backend in case of success.
 */
Notifier.prototype.log = function (item, callback) {
  if (!callback || !_.isFunction(callback)) {
    callback = function () {};
  }

  if (!this.options.enabled) {
    return callback(new Error('Rollbar is not enabled'));
  }

  this.queue.addPendingItem(item);
  var originalError = item.err;
  this._applyTransforms(
    item,
    function (err, i) {
      if (err) {
        this.queue.removePendingItem(item);
        return callback(err, null);
      }
      this.queue.addItem(i, callback, originalError, item);
    }.bind(this),
  );
};

/* Internal */

/*
 * _applyTransforms - Applies the transforms that have been added to this notifier sequentially. See
 * `addTransform` for more information.
 *
 * @param item - An item to be transformed
 * @param callback - A function of type function(err, item) which will be called with a non-null
 * error and a null item in the case of a transform failure, or a null error and non-null item after
 * all transforms have been applied.
 */
Notifier.prototype._applyTransforms = function (item, callback) {
  var transformIndex = -1;
  var transformsLength = this.transforms.length;
  var transforms = this.transforms;
  var options = this.options;

  var cb = function (err, i) {
    if (err) {
      callback(err, null);
      return;
    }

    transformIndex++;

    if (transformIndex === transformsLength) {
      callback(null, i);
      return;
    }

    transforms[transformIndex](i, options, cb);
  };

  cb(null, item);
};

module.exports = Notifier;


/***/ }),

/***/ 622:
/***/ ((module) => {

/*
 * headers - Detect when fetch Headers are undefined and use a partial polyfill.
 *
 * A full polyfill is not used in order to keep package size as small as possible.
 * Since this is only used internally and is not added to the window object,
 * the full interface doesn't need to be supported.
 *
 * This implementation is modified from whatwg-fetch:
 * https://github.com/github/fetch
 */
function headers(headers) {
  if (typeof Headers === 'undefined') {
    return new FetchHeaders(headers);
  }

  return new Headers(headers);
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name);
  }
  return name.toLowerCase();
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value;
}

function iteratorFor(items) {
  var iterator = {
    next: function () {
      var value = items.shift();
      return { done: value === undefined, value: value };
    },
  };

  return iterator;
}

function FetchHeaders(headers) {
  this.map = {};

  if (headers instanceof FetchHeaders) {
    headers.forEach(function (value, name) {
      this.append(name, value);
    }, this);
  } else if (Array.isArray(headers)) {
    headers.forEach(function (header) {
      this.append(header[0], header[1]);
    }, this);
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function (name) {
      this.append(name, headers[name]);
    }, this);
  }
}

FetchHeaders.prototype.append = function (name, value) {
  name = normalizeName(name);
  value = normalizeValue(value);
  var oldValue = this.map[name];
  this.map[name] = oldValue ? oldValue + ', ' + value : value;
};

FetchHeaders.prototype.get = function (name) {
  name = normalizeName(name);
  return this.has(name) ? this.map[name] : null;
};

FetchHeaders.prototype.has = function (name) {
  return this.map.hasOwnProperty(normalizeName(name));
};

FetchHeaders.prototype.forEach = function (callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this);
    }
  }
};

FetchHeaders.prototype.entries = function () {
  var items = [];
  this.forEach(function (value, name) {
    items.push([name, value]);
  });
  return iteratorFor(items);
};

module.exports = headers;


/***/ }),

/***/ 1047:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);
var headers = __webpack_require__(622);
var replace = __webpack_require__(4892);
var scrub = __webpack_require__(4856);
var urlparser = __webpack_require__(5545);
var domUtil = __webpack_require__(2232);

var defaults = {
  network: true,
  networkResponseHeaders: false,
  networkResponseBody: false,
  networkRequestHeaders: false,
  networkRequestBody: false,
  networkErrorOnHttp5xx: false,
  networkErrorOnHttp4xx: false,
  networkErrorOnHttp0: false,
  log: true,
  dom: true,
  navigation: true,
  connectivity: true,
  contentSecurityPolicy: true,
  errorOnContentSecurityPolicy: false,
};

function restore(replacements, type) {
  var b;
  while (replacements[type].length) {
    b = replacements[type].shift();
    b[0][b[1]] = b[2];
  }
}

function nameFromDescription(description) {
  if (!description || !description.attributes) {
    return null;
  }
  var attrs = description.attributes;
  for (var a = 0; a < attrs.length; ++a) {
    if (attrs[a].key === 'name') {
      return attrs[a].value;
    }
  }
  return null;
}

function defaultValueScrubber(scrubFields) {
  var patterns = [];
  for (var i = 0; i < scrubFields.length; ++i) {
    patterns.push(new RegExp(scrubFields[i], 'i'));
  }
  return function (description) {
    var name = nameFromDescription(description);
    if (!name) {
      return false;
    }
    for (var i = 0; i < patterns.length; ++i) {
      if (patterns[i].test(name)) {
        return true;
      }
    }
    return false;
  };
}

function Instrumenter(options, telemeter, rollbar, _window, _document) {
  this.options = options;
  var autoInstrument = options.autoInstrument;
  if (options.enabled === false || autoInstrument === false) {
    this.autoInstrument = {};
  } else {
    if (!_.isType(autoInstrument, 'object')) {
      autoInstrument = defaults;
    }
    this.autoInstrument = _.merge(defaults, autoInstrument);
  }
  this.scrubTelemetryInputs = !!options.scrubTelemetryInputs;
  this.telemetryScrubber = options.telemetryScrubber;
  this.defaultValueScrubber = defaultValueScrubber(options.scrubFields);
  this.telemeter = telemeter;
  this.rollbar = rollbar;
  this.diagnostic = rollbar.client.notifier.diagnostic;
  this._window = _window || {};
  this._document = _document || {};
  this.replacements = {
    network: [],
    log: [],
    navigation: [],
    connectivity: [],
  };
  this.eventRemovers = {
    dom: [],
    connectivity: [],
    contentsecuritypolicy: [],
  };

  this._location = this._window.location;
  this._lastHref = this._location && this._location.href;
}

Instrumenter.prototype.configure = function (options) {
  this.options = _.merge(this.options, options);
  var autoInstrument = options.autoInstrument;
  var oldSettings = _.merge(this.autoInstrument);
  if (options.enabled === false || autoInstrument === false) {
    this.autoInstrument = {};
  } else {
    if (!_.isType(autoInstrument, 'object')) {
      autoInstrument = defaults;
    }
    this.autoInstrument = _.merge(defaults, autoInstrument);
  }
  this.instrument(oldSettings);
  if (options.scrubTelemetryInputs !== undefined) {
    this.scrubTelemetryInputs = !!options.scrubTelemetryInputs;
  }
  if (options.telemetryScrubber !== undefined) {
    this.telemetryScrubber = options.telemetryScrubber;
  }
};

// eslint-disable-next-line complexity
Instrumenter.prototype.instrument = function (oldSettings) {
  if (this.autoInstrument.network && !(oldSettings && oldSettings.network)) {
    this.instrumentNetwork();
  } else if (
    !this.autoInstrument.network &&
    oldSettings &&
    oldSettings.network
  ) {
    this.deinstrumentNetwork();
  }

  if (this.autoInstrument.log && !(oldSettings && oldSettings.log)) {
    this.instrumentConsole();
  } else if (!this.autoInstrument.log && oldSettings && oldSettings.log) {
    this.deinstrumentConsole();
  }

  if (this.autoInstrument.dom && !(oldSettings && oldSettings.dom)) {
    this.instrumentDom();
  } else if (!this.autoInstrument.dom && oldSettings && oldSettings.dom) {
    this.deinstrumentDom();
  }

  if (
    this.autoInstrument.navigation &&
    !(oldSettings && oldSettings.navigation)
  ) {
    this.instrumentNavigation();
  } else if (
    !this.autoInstrument.navigation &&
    oldSettings &&
    oldSettings.navigation
  ) {
    this.deinstrumentNavigation();
  }

  if (
    this.autoInstrument.connectivity &&
    !(oldSettings && oldSettings.connectivity)
  ) {
    this.instrumentConnectivity();
  } else if (
    !this.autoInstrument.connectivity &&
    oldSettings &&
    oldSettings.connectivity
  ) {
    this.deinstrumentConnectivity();
  }

  if (
    this.autoInstrument.contentSecurityPolicy &&
    !(oldSettings && oldSettings.contentSecurityPolicy)
  ) {
    this.instrumentContentSecurityPolicy();
  } else if (
    !this.autoInstrument.contentSecurityPolicy &&
    oldSettings &&
    oldSettings.contentSecurityPolicy
  ) {
    this.deinstrumentContentSecurityPolicy();
  }
};

Instrumenter.prototype.deinstrumentNetwork = function () {
  restore(this.replacements, 'network');
};

Instrumenter.prototype.instrumentNetwork = function () {
  var self = this;

  function wrapProp(prop, xhr) {
    if (prop in xhr && _.isFunction(xhr[prop])) {
      replace(xhr, prop, function (orig) {
        return self.rollbar.wrap(orig);
      });
    }
  }

  if ('XMLHttpRequest' in this._window) {
    var xhrp = this._window.XMLHttpRequest.prototype;
    replace(
      xhrp,
      'open',
      function (orig) {
        return function (method, url) {
          var isUrlObject = _isUrlObject(url);
          if (_.isType(url, 'string') || isUrlObject) {
            url = isUrlObject ? url.toString() : url;
            if (this.__rollbar_xhr) {
              this.__rollbar_xhr.method = method;
              this.__rollbar_xhr.url = url;
              this.__rollbar_xhr.status_code = null;
              this.__rollbar_xhr.start_time_ms = _.now();
              this.__rollbar_xhr.end_time_ms = null;
            } else {
              this.__rollbar_xhr = {
                method: method,
                url: url,
                status_code: null,
                start_time_ms: _.now(),
                end_time_ms: null,
              };
            }
          }
          return orig.apply(this, arguments);
        };
      },
      this.replacements,
      'network',
    );

    replace(
      xhrp,
      'setRequestHeader',
      function (orig) {
        return function (header, value) {
          // If xhr.open is async, __rollbar_xhr may not be initialized yet.
          if (!this.__rollbar_xhr) {
            this.__rollbar_xhr = {};
          }
          if (_.isType(header, 'string') && _.isType(value, 'string')) {
            if (self.autoInstrument.networkRequestHeaders) {
              if (!this.__rollbar_xhr.request_headers) {
                this.__rollbar_xhr.request_headers = {};
              }
              this.__rollbar_xhr.request_headers[header] = value;
            }
            // We want the content type even if request header telemetry is off.
            if (header.toLowerCase() === 'content-type') {
              this.__rollbar_xhr.request_content_type = value;
            }
          }
          return orig.apply(this, arguments);
        };
      },
      this.replacements,
      'network',
    );

    replace(
      xhrp,
      'send',
      function (orig) {
        /* eslint-disable no-unused-vars */
        return function (data) {
          /* eslint-enable no-unused-vars */
          var xhr = this;

          function onreadystatechangeHandler() {
            if (xhr.__rollbar_xhr) {
              if (xhr.__rollbar_xhr.status_code === null) {
                xhr.__rollbar_xhr.status_code = 0;
                if (self.autoInstrument.networkRequestBody) {
                  xhr.__rollbar_xhr.request = data;
                }
                xhr.__rollbar_event = self.captureNetwork(
                  xhr.__rollbar_xhr,
                  'xhr',
                  undefined,
                );
              }
              if (xhr.readyState < 2) {
                xhr.__rollbar_xhr.start_time_ms = _.now();
              }
              if (xhr.readyState > 3) {
                xhr.__rollbar_xhr.end_time_ms = _.now();

                var headers = null;
                xhr.__rollbar_xhr.response_content_type =
                  xhr.getResponseHeader('Content-Type');
                if (self.autoInstrument.networkResponseHeaders) {
                  var headersConfig =
                    self.autoInstrument.networkResponseHeaders;
                  headers = {};
                  try {
                    var header, i;
                    if (headersConfig === true) {
                      var allHeaders = xhr.getAllResponseHeaders();
                      if (allHeaders) {
                        var arr = allHeaders.trim().split(/[\r\n]+/);
                        var parts, value;
                        for (i = 0; i < arr.length; i++) {
                          parts = arr[i].split(': ');
                          header = parts.shift();
                          value = parts.join(': ');
                          headers[header] = value;
                        }
                      }
                    } else {
                      for (i = 0; i < headersConfig.length; i++) {
                        header = headersConfig[i];
                        headers[header] = xhr.getResponseHeader(header);
                      }
                    }
                  } catch (e) {
                    /* we ignore the errors here that could come from different
                     * browser issues with the xhr methods */
                  }
                }
                var body = null;
                if (self.autoInstrument.networkResponseBody) {
                  try {
                    body = xhr.responseText;
                  } catch (e) {
                    /* ignore errors from reading responseText */
                  }
                }
                var response = null;
                if (body || headers) {
                  response = {};
                  if (body) {
                    if (
                      self.isJsonContentType(
                        xhr.__rollbar_xhr.response_content_type,
                      )
                    ) {
                      response.body = self.scrubJson(body);
                    } else {
                      response.body = body;
                    }
                  }
                  if (headers) {
                    response.headers = headers;
                  }
                }
                if (response) {
                  xhr.__rollbar_xhr.response = response;
                }
                try {
                  var code = xhr.status;
                  code = code === 1223 ? 204 : code;
                  xhr.__rollbar_xhr.status_code = code;
                  xhr.__rollbar_event.level =
                    self.telemeter.levelFromStatus(code);
                  self.errorOnHttpStatus(xhr.__rollbar_xhr);
                } catch (e) {
                  /* ignore possible exception from xhr.status */
                }
              }
            }
          }

          wrapProp('onload', xhr);
          wrapProp('onerror', xhr);
          wrapProp('onprogress', xhr);

          if (
            'onreadystatechange' in xhr &&
            _.isFunction(xhr.onreadystatechange)
          ) {
            replace(xhr, 'onreadystatechange', function (orig) {
              return self.rollbar.wrap(
                orig,
                undefined,
                onreadystatechangeHandler,
              );
            });
          } else {
            xhr.onreadystatechange = onreadystatechangeHandler;
          }
          if (xhr.__rollbar_xhr && self.trackHttpErrors()) {
            xhr.__rollbar_xhr.stack = new Error().stack;
          }
          return orig.apply(this, arguments);
        };
      },
      this.replacements,
      'network',
    );
  }

  if ('fetch' in this._window) {
    replace(
      this._window,
      'fetch',
      function (orig) {
        /* eslint-disable no-unused-vars */
        return function (fn, t) {
          /* eslint-enable no-unused-vars */
          var args = new Array(arguments.length);
          for (var i = 0, len = args.length; i < len; i++) {
            args[i] = arguments[i];
          }
          var input = args[0];
          var method = 'GET';
          var url;
          var isUrlObject = _isUrlObject(input);
          if (_.isType(input, 'string') || isUrlObject) {
            url = isUrlObject ? input.toString() : input;
          } else if (input) {
            url = input.url;
            if (input.method) {
              method = input.method;
            }
          }
          if (args[1] && args[1].method) {
            method = args[1].method;
          }
          var metadata = {
            method: method,
            url: url,
            status_code: null,
            start_time_ms: _.now(),
            end_time_ms: null,
          };
          if (args[1] && args[1].headers) {
            // Argument may be a Headers object, or plain object. Ensure here that
            // we are working with a Headers object with case-insensitive keys.
            var reqHeaders = headers(args[1].headers);

            metadata.request_content_type = reqHeaders.get('Content-Type');

            if (self.autoInstrument.networkRequestHeaders) {
              metadata.request_headers = self.fetchHeaders(
                reqHeaders,
                self.autoInstrument.networkRequestHeaders,
              );
            }
          }

          if (self.autoInstrument.networkRequestBody) {
            if (args[1] && args[1].body) {
              metadata.request = args[1].body;
            } else if (
              args[0] &&
              !_.isType(args[0], 'string') &&
              args[0].body
            ) {
              metadata.request = args[0].body;
            }
          }
          self.captureNetwork(metadata, 'fetch', undefined);
          if (self.trackHttpErrors()) {
            metadata.stack = new Error().stack;
          }

          // Start our handler before returning the promise. This allows resp.clone()
          // to execute before other handlers touch the response.
          return orig.apply(this, args).then(function (resp) {
            metadata.end_time_ms = _.now();
            metadata.status_code = resp.status;
            metadata.response_content_type = resp.headers.get('Content-Type');
            var headers = null;
            if (self.autoInstrument.networkResponseHeaders) {
              headers = self.fetchHeaders(
                resp.headers,
                self.autoInstrument.networkResponseHeaders,
              );
            }
            var body = null;
            if (self.autoInstrument.networkResponseBody) {
              if (typeof resp.text === 'function') {
                // Response.text() is not implemented on some platforms
                // The response must be cloned to prevent reading (and locking) the original stream.
                // This must be done before other handlers touch the response.
                body = resp.clone().text(); //returns a Promise
              }
            }
            if (headers || body) {
              metadata.response = {};
              if (body) {
                // Test to ensure body is a Promise, which it should always be.
                if (typeof body.then === 'function') {
                  body.then(function (text) {
                    if (
                      text &&
                      self.isJsonContentType(metadata.response_content_type)
                    ) {
                      metadata.response.body = self.scrubJson(text);
                    } else {
                      metadata.response.body = text;
                    }
                  });
                } else {
                  metadata.response.body = body;
                }
              }
              if (headers) {
                metadata.response.headers = headers;
              }
            }
            self.errorOnHttpStatus(metadata);
            return resp;
          });
        };
      },
      this.replacements,
      'network',
    );
  }
};

Instrumenter.prototype.captureNetwork = function (
  metadata,
  subtype,
  rollbarUUID,
) {
  if (
    metadata.request &&
    this.isJsonContentType(metadata.request_content_type)
  ) {
    metadata.request = this.scrubJson(metadata.request);
  }
  return this.telemeter.captureNetwork(metadata, subtype, rollbarUUID);
};

Instrumenter.prototype.isJsonContentType = function (contentType) {
  return contentType &&
    _.isType(contentType, 'string') &&
    contentType.toLowerCase().includes('json')
    ? true
    : false;
};

Instrumenter.prototype.scrubJson = function (json) {
  return JSON.stringify(scrub(JSON.parse(json), this.options.scrubFields));
};

Instrumenter.prototype.fetchHeaders = function (inHeaders, headersConfig) {
  var outHeaders = {};
  try {
    var i;
    if (headersConfig === true) {
      if (typeof inHeaders.entries === 'function') {
        // Headers.entries() is not implemented in IE
        var allHeaders = inHeaders.entries();
        var currentHeader = allHeaders.next();
        while (!currentHeader.done) {
          outHeaders[currentHeader.value[0]] = currentHeader.value[1];
          currentHeader = allHeaders.next();
        }
      }
    } else {
      for (i = 0; i < headersConfig.length; i++) {
        var header = headersConfig[i];
        outHeaders[header] = inHeaders.get(header);
      }
    }
  } catch (e) {
    /* ignore probable IE errors */
  }
  return outHeaders;
};

Instrumenter.prototype.trackHttpErrors = function () {
  return (
    this.autoInstrument.networkErrorOnHttp5xx ||
    this.autoInstrument.networkErrorOnHttp4xx ||
    this.autoInstrument.networkErrorOnHttp0
  );
};

Instrumenter.prototype.errorOnHttpStatus = function (metadata) {
  var status = metadata.status_code;

  if (
    (status >= 500 && this.autoInstrument.networkErrorOnHttp5xx) ||
    (status >= 400 && this.autoInstrument.networkErrorOnHttp4xx) ||
    (status === 0 && this.autoInstrument.networkErrorOnHttp0)
  ) {
    var error = new Error('HTTP request failed with Status ' + status);
    error.stack = metadata.stack;
    this.rollbar.error(error, { skipFrames: 1 });
  }
};

Instrumenter.prototype.deinstrumentConsole = function () {
  if (!('console' in this._window && this._window.console.log)) {
    return;
  }
  var b;
  while (this.replacements['log'].length) {
    b = this.replacements['log'].shift();
    this._window.console[b[0]] = b[1];
  }
};

Instrumenter.prototype.instrumentConsole = function () {
  if (!('console' in this._window && this._window.console.log)) {
    return;
  }

  var self = this;
  var c = this._window.console;

  function wrapConsole(method) {
    'use strict'; // See https://github.com/rollbar/rollbar.js/pull/778

    var orig = c[method];
    var origConsole = c;
    var level = method === 'warn' ? 'warning' : method;
    c[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      var message = _.formatArgsAsString(args);
      self.telemeter.captureLog(message, level);
      if (orig) {
        Function.prototype.apply.call(orig, origConsole, args);
      }
    };
    self.replacements['log'].push([method, orig]);
  }
  var methods = ['debug', 'info', 'warn', 'error', 'log'];
  try {
    for (var i = 0, len = methods.length; i < len; i++) {
      wrapConsole(methods[i]);
    }
  } catch (e) {
    this.diagnostic.instrumentConsole = { error: e.message };
  }
};

Instrumenter.prototype.deinstrumentDom = function () {
  if (!('addEventListener' in this._window || 'attachEvent' in this._window)) {
    return;
  }
  this.removeListeners('dom');
};

Instrumenter.prototype.instrumentDom = function () {
  if (!('addEventListener' in this._window || 'attachEvent' in this._window)) {
    return;
  }
  var clickHandler = this.handleClick.bind(this);
  var blurHandler = this.handleBlur.bind(this);
  this.addListener('dom', this._window, 'click', 'onclick', clickHandler, true);
  this.addListener(
    'dom',
    this._window,
    'blur',
    'onfocusout',
    blurHandler,
    true,
  );
};

Instrumenter.prototype.handleClick = function (evt) {
  try {
    var e = domUtil.getElementFromEvent(evt, this._document);
    var hasTag = e && e.tagName;
    var anchorOrButton =
      domUtil.isDescribedElement(e, 'a') ||
      domUtil.isDescribedElement(e, 'button');
    if (
      hasTag &&
      (anchorOrButton ||
        domUtil.isDescribedElement(e, 'input', ['button', 'submit']))
    ) {
      this.captureDomEvent('click', e);
    } else if (domUtil.isDescribedElement(e, 'input', ['checkbox', 'radio'])) {
      this.captureDomEvent('input', e, e.value, e.checked);
    }
  } catch (exc) {
    // TODO: Not sure what to do here
  }
};

Instrumenter.prototype.handleBlur = function (evt) {
  try {
    var e = domUtil.getElementFromEvent(evt, this._document);
    if (e && e.tagName) {
      if (domUtil.isDescribedElement(e, 'textarea')) {
        this.captureDomEvent('input', e, e.value);
      } else if (
        domUtil.isDescribedElement(e, 'select') &&
        e.options &&
        e.options.length
      ) {
        this.handleSelectInputChanged(e);
      } else if (
        domUtil.isDescribedElement(e, 'input') &&
        !domUtil.isDescribedElement(e, 'input', [
          'button',
          'submit',
          'hidden',
          'checkbox',
          'radio',
        ])
      ) {
        this.captureDomEvent('input', e, e.value);
      }
    }
  } catch (exc) {
    // TODO: Not sure what to do here
  }
};

Instrumenter.prototype.handleSelectInputChanged = function (elem) {
  if (elem.multiple) {
    for (var i = 0; i < elem.options.length; i++) {
      if (elem.options[i].selected) {
        this.captureDomEvent('input', elem, elem.options[i].value);
      }
    }
  } else if (elem.selectedIndex >= 0 && elem.options[elem.selectedIndex]) {
    this.captureDomEvent('input', elem, elem.options[elem.selectedIndex].value);
  }
};

Instrumenter.prototype.captureDomEvent = function (
  subtype,
  element,
  value,
  isChecked,
) {
  if (value !== undefined) {
    if (
      this.scrubTelemetryInputs ||
      domUtil.getElementType(element) === 'password'
    ) {
      value = '[scrubbed]';
    } else {
      var description = domUtil.describeElement(element);
      if (this.telemetryScrubber) {
        if (this.telemetryScrubber(description)) {
          value = '[scrubbed]';
        }
      } else if (this.defaultValueScrubber(description)) {
        value = '[scrubbed]';
      }
    }
  }
  var elementString = domUtil.elementArrayToString(
    domUtil.treeToArray(element),
  );
  this.telemeter.captureDom(subtype, elementString, value, isChecked);
};

Instrumenter.prototype.deinstrumentNavigation = function () {
  var chrome = this._window.chrome;
  var chromePackagedApp = chrome && chrome.app && chrome.app.runtime;
  // See https://github.com/angular/angular.js/pull/13945/files
  var hasPushState =
    !chromePackagedApp &&
    this._window.history &&
    this._window.history.pushState;
  if (!hasPushState) {
    return;
  }
  restore(this.replacements, 'navigation');
};

Instrumenter.prototype.instrumentNavigation = function () {
  var chrome = this._window.chrome;
  var chromePackagedApp = chrome && chrome.app && chrome.app.runtime;
  // See https://github.com/angular/angular.js/pull/13945/files
  var hasPushState =
    !chromePackagedApp &&
    this._window.history &&
    this._window.history.pushState;
  if (!hasPushState) {
    return;
  }
  var self = this;
  replace(
    this._window,
    'onpopstate',
    function (orig) {
      return function () {
        var current = self._location.href;
        self.handleUrlChange(self._lastHref, current);
        if (orig) {
          orig.apply(this, arguments);
        }
      };
    },
    this.replacements,
    'navigation',
  );

  replace(
    this._window.history,
    'pushState',
    function (orig) {
      return function () {
        var url = arguments.length > 2 ? arguments[2] : undefined;
        if (url) {
          self.handleUrlChange(self._lastHref, url + '');
        }
        return orig.apply(this, arguments);
      };
    },
    this.replacements,
    'navigation',
  );
};

Instrumenter.prototype.handleUrlChange = function (from, to) {
  var parsedHref = urlparser.parse(this._location.href);
  var parsedTo = urlparser.parse(to);
  var parsedFrom = urlparser.parse(from);
  this._lastHref = to;
  if (
    parsedHref.protocol === parsedTo.protocol &&
    parsedHref.host === parsedTo.host
  ) {
    to = parsedTo.path + (parsedTo.hash || '');
  }
  if (
    parsedHref.protocol === parsedFrom.protocol &&
    parsedHref.host === parsedFrom.host
  ) {
    from = parsedFrom.path + (parsedFrom.hash || '');
  }
  this.telemeter.captureNavigation(from, to);
};

Instrumenter.prototype.deinstrumentConnectivity = function () {
  if (!('addEventListener' in this._window || 'body' in this._document)) {
    return;
  }
  if (this._window.addEventListener) {
    this.removeListeners('connectivity');
  } else {
    restore(this.replacements, 'connectivity');
  }
};

Instrumenter.prototype.instrumentConnectivity = function () {
  if (!('addEventListener' in this._window || 'body' in this._document)) {
    return;
  }
  if (this._window.addEventListener) {
    this.addListener(
      'connectivity',
      this._window,
      'online',
      undefined,
      function () {
        this.telemeter.captureConnectivityChange('online');
      }.bind(this),
      true,
    );
    this.addListener(
      'connectivity',
      this._window,
      'offline',
      undefined,
      function () {
        this.telemeter.captureConnectivityChange('offline');
      }.bind(this),
      true,
    );
  } else {
    var self = this;
    replace(
      this._document.body,
      'ononline',
      function (orig) {
        return function () {
          self.telemeter.captureConnectivityChange('online');
          if (orig) {
            orig.apply(this, arguments);
          }
        };
      },
      this.replacements,
      'connectivity',
    );
    replace(
      this._document.body,
      'onoffline',
      function (orig) {
        return function () {
          self.telemeter.captureConnectivityChange('offline');
          if (orig) {
            orig.apply(this, arguments);
          }
        };
      },
      this.replacements,
      'connectivity',
    );
  }
};

Instrumenter.prototype.handleCspEvent = function (cspEvent) {
  var message =
    'Security Policy Violation: ' +
    'blockedURI: ' +
    cspEvent.blockedURI +
    ', ' +
    'violatedDirective: ' +
    cspEvent.violatedDirective +
    ', ' +
    'effectiveDirective: ' +
    cspEvent.effectiveDirective +
    ', ';

  if (cspEvent.sourceFile) {
    message +=
      'location: ' +
      cspEvent.sourceFile +
      ', ' +
      'line: ' +
      cspEvent.lineNumber +
      ', ' +
      'col: ' +
      cspEvent.columnNumber +
      ', ';
  }

  message += 'originalPolicy: ' + cspEvent.originalPolicy;

  this.telemeter.captureLog(message, 'error');
  this.handleCspError(message);
};

Instrumenter.prototype.handleCspError = function (message) {
  if (this.autoInstrument.errorOnContentSecurityPolicy) {
    this.rollbar.error(message);
  }
};

Instrumenter.prototype.deinstrumentContentSecurityPolicy = function () {
  if (!('addEventListener' in this._document)) {
    return;
  }

  this.removeListeners('contentsecuritypolicy');
};

Instrumenter.prototype.instrumentContentSecurityPolicy = function () {
  if (!('addEventListener' in this._document)) {
    return;
  }

  var cspHandler = this.handleCspEvent.bind(this);
  this.addListener(
    'contentsecuritypolicy',
    this._document,
    'securitypolicyviolation',
    null,
    cspHandler,
    false,
  );
};

Instrumenter.prototype.addListener = function (
  section,
  obj,
  type,
  altType,
  handler,
  capture,
) {
  if (obj.addEventListener) {
    obj.addEventListener(type, handler, capture);
    this.eventRemovers[section].push(function () {
      obj.removeEventListener(type, handler, capture);
    });
  } else if (altType) {
    obj.attachEvent(altType, handler);
    this.eventRemovers[section].push(function () {
      obj.detachEvent(altType, handler);
    });
  }
};

Instrumenter.prototype.removeListeners = function (section) {
  var r;
  while (this.eventRemovers[section].length) {
    r = this.eventRemovers[section].shift();
    r();
  }
};

function _isUrlObject(input) {
  return typeof URL !== 'undefined' && input instanceof URL;
}

module.exports = Instrumenter;


/***/ }),

/***/ 1052:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Default tracing options
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  enabled: false,
  endpoint: 'api.rollbar.com/api/1/session/',
});


/***/ }),

/***/ 1107:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Client = __webpack_require__(3383);
var _ = __webpack_require__(1511);
var API = __webpack_require__(1263);
var logger = __webpack_require__(6604);
var globals = __webpack_require__(5292);

var Transport = __webpack_require__(2165);
var urllib = __webpack_require__(5545);

var transforms = __webpack_require__(6697);
var sharedTransforms = __webpack_require__(8608);
var predicates = __webpack_require__(9034);
var sharedPredicates = __webpack_require__(8663);
var errorParser = __webpack_require__(8874);
const recorderDefaults = __webpack_require__(6478);
const tracingDefaults = __webpack_require__(1052);
const ReplayMap = (__webpack_require__(3899)/* ["default"] */ .A);

function Rollbar(options, client) {
  this.options = _.handleOptions(defaultOptions, options, null, logger);
  this.options._configuredOptions = options;
  const Telemeter = this.components.telemeter;
  const Instrumenter = this.components.instrumenter;
  const polyfillJSON = this.components.polyfillJSON;
  this.wrapGlobals = this.components.wrapGlobals;
  this.scrub = this.components.scrub;
  const truncation = this.components.truncation;
  const Tracing = this.components.tracing;
  const Recorder = this.components.recorder;

  const transport = new Transport(truncation);
  const api = new API(this.options, transport, urllib, truncation);
  if (Telemeter) {
    this.telemeter = new Telemeter(this.options);
  }
  if (Tracing) {
    this.tracing = new Tracing(_gWindow(), this.options);
    this.tracing.initSession();
  }

  if (Recorder && _.isBrowser()) {
    const recorderOptions = this.options.recorder;
    this.recorder = new Recorder(recorderOptions);
    this.replayMap = new ReplayMap({
      recorder: this.recorder,
      api: api,
      tracing: this.tracing
    });

    if (recorderOptions.enabled && recorderOptions.autoStart) {
      this.recorder.start();
    }
  }

  this.client =
    client || new Client(this.options, api, logger, this.telemeter, this.tracing, this.replayMap, 'browser');
  var gWindow = _gWindow();
  var gDocument = typeof document != 'undefined' && document;
  this.isChrome = gWindow.chrome && gWindow.chrome.runtime; // check .runtime to avoid Edge browsers
  this.anonymousErrorsPending = 0;
  addTransformsToNotifier(this.client.notifier, this, gWindow);
  addPredicatesToQueue(this.client.queue);
  this.setupUnhandledCapture();
  if (Instrumenter) {
    this.instrumenter = new Instrumenter(
      this.options,
      this.client.telemeter,
      this,
      gWindow,
      gDocument,
    );
    this.instrumenter.instrument();
  }
  _.setupJSON(polyfillJSON);

  // Used with rollbar-react for rollbar-react-native compatibility.
  this.rollbar = this;
}

var _instance = null;
Rollbar.init = function (options, client) {
  if (_instance) {
    return _instance.global(options).configure(options);
  }
  _instance = new Rollbar(options, client);
  return _instance;
};

Rollbar.prototype.components = {};

Rollbar.setComponents = function (components) {
  Rollbar.prototype.components = components;
};

function handleUninitialized(maybeCallback) {
  var message = 'Rollbar is not initialized';
  logger.error(message);
  if (maybeCallback) {
    maybeCallback(new Error(message));
  }
}

Rollbar.prototype.global = function (options) {
  this.client.global(options);
  return this;
};
Rollbar.global = function (options) {
  if (_instance) {
    return _instance.global(options);
  } else {
    handleUninitialized();
  }
};

Rollbar.prototype.configure = function (options, payloadData) {
  var oldOptions = this.options;
  var payload = {};
  if (payloadData) {
    payload = { payload: payloadData };
  }

  this.options = _.handleOptions(oldOptions, options, payload, logger);
  this.options._configuredOptions = _.handleOptions(
    oldOptions._configuredOptions,
    options,
    payload,
  );

  this.recorder?.configure(this.options);
  this.client.configure(this.options, payloadData);
  this.instrumenter && this.instrumenter.configure(this.options);
  this.setupUnhandledCapture();
  return this;
};
Rollbar.configure = function (options, payloadData) {
  if (_instance) {
    return _instance.configure(options, payloadData);
  } else {
    handleUninitialized();
  }
};

Rollbar.prototype.lastError = function () {
  return this.client.lastError;
};
Rollbar.lastError = function () {
  if (_instance) {
    return _instance.lastError();
  } else {
    handleUninitialized();
  }
};

Rollbar.prototype.log = function () {
  var item = this._createItem(arguments);
  var uuid = item.uuid;
  this.client.log(item);
  return { uuid: uuid };
};
Rollbar.log = function () {
  if (_instance) {
    return _instance.log.apply(_instance, arguments);
  } else {
    var maybeCallback = _getFirstFunction(arguments);
    handleUninitialized(maybeCallback);
  }
};

Rollbar.prototype.debug = function () {
  var item = this._createItem(arguments);
  var uuid = item.uuid;
  this.client.debug(item);
  return { uuid: uuid };
};
Rollbar.debug = function () {
  if (_instance) {
    return _instance.debug.apply(_instance, arguments);
  } else {
    var maybeCallback = _getFirstFunction(arguments);
    handleUninitialized(maybeCallback);
  }
};

Rollbar.prototype.info = function () {
  var item = this._createItem(arguments);
  var uuid = item.uuid;
  this.client.info(item);
  return { uuid: uuid };
};
Rollbar.info = function () {
  if (_instance) {
    return _instance.info.apply(_instance, arguments);
  } else {
    var maybeCallback = _getFirstFunction(arguments);
    handleUninitialized(maybeCallback);
  }
};

Rollbar.prototype.warn = function () {
  var item = this._createItem(arguments);
  var uuid = item.uuid;
  this.client.warn(item);
  return { uuid: uuid };
};
Rollbar.warn = function () {
  if (_instance) {
    return _instance.warn.apply(_instance, arguments);
  } else {
    var maybeCallback = _getFirstFunction(arguments);
    handleUninitialized(maybeCallback);
  }
};

Rollbar.prototype.warning = function () {
  var item = this._createItem(arguments);
  var uuid = item.uuid;
  this.client.warning(item);
  return { uuid: uuid };
};
Rollbar.warning = function () {
  if (_instance) {
    return _instance.warning.apply(_instance, arguments);
  } else {
    var maybeCallback = _getFirstFunction(arguments);
    handleUninitialized(maybeCallback);
  }
};

Rollbar.prototype.error = function () {
  var item = this._createItem(arguments);
  var uuid = item.uuid;
  this.client.error(item);
  return { uuid: uuid };
};
Rollbar.error = function () {
  if (_instance) {
    return _instance.error.apply(_instance, arguments);
  } else {
    var maybeCallback = _getFirstFunction(arguments);
    handleUninitialized(maybeCallback);
  }
};

Rollbar.prototype.critical = function () {
  var item = this._createItem(arguments);
  var uuid = item.uuid;
  this.client.critical(item);
  return { uuid: uuid };
};
Rollbar.critical = function () {
  if (_instance) {
    return _instance.critical.apply(_instance, arguments);
  } else {
    var maybeCallback = _getFirstFunction(arguments);
    handleUninitialized(maybeCallback);
  }
};

Rollbar.prototype.buildJsonPayload = function (item) {
  return this.client.buildJsonPayload(item);
};
Rollbar.buildJsonPayload = function () {
  if (_instance) {
    return _instance.buildJsonPayload.apply(_instance, arguments);
  } else {
    handleUninitialized();
  }
};

Rollbar.prototype.sendJsonPayload = function (jsonPayload) {
  return this.client.sendJsonPayload(jsonPayload);
};
Rollbar.sendJsonPayload = function () {
  if (_instance) {
    return _instance.sendJsonPayload.apply(_instance, arguments);
  } else {
    handleUninitialized();
  }
};

Rollbar.prototype.setupUnhandledCapture = function () {
  var gWindow = _gWindow();

  if (!this.unhandledExceptionsInitialized) {
    if (this.options.captureUncaught || this.options.handleUncaughtExceptions) {
      globals.captureUncaughtExceptions(gWindow, this);
      if (this.wrapGlobals && this.options.wrapGlobalEventHandlers) {
        this.wrapGlobals(gWindow, this);
      }
      this.unhandledExceptionsInitialized = true;
    }
  }
  if (!this.unhandledRejectionsInitialized) {
    if (
      this.options.captureUnhandledRejections ||
      this.options.handleUnhandledRejections
    ) {
      globals.captureUnhandledRejections(gWindow, this);
      this.unhandledRejectionsInitialized = true;
    }
  }
};

Rollbar.prototype.handleUncaughtException = function (
  message,
  url,
  lineno,
  colno,
  error,
  context,
) {
  if (!this.options.captureUncaught && !this.options.handleUncaughtExceptions) {
    return;
  }

  // Chrome will always send 5+ arguments and error will be valid or null, not undefined.
  // If error is undefined, we have a different caller.
  // Chrome also sends errors from web workers with null error, but does not invoke
  // prepareStackTrace() for these. Test for empty url to skip them.
  if (
    this.options.inspectAnonymousErrors &&
    this.isChrome &&
    error === null &&
    url === ''
  ) {
    return 'anonymous';
  }

  var item;
  var stackInfo = _.makeUnhandledStackInfo(
    message,
    url,
    lineno,
    colno,
    error,
    'onerror',
    'uncaught exception',
    errorParser,
  );
  if (_.isError(error)) {
    item = this._createItem([message, error, context]);
    item._unhandledStackInfo = stackInfo;
  } else if (_.isError(url)) {
    item = this._createItem([message, url, context]);
    item._unhandledStackInfo = stackInfo;
  } else {
    item = this._createItem([message, context]);
    item.stackInfo = stackInfo;
  }
  item.level = this.options.uncaughtErrorLevel;
  item._isUncaught = true;
  this.client.log(item);
};

/**
 * Chrome only. Other browsers will ignore.
 *
 * Use Error.prepareStackTrace to extract information about errors that
 * do not have a valid error object in onerror().
 *
 * In tested version of Chrome, onerror is called first but has no way
 * to communicate with prepareStackTrace. Use a counter to let this
 * handler know which errors to send to Rollbar.
 *
 * In config options, set inspectAnonymousErrors to enable.
 */
Rollbar.prototype.handleAnonymousErrors = function () {
  if (!this.options.inspectAnonymousErrors || !this.isChrome) {
    return;
  }

  var r = this;
  function prepareStackTrace(error, _stack) {
    if (r.options.inspectAnonymousErrors) {
      if (r.anonymousErrorsPending) {
        // This is the only known way to detect that onerror saw an anonymous error.
        // It depends on onerror reliably being called before Error.prepareStackTrace,
        // which so far holds true on tested versions of Chrome. If versions of Chrome
        // are tested that behave differently, this logic will need to be updated
        // accordingly.
        r.anonymousErrorsPending -= 1;

        if (!error) {
          // Not likely to get here, but calling handleUncaughtException from here
          // without an error object would throw off the anonymousErrorsPending counter,
          // so return now.
          return;
        }

        // Allow this to be tracked later.
        error._isAnonymous = true;

        // url, lineno, colno shouldn't be needed for these errors.
        // If that changes, update this accordingly, using the unused
        // _stack param as needed (rather than parse error.toString()).
        r.handleUncaughtException(error.message, null, null, null, error);
      }
    }

    // Workaround to ensure stack is preserved for normal errors.
    return error.stack;
  }

  // https://v8.dev/docs/stack-trace-api
  try {
    Error.prepareStackTrace = prepareStackTrace;
  } catch (e) {
    this.options.inspectAnonymousErrors = false;
    this.error('anonymous error handler failed', e);
  }
};

Rollbar.prototype.handleUnhandledRejection = function (reason, promise) {
  if (
    !this.options.captureUnhandledRejections &&
    !this.options.handleUnhandledRejections
  ) {
    return;
  }

  var message = 'unhandled rejection was null or undefined!';
  if (reason) {
    if (reason.message) {
      message = reason.message;
    } else {
      var reasonResult = _.stringify(reason);
      if (reasonResult.value) {
        message = reasonResult.value;
      }
    }
  }
  var context =
    (reason && reason._rollbarContext) || (promise && promise._rollbarContext);

  var item;
  if (_.isError(reason)) {
    item = this._createItem([message, reason, context]);
  } else {
    item = this._createItem([message, reason, context]);
    item.stackInfo = _.makeUnhandledStackInfo(
      message,
      '',
      0,
      0,
      null,
      'unhandledrejection',
      '',
      errorParser,
    );
  }
  item.level = this.options.uncaughtErrorLevel;
  item._isUncaught = true;
  item._originalArgs = item._originalArgs || [];
  item._originalArgs.push(promise);
  this.client.log(item);
};

Rollbar.prototype.wrap = function (f, context, _before) {
  try {
    var ctxFn;
    if (_.isFunction(context)) {
      ctxFn = context;
    } else {
      ctxFn = function () {
        return context || {};
      };
    }

    if (!_.isFunction(f)) {
      return f;
    }

    if (f._isWrap) {
      return f;
    }

    if (!f._rollbar_wrapped) {
      f._rollbar_wrapped = function () {
        if (_before && _.isFunction(_before)) {
          _before.apply(this, arguments);
        }
        try {
          return f.apply(this, arguments);
        } catch (exc) {
          var e = exc;
          if (e && window._rollbarWrappedError !== e) {
            if (_.isType(e, 'string')) {
              e = new String(e);
            }
            e._rollbarContext = ctxFn() || {};
            e._rollbarContext._wrappedSource = f.toString();

            window._rollbarWrappedError = e;
          }
          throw e;
        }
      };

      f._rollbar_wrapped._isWrap = true;

      if (f.hasOwnProperty) {
        for (var prop in f) {
          if (f.hasOwnProperty(prop) && prop !== '_rollbar_wrapped') {
            f._rollbar_wrapped[prop] = f[prop];
          }
        }
      }
    }

    return f._rollbar_wrapped;
  } catch (e) {
    // Return the original function if the wrap fails.
    return f;
  }
};
Rollbar.wrap = function (f, context) {
  if (_instance) {
    return _instance.wrap(f, context);
  } else {
    handleUninitialized();
  }
};

Rollbar.prototype.captureEvent = function () {
  var event = _.createTelemetryEvent(arguments);
  return this.client.captureEvent(event.type, event.metadata, event.level);
};
Rollbar.captureEvent = function () {
  if (_instance) {
    return _instance.captureEvent.apply(_instance, arguments);
  } else {
    handleUninitialized();
  }
};

// The following two methods are used internally and are not meant for public use
Rollbar.prototype.captureDomContentLoaded = function (e, ts) {
  if (!ts) {
    ts = new Date();
  }
  return this.client.captureDomContentLoaded(ts);
};

Rollbar.prototype.captureLoad = function (e, ts) {
  if (!ts) {
    ts = new Date();
  }
  return this.client.captureLoad(ts);
};

/* Internal */

function addTransformsToNotifier(notifier, rollbar, gWindow) {
  notifier
    .addTransform(transforms.handleDomException)
    .addTransform(transforms.handleItemWithError)
    .addTransform(transforms.ensureItemHasSomethingToSay)
    .addTransform(transforms.addBaseInfo)
    .addTransform(transforms.addRequestInfo(gWindow))
    .addTransform(transforms.addClientInfo(gWindow))
    .addTransform(transforms.addPluginInfo(gWindow))
    .addTransform(transforms.addBody)
    .addTransform(sharedTransforms.addMessageWithError)
    .addTransform(sharedTransforms.addTelemetryData)
    .addTransform(sharedTransforms.addConfigToPayload)
    .addTransform(transforms.addScrubber(rollbar.scrub))
    .addTransform(sharedTransforms.addPayloadOptions)
    .addTransform(sharedTransforms.userTransform(logger))
    .addTransform(sharedTransforms.addConfiguredOptions)
    .addTransform(sharedTransforms.addDiagnosticKeys)
    .addTransform(sharedTransforms.itemToPayload);
}

function addPredicatesToQueue(queue) {
  queue
    .addPredicate(sharedPredicates.checkLevel)
    .addPredicate(predicates.checkIgnore)
    .addPredicate(sharedPredicates.userCheckIgnore(logger))
    .addPredicate(sharedPredicates.urlIsNotBlockListed(logger))
    .addPredicate(sharedPredicates.urlIsSafeListed(logger))
    .addPredicate(sharedPredicates.messageIsIgnored(logger));
}

Rollbar.prototype.loadFull = function () {
  logger.info(
    'Unexpected Rollbar.loadFull() called on a Notifier instance. This can happen when Rollbar is loaded multiple times.',
  );
};

Rollbar.prototype._createItem = function (args) {
  return _.createItem(args, logger, this);
};

function _getFirstFunction(args) {
  for (var i = 0, len = args.length; i < len; ++i) {
    if (_.isFunction(args[i])) {
      return args[i];
    }
  }
  return undefined;
}

function _gWindow() {
  return (
    (typeof window != 'undefined' && window) ||
    (typeof self != 'undefined' && self)
  );
}

var defaults = __webpack_require__(8435);
var scrubFields = __webpack_require__(5927);

var defaultOptions = {
  version: defaults.version,
  scrubFields: scrubFields.scrubFields,
  logLevel: defaults.logLevel,
  reportLevel: defaults.reportLevel,
  uncaughtErrorLevel: defaults.uncaughtErrorLevel,
  endpoint: defaults.endpoint,
  verbose: false,
  enabled: true,
  transmit: true,
  sendConfig: false,
  includeItemsInTelemetry: true,
  captureIp: true,
  inspectAnonymousErrors: true,
  ignoreDuplicateErrors: true,
  wrapGlobalEventHandlers: false,
  recorder: recorderDefaults,
  tracing: tracingDefaults,
};

module.exports = Rollbar;


/***/ }),

/***/ 1220:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

var MAX_EVENTS = 100;

function Telemeter(options) {
  this.queue = [];
  this.options = _.merge(options);
  var maxTelemetryEvents = this.options.maxTelemetryEvents || MAX_EVENTS;
  this.maxQueueSize = Math.max(0, Math.min(maxTelemetryEvents, MAX_EVENTS));
}

Telemeter.prototype.configure = function (options) {
  var oldOptions = this.options;
  this.options = _.merge(oldOptions, options);
  var maxTelemetryEvents = this.options.maxTelemetryEvents || MAX_EVENTS;
  var newMaxEvents = Math.max(0, Math.min(maxTelemetryEvents, MAX_EVENTS));
  var deleteCount = 0;
  if (this.queue.length > newMaxEvents) {
    deleteCount = this.queue.length - newMaxEvents;
  }
  this.maxQueueSize = newMaxEvents;
  this.queue.splice(0, deleteCount);
};

Telemeter.prototype.copyEvents = function () {
  var events = Array.prototype.slice.call(this.queue, 0);
  if (_.isFunction(this.options.filterTelemetry)) {
    try {
      var i = events.length;
      while (i--) {
        if (this.options.filterTelemetry(events[i])) {
          events.splice(i, 1);
        }
      }
    } catch (e) {
      this.options.filterTelemetry = null;
    }
  }
  return events;
};

Telemeter.prototype.capture = function (
  type,
  metadata,
  level,
  rollbarUUID,
  timestamp,
) {
  var e = {
    level: getLevel(type, level),
    type: type,
    timestamp_ms: timestamp || _.now(),
    body: metadata,
    source: 'client',
  };
  if (rollbarUUID) {
    e.uuid = rollbarUUID;
  }

  try {
    if (
      _.isFunction(this.options.filterTelemetry) &&
      this.options.filterTelemetry(e)
    ) {
      return false;
    }
  } catch (exc) {
    this.options.filterTelemetry = null;
  }

  this.push(e);
  return e;
};

Telemeter.prototype.captureEvent = function (
  type,
  metadata,
  level,
  rollbarUUID,
) {
  return this.capture(type, metadata, level, rollbarUUID);
};

Telemeter.prototype.captureError = function (
  err,
  level,
  rollbarUUID,
  timestamp,
) {
  var metadata = {
    message: err.message || String(err),
  };
  if (err.stack) {
    metadata.stack = err.stack;
  }
  return this.capture('error', metadata, level, rollbarUUID, timestamp);
};

Telemeter.prototype.captureLog = function (
  message,
  level,
  rollbarUUID,
  timestamp,
) {
  return this.capture(
    'log',
    {
      message: message,
    },
    level,
    rollbarUUID,
    timestamp,
  );
};

Telemeter.prototype.captureNetwork = function (
  metadata,
  subtype,
  rollbarUUID,
  requestData,
) {
  subtype = subtype || 'xhr';
  metadata.subtype = metadata.subtype || subtype;
  if (requestData) {
    metadata.request = requestData;
  }
  var level = this.levelFromStatus(metadata.status_code);
  return this.capture('network', metadata, level, rollbarUUID);
};

Telemeter.prototype.levelFromStatus = function (statusCode) {
  if (statusCode >= 200 && statusCode < 400) {
    return 'info';
  }
  if (statusCode === 0 || statusCode >= 400) {
    return 'error';
  }
  return 'info';
};

Telemeter.prototype.captureDom = function (
  subtype,
  element,
  value,
  checked,
  rollbarUUID,
) {
  var metadata = {
    subtype: subtype,
    element: element,
  };
  if (value !== undefined) {
    metadata.value = value;
  }
  if (checked !== undefined) {
    metadata.checked = checked;
  }
  return this.capture('dom', metadata, 'info', rollbarUUID);
};

Telemeter.prototype.captureNavigation = function (from, to, rollbarUUID) {
  return this.capture(
    'navigation',
    { from: from, to: to },
    'info',
    rollbarUUID,
  );
};

Telemeter.prototype.captureDomContentLoaded = function (ts) {
  return this.capture(
    'navigation',
    { subtype: 'DOMContentLoaded' },
    'info',
    undefined,
    ts && ts.getTime(),
  );
  /**
   * If we decide to make this a dom event instead, then use the line below:
  return this.capture('dom', {subtype: 'DOMContentLoaded'}, 'info', undefined, ts && ts.getTime());
  */
};
Telemeter.prototype.captureLoad = function (ts) {
  return this.capture(
    'navigation',
    { subtype: 'load' },
    'info',
    undefined,
    ts && ts.getTime(),
  );
  /**
   * If we decide to make this a dom event instead, then use the line below:
  return this.capture('dom', {subtype: 'load'}, 'info', undefined, ts && ts.getTime());
  */
};

Telemeter.prototype.captureConnectivityChange = function (type, rollbarUUID) {
  return this.captureNetwork({ change: type }, 'connectivity', rollbarUUID);
};

// Only intended to be used internally by the notifier
Telemeter.prototype._captureRollbarItem = function (item) {
  if (!this.options.includeItemsInTelemetry) {
    return;
  }
  if (item.err) {
    return this.captureError(item.err, item.level, item.uuid, item.timestamp);
  }
  if (item.message) {
    return this.captureLog(item.message, item.level, item.uuid, item.timestamp);
  }
  if (item.custom) {
    return this.capture(
      'log',
      item.custom,
      item.level,
      item.uuid,
      item.timestamp,
    );
  }
};

Telemeter.prototype.push = function (e) {
  this.queue.push(e);
  if (this.queue.length > this.maxQueueSize) {
    this.queue.shift();
  }
};

function getLevel(type, level) {
  if (level) {
    return level;
  }
  var defaultLevel = {
    error: 'error',
    manual: 'info',
  };
  return defaultLevel[type] || 'info';
}

module.exports = Telemeter;


/***/ }),

/***/ 1263:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);
var helpers = __webpack_require__(8177);

var defaultOptions = {
  hostname: 'api.rollbar.com',
  path: '/api/1/item/',
  search: null,
  version: '1',
  protocol: 'https:',
  port: 443,
};

var OTLPDefaultOptions = {
  hostname: 'api.rollbar.com',
  path: '/api/1/session/',
  search: null,
  version: '1',
  protocol: 'https:',
  port: 443,
};

/**
 * Api is an object that encapsulates methods of communicating with
 * the Rollbar API.  It is a standard interface with some parts implemented
 * differently for server or browser contexts.  It is an object that should
 * be instantiated when used so it can contain non-global options that may
 * be different for another instance of RollbarApi.
 *
 * @param options {
 *    accessToken: the accessToken to use for posting items to rollbar
 *    endpoint: an alternative endpoint to send errors to
 *        must be a valid, fully qualified URL.
 *        The default is: https://api.rollbar.com/api/1/item
 *    proxy: if you wish to proxy requests provide an object
 *        with the following keys:
 *          host or hostname (required): foo.example.com
 *          port (optional): 123
 *          protocol (optional): https
 * }
 */
function Api(options, transport, urllib, truncation) {
  this.options = options;
  this.transport = transport;
  this.url = urllib;
  this.truncation = truncation;
  this.accessToken = options.accessToken;
  this.transportOptions = _getTransport(options, urllib);
  this.OTLPTransportOptions = _getOTLPTransport(options, urllib);
}

/**
 * Wraps transport.post in a Promise to support async/await
 *
 * @param {Object} options - Options for the API request
 * @param {string} options.accessToken - The access token for authentication
 * @param {Object} options.transportOptions - Options for the transport
 * @param {Object} options.payload - The data payload to send
 * @returns {Promise} A promise that resolves with the response or rejects with an error
 * @private
 */
Api.prototype._postPromise = function({ accessToken, transportOptions, payload }) {
  const self = this;
  return new Promise((resolve, reject) => {
    self.transport.post(accessToken, transportOptions, payload, (err, resp) =>
      err ? reject(err) : resolve(resp)
    );
  });
};

/**
 *
 * @param data
 * @param callback
 */
Api.prototype.postItem = function (data, callback) {
  var transportOptions = helpers.transportOptions(
    this.transportOptions,
    'POST',
  );
  var payload = helpers.buildPayload(data);
  var self = this;

  // ensure the network request is scheduled after the current tick.
  setTimeout(function () {
    self.transport.post(self.accessToken, transportOptions, payload, callback);
  }, 0);
};

/**
 * Posts spans to the Rollbar API using the session endpoint
 *
 * @param {Array} payload - The spans to send
 * @returns {Promise<Object>} A promise that resolves with the API response
 */
Api.prototype.postSpans = async function (payload) {
  const transportOptions = helpers.transportOptions(
    this.OTLPTransportOptions,
    'POST',
  );

  return await this._postPromise({
    accessToken: this.accessToken,
    transportOptions,
    payload
  });
};

/**
 *
 * @param data
 * @param callback
 */
Api.prototype.buildJsonPayload = function (data, callback) {
  var payload = helpers.buildPayload(data);

  var stringifyResult;
  if (this.truncation) {
    stringifyResult = this.truncation.truncate(payload);
  } else {
    stringifyResult = _.stringify(payload);
  }

  if (stringifyResult.error) {
    if (callback) {
      callback(stringifyResult.error);
    }
    return null;
  }

  return stringifyResult.value;
};

/**
 *
 * @param jsonPayload
 * @param callback
 */
Api.prototype.postJsonPayload = function (jsonPayload, callback) {
  var transportOptions = helpers.transportOptions(
    this.transportOptions,
    'POST',
  );
  this.transport.postJsonPayload(
    this.accessToken,
    transportOptions,
    jsonPayload,
    callback,
  );
};

Api.prototype.configure = function (options) {
  var oldOptions = this.oldOptions;
  this.options = _.merge(oldOptions, options);
  this.transportOptions = _getTransport(this.options, this.url);
  this.OTLPTransportOptions = _getOTLPTransport(this.options, this.url);
  if (this.options.accessToken !== undefined) {
    this.accessToken = this.options.accessToken;
  }
  return this;
};

function _getTransport(options, url) {
  return helpers.getTransportFromOptions(options, defaultOptions, url);
}

function _getOTLPTransport(options, url) {
  options = {...options, endpoint: options.tracing?.endpoint};
  return helpers.getTransportFromOptions(options, OTLPDefaultOptions, url);
}

module.exports = Api;


/***/ }),

/***/ 1318:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Recorder)
/* harmony export */ });
/* harmony import */ var _rrweb_record__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2336);
/* harmony import */ var _rrweb_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3058);
/* harmony import */ var _tracing_hrtime_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3521);





class Recorder {
  #options;
  #stopFn = null;
  #recordFn;
  #events = {
    previous: [],
    current: [],
  };

  /**
   * Creates a new Recorder instance for capturing DOM events
   *
   * @param {Object} options - Configuration options for the recorder
   * @param {Function} [recordFn=rrwebRecordFn] - The recording function to use
   */
  constructor(options, recordFn = _rrweb_record__WEBPACK_IMPORTED_MODULE_0__/* .record */ .g) {
    if (!recordFn) {
      throw new TypeError("Expected 'recordFn' to be provided");
    }

    console.log('Recorder: Initializing...');
    console.log('options', options);

    this.#options = options ?? {};
    this.#recordFn = recordFn;
  }

  get isRecording() {
    return this.#stopFn !== null;
  }

  get options() {
    return this.#options;
  }

  set options(newOptions) {
    this.configure(newOptions);
  }

  configure(newOptions) {
    if (this.isRecording && newOptions.enabled === false) {
      this.stop();
    }

    this.#options = newOptions;
  }

  /**
   * Converts recorded events into a formatted payload ready for transport.
   *
   * This method takes the recorder's stored events, creates a new span with the
   * provided tracing context, attaches all events with their timestamps as span
   * events, and then returns a payload ready for transport to the server.
   *
   * @param {Object} tracing - The tracing system instance to create spans
   * @param {string} replayId - Unique identifier to associate with this replay recording
   * @returns {Object|null} A formatted payload containing spans data in OTLP format, or null if no events exist
   */
  dump(tracing, replayId, occurrenceUuid) {
    const events = this.#events.previous.concat(this.#events.current);

    if (events.length === 0) {
      console.warn('Recorder.dump: No events to dump');
      return null;
    }

    console.log(`Recorder.dump: Dumping ${events.length} events`);

    const recordingSpan = tracing.startSpan('rrweb-replay-recording', {});

    recordingSpan.setAttribute('rollbar.replay.id', replayId);

    if (occurrenceUuid) {
      recordingSpan.setAttribute('rollbar.occurrence.uuid', occurrenceUuid);
    }

    const earliestEvent = events.reduce((earliestEvent, event) =>
      event.timestamp < earliestEvent.timestamp ? event : earliestEvent,
    );

    recordingSpan.span.startTime = _tracing_hrtime_js__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .A.fromMillis(earliestEvent.timestamp);

    for (const event of events) {
      recordingSpan.addEvent(
        'rrweb-replay-events',
        {
          eventType: event.type,
          json: JSON.stringify(event.data),
          'rollbar.replay.id': replayId,
        },
        _tracing_hrtime_js__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .A.fromMillis(event.timestamp),
      );
    }

    recordingSpan.end();

    return tracing.exporter.toPayload();
  }

  start() {
    if (this.isRecording || this.options.enabled === false) {
      if (this.isRecording) {
        console.log('Recorder: Already started');
      } else {
        console.log('Recorder: Disabled');
      }
      return;
    }

    console.log('Recorder: Starting...');

    this.clear();

    this.#stopFn = this.#recordFn({
      emit: (event, isCheckout) => {
        if (this.options.debug?.logEmits) {
          this._logEvent(event, isCheckout);
        }

        if (isCheckout && event.type === _rrweb_types__WEBPACK_IMPORTED_MODULE_1__/* .EventType */ .Bx.Meta) {
          this.#events.previous = this.#events.current;
          this.#events.current = [];
        }

        this.#events.current.push(event);
      },
      checkoutEveryNms: 5 * 60 * 1000, // 5 minutes
      ...this.options,
    });

    console.log('Recorder: Started');

    return this;
  }

  stop() {
    if (!this.isRecording) {
      console.log('Recorder: Already stopped');
      return;
    }

    console.log('Recorder: Stopping...');

    this.#stopFn();
    this.#stopFn = null;

    console.log('Recorder: Stopped');

    return this;
  }

  clear() {
    this.#events = {
      previous: [],
      current: [],
    };
  }

  _logEvent(event, isCheckout) {
    console.log(
      `Recorder: ${isCheckout ? 'checkout' : ''} event\n`,
      ((e) => {
        const seen = new WeakSet();
        return JSON.stringify(
          e,
          (_, v) => {
            if (typeof v === 'object' && v !== null) {
              if (seen.has(v)) return '[Circular]';
              seen.add(v);
            }
            return v;
          },
          2,
        );
      })(event),
    );
  }
}


/***/ }),

/***/ 1401:
/***/ ((module) => {

// extracted by mini-css-extract-plugin
module.exports = {"container":"Home_container__d256j","title":"Home_title__hYX6j","description":"Home_description__uXNdx","grid":"Home_grid__AVljO","card":"Home_card__E5spL","logo":"Home_logo__IOQAX","errorButtons":"Home_errorButtons__2_on5","errorButton":"Home_errorButton___tfiN"};

/***/ }),

/***/ 1441:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ Tracing)
});

;// ../../rollbar/rollbar-js/src/tracing/context.js
class Context {
  constructor(parentContext) {
    this._currentContext = parentContext ? new Map(parentContext) : new Map();
  }

  getValue(key) {
    return this._currentContext.get(key);
  }

  setValue (key, value) {
    const context = new Context(this._currentContext);
    context._currentContext.set(key, value);
    return context;
  }

  deleteValue(key) {
    const context = new Context(self._currentContext);
    context._currentContext.delete(key);
    return context;
  }
}

const ROOT_CONTEXT = new Context();


;// ../../rollbar/rollbar-js/src/tracing/contextManager.js


class ContextManager {
  constructor() {
    this.currentContext = ROOT_CONTEXT;
  }

  active() {
    return this.currentContext;
  }

  enterContext(context) {
    const previousContext = this.currentContext;
    this.currentContext = context || ROOT_CONTEXT;
    return previousContext;
  }

  exitContext(context) {
    this.currentContext = context;
    return this.currentContext;
  }

  with(context, fn, thisArg, ...args) {
    const previousContext = this.enterContext(context);
    try {
      return fn.call(thisArg, ...args);
    } finally {
      this.exitContext(previousContext);
    }
  }
}

function createContextKey(key) {
  // Use Symbol for OpenTelemetry compatibility.
  return Symbol.for(key);
}


// EXTERNAL MODULE: ../../rollbar/rollbar-js/src/tracing/id.js
var id = __webpack_require__(4583);
;// ../../rollbar/rollbar-js/src/tracing/session.js


const SESSION_KEY = 'RollbarSession';

class Session {
  constructor(tracing, options) {
    this.options = options;
    this.tracing = tracing;
    this.window = tracing.window;
    this.session = null;
  }

  init() {
    if (this.session) {
      return this;
    }
    return this.getSession() || this.createSession();
  }

  getSession() {
    try {
      const serializedSession = this.window.sessionStorage.getItem(SESSION_KEY);

      if (!serializedSession) {
        return null;
      }

      this.session = JSON.parse(serializedSession);
    } catch {
      return null;
    }
    return this;
  }

  createSession() {
    this.session = {
      id: id/* default */.A.gen(),
      createdAt: Date.now(),
    };

    return this.setSession(this.session);
  }

  setSession(session) {
    const sessionString = JSON.stringify(session);

    try {
      this.window.sessionStorage.setItem(SESSION_KEY, sessionString);
    } catch {
      return null;
    }
    return this;
  }
}


// EXTERNAL MODULE: ../../rollbar/rollbar-js/src/tracing/hrtime.js
var hrtime = __webpack_require__(3521);
;// ../../rollbar/rollbar-js/src/tracing/exporter.js


/**
 * SpanExporter is responsible for exporting ReadableSpan objects
 * and transforming them into the OTLP-compatible format.
 */
class SpanExporter {
  /**
   * Export spans to the span export queue
   *
   * @param {Array} spans - Array of ReadableSpan objects to export
   * @param {Function} _resultCallback - Optional callback (not used)
   */
  export(spans, _resultCallback) {
    console.log(spans); // console exporter, TODO: make optional
    spanExportQueue.push(...spans);
  }

  /**
   * Transforms an array of ReadableSpan objects into the OTLP format payload
   * compatible with the Rollbar API. This follows the OpenTelemetry protocol
   * specification for traces.
   *
   * @returns {Object} OTLP format payload for API transmission
   */
  toPayload() {
    const spans = spanExportQueue.slice();
    spanExportQueue.length = 0;

    if (!spans || !spans.length) {
      return { resourceSpans: [] };
    }

    const resource = (spans[0] && spans[0].resource) || {};

    const scopeMap = new Map();

    for (const span of spans) {
      const scopeKey = span.instrumentationScope
        ? `${span.instrumentationScope.name}:${span.instrumentationScope.version}`
        : 'default:1.0.0';

      if (!scopeMap.has(scopeKey)) {
        scopeMap.set(scopeKey, {
          scope: span.instrumentationScope || {
            name: 'default',
            version: '1.0.0',
            attributes: [],
          },
          spans: [],
        });
      }

      scopeMap.get(scopeKey).spans.push(this._transformSpan(span));
    }

    return {
      resourceSpans: [
        {
          resource: this._transformResource(resource),
          scopeSpans: Array.from(scopeMap.values()).map((scopeData) => ({
            scope: this._transformInstrumentationScope(scopeData.scope),
            spans: scopeData.spans,
          })),
        },
      ],
    };
  }

  /**
   * Transforms a ReadableSpan into the OTLP Span format
   *
   * @private
   * @param {Object} span - ReadableSpan object to transform
   * @returns {Object} OTLP Span format
   */
  _transformSpan(span) {
    const transformAttributes = (attributes) => {
      return Object.entries(attributes || {}).map(([key, value]) => ({
        key,
        value: this._transformAnyValue(value),
      }));
    };

    const transformEvents = (events) => {
      return (events || []).map((event) => ({
        timeUnixNano: hrtime/* default */.A.toNanos(event.time),
        name: event.name,
        attributes: transformAttributes(event.attributes),
      }));
    };

    return {
      traceId: span.spanContext.traceId,
      spanId: span.spanContext.spanId,
      parentSpanId: span.parentSpanId || '',
      name: span.name,
      kind: span.kind || 1, // INTERNAL by default
      startTimeUnixNano: hrtime/* default */.A.toNanos(span.startTime),
      endTimeUnixNano: hrtime/* default */.A.toNanos(span.endTime),
      attributes: transformAttributes(span.attributes),
      events: transformEvents(span.events),
    };
  }

  /**
   * Transforms a resource object into OTLP Resource format
   *
   * @private
   * @param {Object} resource - Resource information
   * @returns {Object} OTLP Resource format
   */
  _transformResource(resource) {
    const attributes = resource.attributes || {};
    const keyValues = Object.entries(attributes).map(([key, value]) => ({
      key,
      value: this._transformAnyValue(value),
    }));

    return {
      attributes: keyValues,
    };
  }

  /**
   * Transforms an instrumentation scope into OTLP InstrumentationScope format
   *
   * @private
   * @param {Object} scope - Instrumentation scope information
   * @returns {Object} OTLP InstrumentationScope format
   */
  _transformInstrumentationScope(scope) {
    return {
      name: scope.name || '',
      version: scope.version || '',
      attributes: (scope.attributes || []).map((attr) => ({
        key: attr.key,
        value: this._transformAnyValue(attr.value),
      })),
    };
  }

  /**
   * Transforms a JavaScript value into an OTLP AnyValue
   *
   * @private
   * @param {any} value - Value to transform
   * @returns {Object} OTLP AnyValue format
   */
  _transformAnyValue(value) {
    if (value === null || value === undefined) {
      return { stringValue: '' };
    }

    const type = typeof value;

    if (type === 'string') {
      return { stringValue: value };
    } else if (type === 'number') {
      if (Number.isInteger(value)) {
        return { intValue: value.toString() };
      } else {
        return { doubleValue: value };
      }
    } else if (type === 'boolean') {
      return { boolValue: value };
    } else if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map((v) => this._transformAnyValue(v)),
        },
      };
    } else if (type === 'object') {
      return {
        kvlistValue: {
          values: Object.entries(value).map(([k, v]) => ({
            key: k,
            value: this._transformAnyValue(v),
          })),
        },
      };
    }

    return { stringValue: String(value) };
  }
}

const spanExportQueue = [];

;// ../../rollbar/rollbar-js/src/tracing/spanProcessor.js
class SpanProcessor {
  constructor(exporter) {
    this.exporter = exporter;
    this.pendingSpans = new Map()
  }

  onStart(span, _parentContext) {
    this.pendingSpans.set(span.span.spanContext.spanId, span);
  }

  onEnd(span) {
    this.exporter.export([span.export()])
    this.pendingSpans.delete(span.span.spanContext.spanId);
  }
}

;// ../../rollbar/rollbar-js/src/tracing/span.js


class Span {
  constructor(options) {
    this.initReadableSpan(options);

    this.spanProcessor = options.spanProcessor;
    this.spanProcessor.onStart(this, options.context);

    if (options.attributes) {
      this.setAttributes(options.attributes);
    }
    return this;
  }

  initReadableSpan(options) {
    this.span = {
      name: options.name,
      kind: options.kind,
      spanContext: options.spanContext,
      parentSpanId: options.parentSpanId,
      startTime: options.startTime || hrtime/* default */.A.now(),
      endTime: [0, 0],
      status: { code: 0, message: '' },
      attributes: { 'session.id': options.session.id },
      links: [],
      events: [],
      duration: 0,
      ended: false,
      resource: options.resource,
      instrumentationScope: options.scope,
      droppedAttributesCount: 0,
      droppedEventsCount: 0,
      droppedLinksCount: 0,
    };
  }

  spanContext() {
    return this.span.spanContext;
  }

  get spanId() {
    return this.span.spanContext.spanId;
  }

  get traceId() {
    return this.span.spanContext.traceId;
  }

  setAttribute(key, value) {
    if (value == null || this.ended) return this;
    if (key.length === 0) return this;

    this.span.attributes[key] = value;
    return this;
  }

  setAttributes(attributes) {
    for (const [k, v] of Object.entries(attributes)) {
      this.setAttribute(k, v);
    }
    return this;
  }

  addEvent(name, attributes = {}, time) {
    if (this.span.ended) return this;

    this.span.events.push({
      name,
      attributes,
      time: time || hrtime/* default */.A.now(),
      droppedAttributesCount: 0,
    });

    return this;
  }

  isRecording() {
    return this.span.ended === false;
  }

  end(attributes, time) {
    if (attributes) this.setAttributes(attributes);
    this.span.endTime = time || hrtime/* default */.A.now();
    this.span.ended = true;
    this.spanProcessor.onEnd(this);
  }

  export() {
    return this.span;
  }
}

;// ../../rollbar/rollbar-js/src/tracing/tracer.js



class Tracer {
  constructor(tracing, spanProcessor) {
    this.spanProcessor = spanProcessor;
    this.tracing = tracing;
  }

  startSpan(
    name,
    options = {},
    context = this.tracing.contextManager.active()
  ) {
    const parentSpan = this.tracing.getSpan(context);
    const parentSpanContext = parentSpan?.spanContext();
    const spanId = id/* default */.A.gen(8);
    let traceId;
    let traceFlags = 0;
    let traceState = null;
    let parentSpanId;
    if (parentSpanContext) {
      traceId = parentSpanContext.traceId;
      traceState = parentSpanContext.traceState;
      parentSpanId = parentSpanContext.spanId;
    } else {
      traceId = id/* default */.A.gen(16);
    }

    const kind = 0;
    const spanContext = { traceId, spanId, traceFlags, traceState };

    const span = new Span({
      resource: this.tracing.resource,
      scope: this.tracing.scope,
      session: this.tracing.session.session,
      context,
      spanContext,
      name,
      kind,
      parentSpanId,
      spanProcessor: this.spanProcessor,
    });
    return span;
  }
}

;// ../../rollbar/rollbar-js/src/tracing/tracing.js






const SPAN_KEY = createContextKey('Rollbar Context Key SPAN');

class Tracing {
  constructor(gWindow, options) {
    this.options = options;
    this.window = gWindow;

    this.session = new Session(this, options);
    this.createTracer();
  }

  initSession() {
    if (this.session) {
      this.session.init();
    }
  }

  get sessionId() {
    if (this.session) {
      return this.session.session.id;
    }
    return null;
  }

  get resource() {
    return {
      attributes: {
        ...(this.options.resource || {}),
        'rollbar.environment': this.options.environment,
      }
    };
  }

  get scope() {
    return {
      name: 'rollbar-browser-js',
      version: this.options.version,
    };
  }

  createTracer() {
    this.contextManager = new ContextManager();
    this.exporter = new SpanExporter();
    this.spanProcessor = new SpanProcessor(this.exporter);
    this.tracer = new Tracer(this, this.spanProcessor);
  }

  getTracer() {
    return this.tracer;
  }

  getSpan(context = this.contextManager.active()) {
    return context.getValue(SPAN_KEY);
  }

  setSpan(context = this.contextManager.active(), span) {
    return context.setValue(SPAN_KEY, span);
  }

  startSpan(name, options = {}, context = this.contextManager.active()) {
    return this.tracer.startSpan(name, options, context);
  }

  with(context, fn, thisArg, ...args) {
    return this.contextManager.with(context, fn, thisArg, ...args);
  }

  withSpan(name, options, fn, thisArg) {
    const span = this.startSpan(name, options);
    return this.with(this.setSpan(this.contextManager.active(), span), fn, thisArg, span);
  }
}


/***/ }),

/***/ 1511:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var merge = __webpack_require__(3055);

var RollbarJSON = {};
function setupJSON(polyfillJSON) {
  if (isFunction(RollbarJSON.stringify) && isFunction(RollbarJSON.parse)) {
    return;
  }

  if (isDefined(JSON)) {
    // If polyfill is provided, prefer it over existing non-native shims.
    if (polyfillJSON) {
      if (isNativeFunction(JSON.stringify)) {
        RollbarJSON.stringify = JSON.stringify;
      }
      if (isNativeFunction(JSON.parse)) {
        RollbarJSON.parse = JSON.parse;
      }
    } else {
      // else accept any interface that is present.
      if (isFunction(JSON.stringify)) {
        RollbarJSON.stringify = JSON.stringify;
      }
      if (isFunction(JSON.parse)) {
        RollbarJSON.parse = JSON.parse;
      }
    }
  }
  if (!isFunction(RollbarJSON.stringify) || !isFunction(RollbarJSON.parse)) {
    polyfillJSON && polyfillJSON(RollbarJSON);
  }
}

/*
 * isType - Given a Javascript value and a string, returns true if the type of the value matches the
 * given string.
 *
 * @param x - any value
 * @param t - a lowercase string containing one of the following type names:
 *    - undefined
 *    - null
 *    - error
 *    - number
 *    - boolean
 *    - string
 *    - symbol
 *    - function
 *    - object
 *    - array
 * @returns true if x is of type t, otherwise false
 */
function isType(x, t) {
  return t === typeName(x);
}

/*
 * typeName - Given a Javascript value, returns the type of the object as a string
 */
function typeName(x) {
  var name = typeof x;
  if (name !== 'object') {
    return name;
  }
  if (!x) {
    return 'null';
  }
  if (x instanceof Error) {
    return 'error';
  }
  return {}.toString
    .call(x)
    .match(/\s([a-zA-Z]+)/)[1]
    .toLowerCase();
}

/* isFunction - a convenience function for checking if a value is a function
 *
 * @param f - any value
 * @returns true if f is a function, otherwise false
 */
function isFunction(f) {
  return isType(f, 'function');
}

/* isNativeFunction - a convenience function for checking if a value is a native JS function
 *
 * @param f - any value
 * @returns true if f is a native JS function, otherwise false
 */
function isNativeFunction(f) {
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  var funcMatchString = Function.prototype.toString
    .call(Object.prototype.hasOwnProperty)
    .replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?');
  var reIsNative = RegExp('^' + funcMatchString + '$');
  return isObject(f) && reIsNative.test(f);
}

/* isObject - Checks if the argument is an object
 *
 * @param value - any value
 * @returns true is value is an object function is an object)
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/* isString - Checks if the argument is a string
 *
 * @param value - any value
 * @returns true if value is a string
 */
function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

/**
 * isFiniteNumber - determines whether the passed value is a finite number
 *
 * @param {*} n - any value
 * @returns true if value is a finite number
 */
function isFiniteNumber(n) {
  return Number.isFinite(n);
}

/*
 * isDefined - a convenience function for checking if a value is not equal to undefined
 *
 * @param u - any value
 * @returns true if u is anything other than undefined
 */
function isDefined(u) {
  return !isType(u, 'undefined');
}

/*
 * isIterable - convenience function for checking if a value can be iterated, essentially
 * whether it is an object or an array.
 *
 * @param i - any value
 * @returns true if i is an object or an array as determined by `typeName`
 */
function isIterable(i) {
  var type = typeName(i);
  return type === 'object' || type === 'array';
}

/*
 * isError - convenience function for checking if a value is of an error type
 *
 * @param e - any value
 * @returns true if e is an error
 */
function isError(e) {
  // Detect both Error and Firefox Exception type
  return isType(e, 'error') || isType(e, 'exception');
}

/* isPromise - a convenience function for checking if a value is a promise
 *
 * @param p - any value
 * @returns true if f is a function, otherwise false
 */
function isPromise(p) {
  return isObject(p) && isType(p.then, 'function');
}

/**
 * isBrowser - a convenience function for checking if the code is running in a browser
 *
 * @returns true if the code is running in a browser environment
 */
function isBrowser() {
  return typeof window !== 'undefined';
}

function redact() {
  return '********';
}

// from http://stackoverflow.com/a/8809472/1138191
function uuid4() {
  var d = now();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x7) | 0x8).toString(16);
    },
  );
  return uuid;
}

var LEVELS = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

function sanitizeUrl(url) {
  var baseUrlParts = parseUri(url);
  if (!baseUrlParts) {
    return '(unknown)';
  }

  // remove a trailing # if there is no anchor
  if (baseUrlParts.anchor === '') {
    baseUrlParts.source = baseUrlParts.source.replace('#', '');
  }

  url = baseUrlParts.source.replace('?' + baseUrlParts.query, '');
  return url;
}

var parseUriOptions = {
  strictMode: false,
  key: [
    'source',
    'protocol',
    'authority',
    'userInfo',
    'user',
    'password',
    'host',
    'port',
    'relative',
    'path',
    'directory',
    'file',
    'query',
    'anchor',
  ],
  q: {
    name: 'queryKey',
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
  },
  parser: {
    strict:
      /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:
      /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
  },
};

function parseUri(str) {
  if (!isType(str, 'string')) {
    return undefined;
  }

  var o = parseUriOptions;
  var m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);
  var uri = {};

  for (var i = 0, l = o.key.length; i < l; ++i) {
    uri[o.key[i]] = m[i] || '';
  }

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) {
      uri[o.q.name][$1] = $2;
    }
  });

  return uri;
}

function addParamsAndAccessTokenToPath(accessToken, options, params) {
  params = params || {};
  params.access_token = accessToken;
  var paramsArray = [];
  var k;
  for (k in params) {
    if (Object.prototype.hasOwnProperty.call(params, k)) {
      paramsArray.push([k, params[k]].join('='));
    }
  }
  var query = '?' + paramsArray.sort().join('&');

  options = options || {};
  options.path = options.path || '';
  var qs = options.path.indexOf('?');
  var h = options.path.indexOf('#');
  var p;
  if (qs !== -1 && (h === -1 || h > qs)) {
    p = options.path;
    options.path = p.substring(0, qs) + query + '&' + p.substring(qs + 1);
  } else {
    if (h !== -1) {
      p = options.path;
      options.path = p.substring(0, h) + query + p.substring(h);
    } else {
      options.path = options.path + query;
    }
  }
}

function formatUrl(u, protocol) {
  protocol = protocol || u.protocol;
  if (!protocol && u.port) {
    if (u.port === 80) {
      protocol = 'http:';
    } else if (u.port === 443) {
      protocol = 'https:';
    }
  }
  protocol = protocol || 'https:';

  if (!u.hostname) {
    return null;
  }
  var result = protocol + '//' + u.hostname;
  if (u.port) {
    result = result + ':' + u.port;
  }
  if (u.path) {
    result = result + u.path;
  }
  return result;
}

function stringify(obj, backup) {
  var value, error;
  try {
    value = RollbarJSON.stringify(obj);
  } catch (jsonError) {
    if (backup && isFunction(backup)) {
      try {
        value = backup(obj);
      } catch (backupError) {
        error = backupError;
      }
    } else {
      error = jsonError;
    }
  }
  return { error: error, value: value };
}

function maxByteSize(string) {
  // The transport will use utf-8, so assume utf-8 encoding.
  //
  // This minimal implementation will accurately count bytes for all UCS-2 and
  // single code point UTF-16. If presented with multi code point UTF-16,
  // which should be rare, it will safely overcount, not undercount.
  //
  // While robust utf-8 encoders exist, this is far smaller and far more performant.
  // For quickly counting payload size for truncation, smaller is better.

  var count = 0;
  var length = string.length;

  for (var i = 0; i < length; i++) {
    var code = string.charCodeAt(i);
    if (code < 128) {
      // up to 7 bits
      count = count + 1;
    } else if (code < 2048) {
      // up to 11 bits
      count = count + 2;
    } else if (code < 65536) {
      // up to 16 bits
      count = count + 3;
    }
  }

  return count;
}

function jsonParse(s) {
  var value, error;
  try {
    value = RollbarJSON.parse(s);
  } catch (e) {
    error = e;
  }
  return { error: error, value: value };
}

function makeUnhandledStackInfo(
  message,
  url,
  lineno,
  colno,
  error,
  mode,
  backupMessage,
  errorParser,
) {
  var location = {
    url: url || '',
    line: lineno,
    column: colno,
  };
  location.func = errorParser.guessFunctionName(location.url, location.line);
  location.context = errorParser.gatherContext(location.url, location.line);
  var href =
    typeof document !== 'undefined' &&
    document &&
    document.location &&
    document.location.href;
  var useragent =
    typeof window !== 'undefined' &&
    window &&
    window.navigator &&
    window.navigator.userAgent;
  return {
    mode: mode,
    message: error ? String(error) : message || backupMessage,
    url: href,
    stack: [location],
    useragent: useragent,
  };
}

function wrapCallback(logger, f) {
  return function (err, resp) {
    try {
      f(err, resp);
    } catch (e) {
      logger.error(e);
    }
  };
}

function nonCircularClone(obj) {
  var seen = [obj];

  function clone(obj, seen) {
    var value,
      name,
      newSeen,
      result = {};

    try {
      for (name in obj) {
        value = obj[name];

        if (value && (isType(value, 'object') || isType(value, 'array'))) {
          if (seen.includes(value)) {
            result[name] = 'Removed circular reference: ' + typeName(value);
          } else {
            newSeen = seen.slice();
            newSeen.push(value);
            result[name] = clone(value, newSeen);
          }
          continue;
        }

        result[name] = value;
      }
    } catch (e) {
      result = 'Failed cloning custom data: ' + e.message;
    }
    return result;
  }
  return clone(obj, seen);
}

function createItem(args, logger, notifier, requestKeys, lambdaContext) {
  var message, err, custom, callback, request;
  var arg;
  var extraArgs = [];
  var diagnostic = {};
  var argTypes = [];

  for (var i = 0, l = args.length; i < l; ++i) {
    arg = args[i];

    var typ = typeName(arg);
    argTypes.push(typ);
    switch (typ) {
      case 'undefined':
        break;
      case 'string':
        message ? extraArgs.push(arg) : (message = arg);
        break;
      case 'function':
        callback = wrapCallback(logger, arg);
        break;
      case 'date':
        extraArgs.push(arg);
        break;
      case 'error':
      case 'domexception':
      case 'exception': // Firefox Exception type
        err ? extraArgs.push(arg) : (err = arg);
        break;
      case 'object':
      case 'array':
        if (
          arg instanceof Error ||
          (typeof DOMException !== 'undefined' && arg instanceof DOMException)
        ) {
          err ? extraArgs.push(arg) : (err = arg);
          break;
        }
        if (requestKeys && typ === 'object' && !request) {
          for (var j = 0, len = requestKeys.length; j < len; ++j) {
            if (arg[requestKeys[j]] !== undefined) {
              request = arg;
              break;
            }
          }
          if (request) {
            break;
          }
        }
        custom ? extraArgs.push(arg) : (custom = arg);
        break;
      default:
        if (
          arg instanceof Error ||
          (typeof DOMException !== 'undefined' && arg instanceof DOMException)
        ) {
          err ? extraArgs.push(arg) : (err = arg);
          break;
        }
        extraArgs.push(arg);
    }
  }

  // if custom is an array this turns it into an object with integer keys
  if (custom) custom = nonCircularClone(custom);

  if (extraArgs.length > 0) {
    if (!custom) custom = nonCircularClone({});
    custom.extraArgs = nonCircularClone(extraArgs);
  }

  var item = {
    message: message,
    err: err,
    custom: custom,
    timestamp: now(),
    callback: callback,
    notifier: notifier,
    diagnostic: diagnostic,
    uuid: uuid4(),
  };

  item.data = item.data || {};

  setCustomItemKeys(item, custom);

  if (requestKeys && request) {
    item.request = request;
  }
  if (lambdaContext) {
    item.lambdaContext = lambdaContext;
  }
  item._originalArgs = args;
  item.diagnostic.original_arg_types = argTypes;
  return item;
}

function setCustomItemKeys(item, custom) {
  if (custom && custom.level !== undefined) {
    item.level = custom.level;
    delete custom.level;
  }
  if (custom && custom.skipFrames !== undefined) {
    item.skipFrames = custom.skipFrames;
    delete custom.skipFrames;
  }
}

function addErrorContext(item, errors) {
  var custom = item.data.custom || {};
  var contextAdded = false;

  try {
    for (var i = 0; i < errors.length; ++i) {
      if (errors[i].hasOwnProperty('rollbarContext')) {
        custom = merge(custom, nonCircularClone(errors[i].rollbarContext));
        contextAdded = true;
      }
    }

    // Avoid adding an empty object to the data.
    if (contextAdded) {
      item.data.custom = custom;
    }
  } catch (e) {
    item.diagnostic.error_context = 'Failed: ' + e.message;
  }
}

var TELEMETRY_TYPES = [
  'log',
  'network',
  'dom',
  'navigation',
  'error',
  'manual',
];
var TELEMETRY_LEVELS = ['critical', 'error', 'warning', 'info', 'debug'];

function arrayIncludes(arr, val) {
  for (var k = 0; k < arr.length; ++k) {
    if (arr[k] === val) {
      return true;
    }
  }

  return false;
}

function createTelemetryEvent(args) {
  var type, metadata, level;
  var arg;

  for (var i = 0, l = args.length; i < l; ++i) {
    arg = args[i];

    var typ = typeName(arg);
    switch (typ) {
      case 'string':
        if (!type && arrayIncludes(TELEMETRY_TYPES, arg)) {
          type = arg;
        } else if (!level && arrayIncludes(TELEMETRY_LEVELS, arg)) {
          level = arg;
        }
        break;
      case 'object':
        metadata = arg;
        break;
      default:
        break;
    }
  }
  var event = {
    type: type || 'manual',
    metadata: metadata || {},
    level: level,
  };

  return event;
}

function addItemAttributes(item, attributes) {
  item.data.attributes = item.data.attributes || [];
  if (attributes) {
    item.data.attributes.push(...attributes);
  }
}

/*
 * get - given an obj/array and a keypath, return the value at that keypath or
 *       undefined if not possible.
 *
 * @param obj - an object or array
 * @param path - a string of keys separated by '.' such as 'plugin.jquery.0.message'
 *    which would correspond to 42 in `{plugin: {jquery: [{message: 42}]}}`
 */
function get(obj, path) {
  if (!obj) {
    return undefined;
  }
  var keys = path.split('.');
  var result = obj;
  try {
    for (var i = 0, len = keys.length; i < len; ++i) {
      result = result[keys[i]];
    }
  } catch (e) {
    result = undefined;
  }
  return result;
}

function set(obj, path, value) {
  if (!obj) {
    return;
  }
  var keys = path.split('.');
  var len = keys.length;
  if (len < 1) {
    return;
  }
  if (len === 1) {
    obj[keys[0]] = value;
    return;
  }
  try {
    var temp = obj[keys[0]] || {};
    var replacement = temp;
    for (var i = 1; i < len - 1; ++i) {
      temp[keys[i]] = temp[keys[i]] || {};
      temp = temp[keys[i]];
    }
    temp[keys[len - 1]] = value;
    obj[keys[0]] = replacement;
  } catch (e) {
    return;
  }
}

function formatArgsAsString(args) {
  var i, len, arg;
  var result = [];
  for (i = 0, len = args.length; i < len; ++i) {
    arg = args[i];
    switch (typeName(arg)) {
      case 'object':
        arg = stringify(arg);
        arg = arg.error || arg.value;
        if (arg.length > 500) {
          arg = arg.substr(0, 497) + '...';
        }
        break;
      case 'null':
        arg = 'null';
        break;
      case 'undefined':
        arg = 'undefined';
        break;
      case 'symbol':
        arg = arg.toString();
        break;
    }
    result.push(arg);
  }
  return result.join(' ');
}

function now() {
  if (Date.now) {
    return +Date.now();
  }
  return +new Date();
}

function filterIp(requestData, captureIp) {
  if (!requestData || !requestData['user_ip'] || captureIp === true) {
    return;
  }
  var newIp = requestData['user_ip'];
  if (!captureIp) {
    newIp = null;
  } else {
    try {
      var parts;
      if (newIp.indexOf('.') !== -1) {
        parts = newIp.split('.');
        parts.pop();
        parts.push('0');
        newIp = parts.join('.');
      } else if (newIp.indexOf(':') !== -1) {
        parts = newIp.split(':');
        if (parts.length > 2) {
          var beginning = parts.slice(0, 3);
          var slashIdx = beginning[2].indexOf('/');
          if (slashIdx !== -1) {
            beginning[2] = beginning[2].substring(0, slashIdx);
          }
          var terminal = '0000:0000:0000:0000:0000';
          newIp = beginning.concat(terminal).join(':');
        }
      } else {
        newIp = null;
      }
    } catch (e) {
      newIp = null;
    }
  }
  requestData['user_ip'] = newIp;
}

function handleOptions(current, input, payload, logger) {
  var result = merge(current, input, payload);
  result = updateDeprecatedOptions(result, logger);
  if (!input || input.overwriteScrubFields) {
    return result;
  }
  if (input.scrubFields) {
    result.scrubFields = (current.scrubFields || []).concat(input.scrubFields);
  }
  return result;
}

function updateDeprecatedOptions(options, logger) {
  if (options.hostWhiteList && !options.hostSafeList) {
    options.hostSafeList = options.hostWhiteList;
    options.hostWhiteList = undefined;
    logger && logger.log('hostWhiteList is deprecated. Use hostSafeList.');
  }
  if (options.hostBlackList && !options.hostBlockList) {
    options.hostBlockList = options.hostBlackList;
    options.hostBlackList = undefined;
    logger && logger.log('hostBlackList is deprecated. Use hostBlockList.');
  }
  return options;
}

module.exports = {
  addParamsAndAccessTokenToPath: addParamsAndAccessTokenToPath,
  createItem: createItem,
  addErrorContext: addErrorContext,
  createTelemetryEvent: createTelemetryEvent,
  addItemAttributes: addItemAttributes,
  filterIp: filterIp,
  formatArgsAsString: formatArgsAsString,
  formatUrl: formatUrl,
  get: get,
  handleOptions: handleOptions,
  isError: isError,
  isFiniteNumber: isFiniteNumber,
  isFunction: isFunction,
  isIterable: isIterable,
  isNativeFunction: isNativeFunction,
  isObject: isObject,
  isString: isString,
  isType: isType,
  isPromise: isPromise,
  isBrowser: isBrowser,
  jsonParse: jsonParse,
  LEVELS: LEVELS,
  makeUnhandledStackInfo: makeUnhandledStackInfo,
  merge: merge,
  now: now,
  redact: redact,
  RollbarJSON: RollbarJSON,
  sanitizeUrl: sanitizeUrl,
  set: set,
  setupJSON: setupJSON,
  stringify: stringify,
  maxByteSize: maxByteSize,
  typeName: typeName,
  uuid4: uuid4,
};


/***/ }),

/***/ 2165:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);
var makeFetchRequest = __webpack_require__(8854);
var makeXhrRequest = __webpack_require__(4428);

/*
 * accessToken may be embedded in payload but that should not
 *   be assumed
 *
 * options: {
 *   hostname
 *   protocol
 *   path
 *   port
 *   method
 *   transport ('xhr' | 'fetch')
 * }
 *
 *  params is an object containing key/value pairs. These
 *    will be appended to the path as 'key=value&key=value'
 *
 * payload is an unserialized object
 */
function Transport(truncation) {
  this.truncation = truncation;
}

Transport.prototype.get = function (
  accessToken,
  options,
  params,
  callback,
  requestFactory,
) {
  if (!callback || !_.isFunction(callback)) {
    callback = function () {};
  }
  _.addParamsAndAccessTokenToPath(accessToken, options, params);

  var method = 'GET';
  var url = _.formatUrl(options);
  this._makeZoneRequest(
    accessToken,
    url,
    method,
    null,
    callback,
    requestFactory,
    options.timeout,
    options.transport,
  );
};

Transport.prototype.post = function (
  accessToken,
  options,
  payload,
  callback,
  requestFactory,
) {
  if (!callback || !_.isFunction(callback)) {
    callback = function () {};
  }

  if (!payload) {
    return callback(new Error('Cannot send empty request'));
  }

  var stringifyResult;
  if (this.truncation) {
    stringifyResult = this.truncation.truncate(payload);
  } else {
    stringifyResult = _.stringify(payload);
  }
  if (stringifyResult.error) {
    return callback(stringifyResult.error);
  }

  var writeData = stringifyResult.value;
  var method = 'POST';
  var url = _.formatUrl(options);
  this._makeZoneRequest(
    accessToken,
    url,
    method,
    writeData,
    callback,
    requestFactory,
    options.timeout,
    options.transport,
  );
};

Transport.prototype.postJsonPayload = function (
  accessToken,
  options,
  jsonPayload,
  callback,
  requestFactory,
) {
  if (!callback || !_.isFunction(callback)) {
    callback = function () {};
  }

  var method = 'POST';
  var url = _.formatUrl(options);
  this._makeZoneRequest(
    accessToken,
    url,
    method,
    jsonPayload,
    callback,
    requestFactory,
    options.timeout,
    options.transport,
  );
};

// Wraps `_makeRequest` if zone.js is being used, ensuring that Rollbar
// API calls are not intercepted by any child forked zones.
// This is equivalent to `NgZone.runOutsideAngular` in Angular.
Transport.prototype._makeZoneRequest = function () {
  var gWindow =
    (typeof window != 'undefined' && window) ||
    (typeof self != 'undefined' && self);
  // Whenever zone.js is loaded and `Zone` is exposed globally, access
  // the root zone to ensure that requests are always made within it.
  // This approach is framework-agnostic, regardless of which
  // framework zone.js is used with.
  var rootZone = gWindow && gWindow.Zone && gWindow.Zone.root;
  var args = Array.prototype.slice.call(arguments);

  if (rootZone) {
    var self = this;
    rootZone.run(function () {
      self._makeRequest.apply(undefined, args);
    });
  } else {
    this._makeRequest.apply(undefined, args);
  }
};

Transport.prototype._makeRequest = function (
  accessToken,
  url,
  method,
  data,
  callback,
  requestFactory,
  timeout,
  transport,
) {
  if (typeof RollbarProxy !== 'undefined') {
    return _proxyRequest(data, callback);
  }

  if (transport === 'fetch') {
    makeFetchRequest(accessToken, url, method, data, callback, timeout);
  } else {
    makeXhrRequest(
      accessToken,
      url,
      method,
      data,
      callback,
      requestFactory,
      timeout,
    );
  }
};

/* global RollbarProxy */
function _proxyRequest(json, callback) {
  var rollbarProxy = new RollbarProxy();
  rollbarProxy.sendJsonPayload(
    json,
    function (_msg) {
      /* do nothing */
    }, // eslint-disable-line no-unused-vars
    function (err) {
      callback(new Error(err));
    },
  );
}

module.exports = Transport;


/***/ }),

/***/ 2232:
/***/ ((module) => {

function getElementType(e) {
  return (e.getAttribute('type') || '').toLowerCase();
}

function isDescribedElement(element, type, subtypes) {
  if (element.tagName.toLowerCase() !== type.toLowerCase()) {
    return false;
  }
  if (!subtypes) {
    return true;
  }
  element = getElementType(element);
  for (var i = 0; i < subtypes.length; i++) {
    if (subtypes[i] === element) {
      return true;
    }
  }
  return false;
}

function getElementFromEvent(evt, doc) {
  if (evt.target) {
    return evt.target;
  }
  if (doc && doc.elementFromPoint) {
    return doc.elementFromPoint(evt.clientX, evt.clientY);
  }
  return undefined;
}

function treeToArray(elem) {
  var MAX_HEIGHT = 5;
  var out = [];
  var nextDescription;
  for (var height = 0; elem && height < MAX_HEIGHT; height++) {
    nextDescription = describeElement(elem);
    if (nextDescription.tagName === 'html') {
      break;
    }
    out.unshift(nextDescription);
    elem = elem.parentNode;
  }
  return out;
}

function elementArrayToString(a) {
  var MAX_LENGTH = 80;
  var separator = ' > ',
    separatorLength = separator.length;
  var out = [],
    len = 0,
    nextStr,
    totalLength;

  for (var i = a.length - 1; i >= 0; i--) {
    nextStr = descriptionToString(a[i]);
    totalLength = len + out.length * separatorLength + nextStr.length;
    if (i < a.length - 1 && totalLength >= MAX_LENGTH + 3) {
      out.unshift('...');
      break;
    }
    out.unshift(nextStr);
    len += nextStr.length;
  }
  return out.join(separator);
}

function descriptionToString(desc) {
  if (!desc || !desc.tagName) {
    return '';
  }
  var out = [desc.tagName];
  if (desc.id) {
    out.push('#' + desc.id);
  }
  if (desc.classes) {
    out.push('.' + desc.classes.join('.'));
  }
  for (var i = 0; i < desc.attributes.length; i++) {
    out.push(
      '[' + desc.attributes[i].key + '="' + desc.attributes[i].value + '"]',
    );
  }

  return out.join('');
}

/**
 * Input: a dom element
 * Output: null if tagName is falsey or input is falsey, else
 *  {
 *    tagName: String,
 *    id: String | undefined,
 *    classes: [String] | undefined,
 *    attributes: [
 *      {
 *        key: OneOf(type, name, title, alt),
 *        value: String
 *      }
 *    ]
 *  }
 */
function describeElement(elem) {
  if (!elem || !elem.tagName) {
    return null;
  }
  var out = {},
    className,
    key,
    attr,
    i;
  out.tagName = elem.tagName.toLowerCase();
  if (elem.id) {
    out.id = elem.id;
  }
  className = elem.className;
  if (className && typeof className === 'string') {
    out.classes = className.split(/\s+/);
  }
  var attributes = ['type', 'name', 'title', 'alt'];
  out.attributes = [];
  for (i = 0; i < attributes.length; i++) {
    key = attributes[i];
    attr = elem.getAttribute(key);
    if (attr) {
      out.attributes.push({ key: key, value: attr });
    }
  }
  return out;
}

module.exports = {
  describeElement: describeElement,
  descriptionToString: descriptionToString,
  elementArrayToString: elementArrayToString,
  treeToArray: treeToArray,
  getElementFromEvent: getElementFromEvent,
  isDescribedElement: isDescribedElement,
  getElementType: getElementType,
};


/***/ }),

/***/ 2936:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {


    (window.__NEXT_P = window.__NEXT_P || []).push([
      "/",
      function () {
        return __webpack_require__(9287);
      }
    ]);
    if(false) {}
  

/***/ }),

/***/ 3055:
/***/ ((module) => {

"use strict";


var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isPlainObject = function isPlainObject(obj) {
  if (!obj || toStr.call(obj) !== '[object Object]') {
    return false;
  }

  var hasOwnConstructor = hasOwn.call(obj, 'constructor');
  var hasIsPrototypeOf =
    obj.constructor &&
    obj.constructor.prototype &&
    hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
  // Not own constructor property must be Object
  if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
    return false;
  }

  // Own properties are enumerated firstly, so to speed up,
  // if last one is own, then all properties are own.
  var key;
  for (key in obj) {
    /**/
  }

  return typeof key === 'undefined' || hasOwn.call(obj, key);
};

function merge() {
  var i,
    src,
    copy,
    clone,
    name,
    result = {},
    current = null,
    length = arguments.length;

  for (i = 0; i < length; i++) {
    current = arguments[i];
    if (current == null) {
      continue;
    }

    for (name in current) {
      src = result[name];
      copy = current[name];
      if (result !== copy) {
        if (copy && isPlainObject(copy)) {
          clone = src && isPlainObject(src) ? src : {};
          result[name] = merge(clone, copy);
        } else if (typeof copy !== 'undefined') {
          result[name] = copy;
        }
      }
    }
  }
  return result;
}

module.exports = merge;


/***/ }),

/***/ 3188:
/***/ ((module) => {

function wrapGlobals(window, handler, shim) {
  if (!window) {
    return;
  }
  // Adapted from https://github.com/bugsnag/bugsnag-js
  var globals =
    'EventTarget,Window,Node,ApplicationCache,AudioTrackList,ChannelMergerNode,CryptoOperation,EventSource,FileReader,HTMLUnknownElement,IDBDatabase,IDBRequest,IDBTransaction,KeyOperation,MediaController,MessagePort,ModalWindow,Notification,SVGElementInstance,Screen,TextTrack,TextTrackCue,TextTrackList,WebSocket,WebSocketWorker,Worker,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload'.split(
      ',',
    );
  var i, global;
  for (i = 0; i < globals.length; ++i) {
    global = globals[i];

    if (window[global] && window[global].prototype) {
      _extendListenerPrototype(handler, window[global].prototype, shim);
    }
  }
}

function _extendListenerPrototype(handler, prototype, shim) {
  if (
    prototype.hasOwnProperty &&
    prototype.hasOwnProperty('addEventListener')
  ) {
    var oldAddEventListener = prototype.addEventListener;
    while (
      oldAddEventListener._rollbarOldAdd &&
      oldAddEventListener.belongsToShim
    ) {
      oldAddEventListener = oldAddEventListener._rollbarOldAdd;
    }
    var addFn = function (event, callback, bubble) {
      oldAddEventListener.call(this, event, handler.wrap(callback), bubble);
    };
    addFn._rollbarOldAdd = oldAddEventListener;
    addFn.belongsToShim = shim;
    prototype.addEventListener = addFn;

    var oldRemoveEventListener = prototype.removeEventListener;
    while (
      oldRemoveEventListener._rollbarOldRemove &&
      oldRemoveEventListener.belongsToShim
    ) {
      oldRemoveEventListener = oldRemoveEventListener._rollbarOldRemove;
    }
    var removeFn = function (event, callback, bubble) {
      oldRemoveEventListener.call(
        this,
        event,
        (callback && callback._rollbar_wrapped) || callback,
        bubble,
      );
    };
    removeFn._rollbarOldRemove = oldRemoveEventListener;
    removeFn.belongsToShim = shim;
    prototype.removeEventListener = removeFn;
  }
}

module.exports = wrapGlobals;


/***/ }),

/***/ 3383:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const RateLimiter = __webpack_require__(7133);
const Queue = __webpack_require__(8816);
const Notifier = __webpack_require__(455);
const _ = __webpack_require__(1511);

/*
 * Rollbar - the interface to Rollbar
 *
 * @param options
 * @param api
 * @param logger
 */
function Rollbar(options, api, logger, telemeter, tracing, replayMap, platform) {
  this.options = _.merge(options);
  this.logger = logger;
  Rollbar.rateLimiter.configureGlobal(this.options);
  Rollbar.rateLimiter.setPlatformOptions(platform, this.options);
  this.api = api;
  this.queue = new Queue(Rollbar.rateLimiter, api, logger, this.options, replayMap);

  this.tracing = tracing;

  // Legacy OpenTracing support
  // This must happen before the Notifier is created
  var tracer = this.options.tracer || null;
  if (validateTracer(tracer)) {
    this.tracer = tracer;
    // set to a string for api response serialization
    this.options.tracer = 'opentracing-tracer-enabled';
    this.options._configuredOptions.tracer = 'opentracing-tracer-enabled';
  } else {
    this.tracer = null;
  }

  this.notifier = new Notifier(this.queue, this.options);
  this.telemeter = telemeter;
  setStackTraceLimit(options);
  this.lastError = null;
  this.lastErrorHash = 'none';
}

var defaultOptions = {
  maxItems: 0,
  itemsPerMinute: 60,
};

Rollbar.rateLimiter = new RateLimiter(defaultOptions);

Rollbar.prototype.global = function (options) {
  Rollbar.rateLimiter.configureGlobal(options);
  return this;
};

Rollbar.prototype.configure = function (options, payloadData) {
  var oldOptions = this.options;
  var payload = {};
  if (payloadData) {
    payload = { payload: payloadData };
  }

  this.options = _.merge(oldOptions, options, payload);

  // Legacy OpenTracing support
  // This must happen before the Notifier is configured
  var tracer = this.options.tracer || null;
  if (validateTracer(tracer)) {
    this.tracer = tracer;
    // set to a string for api response serialization
    this.options.tracer = 'opentracing-tracer-enabled';
    this.options._configuredOptions.tracer = 'opentracing-tracer-enabled';
  } else {
    this.tracer = null;
  }

  this.notifier && this.notifier.configure(this.options);
  this.telemeter && this.telemeter.configure(this.options);
  setStackTraceLimit(options);
  this.global(this.options);

  if (validateTracer(options.tracer)) {
    this.tracer = options.tracer;
  }

  return this;
};

Rollbar.prototype.log = function (item) {
  var level = this._defaultLogLevel();
  return this._log(level, item);
};

Rollbar.prototype.debug = function (item) {
  this._log('debug', item);
};

Rollbar.prototype.info = function (item) {
  this._log('info', item);
};

Rollbar.prototype.warn = function (item) {
  this._log('warning', item);
};

Rollbar.prototype.warning = function (item) {
  this._log('warning', item);
};

Rollbar.prototype.error = function (item) {
  this._log('error', item);
};

Rollbar.prototype.critical = function (item) {
  this._log('critical', item);
};

Rollbar.prototype.wait = function (callback) {
  this.queue.wait(callback);
};

Rollbar.prototype.captureEvent = function (type, metadata, level) {
  return this.telemeter && this.telemeter.captureEvent(type, metadata, level);
};

Rollbar.prototype.captureDomContentLoaded = function (ts) {
  return this.telemeter && this.telemeter.captureDomContentLoaded(ts);
};

Rollbar.prototype.captureLoad = function (ts) {
  return this.telemeter && this.telemeter.captureLoad(ts);
};

Rollbar.prototype.buildJsonPayload = function (item) {
  return this.api.buildJsonPayload(item);
};

Rollbar.prototype.sendJsonPayload = function (jsonPayload) {
  this.api.postJsonPayload(jsonPayload);
};

/* Internal */

Rollbar.prototype._log = function (defaultLevel, item) {
  var callback;
  if (item.callback) {
    callback = item.callback;
    delete item.callback;
  }
  if (this.options.ignoreDuplicateErrors && this._sameAsLastError(item)) {
    if (callback) {
      var error = new Error('ignored identical item');
      error.item = item;
      callback(error);
    }
    return;
  }
  try {
    this._addTracingAttributes(item);

    // Legacy OpenTracing support
    this._addTracingInfo(item);
    item.level = item.level || defaultLevel;
    this.telemeter && this.telemeter._captureRollbarItem(item);
    item.telemetryEvents =
      (this.telemeter && this.telemeter.copyEvents()) || [];
    this.notifier.log(item, callback);
  } catch (e) {
    if (callback) {
      callback(e);
    }
    this.logger.error(e);
  }
};

Rollbar.prototype._addTracingAttributes = function (item) {
  const span = this.tracing?.getSpan();
  if (!span) {
    return;
  }
  const attributes = [
    {key: 'session_id', value: this.tracing.sessionId},
    {key: 'span_id', value: span.spanId},
    {key: 'trace_id', value: span.traceId},
  ];
  _.addItemAttributes(item, attributes);

  span.addEvent(
    'rollbar.occurrence',
    [{key: 'rollbar.occurrence.uuid', value: item.uuid}],
  );
};

Rollbar.prototype._defaultLogLevel = function () {
  return this.options.logLevel || 'debug';
};

Rollbar.prototype._sameAsLastError = function (item) {
  if (!item._isUncaught) {
    return false;
  }
  var itemHash = generateItemHash(item);
  if (this.lastErrorHash === itemHash) {
    return true;
  }
  this.lastError = item.err;
  this.lastErrorHash = itemHash;
  return false;
};

Rollbar.prototype._addTracingInfo = function (item) {
  // Tracer validation occurs in the constructor
  // or in the Rollbar.prototype.configure methods
  if (this.tracer) {
    // add rollbar occurrence uuid to span
    var span = this.tracer.scope().active();

    if (validateSpan(span)) {
      span.setTag('rollbar.error_uuid', item.uuid);
      span.setTag('rollbar.has_error', true);
      span.setTag('error', true);
      span.setTag(
        'rollbar.item_url',
        `https://rollbar.com/item/uuid/?uuid=${item.uuid}`,
      );
      span.setTag(
        'rollbar.occurrence_url',
        `https://rollbar.com/occurrence/uuid/?uuid=${item.uuid}`,
      );

      // add span ID & trace ID to occurrence
      var opentracingSpanId = span.context().toSpanId();
      var opentracingTraceId = span.context().toTraceId();

      if (item.custom) {
        item.custom.opentracing_span_id = opentracingSpanId;
        item.custom.opentracing_trace_id = opentracingTraceId;
      } else {
        item.custom = {
          opentracing_span_id: opentracingSpanId,
          opentracing_trace_id: opentracingTraceId,
        };
      }
    }
  }
};

function generateItemHash(item) {
  var message = item.message || '';
  var stack = (item.err || {}).stack || String(item.err);
  return message + '::' + stack;
}

// Node.js, Chrome, Safari, and some other browsers support this property
// which globally sets the number of stack frames returned in an Error object.
// If a browser can't use it, no harm done.
function setStackTraceLimit(options) {
  if (options.stackTraceLimit) {
    Error.stackTraceLimit = options.stackTraceLimit;
  }
}

/**
 * Validate the Tracer object provided to the Client
 * is valid for our Opentracing use case.
 * @param {opentracer.Tracer} tracer
 */
function validateTracer(tracer) {
  if (!tracer) {
    return false;
  }

  if (!tracer.scope || typeof tracer.scope !== 'function') {
    return false;
  }

  var scope = tracer.scope();

  if (!scope || !scope.active || typeof scope.active !== 'function') {
    return false;
  }

  return true;
}

/**
 * Validate the Span object provided
 * @param {opentracer.Span} span
 */
function validateSpan(span) {
  if (!span || !span.context || typeof span.context !== 'function') {
    return false;
  }

  var spanContext = span.context();

  if (
    !spanContext ||
    !spanContext.toSpanId ||
    !spanContext.toTraceId ||
    typeof spanContext.toSpanId !== 'function' ||
    typeof spanContext.toTraceId !== 'function'
  ) {
    return false;
  }

  return true;
}

module.exports = Rollbar;


/***/ }),

/***/ 3521:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @module hrtime
 *
 * @description Methods for handling OpenTelemetry hrtime.
 */

/**
 * Convert a duration in milliseconds to an OpenTelemetry hrtime tuple.
 *
 * @param {number} millis - The duration in milliseconds.
 * @returns {[number, number]} An array where the first element is seconds
 *   and the second is nanoseconds.
 */
function fromMillis(millis) {
  return [Math.trunc(millis / 1000), Math.round((millis % 1000) * 1e6)];
}

/**
 * Convert an OpenTelemetry hrtime tuple back to a duration in milliseconds.
 *
 * @param {[number, number]} hrtime - The hrtime tuple [seconds, nanoseconds].
 * @returns {number} The total duration in milliseconds.
 */
function toMillis(hrtime) {
  return hrtime[0] * 1e3 + Math.round(hrtime[1] / 1e6);
}

/**
 * Convert an OpenTelemetry hrtime tuple back to a duration in nanoseconds.
 *
 * @param {[number, number]} hrtime - The hrtime tuple [seconds, nanoseconds].
 * @returns {number} The total duration in nanoseconds.
 */
function toNanos(hrtime) {
  return hrtime[0] * 1e9 + hrtime[1];
}

/**
 * Adds two OpenTelemetry hrtime tuples.
 *
 * @param {[number, number]} a - The first hrtime tuple [s, ns].
 * @param {[number, number]} b - The second hrtime tuple [s, ns].
 * @returns {[number, number]} Summed hrtime tuple, normalized.
 *
 */
function add(a, b) {
  return [a[0] + b[0] + Math.trunc((a[1] + b[1]) / 1e9), (a[1] + b[1]) % 1e9];
}

/**
 * Get the current high-resolution time as an OpenTelemetry hrtime tuple.
 *
 * Uses the Performance API (timeOrigin + now()).
 *
 * @returns {[number, number]} The current hrtime tuple [s, ns].
 */
function now() {
  return add(fromMillis(performance.timeOrigin), fromMillis(performance.now()));
}

/**
 * Check if a value is a valid OpenTelemetry hrtime tuple.
 *
 * An hrtime tuple is an Array of exactly two numbers:
 *   [seconds, nanoseconds]
 *
 * @param {*} value – anything to test
 * @returns {boolean} true if `value` is a [number, number] array of length 2
 *
 * @example
 * isHrTime([ 1, 500 ]);         // true
 * isHrTime([ 0, 1e9 ]);         // true
 * isHrTime([ '1', 500 ]);       // false
 * isHrTime({ 0: 1, 1: 500 });   // false
 */
function isHrTime(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

/**
 * Methods for handling hrtime. OpenTelemetry uses the [seconds, nanoseconds]
 * format for hrtime in the `ReadableSpan` interface.
 *
 * @example
 * import hrtime from '@tracing/hrtime.js';
 *
 * hrtime.fromMillis(1000);
 * hrtime.toMillis([0, 1000]);
 * hrtime.add([0, 0], [0, 1000]);
 * hrtime.now();
 * hrtime.isHrTime([0, 1000]);
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ fromMillis, toMillis, toNanos, add, now, isHrTime });


/***/ }),

/***/ 3899:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* binding */ ReplayMap)
/* harmony export */ });
/* harmony import */ var _tracing_id_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4583);


/**
 * ReplayMap - Manages the mapping between error occurrences and their associated
 * session recordings. This class handles the coordination between when recordings
 * are dumped and when they are eventually sent to the backend.
 */
class ReplayMap {
  #map;
  #recorder;
  #api;
  #tracing;

  /**
   * Creates a new ReplayMap instance
   *
   * @param {Object} props - Configuration props
   * @param {Object} props.recorder - The recorder instance that dumps replay data into spans
   * @param {Object} props.api - The API instance used to send replay payloads to the backend
   * @param {Object} props.tracing - The tracing instance used to create spans and manage context
   */
  constructor({ recorder, api, tracing }) {
    if (!recorder) {
      throw new TypeError("Expected 'recorder' to be provided");
    }

    if (!api) {
      throw new TypeError("Expected 'api' to be provided");
    }

    if (!tracing) {
      throw new TypeError("Expected 'tracing' to be provided");
    }

    this.#map = new Map();
    this.#recorder = recorder;
    this.#api = api;
    this.#tracing = tracing;
  }

  /**
   * Processes a replay by converting recorder events into a transport-ready payload.
   *
   * Calls recorder.dump() to capture events as spans, formats them into a proper payload,
   * and stores the result in the map using replayId as the key.
   *
   * @param {string} replayId - The unique ID for this replay
   * @returns {Promise<string>} A promise resolving to the processed replayId
   * @private
   */
  async _processReplay(replayId, occurrenceUuid) {
    try {
      const payload = this.#recorder.dump(this.#tracing, replayId, occurrenceUuid);

      this.#map.set(replayId, payload);
    } catch (transformError) {
      console.error('Error transforming spans:', transformError);

      this.#map.set(replayId, null); // TODO(matux): Error span?
    }

    return replayId;
  }

  /**
   * Adds a replay to the map and returns a uniquely generated replay ID.
   *
   * This method immediately returns the replayId and asynchronously processes
   * the replay data in the background. The processing involves converting
   * recorder events into a payload format and storing it in the map.
   *
   * @returns {string} A unique identifier for this replay
   */
  add(occurrenceUuid) {
    const replayId = _tracing_id_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A.gen(8);

    this._processReplay(replayId, occurrenceUuid).catch((error) => {
      console.error('Failed to process replay:', error);
    });

    return replayId;
  }

  /**
   * Sends the replay payload associated with the given replayId to the backend
   * and removes it from the map.
   *
   * Retrieves the payload from the map, checks if it's valid, then sends it
   * to the API endpoint for processing. The payload can be either a spans array
   * or a formatted OTLP payload object.
   *
   * @param {string} replayId - The ID of the replay to send
   * @returns {Promise<boolean>} A promise that resolves to true if the payload was found and sent, false otherwise
   */
  async send(replayId) {
    if (!replayId) {
      console.warn('ReplayMap.send: No replayId provided');
      return false;
    }

    if (!this.#map.has(replayId)) {
      console.warn(`ReplayMap.send: No replay found for replayId: ${replayId}`);
      return false;
    }

    const payload = this.#map.get(replayId);
    this.#map.delete(replayId);

    // Check if payload is empty (could be raw spans array or OTLP payload)
    const isEmpty =
      !payload ||
      (Array.isArray(payload) && payload.length === 0) ||
      (payload.resourceSpans && payload.resourceSpans.length === 0);

    if (isEmpty) {
      console.warn(
        `ReplayMap.send: No payload found for replayId: ${replayId}`,
      );
      return false;
    }

    try {
      await this.#api.postSpans(payload);
      return true;
    } catch (error) {
      console.error('Error sending replay:', error);
      return false;
    }
  }

  /**
   * Discards the replay associated with the given replay ID by removing
   * it from the map without sending it.
   *
   * @param {string} replayId - The ID of the replay to discard
   * @returns {boolean} True if a replay was found and discarded, false otherwise
   */
  discard(replayId) {
    if (!replayId) {
      console.warn('ReplayMap.discard: No replayId provided');
      return false;
    }

    if (!this.#map.has(replayId)) {
      console.warn(
        `ReplayMap.discard: No replay found for replayId: ${replayId}`,
      );
      return false;
    }

    this.#map.delete(replayId);
    return true;
  }

  /**
   * Gets spans for the given replay ID
   *
   * @param {string} replayId - The ID to retrieve spans for
   * @returns {Array|null} The spans array or null if not found
   */
  getSpans(replayId) {
    return this.#map.get(replayId) ?? null;
  }

  /**
   * Sets spans for a given replay ID
   *
   * @param {string} replayId - The ID to set spans for
   * @param {Array} spans - The spans to set
   */
  setSpans(replayId, spans) {
    this.#map.set(replayId, spans);
  }

  /**
   * Returns the size of the map (number of stored replays)
   *
   * @returns {number} The number of replays currently stored
   */
  get size() {
    return this.#map.size;
  }

  /**
   * Clears all stored replays without sending them
   */
  clear() {
    this.#map.clear();
  }
}


/***/ }),

/***/ 4428:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*global XDomainRequest*/

var _ = __webpack_require__(1511);
var logger = __webpack_require__(6604);

function makeXhrRequest(
  accessToken,
  url,
  method,
  data,
  callback,
  requestFactory,
  timeout,
) {
  var request;
  if (requestFactory) {
    request = requestFactory();
  } else {
    request = _createXMLHTTPObject();
  }
  if (!request) {
    // Give up, no way to send requests
    return callback(new Error('No way to send a request'));
  }
  try {
    try {
      var onreadystatechange = function () {
        try {
          if (onreadystatechange && request.readyState === 4) {
            onreadystatechange = undefined;

            var parseResponse = _.jsonParse(request.responseText);
            if (_isSuccess(request)) {
              callback(parseResponse.error, parseResponse.value);
              return;
            } else if (_isNormalFailure(request)) {
              if (request.status === 403) {
                // likely caused by using a server access token
                var message =
                  parseResponse.value && parseResponse.value.message;
                logger.error(message);
              }
              // return valid http status codes
              callback(new Error(String(request.status)));
            } else {
              // IE will return a status 12000+ on some sort of connection failure,
              // so we return a blank error
              // http://msdn.microsoft.com/en-us/library/aa383770%28VS.85%29.aspx
              var msg =
                'XHR response had no status code (likely connection failure)';
              callback(_newRetriableError(msg));
            }
          }
        } catch (ex) {
          //jquery source mentions firefox may error out while accessing the
          //request members if there is a network error
          //https://github.com/jquery/jquery/blob/a938d7b1282fc0e5c52502c225ae8f0cef219f0a/src/ajax/xhr.js#L111
          var exc;
          if (ex && ex.stack) {
            exc = ex;
          } else {
            exc = new Error(ex);
          }
          callback(exc);
        }
      };

      request.open(method, url, true);
      if (request.setRequestHeader) {
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('X-Rollbar-Access-Token', accessToken);
      }

      if (_.isFiniteNumber(timeout)) {
        request.timeout = timeout;
      }

      request.onreadystatechange = onreadystatechange;
      request.send(data);
    } catch (e1) {
      // Sending using the normal xmlhttprequest object didn't work, try XDomainRequest
      if (typeof XDomainRequest !== 'undefined') {
        // Assume we are in a really old browser which has a bunch of limitations:
        // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx

        // Extreme paranoia: if we have XDomainRequest then we have a window, but just in case
        if (!window || !window.location) {
          return callback(
            new Error(
              'No window available during request, unknown environment',
            ),
          );
        }

        // If the current page is http, try and send over http
        if (
          window.location.href.substring(0, 5) === 'http:' &&
          url.substring(0, 5) === 'https'
        ) {
          url = 'http' + url.substring(5);
        }

        var xdomainrequest = new XDomainRequest();
        xdomainrequest.onprogress = function () {};
        xdomainrequest.ontimeout = function () {
          var msg = 'Request timed out';
          var code = 'ETIMEDOUT';
          callback(_newRetriableError(msg, code));
        };
        xdomainrequest.onerror = function () {
          callback(new Error('Error during request'));
        };
        xdomainrequest.onload = function () {
          var parseResponse = _.jsonParse(xdomainrequest.responseText);
          callback(parseResponse.error, parseResponse.value);
        };
        xdomainrequest.open(method, url, true);
        xdomainrequest.send(data);
      } else {
        callback(new Error('Cannot find a method to transport a request'));
      }
    }
  } catch (e2) {
    callback(e2);
  }
}

function _createXMLHTTPObject() {
  /* global ActiveXObject:false */

  var factories = [
    function () {
      return new XMLHttpRequest();
    },
    function () {
      return new ActiveXObject('Msxml2.XMLHTTP');
    },
    function () {
      return new ActiveXObject('Msxml3.XMLHTTP');
    },
    function () {
      return new ActiveXObject('Microsoft.XMLHTTP');
    },
  ];
  var xmlhttp;
  var i;
  var numFactories = factories.length;
  for (i = 0; i < numFactories; i++) {
    /* eslint-disable no-empty */
    try {
      xmlhttp = factories[i]();
      break;
    } catch (e) {
      // pass
    }
    /* eslint-enable no-empty */
  }
  return xmlhttp;
}

function _isSuccess(r) {
  return r && r.status && r.status === 200;
}

function _isNormalFailure(r) {
  return r && _.isType(r.status, 'number') && r.status >= 400 && r.status < 600;
}

function _newRetriableError(message, code) {
  var err = new Error(message);
  err.code = code || 'ENOTFOUND';
  return err;
}

module.exports = makeXhrRequest;


/***/ }),

/***/ 4527:
/***/ (function(module) {

!function(t,e){ true?module.exports=e():0}(this,(function(){return t={14:function(t,e,r){var n=r(585);function o(t,e,r,n){this.rateLimiter=t,this.api=e,this.logger=r,this.options=n,this.predicates=[],this.pendingItems=[],this.pendingRequests=[],this.retryQueue=[],this.retryHandle=null,this.waitCallback=null,this.waitIntervalID=null}o.prototype.configure=function(t){this.api&&this.api.configure(t);var e=this.options;return this.options=n.merge(e,t),this},o.prototype.addPredicate=function(t){return n.isFunction(t)&&this.predicates.push(t),this},o.prototype.addPendingItem=function(t){this.pendingItems.push(t)},o.prototype.removePendingItem=function(t){var e=this.pendingItems.indexOf(t);-1!==e&&this.pendingItems.splice(e,1)},o.prototype.addItem=function(t,e,r,o){e&&n.isFunction(e)||(e=function(){});var i=this._applyPredicates(t);if(i.stop)return this.removePendingItem(o),void e(i.err);if(this._maybeLog(t,r),this.removePendingItem(o),this.options.transmit){this.pendingRequests.push(t);try{this._makeApiRequest(t,function(r,n){this._dequeuePendingRequest(t),e(r,n)}.bind(this))}catch(r){this._dequeuePendingRequest(t),e(r)}}else e(new Error("Transmit disabled"))},o.prototype.wait=function(t){n.isFunction(t)&&(this.waitCallback=t,this._maybeCallWait()||(this.waitIntervalID&&(this.waitIntervalID=clearInterval(this.waitIntervalID)),this.waitIntervalID=setInterval(function(){this._maybeCallWait()}.bind(this),500)))},o.prototype._applyPredicates=function(t){for(var e=null,r=0,n=this.predicates.length;r<n;r++)if(!(e=this.predicates[r](t,this.options))||void 0!==e.err)return{stop:!0,err:e.err};return{stop:!1,err:null}},o.prototype._makeApiRequest=function(t,e){var r=this.rateLimiter.shouldSend(t);r.shouldSend?this.api.postItem(t,function(r,n){r?this._maybeRetry(r,t,e):e(r,n)}.bind(this)):r.error?e(r.error):this.api.postItem(r.payload,e)};var i=["ECONNRESET","ENOTFOUND","ESOCKETTIMEDOUT","ETIMEDOUT","ECONNREFUSED","EHOSTUNREACH","EPIPE","EAI_AGAIN"];o.prototype._maybeRetry=function(t,e,r){var o=!1;if(this.options.retryInterval){for(var a=0,s=i.length;a<s;a++)if(t.code===i[a]){o=!0;break}o&&n.isFiniteNumber(this.options.maxRetries)&&(e.retries=e.retries?e.retries+1:1,e.retries>this.options.maxRetries&&(o=!1))}o?this._retryApiRequest(e,r):r(t)},o.prototype._retryApiRequest=function(t,e){this.retryQueue.push({item:t,callback:e}),this.retryHandle||(this.retryHandle=setInterval(function(){for(;this.retryQueue.length;){var t=this.retryQueue.shift();this._makeApiRequest(t.item,t.callback)}}.bind(this),this.options.retryInterval))},o.prototype._dequeuePendingRequest=function(t){var e=this.pendingRequests.indexOf(t);-1!==e&&(this.pendingRequests.splice(e,1),this._maybeCallWait())},o.prototype._maybeLog=function(t,e){if(this.logger&&this.options.verbose){var r=e;if(r=(r=r||n.get(t,"body.trace.exception.message"))||n.get(t,"body.trace_chain.0.exception.message"))return void this.logger.error(r);(r=n.get(t,"body.message.body"))&&this.logger.log(r)}},o.prototype._maybeCallWait=function(){return!(!n.isFunction(this.waitCallback)||0!==this.pendingItems.length||0!==this.pendingRequests.length||(this.waitIntervalID&&(this.waitIntervalID=clearInterval(this.waitIntervalID)),this.waitCallback(),0))},t.exports=o},49:function(t,e,r){var n=r(585),o=r(93),i={hostname:"api.rollbar.com",path:"/api/1/item/",search:null,version:"1",protocol:"https:",port:443};function a(t,e,r,n,o){this.options=t,this.transport=e,this.url=r,this.truncation=n,this.jsonBackup=o,this.accessToken=t.accessToken,this.transportOptions=s(t,r)}function s(t,e){return o.getTransportFromOptions(t,i,e)}a.prototype.postItem=function(t,e){var r=o.transportOptions(this.transportOptions,"POST"),n=o.buildPayload(this.accessToken,t,this.jsonBackup),i=this;setTimeout((function(){i.transport.post(i.accessToken,r,n,e)}),0)},a.prototype.buildJsonPayload=function(t,e){var r,i=o.buildPayload(this.accessToken,t,this.jsonBackup);return(r=this.truncation?this.truncation.truncate(i):n.stringify(i)).error?(e&&e(r.error),null):r.value},a.prototype.postJsonPayload=function(t,e){var r=o.transportOptions(this.transportOptions,"POST");this.transport.postJsonPayload(this.accessToken,r,t,e)},a.prototype.configure=function(t){var e=this.oldOptions;return this.options=n.merge(e,t),this.transportOptions=s(this.options,this.url),void 0!==this.options.accessToken&&(this.accessToken=this.options.accessToken),this},t.exports=a},93:function(t,e,r){var n=r(585);t.exports={buildPayload:function(t,e,r){if(!n.isType(e.context,"string")){var o=n.stringify(e.context,r);o.error?e.context="Error: could not serialize 'context'":e.context=o.value||"",e.context.length>255&&(e.context=e.context.substr(0,255))}return{access_token:t,data:e}},getTransportFromOptions:function(t,e,r){var n=e.hostname,o=e.protocol,i=e.port,a=e.path,s=e.search,u=t.timeout,c=function(t){var e="undefined"!=typeof window&&window||"undefined"!=typeof self&&self,r=t.defaultTransport||"xhr";return void 0===e.fetch&&(r="xhr"),void 0===e.XMLHttpRequest&&(r="fetch"),r}(t),l=t.proxy;if(t.endpoint){var p=r.parse(t.endpoint);n=p.hostname,o=p.protocol,i=p.port,a=p.pathname,s=p.search}return{timeout:u,hostname:n,protocol:o,port:i,path:a,search:s,proxy:l,transport:c}},transportOptions:function(t,e){var r=t.protocol||"https:",n=t.port||("http:"===r?80:"https:"===r?443:void 0),o=t.hostname,i=t.path,a=t.timeout,s=t.transport;return t.search&&(i+=t.search),t.proxy&&(i=r+"//"+o+i,o=t.proxy.host||t.proxy.hostname,n=t.proxy.port,r=t.proxy.protocol||r),{timeout:a,protocol:r,hostname:o,path:i,port:n,method:e,transport:s}},appendPathToPath:function(t,e){var r=/\/$/.test(t),n=/^\//.test(e);return r&&n?e=e.substring(1):r||n||(e="/"+e),t+e}}},98:function(t,e,r){var n=r(585);t.exports=function(t,e,r){var o,i,a,s,u=n.isType(t,"object"),c=n.isType(t,"array"),l=[];if(r=r||{obj:[],mapped:[]},u){if(s=r.obj.indexOf(t),u&&-1!==s)return r.mapped[s]||r.obj[s];r.obj.push(t),s=r.obj.length-1}if(u)for(o in t)Object.prototype.hasOwnProperty.call(t,o)&&l.push(o);else if(c)for(a=0;a<t.length;++a)l.push(a);var p=u?{}:[],f=!0;for(a=0;a<l.length;++a)i=t[o=l[a]],p[o]=e(o,i,r),f=f&&p[o]===t[o];return u&&!f&&(r.mapped[s]=p),f?t:p}},108:function(t,e){var r,n,o;!function(){"use strict";n=[],void 0===(o="function"==typeof(r=function(){function t(t){return!isNaN(parseFloat(t))&&isFinite(t)}function e(t){return t.charAt(0).toUpperCase()+t.substring(1)}function r(t){return function(){return this[t]}}var n=["isConstructor","isEval","isNative","isToplevel"],o=["columnNumber","lineNumber"],i=["fileName","functionName","source"],a=["args"],s=["evalOrigin"],u=n.concat(o,i,a,s);function c(t){if(t)for(var r=0;r<u.length;r++)void 0!==t[u[r]]&&this["set"+e(u[r])](t[u[r]])}c.prototype={getArgs:function(){return this.args},setArgs:function(t){if("[object Array]"!==Object.prototype.toString.call(t))throw new TypeError("Args must be an Array");this.args=t},getEvalOrigin:function(){return this.evalOrigin},setEvalOrigin:function(t){if(t instanceof c)this.evalOrigin=t;else{if(!(t instanceof Object))throw new TypeError("Eval Origin must be an Object or StackFrame");this.evalOrigin=new c(t)}},toString:function(){var t=this.getFileName()||"",e=this.getLineNumber()||"",r=this.getColumnNumber()||"",n=this.getFunctionName()||"";return this.getIsEval()?t?"[eval] ("+t+":"+e+":"+r+")":"[eval]:"+e+":"+r:n?n+" ("+t+":"+e+":"+r+")":t+":"+e+":"+r}},c.fromString=function(t){var e=t.indexOf("("),r=t.lastIndexOf(")"),n=t.substring(0,e),o=t.substring(e+1,r).split(","),i=t.substring(r+1);if(0===i.indexOf("@"))var a=/@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(i,""),s=a[1],u=a[2],l=a[3];return new c({functionName:n,args:o||void 0,fileName:s,lineNumber:u||void 0,columnNumber:l||void 0})};for(var l=0;l<n.length;l++)c.prototype["get"+e(n[l])]=r(n[l]),c.prototype["set"+e(n[l])]=function(t){return function(e){this[t]=Boolean(e)}}(n[l]);for(var p=0;p<o.length;p++)c.prototype["get"+e(o[p])]=r(o[p]),c.prototype["set"+e(o[p])]=function(e){return function(r){if(!t(r))throw new TypeError(e+" must be a Number");this[e]=Number(r)}}(o[p]);for(var f=0;f<i.length;f++)c.prototype["get"+e(i[f])]=r(i[f]),c.prototype["set"+e(i[f])]=function(t){return function(e){this[t]=String(e)}}(i[f]);return c})?r.apply(e,n):r)||(t.exports=o)}()},136:function(t,e,r){var n=r(263),o=new RegExp("^(([a-zA-Z0-9-_$ ]*): *)?(Uncaught )?([a-zA-Z0-9-_$ ]*): ");function i(){return null}function a(t){var e={};return e._stackFrame=t,e.url=t.fileName,e.line=t.lineNumber,e.func=t.functionName,e.column=t.columnNumber,e.args=t.args,e.context=null,e}function s(t,e){return{stack:function(){var r=[];e=e||0;try{r=n.parse(t)}catch(t){r=[]}for(var o=[],i=e;i<r.length;i++)o.push(new a(r[i]));return o}(),message:t.message,name:(r=t,o=r.name&&r.name.length&&r.name,i=r.constructor.name&&r.constructor.name.length&&r.constructor.name,o&&i?"Error"===o?i:o:o||i),rawStack:t.stack,rawException:t};var r,o,i}t.exports={guessFunctionName:function(){return"?"},guessErrorClass:function(t){if(!t||!t.match)return["Unknown error. There was no error message to display.",""];var e=t.match(o),r="(unknown)";return e&&(r=e[e.length-1],t=(t=t.replace((e[e.length-2]||"")+r+":","")).replace(/(^[\s]+|[\s]+$)/g,"")),[r,t]},gatherContext:i,parse:function(t,e){var r=t;if(r.nested||r.cause){for(var n=[];r;)n.push(new s(r,e)),r=r.nested||r.cause,e=0;return n[0].traceChain=n,n[0]}return new s(r,e)},Stack:s,Frame:a}},144:function(t,e,r){r(738);var n=r(629),o=r(585);t.exports={error:function(){var t=Array.prototype.slice.call(arguments,0);t.unshift("Rollbar:"),n.ieVersion()<=8?console.error(o.formatArgsAsString(t)):console.error.apply(console,t)},info:function(){var t=Array.prototype.slice.call(arguments,0);t.unshift("Rollbar:"),n.ieVersion()<=8?console.info(o.formatArgsAsString(t)):console.info.apply(console,t)},log:function(){var t=Array.prototype.slice.call(arguments,0);t.unshift("Rollbar:"),n.ieVersion()<=8?console.log(o.formatArgsAsString(t)):console.log.apply(console,t)}}},262:function(t){t.exports={captureUncaughtExceptions:function(t,e,r){if(t){var n;if("function"==typeof e._rollbarOldOnError)n=e._rollbarOldOnError;else if(t.onerror){for(n=t.onerror;n._rollbarOldOnError;)n=n._rollbarOldOnError;e._rollbarOldOnError=n}e.handleAnonymousErrors();var o=function(){var r=Array.prototype.slice.call(arguments,0);!function(t,e,r,n){t._rollbarWrappedError&&(n[4]||(n[4]=t._rollbarWrappedError),n[5]||(n[5]=t._rollbarWrappedError._rollbarContext),t._rollbarWrappedError=null);var o=e.handleUncaughtException.apply(e,n);r&&r.apply(t,n),"anonymous"===o&&(e.anonymousErrorsPending+=1)}(t,e,n,r)};r&&(o._rollbarOldOnError=n),t.onerror=o}},captureUnhandledRejections:function(t,e,r){if(t){"function"==typeof t._rollbarURH&&t._rollbarURH.belongsToShim&&t.removeEventListener("unhandledrejection",t._rollbarURH);var n=function(t){var r,n,o;try{r=t.reason}catch(t){r=void 0}try{n=t.promise}catch(t){n="[unhandledrejection] error getting `promise` from event"}try{o=t.detail,!r&&o&&(r=o.reason,n=o.promise)}catch(t){}r||(r="[unhandledrejection] error getting `reason` from event"),e&&e.handleUnhandledRejection&&e.handleUnhandledRejection(r,n)};n.belongsToShim=r,t._rollbarURH=n,t.addEventListener("unhandledrejection",n)}}}},263:function(t,e,r){var n,o,i;!function(){"use strict";o=[r(108)],void 0===(i="function"==typeof(n=function(t){var e=/(^|@)\S+:\d+/,r=/^\s*at .*(\S+:\d+|\(native\))/m,n=/^(eval@)?(\[native code])?$/;return{parse:function(t){if(void 0!==t.stacktrace||void 0!==t["opera#sourceloc"])return this.parseOpera(t);if(t.stack&&t.stack.match(r))return this.parseV8OrIE(t);if(t.stack)return this.parseFFOrSafari(t);throw new Error("Cannot parse given Error object")},extractLocation:function(t){if(-1===t.indexOf(":"))return[t];var e=/(.+?)(?::(\d+))?(?::(\d+))?$/.exec(t.replace(/[()]/g,""));return[e[1],e[2]||void 0,e[3]||void 0]},parseV8OrIE:function(e){return e.stack.split("\n").filter((function(t){return!!t.match(r)}),this).map((function(e){e.indexOf("(eval ")>-1&&(e=e.replace(/eval code/g,"eval").replace(/(\(eval at [^()]*)|(\),.*$)/g,""));var r=e.replace(/^\s+/,"").replace(/\(eval code/g,"("),n=r.match(/ (\((.+):(\d+):(\d+)\)$)/),o=(r=n?r.replace(n[0],""):r).split(/\s+/).slice(1),i=this.extractLocation(n?n[1]:o.pop()),a=o.join(" ")||void 0,s=["eval","<anonymous>"].indexOf(i[0])>-1?void 0:i[0];return new t({functionName:a,fileName:s,lineNumber:i[1],columnNumber:i[2],source:e})}),this)},parseFFOrSafari:function(e){return e.stack.split("\n").filter((function(t){return!t.match(n)}),this).map((function(e){if(e.indexOf(" > eval")>-1&&(e=e.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,":$1")),-1===e.indexOf("@")&&-1===e.indexOf(":"))return new t({functionName:e});var r=/((.*".+"[^@]*)?[^@]*)(?:@)/,n=e.match(r),o=n&&n[1]?n[1]:void 0,i=this.extractLocation(e.replace(r,""));return new t({functionName:o,fileName:i[0],lineNumber:i[1],columnNumber:i[2],source:e})}),this)},parseOpera:function(t){return!t.stacktrace||t.message.indexOf("\n")>-1&&t.message.split("\n").length>t.stacktrace.split("\n").length?this.parseOpera9(t):t.stack?this.parseOpera11(t):this.parseOpera10(t)},parseOpera9:function(e){for(var r=/Line (\d+).*script (?:in )?(\S+)/i,n=e.message.split("\n"),o=[],i=2,a=n.length;i<a;i+=2){var s=r.exec(n[i]);s&&o.push(new t({fileName:s[2],lineNumber:s[1],source:n[i]}))}return o},parseOpera10:function(e){for(var r=/Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i,n=e.stacktrace.split("\n"),o=[],i=0,a=n.length;i<a;i+=2){var s=r.exec(n[i]);s&&o.push(new t({functionName:s[3]||void 0,fileName:s[2],lineNumber:s[1],source:n[i]}))}return o},parseOpera11:function(r){return r.stack.split("\n").filter((function(t){return!!t.match(e)&&!t.match(/^Error created at/)}),this).map((function(e){var r,n=e.split("@"),o=this.extractLocation(n.pop()),i=n.shift()||"",a=i.replace(/<anonymous function(: (\w+))?>/,"$2").replace(/\([^)]*\)/g,"")||void 0;i.match(/\(([^)]*)\)/)&&(r=i.replace(/^[^(]+\(([^)]*)\)$/,"$1"));var s=void 0===r||"[arguments not available]"===r?void 0:r.split(",");return new t({functionName:a,args:s,fileName:o[0],lineNumber:o[1],columnNumber:o[2],source:e})}),this)}}})?n.apply(e,o):n)||(t.exports=i)}()},299:function(t){t.exports={version:"3.0.0-alpha.0",endpoint:"api.rollbar.com/api/1/item/",logLevel:"debug",reportLevel:"debug",uncaughtErrorLevel:"error",maxItems:0,itemsPerMin:60}},379:function(t,e,r){var n=r(585);function o(t,e,r){if(!t)return!r;var o,i,a=t.frames;if(!a||0===a.length)return!r;for(var s=e.length,u=a.length,c=0;c<u;c++){if(o=a[c].filename,!n.isType(o,"string"))return!r;for(var l=0;l<s;l++)if(i=e[l],new RegExp(i).test(o))return!0}return!1}function i(t,e,r,i){var a,s,u=!1;"blocklist"===r&&(u=!0);try{if(a=u?e.hostBlockList:e.hostSafeList,s=n.get(t,"body.trace_chain")||[n.get(t,"body.trace")],!a||0===a.length)return!u;if(0===s.length||!s[0])return!u;for(var c=s.length,l=0;l<c;l++)if(o(s[l],a,u))return!0}catch(t){u?e.hostBlockList=null:e.hostSafeList=null;var p=u?"hostBlockList":"hostSafeList";return i.error("Error while reading your configuration's "+p+" option. Removing custom "+p+".",t),!u}return!1}t.exports={checkLevel:function(t,e){var r=t.level,o=n.LEVELS[r]||0,i=e.reportLevel;return!(o<(n.LEVELS[i]||0))},userCheckIgnore:function(t){return function(e,r){var o=!!e._isUncaught;delete e._isUncaught;var i=e._originalArgs;delete e._originalArgs;try{n.isFunction(r.onSendCallback)&&r.onSendCallback(o,i,e)}catch(e){r.onSendCallback=null,t.error("Error while calling onSendCallback, removing",e)}try{if(n.isFunction(r.checkIgnore)&&r.checkIgnore(o,i,e))return!1}catch(e){r.checkIgnore=null,t.error("Error while calling custom checkIgnore(), removing",e)}return!0}},urlIsNotBlockListed:function(t){return function(e,r){return!i(e,r,"blocklist",t)}},urlIsSafeListed:function(t){return function(e,r){return i(e,r,"safelist",t)}},messageIsIgnored:function(t){return function(e,r){var o,i,a,s,u,c;try{if(!(a=r.ignoredMessages)||0===a.length)return!0;if(c=function(t){var e=t.body,r=[];if(e.trace_chain)for(var o=e.trace_chain,i=0;i<o.length;i++){var a=o[i];r.push(n.get(a,"exception.message"))}return e.trace&&r.push(n.get(e,"trace.exception.message")),e.message&&r.push(n.get(e,"message.body")),r}(e),0===c.length)return!0;for(s=a.length,o=0;o<s;o++)for(u=new RegExp(a[o],"gi"),i=0;i<c.length;i++)if(u.test(c[i]))return!1}catch(e){r.ignoredMessages=null,t.error("Error while reading your configuration's ignoredMessages option. Removing custom ignoredMessages.")}return!0}}}},392:function(t){function e(t){return(t.getAttribute("type")||"").toLowerCase()}function r(t){if(!t||!t.tagName)return"";var e=[t.tagName];t.id&&e.push("#"+t.id),t.classes&&e.push("."+t.classes.join("."));for(var r=0;r<t.attributes.length;r++)e.push("["+t.attributes[r].key+'="'+t.attributes[r].value+'"]');return e.join("")}function n(t){if(!t||!t.tagName)return null;var e,r,n,o,i={};i.tagName=t.tagName.toLowerCase(),t.id&&(i.id=t.id),(e=t.className)&&"string"==typeof e&&(i.classes=e.split(/\s+/));var a=["type","name","title","alt"];for(i.attributes=[],o=0;o<a.length;o++)r=a[o],(n=t.getAttribute(r))&&i.attributes.push({key:r,value:n});return i}t.exports={describeElement:n,descriptionToString:r,elementArrayToString:function(t){for(var e,n,o=[],i=0,a=t.length-1;a>=0;a--){if(e=r(t[a]),n=i+3*o.length+e.length,a<t.length-1&&n>=83){o.unshift("...");break}o.unshift(e),i+=e.length}return o.join(" > ")},treeToArray:function(t){for(var e,r=[],o=0;t&&o<5&&"html"!==(e=n(t)).tagName;o++)r.unshift(e),t=t.parentNode;return r},getElementFromEvent:function(t,e){return t.target?t.target:e&&e.elementFromPoint?e.elementFromPoint(t.clientX,t.clientY):void 0},isDescribedElement:function(t,r,n){if(t.tagName.toLowerCase()!==r.toLowerCase())return!1;if(!n)return!0;t=e(t);for(var o=0;o<n.length;o++)if(n[o]===t)return!0;return!1},getElementType:e}},398:function(t){t.exports=function(t,e,r,n,o){var i=t[e];t[e]=r(i),n&&n[o].push([t,e,i])}},402:function(t,e,r){var n=r(583),o=r(618),i=r(705),a=r(657),s=r(706),u=r(922),c=r(622);n.setComponents({telemeter:o,instrumenter:i,polyfillJSON:a,wrapGlobals:s,scrub:u,truncation:c}),t.exports=n},428:function(t,e,r){var n=r(402),o="undefined"!=typeof window&&window._rollbarConfig,i=o&&o.globalAlias||"Rollbar",a="undefined"!=typeof window&&window[i]&&"function"==typeof window[i].shimId&&void 0!==window[i].shimId();if("undefined"==typeof window||window._rollbarStartTime||(window._rollbarStartTime=(new Date).getTime()),!a&&o){var s=new n(o);window[i]=s}else"undefined"!=typeof window?(window.rollbar=n,window._rollbarDidLoad=!0):"undefined"!=typeof self&&(self.rollbar=n,self._rollbarDidLoad=!0);t.exports=n},472:function(t,e,r){var n=r(144),o=r(585);t.exports=function(t,e,r,i,a,s){var u,c;o.isFiniteNumber(s)&&(u=new AbortController,c=setTimeout((function(){u.abort()}),s)),fetch(e,{method:r,headers:{"Content-Type":"application/json","X-Rollbar-Access-Token":t,signal:u&&u.signal},body:i}).then((function(t){return c&&clearTimeout(c),t.json()})).then((function(t){a(null,t)})).catch((function(t){n.error(t.message),a(t)}))}},485:function(t,e,r){var n=r(585),o=r(136),i=r(144);function a(t,e,r){var o=t.message,i=t.custom;o||(o="Item sent with null or missing arguments.");var a={body:o};i&&(a.extra=n.merge(i)),n.set(t,"data.body",{message:a}),r(null,t)}function s(t){var e=t.stackInfo.stack;return e&&0===e.length&&t._unhandledStackInfo&&t._unhandledStackInfo.stack&&(e=t._unhandledStackInfo.stack),e}function u(t,e,r){var i=t&&t.data.description,a=t&&t.custom,u=s(t),l=o.guessErrorClass(e.message),p={exception:{class:c(e,l[0],r),message:l[1]}};if(i&&(p.exception.description=i),u){var f,h,d,m,g,v,y,b;for(0===u.length&&(p.exception.stack=e.rawStack,p.exception.raw=String(e.rawException)),p.frames=[],y=0;y<u.length;++y)h={filename:(f=u[y]).url?n.sanitizeUrl(f.url):"(unknown)",lineno:f.line||null,method:f.func&&"?"!==f.func?f.func:"[anonymous]",colno:f.column},r.sendFrameUrl&&(h.url=f.url),h.method&&h.method.endsWith&&h.method.endsWith("_rollbar_wrapped")||(d=m=g=null,(v=f.context?f.context.length:0)&&(b=Math.floor(v/2),m=f.context.slice(0,b),d=f.context[b],g=f.context.slice(b)),d&&(h.code=d),(m||g)&&(h.context={},m&&m.length&&(h.context.pre=m),g&&g.length&&(h.context.post=g)),f.args&&(h.args=f.args),p.frames.push(h));p.frames.reverse(),a&&(p.extra=n.merge(a))}return p}function c(t,e,r){return t.name?t.name:r.guessErrorClass?e:"(unknown)"}t.exports={handleDomException:function(t,e,r){if(t.err&&"DOMException"===o.Stack(t.err).name){var n=new Error;n.name=t.err.name,n.message=t.err.message,n.stack=t.err.stack,n.nested=t.err,t.err=n}r(null,t)},handleItemWithError:function(t,e,r){if(t.data=t.data||{},t.err)try{t.stackInfo=t.err._savedStackTrace||o.parse(t.err,t.skipFrames),e.addErrorContext&&function(t){var e=[],r=t.err;for(e.push(r);r.nested||r.cause;)r=r.nested||r.cause,e.push(r);n.addErrorContext(t,e)}(t)}catch(e){i.error("Error while parsing the error object.",e);try{t.message=t.err.message||t.err.description||t.message||String(t.err)}catch(e){t.message=String(t.err)||String(e)}delete t.err}r(null,t)},ensureItemHasSomethingToSay:function(t,e,r){t.message||t.stackInfo||t.custom||r(new Error("No message, stack info, or custom data"),null),r(null,t)},addBaseInfo:function(t,e,r){var o=e.payload&&e.payload.environment||e.environment;t.data=n.merge(t.data,{environment:o,level:t.level,endpoint:e.endpoint,platform:"browser",framework:"browser-js",language:"javascript",server:{},uuid:t.uuid,notifier:{name:"rollbar-browser-js",version:e.version},custom:t.custom}),r(null,t)},addRequestInfo:function(t){return function(e,r,o){var i={};t&&t.location&&(i.url=t.location.href,i.query_string=t.location.search);var a="$remote_ip";r.captureIp?!0!==r.captureIp&&(a+="_anonymize"):a=null,a&&(i.user_ip=a),Object.keys(i).length>0&&n.set(e,"data.request",i),o(null,e)}},addClientInfo:function(t){return function(e,r,o){if(!t)return o(null,e);var i=t.navigator||{},a=t.screen||{};n.set(e,"data.client",{runtime_ms:e.timestamp-t._rollbarStartTime,timestamp:Math.round(e.timestamp/1e3),javascript:{browser:i.userAgent,language:i.language,cookie_enabled:i.cookieEnabled,screen:{width:a.width,height:a.height}}}),o(null,e)}},addPluginInfo:function(t){return function(e,r,o){if(!t||!t.navigator)return o(null,e);for(var i,a=[],s=t.navigator.plugins||[],u=0,c=s.length;u<c;++u)i=s[u],a.push({name:i.name,description:i.description});n.set(e,"data.client.javascript.plugins",a),o(null,e)}},addBody:function(t,e,r){t.stackInfo?t.stackInfo.traceChain?function(t,e,r){for(var o=t.stackInfo.traceChain,i=[],a=o.length,s=0;s<a;s++){var c=u(t,o[s],e);i.push(c)}n.set(t,"data.body",{trace_chain:i}),r(null,t)}(t,e,r):function(t,e,r){var i=s(t);if(i){var l=u(t,t.stackInfo,e);n.set(t,"data.body",{trace:l}),r(null,t)}else{var p=t.stackInfo,f=o.guessErrorClass(p.message),h=c(p,f[0],e),d=f[1];t.message=h+": "+d,a(t,0,r)}}(t,e,r):a(t,0,r)},addScrubber:function(t){return function(e,r,n){if(t){var o=r.scrubFields||[],i=r.scrubPaths||[];e.data=t(e.data,o,i)}n(null,e)}}}},511:function(t,e,r){var n=r(585);function o(t){this.startTime=n.now(),this.counter=0,this.perMinCounter=0,this.platform=null,this.platformOptions={},this.configureGlobal(t)}function i(t,e,r){return!t.ignoreRateLimit&&e>=1&&r>e}function a(t,e,r,n,o,i,a){var s=null;return r&&(r=new Error(r)),r||n||(s=function(t,e,r,n,o){var i=e.environment||e.payload&&e.payload.environment,a={body:{message:{body:o?"item per minute limit reached, ignoring errors until timeout":"maxItems has been hit, ignoring errors until reset.",extra:{maxItems:r,itemsPerMinute:n}}},language:"javascript",environment:i,notifier:{version:e.notifier&&e.notifier.version||e.version}};return"browser"===t?(a.platform="browser",a.framework="browser-js",a.notifier.name="rollbar-browser-js"):"server"===t?(a.framework=e.framework||"node-js",a.notifier.name=e.notifier.name):"react-native"===t&&(a.framework=e.framework||"react-native",a.notifier.name=e.notifier.name),a}(t,e,o,i,a)),{error:r,shouldSend:n,payload:s}}o.globalSettings={startTime:n.now(),maxItems:void 0,itemsPerMinute:void 0},o.prototype.configureGlobal=function(t){void 0!==t.startTime&&(o.globalSettings.startTime=t.startTime),void 0!==t.maxItems&&(o.globalSettings.maxItems=t.maxItems),void 0!==t.itemsPerMinute&&(o.globalSettings.itemsPerMinute=t.itemsPerMinute)},o.prototype.shouldSend=function(t,e){var r=(e=e||n.now())-this.startTime;(r<0||r>=6e4)&&(this.startTime=e,this.perMinCounter=0);var s=o.globalSettings.maxItems,u=o.globalSettings.itemsPerMinute;if(i(t,s,this.counter))return a(this.platform,this.platformOptions,s+" max items reached",!1);if(i(t,u,this.perMinCounter))return a(this.platform,this.platformOptions,u+" items per minute reached",!1);this.counter++,this.perMinCounter++;var c=!i(t,s,this.counter),l=c;return c=c&&!i(t,u,this.perMinCounter),a(this.platform,this.platformOptions,null,c,s,u,l)},o.prototype.setPlatformOptions=function(t,e){this.platform=t,this.platformOptions=e},t.exports=o},538:function(t){t.exports=function(t){var e,r,n,o,i,a,s,u,c,l,p,f,h,d=/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;function m(t){return t<10?"0"+t:t}function g(){return this.valueOf()}function v(t){return d.lastIndex=0,d.test(t)?'"'+t.replace(d,(function(t){var e=n[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)}))+'"':'"'+t+'"'}function y(t,n){var i,a,s,u,c,l=e,p=n[t];switch(p&&"object"==typeof p&&"function"==typeof p.toJSON&&(p=p.toJSON(t)),"function"==typeof o&&(p=o.call(n,t,p)),typeof p){case"string":return v(p);case"number":return isFinite(p)?String(p):"null";case"boolean":case"null":return String(p);case"object":if(!p)return"null";if(e+=r,c=[],"[object Array]"===Object.prototype.toString.apply(p)){for(u=p.length,i=0;i<u;i+=1)c[i]=y(i,p)||"null";return s=0===c.length?"[]":e?"[\n"+e+c.join(",\n"+e)+"\n"+l+"]":"["+c.join(",")+"]",e=l,s}if(o&&"object"==typeof o)for(u=o.length,i=0;i<u;i+=1)"string"==typeof o[i]&&(s=y(a=o[i],p))&&c.push(v(a)+(e?": ":":")+s);else for(a in p)Object.prototype.hasOwnProperty.call(p,a)&&(s=y(a,p))&&c.push(v(a)+(e?": ":":")+s);return s=0===c.length?"{}":e?"{\n"+e+c.join(",\n"+e)+"\n"+l+"}":"{"+c.join(",")+"}",e=l,s}}"function"!=typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+m(this.getUTCMonth()+1)+"-"+m(this.getUTCDate())+"T"+m(this.getUTCHours())+":"+m(this.getUTCMinutes())+":"+m(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=g,Number.prototype.toJSON=g,String.prototype.toJSON=g),"function"!=typeof t.stringify&&(n={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},t.stringify=function(t,n,i){var a;if(e="",r="","number"==typeof i)for(a=0;a<i;a+=1)r+=" ";else"string"==typeof i&&(r=i);if(o=n,n&&"function"!=typeof n&&("object"!=typeof n||"number"!=typeof n.length))throw new Error("JSON.stringify");return y("",{"":t})}),"function"!=typeof t.parse&&(t.parse=(l={"\\":"\\",'"':'"',"/":"/",t:"\t",n:"\n",r:"\r",f:"\f",b:"\b"},p={go:function(){i="ok"},firstokey:function(){u=c,i="colon"},okey:function(){u=c,i="colon"},ovalue:function(){i="ocomma"},firstavalue:function(){i="acomma"},avalue:function(){i="acomma"}},f={go:function(){i="ok"},ovalue:function(){i="ocomma"},firstavalue:function(){i="acomma"},avalue:function(){i="acomma"}},h={"{":{go:function(){a.push({state:"ok"}),s={},i="firstokey"},ovalue:function(){a.push({container:s,state:"ocomma",key:u}),s={},i="firstokey"},firstavalue:function(){a.push({container:s,state:"acomma"}),s={},i="firstokey"},avalue:function(){a.push({container:s,state:"acomma"}),s={},i="firstokey"}},"}":{firstokey:function(){var t=a.pop();c=s,s=t.container,u=t.key,i=t.state},ocomma:function(){var t=a.pop();s[u]=c,c=s,s=t.container,u=t.key,i=t.state}},"[":{go:function(){a.push({state:"ok"}),s=[],i="firstavalue"},ovalue:function(){a.push({container:s,state:"ocomma",key:u}),s=[],i="firstavalue"},firstavalue:function(){a.push({container:s,state:"acomma"}),s=[],i="firstavalue"},avalue:function(){a.push({container:s,state:"acomma"}),s=[],i="firstavalue"}},"]":{firstavalue:function(){var t=a.pop();c=s,s=t.container,u=t.key,i=t.state},acomma:function(){var t=a.pop();s.push(c),c=s,s=t.container,u=t.key,i=t.state}},":":{colon:function(){if(Object.hasOwnProperty.call(s,u))throw new SyntaxError("Duplicate key '"+u+'"');i="ovalue"}},",":{ocomma:function(){s[u]=c,i="okey"},acomma:function(){s.push(c),i="avalue"}},true:{go:function(){c=!0,i="ok"},ovalue:function(){c=!0,i="ocomma"},firstavalue:function(){c=!0,i="acomma"},avalue:function(){c=!0,i="acomma"}},false:{go:function(){c=!1,i="ok"},ovalue:function(){c=!1,i="ocomma"},firstavalue:function(){c=!1,i="acomma"},avalue:function(){c=!1,i="acomma"}},null:{go:function(){c=null,i="ok"},ovalue:function(){c=null,i="ocomma"},firstavalue:function(){c=null,i="acomma"},avalue:function(){c=null,i="acomma"}}},function(t,e){var r,n,o=/^[\u0020\t\n\r]*(?:([,:\[\]{}]|true|false|null)|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)|"((?:[^\r\n\t\\\"]|\\(?:["\\\/trnfb]|u[0-9a-fA-F]{4}))*)")/;i="go",a=[];try{for(;r=o.exec(t);)r[1]?h[r[1]][i]():r[2]?(c=+r[2],f[i]()):(n=r[3],c=n.replace(/\\(?:u(.{4})|([^u]))/g,(function(t,e,r){return e?String.fromCharCode(parseInt(e,16)):l[r]})),p[i]()),t=t.slice(r[0].length)}catch(t){i=t}if("ok"!==i||/[^\u0020\t\n\r]/.test(t))throw i instanceof SyntaxError?i:new SyntaxError("JSON");return"function"==typeof e?function t(r,n){var o,i,a=r[n];if(a&&"object"==typeof a)for(o in c)Object.prototype.hasOwnProperty.call(a,o)&&(void 0!==(i=t(a,o))?a[o]=i:delete a[o]);return e.call(r,n,a)}({"":c},""):c}))}},583:function(t,e,r){var n=r(949),o=r(585),i=r(49),a=r(144),s=r(262),u=r(751),c=r(587),l=r(485),p=r(960),f=r(746),h=r(379),d=r(136);function m(t,e){this.options=o.handleOptions(x,t,null,a),this.options._configuredOptions=t;var r=this.components.telemeter,s=this.components.instrumenter,d=this.components.polyfillJSON;this.wrapGlobals=this.components.wrapGlobals,this.scrub=this.components.scrub;var m=this.components.truncation,g=new u(m),v=new i(this.options,g,c,m);r&&(this.telemeter=new r(this.options)),this.client=e||new n(this.options,v,a,this.telemeter,"browser");var y=b(),w="undefined"!=typeof document&&document;this.isChrome=y.chrome&&y.chrome.runtime,this.anonymousErrorsPending=0,function(t,e,r){t.addTransform(l.handleDomException).addTransform(l.handleItemWithError).addTransform(l.ensureItemHasSomethingToSay).addTransform(l.addBaseInfo).addTransform(l.addRequestInfo(r)).addTransform(l.addClientInfo(r)).addTransform(l.addPluginInfo(r)).addTransform(l.addBody).addTransform(p.addMessageWithError).addTransform(p.addTelemetryData).addTransform(p.addConfigToPayload).addTransform(l.addScrubber(e.scrub)).addTransform(p.addPayloadOptions).addTransform(p.userTransform(a)).addTransform(p.addConfiguredOptions).addTransform(p.addDiagnosticKeys).addTransform(p.itemToPayload)}(this.client.notifier,this,y),this.client.queue.addPredicate(h.checkLevel).addPredicate(f.checkIgnore).addPredicate(h.userCheckIgnore(a)).addPredicate(h.urlIsNotBlockListed(a)).addPredicate(h.urlIsSafeListed(a)).addPredicate(h.messageIsIgnored(a)),this.setupUnhandledCapture(),s&&(this.instrumenter=new s(this.options,this.client.telemeter,this,y,w),this.instrumenter.instrument()),o.setupJSON(d),this.rollbar=this}var g=null;function v(t){var e="Rollbar is not initialized";a.error(e),t&&t(new Error(e))}function y(t){for(var e=0,r=t.length;e<r;++e)if(o.isFunction(t[e]))return t[e]}function b(){return"undefined"!=typeof window&&window||"undefined"!=typeof self&&self}m.init=function(t,e){return g?g.global(t).configure(t):g=new m(t,e)},m.prototype.components={},m.setComponents=function(t){m.prototype.components=t},m.prototype.global=function(t){return this.client.global(t),this},m.global=function(t){if(g)return g.global(t);v()},m.prototype.configure=function(t,e){var r=this.options,n={};return e&&(n={payload:e}),this.options=o.handleOptions(r,t,n,a),this.options._configuredOptions=o.handleOptions(r._configuredOptions,t,n),this.client.configure(this.options,e),this.instrumenter&&this.instrumenter.configure(this.options),this.setupUnhandledCapture(),this},m.configure=function(t,e){if(g)return g.configure(t,e);v()},m.prototype.lastError=function(){return this.client.lastError},m.lastError=function(){if(g)return g.lastError();v()},m.prototype.log=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.log(t),{uuid:e}},m.log=function(){if(g)return g.log.apply(g,arguments);v(y(arguments))},m.prototype.debug=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.debug(t),{uuid:e}},m.debug=function(){if(g)return g.debug.apply(g,arguments);v(y(arguments))},m.prototype.info=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.info(t),{uuid:e}},m.info=function(){if(g)return g.info.apply(g,arguments);v(y(arguments))},m.prototype.warn=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.warn(t),{uuid:e}},m.warn=function(){if(g)return g.warn.apply(g,arguments);v(y(arguments))},m.prototype.warning=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.warning(t),{uuid:e}},m.warning=function(){if(g)return g.warning.apply(g,arguments);v(y(arguments))},m.prototype.error=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.error(t),{uuid:e}},m.error=function(){if(g)return g.error.apply(g,arguments);v(y(arguments))},m.prototype.critical=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.critical(t),{uuid:e}},m.critical=function(){if(g)return g.critical.apply(g,arguments);v(y(arguments))},m.prototype.buildJsonPayload=function(t){return this.client.buildJsonPayload(t)},m.buildJsonPayload=function(){if(g)return g.buildJsonPayload.apply(g,arguments);v()},m.prototype.sendJsonPayload=function(t){return this.client.sendJsonPayload(t)},m.sendJsonPayload=function(){if(g)return g.sendJsonPayload.apply(g,arguments);v()},m.prototype.setupUnhandledCapture=function(){var t=b();this.unhandledExceptionsInitialized||(this.options.captureUncaught||this.options.handleUncaughtExceptions)&&(s.captureUncaughtExceptions(t,this),this.wrapGlobals&&this.options.wrapGlobalEventHandlers&&this.wrapGlobals(t,this),this.unhandledExceptionsInitialized=!0),this.unhandledRejectionsInitialized||(this.options.captureUnhandledRejections||this.options.handleUnhandledRejections)&&(s.captureUnhandledRejections(t,this),this.unhandledRejectionsInitialized=!0)},m.prototype.handleUncaughtException=function(t,e,r,n,i,a){if(this.options.captureUncaught||this.options.handleUncaughtExceptions){if(this.options.inspectAnonymousErrors&&this.isChrome&&null===i&&""===e)return"anonymous";var s,u=o.makeUnhandledStackInfo(t,e,r,n,i,"onerror","uncaught exception",d);o.isError(i)?(s=this._createItem([t,i,a]))._unhandledStackInfo=u:o.isError(e)?(s=this._createItem([t,e,a]))._unhandledStackInfo=u:(s=this._createItem([t,a])).stackInfo=u,s.level=this.options.uncaughtErrorLevel,s._isUncaught=!0,this.client.log(s)}},m.prototype.handleAnonymousErrors=function(){if(this.options.inspectAnonymousErrors&&this.isChrome){var t=this;try{Error.prepareStackTrace=function(e,r){if(t.options.inspectAnonymousErrors&&t.anonymousErrorsPending){if(t.anonymousErrorsPending-=1,!e)return;e._isAnonymous=!0,t.handleUncaughtException(e.message,null,null,null,e)}return e.stack}}catch(t){this.options.inspectAnonymousErrors=!1,this.error("anonymous error handler failed",t)}}},m.prototype.handleUnhandledRejection=function(t,e){if(this.options.captureUnhandledRejections||this.options.handleUnhandledRejections){var r="unhandled rejection was null or undefined!";if(t)if(t.message)r=t.message;else{var n=o.stringify(t);n.value&&(r=n.value)}var i,a=t&&t._rollbarContext||e&&e._rollbarContext;o.isError(t)?i=this._createItem([r,t,a]):(i=this._createItem([r,t,a])).stackInfo=o.makeUnhandledStackInfo(r,"",0,0,null,"unhandledrejection","",d),i.level=this.options.uncaughtErrorLevel,i._isUncaught=!0,i._originalArgs=i._originalArgs||[],i._originalArgs.push(e),this.client.log(i)}},m.prototype.wrap=function(t,e,r){try{var n;if(n=o.isFunction(e)?e:function(){return e||{}},!o.isFunction(t))return t;if(t._isWrap)return t;if(!t._rollbar_wrapped&&(t._rollbar_wrapped=function(){r&&o.isFunction(r)&&r.apply(this,arguments);try{return t.apply(this,arguments)}catch(r){var e=r;throw e&&window._rollbarWrappedError!==e&&(o.isType(e,"string")&&(e=new String(e)),e._rollbarContext=n()||{},e._rollbarContext._wrappedSource=t.toString(),window._rollbarWrappedError=e),e}},t._rollbar_wrapped._isWrap=!0,t.hasOwnProperty))for(var i in t)t.hasOwnProperty(i)&&"_rollbar_wrapped"!==i&&(t._rollbar_wrapped[i]=t[i]);return t._rollbar_wrapped}catch(e){return t}},m.wrap=function(t,e){if(g)return g.wrap(t,e);v()},m.prototype.captureEvent=function(){var t=o.createTelemetryEvent(arguments);return this.client.captureEvent(t.type,t.metadata,t.level)},m.captureEvent=function(){if(g)return g.captureEvent.apply(g,arguments);v()},m.prototype.captureDomContentLoaded=function(t,e){return e||(e=new Date),this.client.captureDomContentLoaded(e)},m.prototype.captureLoad=function(t,e){return e||(e=new Date),this.client.captureLoad(e)},m.prototype.loadFull=function(){a.info("Unexpected Rollbar.loadFull() called on a Notifier instance. This can happen when Rollbar is loaded multiple times.")},m.prototype._createItem=function(t){return o.createItem(t,a,this)};var w=r(299),_=r(699),x={version:w.version,scrubFields:_.scrubFields,logLevel:w.logLevel,reportLevel:w.reportLevel,uncaughtErrorLevel:w.uncaughtErrorLevel,endpoint:w.endpoint,verbose:!1,enabled:!0,transmit:!0,sendConfig:!1,includeItemsInTelemetry:!0,captureIp:!0,inspectAnonymousErrors:!0,ignoreDuplicateErrors:!0,wrapGlobalEventHandlers:!1};t.exports=m},585:function(t,e,r){function n(t){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n(t)}var o=r(965),i={};function a(t,e){return e===s(t)}function s(t){var e=n(t);return"object"!==e?e:t?t instanceof Error?"error":{}.toString.call(t).match(/\s([a-zA-Z]+)/)[1].toLowerCase():"null"}function u(t){return a(t,"function")}function c(t){var e=Function.prototype.toString.call(Object.prototype.hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?"),r=RegExp("^"+e+"$");return l(t)&&r.test(t)}function l(t){var e=n(t);return null!=t&&("object"==e||"function"==e)}function p(){var t=b();return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(function(e){var r=(t+16*Math.random())%16|0;return t=Math.floor(t/16),("x"===e?r:7&r|8).toString(16)}))}var f={strictMode:!1,key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}};function h(t,e){var r,n;try{r=i.stringify(t)}catch(o){if(e&&u(e))try{r=e(t)}catch(t){n=t}else n=o}return{error:n,value:r}}function d(t,e){return function(r,n){try{e(r,n)}catch(e){t.error(e)}}}function m(t){return function t(e,r){var n,o,i,u={};try{for(o in e)(n=e[o])&&(a(n,"object")||a(n,"array"))?r.includes(n)?u[o]="Removed circular reference: "+s(n):((i=r.slice()).push(n),u[o]=t(n,i)):u[o]=n}catch(t){u="Failed cloning custom data: "+t.message}return u}(t,[t])}var g=["log","network","dom","navigation","error","manual"],v=["critical","error","warning","info","debug"];function y(t,e){for(var r=0;r<t.length;++r)if(t[r]===e)return!0;return!1}function b(){return Date.now?+Date.now():+new Date}t.exports={addParamsAndAccessTokenToPath:function(t,e,r){(r=r||{}).access_token=t;var n,o=[];for(n in r)Object.prototype.hasOwnProperty.call(r,n)&&o.push([n,r[n]].join("="));var i="?"+o.sort().join("&");(e=e||{}).path=e.path||"";var a,s=e.path.indexOf("?"),u=e.path.indexOf("#");-1!==s&&(-1===u||u>s)?(a=e.path,e.path=a.substring(0,s)+i+"&"+a.substring(s+1)):-1!==u?(a=e.path,e.path=a.substring(0,u)+i+a.substring(u)):e.path=e.path+i},createItem:function(t,e,r,n,o){for(var i,a,u,c,l,f,h=[],g=[],v=0,y=t.length;v<y;++v){var w=s(f=t[v]);switch(g.push(w),w){case"undefined":break;case"string":i?h.push(f):i=f;break;case"function":c=d(e,f);break;case"date":h.push(f);break;case"error":case"domexception":case"exception":a?h.push(f):a=f;break;case"object":case"array":if(f instanceof Error||"undefined"!=typeof DOMException&&f instanceof DOMException){a?h.push(f):a=f;break}if(n&&"object"===w&&!l){for(var _=0,x=n.length;_<x;++_)if(void 0!==f[n[_]]){l=f;break}if(l)break}u?h.push(f):u=f;break;default:if(f instanceof Error||"undefined"!=typeof DOMException&&f instanceof DOMException){a?h.push(f):a=f;break}h.push(f)}}u&&(u=m(u)),h.length>0&&(u||(u=m({})),u.extraArgs=m(h));var k={message:i,err:a,custom:u,timestamp:b(),callback:c,notifier:r,diagnostic:{},uuid:p()};return function(t,e){e&&void 0!==e.level&&(t.level=e.level,delete e.level),e&&void 0!==e.skipFrames&&(t.skipFrames=e.skipFrames,delete e.skipFrames)}(k,u),n&&l&&(k.request=l),o&&(k.lambdaContext=o),k._originalArgs=t,k.diagnostic.original_arg_types=g,k},addErrorContext:function(t,e){var r=t.data.custom||{},n=!1;try{for(var i=0;i<e.length;++i)e[i].hasOwnProperty("rollbarContext")&&(r=o(r,m(e[i].rollbarContext)),n=!0);n&&(t.data.custom=r)}catch(e){t.diagnostic.error_context="Failed: "+e.message}},createTelemetryEvent:function(t){for(var e,r,n,o,i=0,a=t.length;i<a;++i)switch(s(o=t[i])){case"string":!e&&y(g,o)?e=o:!n&&y(v,o)&&(n=o);break;case"object":r=o}return{type:e||"manual",metadata:r||{},level:n}},filterIp:function(t,e){if(t&&t.user_ip&&!0!==e){var r=t.user_ip;if(e)try{var n;if(-1!==r.indexOf("."))(n=r.split(".")).pop(),n.push("0"),r=n.join(".");else if(-1!==r.indexOf(":")){if((n=r.split(":")).length>2){var o=n.slice(0,3),i=o[2].indexOf("/");-1!==i&&(o[2]=o[2].substring(0,i)),r=o.concat("0000:0000:0000:0000:0000").join(":")}}else r=null}catch(t){r=null}else r=null;t.user_ip=r}},formatArgsAsString:function(t){var e,r,n,o=[];for(e=0,r=t.length;e<r;++e){switch(s(n=t[e])){case"object":(n=(n=h(n)).error||n.value).length>500&&(n=n.substr(0,497)+"...");break;case"null":n="null";break;case"undefined":n="undefined";break;case"symbol":n=n.toString()}o.push(n)}return o.join(" ")},formatUrl:function(t,e){if(!(e=e||t.protocol)&&t.port&&(80===t.port?e="http:":443===t.port&&(e="https:")),e=e||"https:",!t.hostname)return null;var r=e+"//"+t.hostname;return t.port&&(r=r+":"+t.port),t.path&&(r+=t.path),r},get:function(t,e){if(t){var r=e.split("."),n=t;try{for(var o=0,i=r.length;o<i;++o)n=n[r[o]]}catch(t){n=void 0}return n}},handleOptions:function(t,e,r,n){var i=o(t,e,r);return i=function(t,e){return t.hostWhiteList&&!t.hostSafeList&&(t.hostSafeList=t.hostWhiteList,t.hostWhiteList=void 0,e&&e.log("hostWhiteList is deprecated. Use hostSafeList.")),t.hostBlackList&&!t.hostBlockList&&(t.hostBlockList=t.hostBlackList,t.hostBlackList=void 0,e&&e.log("hostBlackList is deprecated. Use hostBlockList.")),t}(i,n),!e||e.overwriteScrubFields||e.scrubFields&&(i.scrubFields=(t.scrubFields||[]).concat(e.scrubFields)),i},isError:function(t){return a(t,"error")||a(t,"exception")},isFiniteNumber:function(t){return Number.isFinite(t)},isFunction:u,isIterable:function(t){var e=s(t);return"object"===e||"array"===e},isNativeFunction:c,isObject:l,isString:function(t){return"string"==typeof t||t instanceof String},isType:a,isPromise:function(t){return l(t)&&a(t.then,"function")},jsonParse:function(t){var e,r;try{e=i.parse(t)}catch(t){r=t}return{error:r,value:e}},LEVELS:{debug:0,info:1,warning:2,error:3,critical:4},makeUnhandledStackInfo:function(t,e,r,n,o,i,a,s){var u={url:e||"",line:r,column:n};u.func=s.guessFunctionName(u.url,u.line),u.context=s.gatherContext(u.url,u.line);var c="undefined"!=typeof document&&document&&document.location&&document.location.href,l="undefined"!=typeof window&&window&&window.navigator&&window.navigator.userAgent;return{mode:i,message:o?String(o):t||a,url:c,stack:[u],useragent:l}},merge:o,now:b,redact:function(){return"********"},RollbarJSON:i,sanitizeUrl:function(t){var e=function(t){if(a(t,"string")){for(var e=f,r=e.parser[e.strictMode?"strict":"loose"].exec(t),n={},o=0,i=e.key.length;o<i;++o)n[e.key[o]]=r[o]||"";return n[e.q.name]={},n[e.key[12]].replace(e.q.parser,(function(t,r,o){r&&(n[e.q.name][r]=o)})),n}}(t);return e?(""===e.anchor&&(e.source=e.source.replace("#","")),t=e.source.replace("?"+e.query,"")):"(unknown)"},set:function(t,e,r){if(t){var n=e.split("."),o=n.length;if(!(o<1))if(1!==o)try{for(var i=t[n[0]]||{},a=i,s=1;s<o-1;++s)i[n[s]]=i[n[s]]||{},i=i[n[s]];i[n[o-1]]=r,t[n[0]]=a}catch(t){return}else t[n[0]]=r}},setupJSON:function(t){u(i.stringify)&&u(i.parse)||(a(JSON,"undefined")||(t?(c(JSON.stringify)&&(i.stringify=JSON.stringify),c(JSON.parse)&&(i.parse=JSON.parse)):(u(JSON.stringify)&&(i.stringify=JSON.stringify),u(JSON.parse)&&(i.parse=JSON.parse))),u(i.stringify)&&u(i.parse)||t&&t(i))},stringify:h,maxByteSize:function(t){for(var e=0,r=t.length,n=0;n<r;n++){var o=t.charCodeAt(n);o<128?e+=1:o<2048?e+=2:o<65536&&(e+=3)}return e},typeName:s,uuid4:p}},587:function(t){t.exports={parse:function(t){var e,r,n={protocol:null,auth:null,host:null,path:null,hash:null,href:t,hostname:null,port:null,pathname:null,search:null,query:null};if(-1!==(e=t.indexOf("//"))?(n.protocol=t.substring(0,e),r=e+2):r=0,-1!==(e=t.indexOf("@",r))&&(n.auth=t.substring(r,e),r=e+1),-1===(e=t.indexOf("/",r))){if(-1===(e=t.indexOf("?",r)))return-1===(e=t.indexOf("#",r))?n.host=t.substring(r):(n.host=t.substring(r,e),n.hash=t.substring(e)),n.hostname=n.host.split(":")[0],n.port=n.host.split(":")[1],n.port&&(n.port=parseInt(n.port,10)),n;n.host=t.substring(r,e),n.hostname=n.host.split(":")[0],n.port=n.host.split(":")[1],n.port&&(n.port=parseInt(n.port,10)),r=e}else n.host=t.substring(r,e),n.hostname=n.host.split(":")[0],n.port=n.host.split(":")[1],n.port&&(n.port=parseInt(n.port,10)),r=e;if(-1===(e=t.indexOf("#",r))?n.path=t.substring(r):(n.path=t.substring(r,e),n.hash=t.substring(e)),n.path){var o=n.path.split("?");n.pathname=o[0],n.query=o[1],n.search=n.query?"?"+n.query:null}return n}}},618:function(t,e,r){var n=r(585),o=100;function i(t){this.queue=[],this.options=n.merge(t);var e=this.options.maxTelemetryEvents||o;this.maxQueueSize=Math.max(0,Math.min(e,o))}function a(t,e){return e||({error:"error",manual:"info"}[t]||"info")}i.prototype.configure=function(t){var e=this.options;this.options=n.merge(e,t);var r=this.options.maxTelemetryEvents||o,i=Math.max(0,Math.min(r,o)),a=0;this.queue.length>i&&(a=this.queue.length-i),this.maxQueueSize=i,this.queue.splice(0,a)},i.prototype.copyEvents=function(){var t=Array.prototype.slice.call(this.queue,0);if(n.isFunction(this.options.filterTelemetry))try{for(var e=t.length;e--;)this.options.filterTelemetry(t[e])&&t.splice(e,1)}catch(t){this.options.filterTelemetry=null}return t},i.prototype.capture=function(t,e,r,o,i){var s={level:a(t,r),type:t,timestamp_ms:i||n.now(),body:e,source:"client"};o&&(s.uuid=o);try{if(n.isFunction(this.options.filterTelemetry)&&this.options.filterTelemetry(s))return!1}catch(t){this.options.filterTelemetry=null}return this.push(s),s},i.prototype.captureEvent=function(t,e,r,n){return this.capture(t,e,r,n)},i.prototype.captureError=function(t,e,r,n){var o={message:t.message||String(t)};return t.stack&&(o.stack=t.stack),this.capture("error",o,e,r,n)},i.prototype.captureLog=function(t,e,r,n){return this.capture("log",{message:t},e,r,n)},i.prototype.captureNetwork=function(t,e,r,n){e=e||"xhr",t.subtype=t.subtype||e,n&&(t.request=n);var o=this.levelFromStatus(t.status_code);return this.capture("network",t,o,r)},i.prototype.levelFromStatus=function(t){return t>=200&&t<400?"info":0===t||t>=400?"error":"info"},i.prototype.captureDom=function(t,e,r,n,o){var i={subtype:t,element:e};return void 0!==r&&(i.value=r),void 0!==n&&(i.checked=n),this.capture("dom",i,"info",o)},i.prototype.captureNavigation=function(t,e,r){return this.capture("navigation",{from:t,to:e},"info",r)},i.prototype.captureDomContentLoaded=function(t){return this.capture("navigation",{subtype:"DOMContentLoaded"},"info",void 0,t&&t.getTime())},i.prototype.captureLoad=function(t){return this.capture("navigation",{subtype:"load"},"info",void 0,t&&t.getTime())},i.prototype.captureConnectivityChange=function(t,e){return this.captureNetwork({change:t},"connectivity",e)},i.prototype._captureRollbarItem=function(t){if(this.options.includeItemsInTelemetry)return t.err?this.captureError(t.err,t.level,t.uuid,t.timestamp):t.message?this.captureLog(t.message,t.level,t.uuid,t.timestamp):t.custom?this.capture("log",t.custom,t.level,t.uuid,t.timestamp):void 0},i.prototype.push=function(t){this.queue.push(t),this.queue.length>this.maxQueueSize&&this.queue.shift()},t.exports=i},622:function(t,e,r){var n=r(585),o=r(98);function i(t,e){return[t,n.stringify(t,e)]}function a(t,e){var r=t.length;return r>2*e?t.slice(0,e).concat(t.slice(r-e)):t}function s(t,e,r){r=void 0===r?30:r;var o,i=t.data.body;if(i.trace_chain)for(var s=i.trace_chain,u=0;u<s.length;u++)o=a(o=s[u].frames,r),s[u].frames=o;else i.trace&&(o=a(o=i.trace.frames,r),i.trace.frames=o);return[t,n.stringify(t,e)]}function u(t,e){return e&&e.length>t?e.slice(0,t-3).concat("..."):e}function c(t,e,r){return e=o(e,(function e(r,i,a){switch(n.typeName(i)){case"string":return u(t,i);case"object":case"array":return o(i,e,a);default:return i}})),[e,n.stringify(e,r)]}function l(t){return t.exception&&(delete t.exception.description,t.exception.message=u(255,t.exception.message)),t.frames=a(t.frames,1),t}function p(t,e){var r=t.data.body;if(r.trace_chain)for(var o=r.trace_chain,i=0;i<o.length;i++)o[i]=l(o[i]);else r.trace&&(r.trace=l(r.trace));return[t,n.stringify(t,e)]}function f(t,e){return n.maxByteSize(t)>e}t.exports={truncate:function(t,e,r){r=void 0===r?524288:r;for(var n,o,a,u=[i,s,c.bind(null,1024),c.bind(null,512),c.bind(null,256),p];n=u.shift();)if(t=(o=n(t,e))[0],(a=o[1]).error||!f(a.value,r))return a;return a},raw:i,truncateFrames:s,truncateStrings:c,maybeTruncateValue:u}},629:function(t){var e={ieVersion:function(){var t;if("undefined"==typeof document)return t;for(var e=3,r=document.createElement("div"),n=r.getElementsByTagName("i");r.innerHTML="\x3c!--[if gt IE "+ ++e+"]><i></i><![endif]--\x3e",n[0];);return e>4?e:t}};t.exports=e},657:function(t,e,r){var n=r(538);t.exports=n},699:function(t){t.exports={scrubFields:["pw","pass","passwd","password","secret","confirm_password","confirmPassword","password_confirmation","passwordConfirmation","access_token","accessToken","X-Rollbar-Access-Token","secret_key","secretKey","secretToken","cc-number","card number","cardnumber","cardnum","ccnum","ccnumber","cc num","creditcardnumber","credit card number","newcreditcardnumber","new credit card","creditcardno","credit card no","card#","card #","cc-csc","cvc","cvc2","cvv2","ccv2","security code","card verification","name on credit card","name on card","nameoncard","cardholder","card holder","name des karteninhabers","ccname","card type","cardtype","cc type","cctype","payment type","expiration date","expirationdate","expdate","cc-exp","ccmonth","ccyear"]}},705:function(t,e,r){var n=r(585),o=r(736),i=r(398),a=r(922),s=r(587),u=r(392),c={network:!0,networkResponseHeaders:!1,networkResponseBody:!1,networkRequestHeaders:!1,networkRequestBody:!1,networkErrorOnHttp5xx:!1,networkErrorOnHttp4xx:!1,networkErrorOnHttp0:!1,log:!0,dom:!0,navigation:!0,connectivity:!0,contentSecurityPolicy:!0,errorOnContentSecurityPolicy:!1};function l(t,e){for(var r;t[e].length;)(r=t[e].shift())[0][r[1]]=r[2]}function p(t,e,r,o,i){this.options=t;var a=t.autoInstrument;!1===t.enabled||!1===a?this.autoInstrument={}:(n.isType(a,"object")||(a=c),this.autoInstrument=n.merge(c,a)),this.scrubTelemetryInputs=!!t.scrubTelemetryInputs,this.telemetryScrubber=t.telemetryScrubber,this.defaultValueScrubber=function(t){for(var e=[],r=0;r<t.length;++r)e.push(new RegExp(t[r],"i"));return function(t){var r=function(t){if(!t||!t.attributes)return null;for(var e=t.attributes,r=0;r<e.length;++r)if("name"===e[r].key)return e[r].value;return null}(t);if(!r)return!1;for(var n=0;n<e.length;++n)if(e[n].test(r))return!0;return!1}}(t.scrubFields),this.telemeter=e,this.rollbar=r,this.diagnostic=r.client.notifier.diagnostic,this._window=o||{},this._document=i||{},this.replacements={network:[],log:[],navigation:[],connectivity:[]},this.eventRemovers={dom:[],connectivity:[],contentsecuritypolicy:[]},this._location=this._window.location,this._lastHref=this._location&&this._location.href}function f(t){return"undefined"!=typeof URL&&t instanceof URL}p.prototype.configure=function(t){this.options=n.merge(this.options,t);var e=t.autoInstrument,r=n.merge(this.autoInstrument);!1===t.enabled||!1===e?this.autoInstrument={}:(n.isType(e,"object")||(e=c),this.autoInstrument=n.merge(c,e)),this.instrument(r),void 0!==t.scrubTelemetryInputs&&(this.scrubTelemetryInputs=!!t.scrubTelemetryInputs),void 0!==t.telemetryScrubber&&(this.telemetryScrubber=t.telemetryScrubber)},p.prototype.instrument=function(t){!this.autoInstrument.network||t&&t.network?!this.autoInstrument.network&&t&&t.network&&this.deinstrumentNetwork():this.instrumentNetwork(),!this.autoInstrument.log||t&&t.log?!this.autoInstrument.log&&t&&t.log&&this.deinstrumentConsole():this.instrumentConsole(),!this.autoInstrument.dom||t&&t.dom?!this.autoInstrument.dom&&t&&t.dom&&this.deinstrumentDom():this.instrumentDom(),!this.autoInstrument.navigation||t&&t.navigation?!this.autoInstrument.navigation&&t&&t.navigation&&this.deinstrumentNavigation():this.instrumentNavigation(),!this.autoInstrument.connectivity||t&&t.connectivity?!this.autoInstrument.connectivity&&t&&t.connectivity&&this.deinstrumentConnectivity():this.instrumentConnectivity(),!this.autoInstrument.contentSecurityPolicy||t&&t.contentSecurityPolicy?!this.autoInstrument.contentSecurityPolicy&&t&&t.contentSecurityPolicy&&this.deinstrumentContentSecurityPolicy():this.instrumentContentSecurityPolicy()},p.prototype.deinstrumentNetwork=function(){l(this.replacements,"network")},p.prototype.instrumentNetwork=function(){var t=this;function e(e,r){e in r&&n.isFunction(r[e])&&i(r,e,(function(e){return t.rollbar.wrap(e)}))}if("XMLHttpRequest"in this._window){var r=this._window.XMLHttpRequest.prototype;i(r,"open",(function(t){return function(e,r){var o=f(r);return(n.isType(r,"string")||o)&&(r=o?r.toString():r,this.__rollbar_xhr?(this.__rollbar_xhr.method=e,this.__rollbar_xhr.url=r,this.__rollbar_xhr.status_code=null,this.__rollbar_xhr.start_time_ms=n.now(),this.__rollbar_xhr.end_time_ms=null):this.__rollbar_xhr={method:e,url:r,status_code:null,start_time_ms:n.now(),end_time_ms:null}),t.apply(this,arguments)}}),this.replacements,"network"),i(r,"setRequestHeader",(function(e){return function(r,o){return this.__rollbar_xhr||(this.__rollbar_xhr={}),n.isType(r,"string")&&n.isType(o,"string")&&(t.autoInstrument.networkRequestHeaders&&(this.__rollbar_xhr.request_headers||(this.__rollbar_xhr.request_headers={}),this.__rollbar_xhr.request_headers[r]=o),"content-type"===r.toLowerCase()&&(this.__rollbar_xhr.request_content_type=o)),e.apply(this,arguments)}}),this.replacements,"network"),i(r,"send",(function(r){return function(o){var a=this;function s(){if(a.__rollbar_xhr&&(null===a.__rollbar_xhr.status_code&&(a.__rollbar_xhr.status_code=0,t.autoInstrument.networkRequestBody&&(a.__rollbar_xhr.request=o),a.__rollbar_event=t.captureNetwork(a.__rollbar_xhr,"xhr",void 0)),a.readyState<2&&(a.__rollbar_xhr.start_time_ms=n.now()),a.readyState>3)){a.__rollbar_xhr.end_time_ms=n.now();var e=null;if(a.__rollbar_xhr.response_content_type=a.getResponseHeader("Content-Type"),t.autoInstrument.networkResponseHeaders){var r=t.autoInstrument.networkResponseHeaders;e={};try{var i,s;if(!0===r){var u=a.getAllResponseHeaders();if(u){var c,l,p=u.trim().split(/[\r\n]+/);for(s=0;s<p.length;s++)i=(c=p[s].split(": ")).shift(),l=c.join(": "),e[i]=l}}else for(s=0;s<r.length;s++)e[i=r[s]]=a.getResponseHeader(i)}catch(t){}}var f=null;if(t.autoInstrument.networkResponseBody)try{f=a.responseText}catch(t){}var h=null;(f||e)&&(h={},f&&(t.isJsonContentType(a.__rollbar_xhr.response_content_type)?h.body=t.scrubJson(f):h.body=f),e&&(h.headers=e)),h&&(a.__rollbar_xhr.response=h);try{var d=a.status;d=1223===d?204:d,a.__rollbar_xhr.status_code=d,a.__rollbar_event.level=t.telemeter.levelFromStatus(d),t.errorOnHttpStatus(a.__rollbar_xhr)}catch(t){}}}return e("onload",a),e("onerror",a),e("onprogress",a),"onreadystatechange"in a&&n.isFunction(a.onreadystatechange)?i(a,"onreadystatechange",(function(e){return t.rollbar.wrap(e,void 0,s)})):a.onreadystatechange=s,a.__rollbar_xhr&&t.trackHttpErrors()&&(a.__rollbar_xhr.stack=(new Error).stack),r.apply(this,arguments)}}),this.replacements,"network")}"fetch"in this._window&&i(this._window,"fetch",(function(e){return function(r,i){for(var a=new Array(arguments.length),s=0,u=a.length;s<u;s++)a[s]=arguments[s];var c,l=a[0],p="GET",h=f(l);n.isType(l,"string")||h?c=h?l.toString():l:l&&(c=l.url,l.method&&(p=l.method)),a[1]&&a[1].method&&(p=a[1].method);var d={method:p,url:c,status_code:null,start_time_ms:n.now(),end_time_ms:null};if(a[1]&&a[1].headers){var m=o(a[1].headers);d.request_content_type=m.get("Content-Type"),t.autoInstrument.networkRequestHeaders&&(d.request_headers=t.fetchHeaders(m,t.autoInstrument.networkRequestHeaders))}return t.autoInstrument.networkRequestBody&&(a[1]&&a[1].body?d.request=a[1].body:a[0]&&!n.isType(a[0],"string")&&a[0].body&&(d.request=a[0].body)),t.captureNetwork(d,"fetch",void 0),t.trackHttpErrors()&&(d.stack=(new Error).stack),e.apply(this,a).then((function(e){d.end_time_ms=n.now(),d.status_code=e.status,d.response_content_type=e.headers.get("Content-Type");var r=null;t.autoInstrument.networkResponseHeaders&&(r=t.fetchHeaders(e.headers,t.autoInstrument.networkResponseHeaders));var o=null;return t.autoInstrument.networkResponseBody&&"function"==typeof e.text&&(o=e.clone().text()),(r||o)&&(d.response={},o&&("function"==typeof o.then?o.then((function(e){e&&t.isJsonContentType(d.response_content_type)?d.response.body=t.scrubJson(e):d.response.body=e})):d.response.body=o),r&&(d.response.headers=r)),t.errorOnHttpStatus(d),e}))}}),this.replacements,"network")},p.prototype.captureNetwork=function(t,e,r){return t.request&&this.isJsonContentType(t.request_content_type)&&(t.request=this.scrubJson(t.request)),this.telemeter.captureNetwork(t,e,r)},p.prototype.isJsonContentType=function(t){return!!(t&&n.isType(t,"string")&&t.toLowerCase().includes("json"))},p.prototype.scrubJson=function(t){return JSON.stringify(a(JSON.parse(t),this.options.scrubFields))},p.prototype.fetchHeaders=function(t,e){var r={};try{var n;if(!0===e){if("function"==typeof t.entries)for(var o=t.entries(),i=o.next();!i.done;)r[i.value[0]]=i.value[1],i=o.next()}else for(n=0;n<e.length;n++){var a=e[n];r[a]=t.get(a)}}catch(t){}return r},p.prototype.trackHttpErrors=function(){return this.autoInstrument.networkErrorOnHttp5xx||this.autoInstrument.networkErrorOnHttp4xx||this.autoInstrument.networkErrorOnHttp0},p.prototype.errorOnHttpStatus=function(t){var e=t.status_code;if(e>=500&&this.autoInstrument.networkErrorOnHttp5xx||e>=400&&this.autoInstrument.networkErrorOnHttp4xx||0===e&&this.autoInstrument.networkErrorOnHttp0){var r=new Error("HTTP request failed with Status "+e);r.stack=t.stack,this.rollbar.error(r,{skipFrames:1})}},p.prototype.deinstrumentConsole=function(){if("console"in this._window&&this._window.console.log)for(var t;this.replacements.log.length;)t=this.replacements.log.shift(),this._window.console[t[0]]=t[1]},p.prototype.instrumentConsole=function(){if("console"in this._window&&this._window.console.log){var t=this,e=this._window.console,r=["debug","info","warn","error","log"];try{for(var o=0,i=r.length;o<i;o++)a(r[o])}catch(t){this.diagnostic.instrumentConsole={error:t.message}}}function a(r){"use strict";var o=e[r],i=e,a="warn"===r?"warning":r;e[r]=function(){var e=Array.prototype.slice.call(arguments),r=n.formatArgsAsString(e);t.telemeter.captureLog(r,a),o&&Function.prototype.apply.call(o,i,e)},t.replacements.log.push([r,o])}},p.prototype.deinstrumentDom=function(){("addEventListener"in this._window||"attachEvent"in this._window)&&this.removeListeners("dom")},p.prototype.instrumentDom=function(){if("addEventListener"in this._window||"attachEvent"in this._window){var t=this.handleClick.bind(this),e=this.handleBlur.bind(this);this.addListener("dom",this._window,"click","onclick",t,!0),this.addListener("dom",this._window,"blur","onfocusout",e,!0)}},p.prototype.handleClick=function(t){try{var e=u.getElementFromEvent(t,this._document),r=e&&e.tagName,n=u.isDescribedElement(e,"a")||u.isDescribedElement(e,"button");r&&(n||u.isDescribedElement(e,"input",["button","submit"]))?this.captureDomEvent("click",e):u.isDescribedElement(e,"input",["checkbox","radio"])&&this.captureDomEvent("input",e,e.value,e.checked)}catch(t){}},p.prototype.handleBlur=function(t){try{var e=u.getElementFromEvent(t,this._document);e&&e.tagName&&(u.isDescribedElement(e,"textarea")?this.captureDomEvent("input",e,e.value):u.isDescribedElement(e,"select")&&e.options&&e.options.length?this.handleSelectInputChanged(e):u.isDescribedElement(e,"input")&&!u.isDescribedElement(e,"input",["button","submit","hidden","checkbox","radio"])&&this.captureDomEvent("input",e,e.value))}catch(t){}},p.prototype.handleSelectInputChanged=function(t){if(t.multiple)for(var e=0;e<t.options.length;e++)t.options[e].selected&&this.captureDomEvent("input",t,t.options[e].value);else t.selectedIndex>=0&&t.options[t.selectedIndex]&&this.captureDomEvent("input",t,t.options[t.selectedIndex].value)},p.prototype.captureDomEvent=function(t,e,r,n){if(void 0!==r)if(this.scrubTelemetryInputs||"password"===u.getElementType(e))r="[scrubbed]";else{var o=u.describeElement(e);this.telemetryScrubber?this.telemetryScrubber(o)&&(r="[scrubbed]"):this.defaultValueScrubber(o)&&(r="[scrubbed]")}var i=u.elementArrayToString(u.treeToArray(e));this.telemeter.captureDom(t,i,r,n)},p.prototype.deinstrumentNavigation=function(){var t=this._window.chrome;!(t&&t.app&&t.app.runtime)&&this._window.history&&this._window.history.pushState&&l(this.replacements,"navigation")},p.prototype.instrumentNavigation=function(){var t=this._window.chrome;if(!(t&&t.app&&t.app.runtime)&&this._window.history&&this._window.history.pushState){var e=this;i(this._window,"onpopstate",(function(t){return function(){var r=e._location.href;e.handleUrlChange(e._lastHref,r),t&&t.apply(this,arguments)}}),this.replacements,"navigation"),i(this._window.history,"pushState",(function(t){return function(){var r=arguments.length>2?arguments[2]:void 0;return r&&e.handleUrlChange(e._lastHref,r+""),t.apply(this,arguments)}}),this.replacements,"navigation")}},p.prototype.handleUrlChange=function(t,e){var r=s.parse(this._location.href),n=s.parse(e),o=s.parse(t);this._lastHref=e,r.protocol===n.protocol&&r.host===n.host&&(e=n.path+(n.hash||"")),r.protocol===o.protocol&&r.host===o.host&&(t=o.path+(o.hash||"")),this.telemeter.captureNavigation(t,e)},p.prototype.deinstrumentConnectivity=function(){("addEventListener"in this._window||"body"in this._document)&&(this._window.addEventListener?this.removeListeners("connectivity"):l(this.replacements,"connectivity"))},p.prototype.instrumentConnectivity=function(){if("addEventListener"in this._window||"body"in this._document)if(this._window.addEventListener)this.addListener("connectivity",this._window,"online",void 0,function(){this.telemeter.captureConnectivityChange("online")}.bind(this),!0),this.addListener("connectivity",this._window,"offline",void 0,function(){this.telemeter.captureConnectivityChange("offline")}.bind(this),!0);else{var t=this;i(this._document.body,"ononline",(function(e){return function(){t.telemeter.captureConnectivityChange("online"),e&&e.apply(this,arguments)}}),this.replacements,"connectivity"),i(this._document.body,"onoffline",(function(e){return function(){t.telemeter.captureConnectivityChange("offline"),e&&e.apply(this,arguments)}}),this.replacements,"connectivity")}},p.prototype.handleCspEvent=function(t){var e="Security Policy Violation: blockedURI: "+t.blockedURI+", violatedDirective: "+t.violatedDirective+", effectiveDirective: "+t.effectiveDirective+", ";t.sourceFile&&(e+="location: "+t.sourceFile+", line: "+t.lineNumber+", col: "+t.columnNumber+", "),e+="originalPolicy: "+t.originalPolicy,this.telemeter.captureLog(e,"error"),this.handleCspError(e)},p.prototype.handleCspError=function(t){this.autoInstrument.errorOnContentSecurityPolicy&&this.rollbar.error(t)},p.prototype.deinstrumentContentSecurityPolicy=function(){"addEventListener"in this._document&&this.removeListeners("contentsecuritypolicy")},p.prototype.instrumentContentSecurityPolicy=function(){if("addEventListener"in this._document){var t=this.handleCspEvent.bind(this);this.addListener("contentsecuritypolicy",this._document,"securitypolicyviolation",null,t,!1)}},p.prototype.addListener=function(t,e,r,n,o,i){e.addEventListener?(e.addEventListener(r,o,i),this.eventRemovers[t].push((function(){e.removeEventListener(r,o,i)}))):n&&(e.attachEvent(n,o),this.eventRemovers[t].push((function(){e.detachEvent(n,o)})))},p.prototype.removeListeners=function(t){for(;this.eventRemovers[t].length;)this.eventRemovers[t].shift()()},t.exports=p},706:function(t){function e(t,e,r){if(e.hasOwnProperty&&e.hasOwnProperty("addEventListener")){for(var n=e.addEventListener;n._rollbarOldAdd&&n.belongsToShim;)n=n._rollbarOldAdd;var o=function(e,r,o){n.call(this,e,t.wrap(r),o)};o._rollbarOldAdd=n,o.belongsToShim=r,e.addEventListener=o;for(var i=e.removeEventListener;i._rollbarOldRemove&&i.belongsToShim;)i=i._rollbarOldRemove;var a=function(t,e,r){i.call(this,t,e&&e._rollbar_wrapped||e,r)};a._rollbarOldRemove=i,a.belongsToShim=r,e.removeEventListener=a}}t.exports=function(t,r,n){if(t){var o,i,a="EventTarget,Window,Node,ApplicationCache,AudioTrackList,ChannelMergerNode,CryptoOperation,EventSource,FileReader,HTMLUnknownElement,IDBDatabase,IDBRequest,IDBTransaction,KeyOperation,MediaController,MessagePort,ModalWindow,Notification,SVGElementInstance,Screen,TextTrack,TextTrackCue,TextTrackList,WebSocket,WebSocketWorker,Worker,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload".split(",");for(o=0;o<a.length;++o)t[i=a[o]]&&t[i].prototype&&e(r,t[i].prototype,n)}}},736:function(t){function e(t){return"string"!=typeof t&&(t=String(t)),t.toLowerCase()}function r(t){this.map={},t instanceof r?t.forEach((function(t,e){this.append(e,t)}),this):Array.isArray(t)?t.forEach((function(t){this.append(t[0],t[1])}),this):t&&Object.getOwnPropertyNames(t).forEach((function(e){this.append(e,t[e])}),this)}r.prototype.append=function(t,r){t=e(t),r=function(t){return"string"!=typeof t&&(t=String(t)),t}(r);var n=this.map[t];this.map[t]=n?n+", "+r:r},r.prototype.get=function(t){return t=e(t),this.has(t)?this.map[t]:null},r.prototype.has=function(t){return this.map.hasOwnProperty(e(t))},r.prototype.forEach=function(t,e){for(var r in this.map)this.map.hasOwnProperty(r)&&t.call(e,this.map[r],r,this)},r.prototype.entries=function(){var t=[];return this.forEach((function(e,r){t.push([r,e])})),function(t){return{next:function(){var e=t.shift();return{done:void 0===e,value:e}}}}(t)},t.exports=function(t){return"undefined"==typeof Headers?new r(t):new Headers(t)}},738:function(){!function(t){"use strict";t.console||(t.console={});for(var e,r,n=t.console,o=function(){},i=["memory"],a="assert,clear,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn".split(",");e=i.pop();)n[e]||(n[e]={});for(;r=a.pop();)n[r]||(n[r]=o)}("undefined"==typeof window?this:window)},746:function(t,e,r){var n=r(585);t.exports={checkIgnore:function(t,e){return!n.get(e,"plugins.jquery.ignoreAjaxErrors")||!n.get(t,"body.message.extra.isAjax")}}},751:function(t,e,r){var n=r(585),o=r(472),i=r(862);function a(t){this.truncation=t}a.prototype.get=function(t,e,r,o,i){o&&n.isFunction(o)||(o=function(){}),n.addParamsAndAccessTokenToPath(t,e,r);var a=n.formatUrl(e);this._makeZoneRequest(t,a,"GET",null,o,i,e.timeout,e.transport)},a.prototype.post=function(t,e,r,o,i){if(o&&n.isFunction(o)||(o=function(){}),!r)return o(new Error("Cannot send empty request"));var a;if((a=this.truncation?this.truncation.truncate(r):n.stringify(r)).error)return o(a.error);var s=a.value,u=n.formatUrl(e);this._makeZoneRequest(t,u,"POST",s,o,i,e.timeout,e.transport)},a.prototype.postJsonPayload=function(t,e,r,o,i){o&&n.isFunction(o)||(o=function(){});var a=n.formatUrl(e);this._makeZoneRequest(t,a,"POST",r,o,i,e.timeout,e.transport)},a.prototype._makeZoneRequest=function(){var t="undefined"!=typeof window&&window||void 0!==n&&n,e=t&&t.Zone&&t.Zone.root,r=Array.prototype.slice.call(arguments);if(e){var n=this;e.run((function(){n._makeRequest.apply(void 0,r)}))}else this._makeRequest.apply(void 0,r)},a.prototype._makeRequest=function(t,e,r,n,a,s,u,c){if("undefined"!=typeof RollbarProxy)return function(t,e){(new RollbarProxy).sendJsonPayload(t,(function(t){}),(function(t){e(new Error(t))}))}(n,a);"fetch"===c?o(t,e,r,n,a,u):i(t,e,r,n,a,s,u)},t.exports=a},862:function(t,e,r){var n=r(585),o=r(144);function i(t,e){var r=new Error(t);return r.code=e||"ENOTFOUND",r}t.exports=function(t,e,r,a,s,u,c){var l;if(!(l=u?u():function(){var t,e,r=[function(){return new XMLHttpRequest},function(){return new ActiveXObject("Msxml2.XMLHTTP")},function(){return new ActiveXObject("Msxml3.XMLHTTP")},function(){return new ActiveXObject("Microsoft.XMLHTTP")}],n=r.length;for(e=0;e<n;e++)try{t=r[e]();break}catch(t){}return t}()))return s(new Error("No way to send a request"));try{try{var p=function(){try{if(p&&4===l.readyState){p=void 0;var t=n.jsonParse(l.responseText);if((a=l)&&a.status&&200===a.status)return void s(t.error,t.value);if(function(t){return t&&n.isType(t.status,"number")&&t.status>=400&&t.status<600}(l)){if(403===l.status){var e=t.value&&t.value.message;o.error(e)}s(new Error(String(l.status)))}else s(i("XHR response had no status code (likely connection failure)"))}}catch(t){var r;r=t&&t.stack?t:new Error(t),s(r)}var a};l.open(r,e,!0),l.setRequestHeader&&(l.setRequestHeader("Content-Type","application/json"),l.setRequestHeader("X-Rollbar-Access-Token",t)),n.isFiniteNumber(c)&&(l.timeout=c),l.onreadystatechange=p,l.send(a)}catch(t){if("undefined"!=typeof XDomainRequest){if(!window||!window.location)return s(new Error("No window available during request, unknown environment"));"http:"===window.location.href.substring(0,5)&&"https"===e.substring(0,5)&&(e="http"+e.substring(5));var f=new XDomainRequest;f.onprogress=function(){},f.ontimeout=function(){s(i("Request timed out","ETIMEDOUT"))},f.onerror=function(){s(new Error("Error during request"))},f.onload=function(){var t=n.jsonParse(f.responseText);s(t.error,t.value)},f.open(r,e,!0),f.send(a)}else s(new Error("Cannot find a method to transport a request"))}}catch(t){s(t)}}},922:function(t,e,r){var n=r(585),o=r(98);function i(t,e){var r=e.split("."),o=r.length-1;try{for(var i=0;i<=o;++i)i<o?t=t[r[i]]:t[r[i]]=n.redact()}catch(t){}}t.exports=function(t,e,r){if(e=e||[],r)for(var a=0;a<r.length;++a)i(t,r[a]);var s=function(t){for(var e,r=[],n=0;n<t.length;++n)e="^\\[?(%5[bB])?"+t[n]+"\\[?(%5[bB])?\\]?(%5[dD])?$",r.push(new RegExp(e,"i"));return r}(e),u=function(t){for(var e,r=[],n=0;n<t.length;++n)e="\\[?(%5[bB])?"+t[n]+"\\[?(%5[bB])?\\]?(%5[dD])?",r.push(new RegExp("("+e+"=)([^&\\n]+)","igm"));return r}(e);function c(t,e){return e+n.redact()}return o(t,(function t(e,r,i){var a=function(t,e){var r;for(r=0;r<s.length;++r)if(s[r].test(t)){e=n.redact();break}return e}(e,r);return a===r?n.isType(r,"object")||n.isType(r,"array")?o(r,t,i):function(t){var e;if(n.isType(t,"string"))for(e=0;e<u.length;++e)t=t.replace(u[e],c);return t}(a):a}))}},939:function(t,e,r){var n=r(585);function o(t,e){this.queue=t,this.options=e,this.transforms=[],this.diagnostic={}}o.prototype.configure=function(t){this.queue&&this.queue.configure(t);var e=this.options;return this.options=n.merge(e,t),this},o.prototype.addTransform=function(t){return n.isFunction(t)&&this.transforms.push(t),this},o.prototype.log=function(t,e){if(e&&n.isFunction(e)||(e=function(){}),!this.options.enabled)return e(new Error("Rollbar is not enabled"));this.queue.addPendingItem(t);var r=t.err;this._applyTransforms(t,function(n,o){if(n)return this.queue.removePendingItem(t),e(n,null);this.queue.addItem(o,e,r,t)}.bind(this))},o.prototype._applyTransforms=function(t,e){var r=-1,n=this.transforms.length,o=this.transforms,i=this.options,a=function(t,s){t?e(t,null):++r!==n?o[r](s,i,a):e(null,s)};a(null,t)},t.exports=o},949:function(t,e,r){var n=r(511),o=r(14),i=r(939),a=r(585);function s(t,e,r,n,l){this.options=a.merge(t),this.logger=r,s.rateLimiter.configureGlobal(this.options),s.rateLimiter.setPlatformOptions(l,this.options),this.api=e,this.queue=new o(s.rateLimiter,e,r,this.options);var p=this.options.tracer||null;c(p)?(this.tracer=p,this.options.tracer="opentracing-tracer-enabled",this.options._configuredOptions.tracer="opentracing-tracer-enabled"):this.tracer=null,this.notifier=new i(this.queue,this.options),this.telemeter=n,u(t),this.lastError=null,this.lastErrorHash="none"}function u(t){t.stackTraceLimit&&(Error.stackTraceLimit=t.stackTraceLimit)}function c(t){if(!t)return!1;if(!t.scope||"function"!=typeof t.scope)return!1;var e=t.scope();return!(!e||!e.active||"function"!=typeof e.active)}s.rateLimiter=new n({maxItems:0,itemsPerMinute:60}),s.prototype.global=function(t){return s.rateLimiter.configureGlobal(t),this},s.prototype.configure=function(t,e){var r=this.options,n={};e&&(n={payload:e}),this.options=a.merge(r,t,n);var o=this.options.tracer||null;return c(o)?(this.tracer=o,this.options.tracer="opentracing-tracer-enabled",this.options._configuredOptions.tracer="opentracing-tracer-enabled"):this.tracer=null,this.notifier&&this.notifier.configure(this.options),this.telemeter&&this.telemeter.configure(this.options),u(t),this.global(this.options),c(t.tracer)&&(this.tracer=t.tracer),this},s.prototype.log=function(t){var e=this._defaultLogLevel();return this._log(e,t)},s.prototype.debug=function(t){this._log("debug",t)},s.prototype.info=function(t){this._log("info",t)},s.prototype.warn=function(t){this._log("warning",t)},s.prototype.warning=function(t){this._log("warning",t)},s.prototype.error=function(t){this._log("error",t)},s.prototype.critical=function(t){this._log("critical",t)},s.prototype.wait=function(t){this.queue.wait(t)},s.prototype.captureEvent=function(t,e,r){return this.telemeter&&this.telemeter.captureEvent(t,e,r)},s.prototype.captureDomContentLoaded=function(t){return this.telemeter&&this.telemeter.captureDomContentLoaded(t)},s.prototype.captureLoad=function(t){return this.telemeter&&this.telemeter.captureLoad(t)},s.prototype.buildJsonPayload=function(t){return this.api.buildJsonPayload(t)},s.prototype.sendJsonPayload=function(t){this.api.postJsonPayload(t)},s.prototype._log=function(t,e){var r;if(e.callback&&(r=e.callback,delete e.callback),this.options.ignoreDuplicateErrors&&this._sameAsLastError(e)){if(r){var n=new Error("ignored identical item");n.item=e,r(n)}}else try{this._addTracingInfo(e),e.level=e.level||t,this.telemeter&&this.telemeter._captureRollbarItem(e),e.telemetryEvents=this.telemeter&&this.telemeter.copyEvents()||[],this.notifier.log(e,r)}catch(t){r&&r(t),this.logger.error(t)}},s.prototype._defaultLogLevel=function(){return this.options.logLevel||"debug"},s.prototype._sameAsLastError=function(t){if(!t._isUncaught)return!1;var e=function(t){var e=t.message||"",r=(t.err||{}).stack||String(t.err);return e+"::"+r}(t);return this.lastErrorHash===e||(this.lastError=t.err,this.lastErrorHash=e,!1)},s.prototype._addTracingInfo=function(t){if(this.tracer){var e=this.tracer.scope().active();if(function(t){if(!t||!t.context||"function"!=typeof t.context)return!1;var e=t.context();return!!(e&&e.toSpanId&&e.toTraceId&&"function"==typeof e.toSpanId&&"function"==typeof e.toTraceId)}(e)){e.setTag("rollbar.error_uuid",t.uuid),e.setTag("rollbar.has_error",!0),e.setTag("error",!0),e.setTag("rollbar.item_url","https://rollbar.com/item/uuid/?uuid=".concat(t.uuid)),e.setTag("rollbar.occurrence_url","https://rollbar.com/occurrence/uuid/?uuid=".concat(t.uuid));var r=e.context().toSpanId(),n=e.context().toTraceId();t.custom?(t.custom.opentracing_span_id=r,t.custom.opentracing_trace_id=n):t.custom={opentracing_span_id:r,opentracing_trace_id:n}}}},t.exports=s},960:function(t,e,r){var n=r(585);function o(t,e){n.isFunction(t[e])&&(t[e]=t[e].toString())}t.exports={itemToPayload:function(t,e,r){var n=t.data;t._isUncaught&&(n._isUncaught=!0),t._originalArgs&&(n._originalArgs=t._originalArgs),r(null,n)},addPayloadOptions:function(t,e,r){var o=e.payload||{};o.body&&delete o.body,t.data=n.merge(t.data,o),r(null,t)},addTelemetryData:function(t,e,r){t.telemetryEvents&&n.set(t,"data.body.telemetry",t.telemetryEvents),r(null,t)},addMessageWithError:function(t,e,r){if(t.message){var o="data.body.trace_chain.0",i=n.get(t,o);if(i||(o="data.body.trace",i=n.get(t,o)),i){if(!i.exception||!i.exception.description)return n.set(t,o+".exception.description",t.message),void r(null,t);var a=n.get(t,o+".extra")||{},s=n.merge(a,{message:t.message});n.set(t,o+".extra",s)}r(null,t)}else r(null,t)},userTransform:function(t){return function(e,r,o){var i=n.merge(e),a=null;try{n.isFunction(r.transform)&&(a=r.transform(i.data,e))}catch(n){return r.transform=null,t.error("Error while calling custom transform() function. Removing custom transform().",n),void o(null,e)}n.isPromise(a)?a.then((function(t){t&&(i.data=t),o(null,i)}),(function(t){o(t,e)})):o(null,i)}},addConfigToPayload:function(t,e,r){if(!e.sendConfig)return r(null,t);var o=n.get(t,"data.custom")||{};o._rollbarConfig=e,t.data.custom=o,r(null,t)},addConfiguredOptions:function(t,e,r){var n=e._configuredOptions;o(n,"transform"),o(n,"checkIgnore"),o(n,"onSendCallback"),delete n.accessToken,t.data.notifier.configured_options=n,r(null,t)},addDiagnosticKeys:function(t,e,r){var o=n.merge(t.notifier.client.notifier.diagnostic,t.diagnostic);if(n.get(t,"err._isAnonymous")&&(o.is_anonymous=!0),t._isUncaught&&(o.is_uncaught=t._isUncaught),t.err)try{o.raw_error={message:t.err.message,name:t.err.name,constructor_name:t.err.constructor&&t.err.constructor.name,filename:t.err.fileName,line:t.err.lineNumber,column:t.err.columnNumber,stack:t.err.stack}}catch(t){o.raw_error={failed:String(t)}}t.data.notifier.diagnostic=n.merge(t.data.notifier.diagnostic,o),r(null,t)}}},965:function(t){"use strict";var e=Object.prototype.hasOwnProperty,r=Object.prototype.toString,n=function(t){if(!t||"[object Object]"!==r.call(t))return!1;var n,o=e.call(t,"constructor"),i=t.constructor&&t.constructor.prototype&&e.call(t.constructor.prototype,"isPrototypeOf");if(t.constructor&&!o&&!i)return!1;for(n in t);return void 0===n||e.call(t,n)};t.exports=function t(){var e,r,o,i,a,s={},u=null,c=arguments.length;for(e=0;e<c;e++)if(null!=(u=arguments[e]))for(a in u)r=s[a],s!==(o=u[a])&&(o&&n(o)?(i=r&&n(r)?r:{},s[a]=t(i,o)):void 0!==o&&(s[a]=o));return s}}},e={},function r(n){var o=e[n];if(void 0!==o)return o.exports;var i=e[n]={exports:{}};return t[n].call(i.exports,i,i.exports,r),i.exports}(428);var t,e}));
//# sourceMappingURL=rollbar.umd.min.js.map

/***/ }),

/***/ 4582:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

function traverse(obj, func, seen) {
  var k, v, i;
  var isObj = _.isType(obj, 'object');
  var isArray = _.isType(obj, 'array');
  var keys = [];
  var seenIndex;

  // Best might be to use Map here with `obj` as the keys, but we want to support IE < 11.
  seen = seen || { obj: [], mapped: [] };

  if (isObj) {
    seenIndex = seen.obj.indexOf(obj);

    if (isObj && seenIndex !== -1) {
      // Prefer the mapped object if there is one.
      return seen.mapped[seenIndex] || seen.obj[seenIndex];
    }

    seen.obj.push(obj);
    seenIndex = seen.obj.length - 1;
  }

  if (isObj) {
    for (k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        keys.push(k);
      }
    }
  } else if (isArray) {
    for (i = 0; i < obj.length; ++i) {
      keys.push(i);
    }
  }

  var result = isObj ? {} : [];
  var same = true;
  for (i = 0; i < keys.length; ++i) {
    k = keys[i];
    v = obj[k];
    result[k] = func(k, v, seen);
    same = same && result[k] === obj[k];
  }

  if (isObj && !same) {
    seen.mapped[seenIndex] = result;
  }

  return !same ? result : obj;
}

module.exports = traverse;


/***/ }),

/***/ 4583:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Generate a random hexadecimal ID of specified byte length
 *
 * @param {number} bytes - Number of bytes for the ID (default: 16)
 * @returns {string} - Hexadecimal string representation
 */
function gen(bytes = 16) {
  let randomBytes = new Uint8Array(bytes);
  crypto.getRandomValues(randomBytes);
  let randHex = Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return randHex;
}

/**
 * Tracing id generation utils
 *
 * @example
 * import id from './id.js';
 *
 * const spanId = id.gen(8); // => "a1b2c3d4e5f6..."
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ gen });


/***/ }),

/***/ 4856:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);
var traverse = __webpack_require__(4582);

function scrub(data, scrubFields, scrubPaths) {
  scrubFields = scrubFields || [];

  if (scrubPaths) {
    for (var i = 0; i < scrubPaths.length; ++i) {
      scrubPath(data, scrubPaths[i]);
    }
  }

  var paramRes = _getScrubFieldRegexs(scrubFields);
  var queryRes = _getScrubQueryParamRegexs(scrubFields);

  function redactQueryParam(dummy0, paramPart) {
    return paramPart + _.redact();
  }

  function paramScrubber(v) {
    var i;
    if (_.isType(v, 'string')) {
      for (i = 0; i < queryRes.length; ++i) {
        v = v.replace(queryRes[i], redactQueryParam);
      }
    }
    return v;
  }

  function valScrubber(k, v) {
    var i;
    for (i = 0; i < paramRes.length; ++i) {
      if (paramRes[i].test(k)) {
        v = _.redact();
        break;
      }
    }
    return v;
  }

  function scrubber(k, v, seen) {
    var tmpV = valScrubber(k, v);
    if (tmpV === v) {
      if (_.isType(v, 'object') || _.isType(v, 'array')) {
        return traverse(v, scrubber, seen);
      }
      return paramScrubber(tmpV);
    } else {
      return tmpV;
    }
  }

  return traverse(data, scrubber);
}

function scrubPath(obj, path) {
  var keys = path.split('.');
  var last = keys.length - 1;
  try {
    for (var i = 0; i <= last; ++i) {
      if (i < last) {
        obj = obj[keys[i]];
      } else {
        obj[keys[i]] = _.redact();
      }
    }
  } catch (e) {
    // Missing key is OK;
  }
}

function _getScrubFieldRegexs(scrubFields) {
  var ret = [];
  var pat;
  for (var i = 0; i < scrubFields.length; ++i) {
    pat = '^\\[?(%5[bB])?' + scrubFields[i] + '\\[?(%5[bB])?\\]?(%5[dD])?$';
    ret.push(new RegExp(pat, 'i'));
  }
  return ret;
}

function _getScrubQueryParamRegexs(scrubFields) {
  var ret = [];
  var pat;
  for (var i = 0; i < scrubFields.length; ++i) {
    pat = '\\[?(%5[bB])?' + scrubFields[i] + '\\[?(%5[bB])?\\]?(%5[dD])?';
    ret.push(new RegExp('(' + pat + '=)([^&\\n]+)', 'igm'));
  }
  return ret;
}

module.exports = scrub;


/***/ }),

/***/ 4892:
/***/ ((module) => {

function replace(obj, name, replacement, replacements, type) {
  var orig = obj[name];
  obj[name] = replacement(orig);
  if (replacements) {
    replacements[type].push([obj, name, orig]);
  }
}

module.exports = replace;


/***/ }),

/***/ 5292:
/***/ ((module) => {

function captureUncaughtExceptions(window, handler, shim) {
  if (!window) {
    return;
  }
  var oldOnError;

  if (typeof handler._rollbarOldOnError === 'function') {
    oldOnError = handler._rollbarOldOnError;
  } else if (window.onerror) {
    oldOnError = window.onerror;
    while (oldOnError._rollbarOldOnError) {
      oldOnError = oldOnError._rollbarOldOnError;
    }
    handler._rollbarOldOnError = oldOnError;
  }

  handler.handleAnonymousErrors();

  var fn = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    _rollbarWindowOnError(window, handler, oldOnError, args);
  };
  if (shim) {
    fn._rollbarOldOnError = oldOnError;
  }
  window.onerror = fn;
}

function _rollbarWindowOnError(window, r, old, args) {
  if (window._rollbarWrappedError) {
    if (!args[4]) {
      args[4] = window._rollbarWrappedError;
    }
    if (!args[5]) {
      args[5] = window._rollbarWrappedError._rollbarContext;
    }
    window._rollbarWrappedError = null;
  }

  var ret = r.handleUncaughtException.apply(r, args);

  if (old) {
    old.apply(window, args);
  }

  // Let other chained onerror handlers above run before setting this.
  // If an error is thrown and caught within a chained onerror handler,
  // Error.prepareStackTrace() will see that one before the one we want.
  if (ret === 'anonymous') {
    r.anonymousErrorsPending += 1; // See Rollbar.prototype.handleAnonymousErrors()
  }
}

function captureUnhandledRejections(window, handler, shim) {
  if (!window) {
    return;
  }

  if (
    typeof window._rollbarURH === 'function' &&
    window._rollbarURH.belongsToShim
  ) {
    window.removeEventListener('unhandledrejection', window._rollbarURH);
  }

  var rejectionHandler = function (evt) {
    var reason, promise, detail;
    try {
      reason = evt.reason;
    } catch (e) {
      reason = undefined;
    }
    try {
      promise = evt.promise;
    } catch (e) {
      promise = '[unhandledrejection] error getting `promise` from event';
    }
    try {
      detail = evt.detail;
      if (!reason && detail) {
        reason = detail.reason;
        promise = detail.promise;
      }
    } catch (e) {
      // Ignore
    }
    if (!reason) {
      reason = '[unhandledrejection] error getting `reason` from event';
    }

    if (handler && handler.handleUnhandledRejection) {
      handler.handleUnhandledRejection(reason, promise);
    }
  };
  rejectionHandler.belongsToShim = shim;
  window._rollbarURH = rejectionHandler;
  window.addEventListener('unhandledrejection', rejectionHandler);
}

module.exports = {
  captureUncaughtExceptions: captureUncaughtExceptions,
  captureUnhandledRejections: captureUnhandledRejections,
};


/***/ }),

/***/ 5545:
/***/ ((module) => {

// See https://nodejs.org/docs/latest/api/url.html
function parse(url) {
  var result = {
    protocol: null,
    auth: null,
    host: null,
    path: null,
    hash: null,
    href: url,
    hostname: null,
    port: null,
    pathname: null,
    search: null,
    query: null,
  };

  var i, last;
  i = url.indexOf('//');
  if (i !== -1) {
    result.protocol = url.substring(0, i);
    last = i + 2;
  } else {
    last = 0;
  }

  i = url.indexOf('@', last);
  if (i !== -1) {
    result.auth = url.substring(last, i);
    last = i + 1;
  }

  i = url.indexOf('/', last);
  if (i === -1) {
    i = url.indexOf('?', last);
    if (i === -1) {
      i = url.indexOf('#', last);
      if (i === -1) {
        result.host = url.substring(last);
      } else {
        result.host = url.substring(last, i);
        result.hash = url.substring(i);
      }
      result.hostname = result.host.split(':')[0];
      result.port = result.host.split(':')[1];
      if (result.port) {
        result.port = parseInt(result.port, 10);
      }
      return result;
    } else {
      result.host = url.substring(last, i);
      result.hostname = result.host.split(':')[0];
      result.port = result.host.split(':')[1];
      if (result.port) {
        result.port = parseInt(result.port, 10);
      }
      last = i;
    }
  } else {
    result.host = url.substring(last, i);
    result.hostname = result.host.split(':')[0];
    result.port = result.host.split(':')[1];
    if (result.port) {
      result.port = parseInt(result.port, 10);
    }
    last = i;
  }

  i = url.indexOf('#', last);
  if (i === -1) {
    result.path = url.substring(last);
  } else {
    result.path = url.substring(last, i);
    result.hash = url.substring(i);
  }

  if (result.path) {
    var pathParts = result.path.split('?');
    result.pathname = pathParts[0];
    result.query = pathParts[1];
    result.search = result.query ? '?' + result.query : null;
  }
  return result;
}

module.exports = {
  parse: parse,
};


/***/ }),

/***/ 5927:
/***/ ((module) => {

module.exports = {
  scrubFields: [
    'pw',
    'pass',
    'passwd',
    'password',
    'secret',
    'confirm_password',
    'confirmPassword',
    'password_confirmation',
    'passwordConfirmation',
    'access_token',
    'accessToken',
    'X-Rollbar-Access-Token',
    'secret_key',
    'secretKey',
    'secretToken',
    'cc-number',
    'card number',
    'cardnumber',
    'cardnum',
    'ccnum',
    'ccnumber',
    'cc num',
    'creditcardnumber',
    'credit card number',
    'newcreditcardnumber',
    'new credit card',
    'creditcardno',
    'credit card no',
    'card#',
    'card #',
    'cc-csc',
    'cvc',
    'cvc2',
    'cvv2',
    'ccv2',
    'security code',
    'card verification',
    'name on credit card',
    'name on card',
    'nameoncard',
    'cardholder',
    'card holder',
    'name des karteninhabers',
    'ccname',
    'card type',
    'cardtype',
    'cc type',
    'cctype',
    'payment type',
    'expiration date',
    'expirationdate',
    'expdate',
    'cc-exp',
    'ccmonth',
    'ccyear',
  ],
};


/***/ }),

/***/ 6478:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Default options for the rrweb recorder
 * See https://github.com/rrweb-io/rrweb/blob/master/guide.md#options for details
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  enabled: true, // Whether recording is enabled
  autoStart: true, // Start recording automatically when Rollbar initializes
  debug: {
    logEmits: false, // Whether to log emitted events
  },

  // Recording options
  inlineStylesheet: true, // Whether to inline stylesheets to improve replay accuracy
  inlineImages: false, // Whether to record the image content
  collectFonts: true, // Whether to collect fonts in the website

  // Privacy options
  // Fine-grained control over which input types to mask
  // By default only password inputs are masked if maskInputs is true
  maskInputOptions: {
    password: true,
    email: false,
    tel: false,
    text: false,
    color: false,
    date: false,
    'datetime-local': false,
    month: false,
    number: false,
    range: false,
    search: false,
    time: false,
    url: false,
    week: false,
  },

  // Remove unnecessary parts of the DOM
  // By default all removable elements are removed
  slimDOMOptions: {
    script: true, // Remove script elements
    comment: true, // Remove comments
    headFavicon: true, // Remove favicons in the head
    headWhitespace: true, // Remove whitespace in head
    headMetaDescKeywords: true, // Remove meta description and keywords
    headMetaSocial: true, // Remove social media meta tags
    headMetaRobots: true, // Remove robots meta directives
    headMetaHttpEquiv: true, // Remove http-equiv meta directives
    headMetaAuthorship: true, // Remove authorship meta directives
    headMetaVerification: true, // Remove verification meta directives
  },

  // Custom callbacks for advanced use cases
  // These are undefined by default and can be set programmatically
  // maskInputFn: undefined,      // Custom function to mask input values
  // maskTextFn: undefined,       // Custom function to mask text content
  // errorHandler: undefined,     // Custom error handler for recording errors

  // Plugin system
  // plugins: []                  // List of plugins to use (must be set programmatically)
});


/***/ }),

/***/ 6604:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable no-console */
__webpack_require__(3769);
var detection = __webpack_require__(6923);
var _ = __webpack_require__(1511);

function error() {
  var args = Array.prototype.slice.call(arguments, 0);
  args.unshift('Rollbar:');
  if (detection.ieVersion() <= 8) {
    console.error(_.formatArgsAsString(args));
  } else {
    console.error.apply(console, args);
  }
}

function info() {
  var args = Array.prototype.slice.call(arguments, 0);
  args.unshift('Rollbar:');
  if (detection.ieVersion() <= 8) {
    console.info(_.formatArgsAsString(args));
  } else {
    console.info.apply(console, args);
  }
}

function log() {
  var args = Array.prototype.slice.call(arguments, 0);
  args.unshift('Rollbar:');
  if (detection.ieVersion() <= 8) {
    console.log(_.formatArgsAsString(args));
  } else {
    console.log.apply(console, args);
  }
}

/* eslint-enable no-console */

module.exports = {
  error: error,
  info: info,
  log: log,
};


/***/ }),

/***/ 6697:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);
var errorParser = __webpack_require__(8874);
var logger = __webpack_require__(6604);

function handleDomException(item, options, callback) {
  if (item.err && errorParser.Stack(item.err).name === 'DOMException') {
    var originalError = new Error();
    originalError.name = item.err.name;
    originalError.message = item.err.message;
    originalError.stack = item.err.stack;
    originalError.nested = item.err;
    item.err = originalError;
  }
  callback(null, item);
}

function handleItemWithError(item, options, callback) {
  item.data = item.data || {};
  if (item.err) {
    try {
      item.stackInfo =
        item.err._savedStackTrace ||
        errorParser.parse(item.err, item.skipFrames);

      if (options.addErrorContext) {
        addErrorContext(item);
      }
    } catch (e) {
      logger.error('Error while parsing the error object.', e);
      try {
        item.message =
          item.err.message ||
          item.err.description ||
          item.message ||
          String(item.err);
      } catch (e2) {
        item.message = String(item.err) || String(e2);
      }
      delete item.err;
    }
  }
  callback(null, item);
}

function addErrorContext(item) {
  var chain = [];
  var err = item.err;

  chain.push(err);

  while (err.nested || err.cause) {
    err = err.nested || err.cause;
    chain.push(err);
  }

  _.addErrorContext(item, chain);
}

function ensureItemHasSomethingToSay(item, options, callback) {
  if (!item.message && !item.stackInfo && !item.custom) {
    callback(new Error('No message, stack info, or custom data'), null);
  }
  callback(null, item);
}

function addBaseInfo(item, options, callback) {
  var environment =
    (options.payload && options.payload.environment) || options.environment;
  item.data = _.merge(item.data, {
    environment: environment,
    level: item.level,
    endpoint: options.endpoint,
    platform: 'browser',
    framework: 'browser-js',
    language: 'javascript',
    server: {},
    uuid: item.uuid,
    notifier: {
      name: 'rollbar-browser-js',
      version: options.version,
    },
    custom: item.custom,
  });
  callback(null, item);
}

function addRequestInfo(window) {
  return function (item, options, callback) {
    var requestInfo = {};

    if (window && window.location) {
      requestInfo.url = window.location.href;
      requestInfo.query_string = window.location.search;
    }

    var remoteString = '$remote_ip';
    if (!options.captureIp) {
      remoteString = null;
    } else if (options.captureIp !== true) {
      remoteString += '_anonymize';
    }
    if (remoteString) requestInfo.user_ip = remoteString;

    if (Object.keys(requestInfo).length > 0) {
      _.set(item, 'data.request', requestInfo);
    }

    callback(null, item);
  };
}

function addClientInfo(window) {
  return function (item, options, callback) {
    if (!window) {
      return callback(null, item);
    }
    var nav = window.navigator || {};
    var scr = window.screen || {};
    _.set(item, 'data.client', {
      runtime_ms: item.timestamp - window._rollbarStartTime,
      timestamp: Math.round(item.timestamp / 1000),
      javascript: {
        browser: nav.userAgent,
        language: nav.language,
        cookie_enabled: nav.cookieEnabled,
        screen: {
          width: scr.width,
          height: scr.height,
        },
      },
    });
    callback(null, item);
  };
}

function addPluginInfo(window) {
  return function (item, options, callback) {
    if (!window || !window.navigator) {
      return callback(null, item);
    }
    var plugins = [];
    var navPlugins = window.navigator.plugins || [];
    var cur;
    for (var i = 0, l = navPlugins.length; i < l; ++i) {
      cur = navPlugins[i];
      plugins.push({ name: cur.name, description: cur.description });
    }
    _.set(item, 'data.client.javascript.plugins', plugins);
    callback(null, item);
  };
}

function addBody(item, options, callback) {
  if (item.stackInfo) {
    if (item.stackInfo.traceChain) {
      addBodyTraceChain(item, options, callback);
    } else {
      addBodyTrace(item, options, callback);
    }
  } else {
    addBodyMessage(item, options, callback);
  }
}

function addBodyMessage(item, options, callback) {
  var message = item.message;
  var custom = item.custom;

  if (!message) {
    message = 'Item sent with null or missing arguments.';
  }
  var result = {
    body: message,
  };

  if (custom) {
    result.extra = _.merge(custom);
  }

  _.set(item, 'data.body', { message: result });
  callback(null, item);
}

function stackFromItem(item) {
  // Transform a TraceKit stackInfo object into a Rollbar trace
  var stack = item.stackInfo.stack;
  if (
    stack &&
    stack.length === 0 &&
    item._unhandledStackInfo &&
    item._unhandledStackInfo.stack
  ) {
    stack = item._unhandledStackInfo.stack;
  }
  return stack;
}

function addBodyTraceChain(item, options, callback) {
  var traceChain = item.stackInfo.traceChain;
  var traces = [];

  var traceChainLength = traceChain.length;
  for (var i = 0; i < traceChainLength; i++) {
    var trace = buildTrace(item, traceChain[i], options);
    traces.push(trace);
  }

  _.set(item, 'data.body', { trace_chain: traces });
  callback(null, item);
}

function addBodyTrace(item, options, callback) {
  var stack = stackFromItem(item);

  if (stack) {
    var trace = buildTrace(item, item.stackInfo, options);
    _.set(item, 'data.body', { trace: trace });
    callback(null, item);
  } else {
    var stackInfo = item.stackInfo;
    var guess = errorParser.guessErrorClass(stackInfo.message);
    var className = errorClass(stackInfo, guess[0], options);
    var message = guess[1];

    item.message = className + ': ' + message;
    addBodyMessage(item, options, callback);
  }
}

function buildTrace(item, stackInfo, options) {
  var description = item && item.data.description;
  var custom = item && item.custom;
  var stack = stackFromItem(item);

  var guess = errorParser.guessErrorClass(stackInfo.message);
  var className = errorClass(stackInfo, guess[0], options);
  var message = guess[1];
  var trace = {
    exception: {
      class: className,
      message: message,
    },
  };

  if (description) {
    trace.exception.description = description;
  }

  if (stack) {
    if (stack.length === 0) {
      trace.exception.stack = stackInfo.rawStack;
      trace.exception.raw = String(stackInfo.rawException);
    }
    var stackFrame;
    var frame;
    var code;
    var pre;
    var post;
    var contextLength;
    var i, mid;

    trace.frames = [];
    for (i = 0; i < stack.length; ++i) {
      stackFrame = stack[i];
      frame = {
        filename: stackFrame.url ? _.sanitizeUrl(stackFrame.url) : '(unknown)',
        lineno: stackFrame.line || null,
        method:
          !stackFrame.func || stackFrame.func === '?'
            ? '[anonymous]'
            : stackFrame.func,
        colno: stackFrame.column,
      };
      if (options.sendFrameUrl) {
        frame.url = stackFrame.url;
      }
      if (
        frame.method &&
        frame.method.endsWith &&
        frame.method.endsWith('_rollbar_wrapped')
      ) {
        continue;
      }

      code = pre = post = null;
      contextLength = stackFrame.context ? stackFrame.context.length : 0;
      if (contextLength) {
        mid = Math.floor(contextLength / 2);
        pre = stackFrame.context.slice(0, mid);
        code = stackFrame.context[mid];
        post = stackFrame.context.slice(mid);
      }

      if (code) {
        frame.code = code;
      }

      if (pre || post) {
        frame.context = {};
        if (pre && pre.length) {
          frame.context.pre = pre;
        }
        if (post && post.length) {
          frame.context.post = post;
        }
      }

      if (stackFrame.args) {
        frame.args = stackFrame.args;
      }

      trace.frames.push(frame);
    }

    // NOTE(cory): reverse the frames since rollbar.com expects the most recent call last
    trace.frames.reverse();

    if (custom) {
      trace.extra = _.merge(custom);
    }
  }

  return trace;
}

function errorClass(stackInfo, guess, options) {
  if (stackInfo.name) {
    return stackInfo.name;
  } else if (options.guessErrorClass) {
    return guess;
  } else {
    return '(unknown)';
  }
}

function addScrubber(scrubFn) {
  return function (item, options, callback) {
    if (scrubFn) {
      var scrubFields = options.scrubFields || [];
      var scrubPaths = options.scrubPaths || [];
      item.data = scrubFn(item.data, scrubFields, scrubPaths);
    }
    callback(null, item);
  };
}

module.exports = {
  handleDomException: handleDomException,
  handleItemWithError: handleItemWithError,
  ensureItemHasSomethingToSay: ensureItemHasSomethingToSay,
  addBaseInfo: addBaseInfo,
  addRequestInfo: addRequestInfo,
  addClientInfo: addClientInfo,
  addPluginInfo: addPluginInfo,
  addBody: addBody,
  addScrubber: addScrubber,
};


/***/ }),

/***/ 6923:
/***/ ((module) => {

// This detection.js module is used to encapsulate any ugly browser/feature
// detection we may need to do.

// Figure out which version of IE we're using, if any.
// This is gleaned from http://stackoverflow.com/questions/5574842/best-way-to-check-for-ie-less-than-9-in-javascript-without-library
// Will return an integer on IE (i.e. 8)
// Will return undefined otherwise
function getIEVersion() {
  var undef;
  if (typeof document === 'undefined') {
    return undef;
  }

  var v = 3,
    div = document.createElement('div'),
    all = div.getElementsByTagName('i');

  while (
    ((div.innerHTML = '<!--[if gt IE ' + ++v + ']><i></i><![endif]-->'), all[0])
  );

  return v > 4 ? v : undef;
}

var Detection = {
  ieVersion: getIEVersion,
};

module.exports = Detection;


/***/ }),

/***/ 7133:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

/*
 * RateLimiter - an object that encapsulates the logic for counting items sent to Rollbar
 *
 * @param options - the same options that are accepted by configureGlobal offered as a convenience
 */
function RateLimiter(options) {
  this.startTime = _.now();
  this.counter = 0;
  this.perMinCounter = 0;
  this.platform = null;
  this.platformOptions = {};
  this.configureGlobal(options);
}

RateLimiter.globalSettings = {
  startTime: _.now(),
  maxItems: undefined,
  itemsPerMinute: undefined,
};

/*
 * configureGlobal - set the global rate limiter options
 *
 * @param options - Only the following values are recognized:
 *    startTime: a timestamp of the form returned by (new Date()).getTime()
 *    maxItems: the maximum items
 *    itemsPerMinute: the max number of items to send in a given minute
 */
RateLimiter.prototype.configureGlobal = function (options) {
  if (options.startTime !== undefined) {
    RateLimiter.globalSettings.startTime = options.startTime;
  }
  if (options.maxItems !== undefined) {
    RateLimiter.globalSettings.maxItems = options.maxItems;
  }
  if (options.itemsPerMinute !== undefined) {
    RateLimiter.globalSettings.itemsPerMinute = options.itemsPerMinute;
  }
};

/*
 * shouldSend - determine if we should send a given item based on rate limit settings
 *
 * @param item - the item we are about to send
 * @returns An object with the following structure:
 *  error: (Error|null)
 *  shouldSend: bool
 *  payload: (Object|null)
 *  If shouldSend is false, the item passed as a parameter should not be sent to Rollbar, and
 *  exactly one of error or payload will be non-null. If error is non-null, the returned Error will
 *  describe the situation, but it means that we were already over a rate limit (either globally or
 *  per minute) when this item was checked. If error is null, and therefore payload is non-null, it
 *  means this item put us over the global rate limit and the payload should be sent to Rollbar in
 *  place of the passed in item.
 */
RateLimiter.prototype.shouldSend = function (item, now) {
  now = now || _.now();
  var elapsedTime = now - this.startTime;
  if (elapsedTime < 0 || elapsedTime >= 60000) {
    this.startTime = now;
    this.perMinCounter = 0;
  }

  var globalRateLimit = RateLimiter.globalSettings.maxItems;
  var globalRateLimitPerMin = RateLimiter.globalSettings.itemsPerMinute;

  if (checkRate(item, globalRateLimit, this.counter)) {
    return shouldSendValue(
      this.platform,
      this.platformOptions,
      globalRateLimit + ' max items reached',
      false,
    );
  } else if (checkRate(item, globalRateLimitPerMin, this.perMinCounter)) {
    return shouldSendValue(
      this.platform,
      this.platformOptions,
      globalRateLimitPerMin + ' items per minute reached',
      false,
    );
  }
  this.counter++;
  this.perMinCounter++;

  var shouldSend = !checkRate(item, globalRateLimit, this.counter);
  var perMinute = shouldSend;
  shouldSend =
    shouldSend && !checkRate(item, globalRateLimitPerMin, this.perMinCounter);
  return shouldSendValue(
    this.platform,
    this.platformOptions,
    null,
    shouldSend,
    globalRateLimit,
    globalRateLimitPerMin,
    perMinute,
  );
};

RateLimiter.prototype.setPlatformOptions = function (platform, options) {
  this.platform = platform;
  this.platformOptions = options;
};

/* Helpers */

function checkRate(item, limit, counter) {
  return !item.ignoreRateLimit && limit >= 1 && counter > limit;
}

function shouldSendValue(
  platform,
  options,
  error,
  shouldSend,
  globalRateLimit,
  limitPerMin,
  perMinute,
) {
  var payload = null;
  if (error) {
    error = new Error(error);
  }
  if (!error && !shouldSend) {
    payload = rateLimitPayload(
      platform,
      options,
      globalRateLimit,
      limitPerMin,
      perMinute,
    );
  }
  return { error: error, shouldSend: shouldSend, payload: payload };
}

function rateLimitPayload(
  platform,
  options,
  globalRateLimit,
  limitPerMin,
  perMinute,
) {
  var environment =
    options.environment || (options.payload && options.payload.environment);
  var msg;
  if (perMinute) {
    msg = 'item per minute limit reached, ignoring errors until timeout';
  } else {
    msg = 'maxItems has been hit, ignoring errors until reset.';
  }
  var item = {
    body: {
      message: {
        body: msg,
        extra: {
          maxItems: globalRateLimit,
          itemsPerMinute: limitPerMin,
        },
      },
    },
    language: 'javascript',
    environment: environment,
    notifier: {
      version:
        (options.notifier && options.notifier.version) || options.version,
    },
  };
  if (platform === 'browser') {
    item.platform = 'browser';
    item.framework = 'browser-js';
    item.notifier.name = 'rollbar-browser-js';
  } else if (platform === 'server') {
    item.framework = options.framework || 'node-js';
    item.notifier.name = options.notifier.name;
  } else if (platform === 'react-native') {
    item.framework = options.framework || 'react-native';
    item.notifier.name = options.notifier.name;
  }
  return item;
}

module.exports = RateLimiter;


/***/ }),

/***/ 8073:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var polyfillJSON = __webpack_require__(9477);

module.exports = polyfillJSON;


/***/ }),

/***/ 8177:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

function buildPayload(data) {
  if (!_.isType(data.context, 'string')) {
    var contextResult = _.stringify(data.context);
    if (contextResult.error) {
      data.context = "Error: could not serialize 'context'";
    } else {
      data.context = contextResult.value || '';
    }
    if (data.context.length > 255) {
      data.context = data.context.substr(0, 255);
    }
  }
  return {
    data: data,
  };
}

function getTransportFromOptions(options, defaults, url) {
  var hostname = defaults.hostname;
  var protocol = defaults.protocol;
  var port = defaults.port;
  var path = defaults.path;
  var search = defaults.search;
  var timeout = options.timeout;
  var transport = detectTransport(options);

  var proxy = options.proxy;
  if (options.endpoint) {
    var opts = url.parse(options.endpoint);
    hostname = opts.hostname;
    protocol = opts.protocol;
    port = opts.port;
    path = opts.pathname;
    search = opts.search;
  }
  return {
    timeout: timeout,
    hostname: hostname,
    protocol: protocol,
    port: port,
    path: path,
    search: search,
    proxy: proxy,
    transport: transport,
  };
}

function detectTransport(options) {
  var gWindow =
    (typeof window != 'undefined' && window) ||
    (typeof self != 'undefined' && self);
  var transport = options.defaultTransport || 'xhr';
  if (typeof gWindow.fetch === 'undefined') transport = 'xhr';
  if (typeof gWindow.XMLHttpRequest === 'undefined') transport = 'fetch';
  return transport;
}

function transportOptions(transport, method) {
  var protocol = transport.protocol || 'https:';
  var port =
    transport.port ||
    (protocol === 'http:' ? 80 : protocol === 'https:' ? 443 : undefined);
  var hostname = transport.hostname;
  var path = transport.path;
  var timeout = transport.timeout;
  var transportAPI = transport.transport;
  if (transport.search) {
    path = path + transport.search;
  }
  if (transport.proxy) {
    path = protocol + '//' + hostname + path;
    hostname = transport.proxy.host || transport.proxy.hostname;
    port = transport.proxy.port;
    protocol = transport.proxy.protocol || protocol;
  }
  return {
    timeout: timeout,
    protocol: protocol,
    hostname: hostname,
    path: path,
    port: port,
    method: method,
    transport: transportAPI,
  };
}

function appendPathToPath(base, path) {
  var baseTrailingSlash = /\/$/.test(base);
  var pathBeginningSlash = /^\//.test(path);

  if (baseTrailingSlash && pathBeginningSlash) {
    path = path.substring(1);
  } else if (!baseTrailingSlash && !pathBeginningSlash) {
    path = '/' + path;
  }

  return base + path;
}

module.exports = {
  buildPayload: buildPayload,
  getTransportFromOptions: getTransportFromOptions,
  transportOptions: transportOptions,
  appendPathToPath: appendPathToPath,
};


/***/ }),

/***/ 8435:
/***/ ((module) => {

module.exports = {
  version: '3.0.0-alpha.0',
  endpoint: 'api.rollbar.com/api/1/item/',
  logLevel: 'debug',
  reportLevel: 'debug',
  uncaughtErrorLevel: 'error',
  maxItems: 0,
  itemsPerMin: 60,
};


/***/ }),

/***/ 8608:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

function itemToPayload(item, options, callback) {
  var data = item.data;

  if (item._isUncaught) {
    data._isUncaught = true;
  }
  if (item._originalArgs) {
    data._originalArgs = item._originalArgs;
  }
  callback(null, data);
}

function addPayloadOptions(item, options, callback) {
  var payloadOptions = options.payload || {};
  if (payloadOptions.body) {
    delete payloadOptions.body;
  }

  item.data = _.merge(item.data, payloadOptions);
  callback(null, item);
}

function addTelemetryData(item, options, callback) {
  if (item.telemetryEvents) {
    _.set(item, 'data.body.telemetry', item.telemetryEvents);
  }
  callback(null, item);
}

function addMessageWithError(item, options, callback) {
  if (!item.message) {
    callback(null, item);
    return;
  }
  var tracePath = 'data.body.trace_chain.0';
  var trace = _.get(item, tracePath);
  if (!trace) {
    tracePath = 'data.body.trace';
    trace = _.get(item, tracePath);
  }
  if (trace) {
    if (!(trace.exception && trace.exception.description)) {
      _.set(item, tracePath + '.exception.description', item.message);
      callback(null, item);
      return;
    }
    var extra = _.get(item, tracePath + '.extra') || {};
    var newExtra = _.merge(extra, { message: item.message });
    _.set(item, tracePath + '.extra', newExtra);
  }
  callback(null, item);
}

function userTransform(logger) {
  return function (item, options, callback) {
    var newItem = _.merge(item);
    var response = null;
    try {
      if (_.isFunction(options.transform)) {
        response = options.transform(newItem.data, item);
      }
    } catch (e) {
      options.transform = null;
      logger.error(
        'Error while calling custom transform() function. Removing custom transform().',
        e,
      );
      callback(null, item);
      return;
    }
    if (_.isPromise(response)) {
      response.then(
        function (promisedItem) {
          if (promisedItem) {
            newItem.data = promisedItem;
          }
          callback(null, newItem);
        },
        function (error) {
          callback(error, item);
        },
      );
    } else {
      callback(null, newItem);
    }
  };
}

function addConfigToPayload(item, options, callback) {
  if (!options.sendConfig) {
    return callback(null, item);
  }
  var configKey = '_rollbarConfig';
  var custom = _.get(item, 'data.custom') || {};
  custom[configKey] = options;
  item.data.custom = custom;
  callback(null, item);
}

function addFunctionOption(options, name) {
  if (_.isFunction(options[name])) {
    options[name] = options[name].toString();
  }
}

function addConfiguredOptions(item, options, callback) {
  var configuredOptions = options._configuredOptions;

  // These must be stringified or they'll get dropped during serialization.
  addFunctionOption(configuredOptions, 'transform');
  addFunctionOption(configuredOptions, 'checkIgnore');
  addFunctionOption(configuredOptions, 'onSendCallback');

  delete configuredOptions.accessToken;
  item.data.notifier.configured_options = configuredOptions;
  callback(null, item);
}

function addDiagnosticKeys(item, options, callback) {
  var diagnostic = _.merge(
    item.notifier.client.notifier.diagnostic,
    item.diagnostic,
  );

  if (_.get(item, 'err._isAnonymous')) {
    diagnostic.is_anonymous = true;
  }

  if (item._isUncaught) {
    diagnostic.is_uncaught = item._isUncaught;
  }

  if (item.err) {
    try {
      diagnostic.raw_error = {
        message: item.err.message,
        name: item.err.name,
        constructor_name: item.err.constructor && item.err.constructor.name,
        filename: item.err.fileName,
        line: item.err.lineNumber,
        column: item.err.columnNumber,
        stack: item.err.stack,
      };
    } catch (e) {
      diagnostic.raw_error = { failed: String(e) };
    }
  }

  item.data.notifier.diagnostic = _.merge(
    item.data.notifier.diagnostic,
    diagnostic,
  );
  callback(null, item);
}

module.exports = {
  itemToPayload: itemToPayload,
  addPayloadOptions: addPayloadOptions,
  addTelemetryData: addTelemetryData,
  addMessageWithError: addMessageWithError,
  userTransform: userTransform,
  addConfigToPayload: addConfigToPayload,
  addConfiguredOptions: addConfiguredOptions,
  addDiagnosticKeys: addDiagnosticKeys,
};


/***/ }),

/***/ 8663:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

function checkLevel(item, settings) {
  var level = item.level;
  var levelVal = _.LEVELS[level] || 0;
  var reportLevel = settings.reportLevel;
  var reportLevelVal = _.LEVELS[reportLevel] || 0;

  if (levelVal < reportLevelVal) {
    return false;
  }
  return true;
}

function userCheckIgnore(logger) {
  return function (item, settings) {
    var isUncaught = !!item._isUncaught;
    delete item._isUncaught;
    var args = item._originalArgs;
    delete item._originalArgs;
    try {
      if (_.isFunction(settings.onSendCallback)) {
        settings.onSendCallback(isUncaught, args, item);
      }
    } catch (e) {
      settings.onSendCallback = null;
      logger.error('Error while calling onSendCallback, removing', e);
    }
    try {
      if (
        _.isFunction(settings.checkIgnore) &&
        settings.checkIgnore(isUncaught, args, item)
      ) {
        return false;
      }
    } catch (e) {
      settings.checkIgnore = null;
      logger.error('Error while calling custom checkIgnore(), removing', e);
    }
    return true;
  };
}

function urlIsNotBlockListed(logger) {
  return function (item, settings) {
    return !urlIsOnAList(item, settings, 'blocklist', logger);
  };
}

function urlIsSafeListed(logger) {
  return function (item, settings) {
    return urlIsOnAList(item, settings, 'safelist', logger);
  };
}

function matchFrames(trace, list, block) {
  if (!trace) {
    return !block;
  }

  var frames = trace.frames;

  if (!frames || frames.length === 0) {
    return !block;
  }

  var frame, filename, url, urlRegex;
  var listLength = list.length;
  var frameLength = frames.length;
  for (var i = 0; i < frameLength; i++) {
    frame = frames[i];
    filename = frame.filename;

    if (!_.isType(filename, 'string')) {
      return !block;
    }

    for (var j = 0; j < listLength; j++) {
      url = list[j];
      urlRegex = new RegExp(url);

      if (urlRegex.test(filename)) {
        return true;
      }
    }
  }
  return false;
}

function urlIsOnAList(item, settings, safeOrBlock, logger) {
  // safelist is the default
  var block = false;
  if (safeOrBlock === 'blocklist') {
    block = true;
  }

  var list, traces;
  try {
    list = block ? settings.hostBlockList : settings.hostSafeList;
    traces = _.get(item, 'body.trace_chain') || [_.get(item, 'body.trace')];

    // These two checks are important to come first as they are defaults
    // in case the list is missing or the trace is missing or not well-formed
    if (!list || list.length === 0) {
      return !block;
    }
    if (traces.length === 0 || !traces[0]) {
      return !block;
    }

    var tracesLength = traces.length;
    for (var i = 0; i < tracesLength; i++) {
      if (matchFrames(traces[i], list, block)) {
        return true;
      }
    }
  } catch (
    e
    /* istanbul ignore next */
  ) {
    if (block) {
      settings.hostBlockList = null;
    } else {
      settings.hostSafeList = null;
    }
    var listName = block ? 'hostBlockList' : 'hostSafeList';
    logger.error(
      "Error while reading your configuration's " +
        listName +
        ' option. Removing custom ' +
        listName +
        '.',
      e,
    );
    return !block;
  }
  return false;
}

function messageIsIgnored(logger) {
  return function (item, settings) {
    var i, j, ignoredMessages, len, messageIsIgnored, rIgnoredMessage, messages;

    try {
      messageIsIgnored = false;
      ignoredMessages = settings.ignoredMessages;

      if (!ignoredMessages || ignoredMessages.length === 0) {
        return true;
      }

      messages = messagesFromItem(item);

      if (messages.length === 0) {
        return true;
      }

      len = ignoredMessages.length;
      for (i = 0; i < len; i++) {
        rIgnoredMessage = new RegExp(ignoredMessages[i], 'gi');

        for (j = 0; j < messages.length; j++) {
          messageIsIgnored = rIgnoredMessage.test(messages[j]);

          if (messageIsIgnored) {
            return false;
          }
        }
      }
    } catch (
      e
      /* istanbul ignore next */
    ) {
      settings.ignoredMessages = null;
      logger.error(
        "Error while reading your configuration's ignoredMessages option. Removing custom ignoredMessages.",
      );
    }

    return true;
  };
}

function messagesFromItem(item) {
  var body = item.body;
  var messages = [];

  // The payload schema only allows one of trace_chain, message, or trace.
  // However, existing test cases are based on having both trace and message present.
  // So here we preserve the ability to collect strings from any combination of these keys.
  if (body.trace_chain) {
    var traceChain = body.trace_chain;
    for (var i = 0; i < traceChain.length; i++) {
      var trace = traceChain[i];
      messages.push(_.get(trace, 'exception.message'));
    }
  }
  if (body.trace) {
    messages.push(_.get(body, 'trace.exception.message'));
  }
  if (body.message) {
    messages.push(_.get(body, 'message.body'));
  }
  return messages;
}

module.exports = {
  checkLevel: checkLevel,
  userCheckIgnore: userCheckIgnore,
  urlIsNotBlockListed: urlIsNotBlockListed,
  urlIsSafeListed: urlIsSafeListed,
  messageIsIgnored: messageIsIgnored,
};


/***/ }),

/***/ 8816:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

/*
 * Queue - an object which handles which handles a queue of items to be sent to Rollbar.
 *   This object handles rate limiting via a passed in rate limiter, retries based on connection
 *   errors, and filtering of items based on a set of configurable predicates. The communication to
 *   the backend is performed via a given API object.
 *
 * @param rateLimiter - An object which conforms to the interface
 *    rateLimiter.shouldSend(item) -> bool
 * @param api - An object which conforms to the interface
 *    api.postItem(payload, function(err, response))
 * @param logger - An object used to log verbose messages if desired
 * @param options - see Queue.prototype.configure
 * @param replayMap - Optional ReplayMap for coordinating session replay with error occurrences
 */
function Queue(rateLimiter, api, logger, options, replayMap) {
  this.rateLimiter = rateLimiter;
  this.api = api;
  this.logger = logger;
  this.options = options;
  this.replayMap = replayMap;
  this.predicates = [];
  this.pendingItems = [];
  this.pendingRequests = [];
  this.retryQueue = [];
  this.retryHandle = null;
  this.waitCallback = null;
  this.waitIntervalID = null;
}

/*
 * configure - updates the options this queue uses
 *
 * @param options
 */
Queue.prototype.configure = function (options) {
  this.api && this.api.configure(options);
  var oldOptions = this.options;
  this.options = _.merge(oldOptions, options);
  return this;
};

/*
 * addPredicate - adds a predicate to the end of the list of predicates for this queue
 *
 * @param predicate - function(item, options) -> (bool|{err: Error})
 *  Returning true means that this predicate passes and the item is okay to go on the queue
 *  Returning false means do not add the item to the queue, but it is not an error
 *  Returning {err: Error} means do not add the item to the queue, and the given error explains why
 *  Returning {err: undefined} is equivalent to returning true but don't do that
 */
Queue.prototype.addPredicate = function (predicate) {
  if (_.isFunction(predicate)) {
    this.predicates.push(predicate);
  }
  return this;
};

Queue.prototype.addPendingItem = function (item) {
  this.pendingItems.push(item);
};

Queue.prototype.removePendingItem = function (item) {
  var idx = this.pendingItems.indexOf(item);
  if (idx !== -1) {
    this.pendingItems.splice(idx, 1);
  }
};

/*
 * addItem - Send an item to the Rollbar API if all of the predicates are satisfied
 *
 * @param item - The payload to send to the backend
 * @param callback - function(error, repsonse) which will be called with the response from the API
 *  in the case of a success, otherwise response will be null and error will have a value. If both
 *  error and response are null then the item was stopped by a predicate which did not consider this
 *  to be an error condition, but nonetheless did not send the item to the API.
 *  @param originalError - The original error before any transformations that is to be logged if any
 */
Queue.prototype.addItem = function (
  item,
  callback,
  originalError,
  originalItem,
) {
  if (!callback || !_.isFunction(callback)) {
    callback = function () {
      return;
    };
  }
  var predicateResult = this._applyPredicates(item);
  if (predicateResult.stop) {
    this.removePendingItem(originalItem);
    callback(predicateResult.err);
    return;
  }
  this._maybeLog(item, originalError);
  this.removePendingItem(originalItem);
  if (!this.options.transmit) {
    callback(new Error('Transmit disabled'));
    return;
  }

  if (this.replayMap && item.body) {
    const replayId = this.replayMap.add(item.uuid);
    item.replayId = replayId;
  }

  this.pendingRequests.push(item);
  try {
    this._makeApiRequest(
      item,
      function (err, resp) {
        this._dequeuePendingRequest(item);

        if (!err && resp && item.replayId) {
          this._handleReplayResponse(item.replayId, resp);
        }

        callback(err, resp);
      }.bind(this),
    );
  } catch (e) {
    this._dequeuePendingRequest(item);
    callback(e);
  }
};

/*
 * wait - Stop any further errors from being added to the queue, and get called back when all items
 *   currently processing have finished sending to the backend.
 *
 * @param callback - function() called when all pending items have been sent
 */
Queue.prototype.wait = function (callback) {
  if (!_.isFunction(callback)) {
    return;
  }
  this.waitCallback = callback;
  if (this._maybeCallWait()) {
    return;
  }
  if (this.waitIntervalID) {
    this.waitIntervalID = clearInterval(this.waitIntervalID);
  }
  this.waitIntervalID = setInterval(
    function () {
      this._maybeCallWait();
    }.bind(this),
    500,
  );
};

/* _applyPredicates - Sequentially applies the predicates that have been added to the queue to the
 *   given item with the currently configured options.
 *
 * @param item - An item in the queue
 * @returns {stop: bool, err: (Error|null)} - stop being true means do not add item to the queue,
 *   the error value should be passed up to a callbak if we are stopping.
 */
Queue.prototype._applyPredicates = function (item) {
  var p = null;
  for (var i = 0, len = this.predicates.length; i < len; i++) {
    p = this.predicates[i](item, this.options);
    if (!p || p.err !== undefined) {
      return { stop: true, err: p.err };
    }
  }
  return { stop: false, err: null };
};

/*
 * _makeApiRequest - Send an item to Rollbar, callback when done, if there is an error make an
 *   effort to retry if we are configured to do so.
 *
 * @param item - an item ready to send to the backend
 * @param callback - function(err, response)
 */
Queue.prototype._makeApiRequest = function (item, callback) {
  var rateLimitResponse = this.rateLimiter.shouldSend(item);
  if (rateLimitResponse.shouldSend) {
    this.api.postItem(
      item,
      function (err, resp) {
        if (err) {
          this._maybeRetry(err, item, callback);
        } else {
          callback(err, resp);
        }
      }.bind(this),
    );
  } else if (rateLimitResponse.error) {
    callback(rateLimitResponse.error);
  } else {
    this.api.postItem(rateLimitResponse.payload, callback);
  }
};

// These are errors basically mean there is no internet connection
var RETRIABLE_ERRORS = [
  'ECONNRESET',
  'ENOTFOUND',
  'ESOCKETTIMEDOUT',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'EPIPE',
  'EAI_AGAIN',
];

/*
 * _maybeRetry - Given the error returned by the API, decide if we should retry or just callback
 *   with the error.
 *
 * @param err - an error returned by the API transport
 * @param item - the item that was trying to be sent when this error occured
 * @param callback - function(err, response)
 */
Queue.prototype._maybeRetry = function (err, item, callback) {
  var shouldRetry = false;
  if (this.options.retryInterval) {
    for (var i = 0, len = RETRIABLE_ERRORS.length; i < len; i++) {
      if (err.code === RETRIABLE_ERRORS[i]) {
        shouldRetry = true;
        break;
      }
    }
    if (shouldRetry && _.isFiniteNumber(this.options.maxRetries)) {
      item.retries = item.retries ? item.retries + 1 : 1;
      if (item.retries > this.options.maxRetries) {
        shouldRetry = false;
      }
    }
  }
  if (shouldRetry) {
    this._retryApiRequest(item, callback);
  } else {
    callback(err);
  }
};

/*
 * _retryApiRequest - Add an item and a callback to a queue and possibly start a timer to process
 *   that queue based on the retryInterval in the options for this queue.
 *
 * @param item - an item that failed to send due to an error we deem retriable
 * @param callback - function(err, response)
 */
Queue.prototype._retryApiRequest = function (item, callback) {
  this.retryQueue.push({ item: item, callback: callback });

  if (!this.retryHandle) {
    this.retryHandle = setInterval(
      function () {
        while (this.retryQueue.length) {
          var retryObject = this.retryQueue.shift();
          this._makeApiRequest(retryObject.item, retryObject.callback);
        }
      }.bind(this),
      this.options.retryInterval,
    );
  }
};

/*
 * _dequeuePendingRequest - Removes the item from the pending request queue, this queue is used to
 *   enable to functionality of providing a callback that clients can pass to `wait` to be notified
 *   when the pending request queue has been emptied. This must be called when the API finishes
 *   processing this item. If a `wait` callback is configured, it is called by this function.
 *
 * @param item - the item previously added to the pending request queue
 */
Queue.prototype._dequeuePendingRequest = function (item) {
  var idx = this.pendingRequests.indexOf(item);
  if (idx !== -1) {
    this.pendingRequests.splice(idx, 1);
    this._maybeCallWait();
  }
};

Queue.prototype._maybeLog = function (data, originalError) {
  if (this.logger && this.options.verbose) {
    var message = originalError;
    message = message || _.get(data, 'body.trace.exception.message');
    message = message || _.get(data, 'body.trace_chain.0.exception.message');
    if (message) {
      this.logger.error(message);
      return;
    }
    message = _.get(data, 'body.message.body');
    if (message) {
      this.logger.log(message);
    }
  }
};

Queue.prototype._maybeCallWait = function () {
  if (
    _.isFunction(this.waitCallback) &&
    this.pendingItems.length === 0 &&
    this.pendingRequests.length === 0
  ) {
    if (this.waitIntervalID) {
      this.waitIntervalID = clearInterval(this.waitIntervalID);
    }
    this.waitCallback();
    return true;
  }
  return false;
};

/**
 * Handles the API response for an item with a replay ID.
 * Based on the success or failure status of the response,
 * it either sends or discards the associated session replay.
 *
 * @param {string} replayId - The ID of the replay to handle
 * @param {Object} response - The API response
 * @returns {Promise<boolean>} A promise that resolves to true if replay was sent successfully,
 *                             false if replay was discarded or an error occurred
 * @private
 */
Queue.prototype._handleReplayResponse = async function (replayId, response) {
  if (!this.replayMap) {
    console.warn('Queue._handleReplayResponse: ReplayMap not available');
    return false;
  }

  if (!replayId) {
    console.warn('Queue._handleReplayResponse: No replayId provided');
    return false;
  }

  try {
    // Success condition might need adjustment based on API response structure
    if (response && response.err === 0) {
      const result = await this.replayMap.send(replayId);
      return result;
    } else {
      this.replayMap.discard(replayId);
      return false;
    }
  } catch (error) {
    console.error('Error handling replay response:', error);
    return false;
  }
};

module.exports = Queue;


/***/ }),

/***/ 8854:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var logger = __webpack_require__(6604);
var _ = __webpack_require__(1511);

function makeFetchRequest(accessToken, url, method, data, callback, timeout) {
  var controller;
  var timeoutId;

  if (_.isFiniteNumber(timeout)) {
    controller = new AbortController();
    timeoutId = setTimeout(function () {
      controller.abort();
    }, timeout);
  }

  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-Rollbar-Access-Token': accessToken,
      signal: controller && controller.signal,
    },
    body: data,
  })
    .then(function (response) {
      if (timeoutId) clearTimeout(timeoutId);
      return response.json();
    })
    .then(function (data) {
      callback(null, data);
    })
    .catch(function (error) {
      logger.error(error.message);
      callback(error);
    });
}

module.exports = makeFetchRequest;


/***/ }),

/***/ 8874:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var ErrorStackParser = __webpack_require__(5236);

var UNKNOWN_FUNCTION = '?';
var ERR_CLASS_REGEXP = new RegExp(
  '^(([a-zA-Z0-9-_$ ]*): *)?(Uncaught )?([a-zA-Z0-9-_$ ]*): ',
);

function guessFunctionName() {
  return UNKNOWN_FUNCTION;
}

function gatherContext() {
  return null;
}

function Frame(stackFrame) {
  var data = {};

  data._stackFrame = stackFrame;

  data.url = stackFrame.fileName;
  data.line = stackFrame.lineNumber;
  data.func = stackFrame.functionName;
  data.column = stackFrame.columnNumber;
  data.args = stackFrame.args;

  data.context = gatherContext();

  return data;
}

function Stack(exception, skip) {
  function getStack() {
    var parserStack = [];

    skip = skip || 0;

    try {
      parserStack = ErrorStackParser.parse(exception);
    } catch (e) {
      parserStack = [];
    }

    var stack = [];

    for (var i = skip; i < parserStack.length; i++) {
      stack.push(new Frame(parserStack[i]));
    }

    return stack;
  }

  return {
    stack: getStack(),
    message: exception.message,
    name: _mostSpecificErrorName(exception),
    rawStack: exception.stack,
    rawException: exception,
  };
}

function parse(e, skip) {
  var err = e;

  if (err.nested || err.cause) {
    var traceChain = [];
    while (err) {
      traceChain.push(new Stack(err, skip));
      err = err.nested || err.cause;

      skip = 0; // Only apply skip value to primary error
    }

    // Return primary error with full trace chain attached.
    traceChain[0].traceChain = traceChain;
    return traceChain[0];
  } else {
    return new Stack(err, skip);
  }
}

function guessErrorClass(errMsg) {
  if (!errMsg || !errMsg.match) {
    return ['Unknown error. There was no error message to display.', ''];
  }
  var errClassMatch = errMsg.match(ERR_CLASS_REGEXP);
  var errClass = '(unknown)';

  if (errClassMatch) {
    errClass = errClassMatch[errClassMatch.length - 1];
    errMsg = errMsg.replace(
      (errClassMatch[errClassMatch.length - 2] || '') + errClass + ':',
      '',
    );
    errMsg = errMsg.replace(/(^[\s]+|[\s]+$)/g, '');
  }
  return [errClass, errMsg];
}

// * Prefers any value over an empty string
// * Prefers any value over 'Error' where possible
// * Prefers name over constructor.name when both are more specific than 'Error'
function _mostSpecificErrorName(error) {
  var name = error.name && error.name.length && error.name;
  var constructorName =
    error.constructor.name &&
    error.constructor.name.length &&
    error.constructor.name;

  if (!name || !constructorName) {
    return name || constructorName;
  }

  if (name === 'Error') {
    return constructorName;
  }
  return name;
}

module.exports = {
  guessFunctionName: guessFunctionName,
  guessErrorClass: guessErrorClass,
  gatherContext: gatherContext,
  parse: parse,
  Stack: Stack,
  Frame: Frame,
};


/***/ }),

/***/ 9034:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);

function checkIgnore(item, settings) {
  if (_.get(settings, 'plugins.jquery.ignoreAjaxErrors')) {
    return !_.get(item, 'body.message.extra.isAjax');
  }
  return true;
}

module.exports = {
  checkIgnore: checkIgnore,
};


/***/ }),

/***/ 9264:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Rollbar = __webpack_require__(1107);
const telemeter = __webpack_require__(1220);
const instrumenter = __webpack_require__(1047);
const polyfillJSON = __webpack_require__(8073);
const wrapGlobals = __webpack_require__(3188);
const scrub = __webpack_require__(4856);
const truncation = __webpack_require__(9926);
const Tracing = __webpack_require__(1441);
const Recorder = __webpack_require__(1318);

Rollbar.setComponents({
  telemeter: telemeter,
  instrumenter: instrumenter,
  polyfillJSON: polyfillJSON,
  wrapGlobals: wrapGlobals,
  scrub: scrub,
  truncation: truncation,
  tracing: Tracing.default,
  recorder: Recorder.default,
});

module.exports = Rollbar;


/***/ }),

/***/ 9287:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ App)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7876);
/* harmony import */ var styled_jsx_style__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4250);
/* harmony import */ var styled_jsx_style__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(styled_jsx_style__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8230);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7328);
/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(1401);
/* harmony import */ var _styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(4232);
/* harmony import */ var _rollbar_react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(3095);
/* harmony import */ var _rollbar_react__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(2982);
/* harmony import */ var _rollbar_react__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(3483);
/* harmony import */ var rollbar_src_browser_rollbar__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(9264);
/* harmony import */ var rollbar_src_browser_rollbar__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(rollbar_src_browser_rollbar__WEBPACK_IMPORTED_MODULE_6__);








const rollbarConfig = {
    //accessToken: "edd42e75a1f64fbdb534b174079f0bb1",
    accessToken: "d8c0f28d2b3744ed9cf4aebe54c21dd0",
    endpoint: "https://api.rollbar.com/api/1/item",
    //endpoint: "http://localhost:8000/api/1/item",
    captureUncaught: true,
    captureUnhandledRejections: true,
    recorder: {
        enabled: true,
        autoStart: true,
        debug: {
            logEmits: true
        }
    },
    payload: {
        environment: "testenv",
        code_version: "cf29e4a",
        client: {
            javascript: {
                source_map_enabled: true,
                code_version: "cf29e4a",
                guess_uncaught_frames: true
            },
            user_ip: "2001:268:98d5:9c3c:699f:9ef8:14fa:1050"
        },
        server: {
            host: "web:1",
            root: "webpack://_N_E/./pages/",
            branch: "main"
        },
        person: {
            id: 1234,
            email: "local@host.com",
            username: "localuser"
        }
    }
};
function App() {
    //console.log(rollbarConfig);
    const rollbar = new (rollbar_src_browser_rollbar__WEBPACK_IMPORTED_MODULE_6___default())(rollbarConfig);
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_rollbar_react__WEBPACK_IMPORTED_MODULE_7__/* .Provider */ .Kq, {
        instance: rollbar,
        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_rollbar_react__WEBPACK_IMPORTED_MODULE_8__/* .ErrorBoundary */ .t, {
            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Home, {})
        })
    });
}
function TestError() {
    const a = null;
    return a.hello();
}
function AnotherError() {
    const rollbar = useRollbar();
    const [flag, setFlag] = useState(false);
    useEffect(()=>{
        const a = null;
        setFlag(true);
        a.hello();
    });
    return /*#__PURE__*/ _jsx(_Fragment, {
        children: flag
    });
}
function Home() {
    const rollbar = (0,_rollbar_react__WEBPACK_IMPORTED_MODULE_9__/* .useRollbar */ .S)();
    // Function to trigger a manually reported error
    const triggerManualError = ()=>{
        try {
            // Simulate an error
            throw new Error("Manually triggered error for Rollbar testing");
        } catch (error) {
            // Manually report to Rollbar
            rollbar.error("Manual error caught and reported", error);
            alert("Error reported to Rollbar successfully!");
        }
    };
    // Function to trigger an uncaught error
    const triggerUncaughtError = ()=>{
        // This will cause an uncaught error that Rollbar should catch
        const nullObject = null;
        nullObject.nonExistentMethod();
    };
    // Function to trigger an error in a promise
    const triggerPromiseError = ()=>{
        // This creates a rejected promise that should be caught by Rollbar
        new Promise((resolve, reject)=>{
            reject(new Error("Promise rejection for Rollbar testing"));
        });
        alert("Promise error triggered!");
    };
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().container) || ""),
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_head__WEBPACK_IMPORTED_MODULE_3___default()), {
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("title", {
                        className: "jsx-25781291bf750",
                        children: "Create Next App"
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("link", {
                        rel: "icon",
                        href: "/favicon.ico",
                        className: "jsx-25781291bf750"
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("main", {
                className: "jsx-25781291bf750",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h1", {
                        className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().title) || ""),
                        children: [
                            "Read ",
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                href: "https://nextjs.org",
                                children: "Next.js!"
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                        className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().description) || ""),
                        children: [
                            "Get started by editing ",
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("code", {
                                className: "jsx-25781291bf750",
                                children: "pages/index.js"
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().errorButtons) || ""),
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", {
                                className: "jsx-25781291bf750",
                                children: "Rollbar Error Testing"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                                onClick: triggerManualError,
                                className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().errorButton) || ""),
                                children: "Trigger Manual Error"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                                onClick: triggerUncaughtError,
                                className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().errorButton) || ""),
                                children: "Trigger Uncaught Error"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", {
                                onClick: triggerPromiseError,
                                className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().errorButton) || ""),
                                children: "Trigger Promise Rejection"
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().grid) || ""),
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                href: "https://nextjs.org/docs",
                                className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().card) || ""),
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                        className: "jsx-25781291bf750",
                                        children: "Documentation →"
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                        className: "jsx-25781291bf750",
                                        children: "Find in-depth information about Next.js features and API."
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                href: "https://nextjs.org/learn",
                                className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().card) || ""),
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                        className: "jsx-25781291bf750",
                                        children: "Learn →"
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                        className: "jsx-25781291bf750",
                                        children: "Learn about Next.js in an interactive course with quizzes!"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                href: "https://github.com/vercel/next.js/tree/canary/examples",
                                className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().card) || ""),
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                        className: "jsx-25781291bf750",
                                        children: "Examples →"
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                        className: "jsx-25781291bf750",
                                        children: "Discover and deploy boilerplate example Next.js projects."
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                href: "https://vercel.com/import?filter=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app",
                                className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().card) || ""),
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", {
                                        className: "jsx-25781291bf750",
                                        children: "Deploy →"
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", {
                                        className: "jsx-25781291bf750",
                                        children: "Instantly deploy your Next.js site to a public URL with Vercel."
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("footer", {
                className: "jsx-25781291bf750",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                    href: "https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "jsx-25781291bf750",
                    children: [
                        "Powered by",
                        " ",
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", {
                            src: "/vercel.svg",
                            alt: "Vercel",
                            className: "jsx-25781291bf750" + " " + ((_styles_Home_module_css__WEBPACK_IMPORTED_MODULE_4___default().logo) || "")
                        })
                    ]
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)((styled_jsx_style__WEBPACK_IMPORTED_MODULE_1___default()), {
                id: "b934031353334047",
                children: "main.jsx-25781291bf750{padding:5rem 0;-webkit-box-flex:1;-webkit-flex:1;-moz-box-flex:1;-ms-flex:1;flex:1;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-moz-box-orient:vertical;-moz-box-direction:normal;-ms-flex-direction:column;flex-direction:column;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}footer.jsx-25781291bf750{width:100%;height:100px;border-top:1px solid#eaeaea;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}footer.jsx-25781291bf750 img.jsx-25781291bf750{margin-left:.5rem}footer.jsx-25781291bf750 a.jsx-25781291bf750{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;text-decoration:none;color:inherit}code.jsx-25781291bf750{background:#fafafa;-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px;padding:.75rem;font-size:1.1rem;font-family:Menlo,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New,monospace}"
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)((styled_jsx_style__WEBPACK_IMPORTED_MODULE_1___default()), {
                id: "b0cffc484a2fa82a",
                children: "html,body{padding:0;margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif}*{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}"
            })
        ]
    });
}


/***/ }),

/***/ 9477:
/***/ ((module) => {

//  json3.js
//  2017-02-21
//  Public Domain.
//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
//  See http://www.JSON.org/js.html
//  This code should be minified before deployment.
//  See http://javascript.crockford.com/jsmin.html

//  USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
//  NOT CONTROL.

//  This file creates a global JSON object containing two methods: stringify
//  and parse. This file provides the ES5 JSON capability to ES3 systems.
//  If a project might run on IE8 or earlier, then this file should be included.
//  This file does nothing on ES5 systems.

//      JSON.stringify(value, replacer, space)
//          value       any JavaScript value, usually an object or array.
//          replacer    an optional parameter that determines how object
//                      values are stringified for objects. It can be a
//                      function or an array of strings.
//          space       an optional parameter that specifies the indentation
//                      of nested structures. If it is omitted, the text will
//                      be packed without extra whitespace. If it is a number,
//                      it will specify the number of spaces to indent at each
//                      level. If it is a string (such as "\t" or "&nbsp;"),
//                      it contains the characters used to indent at each level.
//          This method produces a JSON text from a JavaScript value.
//          When an object value is found, if the object contains a toJSON
//          method, its toJSON method will be called and the result will be
//          stringified. A toJSON method does not serialize: it returns the
//          value represented by the name/value pair that should be serialized,
//          or undefined if nothing should be serialized. The toJSON method
//          will be passed the key associated with the value, and this will be
//          bound to the value.

//          For example, this would serialize Dates as ISO strings.

//              Date.prototype.toJSON = function (key) {
//                  function f(n) {
//                      // Format integers to have at least two digits.
//                      return (n < 10)
//                          ? "0" + n
//                          : n;
//                  }
//                  return this.getUTCFullYear()   + "-" +
//                       f(this.getUTCMonth() + 1) + "-" +
//                       f(this.getUTCDate())      + "T" +
//                       f(this.getUTCHours())     + ":" +
//                       f(this.getUTCMinutes())   + ":" +
//                       f(this.getUTCSeconds())   + "Z";
//              };

//          You can provide an optional replacer method. It will be passed the
//          key and value of each member, with this bound to the containing
//          object. The value that is returned from your method will be
//          serialized. If your method returns undefined, then the member will
//          be excluded from the serialization.

//          If the replacer parameter is an array of strings, then it will be
//          used to select the members to be serialized. It filters the results
//          such that only members with keys listed in the replacer array are
//          stringified.

//          Values that do not have JSON representations, such as undefined or
//          functions, will not be serialized. Such values in objects will be
//          dropped; in arrays they will be replaced with null. You can use
//          a replacer function to replace those with JSON values.

//          JSON.stringify(undefined) returns undefined.

//          The optional space parameter produces a stringification of the
//          value that is filled with line breaks and indentation to make it
//          easier to read.

//          If the space parameter is a non-empty string, then that string will
//          be used for indentation. If the space parameter is a number, then
//          the indentation will be that many spaces.

//          Example:

//          text = JSON.stringify(["e", {pluribus: "unum"}]);
//          // text is '["e",{"pluribus":"unum"}]'

//          text = JSON.stringify(["e", {pluribus: "unum"}], null, "\t");
//          // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

//          text = JSON.stringify([new Date()], function (key, value) {
//              return this[key] instanceof Date
//                  ? "Date(" + this[key] + ")"
//                  : value;
//          });
//          // text is '["Date(---current time---)"]'

//      JSON.parse(text, reviver)
//          This method parses a JSON text to produce an object or array.
//          It can throw a SyntaxError exception.
//          This has been modified to use JSON-js/json_parse_state.js as the
//          parser instead of the one built around eval found in JSON-js/json2.js

//          The optional reviver parameter is a function that can filter and
//          transform the results. It receives each of the keys and values,
//          and its return value is used instead of the original value.
//          If it returns what it received, then the structure is not modified.
//          If it returns undefined then the member is deleted.

//          Example:

//          // Parse the text. Values that look like ISO date strings will
//          // be converted to Date objects.

//          myData = JSON.parse(text, function (key, value) {
//              var a;
//              if (typeof value === "string") {
//                  a =
//   /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
//                  if (a) {
//                      return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
//                          +a[5], +a[6]));
//                  }
//              }
//              return value;
//          });

//          myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
//              var d;
//              if (typeof value === "string" &&
//                      value.slice(0, 5) === "Date(" &&
//                      value.slice(-1) === ")") {
//                  d = new Date(value.slice(5, -1));
//                  if (d) {
//                      return d;
//                  }
//              }
//              return value;
//          });

//  This is a reference implementation. You are free to copy, modify, or
//  redistribute.

/*jslint
  for, this
  */

/*property
  JSON, apply, call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
  getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
  lastIndex, length, parse, prototype, push, replace, slice, stringify,
  test, toJSON, toString, valueOf
  */

var setupCustomJSON = function(JSON) {

  var rx_one = /^[\],:{}\s]*$/;
  var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
  var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
  var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
  var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  function f(n) {
    // Format integers to have at least two digits.
    return n < 10
      ? "0" + n
      : n;
  }

  function this_value() {
    return this.valueOf();
  }

  if (typeof Date.prototype.toJSON !== "function") {

    Date.prototype.toJSON = function () {

      return isFinite(this.valueOf())
        ? this.getUTCFullYear() + "-" +
        f(this.getUTCMonth() + 1) + "-" +
        f(this.getUTCDate()) + "T" +
        f(this.getUTCHours()) + ":" +
        f(this.getUTCMinutes()) + ":" +
        f(this.getUTCSeconds()) + "Z"
        : null;
    };

    Boolean.prototype.toJSON = this_value;
    Number.prototype.toJSON = this_value;
    String.prototype.toJSON = this_value;
  }

  var gap;
  var indent;
  var meta;
  var rep;


  function quote(string) {

    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.

    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string)
      ? "\"" + string.replace(rx_escapable, function (a) {
        var c = meta[a];
        return typeof c === "string"
          ? c
          : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
      }) + "\""
    : "\"" + string + "\"";
  }


  function str(key, holder) {

    // Produce a string from holder[key].

    var i;          // The loop counter.
    var k;          // The member key.
    var v;          // The member value.
    var length;
    var mind = gap;
    var partial;
    var value = holder[key];

    // If the value has a toJSON method, call it to obtain a replacement value.

    if (value && typeof value === "object" &&
        typeof value.toJSON === "function") {
      value = value.toJSON(key);
    }

    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.

    if (typeof rep === "function") {
      value = rep.call(holder, key, value);
    }

    // What happens next depends on the value's type.

    switch (typeof value) {
      case "string":
        return quote(value);

      case "number":

        // JSON numbers must be finite. Encode non-finite numbers as null.

        return isFinite(value)
          ? String(value)
          : "null";

      case "boolean":
      case "null":

        // If the value is a boolean or null, convert it to a string. Note:
        // typeof null does not produce "null". The case is included here in
        // the remote chance that this gets fixed someday.

        return String(value);

        // If the type is "object", we might be dealing with an object or an array or
        // null.

      case "object":

        // Due to a specification blunder in ECMAScript, typeof null is "object",
        // so watch out for that case.

        if (!value) {
          return "null";
        }

        // Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

        // Is the value an array?

        if (Object.prototype.toString.apply(value) === "[object Array]") {

          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.

          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || "null";
          }

          // Join all of the elements together, separated with commas, and wrap them in
          // brackets.

          v = partial.length === 0
            ? "[]"
            : gap
            ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
            : "[" + partial.join(",") + "]";
          gap = mind;
          return v;
        }

        // If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === "object") {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === "string") {
              k = rep[i];
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (
                      gap
                      ? ": "
                      : ":"
                      ) + v);
              }
            }
          }
        } else {

          // Otherwise, iterate through all of the keys in the object.

          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (
                      gap
                      ? ": "
                      : ":"
                      ) + v);
              }
            }
          }
        }

        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0
          ? "{}"
          : gap
          ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
          : "{" + partial.join(",") + "}";
        gap = mind;
        return v;
    }
  }

  // If the JSON object does not yet have a stringify method, give it one.

  if (typeof JSON.stringify !== "function") {
    meta = {    // table of character substitutions
      "\b": "\\b",
      "\t": "\\t",
      "\n": "\\n",
      "\f": "\\f",
      "\r": "\\r",
      "\"": "\\\"",
      "\\": "\\\\"
    };
    JSON.stringify = function (value, replacer, space) {

      // The stringify method takes a value and an optional replacer, and an optional
      // space parameter, and returns a JSON text. The replacer can be a function
      // that can replace values, or an array of strings that will select the keys.
      // A default replacer method can be provided. Use of the space parameter can
      // produce text that is more easily readable.

      var i;
      gap = "";
      indent = "";

      // If the space parameter is a number, make an indent string containing that
      // many spaces.

      if (typeof space === "number") {
        for (i = 0; i < space; i += 1) {
          indent += " ";
        }

        // If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === "string") {
        indent = space;
      }

      // If there is a replacer, it must be a function or an array.
      // Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== "function" &&
          (typeof replacer !== "object" ||
           typeof replacer.length !== "number")) {
        throw new Error("JSON.stringify");
      }

      // Make a fake root object containing our value under the key of "".
      // Return the result of stringifying the value.

      return str("", {"": value});
    };
  }


  // If the JSON object does not yet have a parse method, give it one.

  if (typeof JSON.parse !== "function") {
    JSON.parse = (function () {

      // This function creates a JSON parse function that uses a state machine rather
      // than the dangerous eval function to parse a JSON text.

      var state;      // The state of the parser, one of
      // 'go'         The starting state
      // 'ok'         The final, accepting state
      // 'firstokey'  Ready for the first key of the object or
      //              the closing of an empty object
      // 'okey'       Ready for the next key of the object
      // 'colon'      Ready for the colon
      // 'ovalue'     Ready for the value half of a key/value pair
      // 'ocomma'     Ready for a comma or closing }
      // 'firstavalue' Ready for the first value of an array or
      //              an empty array
      // 'avalue'     Ready for the next value of an array
      // 'acomma'     Ready for a comma or closing ]
      var stack;      // The stack, for controlling nesting.
      var container;  // The current container object or array
      var key;        // The current key
      var value;      // The current value
      var escapes = { // Escapement translation table
        "\\": "\\",
        "\"": "\"",
        "/": "/",
        "t": "\t",
        "n": "\n",
        "r": "\r",
        "f": "\f",
        "b": "\b"
      };
      var string = {   // The actions for string tokens
        go: function () {
          state = "ok";
        },
        firstokey: function () {
          key = value;
          state = "colon";
        },
        okey: function () {
          key = value;
          state = "colon";
        },
        ovalue: function () {
          state = "ocomma";
        },
        firstavalue: function () {
          state = "acomma";
        },
        avalue: function () {
          state = "acomma";
        }
      };
      var number = {   // The actions for number tokens
        go: function () {
          state = "ok";
        },
        ovalue: function () {
          state = "ocomma";
        },
        firstavalue: function () {
          state = "acomma";
        },
        avalue: function () {
          state = "acomma";
        }
      };
      var action = {

        // The action table describes the behavior of the machine. It contains an
        // object for each token. Each object contains a method that is called when
        // a token is matched in a state. An object will lack a method for illegal
        // states.

        "{": {
          go: function () {
            stack.push({state: "ok"});
            container = {};
            state = "firstokey";
          },
          ovalue: function () {
            stack.push({container: container, state: "ocomma", key: key});
            container = {};
            state = "firstokey";
          },
          firstavalue: function () {
            stack.push({container: container, state: "acomma"});
            container = {};
            state = "firstokey";
          },
          avalue: function () {
            stack.push({container: container, state: "acomma"});
            container = {};
            state = "firstokey";
          }
        },
        "}": {
          firstokey: function () {
            var pop = stack.pop();
            value = container;
            container = pop.container;
            key = pop.key;
            state = pop.state;
          },
          ocomma: function () {
            var pop = stack.pop();
            container[key] = value;
            value = container;
            container = pop.container;
            key = pop.key;
            state = pop.state;
          }
        },
        "[": {
          go: function () {
            stack.push({state: "ok"});
            container = [];
            state = "firstavalue";
          },
          ovalue: function () {
            stack.push({container: container, state: "ocomma", key: key});
            container = [];
            state = "firstavalue";
          },
          firstavalue: function () {
            stack.push({container: container, state: "acomma"});
            container = [];
            state = "firstavalue";
          },
          avalue: function () {
            stack.push({container: container, state: "acomma"});
            container = [];
            state = "firstavalue";
          }
        },
        "]": {
          firstavalue: function () {
            var pop = stack.pop();
            value = container;
            container = pop.container;
            key = pop.key;
            state = pop.state;
          },
          acomma: function () {
            var pop = stack.pop();
            container.push(value);
            value = container;
            container = pop.container;
            key = pop.key;
            state = pop.state;
          }
        },
        ":": {
          colon: function () {
            if (Object.hasOwnProperty.call(container, key)) {
              throw new SyntaxError("Duplicate key '" + key + "\"");
            }
            state = "ovalue";
          }
        },
        ",": {
          ocomma: function () {
            container[key] = value;
            state = "okey";
          },
          acomma: function () {
            container.push(value);
            state = "avalue";
          }
        },
        "true": {
          go: function () {
            value = true;
            state = "ok";
          },
          ovalue: function () {
            value = true;
            state = "ocomma";
          },
          firstavalue: function () {
            value = true;
            state = "acomma";
          },
          avalue: function () {
            value = true;
            state = "acomma";
          }
        },
        "false": {
          go: function () {
            value = false;
            state = "ok";
          },
          ovalue: function () {
            value = false;
            state = "ocomma";
          },
          firstavalue: function () {
            value = false;
            state = "acomma";
          },
          avalue: function () {
            value = false;
            state = "acomma";
          }
        },
        "null": {
          go: function () {
            value = null;
            state = "ok";
          },
          ovalue: function () {
            value = null;
            state = "ocomma";
          },
          firstavalue: function () {
            value = null;
            state = "acomma";
          },
          avalue: function () {
            value = null;
            state = "acomma";
          }
        }
      };

      function debackslashify(text) {

        // Remove and replace any backslash escapement.

        return text.replace(/\\(?:u(.{4})|([^u]))/g, function (ignore, b, c) {
          return b
            ? String.fromCharCode(parseInt(b, 16))
            : escapes[c];
        });
      }

      return function (source, reviver) {

        // A regular expression is used to extract tokens from the JSON text.
        // The extraction process is cautious.

        var result;
        var tx = /^[\u0020\t\n\r]*(?:([,:\[\]{}]|true|false|null)|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)|"((?:[^\r\n\t\\\"]|\\(?:["\\\/trnfb]|u[0-9a-fA-F]{4}))*)")/;

        // Set the starting state.

        state = "go";

        // The stack records the container, key, and state for each object or array
        // that contains another object or array while processing nested structures.

        stack = [];

        // If any error occurs, we will catch it and ultimately throw a syntax error.

        try {

          // For each token...

          while (true) {
            result = tx.exec(source);
            if (!result) {
              break;
            }

            // result is the result array from matching the tokenizing regular expression.
            //  result[0] contains everything that matched, including any initial whitespace.
            //  result[1] contains any punctuation that was matched, or true, false, or null.
            //  result[2] contains a matched number, still in string form.
            //  result[3] contains a matched string, without quotes but with escapement.

            if (result[1]) {

              // Token: Execute the action for this state and token.

              action[result[1]][state]();

            } else if (result[2]) {

              // Number token: Convert the number string into a number value and execute
              // the action for this state and number.

              value = +result[2];
              number[state]();
            } else {

              // String token: Replace the escapement sequences and execute the action for
              // this state and string.

              value = debackslashify(result[3]);
              string[state]();
            }

            // Remove the token from the string. The loop will continue as long as there
            // are tokens. This is a slow process, but it allows the use of ^ matching,
            // which assures that no illegal tokens slip through.

            source = source.slice(result[0].length);
          }

          // If we find a state/token combination that is illegal, then the action will
          // cause an error. We handle the error by simply changing the state.

        } catch (e) {
          state = e;
        }

        // The parsing is finished. If we are not in the final "ok" state, or if the
        // remaining source contains anything except whitespace, then we did not have
        //a well-formed JSON text.

        if (state !== "ok" || (/[^\u0020\t\n\r]/.test(source))) {
          throw (state instanceof SyntaxError)
            ? state
            : new SyntaxError("JSON");
        }

        // If there is a reviver function, we recursively walk the new structure,
        // passing each name/value pair to the reviver function for possible
        // transformation, starting with a temporary root object that holds the current
        // value in an empty key. If there is not a reviver function, we simply return
        // that value.

        return (typeof reviver === "function")
          ? (function walk(holder, key) {
            var k;
            var v;
            var val = holder[key];
            if (val && typeof val === "object") {
              for (k in value) {
                if (Object.prototype.hasOwnProperty.call(val, k)) {
                  v = walk(val, k);
                  if (v !== undefined) {
                    val[k] = v;
                  } else {
                    delete val[k];
                  }
                }
              }
            }
            return reviver.call(holder, key, val);
          }({"": value}, ""))
        : value;
      };
    }());
  }
}

module.exports = setupCustomJSON;


/***/ }),

/***/ 9926:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _ = __webpack_require__(1511);
var traverse = __webpack_require__(4582);

function raw(payload, jsonBackup) {
  return [payload, _.stringify(payload, jsonBackup)];
}

function selectFrames(frames, range) {
  var len = frames.length;
  if (len > range * 2) {
    return frames.slice(0, range).concat(frames.slice(len - range));
  }
  return frames;
}

function truncateFrames(payload, jsonBackup, range) {
  range = typeof range === 'undefined' ? 30 : range;
  var body = payload.data.body;
  var frames;
  if (body.trace_chain) {
    var chain = body.trace_chain;
    for (var i = 0; i < chain.length; i++) {
      frames = chain[i].frames;
      frames = selectFrames(frames, range);
      chain[i].frames = frames;
    }
  } else if (body.trace) {
    frames = body.trace.frames;
    frames = selectFrames(frames, range);
    body.trace.frames = frames;
  }
  return [payload, _.stringify(payload, jsonBackup)];
}

function maybeTruncateValue(len, val) {
  if (!val) {
    return val;
  }
  if (val.length > len) {
    return val.slice(0, len - 3).concat('...');
  }
  return val;
}

function truncateStrings(len, payload, jsonBackup) {
  function truncator(k, v, seen) {
    switch (_.typeName(v)) {
      case 'string':
        return maybeTruncateValue(len, v);
      case 'object':
      case 'array':
        return traverse(v, truncator, seen);
      default:
        return v;
    }
  }
  payload = traverse(payload, truncator);
  return [payload, _.stringify(payload, jsonBackup)];
}

function truncateTraceData(traceData) {
  if (traceData.exception) {
    delete traceData.exception.description;
    traceData.exception.message = maybeTruncateValue(
      255,
      traceData.exception.message,
    );
  }
  traceData.frames = selectFrames(traceData.frames, 1);
  return traceData;
}

function minBody(payload, jsonBackup) {
  var body = payload.data.body;
  if (body.trace_chain) {
    var chain = body.trace_chain;
    for (var i = 0; i < chain.length; i++) {
      chain[i] = truncateTraceData(chain[i]);
    }
  } else if (body.trace) {
    body.trace = truncateTraceData(body.trace);
  }
  return [payload, _.stringify(payload, jsonBackup)];
}

function needsTruncation(payload, maxSize) {
  return _.maxByteSize(payload) > maxSize;
}

function truncate(payload, jsonBackup, maxSize) {
  maxSize = typeof maxSize === 'undefined' ? 512 * 1024 : maxSize;
  var strategies = [
    raw,
    truncateFrames,
    truncateStrings.bind(null, 1024),
    truncateStrings.bind(null, 512),
    truncateStrings.bind(null, 256),
    minBody,
  ];
  var strategy, results, result;

  while ((strategy = strategies.shift())) {
    results = strategy(payload, jsonBackup);
    payload = results[0];
    result = results[1];
    if (result.error || !needsTruncation(result.value, maxSize)) {
      return result;
    }
  }
  return result;
}

module.exports = {
  truncate: truncate,

  /* for testing */
  raw: raw,
  truncateFrames: truncateFrames,
  truncateStrings: truncateStrings,
  maybeTruncateValue: maybeTruncateValue,
};


/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ __webpack_require__.O(0, [726,230,57,636,593,792], () => (__webpack_exec__(2936)));
/******/ var __webpack_exports__ = __webpack_require__.O();
/******/ _N_E = __webpack_exports__;
/******/ }
]);
//# sourceMappingURL=index-bb061acc61208d47.js.map