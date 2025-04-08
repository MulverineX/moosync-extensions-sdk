import { Headers } from "headers-polyfill";
import { ReadableStream } from "web-streams-polyfill";

import type * as undici from "undici-types";
import type { HeaderRecord } from 'undici-types/header';
import { ExtensionLogger } from '../api';

export async function _fetch(url: string | URL, options?: undici.RequestInit) {
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
        throw new Error(`Request failed with status ${_resp.status}`)
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
  get status() {
    return this._resp.status
  }
  readonly ok = this._success
  clone() {
    return new FormedResponse(this._url, this._resp, this._headers, true)
  }
  get url() {
    return this._url
  }

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