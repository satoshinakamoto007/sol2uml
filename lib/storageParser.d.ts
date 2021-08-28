import { Attribute, UmlClass } from './umlClass';
export declare enum StorageType {
    Contract = 0,
    Struct = 1,
    Enum = 2
}
export interface Storage {
    fromSlot: number;
    toSlot: number;
    byteSize: number;
    byteOffset: number;
    type: string;
    variable: string;
    value?: string;
    struct?: Storage;
}
export interface Slots {
    name: string;
    address?: string;
    type: StorageType;
    storages: Storage[];
}
export declare const convertClasses2Slots: (contractName: string, umlClasses: UmlClass[]) => Slots;
export declare const calcStorageByteSize: (attribute: Attribute, umlClass: UmlClass, otherClasses: UmlClass[]) => number;
export declare const isElementary: (type: string) => boolean;
