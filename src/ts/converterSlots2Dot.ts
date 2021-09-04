import { Slots, Storage, StorageType } from './converterClasses2Slots'

const debug = require('debug')('sol2uml')

export const convertAllSlots2Dot = (
    slots: Slots,
    structSlots: Slots[],
    options = {}
): string => {
    let dotString: string = `
digraph SlotsDiagram {
rankdir=LR
color=black
arrowhead=open
node [shape=record, style=filled, fillcolor=gray95]`

    // process the contract
    dotString = convertSlots2Dot(slots, dotString)

    // process the structs
    structSlots.forEach((struct) => {
        dotString = convertSlots2Dot(struct, dotString)
    })

    // link the contract to structs
    slots.storages.forEach((storage) => {
        if (storage.structSlotsId) {
            dotString += `\n ${slots.id}:${storage.id} -> ${storage.structSlotsId}`
        }
    })

    // link structs to structs
    structSlots.forEach((struct) => {
        struct.storages.forEach((storage) => {
            if (storage.structSlotsId) {
                dotString += `\n ${struct.id}:${storage.id} -> ${storage.structSlotsId}`
            }
        })
    })

    // Need to close off the last digraph
    dotString += '\n}'

    debug(dotString)

    return dotString
}

export function convertSlots2Dot(
    slots: Slots,
    dotString: string,
    options = {}
): string {
    const steorotype = slots.type === StorageType.Struct ? 'Struct' : 'Contract'

    // write slot header with name and optional address
    dotString += `\n${slots.id} [label="{\\<\\<${steorotype}\\>\\>\\n${
        slots.name
    }\\n${slots.address || ''} | `

    // write slots
    slots.storages.forEach((storage, i) => {
        if (i === 0) {
            dotString += `{slot | 0`
        } else if (storage.byteOffset === 0) {
            if (storage.fromSlot === storage.toSlot) {
                dotString += `| ${storage.fromSlot}`
            } else {
                dotString += `| ${storage.fromSlot}-${storage.toSlot}`
            }
        }
    })

    // write types
    slots.storages.forEach((storage, i) => {
        const lastStorage = i > 0 ? slots.storages[i - 1] : undefined
        const nextStorage =
            i + 1 < slots.storages.length ? slots.storages[i + 1] : undefined

        if (i === 0) {
            const contractVaraiblePrefix =
                slots.type === StorageType.Contract
                    ? '\\<inherited contract\\>.'
                    : ''
            dotString += `} | {type: ${contractVaraiblePrefix}variable (bytes) `
        }
        // if next storage is in the same slot
        // and storage is the first in the slot
        if (
            nextStorage?.fromSlot === storage.fromSlot &&
            storage.byteOffset === 0
        ) {
            dotString += `| { ${dotVariable(storage, slots.name)} `
            return
        }
        // if last storage was on the same slot
        // and the next storage is on a different slot
        if (
            lastStorage?.fromSlot === storage.fromSlot &&
            (nextStorage?.fromSlot > storage.fromSlot ||
                nextStorage === undefined)
        ) {
            dotString += `| ${dotVariable(storage, slots.name)} } `
            return
        }

        // If storage covers a whole slot or is not at the start or end of a slot
        dotString += `| ${dotVariable(storage, slots.name)} `
    })

    // Need to close off the last label
    dotString += '}}"]\n'

    return dotString
}

const dotVariable = (storage: Storage, contractName: string): string => {
    const port = storage.structSlotsId !== undefined ? `<${storage.id}>` : ''
    const contractNamePrefix =
        storage.contractName !== contractName ? `${storage.contractName}.` : ''

    return `${port} ${storage.type}: ${contractNamePrefix}${storage.variable} (${storage.byteSize})`
}
