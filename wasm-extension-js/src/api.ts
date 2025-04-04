// Moosync
// Copyright (C) 2024, 2025  Moosync <support@moosync.app>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { ReadableStream } from "web-streams-polyfill";
import * as TextEncoding from "text-encoding-polyfill";
import { Headers } from 'headers-polyfill';
import { ExtensionAPI, ExtensionEventCommands, ExtensionEventName, ExtensionEventNames, ProviderScope } from "./types";

// TODO: Add TextEncoder & TextDecoder types
const TextEncoder = TextEncoding.TextEncoder;

import type * as undici from "undici-types";
import { HeaderRecord } from 'undici-types/header';

export class ExtensionLogger {
  private actor: string

  constructor(actor: string) {
    this.actor = actor
  }

  private get debugging() {
    let DEBUGGING: boolean
    try {
      DEBUGGING = api.getPreferenceValue<true>("DEBUGGING")
    } catch (e) {
      DEBUGGING = false
    }
    return DEBUGGING
  }

  info(...messages: any[]) {
    console.log(`[${this.actor}]`, ...messages);
  }

  debug(...messages: any[]) {
    if (this.debugging) {
      console.debug(`[${this.actor}]`, ...messages);
    }
  }

  warn(...messages: any[]) {
    console.warn(`[${this.actor}]`, ...messages);
  }

  error(...messages: any[]) {
    console.error(`[${this.actor}]`, ...messages);
  }
}

export interface MoosyncExtension extends ExtensionEventCommands { }

export abstract class MoosyncExtension {
  protected readonly Logger: ExtensionLogger

  constructor(public readonly extensionName: string = this.constructor.name) {
    this.Logger = new ExtensionLogger(this.extensionName)
  }

  /**
   * Registers the extension with the main app.
   * 
   * This method must be called after the extension instance is created, in the required Extism `module.exports` `entry` function. Your bundler/build process should handle this for you.
   * 
   * Marked `private` to prevent polluting intellisense in implementations of this class.
   */
  private register() {
    const scopes: ProviderScope[] = []

    for (const key in this) {
      const value = this[key];

      if (Object.keys(ExtensionEventNames).includes(key) && typeof value === "function") {
        if (!LISTENERS) {
          LISTENERS = {} as Record<ExtensionEventName, Function>;
        }
        LISTENERS[key as ExtensionEventName] = value.bind(this);

        if (ExtensionEventNames[key as ExtensionEventName] !== undefined) {
          scopes.push(ExtensionEventNames[key as ExtensionEventName]);
        }
      }
    }

    if (scopes.length !== 0) {
      LISTENERS["getProviderScopes"] = () => scopes;
    }
  }
}

var LISTENERS: Record<ExtensionEventName, Function>;

function camelToPascal(camelCaseStr: string) {
  // Capitalize the first character and concatenate with the rest of the string
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
}

export const api: ExtensionAPI = new Proxy({} as ExtensionAPI, {
  get: (_target, _prop, _receiver) => {
    const prop = _prop as keyof ExtensionAPI;
    if (prop === "on") {
      return (eventName: string, callback: Function) => {
        if (!LISTENERS) {
          LISTENERS = {} as Record<ExtensionEventName, Function>;
        }
        LISTENERS[eventName] = callback;
      };
    }

    if (typeof prop === "string") {

      if (prop === "getPreferenceValue" || prop === "getSecureValue") {
        return (key: string, defaultValue?: unknown) => {
          const { send_main_command } = Host.getFunctions() as any;
          let msg: string;
          msg = JSON.stringify({ [camelToPascal(prop)]: { key, defaultValue } });
          console.log("parsed ext command msg", msg, prop, { key });
          const mem = Memory.fromString(msg);
          const offset = send_main_command(mem.offset);
          const response = Memory.find(offset).readString();
          return JSON.parse(response).value;
        };
      }

      return (...args: unknown[]) => {
        const { send_main_command } = Host.getFunctions() as any;
        let msg: string;
        msg = JSON.stringify({ [camelToPascal(prop)]: args });
        console.log("parsed ext command msg", msg, prop, args);
        const mem = Memory.fromString(msg);
        const offset = send_main_command(mem.offset);
        const response = Memory.find(offset).readString();
        return JSON.parse(response);
      };
    }

    return undefined;
  },
});

