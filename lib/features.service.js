"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureDetectors = void 0;
const keys_1 = require("lodash-es/keys");
const isObject_1 = require("lodash-es/isObject");
const head_1 = require("lodash-es/head");
const helper_service_1 = require("./helper.service");
const interfaces_1 = require("./interfaces");
function isWhereClauseBasedOnConjunction(query) {
    if (!(0, helper_service_1.isDatapointsQuery)(query)) {
        return null;
    }
    if ((0, keys_1.default)(query.where).length === 1 && (0, isObject_1.default)(query.where) && query.where.$and) {
        return interfaces_1.QueryFeature.WhereClauseBasedOnConjunction;
    }
    return null;
}
exports.featureDetectors = [
    isWhereClauseBasedOnConjunction,
    (query, conceptsLookup) => {
        if (!isWhereClauseBasedOnConjunction(query)) {
            return null;
        }
        for (const whereAndClauseDetail of query.where.$and) {
            const whereAndClauseDetailKeys = (0, keys_1.default)(whereAndClauseDetail);
            if (whereAndClauseDetailKeys.length === 1) {
                const whereAndClauseDetailKey = (0, head_1.default)(whereAndClauseDetailKeys);
                const whereAndClauseDetailValue = whereAndClauseDetail[whereAndClauseDetailKey];
                if (query.join && query.join[whereAndClauseDetailValue]) {
                    const joinClausePart = query.join[whereAndClauseDetailValue];
                    const joinClausePartWhere = joinClausePart.where;
                    const joinClausePartWhereKey = (0, head_1.default)((0, keys_1.default)(joinClausePartWhere));
                    const keysAreEqualBetweenJoinWhereAndMainWhere = joinClausePart.key === whereAndClauseDetailKey && joinClausePart.key === joinClausePartWhereKey;
                    if (keysAreEqualBetweenJoinWhereAndMainWhere && (0, keys_1.default)(joinClausePartWhere).length === 1) {
                        const joinPartDetails = joinClausePartWhere[joinClausePartWhereKey];
                        const keyConceptDescriptor = conceptsLookup.get(joinClausePart.key);
                        const containsInOrNinClause = !!joinPartDetails.$in || !!joinPartDetails.$nin;
                        const isEntitySetOrDomain = keyConceptDescriptor.concept_type === 'entity_set' ||
                            keyConceptDescriptor.concept_type === 'entity_domain';
                        if ((0, keys_1.default)(joinPartDetails).length === 1 && containsInOrNinClause && isEntitySetOrDomain) {
                            return interfaces_1.QueryFeature.ConjunctionPartFromWhereClauseCorrespondsToJoin;
                        }
                    }
                }
            }
        }
        return null;
    }
];
//# sourceMappingURL=features.service.js.map