import {gql} from '@apollo/client/core';
import filterGraphQlFragment from '../src';

it('removes unwanted properties', () => {
  const result = filterGraphQlFragment(
    gql`
      fragment museum on Museum {
        name
        address {
          city
        }
      }
    `,
    {
      name: 'Museum of Popular Culture',
      address: {
        street: '325 5th Ave N',
        city: 'Seattle'
      }
    }
  );

  expect(result).toEqual({
    name: 'Museum of Popular Culture',
    address: {
      city: 'Seattle'
    }
  });
});

it('considers a nested fragment', () => {
  const result = filterGraphQlFragment(
    gql`
      fragment MainFragment on Entity {
        ...NestedFragment
        items {
          operation
        }
      }

      fragment NestedFragment on Entity {
        items {
          id
        }
      }
    `,
    {
      items: [
        {
          id: '2',
          operation: 'add',
          versionNumber: undefined
        }
      ]
    }
  );

  expect(result).toEqual({
    items: [{id: '2', operation: 'add'}]
  });
});