export function callListener(event: string, ...args: unknown[]) {
  if (LISTENERS && LISTENERS[event]) {
    return Promise.resolve(LISTENERS[event](...args));
  }
}

export function open_sock(path: string) {
  const { open_clientfd } = Host.getFunctions() as any;
  const msg = Memory.fromString(path);
  const offset = open_clientfd(msg.offset);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}

export function write_sock(sock_id: number, buf: string) {
  const { write_sock } = Host.getFunctions() as any;
  const msg = Memory.fromString(buf);
  const offset = write_sock(sock_id, msg.offset);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}

export function read_sock(sock_id: number, read_len: number) {
  const { read_sock } = Host.getFunctions() as any;
  const offset = read_sock(sock_id, read_len);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}

export function hash(hash_type: "SHA1" | "SHA256" | "SHA512", data: string) {
  const { hash } = Host.getFunctions() as any;
  const hash_type_msg = Memory.fromString(hash_type);
  const data_msg = Memory.fromString(data);
  const offset = hash(hash_type_msg.offset, data_msg.offset);
  const response = Memory.find(offset).readBytes();
  return response;
}

const CryptoEncoder = new TextEncoder()

globalThis.crypto = {
  subtle: {
    digest: async (hash_type: "SHA-1" | "SHA-256" | "SHA-512", data: string) => {
      hash(hash_type.replace('-', '') as "SHA1" | "SHA256" | "SHA512", CryptoEncoder.encode(data));
    }
  }
}

async function fetch(url: string | URL, options?: undici.RequestInit) {
  const extismOptions: Parameters<typeof Http["request"]>[0] = {
    url: typeof url === "string" ? url : url.toString(),
    method: "GET"
  }
  if (options) {
    if (options.headers) {
      if (options.headers instanceof Headers) {
        const headers = options.headers
        const headersObj: HeaderRecord = {}

        headers.forEach((value, name) => {
          headersObj[name] = value
        })
        extismOptions.headers = headersObj
      } else if (Array.isArray(options.headers)) {
        extismOptions.headers = Object.fromEntries(options.headers)
      } else {
        extismOptions.headers = options.headers as HeaderRecord
      }
    }
    if (options.method) {
      // Blame Nodejs & Bun for not having a fucking request type literal
      extismOptions.method = options.method as typeof extismOptions.method
    }
    // If you need more request options, they'll either have to serialize into the headers (& be contributed here) or be PR'd into Extism's Http.request API.
  }
  return new FormedResponse(extismOptions.url, Http.request(extismOptions), new Headers(options?.headers))
}

globalThis.fetch = fetch

const FetchLogger = new ExtensionLogger("JS Fetch Stub")

const FetchEncoder = new TextEncoder()

class FormedResponse implements undici.Response {
  private Logger = FetchLogger

  private get _success() {
    return `${this._resp.status}`.charAt(0) === "2"
  }

  constructor(
    private readonly _url: string,
    private readonly _resp: ReturnType<typeof Http["request"]>,
    private readonly _headers: Headers = new Headers(),
    cloned: boolean = false
  ) {
    if (!this._success) {
      this.statusText = _resp.body

      if (!cloned) {
        // @ts-ignore // TODO: More Typescript being weird
        throw new Error(`Request failed with status ${_resp.status}`, {
          cause: this
        })
      }
    }
  }

  // Fully supported methods.
  async text() {
    return this._resp.body
  }
  private _json?: any = undefined

