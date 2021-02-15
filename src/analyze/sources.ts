import {
  AbstractionBranchNode,
  AssignmentNode,
  BlockNode,
  ClassNode,
  DestructuringPatternNode,
  EnumNode,
  EnumValueNode,
  ExportNode,
  GeneratorNode,
  IdentifierNode,
  IdentifierPatternNode,
  ListComprehensionNode,
  ProgramNode,
  RefinementTypeDeclarationNode,
  RefinementTypeNode,
  ShorthandMemberPatternNode,
  SyntaxNode,
  SyntaxType,
  TypeAliasNode,
  TypeVariableDeclarationNode,
  TypeVariableNode,
  WhenNode,
} from 'tree-sitter-tony/tony'
import {
  NestedScope,
  NestingNode,
  SourceFileScope,
  buildNestedScope,
  buildSourceFileScope,
  isFileScope,
} from '../types/analyze/scopes'
import { NodeWithinProgram, isNodeWithinProgram } from '../types/nodes'
import {
  SourceDependency,
  isSourceDependency,
} from '../types/analyze/dependencies'
import { addError, conditionalApply, ensure } from '../util/traverse'
import {
  addTermBinding,
  addTypeBinding,
  flushTermBindings,
  handleIdentifierPatternName,
} from './util'
import {
  buildDuplicateBindingError,
  buildExportOutsideFileScopeError,
  buildIncompleteWhenPatternError,
  buildMissingBindingError,
  buildRefinementTypeDeclarationOutsideRefinementTypeError,
} from '../types/errors/annotations'
import {
  buildTypeVariable,
  buildUnionType,
} from '../types/type_inference/types'
import { findBinding, itemsMissingFrom } from '../util/bindings'
import {
  getIdentifierName,
  getTypeName,
  getTypeVariableName,
} from '../util/parse'
import { getTerms, getTypeVariables, getTypes } from '../util/scopes'
import { AbstractState } from './types'
import { Config } from '../config'
import { assert } from '../types/errors/internal'
import { buildConstraintsFromType } from '../util/types'
import { buildTypeVariableBinding } from '../types/analyze/bindings'
import { buildTypes } from './build_type'
import { handleImports } from './imports'

type State = AbstractState & {
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table. Scopes are collected recursively.
   */
  scopes: (SourceFileScope | NestedScope)[]
}

export const constructFileScopeFromSource = async (
  config: Config,
  dependency: SourceDependency,
  node: ProgramNode,
): Promise<SourceFileScope> => {
  const initialFileScope = buildSourceFileScope(dependency, node)
  const initialState: State = {
    config,
    file: dependency.file,
    scopes: [initialFileScope],
    terms: [],
  }

  const stateWithImports = await handleImports(initialState, node.importNodes)
  const {
    scopes: [fileScope],
  } = traverseAll(stateWithImports, node.termNodes)
  assert(
    isFileScope(fileScope) && isSourceDependency(fileScope.dependency),
    'Traverse should arrive at the top-level file scope.',
  )

  return fileScope as SourceFileScope
}

const enterBlock = (state: State, node: NestingNode): State => {
  const scope = buildNestedScope(node)
  return {
    ...state,
    scopes: [scope, ...state.scopes],
  }
}

const leaveBlock = (state: State): State => {
  const [scope, parentScope, ...parentScopes] = state.scopes

  assert(
    !isFileScope(scope) && parentScope !== undefined,
    'Cannot leave file-level scope.',
  )

  const newParentScope = {
    ...parentScope,
    scopes: [...parentScope.scopes, scope],
  }
  return {
    ...state,
    scopes: [newParentScope, ...parentScopes],
  }
}

const nest = <T extends NestingNode>(
  callback: (state: State, node: T) => State,
) => (state: State, node: T) => {
  const nestedState = enterBlock(state, node)
  const updatedState = callback(nestedState, node)
  return leaveBlock(updatedState)
}

