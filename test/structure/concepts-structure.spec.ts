import * as chai from 'chai';
import * as validator from '../../src/structure.service';
import {
  BASE_PATH,
  EXPECTS_EXACTLY_ONE_ERROR,
  EXPECTS_EXACTLY_TWO_ERRORS,
  getAmountOfErrors,
  GLOBALIS_PATH,
  joinClauseShouldnotBeInSchemaQueries,
  notExpectedError,
  selectClauseMustHaveStructure,
  selectKeyClauseMustHaveOnly1Item,
  selectValueClauseMustHaveCertainStructure
} from '../common';

const expect = chai.expect;

describe('Concepts structure errors in query', () => {
  describe('should be produced only for \'select.key\' section', () => {
    it('when it is not array', async () => {
      try {
        const query = {
          select: {
            key: 'concept',
            value: [ 'concept_type', 'name', 'description' ]
          },
          from: 'concepts'
        };
        await validator.validateQueryStructure(query);

        throw new Error(notExpectedError);
      } catch(error) {
        expect(error.toString()).to.be.not.equal(notExpectedError);
        expect(getAmountOfErrors(error)).to.equals(EXPECTS_EXACTLY_TWO_ERRORS);
        expect(error.toString()).to.match(selectClauseMustHaveStructure);
        expect(error.toString()).to.match(selectKeyClauseMustHaveOnly1Item);
      }
    });

    it('when it has 0 item', async () => {
      try {
        const query = {
          select: {
            key: [],
            value: [ 'concept_type', 'name', 'description' ]
          },
          from: 'concepts'
        };
        await validator.validateQueryStructure(query);

        throw new Error(notExpectedError);
      } catch(error) {
        expect(error.toString()).to.be.not.equal(notExpectedError);
        expect(getAmountOfErrors(error)).to.equals(EXPECTS_EXACTLY_ONE_ERROR);
        expect(error.toString()).to.match(selectKeyClauseMustHaveOnly1Item);
      }
    });

    it('when it has 2 items', async () => {
      try {
        const query = {
          select: {
            key: [ 'concept', 'un_state' ],
            value: [ 'concept_type', 'name', 'description' ]
          },
          from: 'concepts'
        };
        await validator.validateQueryStructure(query);

        throw new Error(notExpectedError);
      } catch(error) {
        expect(error.toString()).to.be.not.equal(notExpectedError);
        expect(getAmountOfErrors(error)).to.equals(EXPECTS_EXACTLY_ONE_ERROR);
        expect(error.toString()).to.match(selectKeyClauseMustHaveOnly1Item);
      }
    });
  });

  describe('should be produced only for \'select.value\' section', () => {
    it('when it is not array or empty', async () => {
      try {
        const query = {
          select: {
            key: [ 'concept' ],
            value: 'concept_type'
          },
          from: 'concepts'
        };
        await validator.validateQueryStructure(query);

        throw new Error(notExpectedError);
      } catch(error) {
        expect(error.toString()).to.be.not.equal(notExpectedError);
        expect(getAmountOfErrors(error)).to.equals(EXPECTS_EXACTLY_ONE_ERROR);
        expect(error.toString()).to.match(selectValueClauseMustHaveCertainStructure);
      }
    });
  });

  describe('should be produced only for \'join\' section', () => {
    it('when it is present', async () => {
      try {
        const query = {
          select: {
            key: [ 'key', 'value' ]
          },
          from: 'concepts.schema',
          join: ''
        };
        await validator.validateQueryStructure(query);

        throw new Error(notExpectedError);
      } catch(error) {
        expect(error.toString()).to.be.not.equal(notExpectedError);
        expect(getAmountOfErrors(error)).to.equals(EXPECTS_EXACTLY_ONE_ERROR);
        expect(error.toString()).to.match(joinClauseShouldnotBeInSchemaQueries);
      }
    });
  });
});
