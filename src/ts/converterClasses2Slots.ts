import { Attribute, AttributeType, ClassStereotype, UmlClass } from './umlClass'

export enum StorageType {
    Contract,
    Struct,
    Enum,
}

export interface Storage {
    fromSlot: number
    toSlot: number
    byteSize: number
    byteOffset: number
    type: string
    variable: string
    value?: string
    struct?: Storage
}

export interface Slots {
    name: string
    address?: string
    type: StorageType
    storages: Storage[]
}

export const convertClasses2Slots = (
    contractName: string,
    umlClasses: UmlClass[]
): Slots => {
    // Find the base UML Class from the base contract name
    const umlClass = umlClasses.find(({ name }) => {
        return name === contractName
    })

    if (!umlClass) {
        throw Error(`Failed to find contract with name "${contractName}"`)
    }

    const storages = parseStorage(umlClass, [], umlClasses)

    return {
        name: contractName,
        type:
            umlClass.stereotype === ClassStereotype.Struct
                ? StorageType.Struct
                : StorageType.Contract,
        storages,
    }
}

const parseStorage = (
    umlClass: UmlClass,
    storages: Storage[],
    umlClasses: UmlClass[]
) => {
    // Get immediate parent contracts that the class inherits from
    const parentContracts = umlClass.getParentContracts()
    parentContracts.forEach((parent) => {
        const parentClass = umlClasses.find(
            (umlClass) => umlClass.name === parent.targetUmlClassName
        )
        if (!parentClass)
            throw Error(
                `Failed to find parent contract ${parent.targetUmlClassName} of ${umlClass.name}`
            )
        parseStorage(parentClass, storages, umlClasses)
    })

    // For each attribute
    umlClass.attributes.forEach((attribute) => {
        // Ignore any attributes that are constants or immutable
        if (attribute.compiled) return

        const byteSize = calcStorageByteSize(attribute, umlClass, umlClasses)

        // Get the toSlot of the last storage item
        let lastToSlot = 0
        let nextOffset = 0
        if (storages.length > 0) {
            const lastStorage = storages[storages.length - 1]
            lastToSlot = lastStorage.toSlot
            nextOffset = lastStorage.byteOffset + lastStorage.byteSize
        }
        if (nextOffset + byteSize > 32) {
            const nextFromSlot = storages.length > 0 ? lastToSlot + 1 : 0
            storages.push({
                fromSlot: nextFromSlot,
                // div by 33 and not 32 as 32 is still in the same slot
                toSlot: nextFromSlot + Math.floor(byteSize / 33),
                byteSize,
                byteOffset: 0,
                type: attribute.type,
                variable: attribute.name,
            })
        } else {
            storages.push({
                fromSlot: lastToSlot,
                toSlot: lastToSlot,
                byteSize,
                byteOffset: nextOffset,
                type: attribute.type,
                variable: attribute.name,
            })
        }
    })

    return storages
}

