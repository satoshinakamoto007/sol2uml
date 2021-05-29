import { ASTNode } from '@solidity-parser/parser/dist/src/ast-types';
import { UmlClass } from './umlClass';
export declare function convertNodeToUmlClass(node: ASTNode, relativePath: string, filesystem?: boolean): UmlClass[];
