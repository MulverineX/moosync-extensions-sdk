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

import { ExtensionAPI, ExtensionEventCommands, ExtensionEventName, ExtensionEventNames, ProviderScope } from "./types";

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

export interface MoosyncExtension extends ExtensionEventCommands {}

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
          console.log("parsed ext command msg", msg, prop, { key});
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