  async json() {
    if (this._json === undefined) {
      this._json = JSON.parse(this._resp.body)
    }
    return this._json
  }
  readonly status = this._resp.status
  readonly ok = this._success
  clone() {
    return new FormedResponse(this._url, this._resp, this._headers, true)
  }
  readonly url = this._url

  // Partially supported methods.
  async blob() {
    this.Logger.error("[blob (Blob)] Extism JS PDK does not support binary responses nor the Blob API, returning an empty object.")
    return {} as any
  }
  private get _arrayBuffer(): ArrayBuffer {
    const array = FetchEncoder.encode(this._resp.body) as Uint8Array

    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
  }
  async arrayBuffer() {
    this.Logger.warn("[arrayBuffer (ArrayBuffer)] Extism JS PDK does not support binary responses, treating as UTF-8.")

    return this._arrayBuffer
  }
  async formData() {
    // TODO: Use https://github.com/fb55/htmlparser2/ to parse XML, implement a FormData polyfill.
    this.Logger.error("[formData (FormData)] XML parser not implemented, returning an empty object.")

    return {} as undici.FormData
  }
  public bodyUsed = false
  get body() {
    this.Logger.warn("[body (ReadableStream)] Extism JS PDK does not support binary responses nor streaming, will treat as UTF-8 & immediately enqueue/close.")

    return new ReadableStream({
      type: "bytes",
      start(controller) {
        // Not sure if this is the right way to handle this.
        this._bodyUsed = true

        controller.enqueue(this._arrayBuffer)
        controller.close()
      }
    })
  }
  // extism doesn't give us this information for any of these.
  readonly redirected = false
  readonly statusText: string = "OK"
  readonly type: "basic"
  get headers() {
    this.Logger.warn("[headers (Headers)] Extism JS PDK does not support server-modified headers, returning the original headers.")

    return this._headers
  }
}

// Adapted from abab
//

const keystr =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Implementation of atob() according to the HTML and Infra specs, except that
 * instead of throwing INVALID_CHARACTER_ERR we return null.
 */
function atob(data: string) {
  if (arguments.length === 0) {
    throw new TypeError('1 argument required, but only 0 present.');
  }

  // Web IDL requires DOMStrings to just be converted using ECMAScript
  // ToString, which in our case amounts to using a template literal.
  data = `${data}`;
  // "Remove all ASCII whitespace from data."
  data = data.replace(/[ \t\n\f\r]/g, '');

  // "If data's length divides by 4 leaving no remainder, then: if data ends
  // with one or two U+003D (=) code points, then remove them from data."
  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, '');
  }

  // "If data's length divides by 4 leaving a remainder of 1, then return
  // failure."
  //
  // "If data contains a code point that is not one of
  //
  // U+002B (+)
  // U+002F (/)
  // ASCII alphanumeric
  //
  // then return failure."
  if (data.length % 4 === 1 || /[^+/0-9A-Za-z]/.test(data)) {
    throw new Error('Failed to decode base64: invalid character. InvalidCharacterError');
  }

  // "Let output be an empty byte sequence."
  let output = '';
  // "Let buffer be an empty buffer that can have bits appended to it."
  //
  // We append bits via left-shift and or.  accumulatedBits is used to track
  // when we've gotten to 24 bits.
  let buffer = 0;
  let accumulatedBits = 0;

  // "Let position be a position variable for data, initially pointing at the
  // start of data."
  //
  // "While position does not point past the end of data:"
  for (let i = 0; i < data.length; i++) {
    // "Find the code point pointed to by position in the second column of
    // Table 1: The Base 64 Alphabet of RFC 4648. Let n be the number given in
    // the first cell of the same row.
    //
    // "Append to buffer the six bits corresponding to n, most significant bit
    // first."
    //
    // atobLookup() implements the table from RFC 4648.
    buffer <<= 6;
    buffer |= atobLookup(data[i]);
    accumulatedBits += 6;

    // "If buffer has accumulated 24 bits, interpret them as three 8-bit
    // big-endian numbers. Append three bytes with values equal to those
    // numbers to output, in the same order, and then empty buffer."
    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 0xff0000) >> 16);
      output += String.fromCharCode((buffer & 0xff00) >> 8);
      output += String.fromCharCode(buffer & 0xff);
      buffer = accumulatedBits = 0;
    }
    // "Advance position by 1."
  }

  // "If buffer is not empty, it contains either 12 or 18 bits. If it contains
  // 12 bits, then discard the last four and interpret the remaining eight as
  // an 8-bit big-endian number. If it contains 18 bits, then discard the last
  // two and interpret the remaining 16 as two 8-bit big-endian numbers. Append
  // the one or two bytes with values equal to those one or two numbers to
  // output, in the same order."
  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 0xff00) >> 8);
    output += String.fromCharCode(buffer & 0xff);
  }

  // "Return output."
  return output;
}