const exportAndReset = (
  state: State,
): [isExported: boolean, newState: State] => [
  !!state.exportNextBindings,
  { ...state, exportNextBindings: undefined },
]

const addTypeVariableBinding = (name: string) =>
  ensure<State, TypeVariableDeclarationNode>(
    (state) =>
      findBinding(name, state.scopes.map(getTypeVariables)) === undefined,
    (state, node) => {
      const [
        stateWithConstraints,
        deferredAssignments,
        constraintTypes,
      ] = buildTypes(state, node.constraintNodes)
      const typeVariable = buildTypeVariable()
      const binding = buildTypeVariableBinding(
        name,
        node,
        typeVariable,
        buildConstraintsFromType(
          typeVariable,
          buildUnionType(constraintTypes),
          deferredAssignments,
        ),
      )
      const [scope, ...parentScopes] = stateWithConstraints.scopes
      const newScope = {
        ...scope,
        typeVariables: [...scope.typeVariables, binding],
      }
      return {
        ...stateWithConstraints,
        scopes: [newScope, ...parentScopes],
      }
    },
    buildDuplicateBindingError(name),
  )

const traverseAll = (state: State, nodes: NodeWithinProgram[]): State =>
  nodes.reduce((acc, child) => traverse(acc, child), state)

const traverseAllChildren = (state: State, node: SyntaxNode): State =>
  traverseAll(state, node.namedChildren.filter(isNodeWithinProgram))

const traverse = (state: State, node: NodeWithinProgram): State => {
  switch (node.type) {
    case SyntaxType.AbstractionBranch:
      return handleAbstractionBranch(state, node)
    case SyntaxType.Assignment:
      return handleAssignment(state, node)
    case SyntaxType.Block:
      return handleBlock(state, node)
    case SyntaxType.Class:
      return handleClass(state, node)
    case SyntaxType.DestructuringPattern:
      return handleDestructuringPattern(state, node)
    case SyntaxType.Enum:
      return handleEnum(state, node)
    case SyntaxType.EnumValue:
      return handleEnumValue(state, node)
    case SyntaxType.Export:
      return handleExport(state, node)
    case SyntaxType.Generator:
      return handleGenerator(state, node)
    case SyntaxType.Identifier:
      return handleIdentifier(state, node)
    case SyntaxType.IdentifierPattern:
      return handleIdentifierPatternAndShorthandMemberPattern(state, node)
    case SyntaxType.ListComprehension:
      return handleListComprehension(state, node)
    case SyntaxType.ShorthandMemberPattern:
      return handleIdentifierPatternAndShorthandMemberPattern(state, node)
    case SyntaxType.RefinementType:
      return handleRefinementType(state, node)
    case SyntaxType.RefinementTypeDeclaration:
      return handleRefinementTypeDeclaration(state, node)
    case SyntaxType.TypeAlias:
      return handleTypeAlias(state, node)
    case SyntaxType.TypeVariable:
      return handleTypeVariable(state, node)
    case SyntaxType.TypeVariableDeclaration:
      return handleTypeVariableDeclaration(state, node)
    case SyntaxType.When:
      return handleWhen(state, node)
    default:
      return traverseAllChildren(state, node)
  }
}

const handleAbstractionBranch = nest<AbstractionBranchNode>((state, node) => {
  const stateWithTypeParameters = conditionalApply(traverseAll)(
    state,
    node.typeParameterNodes,
  )
  const stateWithParameters = traverseAll(
    stateWithTypeParameters,
    node.elementNodes,
  )
  const stateWithRestParameter = conditionalApply(traverse)(
    stateWithParameters,
    node.restNode,
  )
  const stateWithFlushedBindings = flushTermBindings(stateWithRestParameter)
  return traverse(
    {
      ...stateWithFlushedBindings,
      nextBlockScopeAlreadyCreated: true,
    },
    node.bodyNode,
  )
})

