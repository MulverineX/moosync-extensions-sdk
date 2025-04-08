export function digest(hash_type: "SHA-1" | "SHA-256" | "SHA-512", _data: string | Uint8Array) {
    const data = typeof _data === "string" ? new TextEncoder().encode(_data) : _data

    const { hash } = Host.getFunctions() as any;
    const hash_type_msg = Memory.fromString(hash_type);
    const data_msg = Memory.fromBuffer(data);
    const offset = hash(hash_type_msg.offset, data_msg.offset);
    const response = Memory.find(offset).readBytes();
    return response;
}