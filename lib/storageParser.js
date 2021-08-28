"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isElementary = exports.calcStorageByteSize = exports.convertClasses2Slots = exports.StorageType = void 0;
const umlClass_1 = require("./umlClass");
var StorageType;
(function (StorageType) {
    StorageType[StorageType["Contract"] = 0] = "Contract";
    StorageType[StorageType["Struct"] = 1] = "Struct";
    StorageType[StorageType["Enum"] = 2] = "Enum";
})(StorageType = exports.StorageType || (exports.StorageType = {}));
const convertClasses2Slots = (contractName, umlClasses) => {
    // Find the base UML Class from the base contract name
    const umlClass = umlClasses.find(({ name }) => {
        return name === contractName;
    });
    if (!umlClass) {
        throw Error(`Failed to find contract with name "${contractName}"`);
    }
    const storages = parseStorage(umlClass, [], umlClasses);
    return {
        name: contractName,
        type: umlClass.stereotype === umlClass_1.ClassStereotype.Struct
            ? StorageType.Struct
            : StorageType.Contract,
        storages,
    };
};
exports.convertClasses2Slots = convertClasses2Slots;
const parseStorage = (umlClass, storages, umlClasses) => {
    // For each inherited contract or abstract contract
    // that is, each realisation that is not a Library
    const parentContracts = Object.values(umlClass.associations).filter((association) => association.realization &&
        association.targetUmlClassStereotype !== umlClass_1.ClassStereotype.Interface);
    //
    parentContracts.forEach((parent) => {
        const parentClass = umlClasses.find((umlClass) => umlClass.name === parent.targetUmlClassName);
        if (!parentClass)
            throw Error(`Failed to find parent contract ${umlClass.name}`);
        parseStorage(parentClass, storages, umlClasses);
    });
    // For each attribute
    umlClass.attributes.forEach((attribute) => {
        const byteSize = exports.calcStorageByteSize(attribute, umlClass, umlClasses);
        // Get the toSlot of the last storage item
        let lastToSlot = 0;
        let nextOffset = 0;
        if (storages.length > 0) {
            const lastStorage = storages[storages.length - 1];
            lastToSlot = lastStorage.toSlot;
            nextOffset = lastStorage.byteOffset + lastStorage.byteSize;
        }
        if (nextOffset + byteSize > 32) {
            const nextFromSlot = storages.length > 0 ? lastToSlot + 1 : 0;
            storages.push({
                fromSlot: nextFromSlot,
                // div by 33 and not 32 as 32 is still in the same slot
                toSlot: nextFromSlot + Math.floor(byteSize / 33),
                byteSize,
                byteOffset: 0,
                type: attribute.type,
                variable: attribute.name,
            });
        }
        else {
            storages.push({
                fromSlot: lastToSlot,
                toSlot: lastToSlot,
                byteSize,
                byteOffset: nextOffset,
                type: attribute.type,
                variable: attribute.name,
            });
        }
    });
    return storages;
};
// Calculates the storage size of an attribute in bytes
const calcStorageByteSize = (attribute, umlClass, otherClasses) => {
    if (attribute.attributeType === umlClass_1.AttributeType.Mapping ||
        attribute.attributeType === umlClass_1.AttributeType.Function) {
        return 32;
    }
    if (attribute.attributeType === umlClass_1.AttributeType.Array) {
        // All array dimensions must be fixed. eg [2][3][8].
        const result = attribute.type.match(/(\w+)(\[([1-9][0-9]*)\])+$/);
        // The above will not match any dynamic array dimensions, eg [],
        // as there needs to be one or more [0-9]+ in the square brackets
        if (result === null) {
            // Any dynamic array dimension means the whole array is dynamic
            // so only takes 32 bytes (1 slot)
            return 32;
        }
        // All array dimensions are fixes so we now need to multiply all the dimensions
        // to get a total number of array elements
        const arrayDimensions = attribute.type.match(/\[\d+/g);
        const dimensionsStr = arrayDimensions.map((d) => d.slice(1));
        const dimensions = dimensionsStr.map((d) => parseInt(d));
        let elementSize;
        // If a fixed sized array
        if (exports.isElementary(result[1])) {
            const elementAttribute = {
                attributeType: umlClass_1.AttributeType.Elementary,
                type: result[1],
                name: 'element',
            };
            elementSize = exports.calcStorageByteSize(elementAttribute, umlClass, otherClasses);
            // Anything over 16 bytes, like an address, will take a whole 32 byte slot
            if (elementSize > 16 && elementSize < 32) {
                elementSize = 32;
            }
        }
        else {
            const elementAttribute = {
                attributeType: umlClass_1.AttributeType.UserDefined,
                type: result[1],
                name: 'userDefined',
            };
            elementSize = exports.calcStorageByteSize(elementAttribute, umlClass, otherClasses);
        }
        const firstDimensionBytes = elementSize * dimensions[0];
        const firstDimensionSlotBytes = Math.ceil(firstDimensionBytes / 32) * 32;
        const remainingElements = dimensions
            .slice(1)
            .reduce((total, dimension) => total * dimension, 1);
        return firstDimensionSlotBytes * remainingElements;
    }
    // If a Struct or Enum
    if (attribute.attributeType === umlClass_1.AttributeType.UserDefined) {
        // Is the user defined type linked to a contract level enum
        const enumType = umlClass.enums[attribute.type];
        if (enumType) {
            return 1;
        }
        // Is the user defined type linked to a contract level struct
        const structAttributes = umlClass.structs[attribute.type];
        if (structAttributes) {
            let structByteSize = 0;
            structAttributes.forEach((structAttribute) => {
                // If next attribute is an array, then we need to start in a new slot
                if (structAttribute.attributeType === umlClass_1.AttributeType.Array) {
                    structByteSize = Math.ceil(structByteSize / 32) * 32;
                }
                structByteSize += exports.calcStorageByteSize(structAttribute, umlClass, otherClasses);
            });
            return Math.ceil(structByteSize / 32) * 32;
        }
        // Is the user defined type linked to another Contract or file level Struct or Enum?
        const attributeClass = otherClasses.find(({ name }) => {
            return name === attribute.type;
        });
        if (!attributeClass) {
            throw Error(`Failed to find user defined type "${attribute.type}"`);
        }
        switch (attributeClass.stereotype) {
            case umlClass_1.ClassStereotype.Enum:
                return 1;
            case umlClass_1.ClassStereotype.Contract:
            case umlClass_1.ClassStereotype.Abstract:
            case umlClass_1.ClassStereotype.Interface:
            case umlClass_1.ClassStereotype.Library:
                return 32;
            case umlClass_1.ClassStereotype.Struct:
                let structByteSize = 0;
                attributeClass.attributes.forEach((structAttribute) => {
                    structByteSize += exports.calcStorageByteSize(structAttribute, umlClass, otherClasses);
                });
                // structs take whole 32 byte slots so round up to the nearest 32 sized slots
                return Math.ceil(structByteSize / 32) * 32;
            default:
                return 32;
        }
    }
    if (attribute.attributeType === umlClass_1.AttributeType.Elementary) {
        switch (attribute.type) {
            case 'bool':
                return 1;
            case 'address':
                return 20;
            case 'string':
            case 'bytes':
            case 'uint':
            case 'int':
            case 'ufixed':
            case 'fixed':
                return 32;
            default:
                const result = attribute.type.match(/[u]*(int|fixed|bytes)([0-9]+)/);
                if (result === null || !result[2]) {
                    throw Error(`Failed size elementary type "${attribute.type}"`);
                }
                // If bytes
                if (result[1] === 'bytes') {
                    return parseInt(result[2]);
                }
                // TODO need to handle fixed types when they are supported
                // If an int
                const bitSize = parseInt(result[2]);
                return bitSize / 8;
        }
    }
    throw new Error(`Failed to calc bytes size of attribute with name "${attribute.name}" and type ${attribute.type}`);
};
exports.calcStorageByteSize = calcStorageByteSize;
const isElementary = (type) => {
    switch (type) {
        case 'bool':
        case 'address':
        case 'string':
        case 'bytes':
        case 'uint':
        case 'int':
        case 'ufixed':
        case 'fixed':
            return true;
        default:
            const result = type.match(/[u]*(int|fixed|bytes)([0-9]+)/);
            return result !== null;
    }
};
exports.isElementary = isElementary;
//# sourceMappingURL=storageParser.js.map