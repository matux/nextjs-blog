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
      self.telemeter.captureLog(message, level, null, _.now());
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
  this.telemeter.captureNavigation(from, to, null, _.now());
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

  this.telemeter.captureLog(message, 'error', null, _.now());
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
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
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
const recorderDefaults = (__webpack_require__(6478)/* ["default"] */ .A);
const tracingDefaults = (__webpack_require__(1052)/* ["default"] */ .A);
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

  if (Telemeter) {
    this.telemeter = new Telemeter(this.options, this.tracing);
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

const MAX_EVENTS = 100;

// Temporary workaround while solving commonjs -> esm issues in Node 18 - 20.
function fromMillis(millis) {
  return [Math.trunc(millis / 1000), Math.round((millis % 1000) * 1e6)];
}

function Telemeter(options, tracing) {
  this.queue = [];
  this.options = _.merge(options);
  var maxTelemetryEvents = this.options.maxTelemetryEvents || MAX_EVENTS;
  this.maxQueueSize = Math.max(0, Math.min(maxTelemetryEvents, MAX_EVENTS));
  this.tracing = tracing;
  this.telemetrySpan = this.tracing?.startSpan('rollbar-telemetry', {});
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
  const message = err.message || String(err);
  var metadata = {message};
  if (err.stack) {
    metadata.stack = err.stack;
  }
  this.telemetrySpan?.addEvent(
    'rollbar-occurrence-event',
    {
      message,
      level,
      type: 'error',
      uuid: rollbarUUID,
      'occurrence.type': 'error', // deprecated
      'occurrence.uuid': rollbarUUID, // deprecated
    },

    fromMillis(timestamp),
  );

  return this.capture('error', metadata, level, rollbarUUID, timestamp);
};

Telemeter.prototype.captureLog = function (
  message,
  level,
  rollbarUUID,
  timestamp,
) {
  // If the uuid is present, this is a message occurrence.
  if (rollbarUUID) {
    this.telemetrySpan?.addEvent(
      'rollbar-occurrence-event',
      {
        message,
        level,
        type: 'message',
        uuid: rollbarUUID,
        'occurrence.type': 'message', // deprecated
        'occurrence.uuid': rollbarUUID, // deprecated
      },
      fromMillis(timestamp),
    );
  } else {
    this.telemetrySpan?.addEvent(
      'rollbar-log-event',
      {message, level},
      fromMillis(timestamp),
    );
  }

  return this.capture(
    'log',
    {message},
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

  const endTimeNano = (metadata.end_time_ms || 0) * 1e6;

  this.telemetrySpan?.addEvent(
    'rollbar-network-event',
    {
      type: metadata.subtype,
      method: metadata.method,
      url : metadata.url,
      statusCode : metadata.status_code,
      'request.headers': JSON.stringify(metadata.request_headers || {}),
      'response.headers': JSON.stringify(metadata.response?.headers || {}),
      'response.timeUnixNano': endTimeNano.toString(),
    },

    fromMillis(metadata.start_time_ms)
  );

  return this.capture('network', metadata, level, rollbarUUID, metadata.start_time_ms);
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

Telemeter.prototype.captureNavigation = function (from, to, rollbarUUID, timestamp) {
  this.telemetrySpan?.addEvent(
    'rollbar-navigation-event',
    {'previous.url.full': from, 'url.full': to},
    fromMillis(timestamp),
  );

  return this.capture(
    'navigation',
    {from, to},
    'info',
    rollbarUUID,
    timestamp,
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
/* harmony import */ var _logger_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6604);
/* harmony import */ var _logger_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_logger_js__WEBPACK_IMPORTED_MODULE_3__);






class Recorder {
  #options;
  #rrwebOptions;
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

    this.options = options;
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
    const {
      // Rollbar options
      enabled,
      autoStart,
      maxSeconds,
      triggerOptions,

      // disallowed rrweb options
      emit,
      checkoutEveryNms,

      // rrweb options
      ...rrwebOptions
    } = newOptions;
    this.#options = { enabled, autoStart, maxSeconds, triggerOptions };
    this.#rrwebOptions = rrwebOptions;

    if (this.isRecording && newOptions.enabled === false) {
      this.stop();
    }
  }

  checkoutEveryNms() {
    // Recording may be up to two checkout intervals, therefore the checkout
    // interval is set to half of the maxSeconds.
    return (this.options.maxSeconds || 10) * 1000 / 2;
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

    if (events.length < 2) {
      _logger_js__WEBPACK_IMPORTED_MODULE_3___default().error('Replay recording cannot have less than 2 events');
      return null;
    }

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
      return;
    }

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
      checkoutEveryNms: this.checkoutEveryNms(),
      errorHandler: (error) => {
        if (this.options.debug?.logErrors) {
          _logger_js__WEBPACK_IMPORTED_MODULE_3___default().error('Error during replay recording', error);
        }
        return true; // swallow the error instead of throwing it to the window
      },
      ...this.#rrwebOptions,
    });

    return this;
  }

  stop() {
    if (!this.isRecording) {
      return;
    }

    this.#stopFn();
    this.#stopFn = null;

    return this;
  }

  clear() {
    this.#events = {
      previous: [],
      current: [],
    };
  }

  _logEvent(event, isCheckout) {
    _logger_js__WEBPACK_IMPORTED_MODULE_3___default().log(
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
        'rollbar.environment':
          this.options.payload?.environment ?? this.options.environment,
      },
    };
  }

  get scope() {
    return {
      name: 'rollbar-browser-js',
      version: this.options.version,
    };
  }

  idGen(bytes = 16) {
    return id/* default */.A.gen(bytes);
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
    return this.with(
      this.setSpan(this.contextManager.active(), span),
      fn,
      thisArg,
      span,
    );
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

function addItemAttributes(itemData, attributes) {
  itemData.attributes = itemData.attributes || [];
  for (const a of attributes) {
    if (a.value === undefined) {
      continue;
    }
    itemData.attributes.push(a);
  }
}

function getItemAttribute(itemData, key) {
  const attributes = itemData.attributes || [];
  for (let i = 0; i < attributes.length; ++i) {
    if (attributes[i].key === key) {
      return attributes[i].value;
    }
  }
  return undefined;
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
  getItemAttribute: getItemAttribute,
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
  // Check payload.body to ensure only items are truncated.
  if (this.truncation && payload.body) {
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
    item.level = item.level || defaultLevel;

    const replayId = this._replayIdIfTriggered(item);
    this._addTracingAttributes(item, replayId);

    // Legacy OpenTracing support
    this._addTracingInfo(item);

    const telemeter = this.telemeter;
    if (telemeter) {
      telemeter._captureRollbarItem(item);
      item.telemetryEvents = telemeter.copyEvents() || [];

      if (telemeter.telemetrySpan) {
        telemeter.telemetrySpan.end({'rollbar.replay.id': replayId});
        telemeter.telemetrySpan = telemeter.tracing.startSpan('rollbar-telemetry', {});
      }
    }

    this.notifier.log(item, callback);
  } catch (e) {
    if (callback) {
      callback(e);
    }
    this.logger.error(e);
  }
};

Rollbar.prototype._addTracingAttributes = function (item, replayId) {
  const span = this.tracing?.getSpan();

  const attributes = [
    {key: 'replay_id', value: replayId},
    {key: 'session_id', value: this.tracing?.sessionId},
    {key: 'span_id', value: span?.spanId},
    {key: 'trace_id', value: span?.traceId},
  ];
  _.addItemAttributes(item.data, attributes);

  span?.addEvent(
    'rollbar.occurrence',
    [{key: 'rollbar.occurrence.uuid', value: item.uuid}],
  );
};

Rollbar.prototype._replayIdIfTriggered = function (item) {
  const levels = this.options.recorder?.triggerOptions?.item?.levels || [];
  if (levels.includes(item.level)) {
    return this.tracing?.idGen(8);
  }
}

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
/* harmony import */ var _logger_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6604);
/* harmony import */ var _logger_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_logger_js__WEBPACK_IMPORTED_MODULE_1__);



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
      const payload = this.#recorder.dump(
        this.#tracing,
        replayId,
        occurrenceUuid,
      );

      this.#map.set(replayId, payload);
    } catch (transformError) {
      _logger_js__WEBPACK_IMPORTED_MODULE_1___default().error('Error transforming spans:', transformError);

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
  add(replayId, occurrenceUuid) {
    replayId = replayId || _tracing_id_js__WEBPACK_IMPORTED_MODULE_0__/* ["default"] */ .A.gen(8);

    this._processReplay(replayId, occurrenceUuid).catch((error) => {
      _logger_js__WEBPACK_IMPORTED_MODULE_1___default().error('Failed to process replay:', error);
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
      _logger_js__WEBPACK_IMPORTED_MODULE_1___default().error('ReplayMap.send: No replayId provided');
      return false;
    }

    if (!this.#map.has(replayId)) {
      _logger_js__WEBPACK_IMPORTED_MODULE_1___default().error(`ReplayMap.send: No replay found for replayId: ${replayId}`);
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
      _logger_js__WEBPACK_IMPORTED_MODULE_1___default().error(
        `ReplayMap.send: No payload found for replayId: ${replayId}`,
      );
      return false;
    }

    try {
      await this.#api.postSpans(payload);
      return true;
    } catch (error) {
      _logger_js__WEBPACK_IMPORTED_MODULE_1___default().error('Error sending replay:', error);
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
      _logger_js__WEBPACK_IMPORTED_MODULE_1___default().error('ReplayMap.discard: No replayId provided');
      return false;
    }

    if (!this.#map.has(replayId)) {
      _logger_js__WEBPACK_IMPORTED_MODULE_1___default().error(
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
              const headers = {
                'Rollbar-Replay-Enabled': request.getResponseHeader(
                  'Rollbar-Replay-Enabled'
                ),
                'Rollbar-Replay-RateLimit-Remaining': request.getResponseHeader(
                  'Rollbar-Replay-RateLimit-Remaining'
                ),
                'Rollbar-Replay-RateLimit-Reset': request.getResponseHeader(
                  'Rollbar-Replay-RateLimit-Reset'
                ),
              }
              callback(parseResponse.error, parseResponse.value, headers);
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
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* provided dependency */ var Buffer = __webpack_require__(4964)["hp"];
/* provided dependency */ var process = __webpack_require__(8877);
/*! For license information please see rollbar.umd.min.js.LICENSE.txt */
!function(t,e){ true?module.exports=e():0}(this,(function(){return function(){var t={1:function(t,e){"use strict";function r(t){return[Math.trunc(t/1e3),Math.round(t%1e3*1e6)]}function n(t,e){return[t[0]+e[0]+Math.trunc((t[1]+e[1])/1e9),(t[1]+e[1])%1e9]}e.A={fromMillis:r,toMillis:function(t){return 1e3*t[0]+Math.round(t[1]/1e6)},toNanos:function(t){return 1e9*t[0]+t[1]},add:n,now:function(){return n(r(performance.timeOrigin),r(performance.now()))},isHrTime:function(t){return Array.isArray(t)&&2===t.length&&"number"==typeof t[0]&&"number"==typeof t[1]}}},14:function(t,e,r){function n(t){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n(t)}function o(){"use strict";o=function(){return e};var t,e={},r=Object.prototype,i=r.hasOwnProperty,s=Object.defineProperty||function(t,e,r){t[e]=r.value},a="function"==typeof Symbol?Symbol:{},l=a.iterator||"@@iterator",u=a.asyncIterator||"@@asyncIterator",c=a.toStringTag||"@@toStringTag";function h(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{h({},"")}catch(t){h=function(t,e,r){return t[e]=r}}function p(t,e,r,n){var o=e&&e.prototype instanceof b?e:b,i=Object.create(o.prototype),a=new T(n||[]);return s(i,"_invoke",{value:R(t,r,a)}),i}function f(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}e.wrap=p;var d="suspendedStart",m="suspendedYield",y="executing",g="completed",v={};function b(){}function w(){}function S(){}var x={};h(x,l,(function(){return this}));var k=Object.getPrototypeOf,C=k&&k(k(L([])));C&&C!==r&&i.call(C,l)&&(x=C);var I=S.prototype=b.prototype=Object.create(x);function O(t){["next","throw","return"].forEach((function(e){h(t,e,(function(t){return this._invoke(e,t)}))}))}function E(t,e){function r(o,s,a,l){var u=f(t[o],t,s);if("throw"!==u.type){var c=u.arg,h=c.value;return h&&"object"==n(h)&&i.call(h,"__await")?e.resolve(h.__await).then((function(t){r("next",t,a,l)}),(function(t){r("throw",t,a,l)})):e.resolve(h).then((function(t){c.value=t,a(c)}),(function(t){return r("throw",t,a,l)}))}l(u.arg)}var o;s(this,"_invoke",{value:function(t,n){function i(){return new e((function(e,o){r(t,n,e,o)}))}return o=o?o.then(i,i):i()}})}function R(e,r,n){var o=d;return function(i,s){if(o===y)throw Error("Generator is already running");if(o===g){if("throw"===i)throw s;return{value:t,done:!0}}for(n.method=i,n.arg=s;;){var a=n.delegate;if(a){var l=A(a,n);if(l){if(l===v)continue;return l}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(o===d)throw o=g,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);o=y;var u=f(e,r,n);if("normal"===u.type){if(o=n.done?g:m,u.arg===v)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(o=g,n.method="throw",n.arg=u.arg)}}}function A(e,r){var n=r.method,o=e.iterator[n];if(o===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,A(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),v;var i=f(o,e.iterator,r.arg);if("throw"===i.type)return r.method="throw",r.arg=i.arg,r.delegate=null,v;var s=i.arg;return s?s.done?(r[e.resultName]=s.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,v):s:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,v)}function M(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function _(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function T(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(M,this),this.reset(!0)}function L(e){if(e||""===e){var r=e[l];if(r)return r.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,s=function r(){for(;++o<e.length;)if(i.call(e,o))return r.value=e[o],r.done=!1,r;return r.value=t,r.done=!0,r};return s.next=s}}throw new TypeError(n(e)+" is not iterable")}return w.prototype=S,s(I,"constructor",{value:S,configurable:!0}),s(S,"constructor",{value:w,configurable:!0}),w.displayName=h(S,c,"GeneratorFunction"),e.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===w||"GeneratorFunction"===(e.displayName||e.name))},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,S):(t.__proto__=S,h(t,c,"GeneratorFunction")),t.prototype=Object.create(I),t},e.awrap=function(t){return{__await:t}},O(E.prototype),h(E.prototype,u,(function(){return this})),e.AsyncIterator=E,e.async=function(t,r,n,o,i){void 0===i&&(i=Promise);var s=new E(p(t,r,n,o),i);return e.isGeneratorFunction(r)?s:s.next().then((function(t){return t.done?t.value:s.next()}))},O(I),h(I,c,"Generator"),h(I,l,(function(){return this})),h(I,"toString",(function(){return"[object Generator]"})),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},e.values=L,T.prototype={constructor:T,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(_),!e)for(var r in this)"t"===r.charAt(0)&&i.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function n(n,o){return a.type="throw",a.arg=e,r.next=n,o&&(r.method="next",r.arg=t),!!o}for(var o=this.tryEntries.length-1;o>=0;--o){var s=this.tryEntries[o],a=s.completion;if("root"===s.tryLoc)return n("end");if(s.tryLoc<=this.prev){var l=i.call(s,"catchLoc"),u=i.call(s,"finallyLoc");if(l&&u){if(this.prev<s.catchLoc)return n(s.catchLoc,!0);if(this.prev<s.finallyLoc)return n(s.finallyLoc)}else if(l){if(this.prev<s.catchLoc)return n(s.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<s.finallyLoc)return n(s.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&i.call(n,"finallyLoc")&&this.prev<n.finallyLoc){var o=n;break}}o&&("break"===t||"continue"===t)&&o.tryLoc<=e&&e<=o.finallyLoc&&(o=null);var s=o?o.completion:{};return s.type=t,s.arg=e,o?(this.method="next",this.next=o.finallyLoc,v):this.complete(s)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),v},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),_(r),v}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;_(r)}return o}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:L(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),v}},e}function i(t,e,r,n,o,i,s){try{var a=t[i](s),l=a.value}catch(t){return void r(t)}a.done?e(l):Promise.resolve(l).then(n,o)}var s=r(585);function a(t,e,r,n,o){this.rateLimiter=t,this.api=e,this.logger=r,this.options=n,this.replayMap=o,this.predicates=[],this.pendingItems=[],this.pendingRequests=[],this.retryQueue=[],this.retryHandle=null,this.waitCallback=null,this.waitIntervalID=null}a.prototype.configure=function(t){this.api&&this.api.configure(t);var e=this.options;return this.options=s.merge(e,t),this},a.prototype.addPredicate=function(t){return s.isFunction(t)&&this.predicates.push(t),this},a.prototype.addPendingItem=function(t){this.pendingItems.push(t)},a.prototype.removePendingItem=function(t){var e=this.pendingItems.indexOf(t);-1!==e&&this.pendingItems.splice(e,1)},a.prototype.addItem=function(t,e,r,n){e&&s.isFunction(e)||(e=function(){});var o=this._applyPredicates(t);if(o.stop)return this.removePendingItem(n),void e(o.err);if(this._maybeLog(t,r),this.removePendingItem(n),this.options.transmit){if(this.replayMap&&t.body){var i=s.getItemAttribute(t,"replay_id");i&&(t.replayId=this.replayMap.add(i,t.uuid))}this.pendingRequests.push(t);try{this._makeApiRequest(t,function(r,n,o){this._dequeuePendingRequest(t),!r&&n&&t.replayId&&this._handleReplayResponse(t.replayId,n,o),e(r,n)}.bind(this))}catch(r){this._dequeuePendingRequest(t),e(r)}}else e(new Error("Transmit disabled"))},a.prototype.wait=function(t){s.isFunction(t)&&(this.waitCallback=t,this._maybeCallWait()||(this.waitIntervalID&&(this.waitIntervalID=clearInterval(this.waitIntervalID)),this.waitIntervalID=setInterval(function(){this._maybeCallWait()}.bind(this),500)))},a.prototype._applyPredicates=function(t){for(var e=null,r=0,n=this.predicates.length;r<n;r++)if(!(e=this.predicates[r](t,this.options))||void 0!==e.err)return{stop:!0,err:e.err};return{stop:!1,err:null}},a.prototype._makeApiRequest=function(t,e){var r=this.rateLimiter.shouldSend(t);r.shouldSend?this.api.postItem(t,function(r,n,o){r?this._maybeRetry(r,t,e):e(r,n,o)}.bind(this)):r.error?e(r.error):this.api.postItem(r.payload,e)};var l=["ECONNRESET","ENOTFOUND","ESOCKETTIMEDOUT","ETIMEDOUT","ECONNREFUSED","EHOSTUNREACH","EPIPE","EAI_AGAIN"];a.prototype._maybeRetry=function(t,e,r){var n=!1;if(this.options.retryInterval){for(var o=0,i=l.length;o<i;o++)if(t.code===l[o]){n=!0;break}n&&s.isFiniteNumber(this.options.maxRetries)&&(e.retries=e.retries?e.retries+1:1,e.retries>this.options.maxRetries&&(n=!1))}n?this._retryApiRequest(e,r):r(t)},a.prototype._retryApiRequest=function(t,e){this.retryQueue.push({item:t,callback:e}),this.retryHandle||(this.retryHandle=setInterval(function(){for(;this.retryQueue.length;){var t=this.retryQueue.shift();this._makeApiRequest(t.item,t.callback)}}.bind(this),this.options.retryInterval))},a.prototype._dequeuePendingRequest=function(t){var e=this.pendingRequests.indexOf(t);-1!==e&&(this.pendingRequests.splice(e,1),this._maybeCallWait())},a.prototype._maybeLog=function(t,e){if(this.logger&&this.options.verbose){var r=e;if(r=(r=r||s.get(t,"body.trace.exception.message"))||s.get(t,"body.trace_chain.0.exception.message"))return void this.logger.error(r);(r=s.get(t,"body.message.body"))&&this.logger.log(r)}},a.prototype._maybeCallWait=function(){return!(!s.isFunction(this.waitCallback)||0!==this.pendingItems.length||0!==this.pendingRequests.length)&&(this.waitIntervalID&&(this.waitIntervalID=clearInterval(this.waitIntervalID)),this.waitCallback(),!0)},a.prototype._handleReplayResponse=function(){var t,e=(t=o().mark((function t(e,r,n){return o().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(this.replayMap){t.next=3;break}return console.warn("Queue._handleReplayResponse: ReplayMap not available"),t.abrupt("return",!1);case 3:if(e){t.next=6;break}return console.warn("Queue._handleReplayResponse: No replayId provided"),t.abrupt("return",!1);case 6:if(t.prev=6,!this._shouldSendReplay(r,n)){t.next=13;break}return t.next=10,this.replayMap.send(e);case 10:return t.abrupt("return",t.sent);case 13:return this.replayMap.discard(e),t.abrupt("return",!1);case 15:t.next=21;break;case 17:return t.prev=17,t.t0=t.catch(6),console.error("Error handling replay response:",t.t0),t.abrupt("return",!1);case 21:case"end":return t.stop()}}),t,this,[[6,17]])})),function(){var e=this,r=arguments;return new Promise((function(n,o){var s=t.apply(e,r);function a(t){i(s,n,o,a,l,"next",t)}function l(t){i(s,n,o,a,l,"throw",t)}a(void 0)}))});return function(t,r,n){return e.apply(this,arguments)}}(),a.prototype._shouldSendReplay=function(t,e){return!(0!==(null==t?void 0:t.err)||!e||"true"!==e["Rollbar-Replay-Enabled"]||"0"===e["Rollbar-Replay-RateLimit-Remaining"])},t.exports=a},49:function(t,e,r){function n(t){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n(t)}function o(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function i(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?o(Object(r),!0).forEach((function(e){s(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function s(t,e,r){return(e=function(t){var e=function(t,e){if("object"!=n(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var o=r.call(t,e||"default");if("object"!=n(o))return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==n(e)?e:e+""}(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function a(){"use strict";a=function(){return e};var t,e={},r=Object.prototype,o=r.hasOwnProperty,i=Object.defineProperty||function(t,e,r){t[e]=r.value},s="function"==typeof Symbol?Symbol:{},l=s.iterator||"@@iterator",u=s.asyncIterator||"@@asyncIterator",c=s.toStringTag||"@@toStringTag";function h(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{h({},"")}catch(t){h=function(t,e,r){return t[e]=r}}function p(t,e,r,n){var o=e&&e.prototype instanceof b?e:b,s=Object.create(o.prototype),a=new T(n||[]);return i(s,"_invoke",{value:R(t,r,a)}),s}function f(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}e.wrap=p;var d="suspendedStart",m="suspendedYield",y="executing",g="completed",v={};function b(){}function w(){}function S(){}var x={};h(x,l,(function(){return this}));var k=Object.getPrototypeOf,C=k&&k(k(L([])));C&&C!==r&&o.call(C,l)&&(x=C);var I=S.prototype=b.prototype=Object.create(x);function O(t){["next","throw","return"].forEach((function(e){h(t,e,(function(t){return this._invoke(e,t)}))}))}function E(t,e){function r(i,s,a,l){var u=f(t[i],t,s);if("throw"!==u.type){var c=u.arg,h=c.value;return h&&"object"==n(h)&&o.call(h,"__await")?e.resolve(h.__await).then((function(t){r("next",t,a,l)}),(function(t){r("throw",t,a,l)})):e.resolve(h).then((function(t){c.value=t,a(c)}),(function(t){return r("throw",t,a,l)}))}l(u.arg)}var s;i(this,"_invoke",{value:function(t,n){function o(){return new e((function(e,o){r(t,n,e,o)}))}return s=s?s.then(o,o):o()}})}function R(e,r,n){var o=d;return function(i,s){if(o===y)throw Error("Generator is already running");if(o===g){if("throw"===i)throw s;return{value:t,done:!0}}for(n.method=i,n.arg=s;;){var a=n.delegate;if(a){var l=A(a,n);if(l){if(l===v)continue;return l}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(o===d)throw o=g,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);o=y;var u=f(e,r,n);if("normal"===u.type){if(o=n.done?g:m,u.arg===v)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(o=g,n.method="throw",n.arg=u.arg)}}}function A(e,r){var n=r.method,o=e.iterator[n];if(o===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,A(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),v;var i=f(o,e.iterator,r.arg);if("throw"===i.type)return r.method="throw",r.arg=i.arg,r.delegate=null,v;var s=i.arg;return s?s.done?(r[e.resultName]=s.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,v):s:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,v)}function M(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function _(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function T(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(M,this),this.reset(!0)}function L(e){if(e||""===e){var r=e[l];if(r)return r.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var i=-1,s=function r(){for(;++i<e.length;)if(o.call(e,i))return r.value=e[i],r.done=!1,r;return r.value=t,r.done=!0,r};return s.next=s}}throw new TypeError(n(e)+" is not iterable")}return w.prototype=S,i(I,"constructor",{value:S,configurable:!0}),i(S,"constructor",{value:w,configurable:!0}),w.displayName=h(S,c,"GeneratorFunction"),e.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===w||"GeneratorFunction"===(e.displayName||e.name))},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,S):(t.__proto__=S,h(t,c,"GeneratorFunction")),t.prototype=Object.create(I),t},e.awrap=function(t){return{__await:t}},O(E.prototype),h(E.prototype,u,(function(){return this})),e.AsyncIterator=E,e.async=function(t,r,n,o,i){void 0===i&&(i=Promise);var s=new E(p(t,r,n,o),i);return e.isGeneratorFunction(r)?s:s.next().then((function(t){return t.done?t.value:s.next()}))},O(I),h(I,c,"Generator"),h(I,l,(function(){return this})),h(I,"toString",(function(){return"[object Generator]"})),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},e.values=L,T.prototype={constructor:T,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(_),!e)for(var r in this)"t"===r.charAt(0)&&o.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function n(n,o){return a.type="throw",a.arg=e,r.next=n,o&&(r.method="next",r.arg=t),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var s=this.tryEntries[i],a=s.completion;if("root"===s.tryLoc)return n("end");if(s.tryLoc<=this.prev){var l=o.call(s,"catchLoc"),u=o.call(s,"finallyLoc");if(l&&u){if(this.prev<s.catchLoc)return n(s.catchLoc,!0);if(this.prev<s.finallyLoc)return n(s.finallyLoc)}else if(l){if(this.prev<s.catchLoc)return n(s.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<s.finallyLoc)return n(s.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&o.call(n,"finallyLoc")&&this.prev<n.finallyLoc){var i=n;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var s=i?i.completion:{};return s.type=t,s.arg=e,i?(this.method="next",this.next=i.finallyLoc,v):this.complete(s)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),v},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),_(r),v}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;_(r)}return o}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:L(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),v}},e}function l(t,e,r,n,o,i,s){try{var a=t[i](s),l=a.value}catch(t){return void r(t)}a.done?e(l):Promise.resolve(l).then(n,o)}var u=r(585),c=r(93),h={hostname:"api.rollbar.com",path:"/api/1/item/",search:null,version:"1",protocol:"https:",port:443},p={hostname:"api.rollbar.com",path:"/api/1/session/",search:null,version:"1",protocol:"https:",port:443};function f(t,e,r,n){this.options=t,this.transport=e,this.url=r,this.truncation=n,this.accessToken=t.accessToken,this.transportOptions=d(t,r),this.OTLPTransportOptions=m(t,r)}function d(t,e){return c.getTransportFromOptions(t,h,e)}function m(t,e){var r;return t=i(i({},t),{},{endpoint:null===(r=t.tracing)||void 0===r?void 0:r.endpoint}),c.getTransportFromOptions(t,p,e)}f.prototype._postPromise=function(t){var e=t.accessToken,r=t.transportOptions,n=t.payload,o=this;return new Promise((function(t,i){o.transport.post(e,r,n,(function(e,r){return e?i(e):t(r)}))}))},f.prototype.postItem=function(t,e){var r=c.transportOptions(this.transportOptions,"POST"),n=c.buildPayload(t),o=this;setTimeout((function(){o.transport.post(o.accessToken,r,n,e)}),0)},f.prototype.postSpans=function(){var t,e=(t=a().mark((function t(e){var r;return a().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return r=c.transportOptions(this.OTLPTransportOptions,"POST"),t.next=3,this._postPromise({accessToken:this.accessToken,transportOptions:r,payload:e});case 3:return t.abrupt("return",t.sent);case 4:case"end":return t.stop()}}),t,this)})),function(){var e=this,r=arguments;return new Promise((function(n,o){var i=t.apply(e,r);function s(t){l(i,n,o,s,a,"next",t)}function a(t){l(i,n,o,s,a,"throw",t)}s(void 0)}))});return function(t){return e.apply(this,arguments)}}(),f.prototype.buildJsonPayload=function(t,e){var r,n=c.buildPayload(t);return(r=this.truncation?this.truncation.truncate(n):u.stringify(n)).error?(e&&e(r.error),null):r.value},f.prototype.postJsonPayload=function(t,e){var r=c.transportOptions(this.transportOptions,"POST");this.transport.postJsonPayload(this.accessToken,r,t,e)},f.prototype.configure=function(t){var e=this.oldOptions;return this.options=u.merge(e,t),this.transportOptions=d(this.options,this.url),this.OTLPTransportOptions=m(this.options,this.url),void 0!==this.options.accessToken&&(this.accessToken=this.options.accessToken),this},t.exports=f},93:function(t,e,r){var n=r(585);t.exports={buildPayload:function(t){if(!n.isType(t.context,"string")){var e=n.stringify(t.context);e.error?t.context="Error: could not serialize 'context'":t.context=e.value||"",t.context.length>255&&(t.context=t.context.substr(0,255))}return{data:t}},getTransportFromOptions:function(t,e,r){var n=e.hostname,o=e.protocol,i=e.port,s=e.path,a=e.search,l=t.timeout,u=function(t){var e="undefined"!=typeof window&&window||"undefined"!=typeof self&&self,r=t.defaultTransport||"xhr";void 0===e.fetch&&(r="xhr");void 0===e.XMLHttpRequest&&(r="fetch");return r}(t),c=t.proxy;if(t.endpoint){var h=r.parse(t.endpoint);n=h.hostname,o=h.protocol,i=h.port,s=h.pathname,a=h.search}return{timeout:l,hostname:n,protocol:o,port:i,path:s,search:a,proxy:c,transport:u}},transportOptions:function(t,e){var r=t.protocol||"https:",n=t.port||("http:"===r?80:"https:"===r?443:void 0),o=t.hostname,i=t.path,s=t.timeout,a=t.transport;return t.search&&(i+=t.search),t.proxy&&(i=r+"//"+o+i,o=t.proxy.host||t.proxy.hostname,n=t.proxy.port,r=t.proxy.protocol||r),{timeout:s,protocol:r,hostname:o,path:i,port:n,method:e,transport:a}},appendPathToPath:function(t,e){var r=/\/$/.test(t),n=/^\//.test(e);return r&&n?e=e.substring(1):r||n||(e="/"+e),t+e}}},98:function(t,e,r){var n=r(585);t.exports=function(t,e,r){var o,i,s,a,l=n.isType(t,"object"),u=n.isType(t,"array"),c=[];if(r=r||{obj:[],mapped:[]},l){if(a=r.obj.indexOf(t),l&&-1!==a)return r.mapped[a]||r.obj[a];r.obj.push(t),a=r.obj.length-1}if(l)for(o in t)Object.prototype.hasOwnProperty.call(t,o)&&c.push(o);else if(u)for(s=0;s<t.length;++s)c.push(s);var h=l?{}:[],p=!0;for(s=0;s<c.length;++s)i=t[o=c[s]],h[o]=e(o,i,r),p=p&&h[o]===t[o];return l&&!p&&(r.mapped[a]=h),p?t:h}},108:function(t,e){var r,n,o;!function(){"use strict";n=[],void 0===(o="function"==typeof(r=function(){function t(t){return!isNaN(parseFloat(t))&&isFinite(t)}function e(t){return t.charAt(0).toUpperCase()+t.substring(1)}function r(t){return function(){return this[t]}}var n=["isConstructor","isEval","isNative","isToplevel"],o=["columnNumber","lineNumber"],i=["fileName","functionName","source"],s=["args"],a=["evalOrigin"],l=n.concat(o,i,s,a);function u(t){if(t)for(var r=0;r<l.length;r++)void 0!==t[l[r]]&&this["set"+e(l[r])](t[l[r]])}u.prototype={getArgs:function(){return this.args},setArgs:function(t){if("[object Array]"!==Object.prototype.toString.call(t))throw new TypeError("Args must be an Array");this.args=t},getEvalOrigin:function(){return this.evalOrigin},setEvalOrigin:function(t){if(t instanceof u)this.evalOrigin=t;else{if(!(t instanceof Object))throw new TypeError("Eval Origin must be an Object or StackFrame");this.evalOrigin=new u(t)}},toString:function(){var t=this.getFileName()||"",e=this.getLineNumber()||"",r=this.getColumnNumber()||"",n=this.getFunctionName()||"";return this.getIsEval()?t?"[eval] ("+t+":"+e+":"+r+")":"[eval]:"+e+":"+r:n?n+" ("+t+":"+e+":"+r+")":t+":"+e+":"+r}},u.fromString=function(t){var e=t.indexOf("("),r=t.lastIndexOf(")"),n=t.substring(0,e),o=t.substring(e+1,r).split(","),i=t.substring(r+1);if(0===i.indexOf("@"))var s=/@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(i,""),a=s[1],l=s[2],c=s[3];return new u({functionName:n,args:o||void 0,fileName:a,lineNumber:l||void 0,columnNumber:c||void 0})};for(var c=0;c<n.length;c++)u.prototype["get"+e(n[c])]=r(n[c]),u.prototype["set"+e(n[c])]=function(t){return function(e){this[t]=Boolean(e)}}(n[c]);for(var h=0;h<o.length;h++)u.prototype["get"+e(o[h])]=r(o[h]),u.prototype["set"+e(o[h])]=function(e){return function(r){if(!t(r))throw new TypeError(e+" must be a Number");this[e]=Number(r)}}(o[h]);for(var p=0;p<i.length;p++)u.prototype["get"+e(i[p])]=r(i[p]),u.prototype["set"+e(i[p])]=function(t){return function(e){this[t]=String(e)}}(i[p]);return u})?r.apply(e,n):r)||(t.exports=o)}()},136:function(t,e,r){var n=r(263),o=new RegExp("^(([a-zA-Z0-9-_$ ]*): *)?(Uncaught )?([a-zA-Z0-9-_$ ]*): ");function i(){return null}function s(t){var e={};return e._stackFrame=t,e.url=t.fileName,e.line=t.lineNumber,e.func=t.functionName,e.column=t.columnNumber,e.args=t.args,e.context=null,e}function a(t,e){return{stack:function(){var r=[];e=e||0;try{r=n.parse(t)}catch(t){r=[]}for(var o=[],i=e;i<r.length;i++)o.push(new s(r[i]));return o}(),message:t.message,name:l(t),rawStack:t.stack,rawException:t}}function l(t){var e=t.name&&t.name.length&&t.name,r=t.constructor.name&&t.constructor.name.length&&t.constructor.name;return e&&r?"Error"===e?r:e:e||r}t.exports={guessFunctionName:function(){return"?"},guessErrorClass:function(t){if(!t||!t.match)return["Unknown error. There was no error message to display.",""];var e=t.match(o),r="(unknown)";return e&&(r=e[e.length-1],t=(t=t.replace((e[e.length-2]||"")+r+":","")).replace(/(^[\s]+|[\s]+$)/g,"")),[r,t]},gatherContext:i,parse:function(t,e){var r=t;if(r.nested||r.cause){for(var n=[];r;)n.push(new a(r,e)),r=r.nested||r.cause,e=0;return n[0].traceChain=n,n[0]}return new a(r,e)},Stack:a,Frame:s}},144:function(t,e,r){r(738);var n=r(629),o=r(585);t.exports={error:function(){var t=Array.prototype.slice.call(arguments,0);t.unshift("Rollbar:"),n.ieVersion()<=8?console.error(o.formatArgsAsString(t)):console.error.apply(console,t)},info:function(){var t=Array.prototype.slice.call(arguments,0);t.unshift("Rollbar:"),n.ieVersion()<=8?console.info(o.formatArgsAsString(t)):console.info.apply(console,t)},log:function(){var t=Array.prototype.slice.call(arguments,0);t.unshift("Rollbar:"),n.ieVersion()<=8?console.log(o.formatArgsAsString(t)):console.log.apply(console,t)}}},262:function(t){t.exports={captureUncaughtExceptions:function(t,e,r){if(t){var n;if("function"==typeof e._rollbarOldOnError)n=e._rollbarOldOnError;else if(t.onerror){for(n=t.onerror;n._rollbarOldOnError;)n=n._rollbarOldOnError;e._rollbarOldOnError=n}e.handleAnonymousErrors();var o=function(){var r=Array.prototype.slice.call(arguments,0);!function(t,e,r,n){t._rollbarWrappedError&&(n[4]||(n[4]=t._rollbarWrappedError),n[5]||(n[5]=t._rollbarWrappedError._rollbarContext),t._rollbarWrappedError=null);var o=e.handleUncaughtException.apply(e,n);r&&r.apply(t,n);"anonymous"===o&&(e.anonymousErrorsPending+=1)}(t,e,n,r)};r&&(o._rollbarOldOnError=n),t.onerror=o}},captureUnhandledRejections:function(t,e,r){if(t){"function"==typeof t._rollbarURH&&t._rollbarURH.belongsToShim&&t.removeEventListener("unhandledrejection",t._rollbarURH);var n=function(t){var r,n,o;try{r=t.reason}catch(t){r=void 0}try{n=t.promise}catch(t){n="[unhandledrejection] error getting `promise` from event"}try{o=t.detail,!r&&o&&(r=o.reason,n=o.promise)}catch(t){}r||(r="[unhandledrejection] error getting `reason` from event"),e&&e.handleUnhandledRejection&&e.handleUnhandledRejection(r,n)};n.belongsToShim=r,t._rollbarURH=n,t.addEventListener("unhandledrejection",n)}}}},263:function(t,e,r){var n,o,i;!function(){"use strict";o=[r(108)],void 0===(i="function"==typeof(n=function(t){var e=/(^|@)\S+:\d+/,r=/^\s*at .*(\S+:\d+|\(native\))/m,n=/^(eval@)?(\[native code])?$/;return{parse:function(t){if(void 0!==t.stacktrace||void 0!==t["opera#sourceloc"])return this.parseOpera(t);if(t.stack&&t.stack.match(r))return this.parseV8OrIE(t);if(t.stack)return this.parseFFOrSafari(t);throw new Error("Cannot parse given Error object")},extractLocation:function(t){if(-1===t.indexOf(":"))return[t];var e=/(.+?)(?::(\d+))?(?::(\d+))?$/.exec(t.replace(/[()]/g,""));return[e[1],e[2]||void 0,e[3]||void 0]},parseV8OrIE:function(e){return e.stack.split("\n").filter((function(t){return!!t.match(r)}),this).map((function(e){e.indexOf("(eval ")>-1&&(e=e.replace(/eval code/g,"eval").replace(/(\(eval at [^()]*)|(\),.*$)/g,""));var r=e.replace(/^\s+/,"").replace(/\(eval code/g,"("),n=r.match(/ (\((.+):(\d+):(\d+)\)$)/),o=(r=n?r.replace(n[0],""):r).split(/\s+/).slice(1),i=this.extractLocation(n?n[1]:o.pop()),s=o.join(" ")||void 0,a=["eval","<anonymous>"].indexOf(i[0])>-1?void 0:i[0];return new t({functionName:s,fileName:a,lineNumber:i[1],columnNumber:i[2],source:e})}),this)},parseFFOrSafari:function(e){return e.stack.split("\n").filter((function(t){return!t.match(n)}),this).map((function(e){if(e.indexOf(" > eval")>-1&&(e=e.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g,":$1")),-1===e.indexOf("@")&&-1===e.indexOf(":"))return new t({functionName:e});var r=/((.*".+"[^@]*)?[^@]*)(?:@)/,n=e.match(r),o=n&&n[1]?n[1]:void 0,i=this.extractLocation(e.replace(r,""));return new t({functionName:o,fileName:i[0],lineNumber:i[1],columnNumber:i[2],source:e})}),this)},parseOpera:function(t){return!t.stacktrace||t.message.indexOf("\n")>-1&&t.message.split("\n").length>t.stacktrace.split("\n").length?this.parseOpera9(t):t.stack?this.parseOpera11(t):this.parseOpera10(t)},parseOpera9:function(e){for(var r=/Line (\d+).*script (?:in )?(\S+)/i,n=e.message.split("\n"),o=[],i=2,s=n.length;i<s;i+=2){var a=r.exec(n[i]);a&&o.push(new t({fileName:a[2],lineNumber:a[1],source:n[i]}))}return o},parseOpera10:function(e){for(var r=/Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i,n=e.stacktrace.split("\n"),o=[],i=0,s=n.length;i<s;i+=2){var a=r.exec(n[i]);a&&o.push(new t({functionName:a[3]||void 0,fileName:a[2],lineNumber:a[1],source:n[i]}))}return o},parseOpera11:function(r){return r.stack.split("\n").filter((function(t){return!!t.match(e)&&!t.match(/^Error created at/)}),this).map((function(e){var r,n=e.split("@"),o=this.extractLocation(n.pop()),i=n.shift()||"",s=i.replace(/<anonymous function(: (\w+))?>/,"$2").replace(/\([^)]*\)/g,"")||void 0;i.match(/\(([^)]*)\)/)&&(r=i.replace(/^[^(]+\(([^)]*)\)$/,"$1"));var a=void 0===r||"[arguments not available]"===r?void 0:r.split(",");return new t({functionName:s,args:a,fileName:o[0],lineNumber:o[1],columnNumber:o[2],source:e})}),this)}}})?n.apply(e,o):n)||(t.exports=i)}()},269:function(t,e,r){"use strict";function n(t){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n(t)}function o(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,i(n.key),n)}}function i(t){var e=function(t,e){if("object"!=n(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var o=r.call(t,e||"default");if("object"!=n(o))return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==n(e)?e:e+""}r.r(e),r.d(e,{default:function(){return X}});var s=function(){function t(e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this._currentContext=e?new Map(e):new Map}return e=t,(r=[{key:"getValue",value:function(t){return this._currentContext.get(t)}},{key:"setValue",value:function(e,r){var n=new t(this._currentContext);return n._currentContext.set(e,r),n}},{key:"deleteValue",value:function(e){var r=new t(self._currentContext);return r._currentContext.delete(e),r}}])&&o(e.prototype,r),n&&o(e,n),Object.defineProperty(e,"prototype",{writable:!1}),e;var e,r,n}(),a=new s;function l(t){return l="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},l(t)}function u(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,c(n.key),n)}}function c(t){var e=function(t,e){if("object"!=l(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=l(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==l(e)?e:e+""}var h=function(){return t=function t(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.currentContext=a},e=[{key:"active",value:function(){return this.currentContext}},{key:"enterContext",value:function(t){var e=this.currentContext;return this.currentContext=t||a,e}},{key:"exitContext",value:function(t){return this.currentContext=t,this.currentContext}},{key:"with",value:function(t,e,r){var n=this.enterContext(t);try{for(var o=arguments.length,i=new Array(o>3?o-3:0),s=3;s<o;s++)i[s-3]=arguments[s];return e.call.apply(e,[r].concat(i))}finally{this.exitContext(n)}}}],e&&u(t.prototype,e),r&&u(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}();var p=r(767);function f(t){return f="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},f(t)}function d(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,m(n.key),n)}}function m(t){var e=function(t,e){if("object"!=f(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=f(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==f(e)?e:e+""}var y="RollbarSession",g=function(){return t=function t(e,r){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.options=r,this.tracing=e,this.window=e.window,this.session=null},(e=[{key:"init",value:function(){return this.session?this:this.getSession()||this.createSession()}},{key:"getSession",value:function(){try{var t=this.window.sessionStorage.getItem(y);if(!t)return null;this.session=JSON.parse(t)}catch(t){return null}return this}},{key:"createSession",value:function(){return this.session={id:p.A.gen(),createdAt:Date.now()},this.setSession(this.session)}},{key:"setSession",value:function(t){var e=JSON.stringify(t);try{this.window.sessionStorage.setItem(y,e)}catch(t){return null}return this}}])&&d(t.prototype,e),r&&d(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}(),v=r(1);function b(t){return b="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},b(t)}function w(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var r=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=r){var n,o,i,s,a=[],l=!0,u=!1;try{if(i=(r=r.call(t)).next,0===e){if(Object(r)!==r)return;l=!1}else for(;!(l=(n=i.call(r)).done)&&(a.push(n.value),a.length!==e);l=!0);}catch(t){u=!0,o=t}finally{try{if(!l&&null!=r.return&&(s=r.return(),Object(s)!==s))return}finally{if(u)throw o}}return a}}(t,e)||x(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function S(t){return function(t){if(Array.isArray(t))return k(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||x(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function x(t,e){if(t){if("string"==typeof t)return k(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?k(t,e):void 0}}function k(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=Array(e);r<e;r++)n[r]=t[r];return n}function C(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,I(n.key),n)}}function I(t){var e=function(t,e){if("object"!=b(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=b(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==b(e)?e:e+""}var O=function(){return t=function t(){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t)},e=[{key:"export",value:function(t,e){console.log(t),E.push.apply(E,S(t))}},{key:"toPayload",value:function(){var t=this,e=E.slice();if(E.length=0,!e||!e.length)return{resourceSpans:[]};var r,n=e[0]&&e[0].resource||{},o=new Map,i=function(t,e){var r="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=x(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return{s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,s=!0,a=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return s=t.done,t},e:function(t){a=!0,i=t},f:function(){try{s||null==r.return||r.return()}finally{if(a)throw i}}}}(e);try{for(i.s();!(r=i.n()).done;){var s=r.value,a=s.instrumentationScope?"".concat(s.instrumentationScope.name,":").concat(s.instrumentationScope.version):"default:1.0.0";o.has(a)||o.set(a,{scope:s.instrumentationScope||{name:"default",version:"1.0.0",attributes:[]},spans:[]}),o.get(a).spans.push(this._transformSpan(s))}}catch(t){i.e(t)}finally{i.f()}return{resourceSpans:[{resource:this._transformResource(n),scopeSpans:Array.from(o.values()).map((function(e){return{scope:t._transformInstrumentationScope(e.scope),spans:e.spans}}))}]}}},{key:"_transformSpan",value:function(t){var e,r=this,n=function(t){return Object.entries(t||{}).map((function(t){var e=w(t,2),n=e[0],o=e[1];return{key:n,value:r._transformAnyValue(o)}}))};return{traceId:t.spanContext.traceId,spanId:t.spanContext.spanId,parentSpanId:t.parentSpanId||"",name:t.name,kind:t.kind||1,startTimeUnixNano:v.A.toNanos(t.startTime),endTimeUnixNano:v.A.toNanos(t.endTime),attributes:n(t.attributes),events:(e=t.events,(e||[]).map((function(t){return{timeUnixNano:v.A.toNanos(t.time),name:t.name,attributes:n(t.attributes)}})))}}},{key:"_transformResource",value:function(t){var e=this,r=t.attributes||{};return{attributes:Object.entries(r).map((function(t){var r=w(t,2),n=r[0],o=r[1];return{key:n,value:e._transformAnyValue(o)}}))}}},{key:"_transformInstrumentationScope",value:function(t){var e=this;return{name:t.name||"",version:t.version||"",attributes:(t.attributes||[]).map((function(t){return{key:t.key,value:e._transformAnyValue(t.value)}}))}}},{key:"_transformAnyValue",value:function(t){var e=this;if(null==t)return{stringValue:""};var r=b(t);return"string"===r?{stringValue:t}:"number"===r?Number.isInteger(t)?{intValue:t.toString()}:{doubleValue:t}:"boolean"===r?{boolValue:t}:Array.isArray(t)?{arrayValue:{values:t.map((function(t){return e._transformAnyValue(t)}))}}:"object"===r?{kvlistValue:{values:Object.entries(t).map((function(t){var r=w(t,2),n=r[0],o=r[1];return{key:n,value:e._transformAnyValue(o)}}))}}:{stringValue:String(t)}}}],e&&C(t.prototype,e),r&&C(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}(),E=[];function R(t){return R="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},R(t)}function A(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,M(n.key),n)}}function M(t){var e=function(t,e){if("object"!=R(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=R(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==R(e)?e:e+""}var _=function(){return t=function t(e){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.exporter=e,this.pendingSpans=new Map},(e=[{key:"onStart",value:function(t,e){this.pendingSpans.set(t.span.spanContext.spanId,t)}},{key:"onEnd",value:function(t){this.exporter.export([t.export()]),this.pendingSpans.delete(t.span.spanContext.spanId)}}])&&A(t.prototype,e),r&&A(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}();function T(t){return T="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},T(t)}function L(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var r=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=r){var n,o,i,s,a=[],l=!0,u=!1;try{if(i=(r=r.call(t)).next,0===e){if(Object(r)!==r)return;l=!1}else for(;!(l=(n=i.call(r)).done)&&(a.push(n.value),a.length!==e);l=!0);}catch(t){u=!0,o=t}finally{try{if(!l&&null!=r.return&&(s=r.return(),Object(s)!==s))return}finally{if(u)throw o}}return a}}(t,e)||function(t,e){if(t){if("string"==typeof t)return N(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?N(t,e):void 0}}(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function N(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=Array(e);r<e;r++)n[r]=t[r];return n}function P(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,j(n.key),n)}}function j(t){var e=function(t,e){if("object"!=T(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=T(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==T(e)?e:e+""}var D=function(){return t=function t(e){return function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.initReadableSpan(e),this.spanProcessor=e.spanProcessor,this.spanProcessor.onStart(this,e.context),e.attributes&&this.setAttributes(e.attributes),this},e=[{key:"initReadableSpan",value:function(t){this.span={name:t.name,kind:t.kind,spanContext:t.spanContext,parentSpanId:t.parentSpanId,startTime:t.startTime||v.A.now(),endTime:[0,0],status:{code:0,message:""},attributes:{"session.id":t.session.id},links:[],events:[],duration:0,ended:!1,resource:t.resource,instrumentationScope:t.scope,droppedAttributesCount:0,droppedEventsCount:0,droppedLinksCount:0}}},{key:"spanContext",value:function(){return this.span.spanContext}},{key:"spanId",get:function(){return this.span.spanContext.spanId}},{key:"traceId",get:function(){return this.span.spanContext.traceId}},{key:"setAttribute",value:function(t,e){return null==e||this.ended||0===t.length||(this.span.attributes[t]=e),this}},{key:"setAttributes",value:function(t){for(var e=0,r=Object.entries(t);e<r.length;e++){var n=L(r[e],2),o=n[0],i=n[1];this.setAttribute(o,i)}return this}},{key:"addEvent",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=arguments.length>2?arguments[2]:void 0;return this.span.ended||this.span.events.push({name:t,attributes:e,time:r||v.A.now(),droppedAttributesCount:0}),this}},{key:"isRecording",value:function(){return!1===this.span.ended}},{key:"end",value:function(t,e){t&&this.setAttributes(t),this.span.endTime=e||v.A.now(),this.span.ended=!0,this.spanProcessor.onEnd(this)}},{key:"export",value:function(){return this.span}}],e&&P(t.prototype,e),r&&P(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}();function F(t){return F="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},F(t)}function U(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,B(n.key),n)}}function B(t){var e=function(t,e){if("object"!=F(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=F(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==F(e)?e:e+""}var W=function(){return t=function t(e,r){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.spanProcessor=r,this.tracing=e},e=[{key:"startSpan",value:function(t){var e,r,n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.tracing.contextManager.active(),o=this.tracing.getSpan(n),i=null==o?void 0:o.spanContext(),s=p.A.gen(8),a=null;i?(e=i.traceId,a=i.traceState,r=i.spanId):e=p.A.gen(16);var l={traceId:e,spanId:s,traceFlags:0,traceState:a};return new D({resource:this.tracing.resource,scope:this.tracing.scope,session:this.tracing.session.session,context:n,spanContext:l,name:t,kind:0,parentSpanId:r,spanProcessor:this.spanProcessor})}}],e&&U(t.prototype,e),r&&U(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}();function z(t){return z="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},z(t)}function G(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function V(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?G(Object(r),!0).forEach((function(e){H(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):G(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function H(t,e,r){return(e=q(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function J(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,q(n.key),n)}}function q(t){var e=function(t,e){if("object"!=z(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=z(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==z(e)?e:e+""}var Z,Y=(Z="Rollbar Context Key SPAN",Symbol.for(Z)),X=function(){return t=function t(e,r){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.options=r,this.window=e,this.session=new g(this,r),this.createTracer()},e=[{key:"initSession",value:function(){this.session&&this.session.init()}},{key:"sessionId",get:function(){return this.session?this.session.session.id:null}},{key:"resource",get:function(){var t,e;return{attributes:V(V({},this.options.resource||{}),{},{"rollbar.environment":null!==(t=null===(e=this.options.payload)||void 0===e?void 0:e.environment)&&void 0!==t?t:this.options.environment})}}},{key:"scope",get:function(){return{name:"rollbar-browser-js",version:this.options.version}}},{key:"idGen",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:16;return p.A.gen(t)}},{key:"createTracer",value:function(){this.contextManager=new h,this.exporter=new O,this.spanProcessor=new _(this.exporter),this.tracer=new W(this,this.spanProcessor)}},{key:"getTracer",value:function(){return this.tracer}},{key:"getSpan",value:function(){return(arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.contextManager.active()).getValue(Y)}},{key:"setSpan",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.contextManager.active(),e=arguments.length>1?arguments[1]:void 0;return t.setValue(Y,e)}},{key:"startSpan",value:function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:this.contextManager.active();return this.tracer.startSpan(t,e,r)}},{key:"with",value:function(t,e,r){for(var n,o=arguments.length,i=new Array(o>3?o-3:0),s=3;s<o;s++)i[s-3]=arguments[s];return(n=this.contextManager).with.apply(n,[t,e,r].concat(i))}},{key:"withSpan",value:function(t,e,r,n){var o=this.startSpan(t,e);return this.with(this.setSpan(this.contextManager.active(),o),r,n,o)}}],e&&J(t.prototype,e),r&&J(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}()},287:function(t,e,r){"use strict";r.d(e,{A:function(){return w}});var n=r(767),o=r(144),i=r.n(o);function s(t){return s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},s(t)}function a(){a=function(){return e};var t,e={},r=Object.prototype,n=r.hasOwnProperty,o=Object.defineProperty||function(t,e,r){t[e]=r.value},i="function"==typeof Symbol?Symbol:{},l=i.iterator||"@@iterator",u=i.asyncIterator||"@@asyncIterator",c=i.toStringTag||"@@toStringTag";function h(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{h({},"")}catch(t){h=function(t,e,r){return t[e]=r}}function p(t,e,r,n){var i=e&&e.prototype instanceof b?e:b,s=Object.create(i.prototype),a=new T(n||[]);return o(s,"_invoke",{value:R(t,r,a)}),s}function f(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}e.wrap=p;var d="suspendedStart",m="suspendedYield",y="executing",g="completed",v={};function b(){}function w(){}function S(){}var x={};h(x,l,(function(){return this}));var k=Object.getPrototypeOf,C=k&&k(k(L([])));C&&C!==r&&n.call(C,l)&&(x=C);var I=S.prototype=b.prototype=Object.create(x);function O(t){["next","throw","return"].forEach((function(e){h(t,e,(function(t){return this._invoke(e,t)}))}))}function E(t,e){function r(o,i,a,l){var u=f(t[o],t,i);if("throw"!==u.type){var c=u.arg,h=c.value;return h&&"object"==s(h)&&n.call(h,"__await")?e.resolve(h.__await).then((function(t){r("next",t,a,l)}),(function(t){r("throw",t,a,l)})):e.resolve(h).then((function(t){c.value=t,a(c)}),(function(t){return r("throw",t,a,l)}))}l(u.arg)}var i;o(this,"_invoke",{value:function(t,n){function o(){return new e((function(e,o){r(t,n,e,o)}))}return i=i?i.then(o,o):o()}})}function R(e,r,n){var o=d;return function(i,s){if(o===y)throw Error("Generator is already running");if(o===g){if("throw"===i)throw s;return{value:t,done:!0}}for(n.method=i,n.arg=s;;){var a=n.delegate;if(a){var l=A(a,n);if(l){if(l===v)continue;return l}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(o===d)throw o=g,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);o=y;var u=f(e,r,n);if("normal"===u.type){if(o=n.done?g:m,u.arg===v)continue;return{value:u.arg,done:n.done}}"throw"===u.type&&(o=g,n.method="throw",n.arg=u.arg)}}}function A(e,r){var n=r.method,o=e.iterator[n];if(o===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,A(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),v;var i=f(o,e.iterator,r.arg);if("throw"===i.type)return r.method="throw",r.arg=i.arg,r.delegate=null,v;var s=i.arg;return s?s.done?(r[e.resultName]=s.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,v):s:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,v)}function M(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function _(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function T(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(M,this),this.reset(!0)}function L(e){if(e||""===e){var r=e[l];if(r)return r.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,i=function r(){for(;++o<e.length;)if(n.call(e,o))return r.value=e[o],r.done=!1,r;return r.value=t,r.done=!0,r};return i.next=i}}throw new TypeError(s(e)+" is not iterable")}return w.prototype=S,o(I,"constructor",{value:S,configurable:!0}),o(S,"constructor",{value:w,configurable:!0}),w.displayName=h(S,c,"GeneratorFunction"),e.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===w||"GeneratorFunction"===(e.displayName||e.name))},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,S):(t.__proto__=S,h(t,c,"GeneratorFunction")),t.prototype=Object.create(I),t},e.awrap=function(t){return{__await:t}},O(E.prototype),h(E.prototype,u,(function(){return this})),e.AsyncIterator=E,e.async=function(t,r,n,o,i){void 0===i&&(i=Promise);var s=new E(p(t,r,n,o),i);return e.isGeneratorFunction(r)?s:s.next().then((function(t){return t.done?t.value:s.next()}))},O(I),h(I,c,"Generator"),h(I,l,(function(){return this})),h(I,"toString",(function(){return"[object Generator]"})),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},e.values=L,T.prototype={constructor:T,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(_),!e)for(var r in this)"t"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function o(n,o){return a.type="throw",a.arg=e,r.next=n,o&&(r.method="next",r.arg=t),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var s=this.tryEntries[i],a=s.completion;if("root"===s.tryLoc)return o("end");if(s.tryLoc<=this.prev){var l=n.call(s,"catchLoc"),u=n.call(s,"finallyLoc");if(l&&u){if(this.prev<s.catchLoc)return o(s.catchLoc,!0);if(this.prev<s.finallyLoc)return o(s.finallyLoc)}else if(l){if(this.prev<s.catchLoc)return o(s.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<s.finallyLoc)return o(s.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var o=this.tryEntries[r];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var s=i?i.completion:{};return s.type=t,s.arg=e,i?(this.method="next",this.next=i.finallyLoc,v):this.complete(s)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),v},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),_(r),v}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var o=n.arg;_(r)}return o}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:L(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),v}},e}function l(t,e,r,n,o,i,s){try{var a=t[i](s),l=a.value}catch(t){return void r(t)}a.done?e(l):Promise.resolve(l).then(n,o)}function u(t){return function(){var e=this,r=arguments;return new Promise((function(n,o){var i=t.apply(e,r);function s(t){l(i,n,o,s,a,"next",t)}function a(t){l(i,n,o,s,a,"throw",t)}s(void 0)}))}}function c(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,h(n.key),n)}}function h(t){var e=function(t,e){if("object"!=s(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=s(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==s(e)?e:e+""}function p(t,e,r){(function(t,e){if(e.has(t))throw new TypeError("Cannot initialize the same private elements twice on an object")})(t,e),e.set(t,r)}function f(t,e){return t.get(m(t,e))}function d(t,e,r){return t.set(m(t,e),r),r}function m(t,e,r){if("function"==typeof t?t===e:t.has(e))return arguments.length<3?e:r;throw new TypeError("Private element is not present on this object")}var y=new WeakMap,g=new WeakMap,v=new WeakMap,b=new WeakMap,w=function(){return t=function t(e){var r=e.recorder,n=e.api,o=e.tracing;if(function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),p(this,y,void 0),p(this,g,void 0),p(this,v,void 0),p(this,b,void 0),!r)throw new TypeError("Expected 'recorder' to be provided");if(!n)throw new TypeError("Expected 'api' to be provided");if(!o)throw new TypeError("Expected 'tracing' to be provided");d(y,this,new Map),d(g,this,r),d(v,this,n),d(b,this,o)},e=[{key:"_processReplay",value:(s=u(a().mark((function t(e,r){var n;return a().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:try{n=f(g,this).dump(f(b,this),e,r),f(y,this).set(e,n)}catch(t){i().error("Error transforming spans:",t),f(y,this).set(e,null)}return t.abrupt("return",e);case 2:case"end":return t.stop()}}),t,this)}))),function(t,e){return s.apply(this,arguments)})},{key:"add",value:function(t,e){return t=t||n.A.gen(8),this._processReplay(t,e).catch((function(t){i().error("Failed to process replay:",t)})),t}},{key:"send",value:(o=u(a().mark((function t(e){var r;return a().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(e){t.next=3;break}return i().error("ReplayMap.send: No replayId provided"),t.abrupt("return",!1);case 3:if(f(y,this).has(e)){t.next=6;break}return i().error("ReplayMap.send: No replay found for replayId: ".concat(e)),t.abrupt("return",!1);case 6:if(r=f(y,this).get(e),f(y,this).delete(e),!(!r||Array.isArray(r)&&0===r.length||r.resourceSpans&&0===r.resourceSpans.length)){t.next=12;break}return i().error("ReplayMap.send: No payload found for replayId: ".concat(e)),t.abrupt("return",!1);case 12:return t.prev=12,t.next=15,f(v,this).postSpans(r);case 15:return t.abrupt("return",!0);case 18:return t.prev=18,t.t0=t.catch(12),i().error("Error sending replay:",t.t0),t.abrupt("return",!1);case 22:case"end":return t.stop()}}),t,this,[[12,18]])}))),function(t){return o.apply(this,arguments)})},{key:"discard",value:function(t){return t?f(y,this).has(t)?(f(y,this).delete(t),!0):(i().error("ReplayMap.discard: No replay found for replayId: ".concat(t)),!1):(i().error("ReplayMap.discard: No replayId provided"),!1)}},{key:"getSpans",value:function(t){var e;return null!==(e=f(y,this).get(t))&&void 0!==e?e:null}},{key:"setSpans",value:function(t,e){f(y,this).set(t,e)}},{key:"size",get:function(){return f(y,this).size}},{key:"clear",value:function(){f(y,this).clear()}}],e&&c(t.prototype,e),r&&c(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r,o,s}()},299:function(t){t.exports={version:"3.0.0-alpha.1",endpoint:"api.rollbar.com/api/1/item/",logLevel:"debug",reportLevel:"debug",uncaughtErrorLevel:"error",maxItems:0,itemsPerMin:60}},379:function(t,e,r){var n=r(585);function o(t,e,r){if(!t)return!r;var o,i,s=t.frames;if(!s||0===s.length)return!r;for(var a=e.length,l=s.length,u=0;u<l;u++){if(o=s[u].filename,!n.isType(o,"string"))return!r;for(var c=0;c<a;c++)if(i=e[c],new RegExp(i).test(o))return!0}return!1}function i(t,e,r,i){var s,a,l=!1;"blocklist"===r&&(l=!0);try{if(s=l?e.hostBlockList:e.hostSafeList,a=n.get(t,"body.trace_chain")||[n.get(t,"body.trace")],!s||0===s.length)return!l;if(0===a.length||!a[0])return!l;for(var u=a.length,c=0;c<u;c++)if(o(a[c],s,l))return!0}catch(t){l?e.hostBlockList=null:e.hostSafeList=null;var h=l?"hostBlockList":"hostSafeList";return i.error("Error while reading your configuration's "+h+" option. Removing custom "+h+".",t),!l}return!1}t.exports={checkLevel:function(t,e){var r=t.level,o=n.LEVELS[r]||0,i=e.reportLevel;return!(o<(n.LEVELS[i]||0))},userCheckIgnore:function(t){return function(e,r){var o=!!e._isUncaught;delete e._isUncaught;var i=e._originalArgs;delete e._originalArgs;try{n.isFunction(r.onSendCallback)&&r.onSendCallback(o,i,e)}catch(e){r.onSendCallback=null,t.error("Error while calling onSendCallback, removing",e)}try{if(n.isFunction(r.checkIgnore)&&r.checkIgnore(o,i,e))return!1}catch(e){r.checkIgnore=null,t.error("Error while calling custom checkIgnore(), removing",e)}return!0}},urlIsNotBlockListed:function(t){return function(e,r){return!i(e,r,"blocklist",t)}},urlIsSafeListed:function(t){return function(e,r){return i(e,r,"safelist",t)}},messageIsIgnored:function(t){return function(e,r){var o,i,s,a,l,u;try{if(!(s=r.ignoredMessages)||0===s.length)return!0;if(u=function(t){var e=t.body,r=[];if(e.trace_chain)for(var o=e.trace_chain,i=0;i<o.length;i++){var s=o[i];r.push(n.get(s,"exception.message"))}e.trace&&r.push(n.get(e,"trace.exception.message"));e.message&&r.push(n.get(e,"message.body"));return r}(e),0===u.length)return!0;for(a=s.length,o=0;o<a;o++)for(l=new RegExp(s[o],"gi"),i=0;i<u.length;i++)if(l.test(u[i]))return!1}catch(e){r.ignoredMessages=null,t.error("Error while reading your configuration's ignoredMessages option. Removing custom ignoredMessages.")}return!0}}}},392:function(t){function e(t){return(t.getAttribute("type")||"").toLowerCase()}function r(t){if(!t||!t.tagName)return"";var e=[t.tagName];t.id&&e.push("#"+t.id),t.classes&&e.push("."+t.classes.join("."));for(var r=0;r<t.attributes.length;r++)e.push("["+t.attributes[r].key+'="'+t.attributes[r].value+'"]');return e.join("")}function n(t){if(!t||!t.tagName)return null;var e,r,n,o,i={};i.tagName=t.tagName.toLowerCase(),t.id&&(i.id=t.id),(e=t.className)&&"string"==typeof e&&(i.classes=e.split(/\s+/));var s=["type","name","title","alt"];for(i.attributes=[],o=0;o<s.length;o++)r=s[o],(n=t.getAttribute(r))&&i.attributes.push({key:r,value:n});return i}t.exports={describeElement:n,descriptionToString:r,elementArrayToString:function(t){for(var e,n,o=[],i=0,s=t.length-1;s>=0;s--){if(e=r(t[s]),n=i+3*o.length+e.length,s<t.length-1&&n>=83){o.unshift("...");break}o.unshift(e),i+=e.length}return o.join(" > ")},treeToArray:function(t){for(var e,r=[],o=0;t&&o<5&&"html"!==(e=n(t)).tagName;o++)r.unshift(e),t=t.parentNode;return r},getElementFromEvent:function(t,e){return t.target?t.target:e&&e.elementFromPoint?e.elementFromPoint(t.clientX,t.clientY):void 0},isDescribedElement:function(t,r,n){if(t.tagName.toLowerCase()!==r.toLowerCase())return!1;if(!n)return!0;t=e(t);for(var o=0;o<n.length;o++)if(n[o]===t)return!0;return!1},getElementType:e}},398:function(t){t.exports=function(t,e,r,n,o){var i=t[e];t[e]=r(i),n&&n[o].push([t,e,i])}},402:function(t,e,r){var n=r(583),o=r(618),i=r(705),s=r(657),a=r(706),l=r(922),u=r(622),c=r(269),h=r(918);n.setComponents({telemeter:o,instrumenter:i,polyfillJSON:s,wrapGlobals:a,scrub:l,truncation:u,tracing:c.default,recorder:h.default}),t.exports=n},428:function(t,e,r){var n=r(402),o="undefined"!=typeof window&&window._rollbarConfig,i=o&&o.globalAlias||"Rollbar",s="undefined"!=typeof window&&window[i]&&"function"==typeof window[i].shimId&&void 0!==window[i].shimId();if("undefined"==typeof window||window._rollbarStartTime||(window._rollbarStartTime=(new Date).getTime()),!s&&o){var a=new n(o);window[i]=a}else"undefined"!=typeof window?(window.rollbar=n,window._rollbarDidLoad=!0):"undefined"!=typeof self&&(self.rollbar=n,self._rollbarDidLoad=!0);t.exports=n},436:function(t,e){"use strict";e.A={enabled:!1,endpoint:"api.rollbar.com/api/1/session/"}},472:function(t,e,r){var n=r(144),o=r(585);t.exports=function(t,e,r,i,s,a){var l,u;o.isFiniteNumber(a)&&(l=new AbortController,u=setTimeout((function(){l.abort()}),a)),fetch(e,{method:r,headers:{"Content-Type":"application/json","X-Rollbar-Access-Token":t,signal:l&&l.signal},body:i}).then((function(t){u&&clearTimeout(u);var e=t.headers,r={"Rollbar-Replay-Enabled":e.get("Rollbar-Replay-Enabled"),"Rollbar-Replay-RateLimit-Remaining":e.get("Rollbar-Replay-RateLimit-Remaining"),"Rollbar-Replay-RateLimit-Reset":e.get("Rollbar-Replay-RateLimit-Reset")},n=t.json();s(null,n,r)})).catch((function(t){n.error(t.message),s(t)}))}},485:function(t,e,r){var n=r(585),o=r(136),i=r(144);function s(t,e,r){var o=t.message,i=t.custom;o||(o="Item sent with null or missing arguments.");var s={body:o};i&&(s.extra=n.merge(i)),n.set(t,"data.body",{message:s}),r(null,t)}function a(t){var e=t.stackInfo.stack;return e&&0===e.length&&t._unhandledStackInfo&&t._unhandledStackInfo.stack&&(e=t._unhandledStackInfo.stack),e}function l(t,e,r){var i=t&&t.data.description,s=t&&t.custom,l=a(t),c=o.guessErrorClass(e.message),h={exception:{class:u(e,c[0],r),message:c[1]}};if(i&&(h.exception.description=i),l){var p,f,d,m,y,g,v,b;for(0===l.length&&(h.exception.stack=e.rawStack,h.exception.raw=String(e.rawException)),h.frames=[],v=0;v<l.length;++v)f={filename:(p=l[v]).url?n.sanitizeUrl(p.url):"(unknown)",lineno:p.line||null,method:p.func&&"?"!==p.func?p.func:"[anonymous]",colno:p.column},r.sendFrameUrl&&(f.url=p.url),f.method&&f.method.endsWith&&f.method.endsWith("_rollbar_wrapped")||(d=m=y=null,(g=p.context?p.context.length:0)&&(b=Math.floor(g/2),m=p.context.slice(0,b),d=p.context[b],y=p.context.slice(b)),d&&(f.code=d),(m||y)&&(f.context={},m&&m.length&&(f.context.pre=m),y&&y.length&&(f.context.post=y)),p.args&&(f.args=p.args),h.frames.push(f));h.frames.reverse(),s&&(h.extra=n.merge(s))}return h}function u(t,e,r){return t.name?t.name:r.guessErrorClass?e:"(unknown)"}t.exports={handleDomException:function(t,e,r){if(t.err&&"DOMException"===o.Stack(t.err).name){var n=new Error;n.name=t.err.name,n.message=t.err.message,n.stack=t.err.stack,n.nested=t.err,t.err=n}r(null,t)},handleItemWithError:function(t,e,r){if(t.data=t.data||{},t.err)try{t.stackInfo=t.err._savedStackTrace||o.parse(t.err,t.skipFrames),e.addErrorContext&&function(t){var e=[],r=t.err;e.push(r);for(;r.nested||r.cause;)r=r.nested||r.cause,e.push(r);n.addErrorContext(t,e)}(t)}catch(e){i.error("Error while parsing the error object.",e);try{t.message=t.err.message||t.err.description||t.message||String(t.err)}catch(e){t.message=String(t.err)||String(e)}delete t.err}r(null,t)},ensureItemHasSomethingToSay:function(t,e,r){t.message||t.stackInfo||t.custom||r(new Error("No message, stack info, or custom data"),null),r(null,t)},addBaseInfo:function(t,e,r){var o=e.payload&&e.payload.environment||e.environment;t.data=n.merge(t.data,{environment:o,level:t.level,endpoint:e.endpoint,platform:"browser",framework:"browser-js",language:"javascript",server:{},uuid:t.uuid,notifier:{name:"rollbar-browser-js",version:e.version},custom:t.custom}),r(null,t)},addRequestInfo:function(t){return function(e,r,o){var i={};t&&t.location&&(i.url=t.location.href,i.query_string=t.location.search);var s="$remote_ip";r.captureIp?!0!==r.captureIp&&(s+="_anonymize"):s=null,s&&(i.user_ip=s),Object.keys(i).length>0&&n.set(e,"data.request",i),o(null,e)}},addClientInfo:function(t){return function(e,r,o){if(!t)return o(null,e);var i=t.navigator||{},s=t.screen||{};n.set(e,"data.client",{runtime_ms:e.timestamp-t._rollbarStartTime,timestamp:Math.round(e.timestamp/1e3),javascript:{browser:i.userAgent,language:i.language,cookie_enabled:i.cookieEnabled,screen:{width:s.width,height:s.height}}}),o(null,e)}},addPluginInfo:function(t){return function(e,r,o){if(!t||!t.navigator)return o(null,e);for(var i,s=[],a=t.navigator.plugins||[],l=0,u=a.length;l<u;++l)i=a[l],s.push({name:i.name,description:i.description});n.set(e,"data.client.javascript.plugins",s),o(null,e)}},addBody:function(t,e,r){t.stackInfo?t.stackInfo.traceChain?function(t,e,r){for(var o=t.stackInfo.traceChain,i=[],s=o.length,a=0;a<s;a++){var u=l(t,o[a],e);i.push(u)}n.set(t,"data.body",{trace_chain:i}),r(null,t)}(t,e,r):function(t,e,r){var i=a(t);if(i){var c=l(t,t.stackInfo,e);n.set(t,"data.body",{trace:c}),r(null,t)}else{var h=t.stackInfo,p=o.guessErrorClass(h.message),f=u(h,p[0],e),d=p[1];t.message=f+": "+d,s(t,e,r)}}(t,e,r):s(t,e,r)},addScrubber:function(t){return function(e,r,n){if(t){var o=r.scrubFields||[],i=r.scrubPaths||[];e.data=t(e.data,o,i)}n(null,e)}}}},511:function(t,e,r){var n=r(585);function o(t){this.startTime=n.now(),this.counter=0,this.perMinCounter=0,this.platform=null,this.platformOptions={},this.configureGlobal(t)}function i(t,e,r){return!t.ignoreRateLimit&&e>=1&&r>e}function s(t,e,r,n,o,i,s){var a=null;return r&&(r=new Error(r)),r||n||(a=function(t,e,r,n,o){var i,s=e.environment||e.payload&&e.payload.environment;i=o?"item per minute limit reached, ignoring errors until timeout":"maxItems has been hit, ignoring errors until reset.";var a={body:{message:{body:i,extra:{maxItems:r,itemsPerMinute:n}}},language:"javascript",environment:s,notifier:{version:e.notifier&&e.notifier.version||e.version}};"browser"===t?(a.platform="browser",a.framework="browser-js",a.notifier.name="rollbar-browser-js"):"server"===t?(a.framework=e.framework||"node-js",a.notifier.name=e.notifier.name):"react-native"===t&&(a.framework=e.framework||"react-native",a.notifier.name=e.notifier.name);return a}(t,e,o,i,s)),{error:r,shouldSend:n,payload:a}}o.globalSettings={startTime:n.now(),maxItems:void 0,itemsPerMinute:void 0},o.prototype.configureGlobal=function(t){void 0!==t.startTime&&(o.globalSettings.startTime=t.startTime),void 0!==t.maxItems&&(o.globalSettings.maxItems=t.maxItems),void 0!==t.itemsPerMinute&&(o.globalSettings.itemsPerMinute=t.itemsPerMinute)},o.prototype.shouldSend=function(t,e){var r=(e=e||n.now())-this.startTime;(r<0||r>=6e4)&&(this.startTime=e,this.perMinCounter=0);var a=o.globalSettings.maxItems,l=o.globalSettings.itemsPerMinute;if(i(t,a,this.counter))return s(this.platform,this.platformOptions,a+" max items reached",!1);if(i(t,l,this.perMinCounter))return s(this.platform,this.platformOptions,l+" items per minute reached",!1);this.counter++,this.perMinCounter++;var u=!i(t,a,this.counter),c=u;return u=u&&!i(t,l,this.perMinCounter),s(this.platform,this.platformOptions,null,u,a,l,c)},o.prototype.setPlatformOptions=function(t,e){this.platform=t,this.platformOptions=e},t.exports=o},538:function(t){t.exports=function(t){var e,r,n,o,i,s,a,l,u,c,h,p,f,d=/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;function m(t){return t<10?"0"+t:t}function y(){return this.valueOf()}function g(t){return d.lastIndex=0,d.test(t)?'"'+t.replace(d,(function(t){var e=n[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)}))+'"':'"'+t+'"'}function v(t,n){var i,s,a,l,u,c=e,h=n[t];switch(h&&"object"==typeof h&&"function"==typeof h.toJSON&&(h=h.toJSON(t)),"function"==typeof o&&(h=o.call(n,t,h)),typeof h){case"string":return g(h);case"number":return isFinite(h)?String(h):"null";case"boolean":case"null":return String(h);case"object":if(!h)return"null";if(e+=r,u=[],"[object Array]"===Object.prototype.toString.apply(h)){for(l=h.length,i=0;i<l;i+=1)u[i]=v(i,h)||"null";return a=0===u.length?"[]":e?"[\n"+e+u.join(",\n"+e)+"\n"+c+"]":"["+u.join(",")+"]",e=c,a}if(o&&"object"==typeof o)for(l=o.length,i=0;i<l;i+=1)"string"==typeof o[i]&&(a=v(s=o[i],h))&&u.push(g(s)+(e?": ":":")+a);else for(s in h)Object.prototype.hasOwnProperty.call(h,s)&&(a=v(s,h))&&u.push(g(s)+(e?": ":":")+a);return a=0===u.length?"{}":e?"{\n"+e+u.join(",\n"+e)+"\n"+c+"}":"{"+u.join(",")+"}",e=c,a}}"function"!=typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+m(this.getUTCMonth()+1)+"-"+m(this.getUTCDate())+"T"+m(this.getUTCHours())+":"+m(this.getUTCMinutes())+":"+m(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=y,Number.prototype.toJSON=y,String.prototype.toJSON=y),"function"!=typeof t.stringify&&(n={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},t.stringify=function(t,n,i){var s;if(e="",r="","number"==typeof i)for(s=0;s<i;s+=1)r+=" ";else"string"==typeof i&&(r=i);if(o=n,n&&"function"!=typeof n&&("object"!=typeof n||"number"!=typeof n.length))throw new Error("JSON.stringify");return v("",{"":t})}),"function"!=typeof t.parse&&(t.parse=(c={"\\":"\\",'"':'"',"/":"/",t:"\t",n:"\n",r:"\r",f:"\f",b:"\b"},h={go:function(){i="ok"},firstokey:function(){l=u,i="colon"},okey:function(){l=u,i="colon"},ovalue:function(){i="ocomma"},firstavalue:function(){i="acomma"},avalue:function(){i="acomma"}},p={go:function(){i="ok"},ovalue:function(){i="ocomma"},firstavalue:function(){i="acomma"},avalue:function(){i="acomma"}},f={"{":{go:function(){s.push({state:"ok"}),a={},i="firstokey"},ovalue:function(){s.push({container:a,state:"ocomma",key:l}),a={},i="firstokey"},firstavalue:function(){s.push({container:a,state:"acomma"}),a={},i="firstokey"},avalue:function(){s.push({container:a,state:"acomma"}),a={},i="firstokey"}},"}":{firstokey:function(){var t=s.pop();u=a,a=t.container,l=t.key,i=t.state},ocomma:function(){var t=s.pop();a[l]=u,u=a,a=t.container,l=t.key,i=t.state}},"[":{go:function(){s.push({state:"ok"}),a=[],i="firstavalue"},ovalue:function(){s.push({container:a,state:"ocomma",key:l}),a=[],i="firstavalue"},firstavalue:function(){s.push({container:a,state:"acomma"}),a=[],i="firstavalue"},avalue:function(){s.push({container:a,state:"acomma"}),a=[],i="firstavalue"}},"]":{firstavalue:function(){var t=s.pop();u=a,a=t.container,l=t.key,i=t.state},acomma:function(){var t=s.pop();a.push(u),u=a,a=t.container,l=t.key,i=t.state}},":":{colon:function(){if(Object.hasOwnProperty.call(a,l))throw new SyntaxError("Duplicate key '"+l+'"');i="ovalue"}},",":{ocomma:function(){a[l]=u,i="okey"},acomma:function(){a.push(u),i="avalue"}},true:{go:function(){u=!0,i="ok"},ovalue:function(){u=!0,i="ocomma"},firstavalue:function(){u=!0,i="acomma"},avalue:function(){u=!0,i="acomma"}},false:{go:function(){u=!1,i="ok"},ovalue:function(){u=!1,i="ocomma"},firstavalue:function(){u=!1,i="acomma"},avalue:function(){u=!1,i="acomma"}},null:{go:function(){u=null,i="ok"},ovalue:function(){u=null,i="ocomma"},firstavalue:function(){u=null,i="acomma"},avalue:function(){u=null,i="acomma"}}},function(t,e){var r,n,o=/^[\u0020\t\n\r]*(?:([,:\[\]{}]|true|false|null)|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)|"((?:[^\r\n\t\\\"]|\\(?:["\\\/trnfb]|u[0-9a-fA-F]{4}))*)")/;i="go",s=[];try{for(;r=o.exec(t);)r[1]?f[r[1]][i]():r[2]?(u=+r[2],p[i]()):(n=r[3],u=n.replace(/\\(?:u(.{4})|([^u]))/g,(function(t,e,r){return e?String.fromCharCode(parseInt(e,16)):c[r]})),h[i]()),t=t.slice(r[0].length)}catch(t){i=t}if("ok"!==i||/[^\u0020\t\n\r]/.test(t))throw i instanceof SyntaxError?i:new SyntaxError("JSON");return"function"==typeof e?function t(r,n){var o,i,s=r[n];if(s&&"object"==typeof s)for(o in u)Object.prototype.hasOwnProperty.call(s,o)&&(void 0!==(i=t(s,o))?s[o]=i:delete s[o]);return e.call(r,n,s)}({"":u},""):u}))}},583:function(t,e,r){var n=r(949),o=r(585),i=r(49),s=r(144),a=r(262),l=r(751),u=r(587),c=r(485),h=r(960),p=r(746),f=r(379),d=r(136),m=r(792).A,y=r(436).A,g=r(287).A;function v(t,e){this.options=o.handleOptions(I,t,null,s),this.options._configuredOptions=t;var r=this.components.telemeter,a=this.components.instrumenter,d=this.components.polyfillJSON;this.wrapGlobals=this.components.wrapGlobals,this.scrub=this.components.scrub;var m=this.components.truncation,y=this.components.tracing,v=this.components.recorder,b=new l(m),w=new i(this.options,b,u,m);if(y&&(this.tracing=new y(x(),this.options),this.tracing.initSession()),v&&o.isBrowser()){var S=this.options.recorder;this.recorder=new v(S),this.replayMap=new g({recorder:this.recorder,api:w,tracing:this.tracing}),S.enabled&&S.autoStart&&this.recorder.start()}r&&(this.telemeter=new r(this.options,this.tracing)),this.client=e||new n(this.options,w,s,this.telemeter,this.tracing,this.replayMap,"browser");var k=x(),C="undefined"!=typeof document&&document;this.isChrome=k.chrome&&k.chrome.runtime,this.anonymousErrorsPending=0,function(t,e,r){t.addTransform(c.handleDomException).addTransform(c.handleItemWithError).addTransform(c.ensureItemHasSomethingToSay).addTransform(c.addBaseInfo).addTransform(c.addRequestInfo(r)).addTransform(c.addClientInfo(r)).addTransform(c.addPluginInfo(r)).addTransform(c.addBody).addTransform(h.addMessageWithError).addTransform(h.addTelemetryData).addTransform(h.addConfigToPayload).addTransform(c.addScrubber(e.scrub)).addTransform(h.addPayloadOptions).addTransform(h.userTransform(s)).addTransform(h.addConfiguredOptions).addTransform(h.addDiagnosticKeys).addTransform(h.itemToPayload)}(this.client.notifier,this,k),this.client.queue.addPredicate(f.checkLevel).addPredicate(p.checkIgnore).addPredicate(f.userCheckIgnore(s)).addPredicate(f.urlIsNotBlockListed(s)).addPredicate(f.urlIsSafeListed(s)).addPredicate(f.messageIsIgnored(s)),this.setupUnhandledCapture(),a&&(this.instrumenter=new a(this.options,this.client.telemeter,this,k,C),this.instrumenter.instrument()),o.setupJSON(d),this.rollbar=this}var b=null;function w(t){var e="Rollbar is not initialized";s.error(e),t&&t(new Error(e))}function S(t){for(var e=0,r=t.length;e<r;++e)if(o.isFunction(t[e]))return t[e]}function x(){return"undefined"!=typeof window&&window||"undefined"!=typeof self&&self}v.init=function(t,e){return b?b.global(t).configure(t):b=new v(t,e)},v.prototype.components={},v.setComponents=function(t){v.prototype.components=t},v.prototype.global=function(t){return this.client.global(t),this},v.global=function(t){if(b)return b.global(t);w()},v.prototype.configure=function(t,e){var r,n=this.options,i={};return e&&(i={payload:e}),this.options=o.handleOptions(n,t,i,s),this.options._configuredOptions=o.handleOptions(n._configuredOptions,t,i),null===(r=this.recorder)||void 0===r||r.configure(this.options),this.client.configure(this.options,e),this.instrumenter&&this.instrumenter.configure(this.options),this.setupUnhandledCapture(),this},v.configure=function(t,e){if(b)return b.configure(t,e);w()},v.prototype.lastError=function(){return this.client.lastError},v.lastError=function(){if(b)return b.lastError();w()},v.prototype.log=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.log(t),{uuid:e}},v.log=function(){if(b)return b.log.apply(b,arguments);w(S(arguments))},v.prototype.debug=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.debug(t),{uuid:e}},v.debug=function(){if(b)return b.debug.apply(b,arguments);w(S(arguments))},v.prototype.info=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.info(t),{uuid:e}},v.info=function(){if(b)return b.info.apply(b,arguments);w(S(arguments))},v.prototype.warn=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.warn(t),{uuid:e}},v.warn=function(){if(b)return b.warn.apply(b,arguments);w(S(arguments))},v.prototype.warning=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.warning(t),{uuid:e}},v.warning=function(){if(b)return b.warning.apply(b,arguments);w(S(arguments))},v.prototype.error=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.error(t),{uuid:e}},v.error=function(){if(b)return b.error.apply(b,arguments);w(S(arguments))},v.prototype.critical=function(){var t=this._createItem(arguments),e=t.uuid;return this.client.critical(t),{uuid:e}},v.critical=function(){if(b)return b.critical.apply(b,arguments);w(S(arguments))},v.prototype.buildJsonPayload=function(t){return this.client.buildJsonPayload(t)},v.buildJsonPayload=function(){if(b)return b.buildJsonPayload.apply(b,arguments);w()},v.prototype.sendJsonPayload=function(t){return this.client.sendJsonPayload(t)},v.sendJsonPayload=function(){if(b)return b.sendJsonPayload.apply(b,arguments);w()},v.prototype.setupUnhandledCapture=function(){var t=x();this.unhandledExceptionsInitialized||(this.options.captureUncaught||this.options.handleUncaughtExceptions)&&(a.captureUncaughtExceptions(t,this),this.wrapGlobals&&this.options.wrapGlobalEventHandlers&&this.wrapGlobals(t,this),this.unhandledExceptionsInitialized=!0),this.unhandledRejectionsInitialized||(this.options.captureUnhandledRejections||this.options.handleUnhandledRejections)&&(a.captureUnhandledRejections(t,this),this.unhandledRejectionsInitialized=!0)},v.prototype.handleUncaughtException=function(t,e,r,n,i,s){if(this.options.captureUncaught||this.options.handleUncaughtExceptions){if(this.options.inspectAnonymousErrors&&this.isChrome&&null===i&&""===e)return"anonymous";var a,l=o.makeUnhandledStackInfo(t,e,r,n,i,"onerror","uncaught exception",d);o.isError(i)?(a=this._createItem([t,i,s]))._unhandledStackInfo=l:o.isError(e)?(a=this._createItem([t,e,s]))._unhandledStackInfo=l:(a=this._createItem([t,s])).stackInfo=l,a.level=this.options.uncaughtErrorLevel,a._isUncaught=!0,this.client.log(a)}},v.prototype.handleAnonymousErrors=function(){if(this.options.inspectAnonymousErrors&&this.isChrome){var t=this;try{Error.prepareStackTrace=function(e,r){if(t.options.inspectAnonymousErrors&&t.anonymousErrorsPending){if(t.anonymousErrorsPending-=1,!e)return;e._isAnonymous=!0,t.handleUncaughtException(e.message,null,null,null,e)}return e.stack}}catch(t){this.options.inspectAnonymousErrors=!1,this.error("anonymous error handler failed",t)}}},v.prototype.handleUnhandledRejection=function(t,e){if(this.options.captureUnhandledRejections||this.options.handleUnhandledRejections){var r="unhandled rejection was null or undefined!";if(t)if(t.message)r=t.message;else{var n=o.stringify(t);n.value&&(r=n.value)}var i,s=t&&t._rollbarContext||e&&e._rollbarContext;o.isError(t)?i=this._createItem([r,t,s]):(i=this._createItem([r,t,s])).stackInfo=o.makeUnhandledStackInfo(r,"",0,0,null,"unhandledrejection","",d),i.level=this.options.uncaughtErrorLevel,i._isUncaught=!0,i._originalArgs=i._originalArgs||[],i._originalArgs.push(e),this.client.log(i)}},v.prototype.wrap=function(t,e,r){try{var n;if(n=o.isFunction(e)?e:function(){return e||{}},!o.isFunction(t))return t;if(t._isWrap)return t;if(!t._rollbar_wrapped&&(t._rollbar_wrapped=function(){r&&o.isFunction(r)&&r.apply(this,arguments);try{return t.apply(this,arguments)}catch(r){var e=r;throw e&&window._rollbarWrappedError!==e&&(o.isType(e,"string")&&(e=new String(e)),e._rollbarContext=n()||{},e._rollbarContext._wrappedSource=t.toString(),window._rollbarWrappedError=e),e}},t._rollbar_wrapped._isWrap=!0,t.hasOwnProperty))for(var i in t)t.hasOwnProperty(i)&&"_rollbar_wrapped"!==i&&(t._rollbar_wrapped[i]=t[i]);return t._rollbar_wrapped}catch(e){return t}},v.wrap=function(t,e){if(b)return b.wrap(t,e);w()},v.prototype.captureEvent=function(){var t=o.createTelemetryEvent(arguments);return this.client.captureEvent(t.type,t.metadata,t.level)},v.captureEvent=function(){if(b)return b.captureEvent.apply(b,arguments);w()},v.prototype.captureDomContentLoaded=function(t,e){return e||(e=new Date),this.client.captureDomContentLoaded(e)},v.prototype.captureLoad=function(t,e){return e||(e=new Date),this.client.captureLoad(e)},v.prototype.loadFull=function(){s.info("Unexpected Rollbar.loadFull() called on a Notifier instance. This can happen when Rollbar is loaded multiple times.")},v.prototype._createItem=function(t){return o.createItem(t,s,this)};var k=r(299),C=r(699),I={version:k.version,scrubFields:C.scrubFields,logLevel:k.logLevel,reportLevel:k.reportLevel,uncaughtErrorLevel:k.uncaughtErrorLevel,endpoint:k.endpoint,verbose:!1,enabled:!0,transmit:!0,sendConfig:!1,includeItemsInTelemetry:!0,captureIp:!0,inspectAnonymousErrors:!0,ignoreDuplicateErrors:!0,wrapGlobalEventHandlers:!1,recorder:m,tracing:y};t.exports=v},585:function(t,e,r){function n(t,e){var r="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=function(t,e){if(t){if("string"==typeof t)return o(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?o(t,e):void 0}}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,i=function(){};return{s:i,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,a=!0,l=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return a=t.done,t},e:function(t){l=!0,s=t},f:function(){try{a||null==r.return||r.return()}finally{if(l)throw s}}}}function o(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=Array(e);r<e;r++)n[r]=t[r];return n}function i(t){return i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i(t)}var s=r(965),a={};function l(t,e){return e===u(t)}function u(t){var e=i(t);return"object"!==e?e:t?t instanceof Error?"error":{}.toString.call(t).match(/\s([a-zA-Z]+)/)[1].toLowerCase():"null"}function c(t){return l(t,"function")}function h(t){var e=Function.prototype.toString.call(Object.prototype.hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?"),r=RegExp("^"+e+"$");return p(t)&&r.test(t)}function p(t){var e=i(t);return null!=t&&("object"==e||"function"==e)}function f(){var t=S();return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,(function(e){var r=(t+16*Math.random())%16|0;return t=Math.floor(t/16),("x"===e?r:7&r|8).toString(16)}))}var d={strictMode:!1,key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}};function m(t,e){var r,n;try{r=a.stringify(t)}catch(o){if(e&&c(e))try{r=e(t)}catch(t){n=t}else n=o}return{error:n,value:r}}function y(t,e){return function(r,n){try{e(r,n)}catch(e){t.error(e)}}}function g(t){return function t(e,r){var n,o,i,s={};try{for(o in e)(n=e[o])&&(l(n,"object")||l(n,"array"))?r.includes(n)?s[o]="Removed circular reference: "+u(n):((i=r.slice()).push(n),s[o]=t(n,i)):s[o]=n}catch(t){s="Failed cloning custom data: "+t.message}return s}(t,[t])}var v=["log","network","dom","navigation","error","manual"],b=["critical","error","warning","info","debug"];function w(t,e){for(var r=0;r<t.length;++r)if(t[r]===e)return!0;return!1}function S(){return Date.now?+Date.now():+new Date}t.exports={addParamsAndAccessTokenToPath:function(t,e,r){(r=r||{}).access_token=t;var n,o=[];for(n in r)Object.prototype.hasOwnProperty.call(r,n)&&o.push([n,r[n]].join("="));var i="?"+o.sort().join("&");(e=e||{}).path=e.path||"";var s,a=e.path.indexOf("?"),l=e.path.indexOf("#");-1!==a&&(-1===l||l>a)?(s=e.path,e.path=s.substring(0,a)+i+"&"+s.substring(a+1)):-1!==l?(s=e.path,e.path=s.substring(0,l)+i+s.substring(l)):e.path=e.path+i},createItem:function(t,e,r,n,o){for(var i,s,a,l,c,h,p=[],d=[],m=0,v=t.length;m<v;++m){var b=u(h=t[m]);switch(d.push(b),b){case"undefined":break;case"string":i?p.push(h):i=h;break;case"function":l=y(e,h);break;case"date":p.push(h);break;case"error":case"domexception":case"exception":s?p.push(h):s=h;break;case"object":case"array":if(h instanceof Error||"undefined"!=typeof DOMException&&h instanceof DOMException){s?p.push(h):s=h;break}if(n&&"object"===b&&!c){for(var w=0,x=n.length;w<x;++w)if(void 0!==h[n[w]]){c=h;break}if(c)break}a?p.push(h):a=h;break;default:if(h instanceof Error||"undefined"!=typeof DOMException&&h instanceof DOMException){s?p.push(h):s=h;break}p.push(h)}}a&&(a=g(a)),p.length>0&&(a||(a=g({})),a.extraArgs=g(p));var k={message:i,err:s,custom:a,timestamp:S(),callback:l,notifier:r,diagnostic:{},uuid:f()};return k.data=k.data||{},function(t,e){e&&void 0!==e.level&&(t.level=e.level,delete e.level);e&&void 0!==e.skipFrames&&(t.skipFrames=e.skipFrames,delete e.skipFrames)}(k,a),n&&c&&(k.request=c),o&&(k.lambdaContext=o),k._originalArgs=t,k.diagnostic.original_arg_types=d,k},addErrorContext:function(t,e){var r=t.data.custom||{},n=!1;try{for(var o=0;o<e.length;++o)e[o].hasOwnProperty("rollbarContext")&&(r=s(r,g(e[o].rollbarContext)),n=!0);n&&(t.data.custom=r)}catch(e){t.diagnostic.error_context="Failed: "+e.message}},createTelemetryEvent:function(t){for(var e,r,n,o,i=0,s=t.length;i<s;++i){switch(u(o=t[i])){case"string":!e&&w(v,o)?e=o:!n&&w(b,o)&&(n=o);break;case"object":r=o}}return{type:e||"manual",metadata:r||{},level:n}},addItemAttributes:function(t,e){t.attributes=t.attributes||[];var r,o=n(e);try{for(o.s();!(r=o.n()).done;){var i=r.value;void 0!==i.value&&t.attributes.push(i)}}catch(t){o.e(t)}finally{o.f()}},getItemAttribute:function(t,e){for(var r=t.attributes||[],n=0;n<r.length;++n)if(r[n].key===e)return r[n].value},filterIp:function(t,e){if(t&&t.user_ip&&!0!==e){var r=t.user_ip;if(e)try{var n;if(-1!==r.indexOf("."))(n=r.split(".")).pop(),n.push("0"),r=n.join(".");else if(-1!==r.indexOf(":")){if((n=r.split(":")).length>2){var o=n.slice(0,3),i=o[2].indexOf("/");-1!==i&&(o[2]=o[2].substring(0,i));r=o.concat("0000:0000:0000:0000:0000").join(":")}}else r=null}catch(t){r=null}else r=null;t.user_ip=r}},formatArgsAsString:function(t){var e,r,n,o=[];for(e=0,r=t.length;e<r;++e){switch(u(n=t[e])){case"object":(n=(n=m(n)).error||n.value).length>500&&(n=n.substr(0,497)+"...");break;case"null":n="null";break;case"undefined":n="undefined";break;case"symbol":n=n.toString()}o.push(n)}return o.join(" ")},formatUrl:function(t,e){if(!(e=e||t.protocol)&&t.port&&(80===t.port?e="http:":443===t.port&&(e="https:")),e=e||"https:",!t.hostname)return null;var r=e+"//"+t.hostname;return t.port&&(r=r+":"+t.port),t.path&&(r+=t.path),r},get:function(t,e){if(t){var r=e.split("."),n=t;try{for(var o=0,i=r.length;o<i;++o)n=n[r[o]]}catch(t){n=void 0}return n}},handleOptions:function(t,e,r,n){var o=s(t,e,r);return o=function(t,e){t.hostWhiteList&&!t.hostSafeList&&(t.hostSafeList=t.hostWhiteList,t.hostWhiteList=void 0,e&&e.log("hostWhiteList is deprecated. Use hostSafeList."));t.hostBlackList&&!t.hostBlockList&&(t.hostBlockList=t.hostBlackList,t.hostBlackList=void 0,e&&e.log("hostBlackList is deprecated. Use hostBlockList."));return t}(o,n),!e||e.overwriteScrubFields||e.scrubFields&&(o.scrubFields=(t.scrubFields||[]).concat(e.scrubFields)),o},isError:function(t){return l(t,"error")||l(t,"exception")},isFiniteNumber:function(t){return Number.isFinite(t)},isFunction:c,isIterable:function(t){var e=u(t);return"object"===e||"array"===e},isNativeFunction:h,isObject:p,isString:function(t){return"string"==typeof t||t instanceof String},isType:l,isPromise:function(t){return p(t)&&l(t.then,"function")},isBrowser:function(){return"undefined"!=typeof window},jsonParse:function(t){var e,r;try{e=a.parse(t)}catch(t){r=t}return{error:r,value:e}},LEVELS:{debug:0,info:1,warning:2,error:3,critical:4},makeUnhandledStackInfo:function(t,e,r,n,o,i,s,a){var l={url:e||"",line:r,column:n};l.func=a.guessFunctionName(l.url,l.line),l.context=a.gatherContext(l.url,l.line);var u="undefined"!=typeof document&&document&&document.location&&document.location.href,c="undefined"!=typeof window&&window&&window.navigator&&window.navigator.userAgent;return{mode:i,message:o?String(o):t||s,url:u,stack:[l],useragent:c}},merge:s,now:S,redact:function(){return"********"},RollbarJSON:a,sanitizeUrl:function(t){var e=function(t){if(!l(t,"string"))return;for(var e=d,r=e.parser[e.strictMode?"strict":"loose"].exec(t),n={},o=0,i=e.key.length;o<i;++o)n[e.key[o]]=r[o]||"";return n[e.q.name]={},n[e.key[12]].replace(e.q.parser,(function(t,r,o){r&&(n[e.q.name][r]=o)})),n}(t);return e?(""===e.anchor&&(e.source=e.source.replace("#","")),t=e.source.replace("?"+e.query,"")):"(unknown)"},set:function(t,e,r){if(t){var n=e.split("."),o=n.length;if(!(o<1))if(1!==o)try{for(var i=t[n[0]]||{},s=i,a=1;a<o-1;++a)i[n[a]]=i[n[a]]||{},i=i[n[a]];i[n[o-1]]=r,t[n[0]]=s}catch(t){return}else t[n[0]]=r}},setupJSON:function(t){c(a.stringify)&&c(a.parse)||(l(JSON,"undefined")||(t?(h(JSON.stringify)&&(a.stringify=JSON.stringify),h(JSON.parse)&&(a.parse=JSON.parse)):(c(JSON.stringify)&&(a.stringify=JSON.stringify),c(JSON.parse)&&(a.parse=JSON.parse))),c(a.stringify)&&c(a.parse)||t&&t(a))},stringify:m,maxByteSize:function(t){for(var e=0,r=t.length,n=0;n<r;n++){var o=t.charCodeAt(n);o<128?e+=1:o<2048?e+=2:o<65536&&(e+=3)}return e},typeName:u,uuid4:f}},587:function(t){t.exports={parse:function(t){var e,r,n={protocol:null,auth:null,host:null,path:null,hash:null,href:t,hostname:null,port:null,pathname:null,search:null,query:null};if(-1!==(e=t.indexOf("//"))?(n.protocol=t.substring(0,e),r=e+2):r=0,-1!==(e=t.indexOf("@",r))&&(n.auth=t.substring(r,e),r=e+1),-1===(e=t.indexOf("/",r))){if(-1===(e=t.indexOf("?",r)))return-1===(e=t.indexOf("#",r))?n.host=t.substring(r):(n.host=t.substring(r,e),n.hash=t.substring(e)),n.hostname=n.host.split(":")[0],n.port=n.host.split(":")[1],n.port&&(n.port=parseInt(n.port,10)),n;n.host=t.substring(r,e),n.hostname=n.host.split(":")[0],n.port=n.host.split(":")[1],n.port&&(n.port=parseInt(n.port,10)),r=e}else n.host=t.substring(r,e),n.hostname=n.host.split(":")[0],n.port=n.host.split(":")[1],n.port&&(n.port=parseInt(n.port,10)),r=e;if(-1===(e=t.indexOf("#",r))?n.path=t.substring(r):(n.path=t.substring(r,e),n.hash=t.substring(e)),n.path){var o=n.path.split("?");n.pathname=o[0],n.query=o[1],n.search=n.query?"?"+n.query:null}return n}}},618:function(t,e,r){var n=r(585),o=100;function i(t){return[Math.trunc(t/1e3),Math.round(t%1e3*1e6)]}function s(t,e){var r;this.queue=[],this.options=n.merge(t);var i=this.options.maxTelemetryEvents||o;this.maxQueueSize=Math.max(0,Math.min(i,o)),this.tracing=e,this.telemetrySpan=null===(r=this.tracing)||void 0===r?void 0:r.startSpan("rollbar-telemetry",{})}function a(t,e){if(e)return e;return{error:"error",manual:"info"}[t]||"info"}s.prototype.configure=function(t){var e=this.options;this.options=n.merge(e,t);var r=this.options.maxTelemetryEvents||o,i=Math.max(0,Math.min(r,o)),s=0;this.queue.length>i&&(s=this.queue.length-i),this.maxQueueSize=i,this.queue.splice(0,s)},s.prototype.copyEvents=function(){var t=Array.prototype.slice.call(this.queue,0);if(n.isFunction(this.options.filterTelemetry))try{for(var e=t.length;e--;)this.options.filterTelemetry(t[e])&&t.splice(e,1)}catch(t){this.options.filterTelemetry=null}return t},s.prototype.capture=function(t,e,r,o,i){var s={level:a(t,r),type:t,timestamp_ms:i||n.now(),body:e,source:"client"};o&&(s.uuid=o);try{if(n.isFunction(this.options.filterTelemetry)&&this.options.filterTelemetry(s))return!1}catch(t){this.options.filterTelemetry=null}return this.push(s),s},s.prototype.captureEvent=function(t,e,r,n){return this.capture(t,e,r,n)},s.prototype.captureError=function(t,e,r,n){var o,s=t.message||String(t),a={message:s};return t.stack&&(a.stack=t.stack),null===(o=this.telemetrySpan)||void 0===o||o.addEvent("rollbar-occurrence-event",{message:s,level:e,type:"error",uuid:r,"occurrence.type":"error","occurrence.uuid":r},i(n)),this.capture("error",a,e,r,n)},s.prototype.captureLog=function(t,e,r,n){var o,s;r?null===(o=this.telemetrySpan)||void 0===o||o.addEvent("rollbar-occurrence-event",{message:t,level:e,type:"message",uuid:r,"occurrence.type":"message","occurrence.uuid":r},i(n)):null===(s=this.telemetrySpan)||void 0===s||s.addEvent("rollbar-log-event",{message:t,level:e},i(n));return this.capture("log",{message:t},e,r,n)},s.prototype.captureNetwork=function(t,e,r,n){var o,s;e=e||"xhr",t.subtype=t.subtype||e,n&&(t.request=n);var a=this.levelFromStatus(t.status_code),l=1e6*(t.end_time_ms||0);return null===(o=this.telemetrySpan)||void 0===o||o.addEvent("rollbar-network-event",{type:t.subtype,method:t.method,url:t.url,statusCode:t.status_code,"request.headers":JSON.stringify(t.request_headers||{}),"response.headers":JSON.stringify((null===(s=t.response)||void 0===s?void 0:s.headers)||{}),"response.timeUnixNano":l.toString()},i(t.start_time_ms)),this.capture("network",t,a,r,t.start_time_ms)},s.prototype.levelFromStatus=function(t){return t>=200&&t<400?"info":0===t||t>=400?"error":"info"},s.prototype.captureDom=function(t,e,r,n,o){var i={subtype:t,element:e};return void 0!==r&&(i.value=r),void 0!==n&&(i.checked=n),this.capture("dom",i,"info",o)},s.prototype.captureNavigation=function(t,e,r,n){var o;return null===(o=this.telemetrySpan)||void 0===o||o.addEvent("rollbar-navigation-event",{"previous.url.full":t,"url.full":e},i(n)),this.capture("navigation",{from:t,to:e},"info",r,n)},s.prototype.captureDomContentLoaded=function(t){return this.capture("navigation",{subtype:"DOMContentLoaded"},"info",void 0,t&&t.getTime())},s.prototype.captureLoad=function(t){return this.capture("navigation",{subtype:"load"},"info",void 0,t&&t.getTime())},s.prototype.captureConnectivityChange=function(t,e){return this.captureNetwork({change:t},"connectivity",e)},s.prototype._captureRollbarItem=function(t){if(this.options.includeItemsInTelemetry)return t.err?this.captureError(t.err,t.level,t.uuid,t.timestamp):t.message?this.captureLog(t.message,t.level,t.uuid,t.timestamp):t.custom?this.capture("log",t.custom,t.level,t.uuid,t.timestamp):void 0},s.prototype.push=function(t){this.queue.push(t),this.queue.length>this.maxQueueSize&&this.queue.shift()},t.exports=s},622:function(t,e,r){var n=r(585),o=r(98);function i(t,e){return[t,n.stringify(t,e)]}function s(t,e){var r=t.length;return r>2*e?t.slice(0,e).concat(t.slice(r-e)):t}function a(t,e,r){r=void 0===r?30:r;var o,i=t.data.body;if(i.trace_chain)for(var a=i.trace_chain,l=0;l<a.length;l++)o=s(o=a[l].frames,r),a[l].frames=o;else i.trace&&(o=s(o=i.trace.frames,r),i.trace.frames=o);return[t,n.stringify(t,e)]}function l(t,e){return e&&e.length>t?e.slice(0,t-3).concat("..."):e}function u(t,e,r){return e=o(e,(function e(r,i,s){switch(n.typeName(i)){case"string":return l(t,i);case"object":case"array":return o(i,e,s);default:return i}})),[e,n.stringify(e,r)]}function c(t){return t.exception&&(delete t.exception.description,t.exception.message=l(255,t.exception.message)),t.frames=s(t.frames,1),t}function h(t,e){var r=t.data.body;if(r.trace_chain)for(var o=r.trace_chain,i=0;i<o.length;i++)o[i]=c(o[i]);else r.trace&&(r.trace=c(r.trace));return[t,n.stringify(t,e)]}function p(t,e){return n.maxByteSize(t)>e}t.exports={truncate:function(t,e,r){r=void 0===r?524288:r;for(var n,o,s,l=[i,a,u.bind(null,1024),u.bind(null,512),u.bind(null,256),h];n=l.shift();)if(t=(o=n(t,e))[0],(s=o[1]).error||!p(s.value,r))return s;return s},raw:i,truncateFrames:a,truncateStrings:u,maybeTruncateValue:l}},629:function(t){var e={ieVersion:function(){var t;if("undefined"==typeof document)return t;for(var e=3,r=document.createElement("div"),n=r.getElementsByTagName("i");r.innerHTML="\x3c!--[if gt IE "+ ++e+"]><i></i><![endif]--\x3e",n[0];);return e>4?e:t}};t.exports=e},657:function(t,e,r){var n=r(538);t.exports=n},699:function(t){t.exports={scrubFields:["pw","pass","passwd","password","secret","confirm_password","confirmPassword","password_confirmation","passwordConfirmation","access_token","accessToken","X-Rollbar-Access-Token","secret_key","secretKey","secretToken","cc-number","card number","cardnumber","cardnum","ccnum","ccnumber","cc num","creditcardnumber","credit card number","newcreditcardnumber","new credit card","creditcardno","credit card no","card#","card #","cc-csc","cvc","cvc2","cvv2","ccv2","security code","card verification","name on credit card","name on card","nameoncard","cardholder","card holder","name des karteninhabers","ccname","card type","cardtype","cc type","cctype","payment type","expiration date","expirationdate","expdate","cc-exp","ccmonth","ccyear"]}},705:function(t,e,r){var n=r(585),o=r(736),i=r(398),s=r(922),a=r(587),l=r(392),u={network:!0,networkResponseHeaders:!1,networkResponseBody:!1,networkRequestHeaders:!1,networkRequestBody:!1,networkErrorOnHttp5xx:!1,networkErrorOnHttp4xx:!1,networkErrorOnHttp0:!1,log:!0,dom:!0,navigation:!0,connectivity:!0,contentSecurityPolicy:!0,errorOnContentSecurityPolicy:!1};function c(t,e){for(var r;t[e].length;)(r=t[e].shift())[0][r[1]]=r[2]}function h(t,e,r,o,i){this.options=t;var s=t.autoInstrument;!1===t.enabled||!1===s?this.autoInstrument={}:(n.isType(s,"object")||(s=u),this.autoInstrument=n.merge(u,s)),this.scrubTelemetryInputs=!!t.scrubTelemetryInputs,this.telemetryScrubber=t.telemetryScrubber,this.defaultValueScrubber=function(t){for(var e=[],r=0;r<t.length;++r)e.push(new RegExp(t[r],"i"));return function(t){var r=function(t){if(!t||!t.attributes)return null;for(var e=t.attributes,r=0;r<e.length;++r)if("name"===e[r].key)return e[r].value;return null}(t);if(!r)return!1;for(var n=0;n<e.length;++n)if(e[n].test(r))return!0;return!1}}(t.scrubFields),this.telemeter=e,this.rollbar=r,this.diagnostic=r.client.notifier.diagnostic,this._window=o||{},this._document=i||{},this.replacements={network:[],log:[],navigation:[],connectivity:[]},this.eventRemovers={dom:[],connectivity:[],contentsecuritypolicy:[]},this._location=this._window.location,this._lastHref=this._location&&this._location.href}function p(t){return"undefined"!=typeof URL&&t instanceof URL}h.prototype.configure=function(t){this.options=n.merge(this.options,t);var e=t.autoInstrument,r=n.merge(this.autoInstrument);!1===t.enabled||!1===e?this.autoInstrument={}:(n.isType(e,"object")||(e=u),this.autoInstrument=n.merge(u,e)),this.instrument(r),void 0!==t.scrubTelemetryInputs&&(this.scrubTelemetryInputs=!!t.scrubTelemetryInputs),void 0!==t.telemetryScrubber&&(this.telemetryScrubber=t.telemetryScrubber)},h.prototype.instrument=function(t){!this.autoInstrument.network||t&&t.network?!this.autoInstrument.network&&t&&t.network&&this.deinstrumentNetwork():this.instrumentNetwork(),!this.autoInstrument.log||t&&t.log?!this.autoInstrument.log&&t&&t.log&&this.deinstrumentConsole():this.instrumentConsole(),!this.autoInstrument.dom||t&&t.dom?!this.autoInstrument.dom&&t&&t.dom&&this.deinstrumentDom():this.instrumentDom(),!this.autoInstrument.navigation||t&&t.navigation?!this.autoInstrument.navigation&&t&&t.navigation&&this.deinstrumentNavigation():this.instrumentNavigation(),!this.autoInstrument.connectivity||t&&t.connectivity?!this.autoInstrument.connectivity&&t&&t.connectivity&&this.deinstrumentConnectivity():this.instrumentConnectivity(),!this.autoInstrument.contentSecurityPolicy||t&&t.contentSecurityPolicy?!this.autoInstrument.contentSecurityPolicy&&t&&t.contentSecurityPolicy&&this.deinstrumentContentSecurityPolicy():this.instrumentContentSecurityPolicy()},h.prototype.deinstrumentNetwork=function(){c(this.replacements,"network")},h.prototype.instrumentNetwork=function(){var t=this;function e(e,r){e in r&&n.isFunction(r[e])&&i(r,e,(function(e){return t.rollbar.wrap(e)}))}if("XMLHttpRequest"in this._window){var r=this._window.XMLHttpRequest.prototype;i(r,"open",(function(t){return function(e,r){var o=p(r);return(n.isType(r,"string")||o)&&(r=o?r.toString():r,this.__rollbar_xhr?(this.__rollbar_xhr.method=e,this.__rollbar_xhr.url=r,this.__rollbar_xhr.status_code=null,this.__rollbar_xhr.start_time_ms=n.now(),this.__rollbar_xhr.end_time_ms=null):this.__rollbar_xhr={method:e,url:r,status_code:null,start_time_ms:n.now(),end_time_ms:null}),t.apply(this,arguments)}}),this.replacements,"network"),i(r,"setRequestHeader",(function(e){return function(r,o){return this.__rollbar_xhr||(this.__rollbar_xhr={}),n.isType(r,"string")&&n.isType(o,"string")&&(t.autoInstrument.networkRequestHeaders&&(this.__rollbar_xhr.request_headers||(this.__rollbar_xhr.request_headers={}),this.__rollbar_xhr.request_headers[r]=o),"content-type"===r.toLowerCase()&&(this.__rollbar_xhr.request_content_type=o)),e.apply(this,arguments)}}),this.replacements,"network"),i(r,"send",(function(r){return function(o){var s=this;function a(){if(s.__rollbar_xhr&&(null===s.__rollbar_xhr.status_code&&(s.__rollbar_xhr.status_code=0,t.autoInstrument.networkRequestBody&&(s.__rollbar_xhr.request=o),s.__rollbar_event=t.captureNetwork(s.__rollbar_xhr,"xhr",void 0)),s.readyState<2&&(s.__rollbar_xhr.start_time_ms=n.now()),s.readyState>3)){s.__rollbar_xhr.end_time_ms=n.now();var e=null;if(s.__rollbar_xhr.response_content_type=s.getResponseHeader("Content-Type"),t.autoInstrument.networkResponseHeaders){var r=t.autoInstrument.networkResponseHeaders;e={};try{var i,a;if(!0===r){var l=s.getAllResponseHeaders();if(l){var u,c,h=l.trim().split(/[\r\n]+/);for(a=0;a<h.length;a++)i=(u=h[a].split(": ")).shift(),c=u.join(": "),e[i]=c}}else for(a=0;a<r.length;a++)e[i=r[a]]=s.getResponseHeader(i)}catch(t){}}var p=null;if(t.autoInstrument.networkResponseBody)try{p=s.responseText}catch(t){}var f=null;(p||e)&&(f={},p&&(t.isJsonContentType(s.__rollbar_xhr.response_content_type)?f.body=t.scrubJson(p):f.body=p),e&&(f.headers=e)),f&&(s.__rollbar_xhr.response=f);try{var d=s.status;d=1223===d?204:d,s.__rollbar_xhr.status_code=d,s.__rollbar_event.level=t.telemeter.levelFromStatus(d),t.errorOnHttpStatus(s.__rollbar_xhr)}catch(t){}}}return e("onload",s),e("onerror",s),e("onprogress",s),"onreadystatechange"in s&&n.isFunction(s.onreadystatechange)?i(s,"onreadystatechange",(function(e){return t.rollbar.wrap(e,void 0,a)})):s.onreadystatechange=a,s.__rollbar_xhr&&t.trackHttpErrors()&&(s.__rollbar_xhr.stack=(new Error).stack),r.apply(this,arguments)}}),this.replacements,"network")}"fetch"in this._window&&i(this._window,"fetch",(function(e){return function(r,i){for(var s=new Array(arguments.length),a=0,l=s.length;a<l;a++)s[a]=arguments[a];var u,c=s[0],h="GET",f=p(c);n.isType(c,"string")||f?u=f?c.toString():c:c&&(u=c.url,c.method&&(h=c.method)),s[1]&&s[1].method&&(h=s[1].method);var d={method:h,url:u,status_code:null,start_time_ms:n.now(),end_time_ms:null};if(s[1]&&s[1].headers){var m=o(s[1].headers);d.request_content_type=m.get("Content-Type"),t.autoInstrument.networkRequestHeaders&&(d.request_headers=t.fetchHeaders(m,t.autoInstrument.networkRequestHeaders))}return t.autoInstrument.networkRequestBody&&(s[1]&&s[1].body?d.request=s[1].body:s[0]&&!n.isType(s[0],"string")&&s[0].body&&(d.request=s[0].body)),t.captureNetwork(d,"fetch",void 0),t.trackHttpErrors()&&(d.stack=(new Error).stack),e.apply(this,s).then((function(e){d.end_time_ms=n.now(),d.status_code=e.status,d.response_content_type=e.headers.get("Content-Type");var r=null;t.autoInstrument.networkResponseHeaders&&(r=t.fetchHeaders(e.headers,t.autoInstrument.networkResponseHeaders));var o=null;return t.autoInstrument.networkResponseBody&&"function"==typeof e.text&&(o=e.clone().text()),(r||o)&&(d.response={},o&&("function"==typeof o.then?o.then((function(e){e&&t.isJsonContentType(d.response_content_type)?d.response.body=t.scrubJson(e):d.response.body=e})):d.response.body=o),r&&(d.response.headers=r)),t.errorOnHttpStatus(d),e}))}}),this.replacements,"network")},h.prototype.captureNetwork=function(t,e,r){return t.request&&this.isJsonContentType(t.request_content_type)&&(t.request=this.scrubJson(t.request)),this.telemeter.captureNetwork(t,e,r)},h.prototype.isJsonContentType=function(t){return!!(t&&n.isType(t,"string")&&t.toLowerCase().includes("json"))},h.prototype.scrubJson=function(t){return JSON.stringify(s(JSON.parse(t),this.options.scrubFields))},h.prototype.fetchHeaders=function(t,e){var r={};try{var n;if(!0===e){if("function"==typeof t.entries)for(var o=t.entries(),i=o.next();!i.done;)r[i.value[0]]=i.value[1],i=o.next()}else for(n=0;n<e.length;n++){var s=e[n];r[s]=t.get(s)}}catch(t){}return r},h.prototype.trackHttpErrors=function(){return this.autoInstrument.networkErrorOnHttp5xx||this.autoInstrument.networkErrorOnHttp4xx||this.autoInstrument.networkErrorOnHttp0},h.prototype.errorOnHttpStatus=function(t){var e=t.status_code;if(e>=500&&this.autoInstrument.networkErrorOnHttp5xx||e>=400&&this.autoInstrument.networkErrorOnHttp4xx||0===e&&this.autoInstrument.networkErrorOnHttp0){var r=new Error("HTTP request failed with Status "+e);r.stack=t.stack,this.rollbar.error(r,{skipFrames:1})}},h.prototype.deinstrumentConsole=function(){if("console"in this._window&&this._window.console.log)for(var t;this.replacements.log.length;)t=this.replacements.log.shift(),this._window.console[t[0]]=t[1]},h.prototype.instrumentConsole=function(){if("console"in this._window&&this._window.console.log){var t=this,e=this._window.console,r=["debug","info","warn","error","log"];try{for(var o=0,i=r.length;o<i;o++)s(r[o])}catch(t){this.diagnostic.instrumentConsole={error:t.message}}}function s(r){"use strict";var o=e[r],i=e,s="warn"===r?"warning":r;e[r]=function(){var e=Array.prototype.slice.call(arguments),r=n.formatArgsAsString(e);t.telemeter.captureLog(r,s,null,n.now()),o&&Function.prototype.apply.call(o,i,e)},t.replacements.log.push([r,o])}},h.prototype.deinstrumentDom=function(){("addEventListener"in this._window||"attachEvent"in this._window)&&this.removeListeners("dom")},h.prototype.instrumentDom=function(){if("addEventListener"in this._window||"attachEvent"in this._window){var t=this.handleClick.bind(this),e=this.handleBlur.bind(this);this.addListener("dom",this._window,"click","onclick",t,!0),this.addListener("dom",this._window,"blur","onfocusout",e,!0)}},h.prototype.handleClick=function(t){try{var e=l.getElementFromEvent(t,this._document),r=e&&e.tagName,n=l.isDescribedElement(e,"a")||l.isDescribedElement(e,"button");r&&(n||l.isDescribedElement(e,"input",["button","submit"]))?this.captureDomEvent("click",e):l.isDescribedElement(e,"input",["checkbox","radio"])&&this.captureDomEvent("input",e,e.value,e.checked)}catch(t){}},h.prototype.handleBlur=function(t){try{var e=l.getElementFromEvent(t,this._document);e&&e.tagName&&(l.isDescribedElement(e,"textarea")?this.captureDomEvent("input",e,e.value):l.isDescribedElement(e,"select")&&e.options&&e.options.length?this.handleSelectInputChanged(e):l.isDescribedElement(e,"input")&&!l.isDescribedElement(e,"input",["button","submit","hidden","checkbox","radio"])&&this.captureDomEvent("input",e,e.value))}catch(t){}},h.prototype.handleSelectInputChanged=function(t){if(t.multiple)for(var e=0;e<t.options.length;e++)t.options[e].selected&&this.captureDomEvent("input",t,t.options[e].value);else t.selectedIndex>=0&&t.options[t.selectedIndex]&&this.captureDomEvent("input",t,t.options[t.selectedIndex].value)},h.prototype.captureDomEvent=function(t,e,r,n){if(void 0!==r)if(this.scrubTelemetryInputs||"password"===l.getElementType(e))r="[scrubbed]";else{var o=l.describeElement(e);this.telemetryScrubber?this.telemetryScrubber(o)&&(r="[scrubbed]"):this.defaultValueScrubber(o)&&(r="[scrubbed]")}var i=l.elementArrayToString(l.treeToArray(e));this.telemeter.captureDom(t,i,r,n)},h.prototype.deinstrumentNavigation=function(){var t=this._window.chrome;!(t&&t.app&&t.app.runtime)&&this._window.history&&this._window.history.pushState&&c(this.replacements,"navigation")},h.prototype.instrumentNavigation=function(){var t=this._window.chrome;if(!(t&&t.app&&t.app.runtime)&&this._window.history&&this._window.history.pushState){var e=this;i(this._window,"onpopstate",(function(t){return function(){var r=e._location.href;e.handleUrlChange(e._lastHref,r),t&&t.apply(this,arguments)}}),this.replacements,"navigation"),i(this._window.history,"pushState",(function(t){return function(){var r=arguments.length>2?arguments[2]:void 0;return r&&e.handleUrlChange(e._lastHref,r+""),t.apply(this,arguments)}}),this.replacements,"navigation")}},h.prototype.handleUrlChange=function(t,e){var r=a.parse(this._location.href),o=a.parse(e),i=a.parse(t);this._lastHref=e,r.protocol===o.protocol&&r.host===o.host&&(e=o.path+(o.hash||"")),r.protocol===i.protocol&&r.host===i.host&&(t=i.path+(i.hash||"")),this.telemeter.captureNavigation(t,e,null,n.now())},h.prototype.deinstrumentConnectivity=function(){("addEventListener"in this._window||"body"in this._document)&&(this._window.addEventListener?this.removeListeners("connectivity"):c(this.replacements,"connectivity"))},h.prototype.instrumentConnectivity=function(){if("addEventListener"in this._window||"body"in this._document)if(this._window.addEventListener)this.addListener("connectivity",this._window,"online",void 0,function(){this.telemeter.captureConnectivityChange("online")}.bind(this),!0),this.addListener("connectivity",this._window,"offline",void 0,function(){this.telemeter.captureConnectivityChange("offline")}.bind(this),!0);else{var t=this;i(this._document.body,"ononline",(function(e){return function(){t.telemeter.captureConnectivityChange("online"),e&&e.apply(this,arguments)}}),this.replacements,"connectivity"),i(this._document.body,"onoffline",(function(e){return function(){t.telemeter.captureConnectivityChange("offline"),e&&e.apply(this,arguments)}}),this.replacements,"connectivity")}},h.prototype.handleCspEvent=function(t){var e="Security Policy Violation: blockedURI: "+t.blockedURI+", violatedDirective: "+t.violatedDirective+", effectiveDirective: "+t.effectiveDirective+", ";t.sourceFile&&(e+="location: "+t.sourceFile+", line: "+t.lineNumber+", col: "+t.columnNumber+", "),e+="originalPolicy: "+t.originalPolicy,this.telemeter.captureLog(e,"error",null,n.now()),this.handleCspError(e)},h.prototype.handleCspError=function(t){this.autoInstrument.errorOnContentSecurityPolicy&&this.rollbar.error(t)},h.prototype.deinstrumentContentSecurityPolicy=function(){"addEventListener"in this._document&&this.removeListeners("contentsecuritypolicy")},h.prototype.instrumentContentSecurityPolicy=function(){if("addEventListener"in this._document){var t=this.handleCspEvent.bind(this);this.addListener("contentsecuritypolicy",this._document,"securitypolicyviolation",null,t,!1)}},h.prototype.addListener=function(t,e,r,n,o,i){e.addEventListener?(e.addEventListener(r,o,i),this.eventRemovers[t].push((function(){e.removeEventListener(r,o,i)}))):n&&(e.attachEvent(n,o),this.eventRemovers[t].push((function(){e.detachEvent(n,o)})))},h.prototype.removeListeners=function(t){for(;this.eventRemovers[t].length;)this.eventRemovers[t].shift()()},t.exports=h},706:function(t){function e(t,e,r){if(e.hasOwnProperty&&e.hasOwnProperty("addEventListener")){for(var n=e.addEventListener;n._rollbarOldAdd&&n.belongsToShim;)n=n._rollbarOldAdd;var o=function(e,r,o){n.call(this,e,t.wrap(r),o)};o._rollbarOldAdd=n,o.belongsToShim=r,e.addEventListener=o;for(var i=e.removeEventListener;i._rollbarOldRemove&&i.belongsToShim;)i=i._rollbarOldRemove;var s=function(t,e,r){i.call(this,t,e&&e._rollbar_wrapped||e,r)};s._rollbarOldRemove=i,s.belongsToShim=r,e.removeEventListener=s}}t.exports=function(t,r,n){if(t){var o,i,s="EventTarget,Window,Node,ApplicationCache,AudioTrackList,ChannelMergerNode,CryptoOperation,EventSource,FileReader,HTMLUnknownElement,IDBDatabase,IDBRequest,IDBTransaction,KeyOperation,MediaController,MessagePort,ModalWindow,Notification,SVGElementInstance,Screen,TextTrack,TextTrackCue,TextTrackList,WebSocket,WebSocketWorker,Worker,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload".split(",");for(o=0;o<s.length;++o)t[i=s[o]]&&t[i].prototype&&e(r,t[i].prototype,n)}}},736:function(t){function e(t){return"string"!=typeof t&&(t=String(t)),t.toLowerCase()}function r(t){this.map={},t instanceof r?t.forEach((function(t,e){this.append(e,t)}),this):Array.isArray(t)?t.forEach((function(t){this.append(t[0],t[1])}),this):t&&Object.getOwnPropertyNames(t).forEach((function(e){this.append(e,t[e])}),this)}r.prototype.append=function(t,r){t=e(t),r=function(t){return"string"!=typeof t&&(t=String(t)),t}(r);var n=this.map[t];this.map[t]=n?n+", "+r:r},r.prototype.get=function(t){return t=e(t),this.has(t)?this.map[t]:null},r.prototype.has=function(t){return this.map.hasOwnProperty(e(t))},r.prototype.forEach=function(t,e){for(var r in this.map)this.map.hasOwnProperty(r)&&t.call(e,this.map[r],r,this)},r.prototype.entries=function(){var t=[];return this.forEach((function(e,r){t.push([r,e])})),function(t){return{next:function(){var e=t.shift();return{done:void 0===e,value:e}}}}(t)},t.exports=function(t){return"undefined"==typeof Headers?new r(t):new Headers(t)}},738:function(){!function(t){"use strict";t.console||(t.console={});for(var e,r,n=t.console,o=function(){},i=["memory"],s="assert,clear,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn".split(",");e=i.pop();)n[e]||(n[e]={});for(;r=s.pop();)n[r]||(n[r]=o)}("undefined"==typeof window?this:window)},746:function(t,e,r){var n=r(585);t.exports={checkIgnore:function(t,e){return!n.get(e,"plugins.jquery.ignoreAjaxErrors")||!n.get(t,"body.message.extra.isAjax")}}},751:function(t,e,r){var n=r(585),o=r(472),i=r(862);function s(t){this.truncation=t}s.prototype.get=function(t,e,r,o,i){o&&n.isFunction(o)||(o=function(){}),n.addParamsAndAccessTokenToPath(t,e,r);var s=n.formatUrl(e);this._makeZoneRequest(t,s,"GET",null,o,i,e.timeout,e.transport)},s.prototype.post=function(t,e,r,o,i){if(o&&n.isFunction(o)||(o=function(){}),!r)return o(new Error("Cannot send empty request"));var s;if((s=this.truncation&&r.body?this.truncation.truncate(r):n.stringify(r)).error)return o(s.error);var a=s.value,l=n.formatUrl(e);this._makeZoneRequest(t,l,"POST",a,o,i,e.timeout,e.transport)},s.prototype.postJsonPayload=function(t,e,r,o,i){o&&n.isFunction(o)||(o=function(){});var s=n.formatUrl(e);this._makeZoneRequest(t,s,"POST",r,o,i,e.timeout,e.transport)},s.prototype._makeZoneRequest=function(){var t="undefined"!=typeof window&&window||void 0!==n&&n,e=t&&t.Zone&&t.Zone.root,r=Array.prototype.slice.call(arguments);if(e){var n=this;e.run((function(){n._makeRequest.apply(void 0,r)}))}else this._makeRequest.apply(void 0,r)},s.prototype._makeRequest=function(t,e,r,n,s,a,l,u){if("undefined"!=typeof RollbarProxy)return function(t,e){(new RollbarProxy).sendJsonPayload(t,(function(t){}),(function(t){e(new Error(t))}))}(n,s);"fetch"===u?o(t,e,r,n,s,l):i(t,e,r,n,s,a,l)},t.exports=s},767:function(t,e){"use strict";e.A={gen:function(){var t=new Uint8Array(arguments.length>0&&void 0!==arguments[0]?arguments[0]:16);return crypto.getRandomValues(t),Array.from(t,(function(t){return t.toString(16).padStart(2,"0")})).join("")}}},792:function(t,e){"use strict";e.A={enabled:!1,autoStart:!0,maxSeconds:300,triggerOptions:{item:{levels:["error","critical"]}},debug:{logErrors:!0,logEmits:!1},inlineStylesheet:!0,inlineImages:!1,collectFonts:!0,maskInputOptions:{password:!0,email:!1,tel:!1,text:!1,color:!1,date:!1,"datetime-local":!1,month:!1,number:!1,range:!1,search:!1,time:!1,url:!1,week:!1},slimDOMOptions:{script:!0,comment:!0,headFavicon:!0,headWhitespace:!0,headMetaDescKeywords:!0,headMetaSocial:!0,headMetaRobots:!0,headMetaHttpEquiv:!0,headMetaAuthorship:!0,headMetaVerification:!0}}},862:function(t,e,r){var n=r(585),o=r(144);function i(t,e){var r=new Error(t);return r.code=e||"ENOTFOUND",r}t.exports=function(t,e,r,s,a,l,u){var c;if(!(c=l?l():function(){var t,e,r=[function(){return new XMLHttpRequest},function(){return new ActiveXObject("Msxml2.XMLHTTP")},function(){return new ActiveXObject("Msxml3.XMLHTTP")},function(){return new ActiveXObject("Microsoft.XMLHTTP")}],n=r.length;for(e=0;e<n;e++)try{t=r[e]();break}catch(t){}return t}()))return a(new Error("No way to send a request"));try{try{var h=function(){try{if(h&&4===c.readyState){h=void 0;var t=n.jsonParse(c.responseText);if((l=c)&&l.status&&200===l.status){var e={"Rollbar-Replay-Enabled":c.getResponseHeader("Rollbar-Replay-Enabled"),"Rollbar-Replay-RateLimit-Remaining":c.getResponseHeader("Rollbar-Replay-RateLimit-Remaining"),"Rollbar-Replay-RateLimit-Reset":c.getResponseHeader("Rollbar-Replay-RateLimit-Reset")};return void a(t.error,t.value,e)}if(function(t){return t&&n.isType(t.status,"number")&&t.status>=400&&t.status<600}(c)){if(403===c.status){var r=t.value&&t.value.message;o.error(r)}a(new Error(String(c.status)))}else{a(i("XHR response had no status code (likely connection failure)"))}}}catch(t){var s;s=t&&t.stack?t:new Error(t),a(s)}var l};c.open(r,e,!0),c.setRequestHeader&&(c.setRequestHeader("Content-Type","application/json"),c.setRequestHeader("X-Rollbar-Access-Token",t)),n.isFiniteNumber(u)&&(c.timeout=u),c.onreadystatechange=h,c.send(s)}catch(t){if("undefined"!=typeof XDomainRequest){if(!window||!window.location)return a(new Error("No window available during request, unknown environment"));"http:"===window.location.href.substring(0,5)&&"https"===e.substring(0,5)&&(e="http"+e.substring(5));var p=new XDomainRequest;p.onprogress=function(){},p.ontimeout=function(){a(i("Request timed out","ETIMEDOUT"))},p.onerror=function(){a(new Error("Error during request"))},p.onload=function(){var t=n.jsonParse(p.responseText);a(t.error,t.value)},p.open(r,e,!0),p.send(s)}else a(new Error("Cannot find a method to transport a request"))}}catch(t){a(t)}}},918:function(t,e,r){"use strict";r.r(e),r.d(e,{default:function(){return Mu}});var n,o=Object.defineProperty,i=(t,e,r)=>((t,e,r)=>e in t?o(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r)(t,"symbol"!=typeof e?e+"":e,r),s=Object.defineProperty,a=(t,e,r)=>((t,e,r)=>e in t?s(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r)(t,"symbol"!=typeof e?e+"":e,r),l=(t=>(t[t.Document=0]="Document",t[t.DocumentType=1]="DocumentType",t[t.Element=2]="Element",t[t.Text=3]="Text",t[t.CDATA=4]="CDATA",t[t.Comment=5]="Comment",t))(l||{});const u={Node:["childNodes","parentNode","parentElement","textContent"],ShadowRoot:["host","styleSheets"],Element:["shadowRoot","querySelector","querySelectorAll"],MutationObserver:[]},c={Node:["contains","getRootNode"],ShadowRoot:["getSelection"],Element:[],MutationObserver:["constructor"]},h={};function p(t){if(h[t])return h[t];const e=globalThis[t],r=e.prototype,n=t in u?u[t]:void 0,o=Boolean(n&&n.every((t=>{var e,n;return Boolean(null==(n=null==(e=Object.getOwnPropertyDescriptor(r,t))?void 0:e.get)?void 0:n.toString().includes("[native code]"))}))),i=t in c?c[t]:void 0,s=Boolean(i&&i.every((t=>{var e;return"function"==typeof r[t]&&(null==(e=r[t])?void 0:e.toString().includes("[native code]"))})));if(o&&s&&!globalThis.Zone)return h[t]=e.prototype,e.prototype;try{const n=document.createElement("iframe");document.body.appendChild(n);const o=n.contentWindow;if(!o)return e.prototype;const i=o[t].prototype;return document.body.removeChild(n),i?h[t]=i:r}catch{return r}}const f={};function d(t,e,r){var n;const o=`${t}.${String(r)}`;if(f[o])return f[o].call(e);const i=p(t),s=null==(n=Object.getOwnPropertyDescriptor(i,r))?void 0:n.get;return s?(f[o]=s,s.call(e)):e[r]}const m={};function y(t,e,r){const n=`${t}.${String(r)}`;if(m[n])return m[n].bind(e);const o=p(t)[r];return"function"!=typeof o?e[r]:(m[n]=o,o.bind(e))}const g={childNodes:function(t){return d("Node",t,"childNodes")},parentNode:function(t){return d("Node",t,"parentNode")},parentElement:function(t){return d("Node",t,"parentElement")},textContent:function(t){return d("Node",t,"textContent")},contains:function(t,e){return y("Node",t,"contains")(e)},getRootNode:function(t){return y("Node",t,"getRootNode")()},host:function(t){return t&&"host"in t?d("ShadowRoot",t,"host"):null},styleSheets:function(t){return t.styleSheets},shadowRoot:function(t){return t&&"shadowRoot"in t?d("Element",t,"shadowRoot"):null},querySelector:function(t,e){return d("Element",t,"querySelector")(e)},querySelectorAll:function(t,e){return d("Element",t,"querySelectorAll")(e)},mutationObserver:function(){return p("MutationObserver").constructor}};function v(t){return t.nodeType===t.ELEMENT_NODE}function b(t){const e=t&&"host"in t&&"mode"in t&&g.host(t)||null;return Boolean(e&&"shadowRoot"in e&&g.shadowRoot(e)===t)}function w(t){return"[object ShadowRoot]"===Object.prototype.toString.call(t)}function S(t){try{const r=t.rules||t.cssRules;if(!r)return null;let n=t.href;!n&&t.ownerNode&&t.ownerNode.ownerDocument&&(n=t.ownerNode.ownerDocument.location.href);const o=Array.from(r,(t=>x(t,n))).join("");return(e=o).includes(" background-clip: text;")&&!e.includes(" -webkit-background-clip: text;")&&(e=e.replace(/\sbackground-clip:\s*text;/g," -webkit-background-clip: text; background-clip: text;")),e}catch(t){return null}var e}function x(t,e){if(function(t){return"styleSheet"in t}(t)){let e;try{e=S(t.styleSheet)||function(t){const{cssText:e}=t;if(e.split('"').length<3)return e;const r=["@import",`url(${JSON.stringify(t.href)})`];return""===t.layerName?r.push("layer"):t.layerName&&r.push(`layer(${t.layerName})`),t.supportsText&&r.push(`supports(${t.supportsText})`),t.media.length&&r.push(t.media.mediaText),r.join(" ")+";"}(t)}catch(r){e=t.cssText}return t.styleSheet.href?L(e,t.styleSheet.href):e}{let r=t.cssText;return function(t){return"selectorText"in t}(t)&&t.selectorText.includes(":")&&(r=function(t){const e=/(\[(?:[\w-]+)[^\\])(:(?:[\w-]+)\])/gm;return t.replace(e,"$1\\$2")}(r)),e?L(r,e):r}}class k{constructor(){a(this,"idNodeMap",new Map),a(this,"nodeMetaMap",new WeakMap)}getId(t){var e;if(!t)return-1;return(null==(e=this.getMeta(t))?void 0:e.id)??-1}getNode(t){return this.idNodeMap.get(t)||null}getIds(){return Array.from(this.idNodeMap.keys())}getMeta(t){return this.nodeMetaMap.get(t)||null}removeNodeFromMap(t){const e=this.getId(t);this.idNodeMap.delete(e),t.childNodes&&t.childNodes.forEach((t=>this.removeNodeFromMap(t)))}has(t){return this.idNodeMap.has(t)}hasNode(t){return this.nodeMetaMap.has(t)}add(t,e){const r=e.id;this.idNodeMap.set(r,t),this.nodeMetaMap.set(t,e)}replace(t,e){const r=this.getNode(t);if(r){const t=this.nodeMetaMap.get(r);t&&this.nodeMetaMap.set(e,t)}this.idNodeMap.set(t,e)}reset(){this.idNodeMap=new Map,this.nodeMetaMap=new WeakMap}}function C({element:t,maskInputOptions:e,tagName:r,type:n,value:o,maskInputFn:i}){let s=o||"";const a=n&&I(n);return(e[r.toLowerCase()]||a&&e[a])&&(s=i?i(s,t):"*".repeat(s.length)),s}function I(t){return t.toLowerCase()}const O="__rrweb_original__";function E(t){const e=t.type;return t.hasAttribute("data-rr-is-password")?"password":e?I(e):null}function R(t,e){let r;try{r=new URL(t,e??window.location.href)}catch(t){return null}const n=r.pathname.match(/\.([0-9a-z]+)(?:$)/i);return(null==n?void 0:n[1])??null}const A=/url\((?:(')([^']*)'|(")(.*?)"|([^)]*))\)/gm,M=/^(?:[a-z+]+:)?\/\//i,_=/^www\..*/i,T=/^(data:)([^,]*),(.*)/i;function L(t,e){return(t||"").replace(A,((t,r,n,o,i,s)=>{const a=n||i||s,l=r||o||"";if(!a)return t;if(M.test(a)||_.test(a))return`url(${l}${a}${l})`;if(T.test(a))return`url(${l}${a}${l})`;if("/"===a[0])return`url(${l}${function(t){let e="";return e=t.indexOf("//")>-1?t.split("/").slice(0,3).join("/"):t.split("/")[0],e=e.split("?")[0],e}(e)+a}${l})`;const u=e.split("/"),c=a.split("/");u.pop();for(const t of c)"."!==t&&(".."===t?u.pop():u.push(t));return`url(${l}${u.join("/")}${l})`}))}function N(t){return t.replace(/(\/\*[^*]*\*\/)|[\s;]/g,"")}function P(t,e){return function(t,e){const r=Array.from(e.childNodes),n=[];if(r.length>1&&t&&"string"==typeof t){const e=N(t);for(let o=1;o<r.length;o++)if(r[o].textContent&&"string"==typeof r[o].textContent){const i=N(r[o].textContent);for(let r=3;r<i.length;r++){const o=i.substring(0,r);if(2===e.split(o).length){const r=e.indexOf(o);for(let e=r;e<t.length;e++)if(N(t.substring(0,e)).length===r){n.push(t.substring(0,e)),t=t.substring(e);break}break}}}}return n.push(t),n}(t,e).join("/* rr_split */")}let j=1;const D=new RegExp("[^a-z0-9-_:]");function F(){return j++}let U,B;const W=/^[^ \t\n\r\u000c]+/,z=/^[, \t\n\r\u000c]+/;const G=new WeakMap;function V(t,e){return e&&""!==e.trim()?J(t,e):e}function H(t){return Boolean("svg"===t.tagName||t.ownerSVGElement)}function J(t,e){let r=G.get(t);if(r||(r=t.createElement("a"),G.set(t,r)),e){if(e.startsWith("blob:")||e.startsWith("data:"))return e}else e="";return r.setAttribute("href",e),r.href}function q(t,e,r,n){return n?"src"===r||"href"===r&&("use"!==e||"#"!==n[0])||"xlink:href"===r&&"#"!==n[0]?V(t,n):"background"!==r||"table"!==e&&"td"!==e&&"th"!==e?"srcset"===r?function(t,e){if(""===e.trim())return e;let r=0;function n(t){let n;const o=t.exec(e.substring(r));return o?(n=o[0],r+=n.length,n):""}const o=[];for(;n(z),!(r>=e.length);){let i=n(W);if(","===i.slice(-1))i=V(t,i.substring(0,i.length-1)),o.push(i);else{let n="";i=V(t,i);let s=!1;for(;;){const t=e.charAt(r);if(""===t){o.push((i+n).trim());break}if(s)")"===t&&(s=!1);else{if(","===t){r+=1,o.push((i+n).trim());break}"("===t&&(s=!0)}n+=t,r+=1}}}return o.join(", ")}(t,n):"style"===r?L(n,J(t)):"object"===e&&"data"===r?V(t,n):n:V(t,n):n}function Z(t,e,r){return("video"===t||"audio"===t)&&"autoplay"===e}function Y(t,e,r){if(!t)return!1;if(t.nodeType!==t.ELEMENT_NODE)return!!r&&Y(g.parentNode(t),e,r);for(let r=t.classList.length;r--;){const n=t.classList[r];if(e.test(n))return!0}return!!r&&Y(g.parentNode(t),e,r)}function X(t,e,r,n){let o;if(v(t)){if(o=t,!g.childNodes(o).length)return!1}else{if(null===g.parentElement(t))return!1;o=g.parentElement(t)}try{if("string"==typeof e){if(n){if(o.closest(`.${e}`))return!0}else if(o.classList.contains(e))return!0}else if(Y(o,e,n))return!0;if(r)if(n){if(o.closest(r))return!0}else if(o.matches(r))return!0}catch(t){}return!1}function $(t,e){const{doc:r,mirror:n,blockClass:o,blockSelector:i,needsMask:s,inlineStylesheet:a,maskInputOptions:u={},maskTextFn:c,maskInputFn:h,dataURLOptions:p={},inlineImages:f,recordCanvas:d,keepIframeSrcFn:m,newlyAddedElement:y=!1,cssCaptured:v=!1}=e,b=function(t,e){if(!e.hasNode(t))return;const r=e.getId(t);return 1===r?void 0:r}(r,n);switch(t.nodeType){case t.DOCUMENT_NODE:return"CSS1Compat"!==t.compatMode?{type:l.Document,childNodes:[],compatMode:t.compatMode}:{type:l.Document,childNodes:[]};case t.DOCUMENT_TYPE_NODE:return{type:l.DocumentType,name:t.name,publicId:t.publicId,systemId:t.systemId,rootId:b};case t.ELEMENT_NODE:return function(t,e){const{doc:r,blockClass:n,blockSelector:o,inlineStylesheet:i,maskInputOptions:s={},maskInputFn:a,dataURLOptions:u={},inlineImages:c,recordCanvas:h,keepIframeSrcFn:p,newlyAddedElement:f=!1,rootId:d}=e,m=function(t,e,r){try{if("string"==typeof e){if(t.classList.contains(e))return!0}else for(let r=t.classList.length;r--;){const n=t.classList[r];if(e.test(n))return!0}if(r)return t.matches(r)}catch(t){}return!1}(t,n,o),y=function(t){if(t instanceof HTMLFormElement)return"form";const e=I(t.tagName);return D.test(e)?"div":e}(t);let g={};const v=t.attributes.length;for(let e=0;e<v;e++){const n=t.attributes[e];Z(y,n.name,n.value)||(g[n.name]=q(r,y,I(n.name),n.value))}if("link"===y&&i){const e=Array.from(r.styleSheets).find((e=>e.href===t.href));let n=null;e&&(n=S(e)),n&&(delete g.rel,delete g.href,g._cssText=n)}if("style"===y&&t.sheet){let e=S(t.sheet);e&&(t.childNodes.length>1&&(e=P(e,t)),g._cssText=e)}if("input"===y||"textarea"===y||"select"===y){const e=t.value,r=t.checked;"radio"!==g.type&&"checkbox"!==g.type&&"submit"!==g.type&&"button"!==g.type&&e?g.value=C({element:t,type:E(t),tagName:y,value:e,maskInputOptions:s,maskInputFn:a}):r&&(g.checked=r)}"option"===y&&(t.selected&&!s.select?g.selected=!0:delete g.selected);"dialog"===y&&t.open&&(g.rr_open_mode=t.matches("dialog:modal")?"modal":"non-modal");if("canvas"===y&&h)if("2d"===t.__context)(function(t){const e=t.getContext("2d");if(!e)return!0;for(let r=0;r<t.width;r+=50)for(let n=0;n<t.height;n+=50){const o=e.getImageData,i=O in o?o[O]:o;if(new Uint32Array(i.call(e,r,n,Math.min(50,t.width-r),Math.min(50,t.height-n)).data.buffer).some((t=>0!==t)))return!1}return!0})(t)||(g.rr_dataURL=t.toDataURL(u.type,u.quality));else if(!("__context"in t)){const e=t.toDataURL(u.type,u.quality),n=r.createElement("canvas");n.width=t.width,n.height=t.height;e!==n.toDataURL(u.type,u.quality)&&(g.rr_dataURL=e)}if("img"===y&&c){U||(U=r.createElement("canvas"),B=U.getContext("2d"));const e=t,n=e.currentSrc||e.getAttribute("src")||"<unknown-src>",o=e.crossOrigin,i=()=>{e.removeEventListener("load",i);try{U.width=e.naturalWidth,U.height=e.naturalHeight,B.drawImage(e,0,0),g.rr_dataURL=U.toDataURL(u.type,u.quality)}catch(t){if("anonymous"!==e.crossOrigin)return e.crossOrigin="anonymous",void(e.complete&&0!==e.naturalWidth?i():e.addEventListener("load",i));console.warn(`Cannot inline img src=${n}! Error: ${t}`)}"anonymous"===e.crossOrigin&&(o?g.crossOrigin=o:e.removeAttribute("crossorigin"))};e.complete&&0!==e.naturalWidth?i():e.addEventListener("load",i)}if("audio"===y||"video"===y){const e=g;e.rr_mediaState=t.paused?"paused":"played",e.rr_mediaCurrentTime=t.currentTime,e.rr_mediaPlaybackRate=t.playbackRate,e.rr_mediaMuted=t.muted,e.rr_mediaLoop=t.loop,e.rr_mediaVolume=t.volume}f||(t.scrollLeft&&(g.rr_scrollLeft=t.scrollLeft),t.scrollTop&&(g.rr_scrollTop=t.scrollTop));if(m){const{width:e,height:r}=t.getBoundingClientRect();g={class:g.class,rr_width:`${e}px`,rr_height:`${r}px`}}"iframe"!==y||p(g.src)||(t.contentDocument||(g.rr_src=g.src),delete g.src);let b;try{customElements.get(y)&&(b=!0)}catch(t){}return{type:l.Element,tagName:y,attributes:g,childNodes:[],isSVG:H(t)||void 0,needBlock:m,rootId:d,isCustom:b}}(t,{doc:r,blockClass:o,blockSelector:i,inlineStylesheet:a,maskInputOptions:u,maskInputFn:h,dataURLOptions:p,inlineImages:f,recordCanvas:d,keepIframeSrcFn:m,newlyAddedElement:y,rootId:b});case t.TEXT_NODE:return function(t,e){const{needsMask:r,maskTextFn:n,rootId:o,cssCaptured:i}=e,s=g.parentNode(t),a=s&&s.tagName;let u="";const c="STYLE"===a||void 0,h="SCRIPT"===a||void 0;h?u="SCRIPT_PLACEHOLDER":i||(u=g.textContent(t),c&&u&&(u=L(u,J(e.doc))));!c&&!h&&u&&r&&(u=n?n(u,g.parentElement(t)):u.replace(/[\S]/g,"*"));return{type:l.Text,textContent:u||"",rootId:o}}(t,{doc:r,needsMask:s,maskTextFn:c,rootId:b,cssCaptured:v});case t.CDATA_SECTION_NODE:return{type:l.CDATA,textContent:"",rootId:b};case t.COMMENT_NODE:return{type:l.Comment,textContent:g.textContent(t)||"",rootId:b};default:return!1}}function K(t){return null==t?"":t.toLowerCase()}function Q(t,e){const{doc:r,mirror:n,blockClass:o,blockSelector:i,maskTextClass:s,maskTextSelector:a,skipChild:u=!1,inlineStylesheet:c=!0,maskInputOptions:h={},maskTextFn:p,maskInputFn:f,slimDOMOptions:d,dataURLOptions:m={},inlineImages:y=!1,recordCanvas:S=!1,onSerialize:x,onIframeLoad:k,iframeLoadTimeout:C=5e3,onStylesheetLoad:I,stylesheetLoadTimeout:O=5e3,keepIframeSrcFn:E=()=>!1,newlyAddedElement:A=!1,cssCaptured:M=!1}=e;let{needsMask:_}=e,{preserveWhiteSpace:T=!0}=e;if(!_){_=X(t,s,a,void 0===_)}const L=$(t,{doc:r,mirror:n,blockClass:o,blockSelector:i,needsMask:_,inlineStylesheet:c,maskInputOptions:h,maskTextFn:p,maskInputFn:f,dataURLOptions:m,inlineImages:y,recordCanvas:S,keepIframeSrcFn:E,newlyAddedElement:A,cssCaptured:M});if(!L)return console.warn(t,"not serialized"),null;let N;N=n.hasNode(t)?n.getId(t):function(t,e){if(e.comment&&t.type===l.Comment)return!0;if(t.type===l.Element){if(e.script&&("script"===t.tagName||"link"===t.tagName&&("preload"===t.attributes.rel||"modulepreload"===t.attributes.rel)&&"script"===t.attributes.as||"link"===t.tagName&&"prefetch"===t.attributes.rel&&"string"==typeof t.attributes.href&&"js"===R(t.attributes.href)))return!0;if(e.headFavicon&&("link"===t.tagName&&"shortcut icon"===t.attributes.rel||"meta"===t.tagName&&(K(t.attributes.name).match(/^msapplication-tile(image|color)$/)||"application-name"===K(t.attributes.name)||"icon"===K(t.attributes.rel)||"apple-touch-icon"===K(t.attributes.rel)||"shortcut icon"===K(t.attributes.rel))))return!0;if("meta"===t.tagName){if(e.headMetaDescKeywords&&K(t.attributes.name).match(/^description|keywords$/))return!0;if(e.headMetaSocial&&(K(t.attributes.property).match(/^(og|twitter|fb):/)||K(t.attributes.name).match(/^(og|twitter):/)||"pinterest"===K(t.attributes.name)))return!0;if(e.headMetaRobots&&("robots"===K(t.attributes.name)||"googlebot"===K(t.attributes.name)||"bingbot"===K(t.attributes.name)))return!0;if(e.headMetaHttpEquiv&&void 0!==t.attributes["http-equiv"])return!0;if(e.headMetaAuthorship&&("author"===K(t.attributes.name)||"generator"===K(t.attributes.name)||"framework"===K(t.attributes.name)||"publisher"===K(t.attributes.name)||"progid"===K(t.attributes.name)||K(t.attributes.property).match(/^article:/)||K(t.attributes.property).match(/^product:/)))return!0;if(e.headMetaVerification&&("google-site-verification"===K(t.attributes.name)||"yandex-verification"===K(t.attributes.name)||"csrf-token"===K(t.attributes.name)||"p:domain_verify"===K(t.attributes.name)||"verify-v1"===K(t.attributes.name)||"verification"===K(t.attributes.name)||"shopify-checkout-api-token"===K(t.attributes.name)))return!0}}return!1}(L,d)||!T&&L.type===l.Text&&!L.textContent.replace(/^\s+|\s+$/gm,"").length?-2:F();const P=Object.assign(L,{id:N});if(n.add(t,P),-2===N)return null;x&&x(t);let j=!u;if(P.type===l.Element){j=j&&!P.needBlock,delete P.needBlock;const e=g.shadowRoot(t);e&&w(e)&&(P.isShadowHost=!0)}if((P.type===l.Document||P.type===l.Element)&&j){d.headWhitespace&&P.type===l.Element&&"head"===P.tagName&&(T=!1);const e={doc:r,mirror:n,blockClass:o,blockSelector:i,needsMask:_,maskTextClass:s,maskTextSelector:a,skipChild:u,inlineStylesheet:c,maskInputOptions:h,maskTextFn:p,maskInputFn:f,slimDOMOptions:d,dataURLOptions:m,inlineImages:y,recordCanvas:S,preserveWhiteSpace:T,onSerialize:x,onIframeLoad:k,iframeLoadTimeout:C,onStylesheetLoad:I,stylesheetLoadTimeout:O,keepIframeSrcFn:E,cssCaptured:!1};if(P.type===l.Element&&"textarea"===P.tagName&&void 0!==P.attributes.value);else{P.type===l.Element&&void 0!==P.attributes._cssText&&"string"==typeof P.attributes._cssText&&(e.cssCaptured=!0);for(const r of Array.from(g.childNodes(t))){const t=Q(r,e);t&&P.childNodes.push(t)}}let b=null;if(v(t)&&(b=g.shadowRoot(t)))for(const t of Array.from(g.childNodes(b))){const r=Q(t,e);r&&(w(b)&&(r.isShadow=!0),P.childNodes.push(r))}}const D=g.parentNode(t);return D&&b(D)&&w(D)&&(P.isShadow=!0),P.type===l.Element&&"iframe"===P.tagName&&function(t,e,r){const n=t.contentWindow;if(!n)return;let o,i=!1;try{o=n.document.readyState}catch(t){return}if("complete"!==o){const n=setTimeout((()=>{i||(e(),i=!0)}),r);return void t.addEventListener("load",(()=>{clearTimeout(n),i=!0,e()}))}const s="about:blank";if(n.location.href!==s||t.src===s||""===t.src)return setTimeout(e,0),t.addEventListener("load",e);t.addEventListener("load",e)}(t,(()=>{const e=t.contentDocument;if(e&&k){const r=Q(e,{doc:e,mirror:n,blockClass:o,blockSelector:i,needsMask:_,maskTextClass:s,maskTextSelector:a,skipChild:!1,inlineStylesheet:c,maskInputOptions:h,maskTextFn:p,maskInputFn:f,slimDOMOptions:d,dataURLOptions:m,inlineImages:y,recordCanvas:S,preserveWhiteSpace:T,onSerialize:x,onIframeLoad:k,iframeLoadTimeout:C,onStylesheetLoad:I,stylesheetLoadTimeout:O,keepIframeSrcFn:E});r&&k(t,r)}}),C),P.type===l.Element&&"link"===P.tagName&&"string"==typeof P.attributes.rel&&("stylesheet"===P.attributes.rel||"preload"===P.attributes.rel&&"string"==typeof P.attributes.href&&"css"===R(P.attributes.href))&&function(t,e,r){let n,o=!1;try{n=t.sheet}catch(t){return}if(n)return;const i=setTimeout((()=>{o||(e(),o=!0)}),r);t.addEventListener("load",(()=>{clearTimeout(i),o=!0,e()}))}(t,(()=>{if(I){const e=Q(t,{doc:r,mirror:n,blockClass:o,blockSelector:i,needsMask:_,maskTextClass:s,maskTextSelector:a,skipChild:!1,inlineStylesheet:c,maskInputOptions:h,maskTextFn:p,maskInputFn:f,slimDOMOptions:d,dataURLOptions:m,inlineImages:y,recordCanvas:S,preserveWhiteSpace:T,onSerialize:x,onIframeLoad:k,iframeLoadTimeout:C,onStylesheetLoad:I,stylesheetLoadTimeout:O,keepIframeSrcFn:E});e&&I(t,e)}}),O),P}function tt(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}function et(t){if(t.__esModule)return t;var e=t.default;if("function"==typeof e){var r=function t(){return this instanceof t?Reflect.construct(e,arguments,this.constructor):e.apply(this,arguments)};r.prototype=e.prototype}else r={};return Object.defineProperty(r,"__esModule",{value:!0}),Object.keys(t).forEach((function(e){var n=Object.getOwnPropertyDescriptor(t,e);Object.defineProperty(r,e,n.get?n:{enumerable:!0,get:function(){return t[e]}})})),r}var rt={exports:{}},nt=String,ot=function(){return{isColorSupported:!1,reset:nt,bold:nt,dim:nt,italic:nt,underline:nt,inverse:nt,hidden:nt,strikethrough:nt,black:nt,red:nt,green:nt,yellow:nt,blue:nt,magenta:nt,cyan:nt,white:nt,gray:nt,bgBlack:nt,bgRed:nt,bgGreen:nt,bgYellow:nt,bgBlue:nt,bgMagenta:nt,bgCyan:nt,bgWhite:nt}};rt.exports=ot(),rt.exports.createColors=ot;var it=rt.exports;const st=et(Object.freeze(Object.defineProperty({__proto__:null,default:{}},Symbol.toStringTag,{value:"Module"})));let at=it,lt=st,ut=class t extends Error{constructor(e,r,n,o,i,s){super(e),this.name="CssSyntaxError",this.reason=e,i&&(this.file=i),o&&(this.source=o),s&&(this.plugin=s),void 0!==r&&void 0!==n&&("number"==typeof r?(this.line=r,this.column=n):(this.line=r.line,this.column=r.column,this.endLine=n.line,this.endColumn=n.column)),this.setMessage(),Error.captureStackTrace&&Error.captureStackTrace(this,t)}setMessage(){this.message=this.plugin?this.plugin+": ":"",this.message+=this.file?this.file:"<css input>",void 0!==this.line&&(this.message+=":"+this.line+":"+this.column),this.message+=": "+this.reason}showSourceCode(t){if(!this.source)return"";let e=this.source;null==t&&(t=at.isColorSupported),lt&&t&&(e=lt(e));let r,n,o=e.split(/\r?\n/),i=Math.max(this.line-3,0),s=Math.min(this.line+2,o.length),a=String(s).length;if(t){let{bold:t,gray:e,red:o}=at.createColors(!0);r=e=>t(o(e)),n=t=>e(t)}else r=n=t=>t;return o.slice(i,s).map(((t,e)=>{let o=i+1+e,s=" "+(" "+o).slice(-a)+" | ";if(o===this.line){let e=n(s.replace(/\d/g," "))+t.slice(0,this.column-1).replace(/[^\t]/g," ");return r(">")+n(s)+t+"\n "+e+r("^")}return" "+n(s)+t})).join("\n")}toString(){let t=this.showSourceCode();return t&&(t="\n\n"+t+"\n"),this.name+": "+this.message+t}};var ct=ut;ut.default=ut;var ht={};ht.isClean=Symbol("isClean"),ht.my=Symbol("my");const pt={after:"\n",beforeClose:"\n",beforeComment:"\n",beforeDecl:"\n",beforeOpen:" ",beforeRule:"\n",colon:": ",commentLeft:" ",commentRight:" ",emptyBody:"",indent:"    ",semicolon:!1};let ft=class{constructor(t){this.builder=t}atrule(t,e){let r="@"+t.name,n=t.params?this.rawValue(t,"params"):"";if(void 0!==t.raws.afterName?r+=t.raws.afterName:n&&(r+=" "),t.nodes)this.block(t,r+n);else{let o=(t.raws.between||"")+(e?";":"");this.builder(r+n+o,t)}}beforeAfter(t,e){let r;r="decl"===t.type?this.raw(t,null,"beforeDecl"):"comment"===t.type?this.raw(t,null,"beforeComment"):"before"===e?this.raw(t,null,"beforeRule"):this.raw(t,null,"beforeClose");let n=t.parent,o=0;for(;n&&"root"!==n.type;)o+=1,n=n.parent;if(r.includes("\n")){let e=this.raw(t,null,"indent");if(e.length)for(let t=0;t<o;t++)r+=e}return r}block(t,e){let r,n=this.raw(t,"between","beforeOpen");this.builder(e+n+"{",t,"start"),t.nodes&&t.nodes.length?(this.body(t),r=this.raw(t,"after")):r=this.raw(t,"after","emptyBody"),r&&this.builder(r),this.builder("}",t,"end")}body(t){let e=t.nodes.length-1;for(;e>0&&"comment"===t.nodes[e].type;)e-=1;let r=this.raw(t,"semicolon");for(let n=0;n<t.nodes.length;n++){let o=t.nodes[n],i=this.raw(o,"before");i&&this.builder(i),this.stringify(o,e!==n||r)}}comment(t){let e=this.raw(t,"left","commentLeft"),r=this.raw(t,"right","commentRight");this.builder("/*"+e+t.text+r+"*/",t)}decl(t,e){let r=this.raw(t,"between","colon"),n=t.prop+r+this.rawValue(t,"value");t.important&&(n+=t.raws.important||" !important"),e&&(n+=";"),this.builder(n,t)}document(t){this.body(t)}raw(t,e,r){let n;if(r||(r=e),e&&(n=t.raws[e],void 0!==n))return n;let o=t.parent;if("before"===r){if(!o||"root"===o.type&&o.first===t)return"";if(o&&"document"===o.type)return""}if(!o)return pt[r];let i=t.root();if(i.rawCache||(i.rawCache={}),void 0!==i.rawCache[r])return i.rawCache[r];if("before"===r||"after"===r)return this.beforeAfter(t,r);{let o="raw"+((s=r)[0].toUpperCase()+s.slice(1));this[o]?n=this[o](i,t):i.walk((t=>{if(n=t.raws[e],void 0!==n)return!1}))}var s;return void 0===n&&(n=pt[r]),i.rawCache[r]=n,n}rawBeforeClose(t){let e;return t.walk((t=>{if(t.nodes&&t.nodes.length>0&&void 0!==t.raws.after)return e=t.raws.after,e.includes("\n")&&(e=e.replace(/[^\n]+$/,"")),!1})),e&&(e=e.replace(/\S/g,"")),e}rawBeforeComment(t,e){let r;return t.walkComments((t=>{if(void 0!==t.raws.before)return r=t.raws.before,r.includes("\n")&&(r=r.replace(/[^\n]+$/,"")),!1})),void 0===r?r=this.raw(e,null,"beforeDecl"):r&&(r=r.replace(/\S/g,"")),r}rawBeforeDecl(t,e){let r;return t.walkDecls((t=>{if(void 0!==t.raws.before)return r=t.raws.before,r.includes("\n")&&(r=r.replace(/[^\n]+$/,"")),!1})),void 0===r?r=this.raw(e,null,"beforeRule"):r&&(r=r.replace(/\S/g,"")),r}rawBeforeOpen(t){let e;return t.walk((t=>{if("decl"!==t.type&&(e=t.raws.between,void 0!==e))return!1})),e}rawBeforeRule(t){let e;return t.walk((r=>{if(r.nodes&&(r.parent!==t||t.first!==r)&&void 0!==r.raws.before)return e=r.raws.before,e.includes("\n")&&(e=e.replace(/[^\n]+$/,"")),!1})),e&&(e=e.replace(/\S/g,"")),e}rawColon(t){let e;return t.walkDecls((t=>{if(void 0!==t.raws.between)return e=t.raws.between.replace(/[^\s:]/g,""),!1})),e}rawEmptyBody(t){let e;return t.walk((t=>{if(t.nodes&&0===t.nodes.length&&(e=t.raws.after,void 0!==e))return!1})),e}rawIndent(t){if(t.raws.indent)return t.raws.indent;let e;return t.walk((r=>{let n=r.parent;if(n&&n!==t&&n.parent&&n.parent===t&&void 0!==r.raws.before){let t=r.raws.before.split("\n");return e=t[t.length-1],e=e.replace(/\S/g,""),!1}})),e}rawSemicolon(t){let e;return t.walk((t=>{if(t.nodes&&t.nodes.length&&"decl"===t.last.type&&(e=t.raws.semicolon,void 0!==e))return!1})),e}rawValue(t,e){let r=t[e],n=t.raws[e];return n&&n.value===r?n.raw:r}root(t){this.body(t),t.raws.after&&this.builder(t.raws.after)}rule(t){this.block(t,this.rawValue(t,"selector")),t.raws.ownSemicolon&&this.builder(t.raws.ownSemicolon,t,"end")}stringify(t,e){if(!this[t.type])throw new Error("Unknown AST node type "+t.type+". Maybe you need to change PostCSS stringifier.");this[t.type](t,e)}};var dt=ft;ft.default=ft;let mt=dt;function yt(t,e){new mt(e).stringify(t)}var gt=yt;yt.default=yt;let{isClean:vt,my:bt}=ht,wt=ct,St=dt,xt=gt;function kt(t,e){let r=new t.constructor;for(let n in t){if(!Object.prototype.hasOwnProperty.call(t,n))continue;if("proxyCache"===n)continue;let o=t[n],i=typeof o;"parent"===n&&"object"===i?e&&(r[n]=e):"source"===n?r[n]=o:Array.isArray(o)?r[n]=o.map((t=>kt(t,r))):("object"===i&&null!==o&&(o=kt(o)),r[n]=o)}return r}let Ct=class{constructor(t={}){this.raws={},this[vt]=!1,this[bt]=!0;for(let e in t)if("nodes"===e){this.nodes=[];for(let r of t[e])"function"==typeof r.clone?this.append(r.clone()):this.append(r)}else this[e]=t[e]}addToError(t){if(t.postcssNode=this,t.stack&&this.source&&/\n\s{4}at /.test(t.stack)){let e=this.source;t.stack=t.stack.replace(/\n\s{4}at /,`$&${e.input.from}:${e.start.line}:${e.start.column}$&`)}return t}after(t){return this.parent.insertAfter(this,t),this}assign(t={}){for(let e in t)this[e]=t[e];return this}before(t){return this.parent.insertBefore(this,t),this}cleanRaws(t){delete this.raws.before,delete this.raws.after,t||delete this.raws.between}clone(t={}){let e=kt(this);for(let r in t)e[r]=t[r];return e}cloneAfter(t={}){let e=this.clone(t);return this.parent.insertAfter(this,e),e}cloneBefore(t={}){let e=this.clone(t);return this.parent.insertBefore(this,e),e}error(t,e={}){if(this.source){let{end:r,start:n}=this.rangeBy(e);return this.source.input.error(t,{column:n.column,line:n.line},{column:r.column,line:r.line},e)}return new wt(t)}getProxyProcessor(){return{get(t,e){return"proxyOf"===e?t:"root"===e?()=>t.root().toProxy():t[e]},set(t,e,r){return t[e]===r||(t[e]=r,"prop"!==e&&"value"!==e&&"name"!==e&&"params"!==e&&"important"!==e&&"text"!==e||t.markDirty()),!0}}}markDirty(){if(this[vt]){this[vt]=!1;let t=this;for(;t=t.parent;)t[vt]=!1}}next(){if(!this.parent)return;let t=this.parent.index(this);return this.parent.nodes[t+1]}positionBy(t,e){let r=this.source.start;if(t.index)r=this.positionInside(t.index,e);else if(t.word){let n=(e=this.toString()).indexOf(t.word);-1!==n&&(r=this.positionInside(n,e))}return r}positionInside(t,e){let r=e||this.toString(),n=this.source.start.column,o=this.source.start.line;for(let e=0;e<t;e++)"\n"===r[e]?(n=1,o+=1):n+=1;return{column:n,line:o}}prev(){if(!this.parent)return;let t=this.parent.index(this);return this.parent.nodes[t-1]}rangeBy(t){let e={column:this.source.start.column,line:this.source.start.line},r=this.source.end?{column:this.source.end.column+1,line:this.source.end.line}:{column:e.column+1,line:e.line};if(t.word){let n=this.toString(),o=n.indexOf(t.word);-1!==o&&(e=this.positionInside(o,n),r=this.positionInside(o+t.word.length,n))}else t.start?e={column:t.start.column,line:t.start.line}:t.index&&(e=this.positionInside(t.index)),t.end?r={column:t.end.column,line:t.end.line}:"number"==typeof t.endIndex?r=this.positionInside(t.endIndex):t.index&&(r=this.positionInside(t.index+1));return(r.line<e.line||r.line===e.line&&r.column<=e.column)&&(r={column:e.column+1,line:e.line}),{end:r,start:e}}raw(t,e){return(new St).raw(this,t,e)}remove(){return this.parent&&this.parent.removeChild(this),this.parent=void 0,this}replaceWith(...t){if(this.parent){let e=this,r=!1;for(let n of t)n===this?r=!0:r?(this.parent.insertAfter(e,n),e=n):this.parent.insertBefore(e,n);r||this.remove()}return this}root(){let t=this;for(;t.parent&&"document"!==t.parent.type;)t=t.parent;return t}toJSON(t,e){let r={},n=null==e;e=e||new Map;let o=0;for(let t in this){if(!Object.prototype.hasOwnProperty.call(this,t))continue;if("parent"===t||"proxyCache"===t)continue;let n=this[t];if(Array.isArray(n))r[t]=n.map((t=>"object"==typeof t&&t.toJSON?t.toJSON(null,e):t));else if("object"==typeof n&&n.toJSON)r[t]=n.toJSON(null,e);else if("source"===t){let i=e.get(n.input);null==i&&(i=o,e.set(n.input,o),o++),r[t]={end:n.end,inputId:i,start:n.start}}else r[t]=n}return n&&(r.inputs=[...e.keys()].map((t=>t.toJSON()))),r}toProxy(){return this.proxyCache||(this.proxyCache=new Proxy(this,this.getProxyProcessor())),this.proxyCache}toString(t=xt){t.stringify&&(t=t.stringify);let e="";return t(this,(t=>{e+=t})),e}warn(t,e,r){let n={node:this};for(let t in r)n[t]=r[t];return t.warn(e,n)}get proxyOf(){return this}};var It=Ct;Ct.default=Ct;let Ot=It,Et=class extends Ot{constructor(t){t&&void 0!==t.value&&"string"!=typeof t.value&&(t={...t,value:String(t.value)}),super(t),this.type="decl"}get variable(){return this.prop.startsWith("--")||"$"===this.prop[0]}};var Rt=Et;Et.default=Et;var At={nanoid:(t=21)=>{let e="",r=t;for(;r--;)e+="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict"[64*Math.random()|0];return e},customAlphabet:(t,e=21)=>(r=e)=>{let n="",o=r;for(;o--;)n+=t[Math.random()*t.length|0];return n}};let{SourceMapConsumer:Mt,SourceMapGenerator:_t}=st,{existsSync:Tt,readFileSync:Lt}=st,{dirname:Nt,join:Pt}=st;let jt=class{constructor(t,e){if(!1===e.map)return;this.loadAnnotation(t),this.inline=this.startWith(this.annotation,"data:");let r=e.map?e.map.prev:void 0,n=this.loadMap(e.from,r);!this.mapFile&&e.from&&(this.mapFile=e.from),this.mapFile&&(this.root=Nt(this.mapFile)),n&&(this.text=n)}consumer(){return this.consumerCache||(this.consumerCache=new Mt(this.text)),this.consumerCache}decodeInline(t){if(/^data:application\/json;charset=utf-?8,/.test(t)||/^data:application\/json,/.test(t))return decodeURIComponent(t.substr(RegExp.lastMatch.length));if(/^data:application\/json;charset=utf-?8;base64,/.test(t)||/^data:application\/json;base64,/.test(t))return e=t.substr(RegExp.lastMatch.length),Buffer?Buffer.from(e,"base64").toString():window.atob(e);var e;let r=t.match(/data:application\/json;([^,]+),/)[1];throw new Error("Unsupported source map encoding "+r)}getAnnotationURL(t){return t.replace(/^\/\*\s*# sourceMappingURL=/,"").trim()}isMap(t){return"object"==typeof t&&("string"==typeof t.mappings||"string"==typeof t._mappings||Array.isArray(t.sections))}loadAnnotation(t){let e=t.match(/\/\*\s*# sourceMappingURL=/gm);if(!e)return;let r=t.lastIndexOf(e.pop()),n=t.indexOf("*/",r);r>-1&&n>-1&&(this.annotation=this.getAnnotationURL(t.substring(r,n)))}loadFile(t){if(this.root=Nt(t),Tt(t))return this.mapFile=t,Lt(t,"utf-8").toString().trim()}loadMap(t,e){if(!1===e)return!1;if(e){if("string"==typeof e)return e;if("function"!=typeof e){if(e instanceof Mt)return _t.fromSourceMap(e).toString();if(e instanceof _t)return e.toString();if(this.isMap(e))return JSON.stringify(e);throw new Error("Unsupported previous source map format: "+e.toString())}{let r=e(t);if(r){let t=this.loadFile(r);if(!t)throw new Error("Unable to load previous source map: "+r.toString());return t}}}else{if(this.inline)return this.decodeInline(this.annotation);if(this.annotation){let e=this.annotation;return t&&(e=Pt(Nt(t),e)),this.loadFile(e)}}}startWith(t,e){return!!t&&t.substr(0,e.length)===e}withContent(){return!!(this.consumer().sourcesContent&&this.consumer().sourcesContent.length>0)}};var Dt=jt;jt.default=jt;let{SourceMapConsumer:Ft,SourceMapGenerator:Ut}=st,{fileURLToPath:Bt,pathToFileURL:Wt}=st,{isAbsolute:zt,resolve:Gt}=st,{nanoid:Vt}=At,Ht=st,Jt=ct,qt=Dt,Zt=Symbol("fromOffsetCache"),Yt=Boolean(Ft&&Ut),Xt=Boolean(Gt&&zt),$t=class{constructor(t,e={}){if(null==t||"object"==typeof t&&!t.toString)throw new Error(`PostCSS received ${t} instead of CSS string`);if(this.css=t.toString(),"\ufeff"===this.css[0]||"￾"===this.css[0]?(this.hasBOM=!0,this.css=this.css.slice(1)):this.hasBOM=!1,e.from&&(!Xt||/^\w+:\/\//.test(e.from)||zt(e.from)?this.file=e.from:this.file=Gt(e.from)),Xt&&Yt){let t=new qt(this.css,e);if(t.text){this.map=t;let e=t.consumer().file;!this.file&&e&&(this.file=this.mapResolve(e))}}this.file||(this.id="<input css "+Vt(6)+">"),this.map&&(this.map.file=this.from)}error(t,e,r,n={}){let o,i,s;if(e&&"object"==typeof e){let t=e,n=r;if("number"==typeof t.offset){let n=this.fromOffset(t.offset);e=n.line,r=n.col}else e=t.line,r=t.column;if("number"==typeof n.offset){let t=this.fromOffset(n.offset);i=t.line,s=t.col}else i=n.line,s=n.column}else if(!r){let t=this.fromOffset(e);e=t.line,r=t.col}let a=this.origin(e,r,i,s);return o=a?new Jt(t,void 0===a.endLine?a.line:{column:a.column,line:a.line},void 0===a.endLine?a.column:{column:a.endColumn,line:a.endLine},a.source,a.file,n.plugin):new Jt(t,void 0===i?e:{column:r,line:e},void 0===i?r:{column:s,line:i},this.css,this.file,n.plugin),o.input={column:r,endColumn:s,endLine:i,line:e,source:this.css},this.file&&(Wt&&(o.input.url=Wt(this.file).toString()),o.input.file=this.file),o}fromOffset(t){let e,r;if(this[Zt])r=this[Zt];else{let t=this.css.split("\n");r=new Array(t.length);let e=0;for(let n=0,o=t.length;n<o;n++)r[n]=e,e+=t[n].length+1;this[Zt]=r}e=r[r.length-1];let n=0;if(t>=e)n=r.length-1;else{let e,o=r.length-2;for(;n<o;)if(e=n+(o-n>>1),t<r[e])o=e-1;else{if(!(t>=r[e+1])){n=e;break}n=e+1}}return{col:t-r[n]+1,line:n+1}}mapResolve(t){return/^\w+:\/\//.test(t)?t:Gt(this.map.consumer().sourceRoot||this.map.root||".",t)}origin(t,e,r,n){if(!this.map)return!1;let o,i,s=this.map.consumer(),a=s.originalPositionFor({column:e,line:t});if(!a.source)return!1;"number"==typeof r&&(o=s.originalPositionFor({column:n,line:r})),i=zt(a.source)?Wt(a.source):new URL(a.source,this.map.consumer().sourceRoot||Wt(this.map.mapFile));let l={column:a.column,endColumn:o&&o.column,endLine:o&&o.line,line:a.line,url:i.toString()};if("file:"===i.protocol){if(!Bt)throw new Error("file: protocol is not available in this PostCSS build");l.file=Bt(i)}let u=s.sourceContentFor(a.source);return u&&(l.source=u),l}toJSON(){let t={};for(let e of["hasBOM","css","file","id"])null!=this[e]&&(t[e]=this[e]);return this.map&&(t.map={...this.map},t.map.consumerCache&&(t.map.consumerCache=void 0)),t}get from(){return this.file||this.id}};var Kt=$t;$t.default=$t,Ht&&Ht.registerInput&&Ht.registerInput($t);let{SourceMapConsumer:Qt,SourceMapGenerator:te}=st,{dirname:ee,relative:re,resolve:ne,sep:oe}=st,{pathToFileURL:ie}=st,se=Kt,ae=Boolean(Qt&&te),le=Boolean(ee&&ne&&re&&oe);var ue=class{constructor(t,e,r,n){this.stringify=t,this.mapOpts=r.map||{},this.root=e,this.opts=r,this.css=n,this.originalCSS=n,this.usesFileUrls=!this.mapOpts.from&&this.mapOpts.absolute,this.memoizedFileURLs=new Map,this.memoizedPaths=new Map,this.memoizedURLs=new Map}addAnnotation(){let t;t=this.isInline()?"data:application/json;base64,"+this.toBase64(this.map.toString()):"string"==typeof this.mapOpts.annotation?this.mapOpts.annotation:"function"==typeof this.mapOpts.annotation?this.mapOpts.annotation(this.opts.to,this.root):this.outputFile()+".map";let e="\n";this.css.includes("\r\n")&&(e="\r\n"),this.css+=e+"/*# sourceMappingURL="+t+" */"}applyPrevMaps(){for(let t of this.previous()){let e,r=this.toUrl(this.path(t.file)),n=t.root||ee(t.file);!1===this.mapOpts.sourcesContent?(e=new Qt(t.text),e.sourcesContent&&(e.sourcesContent=null)):e=t.consumer(),this.map.applySourceMap(e,r,this.toUrl(this.path(n)))}}clearAnnotation(){if(!1!==this.mapOpts.annotation)if(this.root){let t;for(let e=this.root.nodes.length-1;e>=0;e--)t=this.root.nodes[e],"comment"===t.type&&0===t.text.indexOf("# sourceMappingURL=")&&this.root.removeChild(e)}else this.css&&(this.css=this.css.replace(/\n*?\/\*#[\S\s]*?\*\/$/gm,""))}generate(){if(this.clearAnnotation(),le&&ae&&this.isMap())return this.generateMap();{let t="";return this.stringify(this.root,(e=>{t+=e})),[t]}}generateMap(){if(this.root)this.generateString();else if(1===this.previous().length){let t=this.previous()[0].consumer();t.file=this.outputFile(),this.map=te.fromSourceMap(t,{ignoreInvalidMapping:!0})}else this.map=new te({file:this.outputFile(),ignoreInvalidMapping:!0}),this.map.addMapping({generated:{column:0,line:1},original:{column:0,line:1},source:this.opts.from?this.toUrl(this.path(this.opts.from)):"<no source>"});return this.isSourcesContent()&&this.setSourcesContent(),this.root&&this.previous().length>0&&this.applyPrevMaps(),this.isAnnotation()&&this.addAnnotation(),this.isInline()?[this.css]:[this.css,this.map]}generateString(){this.css="",this.map=new te({file:this.outputFile(),ignoreInvalidMapping:!0});let t,e,r=1,n=1,o="<no source>",i={generated:{column:0,line:0},original:{column:0,line:0},source:""};this.stringify(this.root,((s,a,l)=>{if(this.css+=s,a&&"end"!==l&&(i.generated.line=r,i.generated.column=n-1,a.source&&a.source.start?(i.source=this.sourcePath(a),i.original.line=a.source.start.line,i.original.column=a.source.start.column-1,this.map.addMapping(i)):(i.source=o,i.original.line=1,i.original.column=0,this.map.addMapping(i))),t=s.match(/\n/g),t?(r+=t.length,e=s.lastIndexOf("\n"),n=s.length-e):n+=s.length,a&&"start"!==l){let t=a.parent||{raws:{}};("decl"===a.type||"atrule"===a.type&&!a.nodes)&&a===t.last&&!t.raws.semicolon||(a.source&&a.source.end?(i.source=this.sourcePath(a),i.original.line=a.source.end.line,i.original.column=a.source.end.column-1,i.generated.line=r,i.generated.column=n-2,this.map.addMapping(i)):(i.source=o,i.original.line=1,i.original.column=0,i.generated.line=r,i.generated.column=n-1,this.map.addMapping(i)))}}))}isAnnotation(){return!!this.isInline()||(void 0!==this.mapOpts.annotation?this.mapOpts.annotation:!this.previous().length||this.previous().some((t=>t.annotation)))}isInline(){if(void 0!==this.mapOpts.inline)return this.mapOpts.inline;let t=this.mapOpts.annotation;return(void 0===t||!0===t)&&(!this.previous().length||this.previous().some((t=>t.inline)))}isMap(){return void 0!==this.opts.map?!!this.opts.map:this.previous().length>0}isSourcesContent(){return void 0!==this.mapOpts.sourcesContent?this.mapOpts.sourcesContent:!this.previous().length||this.previous().some((t=>t.withContent()))}outputFile(){return this.opts.to?this.path(this.opts.to):this.opts.from?this.path(this.opts.from):"to.css"}path(t){if(this.mapOpts.absolute)return t;if(60===t.charCodeAt(0))return t;if(/^\w+:\/\//.test(t))return t;let e=this.memoizedPaths.get(t);if(e)return e;let r=this.opts.to?ee(this.opts.to):".";"string"==typeof this.mapOpts.annotation&&(r=ee(ne(r,this.mapOpts.annotation)));let n=re(r,t);return this.memoizedPaths.set(t,n),n}previous(){if(!this.previousMaps)if(this.previousMaps=[],this.root)this.root.walk((t=>{if(t.source&&t.source.input.map){let e=t.source.input.map;this.previousMaps.includes(e)||this.previousMaps.push(e)}}));else{let t=new se(this.originalCSS,this.opts);t.map&&this.previousMaps.push(t.map)}return this.previousMaps}setSourcesContent(){let t={};if(this.root)this.root.walk((e=>{if(e.source){let r=e.source.input.from;if(r&&!t[r]){t[r]=!0;let n=this.usesFileUrls?this.toFileUrl(r):this.toUrl(this.path(r));this.map.setSourceContent(n,e.source.input.css)}}}));else if(this.css){let t=this.opts.from?this.toUrl(this.path(this.opts.from)):"<no source>";this.map.setSourceContent(t,this.css)}}sourcePath(t){return this.mapOpts.from?this.toUrl(this.mapOpts.from):this.usesFileUrls?this.toFileUrl(t.source.input.from):this.toUrl(this.path(t.source.input.from))}toBase64(t){return Buffer?Buffer.from(t).toString("base64"):window.btoa(unescape(encodeURIComponent(t)))}toFileUrl(t){let e=this.memoizedFileURLs.get(t);if(e)return e;if(ie){let e=ie(t).toString();return this.memoizedFileURLs.set(t,e),e}throw new Error("`map.absolute` option is not available in this PostCSS build")}toUrl(t){let e=this.memoizedURLs.get(t);if(e)return e;"\\"===oe&&(t=t.replace(/\\/g,"/"));let r=encodeURI(t).replace(/[#?]/g,encodeURIComponent);return this.memoizedURLs.set(t,r),r}};let ce=It,he=class extends ce{constructor(t){super(t),this.type="comment"}};var pe=he;he.default=he;let fe,de,me,ye,{isClean:ge,my:ve}=ht,be=Rt,we=pe,Se=It;function xe(t){return t.map((t=>(t.nodes&&(t.nodes=xe(t.nodes)),delete t.source,t)))}function ke(t){if(t[ge]=!1,t.proxyOf.nodes)for(let e of t.proxyOf.nodes)ke(e)}let Ce=class t extends Se{append(...t){for(let e of t){let t=this.normalize(e,this.last);for(let e of t)this.proxyOf.nodes.push(e)}return this.markDirty(),this}cleanRaws(t){if(super.cleanRaws(t),this.nodes)for(let e of this.nodes)e.cleanRaws(t)}each(t){if(!this.proxyOf.nodes)return;let e,r,n=this.getIterator();for(;this.indexes[n]<this.proxyOf.nodes.length&&(e=this.indexes[n],r=t(this.proxyOf.nodes[e],e),!1!==r);)this.indexes[n]+=1;return delete this.indexes[n],r}every(t){return this.nodes.every(t)}getIterator(){this.lastEach||(this.lastEach=0),this.indexes||(this.indexes={}),this.lastEach+=1;let t=this.lastEach;return this.indexes[t]=0,t}getProxyProcessor(){return{get(t,e){return"proxyOf"===e?t:t[e]?"each"===e||"string"==typeof e&&e.startsWith("walk")?(...r)=>t[e](...r.map((t=>"function"==typeof t?(e,r)=>t(e.toProxy(),r):t))):"every"===e||"some"===e?r=>t[e](((t,...e)=>r(t.toProxy(),...e))):"root"===e?()=>t.root().toProxy():"nodes"===e?t.nodes.map((t=>t.toProxy())):"first"===e||"last"===e?t[e].toProxy():t[e]:t[e]},set(t,e,r){return t[e]===r||(t[e]=r,"name"!==e&&"params"!==e&&"selector"!==e||t.markDirty()),!0}}}index(t){return"number"==typeof t?t:(t.proxyOf&&(t=t.proxyOf),this.proxyOf.nodes.indexOf(t))}insertAfter(t,e){let r,n=this.index(t),o=this.normalize(e,this.proxyOf.nodes[n]).reverse();n=this.index(t);for(let t of o)this.proxyOf.nodes.splice(n+1,0,t);for(let t in this.indexes)r=this.indexes[t],n<r&&(this.indexes[t]=r+o.length);return this.markDirty(),this}insertBefore(t,e){let r,n=this.index(t),o=0===n&&"prepend",i=this.normalize(e,this.proxyOf.nodes[n],o).reverse();n=this.index(t);for(let t of i)this.proxyOf.nodes.splice(n,0,t);for(let t in this.indexes)r=this.indexes[t],n<=r&&(this.indexes[t]=r+i.length);return this.markDirty(),this}normalize(e,r){if("string"==typeof e)e=xe(fe(e).nodes);else if(void 0===e)e=[];else if(Array.isArray(e)){e=e.slice(0);for(let t of e)t.parent&&t.parent.removeChild(t,"ignore")}else if("root"===e.type&&"document"!==this.type){e=e.nodes.slice(0);for(let t of e)t.parent&&t.parent.removeChild(t,"ignore")}else if(e.type)e=[e];else if(e.prop){if(void 0===e.value)throw new Error("Value field is missed in node creation");"string"!=typeof e.value&&(e.value=String(e.value)),e=[new be(e)]}else if(e.selector)e=[new de(e)];else if(e.name)e=[new me(e)];else{if(!e.text)throw new Error("Unknown node type in node creation");e=[new we(e)]}return e.map((e=>(e[ve]||t.rebuild(e),(e=e.proxyOf).parent&&e.parent.removeChild(e),e[ge]&&ke(e),void 0===e.raws.before&&r&&void 0!==r.raws.before&&(e.raws.before=r.raws.before.replace(/\S/g,"")),e.parent=this.proxyOf,e)))}prepend(...t){t=t.reverse();for(let e of t){let t=this.normalize(e,this.first,"prepend").reverse();for(let e of t)this.proxyOf.nodes.unshift(e);for(let e in this.indexes)this.indexes[e]=this.indexes[e]+t.length}return this.markDirty(),this}push(t){return t.parent=this,this.proxyOf.nodes.push(t),this}removeAll(){for(let t of this.proxyOf.nodes)t.parent=void 0;return this.proxyOf.nodes=[],this.markDirty(),this}removeChild(t){let e;t=this.index(t),this.proxyOf.nodes[t].parent=void 0,this.proxyOf.nodes.splice(t,1);for(let r in this.indexes)e=this.indexes[r],e>=t&&(this.indexes[r]=e-1);return this.markDirty(),this}replaceValues(t,e,r){return r||(r=e,e={}),this.walkDecls((n=>{e.props&&!e.props.includes(n.prop)||e.fast&&!n.value.includes(e.fast)||(n.value=n.value.replace(t,r))})),this.markDirty(),this}some(t){return this.nodes.some(t)}walk(t){return this.each(((e,r)=>{let n;try{n=t(e,r)}catch(t){throw e.addToError(t)}return!1!==n&&e.walk&&(n=e.walk(t)),n}))}walkAtRules(t,e){return e?t instanceof RegExp?this.walk(((r,n)=>{if("atrule"===r.type&&t.test(r.name))return e(r,n)})):this.walk(((r,n)=>{if("atrule"===r.type&&r.name===t)return e(r,n)})):(e=t,this.walk(((t,r)=>{if("atrule"===t.type)return e(t,r)})))}walkComments(t){return this.walk(((e,r)=>{if("comment"===e.type)return t(e,r)}))}walkDecls(t,e){return e?t instanceof RegExp?this.walk(((r,n)=>{if("decl"===r.type&&t.test(r.prop))return e(r,n)})):this.walk(((r,n)=>{if("decl"===r.type&&r.prop===t)return e(r,n)})):(e=t,this.walk(((t,r)=>{if("decl"===t.type)return e(t,r)})))}walkRules(t,e){return e?t instanceof RegExp?this.walk(((r,n)=>{if("rule"===r.type&&t.test(r.selector))return e(r,n)})):this.walk(((r,n)=>{if("rule"===r.type&&r.selector===t)return e(r,n)})):(e=t,this.walk(((t,r)=>{if("rule"===t.type)return e(t,r)})))}get first(){if(this.proxyOf.nodes)return this.proxyOf.nodes[0]}get last(){if(this.proxyOf.nodes)return this.proxyOf.nodes[this.proxyOf.nodes.length-1]}};Ce.registerParse=t=>{fe=t},Ce.registerRule=t=>{de=t},Ce.registerAtRule=t=>{me=t},Ce.registerRoot=t=>{ye=t};var Ie=Ce;Ce.default=Ce,Ce.rebuild=t=>{"atrule"===t.type?Object.setPrototypeOf(t,me.prototype):"rule"===t.type?Object.setPrototypeOf(t,de.prototype):"decl"===t.type?Object.setPrototypeOf(t,be.prototype):"comment"===t.type?Object.setPrototypeOf(t,we.prototype):"root"===t.type&&Object.setPrototypeOf(t,ye.prototype),t[ve]=!0,t.nodes&&t.nodes.forEach((t=>{Ce.rebuild(t)}))};let Oe,Ee,Re=Ie,Ae=class extends Re{constructor(t){super({type:"document",...t}),this.nodes||(this.nodes=[])}toResult(t={}){return new Oe(new Ee,this,t).stringify()}};Ae.registerLazyResult=t=>{Oe=t},Ae.registerProcessor=t=>{Ee=t};var Me=Ae;Ae.default=Ae;let _e=class{constructor(t,e={}){if(this.type="warning",this.text=t,e.node&&e.node.source){let t=e.node.rangeBy(e);this.line=t.start.line,this.column=t.start.column,this.endLine=t.end.line,this.endColumn=t.end.column}for(let t in e)this[t]=e[t]}toString(){return this.node?this.node.error(this.text,{index:this.index,plugin:this.plugin,word:this.word}).message:this.plugin?this.plugin+": "+this.text:this.text}};var Te=_e;_e.default=_e;let Le=Te,Ne=class{constructor(t,e,r){this.processor=t,this.messages=[],this.root=e,this.opts=r,this.css=void 0,this.map=void 0}toString(){return this.css}warn(t,e={}){e.plugin||this.lastPlugin&&this.lastPlugin.postcssPlugin&&(e.plugin=this.lastPlugin.postcssPlugin);let r=new Le(t,e);return this.messages.push(r),r}warnings(){return this.messages.filter((t=>"warning"===t.type))}get content(){return this.css}};var Pe=Ne;Ne.default=Ne;const je="'".charCodeAt(0),De='"'.charCodeAt(0),Fe="\\".charCodeAt(0),Ue="/".charCodeAt(0),Be="\n".charCodeAt(0),We=" ".charCodeAt(0),ze="\f".charCodeAt(0),Ge="\t".charCodeAt(0),Ve="\r".charCodeAt(0),He="[".charCodeAt(0),Je="]".charCodeAt(0),qe="(".charCodeAt(0),Ze=")".charCodeAt(0),Ye="{".charCodeAt(0),Xe="}".charCodeAt(0),$e=";".charCodeAt(0),Ke="*".charCodeAt(0),Qe=":".charCodeAt(0),tr="@".charCodeAt(0),er=/[\t\n\f\r "#'()/;[\\\]{}]/g,rr=/[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g,nr=/.[\r\n"'(/\\]/,or=/[\da-f]/i;let ir=Ie,sr=class extends ir{constructor(t){super(t),this.type="atrule"}append(...t){return this.proxyOf.nodes||(this.nodes=[]),super.append(...t)}prepend(...t){return this.proxyOf.nodes||(this.nodes=[]),super.prepend(...t)}};var ar=sr;sr.default=sr,ir.registerAtRule(sr);let lr,ur,cr=Ie,hr=class extends cr{constructor(t){super(t),this.type="root",this.nodes||(this.nodes=[])}normalize(t,e,r){let n=super.normalize(t);if(e)if("prepend"===r)this.nodes.length>1?e.raws.before=this.nodes[1].raws.before:delete e.raws.before;else if(this.first!==e)for(let t of n)t.raws.before=e.raws.before;return n}removeChild(t,e){let r=this.index(t);return!e&&0===r&&this.nodes.length>1&&(this.nodes[1].raws.before=this.nodes[r].raws.before),super.removeChild(t)}toResult(t={}){return new lr(new ur,this,t).stringify()}};hr.registerLazyResult=t=>{lr=t},hr.registerProcessor=t=>{ur=t};var pr=hr;hr.default=hr,cr.registerRoot(hr);let fr={comma(t){return fr.split(t,[","],!0)},space(t){return fr.split(t,[" ","\n","\t"])},split(t,e,r){let n=[],o="",i=!1,s=0,a=!1,l="",u=!1;for(let r of t)u?u=!1:"\\"===r?u=!0:a?r===l&&(a=!1):'"'===r||"'"===r?(a=!0,l=r):"("===r?s+=1:")"===r?s>0&&(s-=1):0===s&&e.includes(r)&&(i=!0),i?(""!==o&&n.push(o.trim()),o="",i=!1):o+=r;return(r||""!==o)&&n.push(o.trim()),n}};var dr=fr;fr.default=fr;let mr=Ie,yr=dr,gr=class extends mr{constructor(t){super(t),this.type="rule",this.nodes||(this.nodes=[])}get selectors(){return yr.comma(this.selector)}set selectors(t){let e=this.selector?this.selector.match(/,\s*/):null,r=e?e[0]:","+this.raw("between","beforeOpen");this.selector=t.join(r)}};var vr=gr;gr.default=gr,mr.registerRule(gr);let br=Rt,wr=function(t,e={}){let r,n,o,i,s,a,l,u,c,h,p=t.css.valueOf(),f=e.ignoreErrors,d=p.length,m=0,y=[],g=[];function v(e){throw t.error("Unclosed "+e,m)}return{back:function(t){g.push(t)},endOfFile:function(){return 0===g.length&&m>=d},nextToken:function(t){if(g.length)return g.pop();if(m>=d)return;let e=!!t&&t.ignoreUnclosed;switch(r=p.charCodeAt(m),r){case Be:case We:case Ge:case Ve:case ze:n=m;do{n+=1,r=p.charCodeAt(n)}while(r===We||r===Be||r===Ge||r===Ve||r===ze);h=["space",p.slice(m,n)],m=n-1;break;case He:case Je:case Ye:case Xe:case Qe:case $e:case Ze:{let t=String.fromCharCode(r);h=[t,t,m];break}case qe:if(u=y.length?y.pop()[1]:"",c=p.charCodeAt(m+1),"url"===u&&c!==je&&c!==De&&c!==We&&c!==Be&&c!==Ge&&c!==ze&&c!==Ve){n=m;do{if(a=!1,n=p.indexOf(")",n+1),-1===n){if(f||e){n=m;break}v("bracket")}for(l=n;p.charCodeAt(l-1)===Fe;)l-=1,a=!a}while(a);h=["brackets",p.slice(m,n+1),m,n],m=n}else n=p.indexOf(")",m+1),i=p.slice(m,n+1),-1===n||nr.test(i)?h=["(","(",m]:(h=["brackets",i,m,n],m=n);break;case je:case De:o=r===je?"'":'"',n=m;do{if(a=!1,n=p.indexOf(o,n+1),-1===n){if(f||e){n=m+1;break}v("string")}for(l=n;p.charCodeAt(l-1)===Fe;)l-=1,a=!a}while(a);h=["string",p.slice(m,n+1),m,n],m=n;break;case tr:er.lastIndex=m+1,er.test(p),n=0===er.lastIndex?p.length-1:er.lastIndex-2,h=["at-word",p.slice(m,n+1),m,n],m=n;break;case Fe:for(n=m,s=!0;p.charCodeAt(n+1)===Fe;)n+=1,s=!s;if(r=p.charCodeAt(n+1),s&&r!==Ue&&r!==We&&r!==Be&&r!==Ge&&r!==Ve&&r!==ze&&(n+=1,or.test(p.charAt(n)))){for(;or.test(p.charAt(n+1));)n+=1;p.charCodeAt(n+1)===We&&(n+=1)}h=["word",p.slice(m,n+1),m,n],m=n;break;default:r===Ue&&p.charCodeAt(m+1)===Ke?(n=p.indexOf("*/",m+2)+1,0===n&&(f||e?n=p.length:v("comment")),h=["comment",p.slice(m,n+1),m,n],m=n):(rr.lastIndex=m+1,rr.test(p),n=0===rr.lastIndex?p.length-1:rr.lastIndex-2,h=["word",p.slice(m,n+1),m,n],y.push(h),m=n)}return m++,h},position:function(){return m}}},Sr=pe,xr=ar,kr=pr,Cr=vr;const Ir={empty:!0,space:!0};let Or=Ie,Er=class{constructor(t){this.input=t,this.root=new kr,this.current=this.root,this.spaces="",this.semicolon=!1,this.createTokenizer(),this.root.source={input:t,start:{column:1,line:1,offset:0}}}atrule(t){let e,r,n,o=new xr;o.name=t[1].slice(1),""===o.name&&this.unnamedAtrule(o,t),this.init(o,t[2]);let i=!1,s=!1,a=[],l=[];for(;!this.tokenizer.endOfFile();){if(e=(t=this.tokenizer.nextToken())[0],"("===e||"["===e?l.push("("===e?")":"]"):"{"===e&&l.length>0?l.push("}"):e===l[l.length-1]&&l.pop(),0===l.length){if(";"===e){o.source.end=this.getPosition(t[2]),o.source.end.offset++,this.semicolon=!0;break}if("{"===e){s=!0;break}if("}"===e){if(a.length>0){for(n=a.length-1,r=a[n];r&&"space"===r[0];)r=a[--n];r&&(o.source.end=this.getPosition(r[3]||r[2]),o.source.end.offset++)}this.end(t);break}a.push(t)}else a.push(t);if(this.tokenizer.endOfFile()){i=!0;break}}o.raws.between=this.spacesAndCommentsFromEnd(a),a.length?(o.raws.afterName=this.spacesAndCommentsFromStart(a),this.raw(o,"params",a),i&&(t=a[a.length-1],o.source.end=this.getPosition(t[3]||t[2]),o.source.end.offset++,this.spaces=o.raws.between,o.raws.between="")):(o.raws.afterName="",o.params=""),s&&(o.nodes=[],this.current=o)}checkMissedSemicolon(t){let e=this.colon(t);if(!1===e)return;let r,n=0;for(let o=e-1;o>=0&&(r=t[o],"space"===r[0]||(n+=1,2!==n));o--);throw this.input.error("Missed semicolon","word"===r[0]?r[3]+1:r[2])}colon(t){let e,r,n,o=0;for(let[i,s]of t.entries()){if(e=s,r=e[0],"("===r&&(o+=1),")"===r&&(o-=1),0===o&&":"===r){if(n){if("word"===n[0]&&"progid"===n[1])continue;return i}this.doubleColon(e)}n=e}return!1}comment(t){let e=new Sr;this.init(e,t[2]),e.source.end=this.getPosition(t[3]||t[2]),e.source.end.offset++;let r=t[1].slice(2,-2);if(/^\s*$/.test(r))e.text="",e.raws.left=r,e.raws.right="";else{let t=r.match(/^(\s*)([^]*\S)(\s*)$/);e.text=t[2],e.raws.left=t[1],e.raws.right=t[3]}}createTokenizer(){this.tokenizer=wr(this.input)}decl(t,e){let r=new br;this.init(r,t[0][2]);let n,o=t[t.length-1];for(";"===o[0]&&(this.semicolon=!0,t.pop()),r.source.end=this.getPosition(o[3]||o[2]||function(t){for(let e=t.length-1;e>=0;e--){let r=t[e],n=r[3]||r[2];if(n)return n}}(t)),r.source.end.offset++;"word"!==t[0][0];)1===t.length&&this.unknownWord(t),r.raws.before+=t.shift()[1];for(r.source.start=this.getPosition(t[0][2]),r.prop="";t.length;){let e=t[0][0];if(":"===e||"space"===e||"comment"===e)break;r.prop+=t.shift()[1]}for(r.raws.between="";t.length;){if(n=t.shift(),":"===n[0]){r.raws.between+=n[1];break}"word"===n[0]&&/\w/.test(n[1])&&this.unknownWord([n]),r.raws.between+=n[1]}"_"!==r.prop[0]&&"*"!==r.prop[0]||(r.raws.before+=r.prop[0],r.prop=r.prop.slice(1));let i,s=[];for(;t.length&&(i=t[0][0],"space"===i||"comment"===i);)s.push(t.shift());this.precheckMissedSemicolon(t);for(let e=t.length-1;e>=0;e--){if(n=t[e],"!important"===n[1].toLowerCase()){r.important=!0;let n=this.stringFrom(t,e);n=this.spacesFromEnd(t)+n," !important"!==n&&(r.raws.important=n);break}if("important"===n[1].toLowerCase()){let n=t.slice(0),o="";for(let t=e;t>0;t--){let e=n[t][0];if(0===o.trim().indexOf("!")&&"space"!==e)break;o=n.pop()[1]+o}0===o.trim().indexOf("!")&&(r.important=!0,r.raws.important=o,t=n)}if("space"!==n[0]&&"comment"!==n[0])break}t.some((t=>"space"!==t[0]&&"comment"!==t[0]))&&(r.raws.between+=s.map((t=>t[1])).join(""),s=[]),this.raw(r,"value",s.concat(t),e),r.value.includes(":")&&!e&&this.checkMissedSemicolon(t)}doubleColon(t){throw this.input.error("Double colon",{offset:t[2]},{offset:t[2]+t[1].length})}emptyRule(t){let e=new Cr;this.init(e,t[2]),e.selector="",e.raws.between="",this.current=e}end(t){this.current.nodes&&this.current.nodes.length&&(this.current.raws.semicolon=this.semicolon),this.semicolon=!1,this.current.raws.after=(this.current.raws.after||"")+this.spaces,this.spaces="",this.current.parent?(this.current.source.end=this.getPosition(t[2]),this.current.source.end.offset++,this.current=this.current.parent):this.unexpectedClose(t)}endFile(){this.current.parent&&this.unclosedBlock(),this.current.nodes&&this.current.nodes.length&&(this.current.raws.semicolon=this.semicolon),this.current.raws.after=(this.current.raws.after||"")+this.spaces,this.root.source.end=this.getPosition(this.tokenizer.position())}freeSemicolon(t){if(this.spaces+=t[1],this.current.nodes){let t=this.current.nodes[this.current.nodes.length-1];t&&"rule"===t.type&&!t.raws.ownSemicolon&&(t.raws.ownSemicolon=this.spaces,this.spaces="")}}getPosition(t){let e=this.input.fromOffset(t);return{column:e.col,line:e.line,offset:t}}init(t,e){this.current.push(t),t.source={input:this.input,start:this.getPosition(e)},t.raws.before=this.spaces,this.spaces="","comment"!==t.type&&(this.semicolon=!1)}other(t){let e=!1,r=null,n=!1,o=null,i=[],s=t[1].startsWith("--"),a=[],l=t;for(;l;){if(r=l[0],a.push(l),"("===r||"["===r)o||(o=l),i.push("("===r?")":"]");else if(s&&n&&"{"===r)o||(o=l),i.push("}");else if(0===i.length){if(";"===r){if(n)return void this.decl(a,s);break}if("{"===r)return void this.rule(a);if("}"===r){this.tokenizer.back(a.pop()),e=!0;break}":"===r&&(n=!0)}else r===i[i.length-1]&&(i.pop(),0===i.length&&(o=null));l=this.tokenizer.nextToken()}if(this.tokenizer.endOfFile()&&(e=!0),i.length>0&&this.unclosedBracket(o),e&&n){if(!s)for(;a.length&&(l=a[a.length-1][0],"space"===l||"comment"===l);)this.tokenizer.back(a.pop());this.decl(a,s)}else this.unknownWord(a)}parse(){let t;for(;!this.tokenizer.endOfFile();)switch(t=this.tokenizer.nextToken(),t[0]){case"space":this.spaces+=t[1];break;case";":this.freeSemicolon(t);break;case"}":this.end(t);break;case"comment":this.comment(t);break;case"at-word":this.atrule(t);break;case"{":this.emptyRule(t);break;default:this.other(t)}this.endFile()}precheckMissedSemicolon(){}raw(t,e,r,n){let o,i,s,a,l=r.length,u="",c=!0;for(let t=0;t<l;t+=1)o=r[t],i=o[0],"space"!==i||t!==l-1||n?"comment"===i?(a=r[t-1]?r[t-1][0]:"empty",s=r[t+1]?r[t+1][0]:"empty",Ir[a]||Ir[s]||","===u.slice(-1)?c=!1:u+=o[1]):u+=o[1]:c=!1;if(!c){let n=r.reduce(((t,e)=>t+e[1]),"");t.raws[e]={raw:n,value:u}}t[e]=u}rule(t){t.pop();let e=new Cr;this.init(e,t[0][2]),e.raws.between=this.spacesAndCommentsFromEnd(t),this.raw(e,"selector",t),this.current=e}spacesAndCommentsFromEnd(t){let e,r="";for(;t.length&&(e=t[t.length-1][0],"space"===e||"comment"===e);)r=t.pop()[1]+r;return r}spacesAndCommentsFromStart(t){let e,r="";for(;t.length&&(e=t[0][0],"space"===e||"comment"===e);)r+=t.shift()[1];return r}spacesFromEnd(t){let e,r="";for(;t.length&&(e=t[t.length-1][0],"space"===e);)r=t.pop()[1]+r;return r}stringFrom(t,e){let r="";for(let n=e;n<t.length;n++)r+=t[n][1];return t.splice(e,t.length-e),r}unclosedBlock(){let t=this.current.source.start;throw this.input.error("Unclosed block",t.line,t.column)}unclosedBracket(t){throw this.input.error("Unclosed bracket",{offset:t[2]},{offset:t[2]+1})}unexpectedClose(t){throw this.input.error("Unexpected }",{offset:t[2]},{offset:t[2]+1})}unknownWord(t){throw this.input.error("Unknown word",{offset:t[0][2]},{offset:t[0][2]+t[0][1].length})}unnamedAtrule(t,e){throw this.input.error("At-rule without name",{offset:e[2]},{offset:e[2]+e[1].length})}},Rr=Kt;function Ar(t,e){let r=new Rr(t,e),n=new Er(r);try{n.parse()}catch(t){throw t}return n.root}var Mr=Ar;Ar.default=Ar,Or.registerParse(Ar);let{isClean:_r,my:Tr}=ht,Lr=ue,Nr=gt,Pr=Ie,jr=Me,Dr=Pe,Fr=Mr,Ur=pr;const Br={atrule:"AtRule",comment:"Comment",decl:"Declaration",document:"Document",root:"Root",rule:"Rule"},Wr={AtRule:!0,AtRuleExit:!0,Comment:!0,CommentExit:!0,Declaration:!0,DeclarationExit:!0,Document:!0,DocumentExit:!0,Once:!0,OnceExit:!0,postcssPlugin:!0,prepare:!0,Root:!0,RootExit:!0,Rule:!0,RuleExit:!0},zr={Once:!0,postcssPlugin:!0,prepare:!0};function Gr(t){return"object"==typeof t&&"function"==typeof t.then}function Vr(t){let e=!1,r=Br[t.type];return"decl"===t.type?e=t.prop.toLowerCase():"atrule"===t.type&&(e=t.name.toLowerCase()),e&&t.append?[r,r+"-"+e,0,r+"Exit",r+"Exit-"+e]:e?[r,r+"-"+e,r+"Exit",r+"Exit-"+e]:t.append?[r,0,r+"Exit"]:[r,r+"Exit"]}function Hr(t){let e;return e="document"===t.type?["Document",0,"DocumentExit"]:"root"===t.type?["Root",0,"RootExit"]:Vr(t),{eventIndex:0,events:e,iterator:0,node:t,visitorIndex:0,visitors:[]}}function Jr(t){return t[_r]=!1,t.nodes&&t.nodes.forEach((t=>Jr(t))),t}let qr={},Zr=class t{constructor(e,r,n){let o;if(this.stringified=!1,this.processed=!1,"object"!=typeof r||null===r||"root"!==r.type&&"document"!==r.type)if(r instanceof t||r instanceof Dr)o=Jr(r.root),r.map&&(void 0===n.map&&(n.map={}),n.map.inline||(n.map.inline=!1),n.map.prev=r.map);else{let t=Fr;n.syntax&&(t=n.syntax.parse),n.parser&&(t=n.parser),t.parse&&(t=t.parse);try{o=t(r,n)}catch(t){this.processed=!0,this.error=t}o&&!o[Tr]&&Pr.rebuild(o)}else o=Jr(r);this.result=new Dr(e,o,n),this.helpers={...qr,postcss:qr,result:this.result},this.plugins=this.processor.plugins.map((t=>"object"==typeof t&&t.prepare?{...t,...t.prepare(this.result)}:t))}async(){return this.error?Promise.reject(this.error):this.processed?Promise.resolve(this.result):(this.processing||(this.processing=this.runAsync()),this.processing)}catch(t){return this.async().catch(t)}finally(t){return this.async().then(t,t)}getAsyncError(){throw new Error("Use process(css).then(cb) to work with async plugins")}handleError(t,e){let r=this.result.lastPlugin;try{e&&e.addToError(t),this.error=t,"CssSyntaxError"!==t.name||t.plugin?r.postcssVersion:(t.plugin=r.postcssPlugin,t.setMessage())}catch(t){console&&console.error&&console.error(t)}return t}prepareVisitors(){this.listeners={};let t=(t,e,r)=>{this.listeners[e]||(this.listeners[e]=[]),this.listeners[e].push([t,r])};for(let e of this.plugins)if("object"==typeof e)for(let r in e){if(!Wr[r]&&/^[A-Z]/.test(r))throw new Error(`Unknown event ${r} in ${e.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`);if(!zr[r])if("object"==typeof e[r])for(let n in e[r])t(e,"*"===n?r:r+"-"+n.toLowerCase(),e[r][n]);else"function"==typeof e[r]&&t(e,r,e[r])}this.hasListener=Object.keys(this.listeners).length>0}async runAsync(){this.plugin=0;for(let t=0;t<this.plugins.length;t++){let e=this.plugins[t],r=this.runOnRoot(e);if(Gr(r))try{await r}catch(t){throw this.handleError(t)}}if(this.prepareVisitors(),this.hasListener){let t=this.result.root;for(;!t[_r];){t[_r]=!0;let e=[Hr(t)];for(;e.length>0;){let t=this.visitTick(e);if(Gr(t))try{await t}catch(t){let r=e[e.length-1].node;throw this.handleError(t,r)}}}if(this.listeners.OnceExit)for(let[e,r]of this.listeners.OnceExit){this.result.lastPlugin=e;try{if("document"===t.type){let e=t.nodes.map((t=>r(t,this.helpers)));await Promise.all(e)}else await r(t,this.helpers)}catch(t){throw this.handleError(t)}}}return this.processed=!0,this.stringify()}runOnRoot(t){this.result.lastPlugin=t;try{if("object"==typeof t&&t.Once){if("document"===this.result.root.type){let e=this.result.root.nodes.map((e=>t.Once(e,this.helpers)));return Gr(e[0])?Promise.all(e):e}return t.Once(this.result.root,this.helpers)}if("function"==typeof t)return t(this.result.root,this.result)}catch(t){throw this.handleError(t)}}stringify(){if(this.error)throw this.error;if(this.stringified)return this.result;this.stringified=!0,this.sync();let t=this.result.opts,e=Nr;t.syntax&&(e=t.syntax.stringify),t.stringifier&&(e=t.stringifier),e.stringify&&(e=e.stringify);let r=new Lr(e,this.result.root,this.result.opts).generate();return this.result.css=r[0],this.result.map=r[1],this.result}sync(){if(this.error)throw this.error;if(this.processed)return this.result;if(this.processed=!0,this.processing)throw this.getAsyncError();for(let t of this.plugins){if(Gr(this.runOnRoot(t)))throw this.getAsyncError()}if(this.prepareVisitors(),this.hasListener){let t=this.result.root;for(;!t[_r];)t[_r]=!0,this.walkSync(t);if(this.listeners.OnceExit)if("document"===t.type)for(let e of t.nodes)this.visitSync(this.listeners.OnceExit,e);else this.visitSync(this.listeners.OnceExit,t)}return this.result}then(t,e){return this.async().then(t,e)}toString(){return this.css}visitSync(t,e){for(let[r,n]of t){let t;this.result.lastPlugin=r;try{t=n(e,this.helpers)}catch(t){throw this.handleError(t,e.proxyOf)}if("root"!==e.type&&"document"!==e.type&&!e.parent)return!0;if(Gr(t))throw this.getAsyncError()}}visitTick(t){let e=t[t.length-1],{node:r,visitors:n}=e;if("root"!==r.type&&"document"!==r.type&&!r.parent)return void t.pop();if(n.length>0&&e.visitorIndex<n.length){let[t,o]=n[e.visitorIndex];e.visitorIndex+=1,e.visitorIndex===n.length&&(e.visitors=[],e.visitorIndex=0),this.result.lastPlugin=t;try{return o(r.toProxy(),this.helpers)}catch(t){throw this.handleError(t,r)}}if(0!==e.iterator){let n,o=e.iterator;for(;n=r.nodes[r.indexes[o]];)if(r.indexes[o]+=1,!n[_r])return n[_r]=!0,void t.push(Hr(n));e.iterator=0,delete r.indexes[o]}let o=e.events;for(;e.eventIndex<o.length;){let t=o[e.eventIndex];if(e.eventIndex+=1,0===t)return void(r.nodes&&r.nodes.length&&(r[_r]=!0,e.iterator=r.getIterator()));if(this.listeners[t])return void(e.visitors=this.listeners[t])}t.pop()}walkSync(t){t[_r]=!0;let e=Vr(t);for(let r of e)if(0===r)t.nodes&&t.each((t=>{t[_r]||this.walkSync(t)}));else{let e=this.listeners[r];if(e&&this.visitSync(e,t.toProxy()))return}}warnings(){return this.sync().warnings()}get content(){return this.stringify().content}get css(){return this.stringify().css}get map(){return this.stringify().map}get messages(){return this.sync().messages}get opts(){return this.result.opts}get processor(){return this.result.processor}get root(){return this.sync().root}get[Symbol.toStringTag](){return"LazyResult"}};Zr.registerPostcss=t=>{qr=t};var Yr=Zr;Zr.default=Zr,Ur.registerLazyResult(Zr),jr.registerLazyResult(Zr);let Xr=ue,$r=gt,Kr=Mr;const Qr=Pe;let tn=class{constructor(t,e,r){let n;e=e.toString(),this.stringified=!1,this._processor=t,this._css=e,this._opts=r,this._map=void 0;let o=$r;this.result=new Qr(this._processor,n,this._opts),this.result.css=e;let i=this;Object.defineProperty(this.result,"root",{get(){return i.root}});let s=new Xr(o,n,this._opts,e);if(s.isMap()){let[t,e]=s.generate();t&&(this.result.css=t),e&&(this.result.map=e)}else s.clearAnnotation(),this.result.css=s.css}async(){return this.error?Promise.reject(this.error):Promise.resolve(this.result)}catch(t){return this.async().catch(t)}finally(t){return this.async().then(t,t)}sync(){if(this.error)throw this.error;return this.result}then(t,e){return this.async().then(t,e)}toString(){return this._css}warnings(){return[]}get content(){return this.result.css}get css(){return this.result.css}get map(){return this.result.map}get messages(){return[]}get opts(){return this.result.opts}get processor(){return this.result.processor}get root(){if(this._root)return this._root;let t,e=Kr;try{t=e(this._css,this._opts)}catch(t){this.error=t}if(this.error)throw this.error;return this._root=t,t}get[Symbol.toStringTag](){return"NoWorkResult"}};var en=tn;tn.default=tn;let rn=en,nn=Yr,on=Me,sn=pr,an=class{constructor(t=[]){this.version="8.4.38",this.plugins=this.normalize(t)}normalize(t){let e=[];for(let r of t)if(!0===r.postcss?r=r():r.postcss&&(r=r.postcss),"object"==typeof r&&Array.isArray(r.plugins))e=e.concat(r.plugins);else if("object"==typeof r&&r.postcssPlugin)e.push(r);else if("function"==typeof r)e.push(r);else{if("object"!=typeof r||!r.parse&&!r.stringify)throw new Error(r+" is not a PostCSS plugin")}return e}process(t,e={}){return this.plugins.length||e.parser||e.stringifier||e.syntax?new nn(this,t,e):new rn(this,t,e)}use(t){return this.plugins=this.plugins.concat(this.normalize([t])),this}};var ln=an;an.default=an,sn.registerProcessor(an),on.registerProcessor(an);let un=Rt,cn=Dt,hn=pe,pn=ar,fn=Kt,dn=pr,mn=vr;function yn(t,e){if(Array.isArray(t))return t.map((t=>yn(t)));let{inputs:r,...n}=t;if(r){e=[];for(let t of r){let r={...t,__proto__:fn.prototype};r.map&&(r.map={...r.map,__proto__:cn.prototype}),e.push(r)}}if(n.nodes&&(n.nodes=t.nodes.map((t=>yn(t,e)))),n.source){let{inputId:t,...r}=n.source;n.source=r,null!=t&&(n.source.input=e[t])}if("root"===n.type)return new dn(n);if("decl"===n.type)return new un(n);if("rule"===n.type)return new mn(n);if("comment"===n.type)return new hn(n);if("atrule"===n.type)return new pn(n);throw new Error("Unknown node type: "+t.type)}var gn=yn;yn.default=yn;let vn=ct,bn=Rt,wn=Yr,Sn=Ie,xn=ln,kn=gt,Cn=gn,In=Me,On=Te,En=pe,Rn=ar,An=Pe,Mn=Kt,_n=Mr,Tn=dr,Ln=vr,Nn=pr,Pn=It;function jn(...t){return 1===t.length&&Array.isArray(t[0])&&(t=t[0]),new xn(t)}jn.plugin=function(t,e){let r,n=!1;function o(...r){console&&console.warn&&!n&&(n=!0,console.warn(t+": postcss.plugin was deprecated. Migration guide:\nhttps://evilmartians.com/chronicles/postcss-8-plugin-migration"),process.env.LANG&&process.env.LANG.startsWith("cn")&&console.warn(t+": 里面 postcss.plugin 被弃用. 迁移指南:\nhttps://www.w3ctech.com/topic/2226"));let o=e(...r);return o.postcssPlugin=t,o.postcssVersion=(new xn).version,o}return Object.defineProperty(o,"postcss",{get(){return r||(r=o()),r}}),o.process=function(t,e,r){return jn([o(r)]).process(t,e)},o},jn.stringify=kn,jn.parse=_n,jn.fromJSON=Cn,jn.list=Tn,jn.comment=t=>new En(t),jn.atRule=t=>new Rn(t),jn.decl=t=>new bn(t),jn.rule=t=>new Ln(t),jn.root=t=>new Nn(t),jn.document=t=>new In(t),jn.CssSyntaxError=vn,jn.Declaration=bn,jn.Container=Sn,jn.Processor=xn,jn.Document=In,jn.Comment=En,jn.Warning=On,jn.AtRule=Rn,jn.Result=An,jn.Input=Mn,jn.Rule=Ln,jn.Root=Nn,jn.Node=Pn,wn.registerPostcss(jn);var Dn=jn;jn.default=jn;const Fn=tt(Dn);Fn.stringify,Fn.fromJSON,Fn.plugin,Fn.parse,Fn.list,Fn.document,Fn.comment,Fn.atRule,Fn.rule,Fn.decl,Fn.root,Fn.CssSyntaxError,Fn.Declaration,Fn.Container,Fn.Processor,Fn.Document,Fn.Comment,Fn.Warning,Fn.AtRule,Fn.Result,Fn.Input,Fn.Rule,Fn.Root,Fn.Node;var Un=Object.defineProperty,Bn=(t,e,r)=>((t,e,r)=>e in t?Un(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r)(t,"symbol"!=typeof e?e+"":e,r);function Wn(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}function zn(t){if(t.__esModule)return t;var e=t.default;if("function"==typeof e){var r=function t(){return this instanceof t?Reflect.construct(e,arguments,this.constructor):e.apply(this,arguments)};r.prototype=e.prototype}else r={};return Object.defineProperty(r,"__esModule",{value:!0}),Object.keys(t).forEach((function(e){var n=Object.getOwnPropertyDescriptor(t,e);Object.defineProperty(r,e,n.get?n:{enumerable:!0,get:function(){return t[e]}})})),r}var Gn={exports:{}},Vn=String,Hn=function(){return{isColorSupported:!1,reset:Vn,bold:Vn,dim:Vn,italic:Vn,underline:Vn,inverse:Vn,hidden:Vn,strikethrough:Vn,black:Vn,red:Vn,green:Vn,yellow:Vn,blue:Vn,magenta:Vn,cyan:Vn,white:Vn,gray:Vn,bgBlack:Vn,bgRed:Vn,bgGreen:Vn,bgYellow:Vn,bgBlue:Vn,bgMagenta:Vn,bgCyan:Vn,bgWhite:Vn}};Gn.exports=Hn(),Gn.exports.createColors=Hn;var Jn=Gn.exports;const qn=zn(Object.freeze(Object.defineProperty({__proto__:null,default:{}},Symbol.toStringTag,{value:"Module"})));let Zn=Jn,Yn=qn,Xn=class t extends Error{constructor(e,r,n,o,i,s){super(e),this.name="CssSyntaxError",this.reason=e,i&&(this.file=i),o&&(this.source=o),s&&(this.plugin=s),void 0!==r&&void 0!==n&&("number"==typeof r?(this.line=r,this.column=n):(this.line=r.line,this.column=r.column,this.endLine=n.line,this.endColumn=n.column)),this.setMessage(),Error.captureStackTrace&&Error.captureStackTrace(this,t)}setMessage(){this.message=this.plugin?this.plugin+": ":"",this.message+=this.file?this.file:"<css input>",void 0!==this.line&&(this.message+=":"+this.line+":"+this.column),this.message+=": "+this.reason}showSourceCode(t){if(!this.source)return"";let e=this.source;null==t&&(t=Zn.isColorSupported),Yn&&t&&(e=Yn(e));let r,n,o=e.split(/\r?\n/),i=Math.max(this.line-3,0),s=Math.min(this.line+2,o.length),a=String(s).length;if(t){let{bold:t,gray:e,red:o}=Zn.createColors(!0);r=e=>t(o(e)),n=t=>e(t)}else r=n=t=>t;return o.slice(i,s).map(((t,e)=>{let o=i+1+e,s=" "+(" "+o).slice(-a)+" | ";if(o===this.line){let e=n(s.replace(/\d/g," "))+t.slice(0,this.column-1).replace(/[^\t]/g," ");return r(">")+n(s)+t+"\n "+e+r("^")}return" "+n(s)+t})).join("\n")}toString(){let t=this.showSourceCode();return t&&(t="\n\n"+t+"\n"),this.name+": "+this.message+t}};var $n=Xn;Xn.default=Xn;var Kn={};Kn.isClean=Symbol("isClean"),Kn.my=Symbol("my");const Qn={after:"\n",beforeClose:"\n",beforeComment:"\n",beforeDecl:"\n",beforeOpen:" ",beforeRule:"\n",colon:": ",commentLeft:" ",commentRight:" ",emptyBody:"",indent:"    ",semicolon:!1};let to=class{constructor(t){this.builder=t}atrule(t,e){let r="@"+t.name,n=t.params?this.rawValue(t,"params"):"";if(void 0!==t.raws.afterName?r+=t.raws.afterName:n&&(r+=" "),t.nodes)this.block(t,r+n);else{let o=(t.raws.between||"")+(e?";":"");this.builder(r+n+o,t)}}beforeAfter(t,e){let r;r="decl"===t.type?this.raw(t,null,"beforeDecl"):"comment"===t.type?this.raw(t,null,"beforeComment"):"before"===e?this.raw(t,null,"beforeRule"):this.raw(t,null,"beforeClose");let n=t.parent,o=0;for(;n&&"root"!==n.type;)o+=1,n=n.parent;if(r.includes("\n")){let e=this.raw(t,null,"indent");if(e.length)for(let t=0;t<o;t++)r+=e}return r}block(t,e){let r,n=this.raw(t,"between","beforeOpen");this.builder(e+n+"{",t,"start"),t.nodes&&t.nodes.length?(this.body(t),r=this.raw(t,"after")):r=this.raw(t,"after","emptyBody"),r&&this.builder(r),this.builder("}",t,"end")}body(t){let e=t.nodes.length-1;for(;e>0&&"comment"===t.nodes[e].type;)e-=1;let r=this.raw(t,"semicolon");for(let n=0;n<t.nodes.length;n++){let o=t.nodes[n],i=this.raw(o,"before");i&&this.builder(i),this.stringify(o,e!==n||r)}}comment(t){let e=this.raw(t,"left","commentLeft"),r=this.raw(t,"right","commentRight");this.builder("/*"+e+t.text+r+"*/",t)}decl(t,e){let r=this.raw(t,"between","colon"),n=t.prop+r+this.rawValue(t,"value");t.important&&(n+=t.raws.important||" !important"),e&&(n+=";"),this.builder(n,t)}document(t){this.body(t)}raw(t,e,r){let n;if(r||(r=e),e&&(n=t.raws[e],void 0!==n))return n;let o=t.parent;if("before"===r){if(!o||"root"===o.type&&o.first===t)return"";if(o&&"document"===o.type)return""}if(!o)return Qn[r];let i=t.root();if(i.rawCache||(i.rawCache={}),void 0!==i.rawCache[r])return i.rawCache[r];if("before"===r||"after"===r)return this.beforeAfter(t,r);{let o="raw"+((s=r)[0].toUpperCase()+s.slice(1));this[o]?n=this[o](i,t):i.walk((t=>{if(n=t.raws[e],void 0!==n)return!1}))}var s;return void 0===n&&(n=Qn[r]),i.rawCache[r]=n,n}rawBeforeClose(t){let e;return t.walk((t=>{if(t.nodes&&t.nodes.length>0&&void 0!==t.raws.after)return e=t.raws.after,e.includes("\n")&&(e=e.replace(/[^\n]+$/,"")),!1})),e&&(e=e.replace(/\S/g,"")),e}rawBeforeComment(t,e){let r;return t.walkComments((t=>{if(void 0!==t.raws.before)return r=t.raws.before,r.includes("\n")&&(r=r.replace(/[^\n]+$/,"")),!1})),void 0===r?r=this.raw(e,null,"beforeDecl"):r&&(r=r.replace(/\S/g,"")),r}rawBeforeDecl(t,e){let r;return t.walkDecls((t=>{if(void 0!==t.raws.before)return r=t.raws.before,r.includes("\n")&&(r=r.replace(/[^\n]+$/,"")),!1})),void 0===r?r=this.raw(e,null,"beforeRule"):r&&(r=r.replace(/\S/g,"")),r}rawBeforeOpen(t){let e;return t.walk((t=>{if("decl"!==t.type&&(e=t.raws.between,void 0!==e))return!1})),e}rawBeforeRule(t){let e;return t.walk((r=>{if(r.nodes&&(r.parent!==t||t.first!==r)&&void 0!==r.raws.before)return e=r.raws.before,e.includes("\n")&&(e=e.replace(/[^\n]+$/,"")),!1})),e&&(e=e.replace(/\S/g,"")),e}rawColon(t){let e;return t.walkDecls((t=>{if(void 0!==t.raws.between)return e=t.raws.between.replace(/[^\s:]/g,""),!1})),e}rawEmptyBody(t){let e;return t.walk((t=>{if(t.nodes&&0===t.nodes.length&&(e=t.raws.after,void 0!==e))return!1})),e}rawIndent(t){if(t.raws.indent)return t.raws.indent;let e;return t.walk((r=>{let n=r.parent;if(n&&n!==t&&n.parent&&n.parent===t&&void 0!==r.raws.before){let t=r.raws.before.split("\n");return e=t[t.length-1],e=e.replace(/\S/g,""),!1}})),e}rawSemicolon(t){let e;return t.walk((t=>{if(t.nodes&&t.nodes.length&&"decl"===t.last.type&&(e=t.raws.semicolon,void 0!==e))return!1})),e}rawValue(t,e){let r=t[e],n=t.raws[e];return n&&n.value===r?n.raw:r}root(t){this.body(t),t.raws.after&&this.builder(t.raws.after)}rule(t){this.block(t,this.rawValue(t,"selector")),t.raws.ownSemicolon&&this.builder(t.raws.ownSemicolon,t,"end")}stringify(t,e){if(!this[t.type])throw new Error("Unknown AST node type "+t.type+". Maybe you need to change PostCSS stringifier.");this[t.type](t,e)}};var eo=to;to.default=to;let ro=eo;function no(t,e){new ro(e).stringify(t)}var oo=no;no.default=no;let{isClean:io,my:so}=Kn,ao=$n,lo=eo,uo=oo;function co(t,e){let r=new t.constructor;for(let n in t){if(!Object.prototype.hasOwnProperty.call(t,n))continue;if("proxyCache"===n)continue;let o=t[n],i=typeof o;"parent"===n&&"object"===i?e&&(r[n]=e):"source"===n?r[n]=o:Array.isArray(o)?r[n]=o.map((t=>co(t,r))):("object"===i&&null!==o&&(o=co(o)),r[n]=o)}return r}let ho=class{constructor(t={}){this.raws={},this[io]=!1,this[so]=!0;for(let e in t)if("nodes"===e){this.nodes=[];for(let r of t[e])"function"==typeof r.clone?this.append(r.clone()):this.append(r)}else this[e]=t[e]}addToError(t){if(t.postcssNode=this,t.stack&&this.source&&/\n\s{4}at /.test(t.stack)){let e=this.source;t.stack=t.stack.replace(/\n\s{4}at /,`$&${e.input.from}:${e.start.line}:${e.start.column}$&`)}return t}after(t){return this.parent.insertAfter(this,t),this}assign(t={}){for(let e in t)this[e]=t[e];return this}before(t){return this.parent.insertBefore(this,t),this}cleanRaws(t){delete this.raws.before,delete this.raws.after,t||delete this.raws.between}clone(t={}){let e=co(this);for(let r in t)e[r]=t[r];return e}cloneAfter(t={}){let e=this.clone(t);return this.parent.insertAfter(this,e),e}cloneBefore(t={}){let e=this.clone(t);return this.parent.insertBefore(this,e),e}error(t,e={}){if(this.source){let{end:r,start:n}=this.rangeBy(e);return this.source.input.error(t,{column:n.column,line:n.line},{column:r.column,line:r.line},e)}return new ao(t)}getProxyProcessor(){return{get(t,e){return"proxyOf"===e?t:"root"===e?()=>t.root().toProxy():t[e]},set(t,e,r){return t[e]===r||(t[e]=r,"prop"!==e&&"value"!==e&&"name"!==e&&"params"!==e&&"important"!==e&&"text"!==e||t.markDirty()),!0}}}markDirty(){if(this[io]){this[io]=!1;let t=this;for(;t=t.parent;)t[io]=!1}}next(){if(!this.parent)return;let t=this.parent.index(this);return this.parent.nodes[t+1]}positionBy(t,e){let r=this.source.start;if(t.index)r=this.positionInside(t.index,e);else if(t.word){let n=(e=this.toString()).indexOf(t.word);-1!==n&&(r=this.positionInside(n,e))}return r}positionInside(t,e){let r=e||this.toString(),n=this.source.start.column,o=this.source.start.line;for(let e=0;e<t;e++)"\n"===r[e]?(n=1,o+=1):n+=1;return{column:n,line:o}}prev(){if(!this.parent)return;let t=this.parent.index(this);return this.parent.nodes[t-1]}rangeBy(t){let e={column:this.source.start.column,line:this.source.start.line},r=this.source.end?{column:this.source.end.column+1,line:this.source.end.line}:{column:e.column+1,line:e.line};if(t.word){let n=this.toString(),o=n.indexOf(t.word);-1!==o&&(e=this.positionInside(o,n),r=this.positionInside(o+t.word.length,n))}else t.start?e={column:t.start.column,line:t.start.line}:t.index&&(e=this.positionInside(t.index)),t.end?r={column:t.end.column,line:t.end.line}:"number"==typeof t.endIndex?r=this.positionInside(t.endIndex):t.index&&(r=this.positionInside(t.index+1));return(r.line<e.line||r.line===e.line&&r.column<=e.column)&&(r={column:e.column+1,line:e.line}),{end:r,start:e}}raw(t,e){return(new lo).raw(this,t,e)}remove(){return this.parent&&this.parent.removeChild(this),this.parent=void 0,this}replaceWith(...t){if(this.parent){let e=this,r=!1;for(let n of t)n===this?r=!0:r?(this.parent.insertAfter(e,n),e=n):this.parent.insertBefore(e,n);r||this.remove()}return this}root(){let t=this;for(;t.parent&&"document"!==t.parent.type;)t=t.parent;return t}toJSON(t,e){let r={},n=null==e;e=e||new Map;let o=0;for(let t in this){if(!Object.prototype.hasOwnProperty.call(this,t))continue;if("parent"===t||"proxyCache"===t)continue;let n=this[t];if(Array.isArray(n))r[t]=n.map((t=>"object"==typeof t&&t.toJSON?t.toJSON(null,e):t));else if("object"==typeof n&&n.toJSON)r[t]=n.toJSON(null,e);else if("source"===t){let i=e.get(n.input);null==i&&(i=o,e.set(n.input,o),o++),r[t]={end:n.end,inputId:i,start:n.start}}else r[t]=n}return n&&(r.inputs=[...e.keys()].map((t=>t.toJSON()))),r}toProxy(){return this.proxyCache||(this.proxyCache=new Proxy(this,this.getProxyProcessor())),this.proxyCache}toString(t=uo){t.stringify&&(t=t.stringify);let e="";return t(this,(t=>{e+=t})),e}warn(t,e,r){let n={node:this};for(let t in r)n[t]=r[t];return t.warn(e,n)}get proxyOf(){return this}};var po=ho;ho.default=ho;let fo=po,mo=class extends fo{constructor(t){t&&void 0!==t.value&&"string"!=typeof t.value&&(t={...t,value:String(t.value)}),super(t),this.type="decl"}get variable(){return this.prop.startsWith("--")||"$"===this.prop[0]}};var yo=mo;mo.default=mo;var go={nanoid:(t=21)=>{let e="",r=t;for(;r--;)e+="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict"[64*Math.random()|0];return e},customAlphabet:(t,e=21)=>(r=e)=>{let n="",o=r;for(;o--;)n+=t[Math.random()*t.length|0];return n}};let{SourceMapConsumer:vo,SourceMapGenerator:bo}=qn,{existsSync:wo,readFileSync:So}=qn,{dirname:xo,join:ko}=qn;let Co=class{constructor(t,e){if(!1===e.map)return;this.loadAnnotation(t),this.inline=this.startWith(this.annotation,"data:");let r=e.map?e.map.prev:void 0,n=this.loadMap(e.from,r);!this.mapFile&&e.from&&(this.mapFile=e.from),this.mapFile&&(this.root=xo(this.mapFile)),n&&(this.text=n)}consumer(){return this.consumerCache||(this.consumerCache=new vo(this.text)),this.consumerCache}decodeInline(t){if(/^data:application\/json;charset=utf-?8,/.test(t)||/^data:application\/json,/.test(t))return decodeURIComponent(t.substr(RegExp.lastMatch.length));if(/^data:application\/json;charset=utf-?8;base64,/.test(t)||/^data:application\/json;base64,/.test(t))return e=t.substr(RegExp.lastMatch.length),Buffer?Buffer.from(e,"base64").toString():window.atob(e);var e;let r=t.match(/data:application\/json;([^,]+),/)[1];throw new Error("Unsupported source map encoding "+r)}getAnnotationURL(t){return t.replace(/^\/\*\s*# sourceMappingURL=/,"").trim()}isMap(t){return"object"==typeof t&&("string"==typeof t.mappings||"string"==typeof t._mappings||Array.isArray(t.sections))}loadAnnotation(t){let e=t.match(/\/\*\s*# sourceMappingURL=/gm);if(!e)return;let r=t.lastIndexOf(e.pop()),n=t.indexOf("*/",r);r>-1&&n>-1&&(this.annotation=this.getAnnotationURL(t.substring(r,n)))}loadFile(t){if(this.root=xo(t),wo(t))return this.mapFile=t,So(t,"utf-8").toString().trim()}loadMap(t,e){if(!1===e)return!1;if(e){if("string"==typeof e)return e;if("function"!=typeof e){if(e instanceof vo)return bo.fromSourceMap(e).toString();if(e instanceof bo)return e.toString();if(this.isMap(e))return JSON.stringify(e);throw new Error("Unsupported previous source map format: "+e.toString())}{let r=e(t);if(r){let t=this.loadFile(r);if(!t)throw new Error("Unable to load previous source map: "+r.toString());return t}}}else{if(this.inline)return this.decodeInline(this.annotation);if(this.annotation){let e=this.annotation;return t&&(e=ko(xo(t),e)),this.loadFile(e)}}}startWith(t,e){return!!t&&t.substr(0,e.length)===e}withContent(){return!!(this.consumer().sourcesContent&&this.consumer().sourcesContent.length>0)}};var Io=Co;Co.default=Co;let{SourceMapConsumer:Oo,SourceMapGenerator:Eo}=qn,{fileURLToPath:Ro,pathToFileURL:Ao}=qn,{isAbsolute:Mo,resolve:_o}=qn,{nanoid:To}=go,Lo=qn,No=$n,Po=Io,jo=Symbol("fromOffsetCache"),Do=Boolean(Oo&&Eo),Fo=Boolean(_o&&Mo),Uo=class{constructor(t,e={}){if(null==t||"object"==typeof t&&!t.toString)throw new Error(`PostCSS received ${t} instead of CSS string`);if(this.css=t.toString(),"\ufeff"===this.css[0]||"￾"===this.css[0]?(this.hasBOM=!0,this.css=this.css.slice(1)):this.hasBOM=!1,e.from&&(!Fo||/^\w+:\/\//.test(e.from)||Mo(e.from)?this.file=e.from:this.file=_o(e.from)),Fo&&Do){let t=new Po(this.css,e);if(t.text){this.map=t;let e=t.consumer().file;!this.file&&e&&(this.file=this.mapResolve(e))}}this.file||(this.id="<input css "+To(6)+">"),this.map&&(this.map.file=this.from)}error(t,e,r,n={}){let o,i,s;if(e&&"object"==typeof e){let t=e,n=r;if("number"==typeof t.offset){let n=this.fromOffset(t.offset);e=n.line,r=n.col}else e=t.line,r=t.column;if("number"==typeof n.offset){let t=this.fromOffset(n.offset);i=t.line,s=t.col}else i=n.line,s=n.column}else if(!r){let t=this.fromOffset(e);e=t.line,r=t.col}let a=this.origin(e,r,i,s);return o=a?new No(t,void 0===a.endLine?a.line:{column:a.column,line:a.line},void 0===a.endLine?a.column:{column:a.endColumn,line:a.endLine},a.source,a.file,n.plugin):new No(t,void 0===i?e:{column:r,line:e},void 0===i?r:{column:s,line:i},this.css,this.file,n.plugin),o.input={column:r,endColumn:s,endLine:i,line:e,source:this.css},this.file&&(Ao&&(o.input.url=Ao(this.file).toString()),o.input.file=this.file),o}fromOffset(t){let e,r;if(this[jo])r=this[jo];else{let t=this.css.split("\n");r=new Array(t.length);let e=0;for(let n=0,o=t.length;n<o;n++)r[n]=e,e+=t[n].length+1;this[jo]=r}e=r[r.length-1];let n=0;if(t>=e)n=r.length-1;else{let e,o=r.length-2;for(;n<o;)if(e=n+(o-n>>1),t<r[e])o=e-1;else{if(!(t>=r[e+1])){n=e;break}n=e+1}}return{col:t-r[n]+1,line:n+1}}mapResolve(t){return/^\w+:\/\//.test(t)?t:_o(this.map.consumer().sourceRoot||this.map.root||".",t)}origin(t,e,r,n){if(!this.map)return!1;let o,i,s=this.map.consumer(),a=s.originalPositionFor({column:e,line:t});if(!a.source)return!1;"number"==typeof r&&(o=s.originalPositionFor({column:n,line:r})),i=Mo(a.source)?Ao(a.source):new URL(a.source,this.map.consumer().sourceRoot||Ao(this.map.mapFile));let l={column:a.column,endColumn:o&&o.column,endLine:o&&o.line,line:a.line,url:i.toString()};if("file:"===i.protocol){if(!Ro)throw new Error("file: protocol is not available in this PostCSS build");l.file=Ro(i)}let u=s.sourceContentFor(a.source);return u&&(l.source=u),l}toJSON(){let t={};for(let e of["hasBOM","css","file","id"])null!=this[e]&&(t[e]=this[e]);return this.map&&(t.map={...this.map},t.map.consumerCache&&(t.map.consumerCache=void 0)),t}get from(){return this.file||this.id}};var Bo=Uo;Uo.default=Uo,Lo&&Lo.registerInput&&Lo.registerInput(Uo);let{SourceMapConsumer:Wo,SourceMapGenerator:zo}=qn,{dirname:Go,relative:Vo,resolve:Ho,sep:Jo}=qn,{pathToFileURL:qo}=qn,Zo=Bo,Yo=Boolean(Wo&&zo),Xo=Boolean(Go&&Ho&&Vo&&Jo);var $o=class{constructor(t,e,r,n){this.stringify=t,this.mapOpts=r.map||{},this.root=e,this.opts=r,this.css=n,this.originalCSS=n,this.usesFileUrls=!this.mapOpts.from&&this.mapOpts.absolute,this.memoizedFileURLs=new Map,this.memoizedPaths=new Map,this.memoizedURLs=new Map}addAnnotation(){let t;t=this.isInline()?"data:application/json;base64,"+this.toBase64(this.map.toString()):"string"==typeof this.mapOpts.annotation?this.mapOpts.annotation:"function"==typeof this.mapOpts.annotation?this.mapOpts.annotation(this.opts.to,this.root):this.outputFile()+".map";let e="\n";this.css.includes("\r\n")&&(e="\r\n"),this.css+=e+"/*# sourceMappingURL="+t+" */"}applyPrevMaps(){for(let t of this.previous()){let e,r=this.toUrl(this.path(t.file)),n=t.root||Go(t.file);!1===this.mapOpts.sourcesContent?(e=new Wo(t.text),e.sourcesContent&&(e.sourcesContent=null)):e=t.consumer(),this.map.applySourceMap(e,r,this.toUrl(this.path(n)))}}clearAnnotation(){if(!1!==this.mapOpts.annotation)if(this.root){let t;for(let e=this.root.nodes.length-1;e>=0;e--)t=this.root.nodes[e],"comment"===t.type&&0===t.text.indexOf("# sourceMappingURL=")&&this.root.removeChild(e)}else this.css&&(this.css=this.css.replace(/\n*?\/\*#[\S\s]*?\*\/$/gm,""))}generate(){if(this.clearAnnotation(),Xo&&Yo&&this.isMap())return this.generateMap();{let t="";return this.stringify(this.root,(e=>{t+=e})),[t]}}generateMap(){if(this.root)this.generateString();else if(1===this.previous().length){let t=this.previous()[0].consumer();t.file=this.outputFile(),this.map=zo.fromSourceMap(t,{ignoreInvalidMapping:!0})}else this.map=new zo({file:this.outputFile(),ignoreInvalidMapping:!0}),this.map.addMapping({generated:{column:0,line:1},original:{column:0,line:1},source:this.opts.from?this.toUrl(this.path(this.opts.from)):"<no source>"});return this.isSourcesContent()&&this.setSourcesContent(),this.root&&this.previous().length>0&&this.applyPrevMaps(),this.isAnnotation()&&this.addAnnotation(),this.isInline()?[this.css]:[this.css,this.map]}generateString(){this.css="",this.map=new zo({file:this.outputFile(),ignoreInvalidMapping:!0});let t,e,r=1,n=1,o="<no source>",i={generated:{column:0,line:0},original:{column:0,line:0},source:""};this.stringify(this.root,((s,a,l)=>{if(this.css+=s,a&&"end"!==l&&(i.generated.line=r,i.generated.column=n-1,a.source&&a.source.start?(i.source=this.sourcePath(a),i.original.line=a.source.start.line,i.original.column=a.source.start.column-1,this.map.addMapping(i)):(i.source=o,i.original.line=1,i.original.column=0,this.map.addMapping(i))),t=s.match(/\n/g),t?(r+=t.length,e=s.lastIndexOf("\n"),n=s.length-e):n+=s.length,a&&"start"!==l){let t=a.parent||{raws:{}};("decl"===a.type||"atrule"===a.type&&!a.nodes)&&a===t.last&&!t.raws.semicolon||(a.source&&a.source.end?(i.source=this.sourcePath(a),i.original.line=a.source.end.line,i.original.column=a.source.end.column-1,i.generated.line=r,i.generated.column=n-2,this.map.addMapping(i)):(i.source=o,i.original.line=1,i.original.column=0,i.generated.line=r,i.generated.column=n-1,this.map.addMapping(i)))}}))}isAnnotation(){return!!this.isInline()||(void 0!==this.mapOpts.annotation?this.mapOpts.annotation:!this.previous().length||this.previous().some((t=>t.annotation)))}isInline(){if(void 0!==this.mapOpts.inline)return this.mapOpts.inline;let t=this.mapOpts.annotation;return(void 0===t||!0===t)&&(!this.previous().length||this.previous().some((t=>t.inline)))}isMap(){return void 0!==this.opts.map?!!this.opts.map:this.previous().length>0}isSourcesContent(){return void 0!==this.mapOpts.sourcesContent?this.mapOpts.sourcesContent:!this.previous().length||this.previous().some((t=>t.withContent()))}outputFile(){return this.opts.to?this.path(this.opts.to):this.opts.from?this.path(this.opts.from):"to.css"}path(t){if(this.mapOpts.absolute)return t;if(60===t.charCodeAt(0))return t;if(/^\w+:\/\//.test(t))return t;let e=this.memoizedPaths.get(t);if(e)return e;let r=this.opts.to?Go(this.opts.to):".";"string"==typeof this.mapOpts.annotation&&(r=Go(Ho(r,this.mapOpts.annotation)));let n=Vo(r,t);return this.memoizedPaths.set(t,n),n}previous(){if(!this.previousMaps)if(this.previousMaps=[],this.root)this.root.walk((t=>{if(t.source&&t.source.input.map){let e=t.source.input.map;this.previousMaps.includes(e)||this.previousMaps.push(e)}}));else{let t=new Zo(this.originalCSS,this.opts);t.map&&this.previousMaps.push(t.map)}return this.previousMaps}setSourcesContent(){let t={};if(this.root)this.root.walk((e=>{if(e.source){let r=e.source.input.from;if(r&&!t[r]){t[r]=!0;let n=this.usesFileUrls?this.toFileUrl(r):this.toUrl(this.path(r));this.map.setSourceContent(n,e.source.input.css)}}}));else if(this.css){let t=this.opts.from?this.toUrl(this.path(this.opts.from)):"<no source>";this.map.setSourceContent(t,this.css)}}sourcePath(t){return this.mapOpts.from?this.toUrl(this.mapOpts.from):this.usesFileUrls?this.toFileUrl(t.source.input.from):this.toUrl(this.path(t.source.input.from))}toBase64(t){return Buffer?Buffer.from(t).toString("base64"):window.btoa(unescape(encodeURIComponent(t)))}toFileUrl(t){let e=this.memoizedFileURLs.get(t);if(e)return e;if(qo){let e=qo(t).toString();return this.memoizedFileURLs.set(t,e),e}throw new Error("`map.absolute` option is not available in this PostCSS build")}toUrl(t){let e=this.memoizedURLs.get(t);if(e)return e;"\\"===Jo&&(t=t.replace(/\\/g,"/"));let r=encodeURI(t).replace(/[#?]/g,encodeURIComponent);return this.memoizedURLs.set(t,r),r}};let Ko=po,Qo=class extends Ko{constructor(t){super(t),this.type="comment"}};var ti=Qo;Qo.default=Qo;let ei,ri,ni,oi,{isClean:ii,my:si}=Kn,ai=yo,li=ti,ui=po;function ci(t){return t.map((t=>(t.nodes&&(t.nodes=ci(t.nodes)),delete t.source,t)))}function hi(t){if(t[ii]=!1,t.proxyOf.nodes)for(let e of t.proxyOf.nodes)hi(e)}let pi=class t extends ui{append(...t){for(let e of t){let t=this.normalize(e,this.last);for(let e of t)this.proxyOf.nodes.push(e)}return this.markDirty(),this}cleanRaws(t){if(super.cleanRaws(t),this.nodes)for(let e of this.nodes)e.cleanRaws(t)}each(t){if(!this.proxyOf.nodes)return;let e,r,n=this.getIterator();for(;this.indexes[n]<this.proxyOf.nodes.length&&(e=this.indexes[n],r=t(this.proxyOf.nodes[e],e),!1!==r);)this.indexes[n]+=1;return delete this.indexes[n],r}every(t){return this.nodes.every(t)}getIterator(){this.lastEach||(this.lastEach=0),this.indexes||(this.indexes={}),this.lastEach+=1;let t=this.lastEach;return this.indexes[t]=0,t}getProxyProcessor(){return{get(t,e){return"proxyOf"===e?t:t[e]?"each"===e||"string"==typeof e&&e.startsWith("walk")?(...r)=>t[e](...r.map((t=>"function"==typeof t?(e,r)=>t(e.toProxy(),r):t))):"every"===e||"some"===e?r=>t[e](((t,...e)=>r(t.toProxy(),...e))):"root"===e?()=>t.root().toProxy():"nodes"===e?t.nodes.map((t=>t.toProxy())):"first"===e||"last"===e?t[e].toProxy():t[e]:t[e]},set(t,e,r){return t[e]===r||(t[e]=r,"name"!==e&&"params"!==e&&"selector"!==e||t.markDirty()),!0}}}index(t){return"number"==typeof t?t:(t.proxyOf&&(t=t.proxyOf),this.proxyOf.nodes.indexOf(t))}insertAfter(t,e){let r,n=this.index(t),o=this.normalize(e,this.proxyOf.nodes[n]).reverse();n=this.index(t);for(let t of o)this.proxyOf.nodes.splice(n+1,0,t);for(let t in this.indexes)r=this.indexes[t],n<r&&(this.indexes[t]=r+o.length);return this.markDirty(),this}insertBefore(t,e){let r,n=this.index(t),o=0===n&&"prepend",i=this.normalize(e,this.proxyOf.nodes[n],o).reverse();n=this.index(t);for(let t of i)this.proxyOf.nodes.splice(n,0,t);for(let t in this.indexes)r=this.indexes[t],n<=r&&(this.indexes[t]=r+i.length);return this.markDirty(),this}normalize(e,r){if("string"==typeof e)e=ci(ei(e).nodes);else if(void 0===e)e=[];else if(Array.isArray(e)){e=e.slice(0);for(let t of e)t.parent&&t.parent.removeChild(t,"ignore")}else if("root"===e.type&&"document"!==this.type){e=e.nodes.slice(0);for(let t of e)t.parent&&t.parent.removeChild(t,"ignore")}else if(e.type)e=[e];else if(e.prop){if(void 0===e.value)throw new Error("Value field is missed in node creation");"string"!=typeof e.value&&(e.value=String(e.value)),e=[new ai(e)]}else if(e.selector)e=[new ri(e)];else if(e.name)e=[new ni(e)];else{if(!e.text)throw new Error("Unknown node type in node creation");e=[new li(e)]}return e.map((e=>(e[si]||t.rebuild(e),(e=e.proxyOf).parent&&e.parent.removeChild(e),e[ii]&&hi(e),void 0===e.raws.before&&r&&void 0!==r.raws.before&&(e.raws.before=r.raws.before.replace(/\S/g,"")),e.parent=this.proxyOf,e)))}prepend(...t){t=t.reverse();for(let e of t){let t=this.normalize(e,this.first,"prepend").reverse();for(let e of t)this.proxyOf.nodes.unshift(e);for(let e in this.indexes)this.indexes[e]=this.indexes[e]+t.length}return this.markDirty(),this}push(t){return t.parent=this,this.proxyOf.nodes.push(t),this}removeAll(){for(let t of this.proxyOf.nodes)t.parent=void 0;return this.proxyOf.nodes=[],this.markDirty(),this}removeChild(t){let e;t=this.index(t),this.proxyOf.nodes[t].parent=void 0,this.proxyOf.nodes.splice(t,1);for(let r in this.indexes)e=this.indexes[r],e>=t&&(this.indexes[r]=e-1);return this.markDirty(),this}replaceValues(t,e,r){return r||(r=e,e={}),this.walkDecls((n=>{e.props&&!e.props.includes(n.prop)||e.fast&&!n.value.includes(e.fast)||(n.value=n.value.replace(t,r))})),this.markDirty(),this}some(t){return this.nodes.some(t)}walk(t){return this.each(((e,r)=>{let n;try{n=t(e,r)}catch(t){throw e.addToError(t)}return!1!==n&&e.walk&&(n=e.walk(t)),n}))}walkAtRules(t,e){return e?t instanceof RegExp?this.walk(((r,n)=>{if("atrule"===r.type&&t.test(r.name))return e(r,n)})):this.walk(((r,n)=>{if("atrule"===r.type&&r.name===t)return e(r,n)})):(e=t,this.walk(((t,r)=>{if("atrule"===t.type)return e(t,r)})))}walkComments(t){return this.walk(((e,r)=>{if("comment"===e.type)return t(e,r)}))}walkDecls(t,e){return e?t instanceof RegExp?this.walk(((r,n)=>{if("decl"===r.type&&t.test(r.prop))return e(r,n)})):this.walk(((r,n)=>{if("decl"===r.type&&r.prop===t)return e(r,n)})):(e=t,this.walk(((t,r)=>{if("decl"===t.type)return e(t,r)})))}walkRules(t,e){return e?t instanceof RegExp?this.walk(((r,n)=>{if("rule"===r.type&&t.test(r.selector))return e(r,n)})):this.walk(((r,n)=>{if("rule"===r.type&&r.selector===t)return e(r,n)})):(e=t,this.walk(((t,r)=>{if("rule"===t.type)return e(t,r)})))}get first(){if(this.proxyOf.nodes)return this.proxyOf.nodes[0]}get last(){if(this.proxyOf.nodes)return this.proxyOf.nodes[this.proxyOf.nodes.length-1]}};pi.registerParse=t=>{ei=t},pi.registerRule=t=>{ri=t},pi.registerAtRule=t=>{ni=t},pi.registerRoot=t=>{oi=t};var fi=pi;pi.default=pi,pi.rebuild=t=>{"atrule"===t.type?Object.setPrototypeOf(t,ni.prototype):"rule"===t.type?Object.setPrototypeOf(t,ri.prototype):"decl"===t.type?Object.setPrototypeOf(t,ai.prototype):"comment"===t.type?Object.setPrototypeOf(t,li.prototype):"root"===t.type&&Object.setPrototypeOf(t,oi.prototype),t[si]=!0,t.nodes&&t.nodes.forEach((t=>{pi.rebuild(t)}))};let di,mi,yi=fi,gi=class extends yi{constructor(t){super({type:"document",...t}),this.nodes||(this.nodes=[])}toResult(t={}){return new di(new mi,this,t).stringify()}};gi.registerLazyResult=t=>{di=t},gi.registerProcessor=t=>{mi=t};var vi=gi;gi.default=gi;let bi=class{constructor(t,e={}){if(this.type="warning",this.text=t,e.node&&e.node.source){let t=e.node.rangeBy(e);this.line=t.start.line,this.column=t.start.column,this.endLine=t.end.line,this.endColumn=t.end.column}for(let t in e)this[t]=e[t]}toString(){return this.node?this.node.error(this.text,{index:this.index,plugin:this.plugin,word:this.word}).message:this.plugin?this.plugin+": "+this.text:this.text}};var wi=bi;bi.default=bi;let Si=wi,xi=class{constructor(t,e,r){this.processor=t,this.messages=[],this.root=e,this.opts=r,this.css=void 0,this.map=void 0}toString(){return this.css}warn(t,e={}){e.plugin||this.lastPlugin&&this.lastPlugin.postcssPlugin&&(e.plugin=this.lastPlugin.postcssPlugin);let r=new Si(t,e);return this.messages.push(r),r}warnings(){return this.messages.filter((t=>"warning"===t.type))}get content(){return this.css}};var ki=xi;xi.default=xi;const Ci="'".charCodeAt(0),Ii='"'.charCodeAt(0),Oi="\\".charCodeAt(0),Ei="/".charCodeAt(0),Ri="\n".charCodeAt(0),Ai=" ".charCodeAt(0),Mi="\f".charCodeAt(0),_i="\t".charCodeAt(0),Ti="\r".charCodeAt(0),Li="[".charCodeAt(0),Ni="]".charCodeAt(0),Pi="(".charCodeAt(0),ji=")".charCodeAt(0),Di="{".charCodeAt(0),Fi="}".charCodeAt(0),Ui=";".charCodeAt(0),Bi="*".charCodeAt(0),Wi=":".charCodeAt(0),zi="@".charCodeAt(0),Gi=/[\t\n\f\r "#'()/;[\\\]{}]/g,Vi=/[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g,Hi=/.[\r\n"'(/\\]/,Ji=/[\da-f]/i;let qi=fi,Zi=class extends qi{constructor(t){super(t),this.type="atrule"}append(...t){return this.proxyOf.nodes||(this.nodes=[]),super.append(...t)}prepend(...t){return this.proxyOf.nodes||(this.nodes=[]),super.prepend(...t)}};var Yi=Zi;Zi.default=Zi,qi.registerAtRule(Zi);let Xi,$i,Ki=fi,Qi=class extends Ki{constructor(t){super(t),this.type="root",this.nodes||(this.nodes=[])}normalize(t,e,r){let n=super.normalize(t);if(e)if("prepend"===r)this.nodes.length>1?e.raws.before=this.nodes[1].raws.before:delete e.raws.before;else if(this.first!==e)for(let t of n)t.raws.before=e.raws.before;return n}removeChild(t,e){let r=this.index(t);return!e&&0===r&&this.nodes.length>1&&(this.nodes[1].raws.before=this.nodes[r].raws.before),super.removeChild(t)}toResult(t={}){return new Xi(new $i,this,t).stringify()}};Qi.registerLazyResult=t=>{Xi=t},Qi.registerProcessor=t=>{$i=t};var ts=Qi;Qi.default=Qi,Ki.registerRoot(Qi);let es={comma(t){return es.split(t,[","],!0)},space(t){return es.split(t,[" ","\n","\t"])},split(t,e,r){let n=[],o="",i=!1,s=0,a=!1,l="",u=!1;for(let r of t)u?u=!1:"\\"===r?u=!0:a?r===l&&(a=!1):'"'===r||"'"===r?(a=!0,l=r):"("===r?s+=1:")"===r?s>0&&(s-=1):0===s&&e.includes(r)&&(i=!0),i?(""!==o&&n.push(o.trim()),o="",i=!1):o+=r;return(r||""!==o)&&n.push(o.trim()),n}};var rs=es;es.default=es;let ns=fi,os=rs,is=class extends ns{constructor(t){super(t),this.type="rule",this.nodes||(this.nodes=[])}get selectors(){return os.comma(this.selector)}set selectors(t){let e=this.selector?this.selector.match(/,\s*/):null,r=e?e[0]:","+this.raw("between","beforeOpen");this.selector=t.join(r)}};var ss=is;is.default=is,ns.registerRule(is);let as=yo,ls=function(t,e={}){let r,n,o,i,s,a,l,u,c,h,p=t.css.valueOf(),f=e.ignoreErrors,d=p.length,m=0,y=[],g=[];function v(e){throw t.error("Unclosed "+e,m)}return{back:function(t){g.push(t)},endOfFile:function(){return 0===g.length&&m>=d},nextToken:function(t){if(g.length)return g.pop();if(m>=d)return;let e=!!t&&t.ignoreUnclosed;switch(r=p.charCodeAt(m),r){case Ri:case Ai:case _i:case Ti:case Mi:n=m;do{n+=1,r=p.charCodeAt(n)}while(r===Ai||r===Ri||r===_i||r===Ti||r===Mi);h=["space",p.slice(m,n)],m=n-1;break;case Li:case Ni:case Di:case Fi:case Wi:case Ui:case ji:{let t=String.fromCharCode(r);h=[t,t,m];break}case Pi:if(u=y.length?y.pop()[1]:"",c=p.charCodeAt(m+1),"url"===u&&c!==Ci&&c!==Ii&&c!==Ai&&c!==Ri&&c!==_i&&c!==Mi&&c!==Ti){n=m;do{if(a=!1,n=p.indexOf(")",n+1),-1===n){if(f||e){n=m;break}v("bracket")}for(l=n;p.charCodeAt(l-1)===Oi;)l-=1,a=!a}while(a);h=["brackets",p.slice(m,n+1),m,n],m=n}else n=p.indexOf(")",m+1),i=p.slice(m,n+1),-1===n||Hi.test(i)?h=["(","(",m]:(h=["brackets",i,m,n],m=n);break;case Ci:case Ii:o=r===Ci?"'":'"',n=m;do{if(a=!1,n=p.indexOf(o,n+1),-1===n){if(f||e){n=m+1;break}v("string")}for(l=n;p.charCodeAt(l-1)===Oi;)l-=1,a=!a}while(a);h=["string",p.slice(m,n+1),m,n],m=n;break;case zi:Gi.lastIndex=m+1,Gi.test(p),n=0===Gi.lastIndex?p.length-1:Gi.lastIndex-2,h=["at-word",p.slice(m,n+1),m,n],m=n;break;case Oi:for(n=m,s=!0;p.charCodeAt(n+1)===Oi;)n+=1,s=!s;if(r=p.charCodeAt(n+1),s&&r!==Ei&&r!==Ai&&r!==Ri&&r!==_i&&r!==Ti&&r!==Mi&&(n+=1,Ji.test(p.charAt(n)))){for(;Ji.test(p.charAt(n+1));)n+=1;p.charCodeAt(n+1)===Ai&&(n+=1)}h=["word",p.slice(m,n+1),m,n],m=n;break;default:r===Ei&&p.charCodeAt(m+1)===Bi?(n=p.indexOf("*/",m+2)+1,0===n&&(f||e?n=p.length:v("comment")),h=["comment",p.slice(m,n+1),m,n],m=n):(Vi.lastIndex=m+1,Vi.test(p),n=0===Vi.lastIndex?p.length-1:Vi.lastIndex-2,h=["word",p.slice(m,n+1),m,n],y.push(h),m=n)}return m++,h},position:function(){return m}}},us=ti,cs=Yi,hs=ts,ps=ss;const fs={empty:!0,space:!0};let ds=fi,ms=class{constructor(t){this.input=t,this.root=new hs,this.current=this.root,this.spaces="",this.semicolon=!1,this.createTokenizer(),this.root.source={input:t,start:{column:1,line:1,offset:0}}}atrule(t){let e,r,n,o=new cs;o.name=t[1].slice(1),""===o.name&&this.unnamedAtrule(o,t),this.init(o,t[2]);let i=!1,s=!1,a=[],l=[];for(;!this.tokenizer.endOfFile();){if(e=(t=this.tokenizer.nextToken())[0],"("===e||"["===e?l.push("("===e?")":"]"):"{"===e&&l.length>0?l.push("}"):e===l[l.length-1]&&l.pop(),0===l.length){if(";"===e){o.source.end=this.getPosition(t[2]),o.source.end.offset++,this.semicolon=!0;break}if("{"===e){s=!0;break}if("}"===e){if(a.length>0){for(n=a.length-1,r=a[n];r&&"space"===r[0];)r=a[--n];r&&(o.source.end=this.getPosition(r[3]||r[2]),o.source.end.offset++)}this.end(t);break}a.push(t)}else a.push(t);if(this.tokenizer.endOfFile()){i=!0;break}}o.raws.between=this.spacesAndCommentsFromEnd(a),a.length?(o.raws.afterName=this.spacesAndCommentsFromStart(a),this.raw(o,"params",a),i&&(t=a[a.length-1],o.source.end=this.getPosition(t[3]||t[2]),o.source.end.offset++,this.spaces=o.raws.between,o.raws.between="")):(o.raws.afterName="",o.params=""),s&&(o.nodes=[],this.current=o)}checkMissedSemicolon(t){let e=this.colon(t);if(!1===e)return;let r,n=0;for(let o=e-1;o>=0&&(r=t[o],"space"===r[0]||(n+=1,2!==n));o--);throw this.input.error("Missed semicolon","word"===r[0]?r[3]+1:r[2])}colon(t){let e,r,n,o=0;for(let[i,s]of t.entries()){if(e=s,r=e[0],"("===r&&(o+=1),")"===r&&(o-=1),0===o&&":"===r){if(n){if("word"===n[0]&&"progid"===n[1])continue;return i}this.doubleColon(e)}n=e}return!1}comment(t){let e=new us;this.init(e,t[2]),e.source.end=this.getPosition(t[3]||t[2]),e.source.end.offset++;let r=t[1].slice(2,-2);if(/^\s*$/.test(r))e.text="",e.raws.left=r,e.raws.right="";else{let t=r.match(/^(\s*)([^]*\S)(\s*)$/);e.text=t[2],e.raws.left=t[1],e.raws.right=t[3]}}createTokenizer(){this.tokenizer=ls(this.input)}decl(t,e){let r=new as;this.init(r,t[0][2]);let n,o=t[t.length-1];for(";"===o[0]&&(this.semicolon=!0,t.pop()),r.source.end=this.getPosition(o[3]||o[2]||function(t){for(let e=t.length-1;e>=0;e--){let r=t[e],n=r[3]||r[2];if(n)return n}}(t)),r.source.end.offset++;"word"!==t[0][0];)1===t.length&&this.unknownWord(t),r.raws.before+=t.shift()[1];for(r.source.start=this.getPosition(t[0][2]),r.prop="";t.length;){let e=t[0][0];if(":"===e||"space"===e||"comment"===e)break;r.prop+=t.shift()[1]}for(r.raws.between="";t.length;){if(n=t.shift(),":"===n[0]){r.raws.between+=n[1];break}"word"===n[0]&&/\w/.test(n[1])&&this.unknownWord([n]),r.raws.between+=n[1]}"_"!==r.prop[0]&&"*"!==r.prop[0]||(r.raws.before+=r.prop[0],r.prop=r.prop.slice(1));let i,s=[];for(;t.length&&(i=t[0][0],"space"===i||"comment"===i);)s.push(t.shift());this.precheckMissedSemicolon(t);for(let e=t.length-1;e>=0;e--){if(n=t[e],"!important"===n[1].toLowerCase()){r.important=!0;let n=this.stringFrom(t,e);n=this.spacesFromEnd(t)+n," !important"!==n&&(r.raws.important=n);break}if("important"===n[1].toLowerCase()){let n=t.slice(0),o="";for(let t=e;t>0;t--){let e=n[t][0];if(0===o.trim().indexOf("!")&&"space"!==e)break;o=n.pop()[1]+o}0===o.trim().indexOf("!")&&(r.important=!0,r.raws.important=o,t=n)}if("space"!==n[0]&&"comment"!==n[0])break}t.some((t=>"space"!==t[0]&&"comment"!==t[0]))&&(r.raws.between+=s.map((t=>t[1])).join(""),s=[]),this.raw(r,"value",s.concat(t),e),r.value.includes(":")&&!e&&this.checkMissedSemicolon(t)}doubleColon(t){throw this.input.error("Double colon",{offset:t[2]},{offset:t[2]+t[1].length})}emptyRule(t){let e=new ps;this.init(e,t[2]),e.selector="",e.raws.between="",this.current=e}end(t){this.current.nodes&&this.current.nodes.length&&(this.current.raws.semicolon=this.semicolon),this.semicolon=!1,this.current.raws.after=(this.current.raws.after||"")+this.spaces,this.spaces="",this.current.parent?(this.current.source.end=this.getPosition(t[2]),this.current.source.end.offset++,this.current=this.current.parent):this.unexpectedClose(t)}endFile(){this.current.parent&&this.unclosedBlock(),this.current.nodes&&this.current.nodes.length&&(this.current.raws.semicolon=this.semicolon),this.current.raws.after=(this.current.raws.after||"")+this.spaces,this.root.source.end=this.getPosition(this.tokenizer.position())}freeSemicolon(t){if(this.spaces+=t[1],this.current.nodes){let t=this.current.nodes[this.current.nodes.length-1];t&&"rule"===t.type&&!t.raws.ownSemicolon&&(t.raws.ownSemicolon=this.spaces,this.spaces="")}}getPosition(t){let e=this.input.fromOffset(t);return{column:e.col,line:e.line,offset:t}}init(t,e){this.current.push(t),t.source={input:this.input,start:this.getPosition(e)},t.raws.before=this.spaces,this.spaces="","comment"!==t.type&&(this.semicolon=!1)}other(t){let e=!1,r=null,n=!1,o=null,i=[],s=t[1].startsWith("--"),a=[],l=t;for(;l;){if(r=l[0],a.push(l),"("===r||"["===r)o||(o=l),i.push("("===r?")":"]");else if(s&&n&&"{"===r)o||(o=l),i.push("}");else if(0===i.length){if(";"===r){if(n)return void this.decl(a,s);break}if("{"===r)return void this.rule(a);if("}"===r){this.tokenizer.back(a.pop()),e=!0;break}":"===r&&(n=!0)}else r===i[i.length-1]&&(i.pop(),0===i.length&&(o=null));l=this.tokenizer.nextToken()}if(this.tokenizer.endOfFile()&&(e=!0),i.length>0&&this.unclosedBracket(o),e&&n){if(!s)for(;a.length&&(l=a[a.length-1][0],"space"===l||"comment"===l);)this.tokenizer.back(a.pop());this.decl(a,s)}else this.unknownWord(a)}parse(){let t;for(;!this.tokenizer.endOfFile();)switch(t=this.tokenizer.nextToken(),t[0]){case"space":this.spaces+=t[1];break;case";":this.freeSemicolon(t);break;case"}":this.end(t);break;case"comment":this.comment(t);break;case"at-word":this.atrule(t);break;case"{":this.emptyRule(t);break;default:this.other(t)}this.endFile()}precheckMissedSemicolon(){}raw(t,e,r,n){let o,i,s,a,l=r.length,u="",c=!0;for(let t=0;t<l;t+=1)o=r[t],i=o[0],"space"!==i||t!==l-1||n?"comment"===i?(a=r[t-1]?r[t-1][0]:"empty",s=r[t+1]?r[t+1][0]:"empty",fs[a]||fs[s]||","===u.slice(-1)?c=!1:u+=o[1]):u+=o[1]:c=!1;if(!c){let n=r.reduce(((t,e)=>t+e[1]),"");t.raws[e]={raw:n,value:u}}t[e]=u}rule(t){t.pop();let e=new ps;this.init(e,t[0][2]),e.raws.between=this.spacesAndCommentsFromEnd(t),this.raw(e,"selector",t),this.current=e}spacesAndCommentsFromEnd(t){let e,r="";for(;t.length&&(e=t[t.length-1][0],"space"===e||"comment"===e);)r=t.pop()[1]+r;return r}spacesAndCommentsFromStart(t){let e,r="";for(;t.length&&(e=t[0][0],"space"===e||"comment"===e);)r+=t.shift()[1];return r}spacesFromEnd(t){let e,r="";for(;t.length&&(e=t[t.length-1][0],"space"===e);)r=t.pop()[1]+r;return r}stringFrom(t,e){let r="";for(let n=e;n<t.length;n++)r+=t[n][1];return t.splice(e,t.length-e),r}unclosedBlock(){let t=this.current.source.start;throw this.input.error("Unclosed block",t.line,t.column)}unclosedBracket(t){throw this.input.error("Unclosed bracket",{offset:t[2]},{offset:t[2]+1})}unexpectedClose(t){throw this.input.error("Unexpected }",{offset:t[2]},{offset:t[2]+1})}unknownWord(t){throw this.input.error("Unknown word",{offset:t[0][2]},{offset:t[0][2]+t[0][1].length})}unnamedAtrule(t,e){throw this.input.error("At-rule without name",{offset:e[2]},{offset:e[2]+e[1].length})}},ys=Bo;function gs(t,e){let r=new ys(t,e),n=new ms(r);try{n.parse()}catch(t){throw t}return n.root}var vs=gs;gs.default=gs,ds.registerParse(gs);let{isClean:bs,my:ws}=Kn,Ss=$o,xs=oo,ks=fi,Cs=vi,Is=ki,Os=vs,Es=ts;const Rs={atrule:"AtRule",comment:"Comment",decl:"Declaration",document:"Document",root:"Root",rule:"Rule"},As={AtRule:!0,AtRuleExit:!0,Comment:!0,CommentExit:!0,Declaration:!0,DeclarationExit:!0,Document:!0,DocumentExit:!0,Once:!0,OnceExit:!0,postcssPlugin:!0,prepare:!0,Root:!0,RootExit:!0,Rule:!0,RuleExit:!0},Ms={Once:!0,postcssPlugin:!0,prepare:!0};function _s(t){return"object"==typeof t&&"function"==typeof t.then}function Ts(t){let e=!1,r=Rs[t.type];return"decl"===t.type?e=t.prop.toLowerCase():"atrule"===t.type&&(e=t.name.toLowerCase()),e&&t.append?[r,r+"-"+e,0,r+"Exit",r+"Exit-"+e]:e?[r,r+"-"+e,r+"Exit",r+"Exit-"+e]:t.append?[r,0,r+"Exit"]:[r,r+"Exit"]}function Ls(t){let e;return e="document"===t.type?["Document",0,"DocumentExit"]:"root"===t.type?["Root",0,"RootExit"]:Ts(t),{eventIndex:0,events:e,iterator:0,node:t,visitorIndex:0,visitors:[]}}function Ns(t){return t[bs]=!1,t.nodes&&t.nodes.forEach((t=>Ns(t))),t}let Ps={},js=class t{constructor(e,r,n){let o;if(this.stringified=!1,this.processed=!1,"object"!=typeof r||null===r||"root"!==r.type&&"document"!==r.type)if(r instanceof t||r instanceof Is)o=Ns(r.root),r.map&&(void 0===n.map&&(n.map={}),n.map.inline||(n.map.inline=!1),n.map.prev=r.map);else{let t=Os;n.syntax&&(t=n.syntax.parse),n.parser&&(t=n.parser),t.parse&&(t=t.parse);try{o=t(r,n)}catch(t){this.processed=!0,this.error=t}o&&!o[ws]&&ks.rebuild(o)}else o=Ns(r);this.result=new Is(e,o,n),this.helpers={...Ps,postcss:Ps,result:this.result},this.plugins=this.processor.plugins.map((t=>"object"==typeof t&&t.prepare?{...t,...t.prepare(this.result)}:t))}async(){return this.error?Promise.reject(this.error):this.processed?Promise.resolve(this.result):(this.processing||(this.processing=this.runAsync()),this.processing)}catch(t){return this.async().catch(t)}finally(t){return this.async().then(t,t)}getAsyncError(){throw new Error("Use process(css).then(cb) to work with async plugins")}handleError(t,e){let r=this.result.lastPlugin;try{e&&e.addToError(t),this.error=t,"CssSyntaxError"!==t.name||t.plugin?r.postcssVersion:(t.plugin=r.postcssPlugin,t.setMessage())}catch(t){console&&console.error&&console.error(t)}return t}prepareVisitors(){this.listeners={};let t=(t,e,r)=>{this.listeners[e]||(this.listeners[e]=[]),this.listeners[e].push([t,r])};for(let e of this.plugins)if("object"==typeof e)for(let r in e){if(!As[r]&&/^[A-Z]/.test(r))throw new Error(`Unknown event ${r} in ${e.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`);if(!Ms[r])if("object"==typeof e[r])for(let n in e[r])t(e,"*"===n?r:r+"-"+n.toLowerCase(),e[r][n]);else"function"==typeof e[r]&&t(e,r,e[r])}this.hasListener=Object.keys(this.listeners).length>0}async runAsync(){this.plugin=0;for(let t=0;t<this.plugins.length;t++){let e=this.plugins[t],r=this.runOnRoot(e);if(_s(r))try{await r}catch(t){throw this.handleError(t)}}if(this.prepareVisitors(),this.hasListener){let t=this.result.root;for(;!t[bs];){t[bs]=!0;let e=[Ls(t)];for(;e.length>0;){let t=this.visitTick(e);if(_s(t))try{await t}catch(t){let r=e[e.length-1].node;throw this.handleError(t,r)}}}if(this.listeners.OnceExit)for(let[e,r]of this.listeners.OnceExit){this.result.lastPlugin=e;try{if("document"===t.type){let e=t.nodes.map((t=>r(t,this.helpers)));await Promise.all(e)}else await r(t,this.helpers)}catch(t){throw this.handleError(t)}}}return this.processed=!0,this.stringify()}runOnRoot(t){this.result.lastPlugin=t;try{if("object"==typeof t&&t.Once){if("document"===this.result.root.type){let e=this.result.root.nodes.map((e=>t.Once(e,this.helpers)));return _s(e[0])?Promise.all(e):e}return t.Once(this.result.root,this.helpers)}if("function"==typeof t)return t(this.result.root,this.result)}catch(t){throw this.handleError(t)}}stringify(){if(this.error)throw this.error;if(this.stringified)return this.result;this.stringified=!0,this.sync();let t=this.result.opts,e=xs;t.syntax&&(e=t.syntax.stringify),t.stringifier&&(e=t.stringifier),e.stringify&&(e=e.stringify);let r=new Ss(e,this.result.root,this.result.opts).generate();return this.result.css=r[0],this.result.map=r[1],this.result}sync(){if(this.error)throw this.error;if(this.processed)return this.result;if(this.processed=!0,this.processing)throw this.getAsyncError();for(let t of this.plugins){if(_s(this.runOnRoot(t)))throw this.getAsyncError()}if(this.prepareVisitors(),this.hasListener){let t=this.result.root;for(;!t[bs];)t[bs]=!0,this.walkSync(t);if(this.listeners.OnceExit)if("document"===t.type)for(let e of t.nodes)this.visitSync(this.listeners.OnceExit,e);else this.visitSync(this.listeners.OnceExit,t)}return this.result}then(t,e){return this.async().then(t,e)}toString(){return this.css}visitSync(t,e){for(let[r,n]of t){let t;this.result.lastPlugin=r;try{t=n(e,this.helpers)}catch(t){throw this.handleError(t,e.proxyOf)}if("root"!==e.type&&"document"!==e.type&&!e.parent)return!0;if(_s(t))throw this.getAsyncError()}}visitTick(t){let e=t[t.length-1],{node:r,visitors:n}=e;if("root"!==r.type&&"document"!==r.type&&!r.parent)return void t.pop();if(n.length>0&&e.visitorIndex<n.length){let[t,o]=n[e.visitorIndex];e.visitorIndex+=1,e.visitorIndex===n.length&&(e.visitors=[],e.visitorIndex=0),this.result.lastPlugin=t;try{return o(r.toProxy(),this.helpers)}catch(t){throw this.handleError(t,r)}}if(0!==e.iterator){let n,o=e.iterator;for(;n=r.nodes[r.indexes[o]];)if(r.indexes[o]+=1,!n[bs])return n[bs]=!0,void t.push(Ls(n));e.iterator=0,delete r.indexes[o]}let o=e.events;for(;e.eventIndex<o.length;){let t=o[e.eventIndex];if(e.eventIndex+=1,0===t)return void(r.nodes&&r.nodes.length&&(r[bs]=!0,e.iterator=r.getIterator()));if(this.listeners[t])return void(e.visitors=this.listeners[t])}t.pop()}walkSync(t){t[bs]=!0;let e=Ts(t);for(let r of e)if(0===r)t.nodes&&t.each((t=>{t[bs]||this.walkSync(t)}));else{let e=this.listeners[r];if(e&&this.visitSync(e,t.toProxy()))return}}warnings(){return this.sync().warnings()}get content(){return this.stringify().content}get css(){return this.stringify().css}get map(){return this.stringify().map}get messages(){return this.sync().messages}get opts(){return this.result.opts}get processor(){return this.result.processor}get root(){return this.sync().root}get[Symbol.toStringTag](){return"LazyResult"}};js.registerPostcss=t=>{Ps=t};var Ds=js;js.default=js,Es.registerLazyResult(js),Cs.registerLazyResult(js);let Fs=$o,Us=oo,Bs=vs;const Ws=ki;let zs=class{constructor(t,e,r){let n;e=e.toString(),this.stringified=!1,this._processor=t,this._css=e,this._opts=r,this._map=void 0;let o=Us;this.result=new Ws(this._processor,n,this._opts),this.result.css=e;let i=this;Object.defineProperty(this.result,"root",{get(){return i.root}});let s=new Fs(o,n,this._opts,e);if(s.isMap()){let[t,e]=s.generate();t&&(this.result.css=t),e&&(this.result.map=e)}else s.clearAnnotation(),this.result.css=s.css}async(){return this.error?Promise.reject(this.error):Promise.resolve(this.result)}catch(t){return this.async().catch(t)}finally(t){return this.async().then(t,t)}sync(){if(this.error)throw this.error;return this.result}then(t,e){return this.async().then(t,e)}toString(){return this._css}warnings(){return[]}get content(){return this.result.css}get css(){return this.result.css}get map(){return this.result.map}get messages(){return[]}get opts(){return this.result.opts}get processor(){return this.result.processor}get root(){if(this._root)return this._root;let t,e=Bs;try{t=e(this._css,this._opts)}catch(t){this.error=t}if(this.error)throw this.error;return this._root=t,t}get[Symbol.toStringTag](){return"NoWorkResult"}};var Gs=zs;zs.default=zs;let Vs=Gs,Hs=Ds,Js=vi,qs=ts,Zs=class{constructor(t=[]){this.version="8.4.38",this.plugins=this.normalize(t)}normalize(t){let e=[];for(let r of t)if(!0===r.postcss?r=r():r.postcss&&(r=r.postcss),"object"==typeof r&&Array.isArray(r.plugins))e=e.concat(r.plugins);else if("object"==typeof r&&r.postcssPlugin)e.push(r);else if("function"==typeof r)e.push(r);else{if("object"!=typeof r||!r.parse&&!r.stringify)throw new Error(r+" is not a PostCSS plugin")}return e}process(t,e={}){return this.plugins.length||e.parser||e.stringifier||e.syntax?new Hs(this,t,e):new Vs(this,t,e)}use(t){return this.plugins=this.plugins.concat(this.normalize([t])),this}};var Ys=Zs;Zs.default=Zs,qs.registerProcessor(Zs),Js.registerProcessor(Zs);let Xs=yo,$s=Io,Ks=ti,Qs=Yi,ta=Bo,ea=ts,ra=ss;function na(t,e){if(Array.isArray(t))return t.map((t=>na(t)));let{inputs:r,...n}=t;if(r){e=[];for(let t of r){let r={...t,__proto__:ta.prototype};r.map&&(r.map={...r.map,__proto__:$s.prototype}),e.push(r)}}if(n.nodes&&(n.nodes=t.nodes.map((t=>na(t,e)))),n.source){let{inputId:t,...r}=n.source;n.source=r,null!=t&&(n.source.input=e[t])}if("root"===n.type)return new ea(n);if("decl"===n.type)return new Xs(n);if("rule"===n.type)return new ra(n);if("comment"===n.type)return new Ks(n);if("atrule"===n.type)return new Qs(n);throw new Error("Unknown node type: "+t.type)}var oa=na;na.default=na;let ia=$n,sa=yo,aa=Ds,la=fi,ua=Ys,ca=oo,ha=oa,pa=vi,fa=wi,da=ti,ma=Yi,ya=ki,ga=Bo,va=vs,ba=rs,wa=ss,Sa=ts,xa=po;function ka(...t){return 1===t.length&&Array.isArray(t[0])&&(t=t[0]),new ua(t)}ka.plugin=function(t,e){let r,n=!1;function o(...r){console&&console.warn&&!n&&(n=!0,console.warn(t+": postcss.plugin was deprecated. Migration guide:\nhttps://evilmartians.com/chronicles/postcss-8-plugin-migration"),process.env.LANG&&process.env.LANG.startsWith("cn")&&console.warn(t+": 里面 postcss.plugin 被弃用. 迁移指南:\nhttps://www.w3ctech.com/topic/2226"));let o=e(...r);return o.postcssPlugin=t,o.postcssVersion=(new ua).version,o}return Object.defineProperty(o,"postcss",{get(){return r||(r=o()),r}}),o.process=function(t,e,r){return ka([o(r)]).process(t,e)},o},ka.stringify=ca,ka.parse=va,ka.fromJSON=ha,ka.list=ba,ka.comment=t=>new da(t),ka.atRule=t=>new ma(t),ka.decl=t=>new sa(t),ka.rule=t=>new wa(t),ka.root=t=>new Sa(t),ka.document=t=>new pa(t),ka.CssSyntaxError=ia,ka.Declaration=sa,ka.Container=la,ka.Processor=ua,ka.Document=pa,ka.Comment=da,ka.Warning=fa,ka.AtRule=ma,ka.Result=ya,ka.Input=ga,ka.Rule=wa,ka.Root=Sa,ka.Node=xa,aa.registerPostcss(ka);var Ca=ka;ka.default=ka;const Ia=Wn(Ca);Ia.stringify,Ia.fromJSON,Ia.plugin,Ia.parse,Ia.list,Ia.document,Ia.comment,Ia.atRule,Ia.rule,Ia.decl,Ia.root,Ia.CssSyntaxError,Ia.Declaration,Ia.Container,Ia.Processor,Ia.Document,Ia.Comment,Ia.Warning,Ia.AtRule,Ia.Result,Ia.Input,Ia.Rule,Ia.Root,Ia.Node;class Oa{constructor(...t){Bn(this,"parentElement",null),Bn(this,"parentNode",null),Bn(this,"ownerDocument"),Bn(this,"firstChild",null),Bn(this,"lastChild",null),Bn(this,"previousSibling",null),Bn(this,"nextSibling",null),Bn(this,"ELEMENT_NODE",1),Bn(this,"TEXT_NODE",3),Bn(this,"nodeType"),Bn(this,"nodeName"),Bn(this,"RRNodeType")}get childNodes(){const t=[];let e=this.firstChild;for(;e;)t.push(e),e=e.nextSibling;return t}contains(t){if(!(t instanceof Oa))return!1;if(t.ownerDocument!==this.ownerDocument)return!1;if(t===this)return!0;for(;t.parentNode;){if(t.parentNode===this)return!0;t=t.parentNode}return!1}appendChild(t){throw new Error("RRDomException: Failed to execute 'appendChild' on 'RRNode': This RRNode type does not support this method.")}insertBefore(t,e){throw new Error("RRDomException: Failed to execute 'insertBefore' on 'RRNode': This RRNode type does not support this method.")}removeChild(t){throw new Error("RRDomException: Failed to execute 'removeChild' on 'RRNode': This RRNode type does not support this method.")}toString(){return"RRNode"}}const Ea={Node:["childNodes","parentNode","parentElement","textContent"],ShadowRoot:["host","styleSheets"],Element:["shadowRoot","querySelector","querySelectorAll"],MutationObserver:[]},Ra={Node:["contains","getRootNode"],ShadowRoot:["getSelection"],Element:[],MutationObserver:["constructor"]},Aa={};function Ma(t){if(Aa[t])return Aa[t];const e=globalThis[t],r=e.prototype,n=t in Ea?Ea[t]:void 0,o=Boolean(n&&n.every((t=>{var e,n;return Boolean(null==(n=null==(e=Object.getOwnPropertyDescriptor(r,t))?void 0:e.get)?void 0:n.toString().includes("[native code]"))}))),i=t in Ra?Ra[t]:void 0,s=Boolean(i&&i.every((t=>{var e;return"function"==typeof r[t]&&(null==(e=r[t])?void 0:e.toString().includes("[native code]"))})));if(o&&s&&!globalThis.Zone)return Aa[t]=e.prototype,e.prototype;try{const n=document.createElement("iframe");document.body.appendChild(n);const o=n.contentWindow;if(!o)return e.prototype;const i=o[t].prototype;return document.body.removeChild(n),i?Aa[t]=i:r}catch{return r}}const _a={};function Ta(t,e,r){var n;const o=`${t}.${String(r)}`;if(_a[o])return _a[o].call(e);const i=Ma(t),s=null==(n=Object.getOwnPropertyDescriptor(i,r))?void 0:n.get;return s?(_a[o]=s,s.call(e)):e[r]}const La={};function Na(t,e,r){const n=`${t}.${String(r)}`;if(La[n])return La[n].bind(e);const o=Ma(t)[r];return"function"!=typeof o?e[r]:(La[n]=o,o.bind(e))}function Pa(){return Ma("MutationObserver").constructor}const ja={childNodes:function(t){return Ta("Node",t,"childNodes")},parentNode:function(t){return Ta("Node",t,"parentNode")},parentElement:function(t){return Ta("Node",t,"parentElement")},textContent:function(t){return Ta("Node",t,"textContent")},contains:function(t,e){return Na("Node",t,"contains")(e)},getRootNode:function(t){return Na("Node",t,"getRootNode")()},host:function(t){return t&&"host"in t?Ta("ShadowRoot",t,"host"):null},styleSheets:function(t){return t.styleSheets},shadowRoot:function(t){return t&&"shadowRoot"in t?Ta("Element",t,"shadowRoot"):null},querySelector:function(t,e){return Ta("Element",t,"querySelector")(e)},querySelectorAll:function(t,e){return Ta("Element",t,"querySelectorAll")(e)},mutationObserver:Pa};function Da(t,e,r=document){const n={capture:!0,passive:!0};return r.addEventListener(t,e,n),()=>r.removeEventListener(t,e,n)}const Fa="Please stop import mirror directly. Instead of that,\r\nnow you can use replayer.getMirror() to access the mirror instance of a replayer,\r\nor you can use record.mirror to access the mirror instance during recording.";let Ua={map:{},getId(){return console.error(Fa),-1},getNode(){return console.error(Fa),null},removeNodeFromMap(){console.error(Fa)},has(){return console.error(Fa),!1},reset(){console.error(Fa)}};function Ba(t,e,r={}){let n=null,o=0;return function(...i){const s=Date.now();o||!1!==r.leading||(o=s);const a=e-(s-o),l=this;a<=0||a>e?(n&&(clearTimeout(n),n=null),o=s,t.apply(l,i)):n||!1===r.trailing||(n=setTimeout((()=>{o=!1===r.leading?0:Date.now(),n=null,t.apply(l,i)}),a))}}function Wa(t,e,r,n,o=window){const i=o.Object.getOwnPropertyDescriptor(t,e);return o.Object.defineProperty(t,e,n?r:{set(t){setTimeout((()=>{r.set.call(this,t)}),0),i&&i.set&&i.set.call(this,t)}}),()=>Wa(t,e,i||{},!0)}function za(t,e,r){try{if(!(e in t))return()=>{};const n=t[e],o=r(n);return"function"==typeof o&&(o.prototype=o.prototype||{},Object.defineProperties(o,{__rrweb_original__:{enumerable:!1,value:n}})),t[e]=o,()=>{t[e]=n}}catch{return()=>{}}}"undefined"!=typeof window&&window.Proxy&&window.Reflect&&(Ua=new Proxy(Ua,{get(t,e,r){return"map"===e&&console.error(Fa),Reflect.get(t,e,r)}}));let Ga=Date.now;function Va(t){var e,r,n,o;const i=t.document;return{left:i.scrollingElement?i.scrollingElement.scrollLeft:void 0!==t.pageXOffset?t.pageXOffset:i.documentElement.scrollLeft||(null==i?void 0:i.body)&&(null==(e=ja.parentElement(i.body))?void 0:e.scrollLeft)||(null==(r=null==i?void 0:i.body)?void 0:r.scrollLeft)||0,top:i.scrollingElement?i.scrollingElement.scrollTop:void 0!==t.pageYOffset?t.pageYOffset:(null==i?void 0:i.documentElement.scrollTop)||(null==i?void 0:i.body)&&(null==(n=ja.parentElement(i.body))?void 0:n.scrollTop)||(null==(o=null==i?void 0:i.body)?void 0:o.scrollTop)||0}}function Ha(){return window.innerHeight||document.documentElement&&document.documentElement.clientHeight||document.body&&document.body.clientHeight}function Ja(){return window.innerWidth||document.documentElement&&document.documentElement.clientWidth||document.body&&document.body.clientWidth}function qa(t){if(!t)return null;return t.nodeType===t.ELEMENT_NODE?t:ja.parentElement(t)}function Za(t,e,r,n){if(!t)return!1;const o=qa(t);if(!o)return!1;try{if("string"==typeof e){if(o.classList.contains(e))return!0;if(n&&null!==o.closest("."+e))return!0}else if(Y(o,e,n))return!0}catch(t){}if(r){if(o.matches(r))return!0;if(n&&null!==o.closest(r))return!0}return!1}function Ya(t,e,r){return!("TITLE"!==t.tagName||!r.headTitleMutations)||-2===e.getId(t)}function Xa(t,e){if(b(t))return!1;const r=e.getId(t);if(!e.has(r))return!0;const n=ja.parentNode(t);return(!n||n.nodeType!==t.DOCUMENT_NODE)&&(!n||Xa(n,e))}function $a(t){return Boolean(t.changedTouches)}function Ka(t,e){return Boolean("IFRAME"===t.nodeName&&e.getMeta(t))}function Qa(t,e){return Boolean("LINK"===t.nodeName&&t.nodeType===t.ELEMENT_NODE&&t.getAttribute&&"stylesheet"===t.getAttribute("rel")&&e.getMeta(t))}function tl(t){return!!t&&(t instanceof Oa&&"shadowRoot"in t?Boolean(t.shadowRoot):Boolean(ja.shadowRoot(t)))}/[1-9][0-9]{12}/.test(Date.now().toString())||(Ga=()=>(new Date).getTime());class el{constructor(){i(this,"id",1),i(this,"styleIDMap",new WeakMap),i(this,"idStyleMap",new Map)}getId(t){return this.styleIDMap.get(t)??-1}has(t){return this.styleIDMap.has(t)}add(t,e){if(this.has(t))return this.getId(t);let r;return r=void 0===e?this.id++:e,this.styleIDMap.set(t,r),this.idStyleMap.set(r,t),r}getStyle(t){return this.idStyleMap.get(t)||null}reset(){this.styleIDMap=new WeakMap,this.idStyleMap=new Map,this.id=1}generateId(){return this.id++}}function rl(t){var e;let r=null;return"getRootNode"in t&&(null==(e=ja.getRootNode(t))?void 0:e.nodeType)===Node.DOCUMENT_FRAGMENT_NODE&&ja.host(ja.getRootNode(t))&&(r=ja.host(ja.getRootNode(t))),r}function nl(t){const e=t.ownerDocument;if(!e)return!1;const r=function(t){let e,r=t;for(;e=rl(r);)r=e;return r}(t);return ja.contains(e,r)}function ol(t){const e=t.ownerDocument;return!!e&&(ja.contains(e,t)||nl(t))}var il=(t=>(t[t.DomContentLoaded=0]="DomContentLoaded",t[t.Load=1]="Load",t[t.FullSnapshot=2]="FullSnapshot",t[t.IncrementalSnapshot=3]="IncrementalSnapshot",t[t.Meta=4]="Meta",t[t.Custom=5]="Custom",t[t.Plugin=6]="Plugin",t))(il||{}),sl=(t=>(t[t.Mutation=0]="Mutation",t[t.MouseMove=1]="MouseMove",t[t.MouseInteraction=2]="MouseInteraction",t[t.Scroll=3]="Scroll",t[t.ViewportResize=4]="ViewportResize",t[t.Input=5]="Input",t[t.TouchMove=6]="TouchMove",t[t.MediaInteraction=7]="MediaInteraction",t[t.StyleSheetRule=8]="StyleSheetRule",t[t.CanvasMutation=9]="CanvasMutation",t[t.Font=10]="Font",t[t.Log=11]="Log",t[t.Drag=12]="Drag",t[t.StyleDeclaration=13]="StyleDeclaration",t[t.Selection=14]="Selection",t[t.AdoptedStyleSheet=15]="AdoptedStyleSheet",t[t.CustomElement=16]="CustomElement",t))(sl||{}),al=(t=>(t[t.MouseUp=0]="MouseUp",t[t.MouseDown=1]="MouseDown",t[t.Click=2]="Click",t[t.ContextMenu=3]="ContextMenu",t[t.DblClick=4]="DblClick",t[t.Focus=5]="Focus",t[t.Blur=6]="Blur",t[t.TouchStart=7]="TouchStart",t[t.TouchMove_Departed=8]="TouchMove_Departed",t[t.TouchEnd=9]="TouchEnd",t[t.TouchCancel=10]="TouchCancel",t))(al||{}),ll=(t=>(t[t.Mouse=0]="Mouse",t[t.Pen=1]="Pen",t[t.Touch=2]="Touch",t))(ll||{}),ul=(t=>(t[t["2D"]=0]="2D",t[t.WebGL=1]="WebGL",t[t.WebGL2=2]="WebGL2",t))(ul||{}),cl=(t=>(t[t.Play=0]="Play",t[t.Pause=1]="Pause",t[t.Seeked=2]="Seeked",t[t.VolumeChange=3]="VolumeChange",t[t.RateChange=4]="RateChange",t))(cl||{}),hl=(t=>(t[t.Document=0]="Document",t[t.DocumentType=1]="DocumentType",t[t.Element=2]="Element",t[t.Text=3]="Text",t[t.CDATA=4]="CDATA",t[t.Comment=5]="Comment",t))(hl||{});function pl(t){return"__ln"in t}class fl{constructor(){i(this,"length",0),i(this,"head",null),i(this,"tail",null)}get(t){if(t>=this.length)throw new Error("Position outside of list range");let e=this.head;for(let r=0;r<t;r++)e=(null==e?void 0:e.next)||null;return e}addNode(t){const e={value:t,previous:null,next:null};if(t.__ln=e,t.previousSibling&&pl(t.previousSibling)){const r=t.previousSibling.__ln.next;e.next=r,e.previous=t.previousSibling.__ln,t.previousSibling.__ln.next=e,r&&(r.previous=e)}else if(t.nextSibling&&pl(t.nextSibling)&&t.nextSibling.__ln.previous){const r=t.nextSibling.__ln.previous;e.previous=r,e.next=t.nextSibling.__ln,t.nextSibling.__ln.previous=e,r&&(r.next=e)}else this.head&&(this.head.previous=e),e.next=this.head,this.head=e;null===e.next&&(this.tail=e),this.length++}removeNode(t){const e=t.__ln;this.head&&(e.previous?(e.previous.next=e.next,e.next?e.next.previous=e.previous:this.tail=e.previous):(this.head=e.next,this.head?this.head.previous=null:this.tail=null),t.__ln&&delete t.__ln,this.length--)}}const dl=(t,e)=>`${t}@${e}`;class ml{constructor(){i(this,"frozen",!1),i(this,"locked",!1),i(this,"texts",[]),i(this,"attributes",[]),i(this,"attributeMap",new WeakMap),i(this,"removes",[]),i(this,"mapRemoves",[]),i(this,"movedMap",{}),i(this,"addedSet",new Set),i(this,"movedSet",new Set),i(this,"droppedSet",new Set),i(this,"removesSubTreeCache",new Set),i(this,"mutationCb"),i(this,"blockClass"),i(this,"blockSelector"),i(this,"maskTextClass"),i(this,"maskTextSelector"),i(this,"inlineStylesheet"),i(this,"maskInputOptions"),i(this,"maskTextFn"),i(this,"maskInputFn"),i(this,"keepIframeSrcFn"),i(this,"recordCanvas"),i(this,"inlineImages"),i(this,"slimDOMOptions"),i(this,"dataURLOptions"),i(this,"doc"),i(this,"mirror"),i(this,"iframeManager"),i(this,"stylesheetManager"),i(this,"shadowDomManager"),i(this,"canvasManager"),i(this,"processedNodeManager"),i(this,"unattachedDoc"),i(this,"processMutations",(t=>{t.forEach(this.processMutation),this.emit()})),i(this,"emit",(()=>{if(this.frozen||this.locked)return;const t=[],e=new Set,r=new fl,n=t=>{let e=t,r=-2;for(;-2===r;)e=e&&e.nextSibling,r=e&&this.mirror.getId(e);return r},o=o=>{const i=ja.parentNode(o);if(!i||!ol(o))return;let s=!1;if(o.nodeType===Node.TEXT_NODE){const t=i.tagName;if("TEXTAREA"===t)return;"STYLE"===t&&this.addedSet.has(i)&&(s=!0)}const a=b(i)?this.mirror.getId(rl(o)):this.mirror.getId(i),l=n(o);if(-1===a||-1===l)return r.addNode(o);const u=Q(o,{doc:this.doc,mirror:this.mirror,blockClass:this.blockClass,blockSelector:this.blockSelector,maskTextClass:this.maskTextClass,maskTextSelector:this.maskTextSelector,skipChild:!0,newlyAddedElement:!0,inlineStylesheet:this.inlineStylesheet,maskInputOptions:this.maskInputOptions,maskTextFn:this.maskTextFn,maskInputFn:this.maskInputFn,slimDOMOptions:this.slimDOMOptions,dataURLOptions:this.dataURLOptions,recordCanvas:this.recordCanvas,inlineImages:this.inlineImages,onSerialize:t=>{Ka(t,this.mirror)&&this.iframeManager.addIframe(t),Qa(t,this.mirror)&&this.stylesheetManager.trackLinkElement(t),tl(o)&&this.shadowDomManager.addShadowRoot(ja.shadowRoot(o),this.doc)},onIframeLoad:(t,e)=>{this.iframeManager.attachIframe(t,e),this.shadowDomManager.observeAttachShadow(t)},onStylesheetLoad:(t,e)=>{this.stylesheetManager.attachLinkElement(t,e)},cssCaptured:s});u&&(t.push({parentId:a,nextId:l,node:u}),e.add(u.id))};for(;this.mapRemoves.length;)this.mirror.removeNodeFromMap(this.mapRemoves.shift());for(const t of this.movedSet)gl(this.removesSubTreeCache,t,this.mirror)&&!this.movedSet.has(ja.parentNode(t))||o(t);for(const t of this.addedSet)vl(this.droppedSet,t)||gl(this.removesSubTreeCache,t,this.mirror)?vl(this.movedSet,t)?o(t):this.droppedSet.add(t):o(t);let i=null;for(;r.length;){let t=null;if(i){const e=this.mirror.getId(ja.parentNode(i.value)),r=n(i.value);-1!==e&&-1!==r&&(t=i)}if(!t){let e=r.tail;for(;e;){const r=e;if(e=e.previous,r){const e=this.mirror.getId(ja.parentNode(r.value));if(-1===n(r.value))continue;if(-1!==e){t=r;break}{const e=r.value,n=ja.parentNode(e);if(n&&n.nodeType===Node.DOCUMENT_FRAGMENT_NODE){const e=ja.host(n);if(-1!==this.mirror.getId(e)){t=r;break}}}}}}if(!t){for(;r.head;)r.removeNode(r.head.value);break}i=t.previous,r.removeNode(t.value),o(t.value)}const s={texts:this.texts.map((t=>{const e=t.node,r=ja.parentNode(e);return r&&"TEXTAREA"===r.tagName&&this.genTextAreaValueMutation(r),{id:this.mirror.getId(e),value:t.value}})).filter((t=>!e.has(t.id))).filter((t=>this.mirror.has(t.id))),attributes:this.attributes.map((t=>{const{attributes:e}=t;if("string"==typeof e.style){const r=JSON.stringify(t.styleDiff),n=JSON.stringify(t._unchangedStyles);r.length<e.style.length&&(r+n).split("var(").length===e.style.split("var(").length&&(e.style=t.styleDiff)}return{id:this.mirror.getId(t.node),attributes:e}})).filter((t=>!e.has(t.id))).filter((t=>this.mirror.has(t.id))),removes:this.removes,adds:t};(s.texts.length||s.attributes.length||s.removes.length||s.adds.length)&&(this.texts=[],this.attributes=[],this.attributeMap=new WeakMap,this.removes=[],this.addedSet=new Set,this.movedSet=new Set,this.droppedSet=new Set,this.removesSubTreeCache=new Set,this.movedMap={},this.mutationCb(s))})),i(this,"genTextAreaValueMutation",(t=>{let e=this.attributeMap.get(t);e||(e={node:t,attributes:{},styleDiff:{},_unchangedStyles:{}},this.attributes.push(e),this.attributeMap.set(t,e)),e.attributes.value=Array.from(ja.childNodes(t),(t=>ja.textContent(t)||"")).join("")})),i(this,"processMutation",(t=>{if(!Ya(t.target,this.mirror,this.slimDOMOptions))switch(t.type){case"characterData":{const e=ja.textContent(t.target);Za(t.target,this.blockClass,this.blockSelector,!1)||e===t.oldValue||this.texts.push({value:X(t.target,this.maskTextClass,this.maskTextSelector,!0)&&e?this.maskTextFn?this.maskTextFn(e,qa(t.target)):e.replace(/[\S]/g,"*"):e,node:t.target});break}case"attributes":{const e=t.target;let r=t.attributeName,n=t.target.getAttribute(r);if("value"===r){const t=E(e);n=C({element:e,maskInputOptions:this.maskInputOptions,tagName:e.tagName,type:t,value:n,maskInputFn:this.maskInputFn})}if(Za(t.target,this.blockClass,this.blockSelector,!1)||n===t.oldValue)return;let o=this.attributeMap.get(t.target);if("IFRAME"===e.tagName&&"src"===r&&!this.keepIframeSrcFn(n)){if(e.contentDocument)return;r="rr_src"}if(o||(o={node:t.target,attributes:{},styleDiff:{},_unchangedStyles:{}},this.attributes.push(o),this.attributeMap.set(t.target,o)),"type"===r&&"INPUT"===e.tagName&&"password"===(t.oldValue||"").toLowerCase()&&e.setAttribute("data-rr-is-password","true"),!Z(e.tagName,r))if(o.attributes[r]=q(this.doc,I(e.tagName),I(r),n),"style"===r){if(!this.unattachedDoc)try{this.unattachedDoc=document.implementation.createHTMLDocument()}catch(t){this.unattachedDoc=this.doc}const r=this.unattachedDoc.createElement("span");t.oldValue&&r.setAttribute("style",t.oldValue);for(const t of Array.from(e.style)){const n=e.style.getPropertyValue(t),i=e.style.getPropertyPriority(t);n!==r.style.getPropertyValue(t)||i!==r.style.getPropertyPriority(t)?o.styleDiff[t]=""===i?n:[n,i]:o._unchangedStyles[t]=[n,i]}for(const t of Array.from(r.style))""===e.style.getPropertyValue(t)&&(o.styleDiff[t]=!1)}else"open"===r&&"DIALOG"===e.tagName&&(e.matches("dialog:modal")?o.attributes.rr_open_mode="modal":o.attributes.rr_open_mode="non-modal");break}case"childList":if(Za(t.target,this.blockClass,this.blockSelector,!0))return;if("TEXTAREA"===t.target.tagName)return void this.genTextAreaValueMutation(t.target);t.addedNodes.forEach((e=>this.genAdds(e,t.target))),t.removedNodes.forEach((e=>{const r=this.mirror.getId(e),n=b(t.target)?this.mirror.getId(ja.host(t.target)):this.mirror.getId(t.target);Za(t.target,this.blockClass,this.blockSelector,!1)||Ya(e,this.mirror,this.slimDOMOptions)||!function(t,e){return-1!==e.getId(t)}(e,this.mirror)||(this.addedSet.has(e)?(yl(this.addedSet,e),this.droppedSet.add(e)):this.addedSet.has(t.target)&&-1===r||Xa(t.target,this.mirror)||(this.movedSet.has(e)&&this.movedMap[dl(r,n)]?yl(this.movedSet,e):(this.removes.push({parentId:n,id:r,isShadow:!(!b(t.target)||!w(t.target))||void 0}),function(t,e){const r=[t];for(;r.length;){const t=r.pop();e.has(t)||(e.add(t),ja.childNodes(t).forEach((t=>r.push(t))))}}(e,this.removesSubTreeCache))),this.mapRemoves.push(e))}))}})),i(this,"genAdds",((t,e)=>{if(!this.processedNodeManager.inOtherBuffer(t,this)&&!this.addedSet.has(t)&&!this.movedSet.has(t)){if(this.mirror.hasNode(t)){if(Ya(t,this.mirror,this.slimDOMOptions))return;this.movedSet.add(t);let r=null;e&&this.mirror.hasNode(e)&&(r=this.mirror.getId(e)),r&&-1!==r&&(this.movedMap[dl(this.mirror.getId(t),r)]=!0)}else this.addedSet.add(t),this.droppedSet.delete(t);Za(t,this.blockClass,this.blockSelector,!1)||(ja.childNodes(t).forEach((t=>this.genAdds(t))),tl(t)&&ja.childNodes(ja.shadowRoot(t)).forEach((e=>{this.processedNodeManager.add(e,this),this.genAdds(e,t)})))}}))}init(t){["mutationCb","blockClass","blockSelector","maskTextClass","maskTextSelector","inlineStylesheet","maskInputOptions","maskTextFn","maskInputFn","keepIframeSrcFn","recordCanvas","inlineImages","slimDOMOptions","dataURLOptions","doc","mirror","iframeManager","stylesheetManager","shadowDomManager","canvasManager","processedNodeManager"].forEach((e=>{this[e]=t[e]}))}freeze(){this.frozen=!0,this.canvasManager.freeze()}unfreeze(){this.frozen=!1,this.canvasManager.unfreeze(),this.emit()}isFrozen(){return this.frozen}lock(){this.locked=!0,this.canvasManager.lock()}unlock(){this.locked=!1,this.canvasManager.unlock(),this.emit()}reset(){this.shadowDomManager.reset(),this.canvasManager.reset()}}function yl(t,e){t.delete(e),ja.childNodes(e).forEach((e=>yl(t,e)))}function gl(t,e,r){return 0!==t.size&&function(t,e){const r=ja.parentNode(e);return!!r&&t.has(r)}(t,e)}function vl(t,e){return 0!==t.size&&bl(t,e)}function bl(t,e){const r=ja.parentNode(e);return!!r&&(!!t.has(r)||bl(t,r))}let wl;const Sl=t=>{if(!wl)return t;return(...e)=>{try{return t(...e)}catch(t){if(wl&&!0===wl(t))return;throw t}}},xl=[];function kl(t){try{if("composedPath"in t){const e=t.composedPath();if(e.length)return e[0]}else if("path"in t&&t.path.length)return t.path[0]}catch{}return t&&t.target}function Cl(t,e){const r=new ml;xl.push(r),r.init(t);const n=new(Pa())(Sl(r.processMutations.bind(r)));return n.observe(e,{attributes:!0,attributeOldValue:!0,characterData:!0,characterDataOldValue:!0,childList:!0,subtree:!0}),n}function Il({mouseInteractionCb:t,doc:e,mirror:r,blockClass:n,blockSelector:o,sampling:i}){if(!1===i.mouseInteraction)return()=>{};const s=!0===i.mouseInteraction||void 0===i.mouseInteraction?{}:i.mouseInteraction,a=[];let l=null;return Object.keys(al).filter((t=>Number.isNaN(Number(t))&&!t.endsWith("_Departed")&&!1!==s[t])).forEach((i=>{let s=I(i);const u=(e=>i=>{const s=kl(i);if(Za(s,n,o,!0))return;let a=null,u=e;if("pointerType"in i){switch(i.pointerType){case"mouse":a=ll.Mouse;break;case"touch":a=ll.Touch;break;case"pen":a=ll.Pen}a===ll.Touch?al[e]===al.MouseDown?u="TouchStart":al[e]===al.MouseUp&&(u="TouchEnd"):ll.Pen}else $a(i)&&(a=ll.Touch);null!==a?(l=a,(u.startsWith("Touch")&&a===ll.Touch||u.startsWith("Mouse")&&a===ll.Mouse)&&(a=null)):al[e]===al.Click&&(a=l,l=null);const c=$a(i)?i.changedTouches[0]:i;if(!c)return;const h=r.getId(s),{clientX:p,clientY:f}=c;Sl(t)({type:al[u],id:h,x:p,y:f,...null!==a&&{pointerType:a}})})(i);if(window.PointerEvent)switch(al[i]){case al.MouseDown:case al.MouseUp:s=s.replace("mouse","pointer");break;case al.TouchStart:case al.TouchEnd:return}a.push(Da(s,u,e))})),Sl((()=>{a.forEach((t=>t()))}))}function Ol({scrollCb:t,doc:e,mirror:r,blockClass:n,blockSelector:o,sampling:i}){return Da("scroll",Sl(Ba(Sl((i=>{const s=kl(i);if(!s||Za(s,n,o,!0))return;const a=r.getId(s);if(s===e&&e.defaultView){const r=Va(e.defaultView);t({id:a,x:r.left,y:r.top})}else t({id:a,x:s.scrollLeft,y:s.scrollTop})})),i.scroll||100)),e)}const El=["INPUT","TEXTAREA","SELECT"],Rl=new WeakMap;function Al(t){return function(t,e){if(Ll("CSSGroupingRule")&&t.parentRule instanceof CSSGroupingRule||Ll("CSSMediaRule")&&t.parentRule instanceof CSSMediaRule||Ll("CSSSupportsRule")&&t.parentRule instanceof CSSSupportsRule||Ll("CSSConditionRule")&&t.parentRule instanceof CSSConditionRule){const r=Array.from(t.parentRule.cssRules).indexOf(t);e.unshift(r)}else if(t.parentStyleSheet){const r=Array.from(t.parentStyleSheet.cssRules).indexOf(t);e.unshift(r)}return e}(t,[])}function Ml(t,e,r){let n,o;return t?(t.ownerNode?n=e.getId(t.ownerNode):o=r.getId(t),{styleId:o,id:n}):{}}function _l({mirror:t,stylesheetManager:e},r){var n,o,i;let s=null;s="#document"===r.nodeName?t.getId(r):t.getId(ja.host(r));const a="#document"===r.nodeName?null==(n=r.defaultView)?void 0:n.Document:null==(i=null==(o=r.ownerDocument)?void 0:o.defaultView)?void 0:i.ShadowRoot,l=(null==a?void 0:a.prototype)?Object.getOwnPropertyDescriptor(null==a?void 0:a.prototype,"adoptedStyleSheets"):void 0;return null!==s&&-1!==s&&a&&l?(Object.defineProperty(r,"adoptedStyleSheets",{configurable:l.configurable,enumerable:l.enumerable,get(){var t;return null==(t=l.get)?void 0:t.call(this)},set(t){var r;const n=null==(r=l.set)?void 0:r.call(this,t);if(null!==s&&-1!==s)try{e.adoptStyleSheets(t,s)}catch(t){}return n}}),Sl((()=>{Object.defineProperty(r,"adoptedStyleSheets",{configurable:l.configurable,enumerable:l.enumerable,get:l.get,set:l.set})}))):()=>{}}function Tl(t,e={}){const r=t.doc.defaultView;if(!r)return()=>{};let n;!function(t,e){const{mutationCb:r,mousemoveCb:n,mouseInteractionCb:o,scrollCb:i,viewportResizeCb:s,inputCb:a,mediaInteractionCb:l,styleSheetRuleCb:u,styleDeclarationCb:c,canvasMutationCb:h,fontCb:p,selectionCb:f,customElementCb:d}=t;t.mutationCb=(...t)=>{e.mutation&&e.mutation(...t),r(...t)},t.mousemoveCb=(...t)=>{e.mousemove&&e.mousemove(...t),n(...t)},t.mouseInteractionCb=(...t)=>{e.mouseInteraction&&e.mouseInteraction(...t),o(...t)},t.scrollCb=(...t)=>{e.scroll&&e.scroll(...t),i(...t)},t.viewportResizeCb=(...t)=>{e.viewportResize&&e.viewportResize(...t),s(...t)},t.inputCb=(...t)=>{e.input&&e.input(...t),a(...t)},t.mediaInteractionCb=(...t)=>{e.mediaInteaction&&e.mediaInteaction(...t),l(...t)},t.styleSheetRuleCb=(...t)=>{e.styleSheetRule&&e.styleSheetRule(...t),u(...t)},t.styleDeclarationCb=(...t)=>{e.styleDeclaration&&e.styleDeclaration(...t),c(...t)},t.canvasMutationCb=(...t)=>{e.canvasMutation&&e.canvasMutation(...t),h(...t)},t.fontCb=(...t)=>{e.font&&e.font(...t),p(...t)},t.selectionCb=(...t)=>{e.selection&&e.selection(...t),f(...t)},t.customElementCb=(...t)=>{e.customElement&&e.customElement(...t),d(...t)}}(t,e),t.recordDOM&&(n=Cl(t,t.doc));const o=function({mousemoveCb:t,sampling:e,doc:r,mirror:n}){if(!1===e.mousemove)return()=>{};const o="number"==typeof e.mousemove?e.mousemove:50,i="number"==typeof e.mousemoveCallback?e.mousemoveCallback:500;let s,a=[];const l=Ba(Sl((e=>{const r=Date.now()-s;t(a.map((t=>(t.timeOffset-=r,t))),e),a=[],s=null})),i),u=Sl(Ba(Sl((t=>{const e=kl(t),{clientX:r,clientY:o}=$a(t)?t.changedTouches[0]:t;s||(s=Ga()),a.push({x:r,y:o,id:n.getId(e),timeOffset:Ga()-s}),l("undefined"!=typeof DragEvent&&t instanceof DragEvent?sl.Drag:t instanceof MouseEvent?sl.MouseMove:sl.TouchMove)})),o,{trailing:!1})),c=[Da("mousemove",u,r),Da("touchmove",u,r),Da("drag",u,r)];return Sl((()=>{c.forEach((t=>t()))}))}(t),i=Il(t),s=Ol(t),a=function({viewportResizeCb:t},{win:e}){let r=-1,n=-1;return Da("resize",Sl(Ba(Sl((()=>{const e=Ha(),o=Ja();r===e&&n===o||(t({width:Number(o),height:Number(e)}),r=e,n=o)})),200)),e)}(t,{win:r}),l=function({inputCb:t,doc:e,mirror:r,blockClass:n,blockSelector:o,ignoreClass:i,ignoreSelector:s,maskInputOptions:a,maskInputFn:l,sampling:u,userTriggeredOnInput:c}){function h(t){let r=kl(t);const u=t.isTrusted,h=r&&r.tagName;if(r&&"OPTION"===h&&(r=ja.parentElement(r)),!r||!h||El.indexOf(h)<0||Za(r,n,o,!0))return;if(r.classList.contains(i)||s&&r.matches(s))return;let f=r.value,d=!1;const m=E(r)||"";"radio"===m||"checkbox"===m?d=r.checked:(a[h.toLowerCase()]||a[m])&&(f=C({element:r,maskInputOptions:a,tagName:h,type:m,value:f,maskInputFn:l})),p(r,c?{text:f,isChecked:d,userTriggered:u}:{text:f,isChecked:d});const y=r.name;"radio"===m&&y&&d&&e.querySelectorAll(`input[type="radio"][name="${y}"]`).forEach((t=>{if(t!==r){const e=t.value;p(t,c?{text:e,isChecked:!d,userTriggered:!1}:{text:e,isChecked:!d})}}))}function p(e,n){const o=Rl.get(e);if(!o||o.text!==n.text||o.isChecked!==n.isChecked){Rl.set(e,n);const o=r.getId(e);Sl(t)({...n,id:o})}}const f=("last"===u.input?["change"]:["input","change"]).map((t=>Da(t,Sl(h),e))),d=e.defaultView;if(!d)return()=>{f.forEach((t=>t()))};const m=d.Object.getOwnPropertyDescriptor(d.HTMLInputElement.prototype,"value"),y=[[d.HTMLInputElement.prototype,"value"],[d.HTMLInputElement.prototype,"checked"],[d.HTMLSelectElement.prototype,"value"],[d.HTMLTextAreaElement.prototype,"value"],[d.HTMLSelectElement.prototype,"selectedIndex"],[d.HTMLOptionElement.prototype,"selected"]];return m&&m.set&&f.push(...y.map((t=>Wa(t[0],t[1],{set(){Sl(h)({target:this,isTrusted:!1})}},!1,d)))),Sl((()=>{f.forEach((t=>t()))}))}(t),u=function({mediaInteractionCb:t,blockClass:e,blockSelector:r,mirror:n,sampling:o,doc:i}){const s=Sl((i=>Ba(Sl((o=>{const s=kl(o);if(!s||Za(s,e,r,!0))return;const{currentTime:a,volume:l,muted:u,playbackRate:c,loop:h}=s;t({type:i,id:n.getId(s),currentTime:a,volume:l,muted:u,playbackRate:c,loop:h})})),o.media||500))),a=[Da("play",s(cl.Play),i),Da("pause",s(cl.Pause),i),Da("seeked",s(cl.Seeked),i),Da("volumechange",s(cl.VolumeChange),i),Da("ratechange",s(cl.RateChange),i)];return Sl((()=>{a.forEach((t=>t()))}))}(t);let c=()=>{},h=()=>{},p=()=>{},f=()=>{};t.recordDOM&&(c=function({styleSheetRuleCb:t,mirror:e,stylesheetManager:r},{win:n}){if(!n.CSSStyleSheet||!n.CSSStyleSheet.prototype)return()=>{};const o=n.CSSStyleSheet.prototype.insertRule;n.CSSStyleSheet.prototype.insertRule=new Proxy(o,{apply:Sl(((n,o,i)=>{const[s,a]=i,{id:l,styleId:u}=Ml(o,e,r.styleMirror);return(l&&-1!==l||u&&-1!==u)&&t({id:l,styleId:u,adds:[{rule:s,index:a}]}),n.apply(o,i)}))}),n.CSSStyleSheet.prototype.addRule=function(t,e,r=this.cssRules.length){const o=`${t} { ${e} }`;return n.CSSStyleSheet.prototype.insertRule.apply(this,[o,r])};const i=n.CSSStyleSheet.prototype.deleteRule;let s,a;n.CSSStyleSheet.prototype.deleteRule=new Proxy(i,{apply:Sl(((n,o,i)=>{const[s]=i,{id:a,styleId:l}=Ml(o,e,r.styleMirror);return(a&&-1!==a||l&&-1!==l)&&t({id:a,styleId:l,removes:[{index:s}]}),n.apply(o,i)}))}),n.CSSStyleSheet.prototype.removeRule=function(t){return n.CSSStyleSheet.prototype.deleteRule.apply(this,[t])},n.CSSStyleSheet.prototype.replace&&(s=n.CSSStyleSheet.prototype.replace,n.CSSStyleSheet.prototype.replace=new Proxy(s,{apply:Sl(((n,o,i)=>{const[s]=i,{id:a,styleId:l}=Ml(o,e,r.styleMirror);return(a&&-1!==a||l&&-1!==l)&&t({id:a,styleId:l,replace:s}),n.apply(o,i)}))})),n.CSSStyleSheet.prototype.replaceSync&&(a=n.CSSStyleSheet.prototype.replaceSync,n.CSSStyleSheet.prototype.replaceSync=new Proxy(a,{apply:Sl(((n,o,i)=>{const[s]=i,{id:a,styleId:l}=Ml(o,e,r.styleMirror);return(a&&-1!==a||l&&-1!==l)&&t({id:a,styleId:l,replaceSync:s}),n.apply(o,i)}))}));const l={};Nl("CSSGroupingRule")?l.CSSGroupingRule=n.CSSGroupingRule:(Nl("CSSMediaRule")&&(l.CSSMediaRule=n.CSSMediaRule),Nl("CSSConditionRule")&&(l.CSSConditionRule=n.CSSConditionRule),Nl("CSSSupportsRule")&&(l.CSSSupportsRule=n.CSSSupportsRule));const u={};return Object.entries(l).forEach((([n,o])=>{u[n]={insertRule:o.prototype.insertRule,deleteRule:o.prototype.deleteRule},o.prototype.insertRule=new Proxy(u[n].insertRule,{apply:Sl(((n,o,i)=>{const[s,a]=i,{id:l,styleId:u}=Ml(o.parentStyleSheet,e,r.styleMirror);return(l&&-1!==l||u&&-1!==u)&&t({id:l,styleId:u,adds:[{rule:s,index:[...Al(o),a||0]}]}),n.apply(o,i)}))}),o.prototype.deleteRule=new Proxy(u[n].deleteRule,{apply:Sl(((n,o,i)=>{const[s]=i,{id:a,styleId:l}=Ml(o.parentStyleSheet,e,r.styleMirror);return(a&&-1!==a||l&&-1!==l)&&t({id:a,styleId:l,removes:[{index:[...Al(o),s]}]}),n.apply(o,i)}))})})),Sl((()=>{n.CSSStyleSheet.prototype.insertRule=o,n.CSSStyleSheet.prototype.deleteRule=i,s&&(n.CSSStyleSheet.prototype.replace=s),a&&(n.CSSStyleSheet.prototype.replaceSync=a),Object.entries(l).forEach((([t,e])=>{e.prototype.insertRule=u[t].insertRule,e.prototype.deleteRule=u[t].deleteRule}))}))}(t,{win:r}),h=_l(t,t.doc),p=function({styleDeclarationCb:t,mirror:e,ignoreCSSAttributes:r,stylesheetManager:n},{win:o}){const i=o.CSSStyleDeclaration.prototype.setProperty;o.CSSStyleDeclaration.prototype.setProperty=new Proxy(i,{apply:Sl(((o,s,a)=>{var l;const[u,c,h]=a;if(r.has(u))return i.apply(s,[u,c,h]);const{id:p,styleId:f}=Ml(null==(l=s.parentRule)?void 0:l.parentStyleSheet,e,n.styleMirror);return(p&&-1!==p||f&&-1!==f)&&t({id:p,styleId:f,set:{property:u,value:c,priority:h},index:Al(s.parentRule)}),o.apply(s,a)}))});const s=o.CSSStyleDeclaration.prototype.removeProperty;return o.CSSStyleDeclaration.prototype.removeProperty=new Proxy(s,{apply:Sl(((o,i,a)=>{var l;const[u]=a;if(r.has(u))return s.apply(i,[u]);const{id:c,styleId:h}=Ml(null==(l=i.parentRule)?void 0:l.parentStyleSheet,e,n.styleMirror);return(c&&-1!==c||h&&-1!==h)&&t({id:c,styleId:h,remove:{property:u},index:Al(i.parentRule)}),o.apply(i,a)}))}),Sl((()=>{o.CSSStyleDeclaration.prototype.setProperty=i,o.CSSStyleDeclaration.prototype.removeProperty=s}))}(t,{win:r}),t.collectFonts&&(f=function({fontCb:t,doc:e}){const r=e.defaultView;if(!r)return()=>{};const n=[],o=new WeakMap,i=r.FontFace;r.FontFace=function(t,e,r){const n=new i(t,e,r);return o.set(n,{family:t,buffer:"string"!=typeof e,descriptors:r,fontSource:"string"==typeof e?e:JSON.stringify(Array.from(new Uint8Array(e)))}),n};const s=za(e.fonts,"add",(function(e){return function(r){return setTimeout(Sl((()=>{const e=o.get(r);e&&(t(e),o.delete(r))})),0),e.apply(this,[r])}}));return n.push((()=>{r.FontFace=i})),n.push(s),Sl((()=>{n.forEach((t=>t()))}))}(t)));const d=function(t){const{doc:e,mirror:r,blockClass:n,blockSelector:o,selectionCb:i}=t;let s=!0;const a=Sl((()=>{const t=e.getSelection();if(!t||s&&(null==t?void 0:t.isCollapsed))return;s=t.isCollapsed||!1;const a=[],l=t.rangeCount||0;for(let e=0;e<l;e++){const i=t.getRangeAt(e),{startContainer:s,startOffset:l,endContainer:u,endOffset:c}=i;Za(s,n,o,!0)||Za(u,n,o,!0)||a.push({start:r.getId(s),startOffset:l,end:r.getId(u),endOffset:c})}i({ranges:a})}));return a(),Da("selectionchange",a)}(t),m=function({doc:t,customElementCb:e}){const r=t.defaultView;return r&&r.customElements?za(r.customElements,"define",(function(t){return function(r,n,o){try{e({define:{name:r}})}catch(t){console.warn(`Custom element callback failed for ${r}`)}return t.apply(this,[r,n,o])}})):()=>{}}(t),y=[];for(const e of t.plugins)y.push(e.observer(e.callback,r,e.options));return Sl((()=>{xl.forEach((t=>t.reset())),null==n||n.disconnect(),o(),i(),s(),a(),l(),u(),c(),h(),p(),f(),d(),m(),y.forEach((t=>t()))}))}function Ll(t){return void 0!==window[t]}function Nl(t){return Boolean(void 0!==window[t]&&window[t].prototype&&"insertRule"in window[t].prototype&&"deleteRule"in window[t].prototype)}class Pl{constructor(t){i(this,"iframeIdToRemoteIdMap",new WeakMap),i(this,"iframeRemoteIdToIdMap",new WeakMap),this.generateIdFn=t}getId(t,e,r,n){const o=r||this.getIdToRemoteIdMap(t),i=n||this.getRemoteIdToIdMap(t);let s=o.get(e);return s||(s=this.generateIdFn(),o.set(e,s),i.set(s,e)),s}getIds(t,e){const r=this.getIdToRemoteIdMap(t),n=this.getRemoteIdToIdMap(t);return e.map((e=>this.getId(t,e,r,n)))}getRemoteId(t,e,r){const n=r||this.getRemoteIdToIdMap(t);if("number"!=typeof e)return e;const o=n.get(e);return o||-1}getRemoteIds(t,e){const r=this.getRemoteIdToIdMap(t);return e.map((e=>this.getRemoteId(t,e,r)))}reset(t){if(!t)return this.iframeIdToRemoteIdMap=new WeakMap,void(this.iframeRemoteIdToIdMap=new WeakMap);this.iframeIdToRemoteIdMap.delete(t),this.iframeRemoteIdToIdMap.delete(t)}getIdToRemoteIdMap(t){let e=this.iframeIdToRemoteIdMap.get(t);return e||(e=new Map,this.iframeIdToRemoteIdMap.set(t,e)),e}getRemoteIdToIdMap(t){let e=this.iframeRemoteIdToIdMap.get(t);return e||(e=new Map,this.iframeRemoteIdToIdMap.set(t,e)),e}}class jl{constructor(t){i(this,"iframes",new WeakMap),i(this,"crossOriginIframeMap",new WeakMap),i(this,"crossOriginIframeMirror",new Pl(F)),i(this,"crossOriginIframeStyleMirror"),i(this,"crossOriginIframeRootIdMap",new WeakMap),i(this,"mirror"),i(this,"mutationCb"),i(this,"wrappedEmit"),i(this,"loadListener"),i(this,"stylesheetManager"),i(this,"recordCrossOriginIframes"),this.mutationCb=t.mutationCb,this.wrappedEmit=t.wrappedEmit,this.stylesheetManager=t.stylesheetManager,this.recordCrossOriginIframes=t.recordCrossOriginIframes,this.crossOriginIframeStyleMirror=new Pl(this.stylesheetManager.styleMirror.generateId.bind(this.stylesheetManager.styleMirror)),this.mirror=t.mirror,this.recordCrossOriginIframes&&window.addEventListener("message",this.handleMessage.bind(this))}addIframe(t){this.iframes.set(t,!0),t.contentWindow&&this.crossOriginIframeMap.set(t.contentWindow,t)}addLoadListener(t){this.loadListener=t}attachIframe(t,e){var r,n;this.mutationCb({adds:[{parentId:this.mirror.getId(t),nextId:null,node:e}],removes:[],texts:[],attributes:[],isAttachIframe:!0}),this.recordCrossOriginIframes&&(null==(r=t.contentWindow)||r.addEventListener("message",this.handleMessage.bind(this))),null==(n=this.loadListener)||n.call(this,t),t.contentDocument&&t.contentDocument.adoptedStyleSheets&&t.contentDocument.adoptedStyleSheets.length>0&&this.stylesheetManager.adoptStyleSheets(t.contentDocument.adoptedStyleSheets,this.mirror.getId(t.contentDocument))}handleMessage(t){const e=t;if("rrweb"!==e.data.type||e.origin!==e.data.origin)return;if(!t.source)return;const r=this.crossOriginIframeMap.get(t.source);if(!r)return;const n=this.transformCrossOriginEvent(r,e.data.event);n&&this.wrappedEmit(n,e.data.isCheckout)}transformCrossOriginEvent(t,e){var r;switch(e.type){case il.FullSnapshot:{this.crossOriginIframeMirror.reset(t),this.crossOriginIframeStyleMirror.reset(t),this.replaceIdOnNode(e.data.node,t);const r=e.data.node.id;return this.crossOriginIframeRootIdMap.set(t,r),this.patchRootIdOnNode(e.data.node,r),{timestamp:e.timestamp,type:il.IncrementalSnapshot,data:{source:sl.Mutation,adds:[{parentId:this.mirror.getId(t),nextId:null,node:e.data.node}],removes:[],texts:[],attributes:[],isAttachIframe:!0}}}case il.Meta:case il.Load:case il.DomContentLoaded:return!1;case il.Plugin:return e;case il.Custom:return this.replaceIds(e.data.payload,t,["id","parentId","previousId","nextId"]),e;case il.IncrementalSnapshot:switch(e.data.source){case sl.Mutation:return e.data.adds.forEach((e=>{this.replaceIds(e,t,["parentId","nextId","previousId"]),this.replaceIdOnNode(e.node,t);const r=this.crossOriginIframeRootIdMap.get(t);r&&this.patchRootIdOnNode(e.node,r)})),e.data.removes.forEach((e=>{this.replaceIds(e,t,["parentId","id"])})),e.data.attributes.forEach((e=>{this.replaceIds(e,t,["id"])})),e.data.texts.forEach((e=>{this.replaceIds(e,t,["id"])})),e;case sl.Drag:case sl.TouchMove:case sl.MouseMove:return e.data.positions.forEach((e=>{this.replaceIds(e,t,["id"])})),e;case sl.ViewportResize:return!1;case sl.MediaInteraction:case sl.MouseInteraction:case sl.Scroll:case sl.CanvasMutation:case sl.Input:return this.replaceIds(e.data,t,["id"]),e;case sl.StyleSheetRule:case sl.StyleDeclaration:return this.replaceIds(e.data,t,["id"]),this.replaceStyleIds(e.data,t,["styleId"]),e;case sl.Font:return e;case sl.Selection:return e.data.ranges.forEach((e=>{this.replaceIds(e,t,["start","end"])})),e;case sl.AdoptedStyleSheet:return this.replaceIds(e.data,t,["id"]),this.replaceStyleIds(e.data,t,["styleIds"]),null==(r=e.data.styles)||r.forEach((e=>{this.replaceStyleIds(e,t,["styleId"])})),e}}return!1}replace(t,e,r,n){for(const o of n)(Array.isArray(e[o])||"number"==typeof e[o])&&(Array.isArray(e[o])?e[o]=t.getIds(r,e[o]):e[o]=t.getId(r,e[o]));return e}replaceIds(t,e,r){return this.replace(this.crossOriginIframeMirror,t,e,r)}replaceStyleIds(t,e,r){return this.replace(this.crossOriginIframeStyleMirror,t,e,r)}replaceIdOnNode(t,e){this.replaceIds(t,e,["id","rootId"]),"childNodes"in t&&t.childNodes.forEach((t=>{this.replaceIdOnNode(t,e)}))}patchRootIdOnNode(t,e){t.type===hl.Document||t.rootId||(t.rootId=e),"childNodes"in t&&t.childNodes.forEach((t=>{this.patchRootIdOnNode(t,e)}))}}class Dl{constructor(t){i(this,"shadowDoms",new WeakSet),i(this,"mutationCb"),i(this,"scrollCb"),i(this,"bypassOptions"),i(this,"mirror"),i(this,"restoreHandlers",[]),this.mutationCb=t.mutationCb,this.scrollCb=t.scrollCb,this.bypassOptions=t.bypassOptions,this.mirror=t.mirror,this.init()}init(){this.reset(),this.patchAttachShadow(Element,document)}addShadowRoot(t,e){if(!w(t))return;if(this.shadowDoms.has(t))return;this.shadowDoms.add(t);const r=Cl({...this.bypassOptions,doc:e,mutationCb:this.mutationCb,mirror:this.mirror,shadowDomManager:this},t);this.restoreHandlers.push((()=>r.disconnect())),this.restoreHandlers.push(Ol({...this.bypassOptions,scrollCb:this.scrollCb,doc:t,mirror:this.mirror})),setTimeout((()=>{t.adoptedStyleSheets&&t.adoptedStyleSheets.length>0&&this.bypassOptions.stylesheetManager.adoptStyleSheets(t.adoptedStyleSheets,this.mirror.getId(ja.host(t))),this.restoreHandlers.push(_l({mirror:this.mirror,stylesheetManager:this.bypassOptions.stylesheetManager},t))}),0)}observeAttachShadow(t){t.contentWindow&&t.contentDocument&&this.patchAttachShadow(t.contentWindow.Element,t.contentDocument)}patchAttachShadow(t,e){const r=this;this.restoreHandlers.push(za(t.prototype,"attachShadow",(function(t){return function(n){const o=t.call(this,n),i=ja.shadowRoot(this);return i&&ol(this)&&r.addShadowRoot(i,e),o}})))}reset(){this.restoreHandlers.forEach((t=>{try{t()}catch(t){}})),this.restoreHandlers=[],this.shadowDoms=new WeakSet}}for(var Fl="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",Ul="undefined"==typeof Uint8Array?[]:new Uint8Array(256),Bl=0;Bl<64;Bl++)Ul[Fl.charCodeAt(Bl)]=Bl;const Wl=new Map;const zl=(t,e,r)=>{if(!t||!Hl(t,e)&&"object"!=typeof t)return;const n=function(t,e){let r=Wl.get(t);return r||(r=new Map,Wl.set(t,r)),r.has(e)||r.set(e,[]),r.get(e)}(r,t.constructor.name);let o=n.indexOf(t);return-1===o&&(o=n.length,n.push(t)),o};function Gl(t,e,r){if(t instanceof Array)return t.map((t=>Gl(t,e,r)));if(null===t)return t;if(t instanceof Float32Array||t instanceof Float64Array||t instanceof Int32Array||t instanceof Uint32Array||t instanceof Uint8Array||t instanceof Uint16Array||t instanceof Int16Array||t instanceof Int8Array||t instanceof Uint8ClampedArray){return{rr_type:t.constructor.name,args:[Object.values(t)]}}if(t instanceof ArrayBuffer){return{rr_type:t.constructor.name,base64:function(t){var e,r=new Uint8Array(t),n=r.length,o="";for(e=0;e<n;e+=3)o+=Fl[r[e]>>2],o+=Fl[(3&r[e])<<4|r[e+1]>>4],o+=Fl[(15&r[e+1])<<2|r[e+2]>>6],o+=Fl[63&r[e+2]];return n%3==2?o=o.substring(0,o.length-1)+"=":n%3==1&&(o=o.substring(0,o.length-2)+"=="),o}(t)}}if(t instanceof DataView){return{rr_type:t.constructor.name,args:[Gl(t.buffer,e,r),t.byteOffset,t.byteLength]}}if(t instanceof HTMLImageElement){const e=t.constructor.name,{src:r}=t;return{rr_type:e,src:r}}if(t instanceof HTMLCanvasElement){return{rr_type:"HTMLImageElement",src:t.toDataURL()}}if(t instanceof ImageData){return{rr_type:t.constructor.name,args:[Gl(t.data,e,r),t.width,t.height]}}if(Hl(t,e)||"object"==typeof t){return{rr_type:t.constructor.name,index:zl(t,e,r)}}return t}const Vl=(t,e,r)=>t.map((t=>Gl(t,e,r))),Hl=(t,e)=>{const r=["WebGLActiveInfo","WebGLBuffer","WebGLFramebuffer","WebGLProgram","WebGLRenderbuffer","WebGLShader","WebGLShaderPrecisionFormat","WebGLTexture","WebGLUniformLocation","WebGLVertexArrayObject","WebGLVertexArrayObjectOES"].filter((t=>"function"==typeof e[t]));return Boolean(r.find((r=>t instanceof e[r])))};function Jl(t,e,r,n){const o=[];try{const i=za(t.HTMLCanvasElement.prototype,"getContext",(function(t){return function(o,...i){if(!Za(this,e,r,!0)){const t=function(t){return"experimental-webgl"===t?"webgl":t}(o);if("__context"in this||(this.__context=t),n&&["webgl","webgl2"].includes(t))if(i[0]&&"object"==typeof i[0]){const t=i[0];t.preserveDrawingBuffer||(t.preserveDrawingBuffer=!0)}else i.splice(0,1,{preserveDrawingBuffer:!0})}return t.apply(this,[o,...i])}}));o.push(i)}catch{console.error("failed to patch HTMLCanvasElement.prototype.getContext")}return()=>{o.forEach((t=>t()))}}function ql(t,e,r,n,o,i){const s=[],a=Object.getOwnPropertyNames(t);for(const l of a)if(!["isContextLost","canvas","drawingBufferWidth","drawingBufferHeight"].includes(l))try{if("function"!=typeof t[l])continue;const a=za(t,l,(function(t){return function(...s){const a=t.apply(this,s);if(zl(a,i,this),"tagName"in this.canvas&&!Za(this.canvas,n,o,!0)){const t=Vl(s,i,this),n={type:e,property:l,args:t};r(this.canvas,n)}return a}}));s.push(a)}catch{const n=Wa(t,l,{set(t){r(this.canvas,{type:e,property:l,args:[t],setter:!0})}});s.push(n)}return s}const Zl="KGZ1bmN0aW9uKCkgewogICJ1c2Ugc3RyaWN0IjsKICB2YXIgY2hhcnMgPSAiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyI7CiAgdmFyIGxvb2t1cCA9IHR5cGVvZiBVaW50OEFycmF5ID09PSAidW5kZWZpbmVkIiA/IFtdIDogbmV3IFVpbnQ4QXJyYXkoMjU2KTsKICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSsrKSB7CiAgICBsb29rdXBbY2hhcnMuY2hhckNvZGVBdChpKV0gPSBpOwogIH0KICB2YXIgZW5jb2RlID0gZnVuY3Rpb24oYXJyYXlidWZmZXIpIHsKICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKSwgaTIsIGxlbiA9IGJ5dGVzLmxlbmd0aCwgYmFzZTY0ID0gIiI7CiAgICBmb3IgKGkyID0gMDsgaTIgPCBsZW47IGkyICs9IDMpIHsKICAgICAgYmFzZTY0ICs9IGNoYXJzW2J5dGVzW2kyXSA+PiAyXTsKICAgICAgYmFzZTY0ICs9IGNoYXJzWyhieXRlc1tpMl0gJiAzKSA8PCA0IHwgYnl0ZXNbaTIgKyAxXSA+PiA0XTsKICAgICAgYmFzZTY0ICs9IGNoYXJzWyhieXRlc1tpMiArIDFdICYgMTUpIDw8IDIgfCBieXRlc1tpMiArIDJdID4+IDZdOwogICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaTIgKyAyXSAmIDYzXTsKICAgIH0KICAgIGlmIChsZW4gJSAzID09PSAyKSB7CiAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDEpICsgIj0iOwogICAgfSBlbHNlIGlmIChsZW4gJSAzID09PSAxKSB7CiAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDIpICsgIj09IjsKICAgIH0KICAgIHJldHVybiBiYXNlNjQ7CiAgfTsKICBjb25zdCBsYXN0QmxvYk1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7CiAgY29uc3QgdHJhbnNwYXJlbnRCbG9iTWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTsKICBhc3luYyBmdW5jdGlvbiBnZXRUcmFuc3BhcmVudEJsb2JGb3Iod2lkdGgsIGhlaWdodCwgZGF0YVVSTE9wdGlvbnMpIHsKICAgIGNvbnN0IGlkID0gYCR7d2lkdGh9LSR7aGVpZ2h0fWA7CiAgICBpZiAoIk9mZnNjcmVlbkNhbnZhcyIgaW4gZ2xvYmFsVGhpcykgewogICAgICBpZiAodHJhbnNwYXJlbnRCbG9iTWFwLmhhcyhpZCkpIHJldHVybiB0cmFuc3BhcmVudEJsb2JNYXAuZ2V0KGlkKTsKICAgICAgY29uc3Qgb2Zmc2NyZWVuID0gbmV3IE9mZnNjcmVlbkNhbnZhcyh3aWR0aCwgaGVpZ2h0KTsKICAgICAgb2Zmc2NyZWVuLmdldENvbnRleHQoIjJkIik7CiAgICAgIGNvbnN0IGJsb2IgPSBhd2FpdCBvZmZzY3JlZW4uY29udmVydFRvQmxvYihkYXRhVVJMT3B0aW9ucyk7CiAgICAgIGNvbnN0IGFycmF5QnVmZmVyID0gYXdhaXQgYmxvYi5hcnJheUJ1ZmZlcigpOwogICAgICBjb25zdCBiYXNlNjQgPSBlbmNvZGUoYXJyYXlCdWZmZXIpOwogICAgICB0cmFuc3BhcmVudEJsb2JNYXAuc2V0KGlkLCBiYXNlNjQpOwogICAgICByZXR1cm4gYmFzZTY0OwogICAgfSBlbHNlIHsKICAgICAgcmV0dXJuICIiOwogICAgfQogIH0KICBjb25zdCB3b3JrZXIgPSBzZWxmOwogIHdvcmtlci5vbm1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbihlKSB7CiAgICBpZiAoIk9mZnNjcmVlbkNhbnZhcyIgaW4gZ2xvYmFsVGhpcykgewogICAgICBjb25zdCB7IGlkLCBiaXRtYXAsIHdpZHRoLCBoZWlnaHQsIGRhdGFVUkxPcHRpb25zIH0gPSBlLmRhdGE7CiAgICAgIGNvbnN0IHRyYW5zcGFyZW50QmFzZTY0ID0gZ2V0VHJhbnNwYXJlbnRCbG9iRm9yKAogICAgICAgIHdpZHRoLAogICAgICAgIGhlaWdodCwKICAgICAgICBkYXRhVVJMT3B0aW9ucwogICAgICApOwogICAgICBjb25zdCBvZmZzY3JlZW4gPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKHdpZHRoLCBoZWlnaHQpOwogICAgICBjb25zdCBjdHggPSBvZmZzY3JlZW4uZ2V0Q29udGV4dCgiMmQiKTsKICAgICAgY3R4LmRyYXdJbWFnZShiaXRtYXAsIDAsIDApOwogICAgICBiaXRtYXAuY2xvc2UoKTsKICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IG9mZnNjcmVlbi5jb252ZXJ0VG9CbG9iKGRhdGFVUkxPcHRpb25zKTsKICAgICAgY29uc3QgdHlwZSA9IGJsb2IudHlwZTsKICAgICAgY29uc3QgYXJyYXlCdWZmZXIgPSBhd2FpdCBibG9iLmFycmF5QnVmZmVyKCk7CiAgICAgIGNvbnN0IGJhc2U2NCA9IGVuY29kZShhcnJheUJ1ZmZlcik7CiAgICAgIGlmICghbGFzdEJsb2JNYXAuaGFzKGlkKSAmJiBhd2FpdCB0cmFuc3BhcmVudEJhc2U2NCA9PT0gYmFzZTY0KSB7CiAgICAgICAgbGFzdEJsb2JNYXAuc2V0KGlkLCBiYXNlNjQpOwogICAgICAgIHJldHVybiB3b3JrZXIucG9zdE1lc3NhZ2UoeyBpZCB9KTsKICAgICAgfQogICAgICBpZiAobGFzdEJsb2JNYXAuZ2V0KGlkKSA9PT0gYmFzZTY0KSByZXR1cm4gd29ya2VyLnBvc3RNZXNzYWdlKHsgaWQgfSk7CiAgICAgIHdvcmtlci5wb3N0TWVzc2FnZSh7CiAgICAgICAgaWQsCiAgICAgICAgdHlwZSwKICAgICAgICBiYXNlNjQsCiAgICAgICAgd2lkdGgsCiAgICAgICAgaGVpZ2h0CiAgICAgIH0pOwogICAgICBsYXN0QmxvYk1hcC5zZXQoaWQsIGJhc2U2NCk7CiAgICB9IGVsc2UgewogICAgICByZXR1cm4gd29ya2VyLnBvc3RNZXNzYWdlKHsgaWQ6IGUuZGF0YS5pZCB9KTsKICAgIH0KICB9Owp9KSgpOwovLyMgc291cmNlTWFwcGluZ1VSTD1pbWFnZS1iaXRtYXAtZGF0YS11cmwtd29ya2VyLUlKcEM3Z19iLmpzLm1hcAo=",Yl="undefined"!=typeof window&&window.Blob&&new Blob([(Xl=Zl,Uint8Array.from(atob(Xl),(t=>t.charCodeAt(0))))],{type:"text/javascript;charset=utf-8"});var Xl;function $l(t){let e;try{if(e=Yl&&(window.URL||window.webkitURL).createObjectURL(Yl),!e)throw"";const r=new Worker(e,{name:null==t?void 0:t.name});return r.addEventListener("error",(()=>{(window.URL||window.webkitURL).revokeObjectURL(e)})),r}catch(e){return new Worker("data:text/javascript;base64,"+Zl,{name:null==t?void 0:t.name})}finally{e&&(window.URL||window.webkitURL).revokeObjectURL(e)}}class Kl{constructor(t){i(this,"pendingCanvasMutations",new Map),i(this,"rafStamps",{latestId:0,invokeId:null}),i(this,"mirror"),i(this,"mutationCb"),i(this,"resetObservers"),i(this,"frozen",!1),i(this,"locked",!1),i(this,"processMutation",((t,e)=>{!(this.rafStamps.invokeId&&this.rafStamps.latestId!==this.rafStamps.invokeId)&&this.rafStamps.invokeId||(this.rafStamps.invokeId=this.rafStamps.latestId),this.pendingCanvasMutations.has(t)||this.pendingCanvasMutations.set(t,[]),this.pendingCanvasMutations.get(t).push(e)}));const{sampling:e="all",win:r,blockClass:n,blockSelector:o,recordCanvas:s,dataURLOptions:a}=t;this.mutationCb=t.mutationCb,this.mirror=t.mirror,s&&"all"===e&&this.initCanvasMutationObserver(r,n,o),s&&"number"==typeof e&&this.initCanvasFPSObserver(e,r,n,o,{dataURLOptions:a})}reset(){this.pendingCanvasMutations.clear(),this.resetObservers&&this.resetObservers()}freeze(){this.frozen=!0}unfreeze(){this.frozen=!1}lock(){this.locked=!0}unlock(){this.locked=!1}initCanvasFPSObserver(t,e,r,n,o){const i=Jl(e,r,n,!0),s=new Map,a=new $l;a.onmessage=t=>{const{id:e}=t.data;if(s.set(e,!1),!("base64"in t.data))return;const{base64:r,type:n,width:o,height:i}=t.data;this.mutationCb({id:e,type:ul["2D"],commands:[{property:"clearRect",args:[0,0,o,i]},{property:"drawImage",args:[{rr_type:"ImageBitmap",args:[{rr_type:"Blob",data:[{rr_type:"ArrayBuffer",base64:r}],type:n}]},0,0]}]})};const l=1e3/t;let u,c=0;const h=t=>{c&&t-c<l||(c=t,(()=>{const t=[];return e.document.querySelectorAll("canvas").forEach((e=>{Za(e,r,n,!0)||t.push(e)})),t})().forEach((async t=>{var e;const r=this.mirror.getId(t);if(s.get(r))return;if(0===t.width||0===t.height)return;if(s.set(r,!0),["webgl","webgl2"].includes(t.__context)){const r=t.getContext(t.__context);!1===(null==(e=null==r?void 0:r.getContextAttributes())?void 0:e.preserveDrawingBuffer)&&r.clear(r.COLOR_BUFFER_BIT)}const n=await createImageBitmap(t);a.postMessage({id:r,bitmap:n,width:t.width,height:t.height,dataURLOptions:o.dataURLOptions},[n])}))),u=requestAnimationFrame(h)};u=requestAnimationFrame(h),this.resetObservers=()=>{i(),cancelAnimationFrame(u)}}initCanvasMutationObserver(t,e,r){this.startRAFTimestamping(),this.startPendingCanvasMutationFlusher();const n=Jl(t,e,r,!1),o=function(t,e,r,n){const o=[],i=Object.getOwnPropertyNames(e.CanvasRenderingContext2D.prototype);for(const s of i)try{if("function"!=typeof e.CanvasRenderingContext2D.prototype[s])continue;const i=za(e.CanvasRenderingContext2D.prototype,s,(function(o){return function(...i){return Za(this.canvas,r,n,!0)||setTimeout((()=>{const r=Vl(i,e,this);t(this.canvas,{type:ul["2D"],property:s,args:r})}),0),o.apply(this,i)}}));o.push(i)}catch{const r=Wa(e.CanvasRenderingContext2D.prototype,s,{set(e){t(this.canvas,{type:ul["2D"],property:s,args:[e],setter:!0})}});o.push(r)}return()=>{o.forEach((t=>t()))}}(this.processMutation.bind(this),t,e,r),i=function(t,e,r,n){const o=[];return o.push(...ql(e.WebGLRenderingContext.prototype,ul.WebGL,t,r,n,e)),void 0!==e.WebGL2RenderingContext&&o.push(...ql(e.WebGL2RenderingContext.prototype,ul.WebGL2,t,r,n,e)),()=>{o.forEach((t=>t()))}}(this.processMutation.bind(this),t,e,r);this.resetObservers=()=>{n(),o(),i()}}startPendingCanvasMutationFlusher(){requestAnimationFrame((()=>this.flushPendingCanvasMutations()))}startRAFTimestamping(){const t=e=>{this.rafStamps.latestId=e,requestAnimationFrame(t)};requestAnimationFrame(t)}flushPendingCanvasMutations(){this.pendingCanvasMutations.forEach(((t,e)=>{const r=this.mirror.getId(e);this.flushPendingCanvasMutationFor(e,r)})),requestAnimationFrame((()=>this.flushPendingCanvasMutations()))}flushPendingCanvasMutationFor(t,e){if(this.frozen||this.locked)return;const r=this.pendingCanvasMutations.get(t);if(!r||-1===e)return;const n=r.map((t=>{const{type:e,...r}=t;return r})),{type:o}=r[0];this.mutationCb({id:e,type:o,commands:n}),this.pendingCanvasMutations.delete(t)}}class Ql{constructor(t){i(this,"trackedLinkElements",new WeakSet),i(this,"mutationCb"),i(this,"adoptedStyleSheetCb"),i(this,"styleMirror",new el),this.mutationCb=t.mutationCb,this.adoptedStyleSheetCb=t.adoptedStyleSheetCb}attachLinkElement(t,e){"_cssText"in e.attributes&&this.mutationCb({adds:[],removes:[],texts:[],attributes:[{id:e.id,attributes:e.attributes}]}),this.trackLinkElement(t)}trackLinkElement(t){this.trackedLinkElements.has(t)||(this.trackedLinkElements.add(t),this.trackStylesheetInLinkElement(t))}adoptStyleSheets(t,e){if(0===t.length)return;const r={id:e,styleIds:[]},n=[];for(const e of t){let t;this.styleMirror.has(e)?t=this.styleMirror.getId(e):(t=this.styleMirror.add(e),n.push({styleId:t,rules:Array.from(e.rules||CSSRule,((t,r)=>({rule:x(t,e.href),index:r})))})),r.styleIds.push(t)}n.length>0&&(r.styles=n),this.adoptedStyleSheetCb(r)}reset(){this.styleMirror.reset(),this.trackedLinkElements=new WeakSet}trackStylesheetInLinkElement(t){}}class tu{constructor(){i(this,"nodeMap",new WeakMap),i(this,"active",!1)}inOtherBuffer(t,e){const r=this.nodeMap.get(t);return r&&Array.from(r).some((t=>t!==e))}add(t,e){this.active||(this.active=!0,requestAnimationFrame((()=>{this.nodeMap=new WeakMap,this.active=!1}))),this.nodeMap.set(t,(this.nodeMap.get(t)||new Set).add(e))}destroy(){}}let eu,ru,nu,ou=!1;try{if(2!==Array.from([1],(t=>2*t))[0]){const t=document.createElement("iframe");document.body.appendChild(t),Array.from=(null==(n=t.contentWindow)?void 0:n.Array.from)||Array.from,document.body.removeChild(t)}}catch(t){console.debug("Unable to override Array.from",t)}const iu=new k;function su(t={}){const{emit:e,checkoutEveryNms:r,checkoutEveryNth:n,blockClass:o="rr-block",blockSelector:i=null,ignoreClass:s="rr-ignore",ignoreSelector:a=null,maskTextClass:l="rr-mask",maskTextSelector:u=null,inlineStylesheet:c=!0,maskAllInputs:h,maskInputOptions:p,slimDOMOptions:f,maskInputFn:d,maskTextFn:m,hooks:y,packFn:g,sampling:v={},dataURLOptions:b={},mousemoveWait:w,recordDOM:S=!0,recordCanvas:x=!1,recordCrossOriginIframes:C=!1,recordAfter:I=("DOMContentLoaded"===t.recordAfter?t.recordAfter:"load"),userTriggeredOnInput:O=!1,collectFonts:E=!1,inlineImages:R=!1,plugins:A,keepIframeSrcFn:M=()=>!1,ignoreCSSAttributes:_=new Set([]),errorHandler:T}=t;wl=T;const L=!C||window.parent===window;let N=!1;if(!L)try{window.parent.document&&(N=!1)}catch(t){N=!0}if(L&&!e)throw new Error("emit function is required");if(!L&&!N)return()=>{};void 0!==w&&void 0===v.mousemove&&(v.mousemove=w),iu.reset();const P=!0===h?{color:!0,date:!0,"datetime-local":!0,email:!0,month:!0,number:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0,textarea:!0,select:!0,password:!0}:void 0!==p?p:{password:!0},j=!0===f||"all"===f?{script:!0,comment:!0,headFavicon:!0,headWhitespace:!0,headMetaSocial:!0,headMetaRobots:!0,headMetaHttpEquiv:!0,headMetaVerification:!0,headMetaAuthorship:"all"===f,headMetaDescKeywords:"all"===f,headTitleMutations:"all"===f}:f||{};let D;!function(t=window){"NodeList"in t&&!t.NodeList.prototype.forEach&&(t.NodeList.prototype.forEach=Array.prototype.forEach),"DOMTokenList"in t&&!t.DOMTokenList.prototype.forEach&&(t.DOMTokenList.prototype.forEach=Array.prototype.forEach)}();let F=0;const U=t=>{for(const e of A||[])e.eventProcessor&&(t=e.eventProcessor(t));return g&&!N&&(t=g(t)),t};eu=(t,o)=>{var i;const s=t;if(s.timestamp=Ga(),!(null==(i=xl[0])?void 0:i.isFrozen())||s.type===il.FullSnapshot||s.type===il.IncrementalSnapshot&&s.data.source===sl.Mutation||xl.forEach((t=>t.unfreeze())),L)null==e||e(U(s),o);else if(N){const t={type:"rrweb",event:U(s),origin:window.location.origin,isCheckout:o};window.parent.postMessage(t,"*")}if(s.type===il.FullSnapshot)D=s,F=0;else if(s.type===il.IncrementalSnapshot){if(s.data.source===sl.Mutation&&s.data.isAttachIframe)return;F++;const t=n&&F>=n,e=r&&s.timestamp-D.timestamp>r;(t||e)&&ru(!0)}};const B=t=>{eu({type:il.IncrementalSnapshot,data:{source:sl.Mutation,...t}})},W=t=>eu({type:il.IncrementalSnapshot,data:{source:sl.Scroll,...t}}),z=t=>eu({type:il.IncrementalSnapshot,data:{source:sl.CanvasMutation,...t}}),G=new Ql({mutationCb:B,adoptedStyleSheetCb:t=>eu({type:il.IncrementalSnapshot,data:{source:sl.AdoptedStyleSheet,...t}})}),V=new jl({mirror:iu,mutationCb:B,stylesheetManager:G,recordCrossOriginIframes:C,wrappedEmit:eu});for(const t of A||[])t.getMirror&&t.getMirror({nodeMirror:iu,crossOriginIframeMirror:V.crossOriginIframeMirror,crossOriginIframeStyleMirror:V.crossOriginIframeStyleMirror});const H=new tu;nu=new Kl({recordCanvas:x,mutationCb:z,win:window,blockClass:o,blockSelector:i,mirror:iu,sampling:v.canvas,dataURLOptions:b});const J=new Dl({mutationCb:B,scrollCb:W,bypassOptions:{blockClass:o,blockSelector:i,maskTextClass:l,maskTextSelector:u,inlineStylesheet:c,maskInputOptions:P,dataURLOptions:b,maskTextFn:m,maskInputFn:d,recordCanvas:x,inlineImages:R,sampling:v,slimDOMOptions:j,iframeManager:V,stylesheetManager:G,canvasManager:nu,keepIframeSrcFn:M,processedNodeManager:H},mirror:iu});ru=(t=!1)=>{if(!S)return;eu({type:il.Meta,data:{href:window.location.href,width:Ja(),height:Ha()}},t),G.reset(),J.init(),xl.forEach((t=>t.lock()));const e=function(t,e){const{mirror:r=new k,blockClass:n="rr-block",blockSelector:o=null,maskTextClass:i="rr-mask",maskTextSelector:s=null,inlineStylesheet:a=!0,inlineImages:l=!1,recordCanvas:u=!1,maskAllInputs:c=!1,maskTextFn:h,maskInputFn:p,slimDOM:f=!1,dataURLOptions:d,preserveWhiteSpace:m,onSerialize:y,onIframeLoad:g,iframeLoadTimeout:v,onStylesheetLoad:b,stylesheetLoadTimeout:w,keepIframeSrcFn:S=()=>!1}=e||{};return Q(t,{doc:t,mirror:r,blockClass:n,blockSelector:o,maskTextClass:i,maskTextSelector:s,skipChild:!1,inlineStylesheet:a,maskInputOptions:!0===c?{color:!0,date:!0,"datetime-local":!0,email:!0,month:!0,number:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0,textarea:!0,select:!0,password:!0}:!1===c?{password:!0}:c,maskTextFn:h,maskInputFn:p,slimDOMOptions:!0===f||"all"===f?{script:!0,comment:!0,headFavicon:!0,headWhitespace:!0,headMetaDescKeywords:"all"===f,headMetaSocial:!0,headMetaRobots:!0,headMetaHttpEquiv:!0,headMetaAuthorship:!0,headMetaVerification:!0}:!1===f?{}:f,dataURLOptions:d,inlineImages:l,recordCanvas:u,preserveWhiteSpace:m,onSerialize:y,onIframeLoad:g,iframeLoadTimeout:v,onStylesheetLoad:b,stylesheetLoadTimeout:w,keepIframeSrcFn:S,newlyAddedElement:!1})}(document,{mirror:iu,blockClass:o,blockSelector:i,maskTextClass:l,maskTextSelector:u,inlineStylesheet:c,maskAllInputs:P,maskTextFn:m,maskInputFn:d,slimDOM:j,dataURLOptions:b,recordCanvas:x,inlineImages:R,onSerialize:t=>{Ka(t,iu)&&V.addIframe(t),Qa(t,iu)&&G.trackLinkElement(t),tl(t)&&J.addShadowRoot(ja.shadowRoot(t),document)},onIframeLoad:(t,e)=>{V.attachIframe(t,e),J.observeAttachShadow(t)},onStylesheetLoad:(t,e)=>{G.attachLinkElement(t,e)},keepIframeSrcFn:M});if(!e)return console.warn("Failed to snapshot the document");eu({type:il.FullSnapshot,data:{node:e,initialOffset:Va(window)}},t),xl.forEach((t=>t.unlock())),document.adoptedStyleSheets&&document.adoptedStyleSheets.length>0&&G.adoptStyleSheets(document.adoptedStyleSheets,iu.getId(document))};try{const t=[],e=t=>{var e;return Sl(Tl)({mutationCb:B,mousemoveCb:(t,e)=>eu({type:il.IncrementalSnapshot,data:{source:e,positions:t}}),mouseInteractionCb:t=>eu({type:il.IncrementalSnapshot,data:{source:sl.MouseInteraction,...t}}),scrollCb:W,viewportResizeCb:t=>eu({type:il.IncrementalSnapshot,data:{source:sl.ViewportResize,...t}}),inputCb:t=>eu({type:il.IncrementalSnapshot,data:{source:sl.Input,...t}}),mediaInteractionCb:t=>eu({type:il.IncrementalSnapshot,data:{source:sl.MediaInteraction,...t}}),styleSheetRuleCb:t=>eu({type:il.IncrementalSnapshot,data:{source:sl.StyleSheetRule,...t}}),styleDeclarationCb:t=>eu({type:il.IncrementalSnapshot,data:{source:sl.StyleDeclaration,...t}}),canvasMutationCb:z,fontCb:t=>eu({type:il.IncrementalSnapshot,data:{source:sl.Font,...t}}),selectionCb:t=>{eu({type:il.IncrementalSnapshot,data:{source:sl.Selection,...t}})},customElementCb:t=>{eu({type:il.IncrementalSnapshot,data:{source:sl.CustomElement,...t}})},blockClass:o,ignoreClass:s,ignoreSelector:a,maskTextClass:l,maskTextSelector:u,maskInputOptions:P,inlineStylesheet:c,sampling:v,recordDOM:S,recordCanvas:x,inlineImages:R,userTriggeredOnInput:O,collectFonts:E,doc:t,maskInputFn:d,maskTextFn:m,keepIframeSrcFn:M,blockSelector:i,slimDOMOptions:j,dataURLOptions:b,mirror:iu,iframeManager:V,stylesheetManager:G,shadowDomManager:J,processedNodeManager:H,canvasManager:nu,ignoreCSSAttributes:_,plugins:(null==(e=null==A?void 0:A.filter((t=>t.observer)))?void 0:e.map((t=>({observer:t.observer,options:t.options,callback:e=>eu({type:il.Plugin,data:{plugin:t.name,payload:e}})}))))||[]},y)};V.addLoadListener((r=>{try{t.push(e(r.contentDocument))}catch(t){console.warn(t)}}));const r=()=>{ru(),t.push(e(document)),ou=!0};return"interactive"===document.readyState||"complete"===document.readyState?r():(t.push(Da("DOMContentLoaded",(()=>{eu({type:il.DomContentLoaded,data:{}}),"DOMContentLoaded"===I&&r()}))),t.push(Da("load",(()=>{eu({type:il.Load,data:{}}),"load"===I&&r()}),window))),()=>{t.forEach((t=>t())),H.destroy(),ou=!1,wl=void 0}}catch(t){console.warn(t)}}var au,lu;su.addCustomEvent=(t,e)=>{if(!ou)throw new Error("please add custom event after start recording");eu({type:il.Custom,data:{tag:t,payload:e}})},su.freezePage=()=>{xl.forEach((t=>t.freeze()))},su.takeFullSnapshot=t=>{if(!ou)throw new Error("please take full snapshot after start recording");ru(t)},su.mirror=iu,(lu=au||(au={}))[lu.NotStarted=0]="NotStarted",lu[lu.Running=1]="Running",lu[lu.Stopped=2]="Stopped";var uu=(t=>(t[t.DomContentLoaded=0]="DomContentLoaded",t[t.Load=1]="Load",t[t.FullSnapshot=2]="FullSnapshot",t[t.IncrementalSnapshot=3]="IncrementalSnapshot",t[t.Meta=4]="Meta",t[t.Custom=5]="Custom",t[t.Plugin=6]="Plugin",t))(uu||{}),cu=r(1),hu=r(144),pu=r.n(hu),fu=["enabled","autoStart","maxSeconds","triggerOptions","emit","checkoutEveryNms"];function du(t){return du="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},du(t)}function mu(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function yu(t,e,r){return(e=wu(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function gu(t,e){var r="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=function(t,e){if(t){if("string"==typeof t)return vu(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?vu(t,e):void 0}}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return{s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,s=!0,a=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return s=t.done,t},e:function(t){a=!0,i=t},f:function(){try{s||null==r.return||r.return()}finally{if(a)throw i}}}}function vu(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=Array(e);r<e;r++)n[r]=t[r];return n}function bu(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,wu(n.key),n)}}function wu(t){var e=function(t,e){if("object"!=du(t)||!t)return t;var r=t[Symbol.toPrimitive];if(void 0!==r){var n=r.call(t,e||"default");if("object"!=du(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==du(e)?e:e+""}function Su(t,e,r){(function(t,e){if(e.has(t))throw new TypeError("Cannot initialize the same private elements twice on an object")})(t,e),e.set(t,r)}function xu(t,e){return t.get(Cu(t,e))}function ku(t,e,r){return t.set(Cu(t,e),r),r}function Cu(t,e,r){if("function"==typeof t?t===e:t.has(e))return arguments.length<3?e:r;throw new TypeError("Private element is not present on this object")}var Iu=new WeakMap,Ou=new WeakMap,Eu=new WeakMap,Ru=new WeakMap,Au=new WeakMap,Mu=function(){return t=function t(e){var r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:su;if(function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),Su(this,Iu,void 0),Su(this,Ou,void 0),Su(this,Eu,null),Su(this,Ru,void 0),Su(this,Au,{previous:[],current:[]}),!r)throw new TypeError("Expected 'recordFn' to be provided");this.options=e,ku(Ru,this,r)},e=[{key:"isRecording",get:function(){return null!==xu(Eu,this)}},{key:"options",get:function(){return xu(Iu,this)},set:function(t){this.configure(t)}},{key:"configure",value:function(t){var e=t.enabled,r=t.autoStart,n=t.maxSeconds,o=t.triggerOptions,i=(t.emit,t.checkoutEveryNms,function(t,e){if(null==t)return{};var r,n,o=function(t,e){if(null==t)return{};var r={};for(var n in t)if({}.hasOwnProperty.call(t,n)){if(-1!==e.indexOf(n))continue;r[n]=t[n]}return r}(t,e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);for(n=0;n<i.length;n++)r=i[n],-1===e.indexOf(r)&&{}.propertyIsEnumerable.call(t,r)&&(o[r]=t[r])}return o}(t,fu));ku(Iu,this,{enabled:e,autoStart:r,maxSeconds:n,triggerOptions:o}),ku(Ou,this,i),this.isRecording&&!1===t.enabled&&this.stop()}},{key:"checkoutEveryNms",value:function(){return 1e3*(this.options.maxSeconds||10)/2}},{key:"dump",value:function(t,e,r){var n=xu(Au,this).previous.concat(xu(Au,this).current);if(n.length<2)return pu().error("Replay recording cannot have less than 2 events"),null;var o=t.startSpan("rrweb-replay-recording",{});o.setAttribute("rollbar.replay.id",e),r&&o.setAttribute("rollbar.occurrence.uuid",r);var i=n.reduce((function(t,e){return e.timestamp<t.timestamp?e:t}));o.span.startTime=cu.A.fromMillis(i.timestamp);var s,a=gu(n);try{for(a.s();!(s=a.n()).done;){var l=s.value;o.addEvent("rrweb-replay-events",{eventType:l.type,json:JSON.stringify(l.data),"rollbar.replay.id":e},cu.A.fromMillis(l.timestamp))}}catch(t){a.e(t)}finally{a.f()}return o.end(),t.exporter.toPayload()}},{key:"start",value:function(){var t=this;if(!this.isRecording&&!1!==this.options.enabled)return this.clear(),ku(Eu,this,xu(Ru,this).call(this,function(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?mu(Object(r),!0).forEach((function(e){yu(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):mu(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}({emit:function(e,r){var n;null!==(n=t.options.debug)&&void 0!==n&&n.logEmits&&t._logEvent(e,r),r&&e.type===uu.Meta&&(xu(Au,t).previous=xu(Au,t).current,xu(Au,t).current=[]),xu(Au,t).current.push(e)},checkoutEveryNms:this.checkoutEveryNms(),errorHandler:function(e){var r;return null!==(r=t.options.debug)&&void 0!==r&&r.logErrors&&pu().error("Error during replay recording",e),!0}},xu(Ou,this)))),this}},{key:"stop",value:function(){if(this.isRecording)return xu(Eu,this).call(this),ku(Eu,this,null),this}},{key:"clear",value:function(){ku(Au,this,{previous:[],current:[]})}},{key:"_logEvent",value:function(t,e){var r,n;pu().log("Recorder: ".concat(e?"checkout":""," event\n"),(r=t,n=new WeakSet,JSON.stringify(r,(function(t,e){if("object"===du(e)&&null!==e){if(n.has(e))return"[Circular]";n.add(e)}return e}),2)))}}],e&&bu(t.prototype,e),r&&bu(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t;var t,e,r}()},922:function(t,e,r){var n=r(585),o=r(98);function i(t,e){var r=e.split("."),o=r.length-1;try{for(var i=0;i<=o;++i)i<o?t=t[r[i]]:t[r[i]]=n.redact()}catch(t){}}t.exports=function(t,e,r){if(e=e||[],r)for(var s=0;s<r.length;++s)i(t,r[s]);var a=function(t){for(var e,r=[],n=0;n<t.length;++n)e="^\\[?(%5[bB])?"+t[n]+"\\[?(%5[bB])?\\]?(%5[dD])?$",r.push(new RegExp(e,"i"));return r}(e),l=function(t){for(var e,r=[],n=0;n<t.length;++n)e="\\[?(%5[bB])?"+t[n]+"\\[?(%5[bB])?\\]?(%5[dD])?",r.push(new RegExp("("+e+"=)([^&\\n]+)","igm"));return r}(e);function u(t,e){return e+n.redact()}return o(t,(function t(e,r,i){var s=function(t,e){var r;for(r=0;r<a.length;++r)if(a[r].test(t)){e=n.redact();break}return e}(e,r);return s===r?n.isType(r,"object")||n.isType(r,"array")?o(r,t,i):function(t){var e;if(n.isType(t,"string"))for(e=0;e<l.length;++e)t=t.replace(l[e],u);return t}(s):s}))}},939:function(t,e,r){var n=r(585);function o(t,e){this.queue=t,this.options=e,this.transforms=[],this.diagnostic={}}o.prototype.configure=function(t){this.queue&&this.queue.configure(t);var e=this.options;return this.options=n.merge(e,t),this},o.prototype.addTransform=function(t){return n.isFunction(t)&&this.transforms.push(t),this},o.prototype.log=function(t,e){if(e&&n.isFunction(e)||(e=function(){}),!this.options.enabled)return e(new Error("Rollbar is not enabled"));this.queue.addPendingItem(t);var r=t.err;this._applyTransforms(t,function(n,o){if(n)return this.queue.removePendingItem(t),e(n,null);this.queue.addItem(o,e,r,t)}.bind(this))},o.prototype._applyTransforms=function(t,e){var r=-1,n=this.transforms.length,o=this.transforms,i=this.options,s=function(t,a){t?e(t,null):++r!==n?o[r](a,i,s):e(null,a)};s(null,t)},t.exports=o},949:function(t,e,r){var n=r(511),o=r(14),i=r(939),s=r(585);function a(t,e,r,n,c,h,p){this.options=s.merge(t),this.logger=r,a.rateLimiter.configureGlobal(this.options),a.rateLimiter.setPlatformOptions(p,this.options),this.api=e,this.queue=new o(a.rateLimiter,e,r,this.options,h),this.tracing=c;var f=this.options.tracer||null;u(f)?(this.tracer=f,this.options.tracer="opentracing-tracer-enabled",this.options._configuredOptions.tracer="opentracing-tracer-enabled"):this.tracer=null,this.notifier=new i(this.queue,this.options),this.telemeter=n,l(t),this.lastError=null,this.lastErrorHash="none"}function l(t){t.stackTraceLimit&&(Error.stackTraceLimit=t.stackTraceLimit)}function u(t){if(!t)return!1;if(!t.scope||"function"!=typeof t.scope)return!1;var e=t.scope();return!(!e||!e.active||"function"!=typeof e.active)}a.rateLimiter=new n({maxItems:0,itemsPerMinute:60}),a.prototype.global=function(t){return a.rateLimiter.configureGlobal(t),this},a.prototype.configure=function(t,e){var r=this.options,n={};e&&(n={payload:e}),this.options=s.merge(r,t,n);var o=this.options.tracer||null;return u(o)?(this.tracer=o,this.options.tracer="opentracing-tracer-enabled",this.options._configuredOptions.tracer="opentracing-tracer-enabled"):this.tracer=null,this.notifier&&this.notifier.configure(this.options),this.telemeter&&this.telemeter.configure(this.options),l(t),this.global(this.options),u(t.tracer)&&(this.tracer=t.tracer),this},a.prototype.log=function(t){var e=this._defaultLogLevel();return this._log(e,t)},a.prototype.debug=function(t){this._log("debug",t)},a.prototype.info=function(t){this._log("info",t)},a.prototype.warn=function(t){this._log("warning",t)},a.prototype.warning=function(t){this._log("warning",t)},a.prototype.error=function(t){this._log("error",t)},a.prototype.critical=function(t){this._log("critical",t)},a.prototype.wait=function(t){this.queue.wait(t)},a.prototype.captureEvent=function(t,e,r){return this.telemeter&&this.telemeter.captureEvent(t,e,r)},a.prototype.captureDomContentLoaded=function(t){return this.telemeter&&this.telemeter.captureDomContentLoaded(t)},a.prototype.captureLoad=function(t){return this.telemeter&&this.telemeter.captureLoad(t)},a.prototype.buildJsonPayload=function(t){return this.api.buildJsonPayload(t)},a.prototype.sendJsonPayload=function(t){this.api.postJsonPayload(t)},a.prototype._log=function(t,e){var r;if(e.callback&&(r=e.callback,delete e.callback),this.options.ignoreDuplicateErrors&&this._sameAsLastError(e)){if(r){var n=new Error("ignored identical item");n.item=e,r(n)}}else try{e.level=e.level||t;var o=this._replayIdIfTriggered(e);this._addTracingAttributes(e,o),this._addTracingInfo(e);var i=this.telemeter;i&&(i._captureRollbarItem(e),e.telemetryEvents=i.copyEvents()||[],i.telemetrySpan&&(i.telemetrySpan.end({"rollbar.replay.id":o}),i.telemetrySpan=i.tracing.startSpan("rollbar-telemetry",{}))),this.notifier.log(e,r)}catch(t){r&&r(t),this.logger.error(t)}},a.prototype._addTracingAttributes=function(t,e){var r,n,o=null===(r=this.tracing)||void 0===r?void 0:r.getSpan(),i=[{key:"replay_id",value:e},{key:"session_id",value:null===(n=this.tracing)||void 0===n?void 0:n.sessionId},{key:"span_id",value:null==o?void 0:o.spanId},{key:"trace_id",value:null==o?void 0:o.traceId}];s.addItemAttributes(t.data,i),null==o||o.addEvent("rollbar.occurrence",[{key:"rollbar.occurrence.uuid",value:t.uuid}])},a.prototype._replayIdIfTriggered=function(t){var e,r;if(((null===(e=this.options.recorder)||void 0===e||null===(e=e.triggerOptions)||void 0===e||null===(e=e.item)||void 0===e?void 0:e.levels)||[]).includes(t.level))return null===(r=this.tracing)||void 0===r?void 0:r.idGen(8)},a.prototype._defaultLogLevel=function(){return this.options.logLevel||"debug"},a.prototype._sameAsLastError=function(t){if(!t._isUncaught)return!1;var e=function(t){var e=t.message||"",r=(t.err||{}).stack||String(t.err);return e+"::"+r}(t);return this.lastErrorHash===e||(this.lastError=t.err,this.lastErrorHash=e,!1)},a.prototype._addTracingInfo=function(t){if(this.tracer){var e=this.tracer.scope().active();if(function(t){if(!t||!t.context||"function"!=typeof t.context)return!1;var e=t.context();if(!e||!e.toSpanId||!e.toTraceId||"function"!=typeof e.toSpanId||"function"!=typeof e.toTraceId)return!1;return!0}(e)){e.setTag("rollbar.error_uuid",t.uuid),e.setTag("rollbar.has_error",!0),e.setTag("error",!0),e.setTag("rollbar.item_url","https://rollbar.com/item/uuid/?uuid=".concat(t.uuid)),e.setTag("rollbar.occurrence_url","https://rollbar.com/occurrence/uuid/?uuid=".concat(t.uuid));var r=e.context().toSpanId(),n=e.context().toTraceId();t.custom?(t.custom.opentracing_span_id=r,t.custom.opentracing_trace_id=n):t.custom={opentracing_span_id:r,opentracing_trace_id:n}}}},t.exports=a},960:function(t,e,r){var n=r(585);function o(t,e){n.isFunction(t[e])&&(t[e]=t[e].toString())}t.exports={itemToPayload:function(t,e,r){var n=t.data;t._isUncaught&&(n._isUncaught=!0),t._originalArgs&&(n._originalArgs=t._originalArgs),r(null,n)},addPayloadOptions:function(t,e,r){var o=e.payload||{};o.body&&delete o.body,t.data=n.merge(t.data,o),r(null,t)},addTelemetryData:function(t,e,r){t.telemetryEvents&&n.set(t,"data.body.telemetry",t.telemetryEvents),r(null,t)},addMessageWithError:function(t,e,r){if(t.message){var o="data.body.trace_chain.0",i=n.get(t,o);if(i||(o="data.body.trace",i=n.get(t,o)),i){if(!i.exception||!i.exception.description)return n.set(t,o+".exception.description",t.message),void r(null,t);var s=n.get(t,o+".extra")||{},a=n.merge(s,{message:t.message});n.set(t,o+".extra",a)}r(null,t)}else r(null,t)},userTransform:function(t){return function(e,r,o){var i=n.merge(e),s=null;try{n.isFunction(r.transform)&&(s=r.transform(i.data,e))}catch(n){return r.transform=null,t.error("Error while calling custom transform() function. Removing custom transform().",n),void o(null,e)}n.isPromise(s)?s.then((function(t){t&&(i.data=t),o(null,i)}),(function(t){o(t,e)})):o(null,i)}},addConfigToPayload:function(t,e,r){if(!e.sendConfig)return r(null,t);var o=n.get(t,"data.custom")||{};o._rollbarConfig=e,t.data.custom=o,r(null,t)},addConfiguredOptions:function(t,e,r){var n=e._configuredOptions;o(n,"transform"),o(n,"checkIgnore"),o(n,"onSendCallback"),delete n.accessToken,t.data.notifier.configured_options=n,r(null,t)},addDiagnosticKeys:function(t,e,r){var o=n.merge(t.notifier.client.notifier.diagnostic,t.diagnostic);if(n.get(t,"err._isAnonymous")&&(o.is_anonymous=!0),t._isUncaught&&(o.is_uncaught=t._isUncaught),t.err)try{o.raw_error={message:t.err.message,name:t.err.name,constructor_name:t.err.constructor&&t.err.constructor.name,filename:t.err.fileName,line:t.err.lineNumber,column:t.err.columnNumber,stack:t.err.stack}}catch(t){o.raw_error={failed:String(t)}}t.data.notifier.diagnostic=n.merge(t.data.notifier.diagnostic,o),r(null,t)}}},965:function(t){"use strict";var e=Object.prototype.hasOwnProperty,r=Object.prototype.toString,n=function(t){if(!t||"[object Object]"!==r.call(t))return!1;var n,o=e.call(t,"constructor"),i=t.constructor&&t.constructor.prototype&&e.call(t.constructor.prototype,"isPrototypeOf");if(t.constructor&&!o&&!i)return!1;for(n in t);return void 0===n||e.call(t,n)};t.exports=function t(){var e,r,o,i,s,a={},l=null,u=arguments.length;for(e=0;e<u;e++)if(null!=(l=arguments[e]))for(s in l)r=a[s],a!==(o=l[s])&&(o&&n(o)?(i=r&&n(r)?r:{},a[s]=t(i,o)):void 0!==o&&(a[s]=o));return a}}},e={};function r(n){var o=e[n];if(void 0!==o)return o.exports;var i=e[n]={exports:{}};return t[n].call(i.exports,i,i.exports,r),i.exports}return r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,{a:e}),e},r.d=function(t,e){for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r(428)}()}));
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
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Default options for the rrweb recorder
 * See https://github.com/rrweb-io/rrweb/blob/master/guide.md#options for details
 */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  enabled: false, // Whether recording is enabled
  autoStart: true, // Start recording automatically when Rollbar initializes
  maxSeconds: 300, // Maximum recording duration in seconds

  // trigger options
  triggerOptions: {
    // Trigger replay on specific items (occurrences)
    item: {
      levels: ['error', 'critical'], // Trigger on item level
    }
  },

  debug: {
    logErrors: true, // Whether to log errors emitted by rrweb.
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
  version: '3.0.0-alpha.1',
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
    const replayId = _.getItemAttribute(item, 'replay_id');
    if (replayId) {
      item.replayId = this.replayMap.add(replayId, item.uuid);
    }
  }

  this.pendingRequests.push(item);
  try {
    this._makeApiRequest(
      item,
      function (err, resp, headers) {
        this._dequeuePendingRequest(item);

        if (!err && resp && item.replayId) {
          this._handleReplayResponse(item.replayId, resp, headers);
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
      function (err, resp, headers) {
        if (err) {
          this._maybeRetry(err, item, callback);
        } else {
          callback(err, resp, headers);
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
Queue.prototype._handleReplayResponse = async function (replayId, response, headers) {
  if (!this.replayMap) {
    console.warn('Queue._handleReplayResponse: ReplayMap not available');
    return false;
  }

  if (!replayId) {
    console.warn('Queue._handleReplayResponse: No replayId provided');
    return false;
  }

  try {
    if (this._shouldSendReplay(response, headers)) {
      return await this.replayMap.send(replayId);
    } else {
      this.replayMap.discard(replayId);
      return false;
    }
  } catch (error) {
    console.error('Error handling replay response:', error);
    return false;
  }
};

Queue.prototype._shouldSendReplay = function (response, headers) {
  if (response?.err !== 0 ||
      !headers ||
      headers['Rollbar-Replay-Enabled'] !== 'true' ||
      headers['Rollbar-Replay-RateLimit-Remaining'] === '0') {
    return false;
  }

  return true;
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
      const respHeaders = response.headers;
      const headers = {
        'Rollbar-Replay-Enabled': respHeaders.get(
          'Rollbar-Replay-Enabled'
        ),
        'Rollbar-Replay-RateLimit-Remaining': respHeaders.get(
          'Rollbar-Replay-RateLimit-Remaining'
        ),
        'Rollbar-Replay-RateLimit-Reset': respHeaders.get(
          'Rollbar-Replay-RateLimit-Reset'
        ),
      };
      const json = response.json();
      callback(null, json, headers);
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
    accessToken: "f7db1bf59c26440ba807c609ab2be17e16d9d00b7eb0cce6840c7b1f92f8d383046901135a253736922ff9bd8c73e5e3",
    //"bc68f1eafc124f40bcf40421017c4dc414bd76b7658c2e766f4a177c7a435091bfbb0c51c41fd96242633083f37ad775",
    //accessToken: "d8c0f28d2b3744ed9cf4aebe54c21dd0", // rollbardev:SeshRep01
    //endpoint: "https://api.rollbar.com/api/1/item",
    endpoint: "http://localhost:8000/api/1/item",
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
//# sourceMappingURL=index-a1371d17242997d9.js.map