const handleAssignment = (state: State, node: AssignmentNode): State => {
  const stateWithBindings = traverse(state, node.patternNode)
  const stateWithFlushedBindings = flushTermBindings(stateWithBindings)
  return traverse(
    {
      ...stateWithFlushedBindings,
      exportNextBindings: undefined,
    },
    node.valueNode,
  )
}

const handleBlock = (state: State, node: BlockNode): State => {
  const { nextBlockScopeAlreadyCreated: skipNesting } = state

  if (skipNesting)
    return traverseAllChildren(
      {
        ...state,
        nextBlockScopeAlreadyCreated: undefined,
      },
      node,
    )
  else return nest<BlockNode>(traverseAllChildren)(state, node)
}

const handleClass = nest<ClassNode>((state, node) => {
  const [isExported, stateWithoutExport] = exportAndReset(state)
  const name = getTypeName(node.nameNode.nameNode)
  const stateWithName = traverse(stateWithoutExport, node.nameNode)
  const stateWithMembers = traverseAll(
    {
      ...stateWithName,
      nextBlockScopeAlreadyCreated: true,
    },
    node.memberNodes,
  )
  return addTypeBinding(name, isExported)(stateWithMembers, node)
})

const handleDestructuringPattern = (
  state: State,
  node: DestructuringPatternNode,
): State => {
  if (node.aliasNode === undefined) return traverse(state, node.patternNode)
  const {
    exportNextBindings: isExported,
    nextIdentifierPatternBindingsImplicit: isImplicit,
    importNextBindingsFrom: importedFrom,
  } = state
  const name = getIdentifierName(node.aliasNode)
  const stateWithBinding = addTermBinding(
    name,
    !!isImplicit,
    isExported,
    importedFrom,
  )(state, node)
  return traverse(stateWithBinding, node.patternNode)
}

const handleEnum = (state: State, node: EnumNode): State => {
  const { exportNextBindings: isExported } = state
  const name = getTypeName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithValues = traverseAll(stateWithName, node.valueNodes)
  const stateWithBinding = addTypeBinding(name, isExported)(
    { ...stateWithValues, exportNextBindings: false },
    node,
  )
  return flushTermBindings(stateWithBinding)
}

const handleEnumValue = (state: State, node: EnumValueNode): State => {
  const { exportNextBindings: isExported } = state
  const name = getIdentifierName(node.nameNode)
  const stateWithName = handleIdentifierPatternName(state, node.nameNode)
  const stateWithBinding = addTermBinding(
    name,
    false,
    isExported,
  )(stateWithName, node)
  return conditionalApply(traverse)(stateWithBinding, node.valueNode)
}

const handleExport = ensure<State, ExportNode>(
  (state) => isFileScope(state.scopes[0]),
  (state, node) =>
    traverse(
      {
        ...state,
        exportNextBindings: true,
      },
      node.declarationNode,
    ),
  buildExportOutsideFileScopeError(),
)

const handleGenerator = (state: State, node: GeneratorNode): State => {
  const name = getIdentifierName(node.nameNode)
  const stateWithValue = traverse(state, node.valueNode)
  const stateWithBinding = addTermBinding(name, true)(stateWithValue, node)
  const stateWithFlushedBinding = flushTermBindings(stateWithBinding)
  return conditionalApply(traverse)(stateWithFlushedBinding, node.conditionNode)
}

const handleIdentifier = (state: State, node: IdentifierNode): State => {
  const name = getIdentifierName(node)
  // there may be multiple bindings, but here we only check that at least one
  // binding exists
  const binding = findBinding(name, state.scopes.map(getTerms))

  if (binding) return state
  return addError(state, node, buildMissingBindingError(name))
}

