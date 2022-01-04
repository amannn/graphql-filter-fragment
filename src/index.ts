import {DocumentNode} from 'graphql';
import {graphql} from './graphql';

export default function filterGraphQlFragment(
  doc: DocumentNode,
  data: any
): any {
  function resolver(_: string, root: any, __: any, ___: any, info: any) {
    return root[info.resultKey];
  }

  return graphql(resolver, doc, data);
}