// Calculates the storage size of an attribute in bytes
export const calcStorageByteSize = (
    attribute: Attribute,
    umlClass: UmlClass,
    otherClasses: UmlClass[]
): number => {
    if (
        attribute.attributeType === AttributeType.Mapping ||
        attribute.attributeType === AttributeType.Function
    ) {
        return 32
    }
    if (attribute.attributeType === AttributeType.Array) {
        // All array dimensions must be fixed. eg [2][3][8].
        const result = attribute.type.match(/(\w+)(\[([1-9][0-9]*)\])+$/)

        // The above will not match any dynamic array dimensions, eg [],
        // as there needs to be one or more [0-9]+ in the square brackets
        if (result === null) {
            // Any dynamic array dimension means the whole array is dynamic
            // so only takes 32 bytes (1 slot)
            return 32
        }

        // All array dimensions are fixes so we now need to multiply all the dimensions
        // to get a total number of array elements
        const arrayDimensions = attribute.type.match(/\[\d+/g)
        const dimensionsStr = arrayDimensions.map((d) => d.slice(1))
        const dimensions = dimensionsStr.map((d) => parseInt(d))

        let elementSize: number
        // If a fixed sized array
        if (isElementary(result[1])) {
            const elementAttribute: Attribute = {
                attributeType: AttributeType.Elementary,
                type: result[1],
                name: 'element',
            }
            elementSize = calcStorageByteSize(
                elementAttribute,
                umlClass,
                otherClasses
            )
            // Anything over 16 bytes, like an address, will take a whole 32 byte slot
            if (elementSize > 16 && elementSize < 32) {
                elementSize = 32
            }
        } else {
            const elementAttribute: Attribute = {
                attributeType: AttributeType.UserDefined,
                type: result[1],
                name: 'userDefined',
            }
            elementSize = calcStorageByteSize(
                elementAttribute,
                umlClass,
                otherClasses
            )
        }
        const firstDimensionBytes = elementSize * dimensions[0]
        const firstDimensionSlotBytes = Math.ceil(firstDimensionBytes / 32) * 32
        const remainingElements = dimensions
            .slice(1)
            .reduce((total, dimension) => total * dimension, 1)
        return firstDimensionSlotBytes * remainingElements
    }
    // If a Struct or Enum
    if (attribute.attributeType === AttributeType.UserDefined) {
        // recursively look for Structs or Enums at the contract level
        // including in any inherited contracts
        const size = calcStructOrEnumByteSize(
            attribute.type,
            umlClass,
            otherClasses
        )
        if (size) {
            return size
        }

        // Is the user defined type linked to another Contract or file level Struct or Enum?
        const attributeClass = otherClasses.find(({ name }) => {
            return name === attribute.type
        })

        if (!attributeClass) {
            throw Error(`Failed to find user defined type "${attribute.type}"`)
        }

        switch (attributeClass.stereotype) {
            case ClassStereotype.Enum:
                return 1
            case ClassStereotype.Contract:
            case ClassStereotype.Abstract:
            case ClassStereotype.Interface:
            case ClassStereotype.Library:
                return 32
            case ClassStereotype.Struct:
                let structByteSize = 0
                attributeClass.attributes.forEach((structAttribute) => {
                    structByteSize += calcStorageByteSize(
                        structAttribute,
                        umlClass,
                        otherClasses
                    )
                })
                // structs take whole 32 byte slots so round up to the nearest 32 sized slots
                return Math.ceil(structByteSize / 32) * 32
            default:
                return 32
        }
    }

    if (attribute.attributeType === AttributeType.Elementary) {
        switch (attribute.type) {
            case 'bool':
                return 1
            case 'address':
                return 20
            case 'string':
            case 'bytes':
            case 'uint':
            case 'int':
            case 'ufixed':
            case 'fixed':
                return 32
            default:
                const result = attribute.type.match(
                    /[u]*(int|fixed|bytes)([0-9]+)/
                )
                if (result === null || !result[2]) {
                    throw Error(
                        `Failed size elementary type "${attribute.type}"`
                    )
                }
                // If bytes
                if (result[1] === 'bytes') {
                    return parseInt(result[2])
                }
                // TODO need to handle fixed types when they are supported

                // If an int
                const bitSize = parseInt(result[2])
                return bitSize / 8
        }
    }

    throw new Error(
        `Failed to calc bytes size of attribute with name "${attribute.name}" and type ${attribute.type}`
    )
}

export const isElementary = (type: string): boolean => {
    switch (type) {
        case 'bool':
        case 'address':
        case 'string':
        case 'bytes':
        case 'uint':
        case 'int':
        case 'ufixed':
        case 'fixed':
            return true
        default:
            const result = type.match(/[u]*(int|fixed|bytes)([0-9]+)/)
            return result !== null
    }
}

const calcStructOrEnumByteSize = (
    typeName: string,
    umlClass: UmlClass,
    otherClasses: UmlClass[]
): number => {
    // Is the user defined type linked to a contract level enum
    const enumType = umlClass.enums[typeName]
    if (enumType) {
        return 1
    }

    // Is the user defined type linked to a contract level struct
    const structAttributes = umlClass.structs[typeName]
    if (structAttributes) {
        let structByteSize = 0
        structAttributes.forEach((structAttribute) => {
            // If next attribute is an array, then we need to start in a new slot
            if (structAttribute.attributeType === AttributeType.Array) {
                structByteSize = Math.ceil(structByteSize / 32) * 32
            }
            structByteSize += calcStorageByteSize(
                structAttribute,
                umlClass,
                otherClasses
            )
        })
        return Math.ceil(structByteSize / 32) * 32
    }

    // Get immediate parent contracts that the class inherits from
    const parentContracts = umlClass.getParentContracts()
    for (const parent of parentContracts) {
        const parentClass = otherClasses.find(
            (umlClass) => umlClass.name === parent.targetUmlClassName
        )
        if (!parentClass)
            throw Error(
                `Failed to find parent contract ${parent.targetUmlClassName} of ${umlClass.name}`
            )

        // recursively see if the User Defined type is in an inherited contract
        const size = calcStructOrEnumByteSize(
            typeName,
            parentClass,
            otherClasses
        )
        if (size) {
            return size
        }
        // If not found, keep looking in the other inherited contracts
    }

    return undefined
}
