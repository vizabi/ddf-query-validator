"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepositoryPath = getRepositoryPath;
exports.getFilePath = getFilePath;
exports.extendQueryWithRepository = extendQueryWithRepository;
const isNil_1 = require("lodash-es/isNil");
const includes_1 = require("lodash-es/includes");
const get_1 = require("lodash-es/get");
const helper_service_1 = require("./helper.service");
function getRepositoryPath(basePath, queryParam) {
    const { dataset, branch, commit } = queryParam;
    return `${basePath}${dataset}/${branch}/${commit}`;
}
function getFilePath(repositoryPath, filePath = 'datapackage.json') {
    return `${repositoryPath}/${filePath}`;
}
function extendQueryWithRepository(queryParam, config = { repositoryDescriptors: {} }) {
    const REPOSITORY_DESCRIPTORS = (0, get_1.default)(config, 'repositoryDescriptors', {});
    const IS_DEFAULT_DATASET = (0, isNil_1.default)(queryParam.dataset);
    if (!IS_DEFAULT_DATASET) {
        const [originDataset, originBranch] = queryParam.dataset.split('#');
        if (!queryParam.branch && originBranch) {
            queryParam.branch = originBranch;
            queryParam.dataset = originDataset;
        }
    }
    const IS_DEFAULT_BRANCH = (0, isNil_1.default)(queryParam.branch) || queryParam.branch === config.defaultRepositoryBranch;
    const IS_DEFAULT_COMMIT = (0, isNil_1.default)(queryParam.commit) || queryParam.commit === config.defaultRepositoryCommit;
    const { dataset = (0, get_1.default)(config, 'defaultRepository', helper_service_1.DEFAULT_REPOSITORY_NAME), branch = (0, get_1.default)(config, 'defaultRepositoryBranch', helper_service_1.DEFAULT_REPOSITORY_BRANCH) } = queryParam;
    if ((0, isNil_1.default)(REPOSITORY_DESCRIPTORS[dataset])) {
        throw new Error(`No ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
    }
    if ((0, isNil_1.default)(REPOSITORY_DESCRIPTORS[dataset][branch])) {
        throw new Error(`No ${printBranch(branch, IS_DEFAULT_BRANCH)} in ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
    }
    if (queryParam.commit === 'HEAD') {
        queryParam.commit = (0, get_1.default)(REPOSITORY_DESCRIPTORS, `${dataset}.${branch}.0`) || (0, get_1.default)(config, 'defaultRepositoryCommit', helper_service_1.DEFAULT_REPOSITORY_HASH);
    }
    const { commit = (0, get_1.default)(REPOSITORY_DESCRIPTORS, `${dataset}.${branch}.0`) || (0, get_1.default)(config, 'defaultRepositoryCommit', helper_service_1.DEFAULT_REPOSITORY_HASH) } = queryParam;
    if (!(0, includes_1.default)(REPOSITORY_DESCRIPTORS[dataset][branch], commit)) {
        throw new Error(`No ${printCommit(commit, IS_DEFAULT_COMMIT)} in ${printDefault(IS_DEFAULT_BRANCH)}branch '${branch}' in ${printDataset(dataset, IS_DEFAULT_DATASET)} was found`);
    }
    const repositoryPath = getRepositoryPath('', { dataset, branch, commit });
    Object.assign(queryParam, { repositoryPath });
    return { dataset, branch, commit, isDefaultBranch: IS_DEFAULT_BRANCH, isDefaultCommit: IS_DEFAULT_COMMIT };
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
//# sourceMappingURL=dataset-manager.service.js.map