import { ClassOptions } from './classWriter';
import { UmlClass } from './umlClass';
export declare function convertUmlClasses2Dot(umlClasses: UmlClass[], clusterFolders?: boolean, classOptions?: ClassOptions): string;
export declare function addAssociationsToDot(umlClasses: UmlClass[], classOptions?: ClassOptions): string;
