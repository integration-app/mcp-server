var Penpal = (function () {
  'use strict';

  var MessageType;

  (function (MessageType) {
    MessageType["Call"] = "call";
    MessageType["Reply"] = "reply";
    MessageType["Syn"] = "syn";
    MessageType["SynAck"] = "synAck";
    MessageType["Ack"] = "ack";
  })(MessageType || (MessageType = {}));

  var Resolution;

  (function (Resolution) {
    Resolution["Fulfilled"] = "fulfilled";
    Resolution["Rejected"] = "rejected";
  })(Resolution || (Resolution = {}));

  var ErrorCode;

  (function (ErrorCode) {
    ErrorCode["ConnectionDestroyed"] = "ConnectionDestroyed";
    ErrorCode["ConnectionTimeout"] = "ConnectionTimeout";
    ErrorCode["NoIframeSrc"] = "NoIframeSrc";
  })(ErrorCode || (ErrorCode = {}));

  var NativeErrorName;

  (function (NativeErrorName) {
    NativeErrorName["DataCloneError"] = "DataCloneError";
  })(NativeErrorName || (NativeErrorName = {}));

  var NativeEventType;

  (function (NativeEventType) {
    NativeEventType["Message"] = "message";
  })(NativeEventType || (NativeEventType = {}));

  var createDestructor = ((localName, log) => {
    const callbacks = [];
    let destroyed = false;
    return {
      destroy(error) {
        if (!destroyed) {
          destroyed = true;
          log(`${localName}: Destroying connection`);
          callbacks.forEach(callback => {
            callback(error);
          });
        }
      },

      onDestroy(callback) {
        destroyed ? callback() : callbacks.push(callback);
      }

    };
  });

  var createLogger = (debug => {
    /**
     * Logs a message if debug is enabled.
     */
    return (...args) => {
      if (debug) {
        console.log('[Penpal]', ...args); // eslint-disable-line no-console
      }
    };
  });

  const DEFAULT_PORT_BY_PROTOCOL = {
    'http:': '80',
    'https:': '443'
  };
  const URL_REGEX = /^(https?:)?\/\/([^/:]+)?(:(\d+))?/;
  const opaqueOriginSchemes = ['file:', 'data:'];
  /**
   * Converts a src value into an origin.
   */

  var getOriginFromSrc = (src => {
    if (src && opaqueOriginSchemes.find(scheme => src.startsWith(scheme))) {
      // The origin of the child document is an opaque origin and its
      // serialization is "null"
      // https://html.spec.whatwg.org/multipage/origin.html#origin
      return 'null';
    } // Note that if src is undefined, then srcdoc is being used instead of src
    // and we can follow this same logic below to get the origin of the parent,
    // which is the origin that we will need to use.


    const location = document.location;
    const regexResult = URL_REGEX.exec(src);
    let protocol;
    let hostname;
    let port;

    if (regexResult) {
      // It's an absolute URL. Use the parsed info.
      // regexResult[1] will be undefined if the URL starts with //
      protocol = regexResult[1] ? regexResult[1] : location.protocol;
      hostname = regexResult[2];
      port = regexResult[4];
    } else {
      // It's a relative path. Use the current location's info.
      protocol = location.protocol;
      hostname = location.hostname;
      port = location.port;
    } // If the port is the default for the protocol, we don't want to add it to the origin string
    // or it won't match the message's event.origin.


    const portSuffix = port && port !== DEFAULT_PORT_BY_PROTOCOL[protocol] ? `:${port}` : '';
    return `${protocol}//${hostname}${portSuffix}`;
  });

  /**
   * Converts an error object into a plain object.
   */
  const serializeError = ({
    name,
    message,
    stack
  }) => ({
    name,
    message,
    stack
  });
  /**
   * Converts a plain object into an error object.
   */

  const deserializeError = obj => {
    const deserializedError = new Error(); // @ts-ignore

    Object.keys(obj).forEach(key => deserializedError[key] = obj[key]);
    return deserializedError;
  };

  /**
   * Listens for "call" messages coming from the remote, executes the corresponding method, and
   * responds with the return value.
   */

  var connectCallReceiver = ((info, serializedMethods, log) => {
    const {
      localName,
      local,
      remote,
      originForSending,
      originForReceiving
    } = info;
    let destroyed = false;

    const handleMessageEvent = event => {
      if (event.source !== remote || event.data.penpal !== MessageType.Call) {
        return;
      }

      if (originForReceiving !== '*' && event.origin !== originForReceiving) {
        log(`${localName} received message from origin ${event.origin} which did not match expected origin ${originForReceiving}`);
        return;
      }

      const callMessage = event.data;
      const {
        methodName,
        args,
        id
      } = callMessage;
      log(`${localName}: Received ${methodName}() call`);

      const createPromiseHandler = resolution => {
        return returnValue => {
          log(`${localName}: Sending ${methodName}() reply`);

          if (destroyed) {
            // It's possible to throw an error here, but it would need to be thrown asynchronously
            // and would only be catchable using window.onerror. This is because the consumer
            // is merely returning a value from their method and not calling any function
            // that they could wrap in a try-catch. Even if the consumer were to catch the error,
            // the value of doing so is questionable. Instead, we'll just log a message.
            log(`${localName}: Unable to send ${methodName}() reply due to destroyed connection`);
            return;
          }

          const message = {
            penpal: MessageType.Reply,
            id,
            resolution,
            returnValue
          };

          if (resolution === Resolution.Rejected && returnValue instanceof Error) {
            message.returnValue = serializeError(returnValue);
            message.returnValueIsError = true;
          }

          try {
            remote.postMessage(message, originForSending);
          } catch (err) {
            // If a consumer attempts to send an object that's not cloneable (e.g., window),
            // we want to ensure the receiver's promise gets rejected.
            if (err.name === NativeErrorName.DataCloneError) {
              const errorReplyMessage = {
                penpal: MessageType.Reply,
                id,
                resolution: Resolution.Rejected,
                returnValue: serializeError(err),
                returnValueIsError: true
              };
              remote.postMessage(errorReplyMessage, originForSending);
            }

            throw err;
          }
        };
      };

      new Promise(resolve => resolve(serializedMethods[methodName].apply(serializedMethods, args))).then(createPromiseHandler(Resolution.Fulfilled), createPromiseHandler(Resolution.Rejected));
    };

    local.addEventListener(NativeEventType.Message, handleMessageEvent);
    return () => {
      destroyed = true;
      local.removeEventListener(NativeEventType.Message, handleMessageEvent);
    };
  });

  let id = 0;
  /**
   * @return {number} A unique ID (not universally unique)
   */

  var generateId = (() => ++id);

  const KEY_PATH_DELIMITER = '.';

  const keyPathToSegments = keyPath => keyPath ? keyPath.split(KEY_PATH_DELIMITER) : [];

  const segmentsToKeyPath = segments => segments.join(KEY_PATH_DELIMITER);

  const createKeyPath = (key, prefix) => {
    const segments = keyPathToSegments(prefix || '');
    segments.push(key);
    return segmentsToKeyPath(segments);
  };
  /**
   * Given a `keyPath`, set it to be `value` on `subject`, creating any intermediate
   * objects along the way.
   *
   * @param {Object} subject The object on which to set value.
   * @param {string} keyPath The key path at which to set value.
   * @param {Object} value The value to store at the given key path.
   * @returns {Object} Updated subject.
   */


  const setAtKeyPath = (subject, keyPath, value) => {
    const segments = keyPathToSegments(keyPath);
    segments.reduce((prevSubject, key, idx) => {
      if (typeof prevSubject[key] === 'undefined') {
        prevSubject[key] = {};
      }

      if (idx === segments.length - 1) {
        prevSubject[key] = value;
      }

      return prevSubject[key];
    }, subject);
    return subject;
  };
  /**
   * Given a dictionary of (nested) keys to function, flatten them to a map
   * from key path to function.
   *
   * @param {Object} methods The (potentially nested) object to serialize.
   * @param {string} prefix A string with which to prefix entries. Typically not intended to be used by consumers.
   * @returns {Object} An map from key path in `methods` to functions.
   */

  const serializeMethods = (methods, prefix) => {
    const flattenedMethods = {};
    Object.keys(methods).forEach(key => {
      const value = methods[key];
      const keyPath = createKeyPath(key, prefix);

      if (typeof value === 'object') {
        // Recurse into any nested children.
        Object.assign(flattenedMethods, serializeMethods(value, keyPath));
      }

      if (typeof value === 'function') {
        // If we've found a method, expose it.
        flattenedMethods[keyPath] = value;
      }
    });
    return flattenedMethods;
  };
  /**
   * Given a map of key paths to functions, unpack the key paths to an object.
   *
   * @param {Object} flattenedMethods A map of key paths to functions to unpack.
   * @returns {Object} A (potentially nested) map of functions.
   */

  const deserializeMethods = flattenedMethods => {
    const methods = {};

    for (const keyPath in flattenedMethods) {
      setAtKeyPath(methods, keyPath, flattenedMethods[keyPath]);
    }

    return methods;
  };

  /**
   * Augments an object with methods that match those defined by the remote. When these methods are
   * called, a "call" message will be sent to the remote, the remote's corresponding method will be
   * executed, and the method's return value will be returned via a message.
   * @param {Object} callSender Sender object that should be augmented with methods.
   * @param {Object} info Information about the local and remote windows.
   * @param {Array} methodKeyPaths Key paths of methods available to be called on the remote.
   * @param {Promise} destructionPromise A promise resolved when destroy() is called on the penpal
   * connection.
   * @returns {Object} The call sender object with methods that may be called.
   */

  var connectCallSender = ((callSender, info, methodKeyPaths, destroyConnection, log) => {
    const {
      localName,
      local,
      remote,
      originForSending,
      originForReceiving
    } = info;
    let destroyed = false;
    log(`${localName}: Connecting call sender`);

    const createMethodProxy = methodName => {
      return (...args) => {
        log(`${localName}: Sending ${methodName}() call`); // This handles the case where the iframe has been removed from the DOM
        // (and therefore its window closed), the consumer has not yet
        // called destroy(), and the user calls a method exposed by
        // the remote. We detect the iframe has been removed and force
        // a destroy() immediately so that the consumer sees the error saying
        // the connection has been destroyed. We wrap this check in a try catch
        // because Edge throws an "Object expected" error when accessing
        // contentWindow.closed on a contentWindow from an iframe that's been
        // removed from the DOM.

        let iframeRemoved;

        try {
          if (remote.closed) {
            iframeRemoved = true;
          }
        } catch (e) {
          iframeRemoved = true;
        }

        if (iframeRemoved) {
          destroyConnection();
        }

        if (destroyed) {
          const error = new Error(`Unable to send ${methodName}() call due ` + `to destroyed connection`);
          error.code = ErrorCode.ConnectionDestroyed;
          throw error;
        }

        return new Promise((resolve, reject) => {
          const id = generateId();

          const handleMessageEvent = event => {
            if (event.source !== remote || event.data.penpal !== MessageType.Reply || event.data.id !== id) {
              return;
            }

            if (originForReceiving !== '*' && event.origin !== originForReceiving) {
              log(`${localName} received message from origin ${event.origin} which did not match expected origin ${originForReceiving}`);
              return;
            }

            const replyMessage = event.data;
            log(`${localName}: Received ${methodName}() reply`);
            local.removeEventListener(NativeEventType.Message, handleMessageEvent);
            let returnValue = replyMessage.returnValue;

            if (replyMessage.returnValueIsError) {
              returnValue = deserializeError(returnValue);
            }

            (replyMessage.resolution === Resolution.Fulfilled ? resolve : reject)(returnValue);
          };

          local.addEventListener(NativeEventType.Message, handleMessageEvent);
          const callMessage = {
            penpal: MessageType.Call,
            id,
            methodName,
            args
          };
          remote.postMessage(callMessage, originForSending);
        });
      };
    }; // Wrap each method in a proxy which sends it to the corresponding receiver.


    const flattenedMethods = methodKeyPaths.reduce((api, name) => {
      api[name] = createMethodProxy(name);
      return api;
    }, {}); // Unpack the structure of the provided methods object onto the CallSender, exposing
    // the methods in the same shape they were provided.

    Object.assign(callSender, deserializeMethods(flattenedMethods));
    return () => {
      destroyed = true;
    };
  });

  /**
   * Handles an ACK handshake message.
   */

  var handleAckMessageFactory = ((serializedMethods, childOrigin, originForSending, destructor, log) => {
    const {
      destroy,
      onDestroy
    } = destructor;
    let destroyCallReceiver;
    let receiverMethodNames; // We resolve the promise with the call sender. If the child reconnects
    // (for example, after refreshing or navigating to another page that
    // uses Penpal, we'll update the call sender with methods that match the
    // latest provided by the child.

    const callSender = {};
    return event => {
      if (childOrigin !== '*' && event.origin !== childOrigin) {
        log(`Parent: Handshake - Received ACK message from origin ${event.origin} which did not match expected origin ${childOrigin}`);
        return;
      }

      log('Parent: Handshake - Received ACK');
      const info = {
        localName: 'Parent',
        local: window,
        remote: event.source,
        originForSending: originForSending,
        originForReceiving: childOrigin
      }; // If the child reconnected, we need to destroy the prior call receiver
      // before setting up a new one.

      if (destroyCallReceiver) {
        destroyCallReceiver();
      }

      destroyCallReceiver = connectCallReceiver(info, serializedMethods, log);
      onDestroy(destroyCallReceiver); // If the child reconnected, we need to remove the methods from the
      // previous call receiver off the sender.

      if (receiverMethodNames) {
        receiverMethodNames.forEach(receiverMethodName => {
          delete callSender[receiverMethodName];
        });
      }

      receiverMethodNames = event.data.methodNames;
      const destroyCallSender = connectCallSender(callSender, info, receiverMethodNames, destroy, log);
      onDestroy(destroyCallSender);
      return callSender;
    };
  });

  /**
   * Handles a SYN handshake message.
   */

  var handleSynMessageFactory = ((log, serializedMethods, childOrigin, originForSending) => {
    return event => {
      // Under specific timing circumstances, we can receive an event
      // whose source is null. This seems to happen when the child iframe is
      // removed from the DOM about the same time it has sent the SYN event.
      // https://github.com/Aaronius/penpal/issues/85
      if (!event.source) {
        return;
      }

      if (childOrigin !== '*' && event.origin !== childOrigin) {
        log(`Parent: Handshake - Received SYN message from origin ${event.origin} which did not match expected origin ${childOrigin}`);
        return;
      }

      log('Parent: Handshake - Received SYN, responding with SYN-ACK');
      const synAckMessage = {
        penpal: MessageType.SynAck,
        methodNames: Object.keys(serializedMethods)
      };
      event.source.postMessage(synAckMessage, originForSending);
    };
  });

  const CHECK_IFRAME_IN_DOC_INTERVAL = 60000;
  /**
   * Monitors for iframe removal and destroys connection if iframe
   * is found to have been removed from DOM. This is to prevent memory
   * leaks when the iframe is removed from the document and the consumer
   * hasn't called destroy(). Without this, event listeners attached to
   * the window would stick around and since the event handlers have a
   * reference to the iframe in their closures, the iframe would stick
   * around too.
   */

  var monitorIframeRemoval = ((iframe, destructor) => {
    const {
      destroy,
      onDestroy
    } = destructor;
    const checkIframeInDocIntervalId = setInterval(() => {
      if (!iframe.isConnected) {
        clearInterval(checkIframeInDocIntervalId);
        destroy();
      }
    }, CHECK_IFRAME_IN_DOC_INTERVAL);
    onDestroy(() => {
      clearInterval(checkIframeInDocIntervalId);
    });
  });

  /**
   * Starts a timeout and calls the callback with an error
   * if the timeout completes before the stop function is called.
   */

  var startConnectionTimeout = ((timeout, callback) => {
    let timeoutId;

    if (timeout !== undefined) {
      timeoutId = window.setTimeout(() => {
        const error = new Error(`Connection timed out after ${timeout}ms`);
        error.code = ErrorCode.ConnectionTimeout;
        callback(error);
      }, timeout);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  });

  var validateIframeHasSrcOrSrcDoc = (iframe => {
    if (!iframe.src && !iframe.srcdoc) {
      const error = new Error('Iframe must have src or srcdoc property defined.');
      error.code = ErrorCode.NoIframeSrc;
      throw error;
    }
  });

  /**
   * Attempts to establish communication with an iframe.
   */

  var connectToChild = (options => {
    let {
      iframe,
      methods = {},
      childOrigin,
      timeout,
      debug = false
    } = options;
    const log = createLogger(debug);
    const destructor = createDestructor('Parent', log);
    const {
      onDestroy,
      destroy
    } = destructor;

    if (!childOrigin) {
      validateIframeHasSrcOrSrcDoc(iframe);
      childOrigin = getOriginFromSrc(iframe.src);
    } // If event.origin is "null", the remote protocol is file: or data: and we
    // must post messages with "*" as targetOrigin when sending messages.
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Using_window.postMessage_in_extensions


    const originForSending = childOrigin === 'null' ? '*' : childOrigin;
    const serializedMethods = serializeMethods(methods);
    const handleSynMessage = handleSynMessageFactory(log, serializedMethods, childOrigin, originForSending);
    const handleAckMessage = handleAckMessageFactory(serializedMethods, childOrigin, originForSending, destructor, log);
    const promise = new Promise((resolve, reject) => {
      const stopConnectionTimeout = startConnectionTimeout(timeout, destroy);

      const handleMessage = event => {
        if (event.source !== iframe.contentWindow || !event.data) {
          return;
        }

        if (event.data.penpal === MessageType.Syn) {
          handleSynMessage(event);
          return;
        }

        if (event.data.penpal === MessageType.Ack) {
          const callSender = handleAckMessage(event);

          if (callSender) {
            stopConnectionTimeout();
            resolve(callSender);
          }

          return;
        }
      };

      window.addEventListener(NativeEventType.Message, handleMessage);
      log('Parent: Awaiting handshake');
      monitorIframeRemoval(iframe, destructor);
      onDestroy(error => {
        window.removeEventListener(NativeEventType.Message, handleMessage);

        if (error) {
          reject(error);
        }
      });
    });
    return {
      promise,

      destroy() {
        // Don't allow consumer to pass an error into destroy.
        destroy();
      }

    };
  });

  /**
   * Handles a SYN-ACK handshake message.
   */

  var handleSynAckMessageFactory = ((parentOrigin, serializedMethods, destructor, log) => {
    const {
      destroy,
      onDestroy
    } = destructor;
    return event => {
      let originQualifies = parentOrigin instanceof RegExp ? parentOrigin.test(event.origin) : parentOrigin === '*' || parentOrigin === event.origin;

      if (!originQualifies) {
        log(`Child: Handshake - Received SYN-ACK from origin ${event.origin} which did not match expected origin ${parentOrigin}`);
        return;
      }

      log('Child: Handshake - Received SYN-ACK, responding with ACK'); // If event.origin is "null", the remote protocol is file: or data: and we
      // must post messages with "*" as targetOrigin when sending messages.
      // https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Using_window.postMessage_in_extensions

      const originForSending = event.origin === 'null' ? '*' : event.origin;
      const ackMessage = {
        penpal: MessageType.Ack,
        methodNames: Object.keys(serializedMethods)
      };
      window.parent.postMessage(ackMessage, originForSending);
      const info = {
        localName: 'Child',
        local: window,
        remote: window.parent,
        originForSending,
        originForReceiving: event.origin
      };
      const destroyCallReceiver = connectCallReceiver(info, serializedMethods, log);
      onDestroy(destroyCallReceiver);
      const callSender = {};
      const destroyCallSender = connectCallSender(callSender, info, event.data.methodNames, destroy, log);
      onDestroy(destroyCallSender);
      return callSender;
    };
  });

  const areGlobalsAccessible = () => {
    try {
      clearTimeout();
    } catch (e) {
      return false;
    }

    return true;
  };
  /**
   * Attempts to establish communication with the parent window.
   */


  var connectToParent = ((options = {}) => {
    const {
      parentOrigin = '*',
      methods = {},
      timeout,
      debug = false
    } = options;
    const log = createLogger(debug);
    const destructor = createDestructor('Child', log);
    const {
      destroy,
      onDestroy
    } = destructor;
    const serializedMethods = serializeMethods(methods);
    const handleSynAckMessage = handleSynAckMessageFactory(parentOrigin, serializedMethods, destructor, log);

    const sendSynMessage = () => {
      log('Child: Handshake - Sending SYN');
      const synMessage = {
        penpal: MessageType.Syn
      };
      const parentOriginForSyn = parentOrigin instanceof RegExp ? '*' : parentOrigin;
      window.parent.postMessage(synMessage, parentOriginForSyn);
    };

    const promise = new Promise((resolve, reject) => {
      const stopConnectionTimeout = startConnectionTimeout(timeout, destroy);

      const handleMessage = event => {
        // Under niche scenarios, we get into this function after
        // the iframe has been removed from the DOM. In Edge, this
        // results in "Object expected" errors being thrown when we
        // try to access properties on window (global properties).
        // For this reason, we try to access a global up front (clearTimeout)
        // and if it fails we can assume the iframe has been removed
        // and we ignore the message event.
        if (!areGlobalsAccessible()) {
          return;
        }

        if (event.source !== parent || !event.data) {
          return;
        }

        if (event.data.penpal === MessageType.SynAck) {
          const callSender = handleSynAckMessage(event);

          if (callSender) {
            window.removeEventListener(NativeEventType.Message, handleMessage);
            stopConnectionTimeout();
            resolve(callSender);
          }
        }
      };

      window.addEventListener(NativeEventType.Message, handleMessage);
      sendSynMessage();
      onDestroy(error => {
        window.removeEventListener(NativeEventType.Message, handleMessage);

        if (error) {
          reject(error);
        }
      });
    });
    return {
      promise,

      destroy() {
        // Don't allow consumer to pass an error into destroy.
        destroy();
      }

    };
  });

  var indexForBundle = {
    connectToChild,
    connectToParent,
    ErrorCode
  };

  return indexForBundle;

}());
