import * as chai from 'chai';
import * as _ from 'lodash';

const expect = chai.expect;

export const BASE_PATH = './test/fixtures/';
export const GLOBALIS_PATH = 'systema_globalis';

export const NOT_EXISTED_DATASET = 'unexisted_dataset';
export const EXISTED_DATASET = 'VS-work/dataset_name_1';

export const NOT_EXISTED_BRANCH = 'unexisted_branch';
export const EXISTED_BRANCH = 'master';

export const NOT_EXISTED_COMMIT = 'unexisted_commit';
export const EXISTED_COMMIT = 'existed_commit';

export const fromClauseCouldnotBeEmpty = new RegExp(`'from' clause couldn't be empty`);
export const fromClauseMustBeString = new RegExp(`'from' clause must be string only`);
export const fromClauseValueMustBeAllowed = new RegExp(`'from' clause must be one of the list: `);

export const selectClauseCouldnotBeEmpty = new RegExp(`'select' clause couldn't be empty`);
export const selectClauseMustHaveStructure = new RegExp(`'select' clause must have next structure: { key: \\[...\\], value: \\[...\\] }`);
export const selectKeyClauseMustHaveAtLeast2Items = new RegExp(`'select.key' clause for '[\\w\\.]*' queries must have at least 2 items`);
export const selectKeyClauseContainsUnavailableItems = new RegExp(`'select.key' clause for '[\\w\\.]*' query contains unavailable item\\(s\\): failed_concept`);
export const selectValueClauseMustHaveAtLeast1Item = new RegExp(`'select.value' clause for '[\\w\\.]*' queries must have at least 1 item`);
export const selectValueClauseContainsUnavailableItems = new RegExp(`'select.value' clause for '[\\w\\.]*' query contains unavailable item\\(s\\): failed_measure`);
export const selectValueClauseContainsUnavailableItems1 = new RegExp(`'select.value' clause for '[\\w\\.]*' query contains unavailable item\\(s\\): failed_concept, failed_concept2`);
export const selectValueClauseContainsUnavailableItems2 = new RegExp(`'select.value' clause for '[\\w\\.]*' query contains unavailable item\\(s\\): failed_concept, failed_concept2, concept`);
export const selectKeyClauseMustHaveOnly1Item = new RegExp(`'select.key' clause for '[\\w\\.]*' queries must have only 1 item`);
export const selectKeyClauseMustHaveOnly2ItemsInSchemaQueries = new RegExp(`'select.key' clause for '[\\w\\*]*.schema' queries must have exactly 2 items: 'key', 'value'`);
export const selectValueClauseMustHaveCertainStructure = new RegExp(`'select.value' clause for '[\\w\\.]*' queries should be array of strings or empty`);
export const selectValueClauseMustHaveCertainStructureInSchemaQueries = new RegExp(`'select.value' clause for '[\\w\\*]*.schema' queries should be array of strings or empty`);
export const joinClauseShouldnotBeInSchemaQueries = new RegExp(`'join' clause for '[\\w\\*]*.schema' queries shouldn't be present in query`);
export const languageClauseShouldnotBeInSchemaQueries = new RegExp(`'language' clause for '\[\\w\\*\]*.schema' queries shouldn't be present in query`);

export const languageClauseMustBeString = new RegExp(`'language' clause must be string only`);
export const joinClauseMustBeObject = new RegExp(`'join' clause must be object only`);
export const whereClauseMustBeObject = new RegExp(`'where' clause must be object only`);
export const joinWhereClauseMustBeObject = new RegExp(`'join.\\$test.where' clause must be object only`);
export const joinKeyClauseMustBeString = new RegExp(`'join.\\$test.key' clause must be string only`);
export const orderByClauseMustHaveCertainStructure = new RegExp(`'order_by' clause must be string or array of strings \\|\\| objects only`);

export const whereClauseHasUnknownOperator = new RegExp(`'where' clause has unknown operator\\(s\\) '\\$geo'\, replace it with allowed operators: `);
export const joinWhereClauseHasUnknownOperator = new RegExp(`'join\.\\$test\.where' clause has unknown operator\\(s\\) '\\$geo'\, replace it with allowed operators: `);

export const tooManyQueryDefinitionErrors = new RegExp(`Too many query definition errors \\[repo: test/fixtures/systema_globalis/master-HEAD\\]`);
export const notExpectedError = 'This should never be called.';

export const expectPromiseRejection = async (options: { promiseFunction: any, args: any, expectedErrors: RegExp[], type?: string }) => {
  let actualErrors;

  const {
    promiseFunction,
    args,
    expectedErrors,
    type = 'structure'
  } = options;

  const expErrsStr = _.chain(expectedErrors)
    .map((item) => item.toString())
    .uniq()
    .value();

  if (expErrsStr.length < expectedErrors.length) {
    throw new Error(`Only unique errors should be checked: ${expectedErrors}`);
  }

  try {
    await promiseFunction(...args);
    throw new Error(notExpectedError);
  } catch (error) {
    actualErrors = error.toString();
  } finally {
    if (type === 'definitions') {
      expect(actualErrors).to.match(tooManyQueryDefinitionErrors);
    }

    expect(actualErrors).to.not.equal(notExpectedError);
    expect(getAmountOfErrors(actualErrors)).to.equals(expectedErrors.length);
    for (const expectedError of expectedErrors) {
      expect(actualErrors).to.match(expectedError);
    }
  }
};


export const EXPECTS_EXACTLY_ONE_ERROR = 1;
export const EXPECTS_EXACTLY_TWO_ERRORS = 2;

export const getAmountOfErrors = (error) => {
  return error.toString().split('\n*').length - 1;
};