/**
 * A lookup table for atob(), which converts an ASCII character to the
 * corresponding six-bit number.
 */
function atobLookup(chr) {
  const index = keystr.indexOf(chr);

  // Throw exception if character is not in the lookup string; should not be hit in tests
  return index < 0 ? undefined : index;
}


/**
 * btoa() as defined by the HTML and Infra specs, which mostly just references
 * RFC 4648.
 */
function btoa(s: string) {
  if (arguments.length === 0) {
    throw new TypeError('1 argument required, but only 0 present.');
  }

  let i;

  // String conversion as required by Web IDL.
  s = `${s}`;

  // "The btoa() method must throw an "InvalidCharacterError" DOMException if
  // data contains any character whose code point is greater than U+00FF."
  for (i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 255) {
      throw new Error('The string to be encoded contains characters outside of the Latin1 range. InvalidCharacterError.');
    }
  }

  let out = '';

  for (i = 0; i < s.length; i += 3) {
    const groupsOfSix = [undefined, undefined, undefined, undefined];

    groupsOfSix[0] = s.charCodeAt(i) >> 2;
    groupsOfSix[1] = (s.charCodeAt(i) & 0x03) << 4;

    if (s.length > i + 1) {
      groupsOfSix[1] |= s.charCodeAt(i + 1) >> 4;
      groupsOfSix[2] = (s.charCodeAt(i + 1) & 0x0f) << 2;
    }

    if (s.length > i + 2) {
      groupsOfSix[2] |= s.charCodeAt(i + 2) >> 6;
      groupsOfSix[3] = s.charCodeAt(i + 2) & 0x3f;
    }

    for (let j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === 'undefined') {
        out += '=';
      } else {
        out += btoaLookup(groupsOfSix[j]);
      }
    }
  }

  return out;
}

/**
 * Lookup table for btoa(), which converts a six-bit number into the
 * corresponding ASCII character.
 */
function btoaLookup(index) {
  if (index >= 0 && index < 64) {
    return keystr[index];
  }

  // Throw INVALID_CHARACTER_ERR exception here -- won't be hit in the tests.
  return undefined;
}


globalThis.atob = atob;
globalThis.btoa = btoa;

/**
 * Private data for event wrappers.
 * @type {WeakMap<Event, PrivateData>}
 * @private
 */
const privateData = new WeakMap();

/**
 * Get private data.
 * @param {Event} event The event object to get private data.
 * @returns {PrivateData} The private data of the event.
 * @private
 */
function pd(event) {
    const retv = privateData.get(event);

    if (!retv) {
        throw new Error('\'this\' is expected an Event object, but got ' + event);
    }

    return retv;
}

/**
 * https://dom.spec.whatwg.org/#set-the-canceled-flag
 * @param data {PrivateData} private data.
 */
function setCancelFlag(data) {
    if (data.passiveListener !== null) {
        console.error(
            'Unable to preventDefault inside passive event listener invocation.',
            data.passiveListener);

        return;
    }

    if (!data.eventInit.cancelable) {
        return;
    }

    data.canceled = true;
}


