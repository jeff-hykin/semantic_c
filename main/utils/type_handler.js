const primitiveKeywordInfo = {
    void: {
    },
    char: {
        
    },
    short: {
        isStorageModifier: true,
    },
    int: {
    },
    unsigned: {
        isStorageModifier: true,
    },
    signed: {
        isStorageModifier: true,
    },
    long: {
        isStorageModifier: true,
    },
    float: {
    },
    double: {
    },
}
export const fullySpecifiedPrimitives = {
    char: [ ["char"], ],
    unsigned_char: [ ["unsigned", "char"], ],
    signed_char: [ ["signed", "char"], ],
    signed_short_int: [
        ["signed", "short", "int"],
        ["signed", "short", ],
        ["short", "int"],
        ["short",],
    ],
    unsigned_short_int: [
        ["unsigned", "short", "int"],
        ["unsigned", "short",],
    ],
    signed_int: [
        ["signed", "int"],
        ["int",],
    ],
    unsigned_int: [
        ["unsigned", "int"],
        ["unsigned",],
    ],
    signed_long_int: [
        ["signed","long", "int"], 
        ["signed","long", ], 
        ["long",], 
    ],
    unsigned_long_int: [
        ["unsigned", "long", "int"],
    ],
    signed_long_long_int: [
        ["signed", "long", "long", "int"],
        ["signed", "long", "long", ],
        ["long", "long", "int", ],
        ["long", "long", ],
    ],
    unsigned_long_long_int: [
        ["unsigned", "long", "long", "int"], 
        ["unsigned", "long", "long", ], 
    ],
    float: [ ["float"], ],
    double: [ ["double"], ],
    long_double: [ ["long", "double"], ],
}
const primitiveStorageMapping = new Map([["",null], ["void", "void"]])
for (const [key, value] of Object.entries(fullySpecifiedPrimitives)) {
    for (const each of value) {
        each.sort()
        primitiveStorageMapping.set(each.join("_"), key)
    }
}

export function getFullySpecifiedPrimitive(stringList) {
    try {
        return primitiveStorageMapping.get(stringList.toSorted().join("_"))
    } catch (error) {
        
    }
}

export class Type {
    constructor({ baseName, identifierInfo, qualifiers, storageClassSpecifiers, pointerInformation, anonymousInfo, ...other}) {
        this.baseName = baseName
        this.identifierInfo = identifierInfo
        this.qualifiers = qualifiers || []
        this.storageClassSpecifiers = storageClassSpecifiers || []
        this.anonymousInfo = anonymousInfo
        this.pointerInformation = pointerInformation
        Object.assign(this, other)
    }
    get isPrimitive() {
        return !!this.identifierInfo
    }
    get isPointer() {
        return !!this.pointerInformation
    }
}

/**
 * parseConcreteType
 *
 * @note
 *     only parses the front of pointers, arrays, and function
 * 
 * @example
 *     var { type, remainingNodes } = parseConcreteType(stack, typeNodeOrArray, handleIdentifierUpdate)
 */
