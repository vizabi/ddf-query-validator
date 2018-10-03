import {
  EXISTED_BRANCH,
  EXISTED_COMMIT,
  EXISTED_DATASET,
  NOT_EXISTED_BRANCH,
  NOT_EXISTED_COMMIT,
  NOT_EXISTED_DATASET
} from '../common';
import * as datasetManager from '../../src/dataset-manager.service';
import * as chai from 'chai';
import * as cloneDeep from 'lodash.clonedeep';
import * as set from 'lodash.set';
import { DEFAULT_REPOSITORY_BRANCH, DEFAULT_REPOSITORY_HASH, DEFAULT_REPOSITORY_NAME } from '../../src/helper.service';

const expect = chai.expect;

const query = {
  language: 'ru-ru',
  select: {
    key: [ 'project' ],
    value: [ 'name' ]
  },
  from: 'entities'
};

const IS_DEFAULT_STATE = true;
const IS_EXISTED_STATE = true;

const DATASET_STATES = [
  [ IS_DEFAULT_STATE, !IS_EXISTED_STATE ],
  [ IS_DEFAULT_STATE, IS_EXISTED_STATE ],
  [ !IS_DEFAULT_STATE, !IS_EXISTED_STATE ],
  [ !IS_DEFAULT_STATE, IS_EXISTED_STATE ]
];

const BRANCH_STATES = [
  [ IS_DEFAULT_STATE, !IS_EXISTED_STATE ],
  [ IS_DEFAULT_STATE, IS_EXISTED_STATE ],
  [ !IS_DEFAULT_STATE, !IS_EXISTED_STATE ],
  [ !IS_DEFAULT_STATE, IS_EXISTED_STATE ]
];

const COMMIT_STATES = [
  [ IS_DEFAULT_STATE, !IS_EXISTED_STATE ],
  [ IS_DEFAULT_STATE, IS_EXISTED_STATE ],
  [ !IS_DEFAULT_STATE, !IS_EXISTED_STATE ],
  [ !IS_DEFAULT_STATE, IS_EXISTED_STATE ]
];

describe('Availability of dataset&branch&commit', () => {
  let testIndex = 0;

  DATASET_STATES.forEach(dataset => {
    const [ IS_DEFAULT_DATASET, IS_EXISTED_DATASET ] = dataset;
    const EXPECTED_DATASET = IS_EXISTED_DATASET ? EXISTED_DATASET : NOT_EXISTED_DATASET;

    BRANCH_STATES.forEach(branches => {
      const [ IS_DEFAULT_BRANCH, IS_EXISTED_BRANCH ] = branches;
      const EXPECTED_BRANCH = IS_EXISTED_BRANCH ? EXISTED_BRANCH : NOT_EXISTED_BRANCH;

      describe(`Check ${IS_DEFAULT_DATASET ? 'default ' : ''}${EXPECTED_DATASET} ||| ${IS_DEFAULT_BRANCH ? 'default ' : ''}${EXPECTED_BRANCH}`, () => {
        COMMIT_STATES.forEach(commits => {
          const [ IS_DEFAULT_COMMIT, IS_EXISTED_COMMIT ] = commits;
          const EXPECTED_COMMIT = IS_EXISTED_COMMIT ? EXISTED_COMMIT : NOT_EXISTED_COMMIT;

          const subquery: { dataset?: string, branch?: string, commit?: string } = {};
          const defaultQuery: any = cloneDeep(query);
          const datasetsConfig = {};

          set(datasetsConfig, 'defaultRepository', IS_DEFAULT_DATASET ? EXPECTED_DATASET : 'no_matter_dataset');

          if (!IS_DEFAULT_DATASET) {
            subquery.dataset = EXPECTED_DATASET;
          }

          if (IS_EXISTED_DATASET) {
            set(datasetsConfig, `repositoryDescriptors.${EXPECTED_DATASET}`, {});
          }

          set(datasetsConfig, 'defaultRepositoryBranch', IS_DEFAULT_BRANCH ? EXPECTED_BRANCH : 'no_matter_branch');

          if (!IS_DEFAULT_BRANCH) {
            subquery.branch = EXPECTED_BRANCH;
          }

          if (IS_EXISTED_DATASET && IS_EXISTED_BRANCH) {
            set(datasetsConfig, `repositoryDescriptors.${EXPECTED_DATASET}.${EXPECTED_BRANCH}`, []);
          }

          set(datasetsConfig, 'defaultRepositoryCommit', IS_DEFAULT_COMMIT ? EXPECTED_COMMIT : 'no_matter_commit');

          if (!IS_DEFAULT_COMMIT) {
            subquery.commit = EXPECTED_COMMIT;
          }

          if (IS_EXISTED_DATASET && IS_EXISTED_BRANCH && IS_EXISTED_COMMIT) {
            set(datasetsConfig, `repositoryDescriptors.${EXPECTED_DATASET}.${EXPECTED_BRANCH}`, [ EXPECTED_COMMIT ]);
          }

          it(`#${++testIndex} Check query: ${JSON.stringify(subquery)}, when config: ${JSON.stringify(datasetsConfig)}`, async function() {
            const fullQuery = Object.assign(subquery, defaultQuery);

            try {
              datasetManager.extendQueryWithRepository(fullQuery, datasetsConfig);
            } catch (error) {
              expect(error.message, 'Failure happens somewhere outside dataset-manager service').to.not.contain('File reading error');

              expect(error.message).to.include(`dataset '${EXPECTED_DATASET}'`);
              if (!IS_DEFAULT_DATASET) {
                expect(error.message).to.not.include(`default dataset '${EXPECTED_DATASET}'`);
              }

              if (!IS_EXISTED_DATASET) {
                expect(error.message).to.include(EXPECTED_DATASET);
                expect(error.message).to.not.include(EXPECTED_BRANCH);
                expect(error.message).to.not.include(EXPECTED_COMMIT);
                return;
              }

              expect(error.message).to.include(`branch '${EXPECTED_BRANCH}'`);
              if (!IS_DEFAULT_BRANCH) {
                expect(error.message).to.not.include(`default branch '${EXPECTED_BRANCH}'`);
              }

              if (!IS_EXISTED_BRANCH) {
                expect(error.message).to.include(EXPECTED_DATASET);
                expect(error.message).to.include(EXPECTED_BRANCH);
                expect(error.message).to.not.include(EXPECTED_COMMIT);
                return;
              }

              expect(error.message).to.include(`commit '${EXPECTED_COMMIT}'`);
              if (!IS_DEFAULT_COMMIT) {
                expect(error.message).to.not.include(`default commit '${EXPECTED_COMMIT}'`);
              }

              if (!IS_EXISTED_COMMIT) {
                expect(error.message).to.include(EXPECTED_DATASET);
                expect(error.message).to.include(EXPECTED_BRANCH);
                expect(error.message).to.include(EXPECTED_COMMIT);
                return;
              }

              throw error;
            }

            expect(fullQuery.repositoryPath).to.equal(`${EXPECTED_DATASET}/${EXPECTED_BRANCH}/${EXPECTED_COMMIT}`);
          });
        });
      });
    });
  });
});
