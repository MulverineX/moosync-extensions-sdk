var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/api.ts
var api_exports = {};
__export(api_exports, {
  api: () => api,
  callListener: () => callListener,
  open_sock: () => open_sock,
  read_sock: () => read_sock,
  write_sock: () => write_sock
});
module.exports = __toCommonJS(api_exports);
var LISTENERS;
function camelToPascal(camelCaseStr) {
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
}
var api = new Proxy({}, {
  get: (_target, prop, _receiver) => {
    if (prop === "on") {
      return (eventName, callback) => {
        if (!LISTENERS) {
          LISTENERS = {};
        }
        LISTENERS[eventName] = callback;
      };
    }
    if (typeof prop === "string") {
      return (arg) => {
        const { send_main_command } = Host.getFunctions();
        let msg;
        msg = JSON.stringify({ [camelToPascal(prop)]: arg ?? [] });
        console.log("parsed ext command msg", msg, prop, arg);
        const mem = Memory.fromString(msg);
        const offset = send_main_command(mem.offset);
        const response = Memory.find(offset).readString();
        return JSON.parse(response);
      };
    }
    return void 0;
  }
});
function callListener(event, ...args) {
  if (LISTENERS && LISTENERS[event]) {
    return Promise.resolve(LISTENERS[event](...args));
  }
}
function open_sock(path) {
  const { open_clientfd } = Host.getFunctions();
  const msg = Memory.fromString(path);
  const offset = open_clientfd(msg.offset);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}
function write_sock(sock_id, buf) {
  const { write_sock: write_sock2 } = Host.getFunctions();
  const msg = Memory.fromString(buf);
  const offset = write_sock2(sock_id, msg.offset);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}
function read_sock(sock_id, read_len) {
  const { read_sock: read_sock2 } = Host.getFunctions();
  const offset = read_sock2(sock_id, read_len);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}
//# sourceMappingURL=api.js.map
