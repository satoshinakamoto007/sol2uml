// Returns a string of the UML Class in Graphviz's dot format
import {
    Attribute,
    ClassStereotype,
    Operator,
    OperatorStereotype,
    Parameter,
    UmlClass,
    Visibility,
} from './umlClass'

export interface ClassOptions {
    hideAttributes?: boolean
    hideOperators?: boolean
    hideStructs?: boolean
    hideEnums?: boolean
    hideLibraries?: boolean
    hideInterfaces?: boolean
    hideInternals?: boolean
}

export const dotUmlClass = (
    umlClass: UmlClass,
    options: ClassOptions = {}
): string => {
    // do not include library, interface, struct or enum classes if hidden
    if (
        (options.hideLibraries &&
            umlClass.stereotype === ClassStereotype.Library) ||
        (options.hideInterfaces &&
            umlClass.stereotype === ClassStereotype.Interface) ||
        (options.hideStructs &&
            umlClass.stereotype === ClassStereotype.Struct) ||
        (options.hideEnums && umlClass.stereotype === ClassStereotype.Enum)
    ) {
        return ''
    }

    let dotString = `\n${umlClass.id} [label="{${dotClassTitle(umlClass)}`

    // Add attributes
    if (!options.hideAttributes) {
        dotString += dotAttributeVisibilities(umlClass, options)
    }

    // Add operators
    if (!options.hideOperators) {
        dotString += dotOperatorVisibilities(umlClass, options)
    }

    dotString += '}"]'

    // Output structs and enums
    if (!options.hideStructs) {
        dotString += dotStructs(umlClass)
    }
    if (!options.hideEnums) {
        dotString += dotEnums(umlClass)
    }

    return dotString
}

const dotClassTitle = (umlClass: UmlClass): string => {
    let stereoName: string = ''
    switch (umlClass.stereotype) {
        case ClassStereotype.Abstract:
            stereoName = 'Abstract'
            break
        case ClassStereotype.Interface:
            stereoName = 'Interface'
            break
        case ClassStereotype.Library:
            stereoName = 'Library'
            break
        case ClassStereotype.Struct:
            stereoName = 'Struct'
            break
        case ClassStereotype.Enum:
            stereoName = 'Enum'
            break
        default:
            // Contract or undefined stereotype will just return the UmlClass name
            return umlClass.name
    }

    return `\\<\\<${stereoName}\\>\\>\\n${umlClass.name}`
}

const dotAttributeVisibilities = (
    umlClass: UmlClass,
    options: { hideInternals?: boolean } = {}
): string => {
    let dotString = '| '
    // if a struct or enum then no visibility group
    if (
        umlClass.stereotype === ClassStereotype.Struct ||
        umlClass.stereotype === ClassStereotype.Enum
    ) {
        return dotString + dotAttributes(umlClass.attributes, undefined, false)
    }

    // For each visibility group
    for (const vizGroup of ['Private', 'Internal', 'External', 'Public']) {
        const attributes: Attribute[] = []

        // For each attribute of te UML Class
        for (const attribute of umlClass.attributes) {
            if (
                !options.hideInternals &&
                vizGroup === 'Private' &&
                attribute.visibility === Visibility.Private
            ) {
                attributes.push(attribute)
            } else if (
                !options.hideInternals &&
                vizGroup === 'Internal' &&
                attribute.visibility === Visibility.Internal
            ) {
                attributes.push(attribute)
            } else if (
                vizGroup === 'External' &&
                attribute.visibility === Visibility.External
            ) {
                attributes.push(attribute)
            }
            // Rest are Public, None or undefined visibilities
            else if (
                vizGroup === 'Public' &&
                (attribute.visibility === Visibility.Public ||
                    attribute.visibility === Visibility.None ||
                    !attribute.visibility)
            ) {
                attributes.push(attribute)
            }
        }

        dotString += dotAttributes(attributes, vizGroup)
    }

    return dotString
}

const dotAttributes = (
    attributes: Attribute[],
    vizGroup?: string,
    indent = true
): string => {
    if (!attributes || attributes.length === 0) {
        return ''
    }
    const indentString = indent ? '\\ \\ \\ ' : ''

    let dotString = vizGroup ? vizGroup + ':\\l' : ''

    // for each attribute
    attributes.forEach((attribute) => {
        dotString += `${indentString}${attribute.name}: ${attribute.type}\\l`
    })

    return dotString
}

