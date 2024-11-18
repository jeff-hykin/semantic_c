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
const primitiveStorageMapping = new Map()
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

class Type {
    constructor({ baseName, primitiveCore, declareNode, qualifiers, storageClassSpecifiers, pointerInformation, ...other}) {
        this.baseName = baseName
        this.primitiveCore = primitiveCore
        this.declareNode = declareNode
        this.qualifiers = qualifiers
        this.storageClassSpecifiers = storageClassSpecifiers
        this.pointerInformation = pointerInformation
        Object.assign(this, other)
    }
    get isPrimitive() {
        return !!this.declareNode
    }
    get isPointer() {
        return !!this.pointerInformation
    }
}

function parseType(stack, typeNodeOrArray) {
    // trivial primitive
    if (typeNodeOrArray.type === 'primitive_type') {
        return {
            type: new Type({
                baseName: typeNodeOrArray.text,
                declareNode: null,
                modifiers: [],
            }),
            remainingNodes: [],
        }
    }
    
    // trivial custom
    if (typeNodeOrArray.type === 'type_identifier') {
        const { exists, isLocal, isGlobal, identifierInfo } = stack.identifierInfoFor(identifierName)
        if (!exists) {
            // FIXME: make this error report its location in the code
            throw Error(`Trying to use the ${JSON.stringify(typeNodeOrArray.text)} type, but it hasn't been declared yet`)
        }
        return {
            type: new Type({
                baseName: typeNodeOrArray.text,
                declareNode: identifierInfo,
                modifiers: [],
            }),
            remainingNodes: [],
        }
    }

    if (typeNodeOrArray instanceof Array) {
        // 
        // extract: const, extern, inline, static, register, auto
        // 
        let typeQualifiers = []
        let storageClassSpecifiers = []
        let remaining = []
        for (const each of typeNodeOrArray) {
            // ex: const 
            if (each.type === 'type_qualifier') {
                typeQualifiers.push(each.text)
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
        const current = [...remaining]
        remaining.length = 0
        for (const each of current) {
            if (!possibleMainType) {
                // basic
                if (each.type === 'primitive_type') {
                    possibleMainType = each.text
                    continue
                }
                // TODO: can type_identifier appear here?

                if (each.type === 'sized_type_specifier') {
                    for (const eachInner of each.children) {
                        // if there is a non-modifier, then it is the main type of the size
                        if (eachInner.type !== 'primitive_type') {
                            possibleMainType = eachInner.text
                            break
                        }
                        modifiers.push(eachInner.text)
                    }
                    continue
                }
            }
            remaining.push(each)
            // <primitive_type
            // <sized_type_specifier
            // <type_identifier
            // <struct_specifier
        }
    }

    

    // TODO: handle arrays
    
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
    
}