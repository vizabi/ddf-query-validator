import * as isNil from 'lodash.isnil';
import * as includes from 'lodash.includes';
import * as get from 'lodash.get';
import { DEFAULT_REPOSITORY_BRANCH, DEFAULT_REPOSITORY_HASH, DEFAULT_REPOSITORY_NAME } from './helper.service';

export function getRepositoryPath (basePath, queryParam) {
  const {
    dataset,
    branch,
    commit
  } = queryParam;
  return `${basePath}${dataset}/${branch}-${commit}`;
}

export function getFilePath (repositoryPath, filePath = 'datapackage.json'): string {
  return `${repositoryPath}/${filePath}`;
}

export function extendQueryWithRepository (queryParam, config = {}): Error | void {
  // TODO: refactor unit tests
  // const REPOSITORY_DESCRIPTORS = get(config, 'repositoryDescriptors', {[DEFAULT_REPOSITORY]: {[DEFAULT_BRANCH]: [DEFAULT_HASH]}});
  const REPOSITORY_DESCRIPTORS = get(config, 'repositoryDescriptors', {});
  const IS_DEFAULT_DATASET = isNil(queryParam.dataset) ? 'default ' : '';

  if (!IS_DEFAULT_DATASET) {
    const [originDataset, originBranch] = queryParam.dataset.split('#');
    if (!queryParam.branch && originBranch) {
      queryParam.branch = originBranch;
      queryParam.dataset = originDataset;
    }
  }

  const IS_DEFAULT_BRANCH = isNil(queryParam.branch) ? 'default ' : '';
  const IS_DEFAULT_COMMIT = isNil(queryParam.commit) ? 'default ' : '';

  const {
    dataset = get(config, 'defaultRepository', DEFAULT_REPOSITORY_NAME),
    branch = get(config, 'defaultRepositoryBranch', DEFAULT_REPOSITORY_BRANCH),
    commit = get(config, 'defaultRepositoryCommit', DEFAULT_REPOSITORY_HASH)
  } = queryParam;

  if (isNil(REPOSITORY_DESCRIPTORS[ dataset ])) {
    throw new Error(`No ${IS_DEFAULT_DATASET}dataset '${dataset}' was found`);
  }

  if (isNil(REPOSITORY_DESCRIPTORS[ dataset ][ branch ])) {
    throw new Error(`No ${IS_DEFAULT_BRANCH}branch '${branch}' in ${IS_DEFAULT_DATASET}dataset '${dataset}' was found`);
  }

  if (!includes(REPOSITORY_DESCRIPTORS[ dataset ][ branch ], commit)) {
    throw new Error(`No ${IS_DEFAULT_COMMIT}commit '${commit}' in ${IS_DEFAULT_BRANCH}branch '${branch}' in ${IS_DEFAULT_DATASET}dataset '${dataset}' was found`);
  }

  const repositoryPath = getRepositoryPath('', { dataset, branch, commit });

  Object.assign(queryParam, { repositoryPath });
}