const handleIdentifierPatternAndShorthandMemberPattern = (
  state: State,
  node: IdentifierPatternNode | ShorthandMemberPatternNode,
): State => {
  const {
    exportNextBindings: isExported,
    nextIdentifierPatternBindingsImplicit: isImplicit,
    importNextBindingsFrom: importedFrom,
  } = state
  const name = getIdentifierName(node.nameNode)
  const stateWithType = conditionalApply(traverse)(state, node.typeNode)
  const stateWithDefault = conditionalApply(traverse)(
    stateWithType,
    node.defaultNode,
  )
  return addTermBinding(
    name,
    !!isImplicit,
    isExported,
    importedFrom,
  )(stateWithDefault, node)
}

const handleListComprehension = nest<ListComprehensionNode>((state, node) => {
  const nestedStateWithGenerators = traverseAll(state, node.generatorNodes)
  return traverse(
    {
      ...nestedStateWithGenerators,
      nextBlockScopeAlreadyCreated: true,
    },
    node.bodyNode,
  )
})

const handleRefinementType = nest<RefinementTypeNode>((state, node) => {
  const stateWithGenerator = flushTermBindings(
    traverse(state, node.generatorNode),
  )
  return traverseAll(stateWithGenerator, node.predicateNodes)
})

const handleRefinementTypeDeclaration = ensure<
  State,
  RefinementTypeDeclarationNode
>(
  (state) => state.scopes[0].node.type === SyntaxType.RefinementType,
  (state, node) => {
    const name = getIdentifierName(node.nameNode)
    const stateWithType = traverse(state, node.typeNode)
    return addTermBinding(name, true)(stateWithType, node)
  },
  buildRefinementTypeDeclarationOutsideRefinementTypeError(),
)

const handleTypeAlias = nest<TypeAliasNode>((state, node) => {
  const { exportNextBindings: isExported } = state
  const name = getTypeName(node.nameNode.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithType = traverse(stateWithName, node.typeNode)
  const stateWithBinding = addTypeBinding(name, isExported)(stateWithType, node)
  return { ...stateWithBinding, exportNextBindings: undefined }
})

const handleTypeVariable = (state: State, node: TypeVariableNode): State => {
  const name = getTypeVariableName(node)
  const binding = findBinding(name, state.scopes.map(getTypes))

  if (binding) return state
  return addError(state, node, buildMissingBindingError(name))
}

const handleTypeVariableDeclaration = (
  state: State,
  node: TypeVariableDeclarationNode,
): State => {
  const name = getTypeVariableName(node.nameNode)
  const stateWithBinding = addTypeVariableBinding(name)(state, node)
  return conditionalApply(traverseAll)(stateWithBinding, node.constraintNodes)
}

const handleWhen = nest<WhenNode>((state, node) => {
  // Build temporary scopes around patterns.
  const statesWithBindings = node.patternNodes.map((patternNode) => {
    const nestedState = enterBlock(state, node)
    return flushTermBindings(
      traverse(
        {
          ...nestedState,
          nextIdentifierPatternBindingsImplicit: true,
        },
        patternNode,
      ),
    )
  })

  // Ensure that all patterns define the same terms.
  const stateWithBindings = statesWithBindings.reduceRight(
    (accState, state, i) => {
      const [accScope, ...parentScopes] = accState.scopes
      const [scope] = state.scopes
      assert(
        !isFileScope(accScope) && !isFileScope(scope),
        'Temporary scopes around `when` patterns should be nested scopes.',
      )

      const missingBindings = itemsMissingFrom(
        getTerms(scope),
        getTerms(accScope),
      )
      if (missingBindings.length > 0)
        return addError(
          accState,
          node.patternNodes[i],
          buildIncompleteWhenPatternError(
            missingBindings.map((binding) => binding.name),
          ),
        )

      return {
        ...accState,
        scopes: [
          {
            ...accScope,
            errors: [...accScope.errors, ...scope.errors],
          },
          ...parentScopes,
        ],
      }
    },
    statesWithBindings[0],
  )

  return traverse(
    {
      ...stateWithBindings,
      nextBlockScopeAlreadyCreated: true,
    },
    node.bodyNode,
  )
})
