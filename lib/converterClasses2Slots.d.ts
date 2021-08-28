import { Attribute, UmlClass } from './umlClass';
export declare enum StorageType {
    Contract = 0,
    Struct = 1
}
export interface Storage {
    fromSlot: number;
    toSlot: number;
    byteSize: number;
    byteOffset: number;
    type: string;
    variable: string;
    contractName?: string;
    value?: string;
}
export interface Slots {
    name: string;
    address?: string;
    type: StorageType;
    storages: Storage[];
    dependencies: Slots[];
}
export declare const convertClasses2Slots: (contractName: string, umlClasses: UmlClass[]) => Slots;
export declare const calcStorageByteSize: (attribute: Attribute, umlClass: UmlClass, otherClasses: UmlClass[]) => number;
export declare const isElementary: (type: string) => boolean;
