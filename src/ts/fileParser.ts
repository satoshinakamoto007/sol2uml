import { lstatSync, readFileSync } from 'fs'
import { basename, extname, relative } from 'path'
import klaw from 'klaw'
import { ASTNode } from '@solidity-parser/parser/dist/src/ast-types'
import { parse } from '@solidity-parser/parser'
import { VError } from 'verror'

import { convertNodeToUmlClass } from './parser'
import { UmlClass } from './umlClass'

const debug = require('debug')('sol2uml')

export const parseUmlClassesFromFiles = async (
    filesOrFolders: string[],
    ignoreFilesOrFolders: string[],
    depthLimit: number = -1
): Promise<UmlClass[]> => {
    const files = await getSolidityFilesFromFolderOrFiles(
        filesOrFolders,
        ignoreFilesOrFolders,
        depthLimit
    )

    let umlClasses: UmlClass[] = []

    for (const file of files) {
        const node = await parseSolidityFile(file)

        const relativePath = relative(process.cwd(), file)

        const umlClass = convertNodeToUmlClass(node, relativePath, true)
        umlClasses = umlClasses.concat(umlClass)
    }

    return umlClasses
}

export async function getSolidityFilesFromFolderOrFiles(
    folderOrFilePaths: string[],
    ignoreFilesOrFolders: string[],
    depthLimit: number = -1
): Promise<string[]> {
    let files: string[] = []

    for (const folderOrFilePath of folderOrFilePaths) {
        const result = await getSolidityFilesFromFolderOrFile(
            folderOrFilePath,
            ignoreFilesOrFolders,
            depthLimit
        )
        files = files.concat(result)
    }

    return files
}

export function getSolidityFilesFromFolderOrFile(
    folderOrFilePath: string,
    ignoreFilesOrFolders: string[] = [],
    depthLimit: number = -1
): Promise<string[]> {
    debug(`About to get Solidity files under ${folderOrFilePath}`)

    return new Promise<string[]>((resolve, reject) => {
        try {
            const folderOrFile = lstatSync(folderOrFilePath)

            if (folderOrFile.isDirectory()) {
                const files: string[] = []

                // filter out files or folders that are to be ignored
                const filter = (file: string): boolean => {
                    return !ignoreFilesOrFolders.includes(basename(file))
                }

                klaw(folderOrFilePath, {
                    depthLimit,
                    filter,
                    preserveSymlinks: true,
                })
                    .on('data', (file) => {
                        if (extname(file.path) === '.sol') files.push(file.path)
                    })
                    .on('end', () => {
                        debug(`Got Solidity files to be parsed: ${files}`)
                        resolve(files)
                    })
            } else if (folderOrFile.isFile()) {
                if (extname(folderOrFilePath) === '.sol') {
                    debug(`Got Solidity file to be parsed: ${folderOrFilePath}`)
                    resolve([folderOrFilePath])
                } else {
                    reject(
                        Error(
                            `File ${folderOrFilePath} does not have a .sol extension.`
                        )
                    )
                }
            } else {
                reject(
                    Error(
                        `Could not find directory or file ${folderOrFilePath}`
                    )
                )
            }
        } catch (err) {
            let error: Error
            if (err?.code === 'ENOENT') {
                error = Error(
                    `No such file or folder ${folderOrFilePath}. Make sure you pass in the root directory of the contracts`
                )
            } else {
                error = new VError(
                    err,
                    `Failed to get Solidity files under folder or file ${folderOrFilePath}`
                )
            }

            console.error(error.stack)
            reject(error)
        }
    })
}

export function parseSolidityFile(fileName: string): ASTNode {
    try {
        const solidityCode = readFileSync(fileName, 'utf8')
        return parse(solidityCode, {})
    } catch (err) {
        throw new VError(err, `Failed to parse solidity file ${fileName}.`)
    }
}
