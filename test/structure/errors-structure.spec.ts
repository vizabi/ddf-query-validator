import * as chai from 'chai';
import * as cloneDeep from 'lodash.clonedeep';
import * as validator from '../../src/structure.service';
import {
  expectPromiseRejection,
  fromClauseCouldnotBeEmpty,
  fromClauseMustBeString,
  fromClauseValueMustBeAllowed,
  joinClauseMustBeObject,
  joinKeyClauseMustBeString,
  joinWhereClauseHasUnknownOperator,
  joinWhereClauseMustBeObject,
  languageClauseMustBeString,
  orderByClauseMustHaveCertainStructure,
  selectClauseCouldnotBeEmpty,
  selectClauseMustHaveStructure,
  selectKeyClauseMustHaveAtLeast2Items,
  selectValueClauseMustHaveAtLeast1Item,
  whereClauseHasUnknownOperator,
  whereClauseMustBeObject,
} from '../common';
import { CONCEPTS, DATAPOINTS, ENTITIES } from '../../src/helper.service';

const expect = chai.expect;

describe('General structure errors in query', () => {

  describe('should be produced only for \'from\' section', () => {
    it('when query is empty', async () => {
      const query = {};

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ fromClauseCouldnotBeEmpty, fromClauseMustBeString, fromClauseValueMustBeAllowed, selectClauseCouldnotBeEmpty ]
      });
    });

    it('when section \'from\' is absent', async () => {
      const query = { select: { key: [ 'geo', 'time' ], value: [ 'population_total' ] } };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ fromClauseCouldnotBeEmpty, fromClauseMustBeString, fromClauseValueMustBeAllowed ]
      });
    });

    it('when section \'from\' is object', async () => {
      const query = { from: {}, select: { key: [ 'geo', 'time' ], value: [ 'population_total' ] } };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ fromClauseMustBeString, fromClauseValueMustBeAllowed ]
      });
    });

    it('when section \'from\' doesn\'t have available value', async () => {
      const query = { from: 'fail', select: { key: [ 'geo', 'time' ], value: [ 'population_total' ] } };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ fromClauseValueMustBeAllowed ]
      });
    });
  });

  describe('should be produced only for \'select\' section', () => {
    it('when it is absent', async () => {
      const query = { from: 'datapoints' };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectClauseCouldnotBeEmpty, selectClauseMustHaveStructure, selectKeyClauseMustHaveAtLeast2Items, selectValueClauseMustHaveAtLeast1Item ]
      });
    });

    it('when it is empty', async () => {
      const query = { from: 'datapoints', select: {} };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectClauseMustHaveStructure, selectKeyClauseMustHaveAtLeast2Items, selectValueClauseMustHaveAtLeast1Item ]
      });
    });

    it('when it is not object', async () => {
      const query = { from: 'datapoints', select: 'fail' };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectClauseMustHaveStructure, selectKeyClauseMustHaveAtLeast2Items, selectValueClauseMustHaveAtLeast1Item ]
      });
    });
  });

  describe('should be produced only for \'language\' section', () => {
    it('when it is not string for \'concepts\'', async () => {
      const FIXTURE_GENERIC_QUERY = { select: { key: [ 'concept' ] }, from: CONCEPTS };
      const query = Object.assign({ language: [] }, cloneDeep(FIXTURE_GENERIC_QUERY));

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ languageClauseMustBeString ]
      });
    });

    it('when it is not string for \'entities\'', async () => {
      const FIXTURE_GENERIC_QUERY = {
        select: {
          key: [ 'country' ],
          value: [ 'world_6region', 'world_6region', 'landlocked' ]
        }, from: ENTITIES
      };

      const query = Object.assign({ language: [] }, cloneDeep(FIXTURE_GENERIC_QUERY));

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ languageClauseMustBeString ]
      });
    });

    it('when it is not string for \'datapoints\'', async () => {
      const FIXTURE_GENERIC_QUERY = {
        select: { key: [ 'geo', 'time' ], value: [ 'population_total' ] },
        from: DATAPOINTS
      };

      const query = Object.assign({ language: [] }, cloneDeep(FIXTURE_GENERIC_QUERY));

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ languageClauseMustBeString ]
      });
    });
  });

  describe('should be produced only for \'join\' section and for \'entities\'', () => {
    const FIXTURE_GENERIC_QUERY = {
      select: {
        key: [ 'country' ],
        value: [ 'world_6region', 'world_6region', 'landlocked' ]
      }, from: ENTITIES
    };

    it('when it is not object', async () => {
      const query = Object.assign({ join: [] }, cloneDeep(FIXTURE_GENERIC_QUERY));

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinClauseMustBeObject ]
      });
    });

    xit('when `join.$world_6region.where` clause is not object', async () => {
      const FIXTURE_SUBQUERY = {
        where: { world_6region: '$test' },
        join: { $test: { key: 'world_6region', where: '' } }
      };

      const query = Object.assign(cloneDeep(FIXTURE_GENERIC_QUERY), FIXTURE_SUBQUERY);

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinWhereClauseMustBeObject ]
      });
    });

    xit('when it has not allowed operator in `join.$world_6region.where` clause', async () => {
      const FIXTURE_SUBQUERY = {
        where: { world_6region: '$test' },
        join: { $geo: { key: 'country', where: {} }, $test: { key: 'world_6region', where: { $geo: 'country' } } }
      };

      const query = Object.assign(cloneDeep(FIXTURE_GENERIC_QUERY), FIXTURE_SUBQUERY);

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinWhereClauseHasUnknownOperator ]
      });
    });

    xit('when it has not allowed link to another join section in `join.$test.where` clause', async () => {
      const FIXTURE_SUBQUERY = {
        where: { world_6region: '$test' },
        join: { $geo: { key: 'country', where: {} }, $test: { key: 'world_6region', where: { country: '$geo' } } }
      };

      const query = Object.assign(cloneDeep(FIXTURE_GENERIC_QUERY), FIXTURE_SUBQUERY);

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinWhereClauseHasUnknownOperator ]
      });
    });

    xit('when `join.$test.key` clause is not string', async () => {
      const FIXTURE_SUBQUERY = { where: { world_6region: '$test' }, join: { $test: { key: {}, where: {} } } };

      const query = Object.assign(cloneDeep(FIXTURE_GENERIC_QUERY), FIXTURE_SUBQUERY);

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinKeyClauseMustBeString ]
      });
    });
  });

  describe('should be produced only for \'join\' section and for \'datapoints\'', () => {
    const FIXTURE_GENERIC_QUERY = {
      select: { key: [ 'geo', 'time' ], value: [ 'population_total' ] },
      from: DATAPOINTS
    };

    it('when it is not object', async () => {
      const FIXTURE_SUBQUERY = { join: [] };

      const query = Object.assign(FIXTURE_SUBQUERY, cloneDeep(FIXTURE_GENERIC_QUERY));

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinClauseMustBeObject ]
      });
    });

    xit('when `join.$world_6region.where` clause is not object', async () => {
      const FIXTURE_SUBQUERY = { where: { geo: '$test' }, join: { $test: { key: 'country', where: '' } } };

      const query = Object.assign(cloneDeep(FIXTURE_GENERIC_QUERY), FIXTURE_SUBQUERY);

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinWhereClauseMustBeObject ]
      });
    });

    xit('when it has not allowed operator in `join.$world_6region.where` clause', async () => {
      const FIXTURE_SUBQUERY = {
        where: { geo: '$test' },
        join: { $geo: { key: 'country', where: {} }, $test: { key: 'country', where: { $geo: 'usa' } } }
      };

      const query = Object.assign(cloneDeep(FIXTURE_GENERIC_QUERY), FIXTURE_SUBQUERY);

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinWhereClauseHasUnknownOperator ]
      });
    });

    xit('when it has not allowed link to another join section in `join.$test.where` clause', async () => {
      const FIXTURE_SUBQUERY = {
        where: { geo: '$test' },
        join: { $geo: { key: 'country', where: {} }, $test: { key: 'country', where: { country: '$geo' } } }
      };

      const query = Object.assign(cloneDeep(FIXTURE_GENERIC_QUERY), FIXTURE_SUBQUERY);

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinWhereClauseHasUnknownOperator ]
      });
    });

    xit('when `join.$test.key` clause is not string', async () => {
      const FIXTURE_SUBQUERY = { where: { country: '$test' }, join: { $test: { key: {}, where: {} } } };

      const query = Object.assign(cloneDeep(FIXTURE_GENERIC_QUERY), FIXTURE_SUBQUERY);

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinKeyClauseMustBeString ]
      });
    });
  });

  describe('should be produced only for \'where\' section', () => {
    it('when it is not object', async () => {
      const query = { where: [], select: { key: [ 'concept' ] }, from: 'concepts' };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ whereClauseMustBeObject ]
      });
    });

    xit('when it has not allowed operator (even if it is present in \'join\' clause)', async () => {
      const query = {
        where: { $geo: { $eq: 'usa' } },
        select: { key: [ 'country' ] },
        from: 'entities',
        join: { $geo: {} }
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ whereClauseHasUnknownOperator ]
      });
    });

    xit(`when it has not allowed operator (which is absent in 'join' clause)`, async () => {
      const query = {
        select: {
          key: [ 'geo', 'time' ],
          value: [
            'life_expectancy_years', 'population_total'
          ]
        },
        from: 'datapoints',
        where: {
          $and: [
            { time: '$time' },
            {
              $or: [
                { population_total: { $gt: 10000 }, geo: '$geo' },
                { life_expectancy_years: { $gt: 30, $lt: 70 } }
              ]
            }
          ]
        },
        join: {
          $time: {
            key: 'time',
            where: { $and: [ { time: { $gt: '1990', $lte: '2015' } } ] }
          }
        },
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ whereClauseHasUnknownOperator ]
      });
    });

    it(`when it has not allowed operator (and 'join' clause is absent)`, async () => {
      const query = {
        select: { key: [ 'geo', 'time' ], value: [ 'population_total' ] },
        from: 'datapoints',
        where: { $geo: { $eq: 'usa' } }
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ whereClauseHasUnknownOperator ]
      });
    });
  });

  describe('should be produced only for \'order_by\' section', () => {
    it('when it is not string or array of strings or array of objects', async () => {
      const query = { order_by: {}, select: { key: [ 'concept' ] }, from: 'concepts' };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ orderByClauseMustHaveCertainStructure ]
      });
    });
  });

});
