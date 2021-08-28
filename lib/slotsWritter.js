"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSlots2Dot = void 0;
const debug = require('debug')('sol2uml:storage');
function convertSlots2Dot(slots, options = {}) {
    let dotString = `
digraph SlotsDiagram {
rankdir=BT
color=black
arrowhead=open
node [shape=record, style=filled, fillcolor=gray95]`;
    // write slot header with name and optional address
    dotString += `\n${0} [label="{${slots.name} \\<\\<Contract\\>\\>\\n${slots.address || ''} | {`;
    // write slots
    slots.storages.forEach((storage, i) => {
        if (i === 0) {
            dotString += `{slot | 0`;
        }
        else if (storage.byteOffset === 0) {
            if (storage.fromSlot === storage.toSlot) {
                dotString += `| ${storage.fromSlot}`;
            }
            else {
                dotString += `| ${storage.fromSlot}-${storage.toSlot}`;
            }
        }
    });
    // write types
    slots.storages.forEach((storage, i) => {
        const lastStorage = i > 0 ? slots.storages[i - 1] : undefined;
        const nextStorage = i + 1 < slots.storages.length ? slots.storages[i + 1] : undefined;
        if (i === 0) {
            dotString += '} | {type: variable (bytes) ';
        }
        // if next storage is in the same slot
        // and storage is the first in the slot
        if (lastStorage === undefined ||
            ((nextStorage === null || nextStorage === void 0 ? void 0 : nextStorage.fromSlot) === storage.fromSlot &&
                storage.byteOffset === 0)) {
            dotString += `| { ${storage.type}: ${storage.variable} (${storage.byteSize}) `;
            return;
        }
        // if last storage was on the same slot
        // and the next storage is on a different slot
        if ((lastStorage === null || lastStorage === void 0 ? void 0 : lastStorage.fromSlot) === storage.fromSlot &&
            (nextStorage === null || nextStorage === void 0 ? void 0 : nextStorage.fromSlot) > storage.fromSlot) {
            dotString += `| ${storage.type}: ${storage.variable} (${storage.byteSize}) }`;
            return;
        }
        // If storage covers a whole slot or is not at the start or end of a slot
        dotString += `| ${storage.type}: ${storage.variable} (${storage.byteSize}) `;
    });
    // Need to close off the last label
    dotString += '}}}"]\n';
    // Need to close off the last digraph
    dotString += '\n}';
    debug(dotString);
    return dotString;
}
exports.convertSlots2Dot = convertSlots2Dot;
//# sourceMappingURL=slotsWritter.js.map