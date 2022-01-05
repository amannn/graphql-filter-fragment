import {DocumentNode} from 'graphql';
import {graphql, VariableMap, ExecInfo, ExecContext} from './graphql';

export default function filterGraphQlFragment<FD = any, D extends FD = any>(
  doc: DocumentNode,
  data: D,
  variableValues: VariableMap = {}
): FD {
  if (data === null) return data;

  function resolver(
    _: string,
    root: any,
    __: any,
    ___: ExecContext,
    info: ExecInfo
  ) {
    return root[info.resultKey];
  }

  return Array.isArray(data)
    ? data.map((dataObj) =>
        graphql(resolver, doc, dataObj, null, variableValues)
      )
    : graphql(resolver, doc, data, null, variableValues);
}
