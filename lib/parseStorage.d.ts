export declare enum StorageType {
    Contract = 0,
    Struct = 1
}
export interface Storage {
    fromSlot: number;
    toSlot?: number;
    byteOffset: number;
    type: string;
    variable: string;
    value?: string;
    struct?: Storage;
}
export interface Slots {
    name: string;
    type: StorageType;
    storages: Storage[];
}
