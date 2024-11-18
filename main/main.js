import { Parser, parserFromWasm } from "https://deno.land/x/deno_tree_sitter@0.2.6.0/main.js"
// import c from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/a1c34a3a73a173f82657e25468efc76e9e593843/main/c.js"
import c from "./c.wasm.binaryified.js"
import { ScopeStackManager } from "./utils/stack_manager.js"
import { parseConcreteType } from "./utils/type_handler.js"

const parser = await parserFromWasm(c)
// const parser = await parserFromWasm(Deno.readFileSync("/Users/jeffhykin/repos/tree-sitter-c/out.wasm"))

// tree sitter limitations:
    // casting ambiguity // https://github.com/tree-sitter/tree-sitter-c/issues/49
    // variable declarations vs function call ambiguity // https://github.com/tree-sitter/tree-sitter-c/issues/99    // int(a); vs myInt(d);
    // incorrect handling of TRUE, FALSE, and NULL // https://github.com/tree-sitter/tree-sitter-c/issues/238
    // compound statements // https://gcc.gnu.org/onlinedocs/gcc/Statement-Exprs.html
    // implicit return types (deprecated anyways) // https://github.com/tree-sitter/tree-sitter-c/issues/9

// type handling
    // "storage_class_specifier" // static, extern, auto, register
    // "type_qualifier" // const, volatile, restrict
    // "primitive_type" // void, char, short, int, long, float, double, signed, unsigned
    // "struct_specifier"  // struct A a; 
    // "union_specifier"
    // "enum_specifier"
    // "type_identifier" // the normal name of a struct, union, or enum

function parse(code) {
    const tree = parser.parse(code)
    const stack = new ScopeStackManager({
        defaultInfoCreator: ()=>({})
    })

    let skipUntilClosing
    for (const [ parents, node, direction ] of tree.rootNode.traverse()) {
        if (node.type == "ERROR") {
            // TODO: make this better
            throw Error(`Parsing error: There was a parsing issue\n    Please make sure the code is valid ${langName} code\n\n`)
        }
        if (parents.length == 0) {
            continue
        }
        const parent = parents[0]
        if (skipUntilClosing) {
            if (node == skipUntilClosing) {
                skipUntilClosing = null
            }
            continue
        }

        // 
        // irrelevent for semantics
        // 
        const {type, children} = node
        if (type == "comment") {
            continue
        }
        
        const isTopLevel = parents.length == 1
        // TODO: identify variables, functions, type identifiers

        // 
        // pre-scope change assignments (functions and structes)
        //
        if (direction == "->") {
            if (isTopLevel) {
                // $.function_definition, 
                // $.linkage_specification, // extern "C" { }; // not supporting this yet
                // $.declaration,
                // $._top_level_statement and/or $.attributed_statement,
                    // $.case_statement,
                    // $.attributed_statement,
                    // $.labeled_statement,
                    // $.compound_statement,
                    // alias($._top_level_expression_statement, $.expression_statement),
                    // $.if_statement,
                    // $.switch_statement,
                    // $.do_statement,
                    // $.while_statement,
                    // $.for_statement,
                    // $.return_statement,
                    // $.break_statement,
                    // $.continue_statement,
                    // $.goto_statement,,
                // $.type_definition,
                // $._empty_declaration,
                    // $.struct_specifier,
                    // $.union_specifier,
                    // $.enum_specifier,
                    // $.macro_type_specifier,
                    // $.sized_type_specifier,
                    // $.primitive_type,
                    // $._type_identifier,
                    
                // declaration
                    // specifiers
                const isTypeDef = type == "type_definition"
                
                const isStuctStatement = type == "struct_specifier" || (type == "declarator" && node) // struct name = "type_identifier"
                const isStructDeclare = isStuctStatement && node.children.some(each=>each.type == "field_declaration_list")
                const isStructDefinition = isStuctStatement && !isStructDeclare

                // TODO: union and enum
                
                const isFunctionDefinition = type == "function_definition"
                const isFunctionPointerDeclare = type == "declaration" && node.children.filter(each=>each.type == "function_declarator").some(each=>each.children.some(each=>each.type == "parenthesized_declarator"))
                const isFunctionDeclare = type == "declaration" && !isFunctionPointerDeclare && node.children.some(each=>each.type == "function_declarator") && !node.children.filter(each=>each.type == "function_declarator").some(each=>each.children.some(each=>each.type == "parenthesized_declarator"))
                // FIXME: function pointers would trigger this^
                
                // NOTE: two types of var declarations: normal and at the end of a struct
                // TODO: unions and enums
                const isVarStatement = isFunctionPointerDeclare || (type == "declaration" && !isFunctionDeclare) || (isStructDefinition && node.children.some(each=>each.type == "identifier"))
                const isVarDefinition = type == isVarStatement && node.children.some(each=>each.type == "init_declarator")
                const isVarDeclare = isVarStatement && !isVarDefinition
                
                // edgecases:
                    // struct declare var
                    // multiple var declarations in one line (pointers and arrays are per name, rest of type is not)
                    // function parameters, and recursive function pointers
                    // typedefs are similar to var declarations, but name is type


                // simple var declaration
                if (isVarDeclare && !isStuctStatement) {
                    if (isFunctionPointerDeclare) {
                        const functionPointer = (
                            node.children.find(
                                each=>each.type == "function_declarator"
                            ).children.find(
                                each=>each.type == "parenthesized_declarator"
                            ).children.find(
                                each=>each.type == "pointer_declarator"
                            ).children.find(
                                each=>each.type == "identifier"
                            ).text
                        )
                        const parameterNodes = (
                            node.children.find(
                                each=>each.type == "function_declarator"
                            ).children.find(
                                each=>each.type == "parameter_list"
                            ).children.filter(
                                each=>each.type == "parameter_declaration"
                            )
                        )
                        // FIXME: 
                    } else {
                        // FIXME: 
                        handleIdentifierUpdate(stack, identifierName, identifierNode, {
                            isDeclaration: true,
                            isDefinition: false,
                            isVar: true,
                            isFunction: false,
                            isType: false,
                        })
                    }
                    
                }

                if (isTypeDef) {
                    // TODO: function pointers
                }

                // handleIdentifierUpdate(stack, identifierName, identifierNode, {
                //     isDeclaration: true,
                //     isDefinition: false,
                //     isVar: false,
                //     isFunction: false,
                //     isType: false,
                // })
            }
                
            // TODO: inside structs, unions, enums, function definitions
        }
        
        // 
        // scope changes
        // 
            // note: compound_statement handles function bodies
        if (type == "compound_statement" || type == "field_declaration_list") {
            if (direction == "->") {
                stack.addDepth()
            } else if (direction == "<-") { // NOTE: this fallback is not always true
                stack.removeDepth()
            }
        }

        // 
        // detect vars from identifiers
        //
        // if (node.type == "identifier" && direction != "<-") {
        //     const info = stack.info
        //     const identifierNode = node
        //     const varName = identifierNode.text
        //     const identifierNode = [ identifierNode.startIndex, varName.length ]
            
        // }
    }
    
    return 
}