export function parseConcreteType(stack, typeNodeOrArray, handleIdentifierUpdate) {
    // FIXME:
        // handle unions and enums
        // test arrays

    // FIXME: make this error report its location in the code
    const getErrorArgsAsString = ()=>typeNodeOrArray instanceof Array ? JSON.stringify(typeNodeOrArray.map(each=>each.text).join(" ")) : JSON.stringify(typeNodeOrArray.text)
    
    // trivial primitive
    if (typeNodeOrArray.type === 'primitive_type') {
        return {
            type: new Type({
                baseName: typeNodeOrArray.text,
                identifierInfo: null,
            }),
            remainingNodes: [],
        }
    // trivial custom
    } else if (typeNodeOrArray.type === 'type_identifier') {
        const { exists, isLocal, isGlobal, identifierInfo } = stack.identifierInfoFor(identifierName)
        if (!exists) {
            throw Error(`Trying to use the ${getErrorArgsAsString()} type, but it hasn't been declared yet`)
        }
        return {
            type: new Type({
                baseName: typeNodeOrArray.text,
                identifierInfo,
            }),
            remainingNodes: [],
        }
    // struct definition
    } else if (typeNodeOrArray.type === 'struct_specifier') {
        // TODO: if not has fields, error (unintented usage)
        const hasName = typeNodeOrArray.children.some(each=>each.type === 'type_identifier')
        if (!hasName) {
            return {
                type: new Type({
                    baseName: "<anonymous>",
                    identifierInfo: {
                        isAnonymous: true,
                        nodes: [
                            typeNodeOrArray,
                        ],
                        source: stack.position,
                        declaration: typeNodeOrArray,
                    },
                }),
                remainingNodes: [],
            }
        } else {
            const identifierNode = typeNodeOrArray.children.filter(each=>each.type === 'type_identifier')[0]
            const identifierName = identifierNode.text
            const identifierInfo = handleIdentifierUpdate(stack, identifierName, identifierNode, {isDeclaration: false, isDefinition: true, isVar: false, isFunction: false, isType: true, })
            if (!exists) {
                throw Error(`Trying to use the ${getErrorArgsAsString()} type, but it hasn't been declared yet`)
            }
            return {
                type: new Type({
                    baseName: identifierName,
                    identifierInfo,
                }),
                remainingNodes: [],
            }
        }
    } else if (typeNodeOrArray instanceof Array) {
        // 
        // extract: const, extern, inline, static, register, auto
        // 
        let qualifiers = []
        let storageClassSpecifiers = []
        let remaining = []
        for (const each of typeNodeOrArray) {
            // ex: const 
            if (each.type === 'type_qualifier') {
                qualifiers.push(each.text)
                continue
            }
            // ex: extern, inline, static, register
            if (each.type === 'storage_class_specifier') {
                storageClassSpecifiers.push(each.text)
                continue
            }
            
            remaining.push(each)
        }
        
        //
        // extract: short, long, unsigned, signed
        //
        let possibleMainType
        let modifiers = []
        remaining.length = 0
        // TODO: note the error case is because of a bug in the tree sitter grammar
        const isRelatedToModifiers = each => each.type === 'primitive_type' || each.type === 'sized_type_specifier' || (each.type === 'ERROR' && primitiveKeywordInfo[each.text])
        // this could certainly be optimized
        const modifiersAndPrimitives = remaining.filter(isRelatedToModifiers).map(each=>each.text).join(" ").split(/\s+/g)
        remaining = remaining.filter(each=>!isRelatedToModifiers(each))
        const fullySpecifiedPrimitiveType = getFullySpecifiedPrimitive(modifiersAndPrimitives)
        
        if (!fullySpecifiedPrimitiveType && modifiersAndPrimitives.length > 0) {
            throw Error(`There's an issue with how the storage modifiers are being given for ${getErrorArgsAsString()}`)
        }
        
        // 
        // find out if pointer or func or custom type
        // 
        let typeIdentifers = remaining.filter(each=>each.type === 'type_identifier')
        let structSpecifier = remaining.filter(each=>each.type === 'struct_specifier')
        let totalConcreteTypes = (fullySpecifiedPrimitiveType ? 1 : 0) + typeIdentifers.length + structSpecifier.length
        if (totalConcreteTypes > 1 || totalConcreteTypes == 0) {
            if (totalConcreteTypes == 0) {
                throw Error(`This type might have modifiers, but its lacking any concrete type: ${getErrorArgsAsString()}`)
            } else {
                throw Error(`This type has multiple concrete types: ${getErrorArgsAsString()}\nOnly one concrete type is allowed.`)
            }
        }
        
        // 
        // primitive (with extras)
        // 
        if (fullySpecifiedPrimitiveType) {
            return {
                type: new Type({
                    baseName: fullySpecifiedPrimitiveType.replace(/_/g, " "),
                    declareNode: null,
                    qualifiers,
                    storageClassSpecifiers,
                    pointerInformation: null,
                }),
                remainingNodes: remaining,
            }
        
        // 
        // custom (with extras)
        // 
        } else if (typeIdentifers.length == 1 || structSpecifier.length == 1) {
            let node = typeIdentifers.concat(structSpecifier)[0]
            // TODO: if somehow this struct_specifier does have fields, error (unintented usage)
            if (node.type === 'struct_specifier') {
                node = node.children.filter(each=>each.type === 'type_identifier')[0]
            }
            const baseName = node.text
            const { exists, isLocal, isGlobal, identifierInfo } = stack.identifierInfoFor(baseName)
            if (!exists) {
                throw Error(`Trying to use ${baseName} (from ${getErrorArgsAsString()} type), but it hasn't been declared yet`)
            }
            return {
                type: new Type({
                    baseName,
                    identifierInfo,
                    qualifiers,
                    storageClassSpecifiers,
                    pointerInformation: null,
                }),
                remainingNodes: remaining.filter(each=>each.type !== 'type_identifier' || each.type !== 'struct_specifier'),
            }
        }
    }
    throw Error(`Unable to parse the concrete type for: ${getErrorArgsAsString()}`)
}
    
    //     <primitive_type text="char" />
    // ---------------------
    //     <type_identifier text="u8" />
    // ---------------------
    //     <type_qualifier>
    //         <const text="const" />
    //     </type_qualifier>
    //     <sized_type_specifier>
    //         <short text="short" />
    //         <primitive_type text="int" />
    //     </sized_type_specifier>
    // ---------------------
    //     <type_qualifier>
    //         <const text="const" />
    //     </type_qualifier>
    //     <sized_type_specifier>
    //         <short text="short" />
    //         <primitive_type text="int" />
    //     </sized_type_specifier>
    // ---------------------
    //     <type_qualifier>
    //         <const text="const" />
    //     </type_qualifier>
    //     <sized_type_specifier>
    //         <short text="short" />
    //         <primitive_type text="int" />
    //     </sized_type_specifier>
    //     <pointer_declarator>
    //         <"*" text="*" />
    //         <pointer_declarator>
    //             <"*" text="*" />
    //             <identifier text="var_dec_4" />
    //         </pointer_declarator>
    //     </pointer_declarator>
    // ---------------------
    //     <storage_class_specifier>
    //         <extern text="extern" />
    //     </storage_class_specifier>
    //     <storage_class_specifier>
    //         <inline text="inline" />
    //     </storage_class_specifier>
    //     <primitive_type text="void" />
    // ---------------------
    //     <sized_type_specifier>
    //         <unsigned text="unsigned" />
    //         <primitive_type text="char" />
    //     </sized_type_specifier>
    // ---------------------
    //     <struct_specifier>
    //         <struct text="struct" />
    //         <type_identifier text="SpecialInlineStruct" />
    //     </struct_specifier>
    // ---------------------
    //     <function_declarator>
    //         <parenthesized_declarator>
    //             <"(" text="(" />
    //             <pointer_declarator>
    //                 <"*" text="*" />
    //                 <type_identifier text="fptr" />
    //             </pointer_declarator>
    //             <")" text=")" />
    //         </parenthesized_declarator>
    //         <parameter_list>
    //             <"(" text="(" />
    //             <parameter_declaration>
    //                 <primitive_type text="int" />
    //             </parameter_declaration>
    //             <")" text=")" />
    //         </parameter_list>
    //     </function_declarator>

    // names:
        // const
        // auto
        // volatile
        // extern
        // register
        // static
        // unsigned
        // inline // check
        // restrict // check

        // short
        // long
        // signed
        // unsigned
        // struct
        // union
        // enum

        // _Bool // check
        // _Complex // check
        // _Imaginary // check