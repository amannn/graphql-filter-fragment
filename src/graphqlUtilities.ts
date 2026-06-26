/**
 * GraphQL AST helpers used by `graphql.ts`.
 *
 * These were previously imported from `@apollo/client/utilities`, but Apollo
 * removed them in `@apollo/client@4` (they originate from the unmaintained
 * `graphql-anywhere` package). They are reimplemented here so that this package
 * only depends on `graphql` and works with any modern bundler – notably
 * Rolldown/Vite, which errors on the unresolved `@apollo/client/utilities`
 * import when `@apollo/client` is not installed.
 *
 * The implementations follow the original `graphql-anywhere`/`apollo-utilities`
 * behaviour (MIT licensed, same as this package) and are behaviourally
 * identical for valid inputs. Intentional deviations:
 *   - Errors are thrown as plain `Error` instead of Apollo's `InvariantError`.
 *   - `getMainDefinition` does not run Apollo's `checkDocument` validation
 *     (it still throws if no query/mutation/subscription/fragment is present).
 *   - `valueToObjectRepresentation` uses a `switch` and a shorter "not
 *     supported" message; the per-kind output is unchanged.
 */
import {
  ArgumentNode,
  BooleanValueNode,
  DirectiveNode,
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  InlineFragmentNode,
  Kind,
  NameNode,
  OperationDefinitionNode,
  SelectionNode,
  ValueNode
} from 'graphql';

export type VariableMap = {[name: string]: any};

export type FragmentMap = {[fragmentName: string]: FragmentDefinitionNode};

export type DirectiveInfo = {
  [fieldName: string]: {[argName: string]: any};
};

export function getFragmentDefinitions(
  doc: DocumentNode
): Array<FragmentDefinitionNode> {
  return doc.definitions.filter(
    (definition): definition is FragmentDefinitionNode =>
      definition.kind === Kind.FRAGMENT_DEFINITION
  );
}

export function getMainDefinition(
  queryDoc: DocumentNode
): OperationDefinitionNode | FragmentDefinitionNode {
  let fragmentDefinition: FragmentDefinitionNode | undefined;

  for (const definition of queryDoc.definitions) {
    if (
      definition.kind === Kind.OPERATION_DEFINITION &&
      (definition.operation === 'query' ||
        definition.operation === 'mutation' ||
        definition.operation === 'subscription')
    ) {
      return definition;
    }

    // Use the first fragment as the main definition only if the document
    // contains no operation (queries built purely from a fragment).
    if (definition.kind === Kind.FRAGMENT_DEFINITION && !fragmentDefinition) {
      fragmentDefinition = definition;
    }
  }

  if (fragmentDefinition) {
    return fragmentDefinition;
  }

  throw new Error(
    'Expected a parsed GraphQL query with a query, mutation, subscription, or a fragment.'
  );
}

export function createFragmentMap(
  fragments: Array<FragmentDefinitionNode> = []
): FragmentMap {
  const symTable: FragmentMap = {};
  fragments.forEach((fragment) => {
    symTable[fragment.name.value] = fragment;
  });
  return symTable;
}

export function isField(selection: SelectionNode): selection is FieldNode {
  return selection.kind === Kind.FIELD;
}

export function isInlineFragment(
  selection: SelectionNode
): selection is InlineFragmentNode {
  return selection.kind === Kind.INLINE_FRAGMENT;
}

export function resultKeyNameFromField(field: FieldNode): string {
  return field.alias ? field.alias.value : field.name.value;
}

function valueToObjectRepresentation(
  argObj: any,
  name: NameNode,
  value: ValueNode,
  variables?: VariableMap
) {
  switch (value.kind) {
    case Kind.INT:
    case Kind.FLOAT:
      argObj[name.value] = Number(value.value);
      break;
    case Kind.BOOLEAN:
      argObj[name.value] = value.value;
      break;
    case Kind.STRING:
    case Kind.ENUM:
      argObj[name.value] = value.value;
      break;
    case Kind.NULL:
      argObj[name.value] = null;
      break;
    case Kind.OBJECT: {
      const nestedArgObj = {};
      value.fields.forEach((obj) =>
        valueToObjectRepresentation(
          nestedArgObj,
          obj.name,
          obj.value,
          variables
        )
      );
      argObj[name.value] = nestedArgObj;
      break;
    }
    case Kind.VARIABLE:
      argObj[name.value] = (variables || {})[value.name.value];
      break;
    case Kind.LIST:
      argObj[name.value] = value.values.map((listValue) => {
        const nestedArgArrayObj = {};
        valueToObjectRepresentation(
          nestedArgArrayObj,
          name,
          listValue,
          variables
        );
        return (nestedArgArrayObj as any)[name.value];
      });
      break;
    default:
      throw new Error(
        `The inline argument "${name.value}" of kind "${
          (value as ValueNode).kind
        }" is not supported.`
      );
  }
}

export function argumentsObjectFromField(
  field: FieldNode,
  variables?: VariableMap
): {[argName: string]: any} | null {
  if (field.arguments && field.arguments.length > 0) {
    const argObj: {[argName: string]: any} = {};
    field.arguments.forEach(({name, value}: ArgumentNode) =>
      valueToObjectRepresentation(argObj, name, value, variables)
    );
    return argObj;
  }

  return null;
}

function isInclusionDirective({name: {value}}: DirectiveNode): boolean {
  return value === 'skip' || value === 'include';
}

type InclusionDirective = {directive: DirectiveNode; ifArgument: ArgumentNode};

function getInclusionDirectives(
  directives: ReadonlyArray<DirectiveNode>
): Array<InclusionDirective> {
  const result: Array<InclusionDirective> = [];

  if (directives && directives.length > 0) {
    directives.forEach((directive) => {
      if (!isInclusionDirective(directive)) return;

      const directiveArguments = directive.arguments;
      const directiveName = directive.name.value;

      if (!directiveArguments || directiveArguments.length !== 1) {
        throw new Error(
          `Incorrect number of arguments for the @${directiveName} directive.`
        );
      }

      const ifArgument = directiveArguments[0];
      if (!ifArgument.name || ifArgument.name.value !== 'if') {
        throw new Error(
          `Invalid argument for the @${directiveName} directive.`
        );
      }

      const ifValue = ifArgument.value;
      if (
        !ifValue ||
        (ifValue.kind !== Kind.VARIABLE && ifValue.kind !== Kind.BOOLEAN)
      ) {
        throw new Error(
          `Argument for the @${directiveName} directive must be a variable or a boolean value.`
        );
      }

      result.push({directive, ifArgument});
    });
  }

  return result;
}

export function shouldInclude(
  {directives}: SelectionNode,
  variables?: VariableMap
): boolean {
  if (!directives || directives.length === 0) {
    return true;
  }

  return getInclusionDirectives(directives).every(({directive, ifArgument}) => {
    let evaledValue = false;

    if (ifArgument.value.kind === Kind.VARIABLE) {
      evaledValue = (variables || {})[ifArgument.value.name.value];
      if (evaledValue === undefined) {
        throw new Error(
          `Invalid variable referenced in @${directive.name.value} directive.`
        );
      }
    } else {
      // getInclusionDirectives guarantees a BooleanValue here.
      evaledValue = (ifArgument.value as BooleanValueNode).value;
    }

    return directive.name.value === 'skip' ? !evaledValue : evaledValue;
  });
}
