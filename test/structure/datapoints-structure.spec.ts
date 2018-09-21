import * as chai from 'chai';
import * as validator from '../../src/structure.service';
import {
  expectPromiseRejection,
  selectClauseMustHaveStructure,
  selectKeyClauseMustHaveAtLeast2Items,
  selectValueClauseMustHaveAtLeast1Item,
} from '../common';

const expect = chai.expect;

describe('Datapoints structure errors in query', () => {

  describe('should be produced only for \'select.key\' section', () => {
    it('when it is not array', async () => {
      const query = { from: 'datapoints', select: { key: 'fail', value: [ 'population_total' ] } };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectClauseMustHaveStructure ]
      });
    });

    it('when it has 0 item', async () => {
      const query = { from: 'datapoints', select: { key: [], value: [ 'population_total' ] } };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectKeyClauseMustHaveAtLeast2Items ]
      });
    });

    it('when it has 1 item', async () => {
      const query = { from: 'datapoints', select: { key: [ 'geo' ], value: [ 'population_total' ] } };
      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectKeyClauseMustHaveAtLeast2Items ]
      });
    });
  });

  describe('should be produced only for \'select.value\' section', () => {
    it('when it is absent', async () => {
      const query = { from: 'datapoints', select: { key: [ 'geo', 'time' ] } };
      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectClauseMustHaveStructure, selectValueClauseMustHaveAtLeast1Item ]
      });
    });

    it('when it is not array', async () => {
      const query = { from: 'datapoints', select: { key: [ 'geo', 'time' ], value: 'fail' } };
      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectClauseMustHaveStructure ]
      });
    });

    it('when it is empty', async () => {
      const query = { from: 'datapoints', select: { key: [ 'geo', 'time' ], value: [] } };
      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectValueClauseMustHaveAtLeast1Item ]
      });
    });
  });
});
