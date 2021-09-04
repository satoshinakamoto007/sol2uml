import { Attribute, UmlClass } from './umlClass';
export declare enum StorageType {
    Contract = 0,
    Struct = 1
}
export interface Storage {
    id: number;
    fromSlot: number;
    toSlot: number;
    byteSize: number;
    byteOffset: number;
    type: string;
    variable: string;
    contractName?: string;
    value?: string;
    structSlotsId?: number;
    enumId?: number;
}
export interface Slots {
    id: number;
    name: string;
    address?: string;
    type: StorageType;
    storages: Storage[];
}
export declare const convertClasses2Slots: (contractName: string, umlClasses: UmlClass[], structSlots?: Slots[]) => Slots;
export declare const parseStructSlots: (attribute: Attribute, otherClasses: UmlClass[], structSlots: Slots[]) => Slots | undefined;
export declare const calcStorageByteSize: (attribute: Attribute, umlClass: UmlClass, otherClasses: UmlClass[]) => number;
export declare const isElementary: (type: string) => boolean;
