"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const isNil = require("lodash.isnil");
const includes = require("lodash.includes");
const get = require("lodash.get");
const path = require("path");
const helper_service_1 = require("./helper.service");
function getDatasetPath(basePath, queryParam) {
    const { dataset, branch, commit } = queryParam;
    return `${basePath}${dataset}/${branch}-${commit}`;
}
exports.getDatasetPath = getDatasetPath;
function getDatapackagePath(datasetPath) {
    return path.resolve(datasetPath, 'datapackage.json');
}
function isDatasetPathAlreadyInBasePath(fileReader, basePath) {
    return new Promise((resolve) => {
        fileReader.readText(getDatapackagePath(basePath), (error) => {
            return resolve(!error);
        });
    });
}
function extendQueryParamWithDatasetProps(queryParam, options = {}) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const datasetsConfig = get(options, 'datasetsConfig', {
            [helper_service_1.DEFAULT_DATASET_NAME]: { [helper_service_1.DEFAULT_DATASET_BRANCH]: [helper_service_1.DEFAULT_DATASET_COMMIT] },
            default: {
                dataset: helper_service_1.DEFAULT_DATASET_NAME,
                branch: helper_service_1.DEFAULT_DATASET_BRANCH,
                commit: helper_service_1.DEFAULT_DATASET_COMMIT
            }
        });
        const { 'default': { dataset: DEFAULT_DATASET, branch: DEFAULT_BRANCH, commit: DEFAULT_COMMIT } } = datasetsConfig;
        const { dataset: originDataset, branch: originBranch, commit: originCommit } = queryParam;
        let { dataset = DEFAULT_DATASET, branch = DEFAULT_BRANCH, commit = DEFAULT_COMMIT } = queryParam;
        const basePath = get(options, 'basePath', helper_service_1.DEFAULT_DATASET_DIR);
        const fileReader = get(options, 'fileReader');
        const datasetName = dataset;
        if (isNil(datasetsConfig[dataset])) {
            throw new Error(`No ${isNil(originDataset) ? 'default ' : ''}dataset '${dataset}' was found`);
        }
        if (isNil(datasetsConfig[dataset][branch])) {
            throw new Error(`No ${isNil(originBranch) ? 'default ' : ''}branch '${branch}' in ${isNil(originDataset) ? 'default ' : ''}dataset '${dataset}' was found`);
        }
        if (!includes(datasetsConfig[dataset][branch], commit)) {
            throw new Error(`No ${isNil(originCommit) ? 'default ' : ''}commit '${commit}' in ${isNil(originBranch) ? 'default ' : ''}branch '${branch}' in ${isNil(originDataset) ? 'default ' : ''}dataset '${dataset}' was found`);
        }
        let datasetPath;
        let datapackagePath;
        try {
            const isAlreadyDataset = yield isDatasetPathAlreadyInBasePath(fileReader, basePath);
            if (isAlreadyDataset) {
                dataset = basePath;
                branch = null;
                commit = null;
                datasetPath = basePath;
                datapackagePath = getDatapackagePath(basePath);
            }
            else {
                datasetPath = getDatasetPath(basePath, { dataset, branch, commit });
                datapackagePath = getDatapackagePath(datasetPath);
            }
        }
        catch (error) {
            throw error;
        }
        Object.assign(queryParam, { dataset, branch, commit });
        Object.assign(options, { datasetPath, datapackagePath, datasetName });
        return queryParam;
    });
}
exports.extendQueryParamWithDatasetProps = extendQueryParamWithDatasetProps;
//# sourceMappingURL=dataset-manager.service.js.map