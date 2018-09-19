"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isNil = require("lodash.isnil");
const includes = require("lodash.includes");
const get = require("lodash.get");
const helper_service_1 = require("./helper.service");
function getRepositoryPath(basePath, queryParam) {
    const { dataset, branch, commit } = queryParam;
    return `${basePath}${dataset}/${branch}-${commit}`;
}
exports.getRepositoryPath = getRepositoryPath;
function getFilePath(repositoryPath, filePath = 'datapackage.json') {
    return `${repositoryPath}/${filePath}`;
}
exports.getFilePath = getFilePath;
function extendQueryWithRepository(queryParam, config = {}) {
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
    const { dataset = get(config, 'defaultRepository', helper_service_1.DEFAULT_REPOSITORY_NAME), branch = get(config, 'defaultRepositoryBranch', helper_service_1.DEFAULT_REPOSITORY_BRANCH), commit = get(config, 'defaultRepositoryCommit', helper_service_1.DEFAULT_REPOSITORY_HASH) } = queryParam;
    if (isNil(REPOSITORY_DESCRIPTORS[dataset])) {
        throw new Error(`No ${IS_DEFAULT_DATASET}dataset '${dataset}' was found`);
    }
    if (isNil(REPOSITORY_DESCRIPTORS[dataset][branch])) {
        throw new Error(`No ${IS_DEFAULT_BRANCH}branch '${branch}' in ${IS_DEFAULT_DATASET}dataset '${dataset}' was found`);
    }
    if (!includes(REPOSITORY_DESCRIPTORS[dataset][branch], commit)) {
        throw new Error(`No ${IS_DEFAULT_COMMIT}commit '${commit}' in ${IS_DEFAULT_BRANCH}branch '${branch}' in ${IS_DEFAULT_DATASET}dataset '${dataset}' was found`);
    }
    const repositoryPath = getRepositoryPath('', { dataset, branch, commit });
    Object.assign(queryParam, { repositoryPath });
}
exports.extendQueryWithRepository = extendQueryWithRepository;
//# sourceMappingURL=dataset-manager.service.js.map