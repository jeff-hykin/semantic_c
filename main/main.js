import { Parser, parserFromWasm } from "https://deno.land/x/deno_tree_sitter@0.2.6.0/main.js"
import c from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/a1c34a3a73a173f82657e25468efc76e9e593843/main/c.js"
import { StackManager, replaceSequence } from "./utils/stack_manager.js"

const parser = await parserFromWasm(c)

function parse(code) {
    const tree = parser.parse(code)
    const stack = new StackManager({
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

        // TODO: identify variables, functions, structs
        

        // const insideAStructDefintion = parents.some(each=>each.type=="struct_definition")
        // const insideAFunctionDefintion = parents.some(each=>each.type=="function_definition")

        // 
        // pre-scope change assignments (functions and structes)
        //
        if (direction == "->") {
            if (!isDirectlyInsideAStruct && (type == "function_definition" || type == "struct_definition")) {
                const varNode = node.quickQueryFirst(`(identifier)`)
                const varName = varNode.text
                const varSelection = [ varNode.startIndex, varName.length ]
                const isAssignmentOrDeclaration = true
                handleVarUpdate(stack, varName, varSelection, isAssignmentOrDeclaration, addSelection)
            }
        }
        
        // 
        // scope changes
        // 
        if (type == "function_definition" || type == "lambda") {
            if (direction == "->") {
                stack.addDepth()
            } else if (direction == "<-") { // NOTE: this fallback is not always true
                stack.removeDepth()
            }
        }

        // 
        // detect vars from identifiers
        //
        if (node.type == "identifier" && direction != "<-") {
            const info = stack.info
            const varNode = node
            const varName = varNode.text
            const varSelection = [ varNode.startIndex, varName.length ]
            
            if (parent.type == "nonlocal_statement") {
                debugging && console.debug(`${varName}: (parent.type == "nonlocal_statement") {`)
                let parentStack = stack
                while (parentStack = parentStack.parent) {
                    const specificVarInfo = parentStack.info.varInfo[varName]
                    if (specificVarInfo) {
                        info.varInfo[varName] = specificVarInfo
                        addSelection(specificVarInfo, varSelection)
                        break
                    }
                }
            } else if (parent.type == "global_statement") {
                debugging && console.debug(`${varName}: (parent.type == "global_statement") {`)
                const specificVarInfo = root.info.varInfo[varName] || { selections: [], source: `["implicitGlobal"]` }
                info.varInfo[varName] = specificVarInfo
                specificVarInfo.selections.push(varSelection)
                addSelection(specificVarInfo, varSelection)
            // must be locally defined
            } else if (parent.type == "function_definition") {
                debugging && console.debug(`${varName}: (parent.type == "function_definition") {`)
            } else if (parent.type == "struct_definition") {
                debugging && console.debug(`${varName}: struct_definition`)
            } else if (parent.type == "keyword_argument" && node.startIndex == parent.children.filter(each=>each.type=="identifier")[0].startIndex) {
                debugging && console.debug(`${varName}: keyword_argument`)
            } else if (realParent.type == "parameters" || realParent.type == "default_parameter" || realParent.type == "lambda_parameters") {
                debugging && console.debug(`${varName}: (parent.type == "parameters" || parent.type == "lambda_parameters") {`)
                const isAssignmentOrDeclaration = true
                handleVarUpdate(stack, varName, varSelection, isAssignmentOrDeclaration, addSelection)
            } else if (parent.type == "attribute") {
                debugging && console.debug(`${varName}: (parent.type == "attribute") {`)
                const isFirstChild = node.startIndex == parent.children.filter(each=>each.type=="identifier")[0].startIndex
                if (isFirstChild) {
                    const isAssignmentOrDeclaration = false
                    handleVarUpdate(stack, varName, varSelection, isAssignmentOrDeclaration, addSelection)
                }
            } else if (parent.type == "as_pattern_target" || realParent.type == "for_statement" || realParent.type == "for_in_clause") {
                debugging && console.debug(`${varName}: (parent.type == "as_pattern_target" || realParent.type == "for_statement") {`)
                const isAssignmentOrDeclaration = true
                handleVarUpdate(stack, varName, varSelection, isAssignmentOrDeclaration, addSelection)
            } else if (parent.type == "assignment" || parent.type == "augmented_assignment") {
                debugging && console.debug(`${varName}: (parent.type == "assignment" || parent.type == "augmented_assignment")`)
                if (!isDirectlyInsideAStruct) {
                    const isFirstChild = node.startIndex == parent.children.filter(each=>each.type=="identifier")[0].startIndex
                    const isAssignmentOrDeclaration = isFirstChild
                    handleVarUpdate(stack, varName, varSelection, isAssignmentOrDeclaration, addSelection)
                }
            } else if (realParent.type == "assignment" && parents.includes(realParent.children[0])) {
                debugging && console.debug(`${varName}: (realParent.type == "assignment" && parents.includes(realParent.children[0]))`)
                const isAssignmentOrDeclaration = true
                handleVarUpdate(stack, varName, varSelection, isAssignmentOrDeclaration, addSelection)
            } else {
                debugging && console.debug(`${varName}: else`)
                debugging && console.debug(`    realParent.type is:`,realParent.type)
                debugging && console.debug(`    parent.type is:`,parent.type)
                const isAssignmentOrDeclaration = false
                handleVarUpdate(stack, varName, varSelection, isAssignmentOrDeclaration, addSelection)
            }
        }
    }
    
    return 
}