function handleIdentifierUpdate(stack, identifierName, identifierNode, {isDeclaration, isDefinition, isVar, isFunction, isType, ...otherStaticInfo }) {
    otherStaticInfo = { isVar, isFunction, isType, ...otherStaticInfo }
    const localIdentifiers = stack.localIdentifiers
    const { exists, isLocal, isGlobal, identifierInfo } = stack.identifierInfoFor(identifierName)

    // TODO: make sure a local definition can't satisfy a parent declaration
    
    // variable begin declared
    if (isDeclaration) {
        // new local identifier created
        if (!isLocal) {
            return localIdentifiers[identifierName] = {
                number: Object.keys(localIdentifiers).length,
                nodes: [
                    identifierNode,
                ],
                source: stack.position,
                declaration: identifierNode,
                ...otherStaticInfo,
            }
        // if there's already a local thing with the same name, it's a redeclaration issue
        } else {
            throw Error(`Variable delcared twice in the same scope: ${identifierName}\n${identifierNode}`)
        }
    } else if (isDefinition) {
        // new local identifier created
        if (!isLocal) {
            return localIdentifiers[identifierName] = {
                number: Object.keys(localIdentifiers).length,
                nodes: [
                    identifierNode,
                ],
                source: stack.position,
                declaration: identifierNode,
                definition: identifierNode,
                ...otherStaticInfo,
            }
        // if there's already a local thing, it could be fine so long as it's a matching definition of a declaration (and not a var)
        } else {
            if (isVar) {
                throw Error(`Variable delcared twice in the same scope: ${identifierName}\n${identifierNode}`)
            } else if (identifierInfo.definition) {
                throw Error(`Identifier defined twice in the same scope: ${identifierName}\n${identifierNode}`)
            } else {
                identifierInfo.nodes.push(identifierNode)
                identifierInfo.definition = identifierNod
                return identifierInfo
            }
        }
    // usage
    } else {
        // pull parent into local scope
        if (!isLocal) {
            localIdentifiers[identifierName] = identifierInfo
            localIdentifiers[identifierName].nodes.push(identifierNode)
            return identifierInfo
        } else {
            identifierInfo.nodes.push(identifierNode)
            return identifierInfo
        }
    }
}


// eventually deal with: "typeof"