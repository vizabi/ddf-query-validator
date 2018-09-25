import * as chai from 'chai';
import { featureDetectors } from '../src/features.service';

const expect = chai.expect;

describe('Features service', () => {
  it('query with $nin clause should be processed correctly', async () => {
    const conceptsLookup = require('./fixtures/pop-big.concepts-lookup.json');
    const query = {
      language: 'en',
      from: 'datapoints',
      animatable: 'year',
      select: {
        key: [
          'geo',
          'year',
          'age'
        ],
        value: [
          'population'
        ]
      },
      where: {
        $and: [
          {
            geo: '$geo'
          },
          {
            age: '$age'
          }
        ]
      },
      join: {
        $geo: {
          key: 'geo',
          where: {
            $and: [
              {
                $or: [
                  {
                    un_state: true
                  },
                  {
                    'is--global': true
                  },
                  {
                    'is--world_4region': true
                  }
                ]
              },
              {
                geo: {
                  $in: [
                    'world'
                  ]
                }
              }
            ]
          }
        },
        $age: {
          key: 'age',
          where: {
            age: {
              $nin: [
                '80plus',
                '100plus'
              ]
            }
          }
        }
      },
      order_by: [
        'year'
      ]
    };
    const conceptsLookupMap = new Map(conceptsLookup);
    const conjunctionPartFromWhereClauseCorrespondsToJoin = featureDetectors[1](query, conceptsLookupMap);

    expect(!!conjunctionPartFromWhereClauseCorrespondsToJoin).to.be.true;
  });
});
