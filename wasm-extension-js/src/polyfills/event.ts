type PrivateData = {
  /** The init object passed to the constructor */
  eventInit: {
    /** Defines the type of event */
    type?: string
    /** Whether the event should bubble up through the event chain or not. Once set, the read-only property Event.bubbles will give its value. */
    bubbles?: boolean
    /** Whether the event can be canceled. Once set, the read-only property Event.cancelable will give its value. */
    cancelable?: boolean
    /** Whether the event can be composed. Once set, the read-only property Event.composed will give its value. */
    composed?: boolean
    /** The detail of the event, only present on CustomEvent. */
    detail?: any
  };
  /** The event type */
  eventType: string;
  /** The current event phase */
  eventPhase: number;
  /** The current event target */
  currentTarget: _EventTarget | null;
  /** The flag to prevent default */
  canceled: boolean;
  /** The flag to stop propagation */
  stopped: boolean;
  /** The flag to stop propagation immediately */
  immediateStopped: boolean;
  /** The listener if the current listener is passive. Otherwise this is null */
  passiveListener: Function | null;
  /** The unix time */
  timeStamp: number;
}

/**
 * Private data for event wrappers.
 * @private
 */
const privateData: WeakMap<_Event, PrivateData> = new WeakMap();

/**
 * Get private data.
 * @param event The event object to get private data. The private data of the event.
 * @private
 */
