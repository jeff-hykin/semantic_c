export class ScopeStackManager {
    constructor({defaultInfoCreator=(_=>({}))}={}) {
        this.defaultInfoCreator = defaultInfoCreator.bind(this)
        this._nextStackDepth = [0]
        this.stackAt = {}
        this.info = this.defaultInfoCreator()
        this._identifierInfoFor = new Map()
    }

    _clone() {
        const clone = new ScopeStackManager({})
        clone._nextStackDepth = this._nextStackDepth
        clone.stackAt = this.stackAt
        clone.defaultInfoCreator = this.defaultInfoCreator
        clone._identifierInfoFor = this._identifierInfoFor
        return clone
    }

    get position() {
        return JSON.stringify(this._nextStackDepth.slice(0,-1))
    }

    get info() {
        return this.stackAt[this.position]
    }
    set info(value) {
        this.stackAt[this.position] = value
    }

    get root() {
        const clone = this._clone()
        clone._nextStackDepth = this._nextStackDepth.slice(0,1)
        return clone
    }

    get parent() {
        if (this._nextStackDepth.length == 1) {
            return null
        } else {
            const clone = this._clone()
            clone._nextStackDepth = this._nextStackDepth.slice(0,-1)
            return clone
        }
    }
    
    addDepth() {
        this._nextStackDepth.push(this._nextStackDepth.pop()+1)
        this._nextStackDepth.push(0)
        this.info = this.defaultInfoCreator()
    }

    removeDepth() {
        this._nextStackDepth.pop()
    }
    
    get localIdentifiers() {
        if (this._identifierInfoFor.has(this.stackAt[this.position])) {
            return this._identifierInfoFor.get(this.stackAt[this.position])
        } else {
            const identifierInfo = {}
            this._identifierInfoFor.set(this.stackAt[this.position], identifierInfo)
            return identifierInfo
        }
    }
    
    identifierInfoFor(varName) {
        const identifierInfoSource = this.localIdentifiers
        if (identifierInfoSource[varName]) {
            return {
                exists: true,
                isLocal: true,
                isGlobal: false, // global is not the opposite of local btw
                identifierInfo: identifierInfoSource[varName],
            }
        }
        let identifierInfo
        let parentStack = this
        while (parentStack = parentStack.parent) {
            const specificidentifierInfo = parentStack.localIdentifiers[varName]
            if (specificidentifierInfo) {
                identifierInfo = specificidentifierInfo
                break
            }
        }
        if (!identifierInfo) {
            return {
                exists: false,
                isLocal: false,
                isGlobal: false,
                identifierInfo: null,
            }
        } else {
            return {
                exists: true,
                isLocal: false,
                isGlobal: this.root.localIdentifiers[varName] == identifierInfo,
                identifierInfo: identifierInfo,
            }
        }
    }
}