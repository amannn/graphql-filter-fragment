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
