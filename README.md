# graphql-filter-fragment

Filters a data structure by a GraphQL fragment.

## Example

```js
import {filterGraphQlFragment} from 'graphql-filter-fragment';
import {gql} from '@apollo/client/core';

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
```

## Why?

This utility function is helpful to [remove read-only fields before mutations](https://stackoverflow.com/questions/42631523/remove-read-only-fields-before-mutation-in-graphql?noredirect=1&lq=1) if the data was fetched previously.

## Credits

All credit goes to the [`graphql-anywhere` package](https://www.npmjs.com/package/graphql-anywhere) which is unfortunately not maintained anymore and the utilities no longer included in recent `@apollo/client` versions. The code in this repo is a direct copy-paste from the original code with an updated peer dependency version of `graphql`.