class Event {
    constructor(eventType, eventInit = {}) {
        if (eventInit && typeof eventInit !== 'object') {
            throw TypeError('Value must be an object.');
        }

        privateData.set(this, {
            eventInit,
            eventPhase: 2,
            eventType: String(eventType),
            currentTarget: null,
            canceled: false,
            stopped: false,
            immediateStopped: false,
            passiveListener: null,
            timeStamp: Date.now(),
        });

        // https://heycam.github.io/webidl/#Unforgeable
        Object.defineProperty(this, 'isTrusted', { value: false, enumerable: true });
    }

    /**
     * The type of this event.
     * @type {string}
     */
    get type() {
        return pd(this).eventType;
    }

    /**
     * The target of this event.
     * @type {EventTarget}
     */
    get target() {
        return null;
    }

    /**
     * The target of this event.
     * @type {EventTarget}
     */
    get currentTarget() {
        return pd(this).currentTarget;
    }

    /**
     * @returns {EventTarget[]} The composed path of this event.
     */
    composedPath() {
        const currentTarget = pd(this).currentTarget;

        if (!currentTarget) {
            return [];
        }

        return [ currentTarget ];
    }

    /**
     * Constant of NONE.
     * @type {number}
     */
    get NONE() {
        return 0;
    }

    /**
     * Constant of CAPTURING_PHASE.
     * @type {number}
     */
    get CAPTURING_PHASE() {
        return 1;
    }

    /**
     * Constant of AT_TARGET.
     * @type {number}
     */
    get AT_TARGET() {
        return 2;
    }

    /**
     * Constant of BUBBLING_PHASE.
     * @type {number}
     */
    get BUBBLING_PHASE() {
        return 3;
    }

    /**
     * The target of this event.
     * @type {number}
     */
    get eventPhase() {
        return pd(this).eventPhase;
    }

    /**
     * Stop event bubbling.
     * @returns {void}
     */
    stopPropagation() {
        pd(this).stopped = true;
    }

    /**
     * Stop event bubbling.
     * @returns {void}
     */
    stopImmediatePropagation() {
        const data = pd(this);

        data.stopped = true;
        data.immediateStopped = true;
    }

    /**
     * The flag to be bubbling.
     * @type {boolean}
     */
    get bubbles() {
        return Boolean(pd(this).eventInit.bubbles);
    }

    /**
     * The flag to be cancelable.
     * @type {boolean}
     */
    get cancelable() {
        return Boolean(pd(this).eventInit.cancelable);
    }

    /**
     * Cancel this event.
     * @returns {void}
     */
    preventDefault() {
        setCancelFlag(pd(this));
    }

    /**
     * The flag to indicate cancellation state.
     * @type {boolean}
     */
    get defaultPrevented() {
        return pd(this).canceled;
    }

    /**
     * The flag to be composed.
     * @type {boolean}
     */
    get composed() {
        return Boolean(pd(this).eventInit.composed);
    }

    /**
     * The unix time of this event.
     * @type {number}
     */
    get timeStamp() {
        return pd(this).timeStamp;
    }
}


/**
 * CustomEvent.
 */
class CustomEvent extends Event {
    /**
     * Any data passed when initializing the event.
     * @type {any}
     */
    get detail() {
        return Boolean(pd(this).eventInit.detail);
    }
}


/**
 * Get the immediateStopped flag of a given event.
 * @param {Event} event The event to get.
 * @returns {boolean} The flag to stop propagation immediately.
 * @private
 */
function isStopped(event) {
    return pd(event).immediateStopped;
}

/**
 * Set the current event phase of a given event.
 * @param {Event} event The event to set current target.
 * @param {number} eventPhase New event phase.
 * @returns {void}
 * @private
 */
function setEventPhase(event, eventPhase) {
    pd(event).eventPhase = eventPhase;
}

/**
 * Set the current target of a given event.
 * @param {Event} event The event to set current target.
 * @param {EventTarget|null} currentTarget New current target.
 * @returns {void}
 * @private
 */
