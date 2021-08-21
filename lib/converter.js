"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAssociationsToDot = exports.convertUmlClasses2Dot = void 0;
const path_1 = require("path");
const classWriter_1 = require("./classWriter");
const umlClass_1 = require("./umlClass");
const debug = require('debug')('sol2uml');
function convertUmlClasses2Dot(umlClasses, clusterFolders = false, classOptions = {}) {
    let dotString = `
digraph UmlClassDiagram {
rankdir=BT
color=black
arrowhead=open
node [shape=record, style=filled, fillcolor=gray95]`;
    // Sort UML Classes by folder of source file
    const umlClassesSortedByCodePath = sortUmlClassesByCodePath(umlClasses);
    let currentCodeFolder = '';
    for (const umlClass of umlClassesSortedByCodePath) {
        const codeFolder = path_1.dirname(umlClass.relativePath);
        if (currentCodeFolder !== codeFolder) {
            // Need to close off the last subgraph if not the first
            if (currentCodeFolder != '') {
                dotString += '\n}';
            }
            dotString += `
subgraph ${getSubGraphName(clusterFolders)} {
label="${codeFolder}"`;
            currentCodeFolder = codeFolder;
        }
        dotString += classWriter_1.dotUmlClass(umlClass, classOptions);
    }
    // Need to close off the last subgraph if not the first
    if (currentCodeFolder != '') {
        dotString += '\n}';
    }
    dotString += addAssociationsToDot(umlClasses, classOptions);
    // Need to close off the last the digraph
    dotString += '\n}';
    debug(dotString);
    return dotString;
}
exports.convertUmlClasses2Dot = convertUmlClasses2Dot;
let subGraphCount = 0;
function getSubGraphName(clusterFolders = false) {
    if (clusterFolders) {
        return ` cluster_${subGraphCount++}`;
    }
    return ` graph_${subGraphCount++}`;
}
function sortUmlClassesByCodePath(umlClasses) {
    return umlClasses.sort((a, b) => {
        if (a.relativePath < b.relativePath) {
            return -1;
        }
        if (a.relativePath > b.relativePath) {
            return 1;
        }
        return 0;
    });
}
function addAssociationsToDot(umlClasses, classOptions = {}) {
    let dotString = '';
    // for each class
    for (const sourceUmlClass of umlClasses) {
        // for each association in that class
        for (const association of Object.values(sourceUmlClass.associations)) {
            // find the target class with the same class name and
            // codePath of the target in the importedPaths of the source class OR
            // the codePath of the target is the same as the codePath pf the source class
            const targetUmlClass = umlClasses.find((targetUmlClass) => {
                return (targetUmlClass.name === association.targetUmlClassName &&
                    (sourceUmlClass.importedPaths.includes(targetUmlClass.absolutePath) ||
                        sourceUmlClass.absolutePath ===
                            targetUmlClass.absolutePath));
            });
            if (targetUmlClass) {
                dotString += addAssociationToDot(sourceUmlClass, targetUmlClass, association, classOptions);
            }
        }
    }
    return dotString;
}
exports.addAssociationsToDot = addAssociationsToDot;
function addAssociationToDot(sourceUmlClass, targetUmlClass, association, classOptions = {}) {
    // do not include library or interface associations if hidden
    if ((classOptions.hideLibraries &&
        (sourceUmlClass.stereotype === umlClass_1.ClassStereotype.Library ||
            targetUmlClass.stereotype === umlClass_1.ClassStereotype.Library)) ||
        (classOptions.hideInterfaces &&
            targetUmlClass.stereotype === umlClass_1.ClassStereotype.Interface) ||
        (classOptions.hideStructs &&
            targetUmlClass.stereotype === umlClass_1.ClassStereotype.Struct) ||
        (classOptions.hideEnums &&
            targetUmlClass.stereotype === umlClass_1.ClassStereotype.Enum)) {
        return '';
    }
    let dotString = `\n${sourceUmlClass.id} -> ${targetUmlClass.id} [`;
    if (association.referenceType == umlClass_1.ReferenceType.Memory ||
        (association.realization &&
            targetUmlClass.stereotype === umlClass_1.ClassStereotype.Interface)) {
        dotString += 'style=dashed, ';
    }
    if (association.realization) {
        dotString += 'arrowhead=empty, arrowsize=3, ';
        if (!targetUmlClass.stereotype) {
            dotString += 'weight=4, ';
        }
        else {
            dotString += 'weight=3, ';
        }
    }
    return dotString + ']';
}
//# sourceMappingURL=converter.js.map