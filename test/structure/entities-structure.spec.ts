import * as chai from 'chai';
import * as validator from '../../src/structure.service';
import {
  expectPromiseRejection,
  selectClauseMustHaveStructure,
  selectKeyClauseMustHaveOnly1Item,
  selectValueClauseMustHaveCertainStructure
} from '../common';

const expect = chai.expect;

describe('Entities structure errors in query', () => {
  describe('should be produced only for \'select.key\' section', () => {
    it('when it is not array', async () => {
      const query = {
        select: {
          key: 'country',
          value: [ 'world_4region' ]
        },
        from: 'entities'
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectClauseMustHaveStructure, selectKeyClauseMustHaveOnly1Item ]
      });
    });

    it('when it has 0 item', async () => {
      const query = {
        select: {
          key: [],
          value: [ 'world_4region' ]
        },
        from: 'entities'
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectKeyClauseMustHaveOnly1Item ]
      });
    });

    it('when it has 2 items', async () => {
      const query = {
        select: {
          key: [ 'country', 'un_state' ],
          value: [ 'world_4region' ]
        },
        from: 'entities'
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectKeyClauseMustHaveOnly1Item ]
      });
    });
  });

  describe('should be produced only for \'select.value\' section', () => {
    it('when it is not array or empty', async () => {
      const query = {
        language: 'ar-SA',
        select: {
          key: [ 'country' ],
          value: 'world_4region'
        },
        from: 'entities',
        where: {
          $and: [
            { country: { $in: [ 'usa', 'dza', 'abkh', 'afg' ] } }
          ]
        }
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectValueClauseMustHaveCertainStructure ]
      });
    });
  });
});