function pd(event: _Event): PrivateData {
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
function setCancelFlag(data: PrivateData) {
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


export class _Event {
  constructor(eventType, eventInit: PrivateData['eventInit'] = {}) {
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
   */
  get type() {
    return pd(this).eventType;
  }

  /**
   * The target of this event.
   */
  get target() {
    return null;
  }

  /**
   * The target of this event.
   */
  get currentTarget() {
    return pd(this).currentTarget;
  }

  /**
   * @returns The composed path of this event.
   */
  composedPath(): _EventTarget[] {
    const currentTarget = pd(this).currentTarget;

    if (!currentTarget) {
      return [];
    }

    return [currentTarget];
  }

  /**
   * Constant of NONE.
   */
  get NONE() {
    return 0;
  }

  /**
   * Constant of CAPTURING_PHASE.
   */
  get CAPTURING_PHASE() {
    return 1;
  }

  /**
   * Constant of AT_TARGET.
   */
  get AT_TARGET() {
    return 2;
  }

  /**
   * Constant of BUBBLING_PHASE.
   */
  get BUBBLING_PHASE() {
    return 3;
  }

  /**
   * The target of this event.
   */
  get eventPhase() {
    return pd(this).eventPhase;
  }

  /**
   * Stop event bubbling.
   */
  stopPropagation(): void {
    pd(this).stopped = true;
  }

  /**
   * Stop event bubbling.
   */
  stopImmediatePropagation(): void {
    const data = pd(this);

    data.stopped = true;
    data.immediateStopped = true;
  }

  /**
   * The flag to be bubbling.
   */
  get bubbles() {
    return Boolean(pd(this).eventInit.bubbles);
  }

  /**
   * The flag to be cancelable.
   */
  get cancelable() {
    return Boolean(pd(this).eventInit.cancelable);
  }

  /**
   * Cancel this event.
   */
  preventDefault(): void {
    setCancelFlag(pd(this));
  }

  /**
   * The flag to indicate cancellation state.
   */
  get defaultPrevented() {
    return pd(this).canceled;
  }

  /**
   * The flag to be composed.
   */
  get composed() {
    return Boolean(pd(this).eventInit.composed);
  }

  /**
   * The unix time of this event.
   */
  get timeStamp() {
    return pd(this).timeStamp;
  }
}


/**
 * CustomEvent.
 */
export class _CustomEvent extends _Event {
  /**
   * Any data passed when initializing the event.
   */
  get detail() {
    return Boolean(pd(this).eventInit.detail);
  }
}


/**
 * Get the immediateStopped flag of a given event.
 * @param event The event to get. The flag to stop propagation immediately.
 * @private
 */
function isStopped(event: _Event): boolean {
  return pd(event).immediateStopped;
}

/**
 * Set the current event phase of a given event.
 * @param event The event to set current target.
 * @param eventPhase New event phase.
 * @private
 */
function setEventPhase(event: _Event, eventPhase: number): void {
  pd(event).eventPhase = eventPhase;
}

/**
 * Set the current target of a given event.
 * @param event The event to set current target.
 * @param currentTarget New current target.
 * @private
 */
function setCurrentTarget(event: _Event, currentTarget: _EventTarget | typeof globalThis | null): void {
  /* @ts-ignore */
  pd(event).currentTarget = currentTarget;
}

/**
 * Set a passive listener of a given event.
 * @param event The event to set current target.
 * @param passiveListener New passive listener.
 * @private
 */
function setPassiveListener(event: _Event, passiveListener: Function | null): void {
  pd(event).passiveListener = passiveListener;
}

type ListenerNode = {
  listener: Function | {
    handleEvent: (event: _Event) => void;
  };
  listenerType: 1 | 2 | 3;
  passive: boolean;
  once: boolean;
  next: ListenerNode | undefined;
}

/**
 * @private
 */
const listenersMap: WeakMap<object, Map<string, ListenerNode>> = new WeakMap();

// Listener types
const CAPTURE = 1;
const BUBBLE = 2;
const ATTRIBUTE = 3;

/**
 * Check whether a given value is an object or not.
 * @param x The value to check. `true` if the value is an object.
 */
function isObject(x: any): boolean {
  return x !== null && typeof x === 'object'; // eslint-disable-line no-restricted-syntax
}

/**
 * Get listeners.
 * @param eventTarget The event target to get.
 * @returns The listeners.
 * @private
 */
function getListeners(eventTarget: _EventTarget | typeof globalThis): Map<string, ListenerNode> {
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
 * @param eventName The event name to get property descriptor. The property descriptor.
 * @private
 */
export function _defineEventAttributeDescriptor(eventName: string): PropertyDescriptor {
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
      let prev: null | ListenerNode = null;
      let node = listeners.get(eventName);

      while (node) {
        if (node.listenerType === ATTRIBUTE) {
          // Remove old value.
          if (prev !== null) {
            prev.next = node.next;
          } else if (node.next !== undefined) {
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
        const newNode: ListenerNode = {
          listener,
          listenerType: ATTRIBUTE,
          passive: false,
          once: false,
          next: undefined,
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
 * @param eventTargetPrototype The event target prototype to define an event attrbite.
 * @param eventName The event name to define.
 */
export function _defineEventAttribute(eventTargetPrototype: object, eventName: string): void {
  Object.defineProperty(
    eventTargetPrototype,
    `on${eventName}`,
    _defineEventAttributeDescriptor(eventName)
  );
}

export type _EventListenerOptions = { capture?: boolean; passive?: boolean; once?: boolean; }

/**
 * EventTarget.
 */
export class _EventTarget {
  constructor() {
    this.__init();
  }

  __init() {
    listenersMap.set(this, new Map());
  }

  /**
   * Add a given listener to this event target.
   * @param eventName The event name to add.
   * @param listener The listener to add.
   * @param options The options for this listener.
   */
  addEventListener(eventName: string, listener: Function, options: boolean | _EventListenerOptions): void {
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
      ? Boolean((options as _EventListenerOptions).capture)
      : Boolean(options);
    const listenerType = capture ? CAPTURE : BUBBLE;
    const newNode: ListenerNode = {
      listener,
      listenerType,
      passive: optionsIsObj && Boolean((options as _EventListenerOptions).passive),
      once: optionsIsObj && Boolean((options as _EventListenerOptions).once),
      next: undefined,
    };

    // Set it as the first node if the first node is null.
    let node = listeners.get(eventName);

    if (node === undefined) {
      listeners.set(eventName, newNode);

      return;
    }

    // Traverse to the tail while checking duplication..
    let prev: null | ListenerNode = null;

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
    prev!.next = newNode;
  }

  /**
   * Remove a given listener from this event target.
   * @param eventName The event name to remove.
   * @param listener The listener to remove.
   * @param options The options for this listener.
   */
  removeEventListener(eventName: string, listener: Function, options: boolean | _EventListenerOptions): void {
    if (!listener) {
      return;
    }

    const self = this ?? globalThis;
    const listeners = getListeners(self);
    const capture = isObject(options)
      ? Boolean((options as _EventListenerOptions).capture)
      : Boolean(options);
    const listenerType = capture ? CAPTURE : BUBBLE;

    let prev: null | ListenerNode = null;
    let node = listeners.get(eventName);

    while (node) {
      if (
        node.listener === listener &&
        node.listenerType === listenerType
      ) {
        if (prev !== null) {
          prev.next = node.next;
        } else if (node.next !== undefined) {
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
   * @param event The event to dispatch. `false` if canceled.
   */
  dispatchEvent(event: _Event | { type: string; }): boolean {
    if (typeof event !== 'object') {
      throw new TypeError('Argument 1 of EventTarget.dispatchEvent is not an object.');
    }

    if (!(event instanceof _Event)) {
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
    let prev: null | ListenerNode = null;

    while (node) {
      // Remove this listener if it's once
      if (node.once) {
        if (prev !== null) {
          prev.next = node.next;
        } else if (node.next !== undefined) {
          listeners.set(eventName, node.next);
        } else {
          listeners.delete(eventName);
        }
      } else {
        prev = node;
      }

      // Call this listener
      setPassiveListener(event, node.passive ? node.listener as Function : null);

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