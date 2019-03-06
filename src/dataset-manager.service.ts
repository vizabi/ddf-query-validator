import * as isNil from 'lodash.isnil';
import * as includes from 'lodash.includes';
import * as get from 'lodash.get';
import { DEFAULT_REPOSITORY_BRANCH, DEFAULT_REPOSITORY_HASH, DEFAULT_REPOSITORY_NAME } from './helper.service';

export function getRepositoryPath(basePath, queryParam) {
  const {
    dataset,
    branch,
    commit
  } = queryParam;
  return `${basePath}${dataset}/${branch}/${commit}`;
}

export function getFilePath(repositoryPath, filePath = 'datapackage.json'): string {
  return `${repositoryPath}/${filePath}`;
}

export interface IReposConfig {
  repositoryDescriptors;
  defaultRepository?: string;
  defaultRepositoryCommit?: string;
  defaultRepositoryBranch?: string;
}

export interface IQueryRepoDescriptor {
  dataset: string;
  branch: string;
  commit: string;
  isDefaultBranch: boolean;
  isDefaultCommit: boolean;
}

export function extendQueryWithRepository(queryParam, config: IReposConfig = {repositoryDescriptors: {}}): Error | IQueryRepoDescriptor {
  // TODO: refactor unit tests
  // const REPOSITORY_DESCRIPTORS = get(config, 'repositoryDescriptors', {[DEFAULT_REPOSITORY]: {[DEFAULT_BRANCH]: [DEFAULT_HASH]}});
  const REPOSITORY_DESCRIPTORS = get(config, 'repositoryDescriptors', {});
  const IS_DEFAULT_DATASET = isNil(queryParam.dataset);

  if (!IS_DEFAULT_DATASET) {
    // Check if in dataset was given branch
    const [ originDataset, originBranch ] = queryParam.dataset.split('#');
    if (!queryParam.branch && originBranch) {
      queryParam.branch = originBranch;
      queryParam.dataset = originDataset;
    }
  }

  const IS_DEFAULT_BRANCH = isNil(queryParam.branch) || queryParam.branch === config.defaultRepositoryBranch;
  const IS_DEFAULT_COMMIT = isNil(queryParam.commit) || queryParam.commit === config.defaultRepositoryCommit;

  const {
    dataset = get(config, 'defaultRepository', DEFAULT_REPOSITORY_NAME),
    branch = get(config, 'defaultRepositoryBranch', DEFAULT_REPOSITORY_BRANCH)
  } = queryParam;

  if (isNil(REPOSITORY_DESCRIPTORS[ dataset ])) {
    throw new Error(`No ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
  }

  if (isNil(REPOSITORY_DESCRIPTORS[ dataset ][ branch ])) {
    throw new Error(`No ${printBranch(branch, IS_DEFAULT_BRANCH)} in ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
  }

  // We never know what the hash is the HEAD on a branch, so if we don't have a commit or it equals `HEAD` in a request,
  // it means we have to use the first hash in config (the HEAD commit will ALWAYS be on the first place)
  if (queryParam.commit === 'HEAD') {
    queryParam.commit = get(REPOSITORY_DESCRIPTORS, `${dataset}.${branch}.0`) || get(config, 'defaultRepositoryCommit', DEFAULT_REPOSITORY_HASH);
  }

  const {
    commit = get(REPOSITORY_DESCRIPTORS, `${dataset}.${branch}.0`) || get(config, 'defaultRepositoryCommit', DEFAULT_REPOSITORY_HASH)
  } = queryParam;

  if (!includes(REPOSITORY_DESCRIPTORS[ dataset ][ branch ], commit)) {
    throw new Error(`No ${printCommit(commit, IS_DEFAULT_COMMIT)} in ${printDefault(IS_DEFAULT_BRANCH)}branch '${branch}' in ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
  }

  const repositoryPath = getRepositoryPath('', { dataset, branch, commit });

  Object.assign(queryParam, { repositoryPath });

  return {dataset, branch, commit, isDefaultBranch: IS_DEFAULT_BRANCH, isDefaultCommit: IS_DEFAULT_COMMIT};
}

function printDefault(isSomethingTrue) {
  return isSomethingTrue ? 'default ' : '';
}

function printDataset(dataset, IS_DEFAULT_DATASET) {
  return `${printDefault(IS_DEFAULT_DATASET)}dataset '${dataset}'`;
}

function printBranch(branch, IS_DEFAULT_BRANCH) {
  return `${printDefault(IS_DEFAULT_BRANCH)}branch '${branch}'`;
}

function printCommit(commit, IS_DEFAULT_COMMIT) {
  return `${printDefault(IS_DEFAULT_COMMIT)}commit '${commit}'`;
}
