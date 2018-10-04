"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isNil = require("lodash.isnil");
const includes = require("lodash.includes");
const get = require("lodash.get");
const helper_service_1 = require("./helper.service");
function getRepositoryPath(basePath, queryParam) {
    const { dataset, branch, commit } = queryParam;
    return `${basePath}${dataset}/${branch}/${commit}`;
}
exports.getRepositoryPath = getRepositoryPath;
function getFilePath(repositoryPath, filePath = 'datapackage.json') {
    return `${repositoryPath}/${filePath}`;
}
exports.getFilePath = getFilePath;
function extendQueryWithRepository(queryParam, config = {}) {
    const REPOSITORY_DESCRIPTORS = get(config, 'repositoryDescriptors', {});
    const IS_DEFAULT_DATASET = isNil(queryParam.dataset);
    if (!IS_DEFAULT_DATASET) {
        const [originDataset, originBranch] = queryParam.dataset.split('#');
        if (!queryParam.branch && originBranch) {
            queryParam.branch = originBranch;
            queryParam.dataset = originDataset;
        }
    }
    const IS_DEFAULT_BRANCH = isNil(queryParam.branch);
    const IS_DEFAULT_COMMIT = isNil(queryParam.commit);
    const { dataset = get(config, 'defaultRepository', helper_service_1.DEFAULT_REPOSITORY_NAME), branch = get(config, 'defaultRepositoryBranch', helper_service_1.DEFAULT_REPOSITORY_BRANCH) } = queryParam;
    if (isNil(REPOSITORY_DESCRIPTORS[dataset])) {
        throw new Error(`No ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
    }
    if (isNil(REPOSITORY_DESCRIPTORS[dataset][branch])) {
        throw new Error(`No ${printBranch(branch, IS_DEFAULT_BRANCH)} in ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
    }
    if (queryParam.commit === 'HEAD') {
        queryParam.commit = get(REPOSITORY_DESCRIPTORS, `${dataset}.${branch}.0`) || get(config, 'defaultRepositoryCommit', helper_service_1.DEFAULT_REPOSITORY_HASH);
    }
    const { commit = get(REPOSITORY_DESCRIPTORS, `${dataset}.${branch}.0`) || get(config, 'defaultRepositoryCommit', helper_service_1.DEFAULT_REPOSITORY_HASH) } = queryParam;
    if (!includes(REPOSITORY_DESCRIPTORS[dataset][branch], commit)) {
        throw new Error(`No ${printCommit(commit, IS_DEFAULT_COMMIT)} in ${printDefault(IS_DEFAULT_BRANCH)}branch '${branch}' in ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
    }
    const repositoryPath = getRepositoryPath('', { dataset, branch, commit });
    Object.assign(queryParam, { repositoryPath });
}
exports.extendQueryWithRepository = extendQueryWithRepository;
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
//# sourceMappingURL=dataset-manager.service.js.map