function setCurrentTarget(event, currentTarget) {
    pd(event).currentTarget = currentTarget;
}

/**
 * Set a passive listener of a given event.
 * @param {Event} event The event to set current target.
 * @param {Function|null} passiveListener New passive listener.
 * @returns {void}
 * @private
 */
function setPassiveListener(event, passiveListener) {
    pd(event).passiveListener = passiveListener;
}

/**
 * @typedef {object} ListenerNode
 * @property {Function} listener
 * @property {1|2|3} listenerType
 * @property {boolean} passive
 * @property {boolean} once
 * @property {ListenerNode|null} next
 * @private
 */

/**
 * @type {WeakMap<object, Map<string, ListenerNode>>}
 * @private
 */
const listenersMap = new WeakMap();

// Listener types
const CAPTURE = 1;
const BUBBLE = 2;
const ATTRIBUTE = 3;

/**
 * Check whether a given value is an object or not.
 * @param {any} x The value to check.
 * @returns {boolean} `true` if the value is an object.
 */
function isObject(x) {
    return x !== null && typeof x === 'object'; // eslint-disable-line no-restricted-syntax
}

/**
 * Get listeners.
 * @param {EventTarget} eventTarget The event target to get.
 * @returns {Map<string, ListenerNode>} The listeners.
 * @private
 */
function getListeners(eventTarget) {
    const listeners = listenersMap.get(eventTarget);

    if (!listeners) {
        throw new TypeError(
            '\'this\' is expected an EventTarget object, but got another value.'
        );
    }

    return listeners;
}

/**
 * Get the property descriptor for the event attribute of a given event.
 * @param {string} eventName The event name to get property descriptor.
 * @returns {PropertyDescriptor} The property descriptor.
 * @private
 */
function defineEventAttributeDescriptor(eventName) {
    return {
        get() {
            const listeners = getListeners(this);
            let node = listeners.get(eventName);

            while (node) {
                if (node.listenerType === ATTRIBUTE) {
                    return node.listener;
                }

                node = node.next;
            }

            return null;
        },

        set(listener) {
            if (typeof listener !== 'function' && !isObject(listener)) {
                listener = null; // eslint-disable-line no-param-reassign
            }

            const listeners = getListeners(this);

            // Traverse to the tail while removing old value.
            let prev = null;
            let node = listeners.get(eventName);

            while (node) {
                if (node.listenerType === ATTRIBUTE) {
                    // Remove old value.
                    if (prev !== null) {
                        prev.next = node.next;
                    } else if (node.next !== null) {
                        listeners.set(eventName, node.next);
                    } else {
                        listeners.delete(eventName);
                    }
                } else {
                    prev = node;
                }

                node = node.next;
            }

            // Add new value.
            if (listener !== null) {
                const newNode = {
                    listener,
                    listenerType: ATTRIBUTE,
                    passive: false,
                    once: false,
                    next: null,
                };

                if (prev === null) {
                    listeners.set(eventName, newNode);
                } else {
                    prev.next = newNode;
                }
            }
        },
        configurable: true,
        enumerable: true,
    };
}

/**
 * Define an event attribute (e.g. `eventTarget.onclick`).
 * @param {Object} eventTargetPrototype The event target prototype to define an event attrbite.
 * @param {string} eventName The event name to define.
 * @returns {void}
 */
function defineEventAttribute(eventTargetPrototype, eventName) {
    Object.defineProperty(
        eventTargetPrototype,
        `on${eventName}`,
        defineEventAttributeDescriptor(eventName)
    );
}

/**
 * EventTarget.
 */
class EventTarget {
    constructor() {
        this.__init();
    }

    __init() {
        listenersMap.set(this, new Map());
    }

