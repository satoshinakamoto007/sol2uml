export enum Visibility {
    None,
    Public,
    External,
    Internal,
    Private,
}

export enum ClassStereotype {
    None,
    Library,
    Interface,
    Abstract,
    Contract,
    Struct,
    Enum,
}

export enum OperatorStereotype {
    None,
    Modifier,
    Event,
    Payable,
    Fallback,
    Abstract,
}

export interface Parameter {
    // name is not required in return parameters or operator parameters
    name?: string
    type: string
}

export interface Attribute {
    visibility?: Visibility
    name: string
    type?: string
}

export interface Operator extends Attribute {
    stereotype?: OperatorStereotype
    parameters?: Parameter[]
    returnParameters?: Parameter[]
    isPayable?: boolean
}

export enum ReferenceType {
    Memory,
    Storage,
}

export interface Association {
    referenceType: ReferenceType
    targetUmlClassName: string
    targetUmlClassStereotype?: ClassStereotype
    realization?: boolean
}

export interface ClassProperties {
    name: string
    absolutePath: string
    relativePath: string
    importedFileNames?: string[]
    stereotype?: ClassStereotype
    enums?: { [name: string]: string[] }
    attributes?: Attribute[]
    operators?: Operator[]
    associations?: { [name: string]: Association }
}

export class UmlClass implements ClassProperties {
    static idCounter = 0

    id: number
    name: string
    absolutePath: string
    relativePath: string
    importedPaths?: string[]
    stereotype?: ClassStereotype

    attributes: Attribute[] = []
    operators: Operator[] = []

    enums: { [name: string]: string[] } = {}
    structs: { [name: string]: Parameter[] } = {}
    associations: { [name: string]: Association } = {}

    constructor(properties: ClassProperties) {
        if (!properties || !properties.name) {
            throw TypeError(
                `Failed to instantiate UML Class with no name property`
            )
        }

        Object.assign(this, properties)

        // Generate a unique identifier for this UML Class
        this.id = UmlClass.idCounter++
    }

    addAssociation(association: Association) {
        if (!association || !association.targetUmlClassName) {
            throw TypeError(
                `Failed to add association. targetUmlClassName was missing`
            )
        }

        // Will not duplicate lines to the same class and stereotype
        // const targetUmlClass = `${association.targetUmlClassName}#${association.targetUmlClassStereotype}`
        const targetUmlClass = association.targetUmlClassName

        // If association doesn't already exist
        if (!this.associations[targetUmlClass]) {
            this.associations[targetUmlClass] = association
        }
        // associate already exists
        else {
            // If new attribute reference type is Storage
            if (association.referenceType === ReferenceType.Storage) {
                this.associations[targetUmlClass].referenceType =
                    ReferenceType.Storage
            }
        }
    }
}
