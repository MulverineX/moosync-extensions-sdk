import type * as undici from 'undici-types';
import type { Headers } from "headers-polyfill";
import type { ReadableStream } from "web-streams-polyfill";
import type * as Events from './polyfills/event';

declare global {
    const fetch: (url: string, options?: undici.RequestInit) => Promise<undici.Response>;
    const Headers: Headers;
    const ReadableStream: ReadableStream;
    const btoa: (input: string) => string;
    const atob: (input: string) => string;
    const crypto: {
        readonly subtle: {
            readonly digest: (hash_type: "SHA-1" | "SHA-256" | "SHA-512", data: string) => Promise<ArrayBuffer>
        }
    };
    const Event: Events._Event;
    const CustomEvent: Events._CustomEvent;
    const EventTarget: Events._EventTarget;
    const defineEventAttribute: typeof Events._defineEventAttribute;
    const defineEventAttributeDescriptor: typeof Events._defineEventAttributeDescriptor;
}

export {}