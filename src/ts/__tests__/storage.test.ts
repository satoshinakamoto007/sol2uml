import { Attribute, AttributeType, UmlClass } from '../umlClass'
import { calcStorageByteSize, isElementary } from '../converterClasses2Slots'

describe('storage parser', () => {
    describe('calc storage bytes size of', () => {
        const defaultClassProperties = {
            name: 'test',
            absolutePath: '/',
            relativePath: '.',
        }
        test.each`
            type         | expected
            ${'address'} | ${20}
            ${'bool'}    | ${1}
            ${'int'}     | ${32}
            ${'uint'}    | ${32}
            ${'int256'}  | ${32}
            ${'uint256'} | ${32}
            ${'uint8'}   | ${1}
            ${'int8'}    | ${1}
            ${'uint32'}  | ${4}
            ${'int32'}   | ${4}
            ${'bytes'}   | ${32}
            ${'bytes32'} | ${32}
            ${'bytes1'}  | ${1}
            ${'bytes31'} | ${31}
            ${'string'}  | ${32}
        `('elementary type $type', ({ type, expected }) => {
            const umlCLass = new UmlClass(defaultClassProperties)
            const attribute: Attribute = {
                attributeType: AttributeType.Elementary,
                type,
                name: 'varName',
            }
            expect(calcStorageByteSize(attribute, umlCLass, [])).toEqual(
                expected
            )
        })
        test.each`
            type                 | expected
            ${'uint8[33][2][2]'} | ${256}
            ${'address[]'}       | ${32}
            ${'address[1]'}      | ${32}
            ${'address[2]'}      | ${64}
            ${'address[4]'}      | ${128}
            ${'address[][2]'}    | ${32}
            ${'address[2][2]'}   | ${128}
            ${'address[32]'}     | ${1024}
            ${'bytes32[]'}       | ${32}
            ${'bytes1[1]'}       | ${32}
            ${'bytes1[2]'}       | ${32}
            ${'bytes1[32]'}      | ${32}
            ${'bytes16[2]'}      | ${32}
            ${'bytes17[2]'}      | ${64}
            ${'bytes30[2]'}      | ${64}
            ${'bytes30[6][2]'}   | ${384}
            ${'bytes30[2][6]'}   | ${384}
            ${'bytes128[4]'}     | ${512}
            ${'bytes32[1]'}      | ${32}
            ${'bytes32[2]'}      | ${64}
            ${'bool[2][3]'}      | ${96}
            ${'bool[3][2]'}      | ${64}
            ${'bool[2][]'}       | ${32}
            ${'bool[33][2]'}     | ${128}
            ${'bool[33][2][2]'}  | ${256}
            ${'bool[][64][64]'}  | ${32}
            ${'bool[64][][64]'}  | ${32}
            ${'bool[64][64][]'}  | ${32}
        `('array type $type', ({ type, expected }) => {
            const umlCLass = new UmlClass(defaultClassProperties)
            const attribute: Attribute = {
                attributeType: AttributeType.Array,
                type,
                name: 'arrayName',
            }
            expect(calcStorageByteSize(attribute, umlCLass, [])).toEqual(
                expected
            )
        })
        describe('contract level structs', () => {
            const baseStructs: { [structName: string]: Attribute[] } = {
                ContractLevelStruct0: [
                    {
                        name: 'param1',
                        type: 'uint256',
                        attributeType: AttributeType.Elementary,
                    },
                    {
                        name: 'param2',
                        type: 'bool',
                        attributeType: AttributeType.Elementary,
                    },
                ],
                ContractLevelStruct1: [
                    {
                        name: 'param1',
                        type: 'uint256',
                        attributeType: AttributeType.Elementary,
                    },
                    {
                        name: 'param2',
                        type: 'address',
                        attributeType: AttributeType.Elementary,
                    },
                    {
                        name: 'param3',
                        type: 'uint8',
                        attributeType: AttributeType.Elementary,
                    },
                    {
                        name: 'param4',
                        type: 'bytes1',
                        attributeType: AttributeType.Elementary,
                    },
                ],
                ContractLevelStruct2: [
                    {
                        name: 'param1',
                        type: 'ContractLevelStruct0',
                        attributeType: AttributeType.UserDefined,
                    },
                    {
                        name: 'param2',
                        type: 'ContractLevelStruct1[2]',
                        attributeType: AttributeType.Array,
                    },
                ],
            }
            const baseEnums: { [name: string]: string[] } = {
                enum0: ['start', 'stop'],
                enum1: ['red', 'orange', 'green'],
            }
            test.each`
                types                                                     | expected
                ${['uint256', 'bytes32']}                                 | ${64}
                ${['bool', 'uint8']}                                      | ${32}
                ${['bool[12]', 'uint8[12]']}                              | ${64}
                ${['bytes30', 'bytes30', 'bytes30']}                      | ${96}
                ${['uint256[]', 'bytes32[2]']}                            | ${96}
                ${['uint256[2]', 'bytes32[2]']}                           | ${128}
                ${['bool', 'bool[2]', 'bool']}                            | ${96}
                ${['bool', 'bool[33]', 'bool']}                           | ${128}
                ${['uint16', 'bytes30[2]', 'uint16']}                     | ${128}
                ${['ContractLevelStruct0']}                               | ${64}
                ${['ContractLevelStruct1']}                               | ${64}
                ${['ContractLevelStruct2']}                               | ${192}
                ${['ContractLevelStruct2[2]', 'address']}                 | ${416}
                ${['ContractLevelStruct0', 'ContractLevelStruct1']}       | ${128}
                ${['ContractLevelStruct0[]', 'address']}                  | ${64}
                ${['ContractLevelStruct1[2]', 'address']}                 | ${160}
                ${['ContractLevelStruct1[2]', 'ContractLevelStruct0[3]']} | ${320}
                ${['ContractLevelStruct2[]', 'address']}                  | ${64}
                ${['address', 'ContractLevelStruct2[]']}                  | ${64}
                ${['enum0']}                                              | ${32}
                ${['enum0', 'enum1']}                                     | ${32}
                ${['enum0', 'enum1', 'bytes30']}                          | ${32}
                ${['enum0', 'enum1', 'bytes31']}                          | ${64}
                ${['enum0', 'enum1', 'bytes30[2]']}                       | ${96}
            `('struct with types $types', ({ types, expected }) => {
                const structs: { [name: string]: Attribute[] } = {
                    ...baseStructs,
                    ContractLevelStruct: [],
                }
                types.forEach((type: string, i: number) => {
                    const attributeType =
                        type.slice(-1) === ']'
                            ? AttributeType.Array
                            : isElementary(type)
                            ? AttributeType.Elementary
                            : AttributeType.UserDefined
                    structs.ContractLevelStruct.push({
                        name: 'param' + i,
                        type,
                        attributeType,
                    })
                })
                const umlCLass = new UmlClass({
                    ...defaultClassProperties,
                    structs,
                    enums: baseEnums,
                })
                const attribute: Attribute = {
                    attributeType: AttributeType.UserDefined,
                    type: 'ContractLevelStruct',
                    name: 'structName',
                }
                expect(calcStorageByteSize(attribute, umlCLass, [])).toEqual(
                    expected
                )
            })
        })
    })
})
