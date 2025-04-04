import type * as undici from 'undici-types';

declare const fetch: (url: string, options?: undici.RequestInit) => Promise<undici.Response>

declare const btoa: (input: string) => string;
declare const atob: (input: string) => string;