const dotOperatorVisibilities = (
    umlClass: UmlClass,
    options: { hideInternals?: boolean } = {}
): string => {
    let dotString = '| '

    // For each visibility group
    for (const vizGroup of ['Private', 'Internal', 'External', 'Public']) {
        const operators: Operator[] = []

        // For each attribute of te UML Class
        for (const operator of umlClass.operators) {
            if (
                !options.hideInternals &&
                vizGroup === 'Private' &&
                operator.visibility === Visibility.Private
            ) {
                operators.push(operator)
            } else if (
                !options.hideInternals &&
                vizGroup === 'Internal' &&
                operator.visibility === Visibility.Internal
            ) {
                operators.push(operator)
            } else if (
                vizGroup === 'External' &&
                operator.visibility === Visibility.External
            ) {
                operators.push(operator)
            }
            // Rest are Public, None or undefined visibilities
            else if (
                vizGroup === 'Public' &&
                (operator.visibility === Visibility.Public ||
                    operator.visibility === Visibility.None ||
                    !operator.visibility)
            ) {
                operators.push(operator)
            }
        }

        dotString += dotOperators(umlClass, vizGroup, operators)
    }

    return dotString
}

const dotOperators = (
    umlClass: UmlClass,
    vizGroup: string,
    operators: Operator[]
): string => {
    // Skip if there are no operators
    if (!operators || operators.length === 0) {
        return ''
    }

    let dotString = vizGroup + ':\\l'

    // Sort the operators by stereotypes
    const operatorsSortedByStereotype = operators.sort((a, b) => {
        return b.stereotype - a.stereotype
    })

    for (const operator of operatorsSortedByStereotype) {
        dotString += '\\ \\ \\ \\ '

        if (operator.stereotype > 0) {
            dotString += dotOperatorStereotype(umlClass, operator.stereotype)
        }

        dotString += operator.name

        dotString += dotParameters(operator.parameters)

        if (operator.returnParameters?.length > 0) {
            dotString += ': ' + dotParameters(operator.returnParameters, true)
        }

        dotString += '\\l'
    }

    return dotString
}

const dotOperatorStereotype = (
    umlClass: UmlClass,
    operatorStereotype: OperatorStereotype
): string => {
    let dotString = ''

    switch (operatorStereotype) {
        case OperatorStereotype.Event:
            dotString += '\\<\\<event\\>\\>'
            break
        case OperatorStereotype.Fallback:
            dotString += '\\<\\<fallback\\>\\>'
            break
        case OperatorStereotype.Modifier:
            dotString += '\\<\\<modifier\\>\\>'
            break
        case OperatorStereotype.Abstract:
            if (umlClass.stereotype === ClassStereotype.Abstract) {
                dotString += '\\<\\<abstract\\>\\>'
            }
            break
        case OperatorStereotype.Payable:
            dotString += '\\<\\<payable\\>\\>'
            break
        default:
            break
    }

    return dotString + ' '
}

const dotParameters = (
    parameters: Parameter[],
    returnParams: boolean = false
): string => {
    if (parameters.length == 1 && !parameters[0].name) {
        if (returnParams) {
            return parameters[0].type
        } else {
            return `(${parameters[0].type})`
        }
    }

    let dotString = '('
    let paramCount = 0

    for (const parameter of parameters) {
        // The parameter name can be null in return parameters
        if (parameter.name === null) {
            dotString += parameter.type
        } else {
            dotString += parameter.name + ': ' + parameter.type
        }

        // If not the last parameter
        if (++paramCount < parameters.length) {
            dotString += ', '
        }
    }

    return dotString + ')'
}

const dotStructs = (umlClass: UmlClass): string => {
    let dotString = ''
    let structCount = 0

    // for each struct declared in the contract
    for (const structKey of Object.keys(umlClass.structs)) {
        const structId = umlClass.id + 'struct' + structCount++
        dotString += `\n"${structId}" [label="{\\<\\<struct\\>\\>\\n${structKey}|`

        // output each attribute of the struct
        for (const attribute of umlClass.structs[structKey]) {
            dotString += attribute.name + ': ' + attribute.type + '\\l'
        }

        dotString += '}"]'

        // Add the association to the contract the struct was declared in
        dotString += `\n"${structId}" -> ${umlClass.id} [arrowhead=diamond, weight=3]`
    }

    return dotString
}

const dotEnums = (umlClass: UmlClass): string => {
    let dotString = ''
    let enumCount = 0

    // for each enum declared in the contract
    for (const enumKey of Object.keys(umlClass.enums)) {
        const enumId = umlClass.id + 'enum' + enumCount++
        dotString += `\n"${enumId}" [label="{\\<\\<enum\\>\\>\\n${enumKey}|`

        // output each enum value
        let enumIndex = 0
        for (const value of umlClass.enums[enumKey]) {
            dotString += value + ': ' + enumIndex++ + '\\l'
        }

        dotString += '}"]'

        // Add the association to the contract the enum was declared in
        dotString += `\n"${enumId}" -> ${umlClass.id} [arrowhead=diamond, weight=3]`
    }

    return dotString
}
