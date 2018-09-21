import * as validator from '../../src/structure.service';
import {
  expectPromiseRejection,
  joinClauseShouldnotBeInSchemaQueries,
  languageClauseShouldnotBeInSchemaQueries,
  selectKeyClauseMustHaveOnly2ItemsInSchemaQueries,
  selectValueClauseMustHaveCertainStructureInSchemaQueries
} from '../common';

describe('Schemas structure errors in query', () => {
  describe('should be produced only for \'select.key\' section', () => {
    it('when it is not array', async () => {
      const query = {
        select: {
          key: 'key',
          value: [ 'value' ]
        },
        from: 'concepts.schema'
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectKeyClauseMustHaveOnly2ItemsInSchemaQueries ]
      });
    });

    it('when it has 0 item', async () => {
      const query = {
        select: {
          key: [],
          value: [ 'value' ]
        },
        from: 'concepts.schema'
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectKeyClauseMustHaveOnly2ItemsInSchemaQueries ]
      });
    });

    it('when it has 1 item', async () => {
      const query = {
        select: {
          key: [ 'value' ],
          value: [ 'value' ]
        },
        from: 'concepts.schema'
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectKeyClauseMustHaveOnly2ItemsInSchemaQueries ]
      });
    });
  });

  describe('should be produced only for \'select.value\' section', () => {
    it('when it is not array or empty', async () => {
      const query = {
        select: {
          key: [ 'key', 'value' ],
          value: 'value'
        },
        from: 'concepts.schema'
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ selectValueClauseMustHaveCertainStructureInSchemaQueries ]
      });
    });
  });

  describe('should be produced only for \'language\' section', () => {
    it('when it is present', async () => {
      const query = {
        select: {
          key: [ 'key', 'value' ]
        },
        from: '*.schema',
        language: ''
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ languageClauseShouldnotBeInSchemaQueries ]
      });
    });
  });

  describe('should be produced only for \'join\' section', () => {
    it('when it is present', async () => {
      const query = {
        select: {
          key: [ 'key', 'value' ]
        },
        from: 'concepts.schema',
        join: ''
      };

      await expectPromiseRejection({
        promiseFunction: validator.validateQueryStructure,
        args: [ query ],
        expectedErrors: [ joinClauseShouldnotBeInSchemaQueries ]
      });
    });
  });
});
