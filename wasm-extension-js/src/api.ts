import { ExtensionAPI, SongAPIOptions, Song } from "./types";

export interface MoosyncExtensionTemplate {
  onStarted: () => Promise<void>;
}

let LISTENERS: Record<string, Function> = {};

function camelToPascal(camelCaseStr: string) {
  // Capitalize the first character and concatenate with the rest of the string
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
}

export const api: ExtensionAPI = new Proxy({} as ExtensionAPI, {
  get: (_target, prop, _receiver) => {
    if (prop === "on") {
      return (eventName: string, callback: Function) => {
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
  if (LISTENERS[event]) {
    return Promise.resolve(LISTENERS[event](...args));
  }
  throw new Error("Not implemented");
}