    /**
     * Add a given listener to this event target.
     * @param {string} eventName The event name to add.
     * @param {Function} listener The listener to add.
     * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
     * @returns {void}
     */
    addEventListener(eventName, listener, options) {
        if (!listener) {
            return;
        }

        if (typeof listener !== 'function' && !isObject(listener)) {
            throw new TypeError('\'listener\' should be a function or an object.');
        }

        const self = this ?? globalThis;
        const listeners = getListeners(self);
        const optionsIsObj = isObject(options);
        const capture = optionsIsObj
            ? Boolean(options.capture)
            : Boolean(options);
        const listenerType = capture ? CAPTURE : BUBBLE;
        const newNode = {
            listener,
            listenerType,
            passive: optionsIsObj && Boolean(options.passive),
            once: optionsIsObj && Boolean(options.once),
            next: null,
        };

        // Set it as the first node if the first node is null.
        let node = listeners.get(eventName);

        if (node === undefined) {
            listeners.set(eventName, newNode);

            return;
        }

        // Traverse to the tail while checking duplication..
        let prev = null;

        while (node) {
            if (
                node.listener === listener &&
                node.listenerType === listenerType
            ) {
                // Should ignore duplication.
                return;
            }

            prev = node;
            node = node.next;
        }

        // Add it.
        prev.next = newNode;
    }

    /**
     * Remove a given listener from this event target.
     * @param {string} eventName The event name to remove.
     * @param {Function} listener The listener to remove.
     * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
     * @returns {void}
     */
    removeEventListener(eventName, listener, options) {
        if (!listener) {
            return;
        }

        const self = this ?? globalThis;
        const listeners = getListeners(self);
        const capture = isObject(options)
            ? Boolean(options.capture)
            : Boolean(options);
        const listenerType = capture ? CAPTURE : BUBBLE;

        let prev = null;
        let node = listeners.get(eventName);

        while (node) {
            if (
                node.listener === listener &&
                node.listenerType === listenerType
            ) {
                if (prev !== null) {
                    prev.next = node.next;
                } else if (node.next !== null) {
                    listeners.set(eventName, node.next);
                } else {
                    listeners.delete(eventName);
                }

                return;
            }

            prev = node;
            node = node.next;
        }
    }

    /**
     * Dispatch a given event.
     * @param {Event|{type:string}} event The event to dispatch.
     * @returns {boolean} `false` if canceled.
     */
    dispatchEvent(event) {
        if (typeof event !== 'object') {
            throw new TypeError('Argument 1 of EventTarget.dispatchEvent is not an object.');
        }

        if (!(event instanceof Event)) {
            throw new TypeError('Argument 1 of EventTarget.dispatchEvent does not implement interface Event.');
        }

        const self = this ?? globalThis;

        // Set the current target.
        setCurrentTarget(event, self);

        // If listeners aren't registered, terminate.
        const listeners = getListeners(self);
        const eventName = event.type;
        let node = listeners.get(eventName);

        if (!node) {
            return true;
        }

        // This doesn't process capturing phase and bubbling phase.
        // This isn't participating in a tree.
        let prev = null;

        while (node) {
            // Remove this listener if it's once
            if (node.once) {
                if (prev !== null) {
                    prev.next = node.next;
                } else if (node.next !== null) {
                    listeners.set(eventName, node.next);
                } else {
                    listeners.delete(eventName);
                }
            } else {
                prev = node;
            }

            // Call this listener
            setPassiveListener(event, node.passive ? node.listener : null);

            if (typeof node.listener === 'function') {
                node.listener.call(self, event);
            } else if (node.listenerType !== ATTRIBUTE && typeof node.listener.handleEvent === 'function') {
                node.listener.handleEvent(event);
            }

            // Break if `event.stopImmediatePropagation` was called.
            if (isStopped(event)) {
                break;
            }

            node = node.next;
        }

        setPassiveListener(event, null);
        setEventPhase(event, 0);
        // setCurrentTarget(event, null); ?

        return !event.defaultPrevented;
    }
}

globalThis.Event = Event;
globalThis.CustomEvent = CustomEvent;
globalThis.EventTarget = EventTarget;
globalThis.defineEventAttribute = defineEventAttribute;
