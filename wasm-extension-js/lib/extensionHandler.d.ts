import { ExtensionAPI } from "./types";
export interface MoosyncExtensionTemplate {
    onStarted: () => Promise<void>;
}
export declare const api: ExtensionAPI;
export declare function callListener(event: string, ...args: unknown[]): Promise<any>;
//# sourceMappingURL=extensionHandler.d.ts.map