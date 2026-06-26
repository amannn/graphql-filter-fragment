import {parse} from 'graphql';
import filterGraphQlFragment from '../src';

it('removes unwanted properties', () => {
  const result = filterGraphQlFragment(
    parse(`
      fragment museum on Museum {
        name
        address {
          city
        }
      }
    `),
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
    parse(`
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
    `),
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

it('considers an inline fragment', () => {
  const result = filterGraphQlFragment(
    parse(`
      fragment museum on Museum {
        name
        ... on Museum {
          address {
            city
          }
        }
      }
    `),
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

it('uses the field alias as the result key', () => {
  const result = filterGraphQlFragment(
    parse(`
      fragment museum on Museum {
        title: name
      }
    `),
    {
      title: 'Museum of Popular Culture'
    }
  );

  expect(result).toEqual({
    title: 'Museum of Popular Culture'
  });
});

it('respects the @include directive', () => {
  const document = parse(`
    fragment museum on Museum {
      name
      address @include(if: $withAddress) {
        city
      }
    }
  `);
  const data = {
    name: 'Museum of Popular Culture',
    address: {city: 'Seattle'}
  };

  expect(filterGraphQlFragment(document, data, {withAddress: true})).toEqual({
    name: 'Museum of Popular Culture',
    address: {city: 'Seattle'}
  });

  expect(filterGraphQlFragment(document, data, {withAddress: false})).toEqual({
    name: 'Museum of Popular Culture'
  });
});

it('respects the @skip directive', () => {
  const document = parse(`
    fragment museum on Museum {
      name
      address @skip(if: $hideAddress) {
        city
      }
    }
  `);
  const data = {
    name: 'Museum of Popular Culture',
    address: {city: 'Seattle'}
  };

  expect(filterGraphQlFragment(document, data, {hideAddress: true})).toEqual({
    name: 'Museum of Popular Culture'
  });

  expect(filterGraphQlFragment(document, data, {hideAddress: false})).toEqual({
    name: 'Museum of Popular Culture',
    address: {city: 'Seattle'}
  });
});
