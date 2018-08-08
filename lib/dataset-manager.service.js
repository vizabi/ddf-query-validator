"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const isNil_1 = require("lodash-es/isNil");
const includes_1 = require("lodash-es/includes");
const get_1 = require("lodash-es/get");
const helper_service_1 = require("./helper.service");
function getDatasetPath(basePath, queryParam) {
    const { dataset, branch, commit } = queryParam;
    return `${basePath}${dataset}/${branch}-${commit}`;
}
exports.getDatasetPath = getDatasetPath;
function getDatapackagePath(datasetPath) {
    return datasetPath + '/datapackage.json';
}
function isDatasetPathAlreadyInBasePath(fileReader, basePath) {
    return new Promise((resolve) => {
        fileReader.readText(getDatapackagePath(basePath), (error) => resolve(!error));
    });
}
function extendQueryParamWithDatasetProps(queryParam, options = {}) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const datasetsConfig = get_1.default(options, 'datasetsConfig', {
            [helper_service_1.DEFAULT_DATASET_NAME]: { [helper_service_1.DEFAULT_DATASET_BRANCH]: [helper_service_1.DEFAULT_DATASET_COMMIT] },
            default: {
                dataset: helper_service_1.DEFAULT_DATASET_NAME,
                branch: helper_service_1.DEFAULT_DATASET_BRANCH,
                commit: helper_service_1.DEFAULT_DATASET_COMMIT
            }
        });
        const { 'default': { dataset: DEFAULT_DATASET, branch: DEFAULT_BRANCH, commit: DEFAULT_COMMIT } } = datasetsConfig;
        const { dataset: originDataset, branch: originBranch, commit: originCommit } = queryParam;
        const { dataset = DEFAULT_DATASET, branch = DEFAULT_BRANCH, commit = DEFAULT_COMMIT } = queryParam;
        const basePath = get_1.default(options, 'basePath', helper_service_1.DEFAULT_DATASET_DIR);
        const fileReader = get_1.default(options, 'fileReader');
        const datasetName = dataset;
        if (isNil_1.default(datasetsConfig[dataset])) {
            throw new Error(`No ${isNil_1.default(originDataset) ? 'default ' : ''}dataset '${dataset}' was found`);
        }
        if (isNil_1.default(datasetsConfig[dataset][branch])) {
            throw new Error(`No ${isNil_1.default(originBranch) ? 'default ' : ''}branch '${branch}' in ${isNil_1.default(originDataset) ? 'default ' : ''}dataset '${dataset}' was found`);
        }
        if (!includes_1.default(datasetsConfig[dataset][branch], commit)) {
            throw new Error(`No ${isNil_1.default(originCommit) ? 'default ' : ''}commit '${commit}' in ${isNil_1.default(originBranch) ? 'default ' : ''}branch '${branch}' in ${isNil_1.default(originDataset) ? 'default ' : ''}dataset '${dataset}' was found`);
        }
        let datasetPath;
        let datapackagePath;
        try {
            if (yield isDatasetPathAlreadyInBasePath(fileReader, basePath)) {
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