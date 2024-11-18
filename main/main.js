import { Parser, parserFromWasm } from "https://deno.land/x/deno_tree_sitter@0.2.6.0/main.js"
import c from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/a1c34a3a73a173f82657e25468efc76e9e593843/main/c.js"
import { ScopeStackManager } from "./utils/stack_manager.js"
import { processFiles } from "vsce/out/package.js"

const parser = await parserFromWasm(c)

// type handling
    // "storage_class_specifier" // static, extern, auto, register
    // "type_qualifier" // const, volatile, restrict
    // "primitive_type" // void, char, short, int, long, float, double, signed, unsigned, bool
    // "struct_specifier"  // struct A a; 
    // "union_specifier"
    // "enum_specifier"
    // "type_identifier" // the normal name of a struct, union, or enum

function parse(code) {
    const tree = parser.parse(code)
    const stack = new ScopeStackManager({
        defaultInfoCreator: ()=>({
            varCount: 0,
            varInfo: {
                // number
                // selections
                // source
            },
        })
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
        const {type} = node
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
                const isFunctionDeclare = type == "declaration" && node.children.some(each=>each.type == "function_declarator")
                const isVarStatement = type == "declaration" && !isFunctionDeclare
                const isVarDefinition = type == isVarStatement && node.children.some(each=>each.type == "init_declarator")
                const isVarDeclare = isVarStatement && !isVarDefinition
                    // 
                const isTypeDefiniton = type == "type_definition"
                const isFunctionDefinition = type == "function_definition"
                const isStructAndVarDefinition = type == "declaration" && node.children.some(each=>each.type == "struct_specifier")
                const isNormalStuctDefinition = type == "struct_specifier" // name = "type_identifier"
                // TODO:
                    // finish: structs
                    // unions
                    // enums
                
                // NOTE: edgecase of inline defined structs: struct S gs = ((struct S){1, 2, 3, 4}); // struct definition effectively
                
                
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
        //     const varNode = node
        //     const varName = varNode.text
        //     const varSelection = [ varNode.startIndex, varName.length ]
            
        // }
    }
    
    return 
}

