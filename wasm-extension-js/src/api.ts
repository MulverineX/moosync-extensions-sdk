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

// Moosync
// Copyright (C) 2025 Moosync
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
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { ExtensionAPI } from "./types";

export interface MoosyncExtensionTemplate {
  onStarted: () => Promise<void>;
}

var LISTENERS: Record<string, Function>;

function camelToPascal(camelCaseStr: string) {
  // Capitalize the first character and concatenate with the rest of the string
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
}

export const api: ExtensionAPI = new Proxy({} as ExtensionAPI, {
  get: (_target, prop, _receiver) => {
    if (prop === "on") {
      return (eventName: string, callback: Function) => {
        if (!LISTENERS) {
          LISTENERS = {};
        }
        LISTENERS[eventName] = callback;
      };
    }

    if (typeof prop === "string") {
      return (arg: unknown) => {
        const { send_main_command } = Host.getFunctions() as any;
        let msg: string;
        msg = JSON.stringify({ [camelToPascal(prop)]: arg ?? [] });
        console.log("parsed ext command msg", msg, prop, arg);
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
