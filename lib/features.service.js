"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keys = require("lodash.keys");
const isObject = require("lodash.isobject");
const head = require("lodash.head");
const helper_service_1 = require("./helper.service");
const interfaces_1 = require("./interfaces");
function isWhereClauseBasedOnConjunction(query) {
    if (!helper_service_1.isDatapointsQuery(query)) {
        return null;
    }
    if (keys(query.where).length === 1 && isObject(query.where) && query.where.$and) {
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
            const whereAndClauseDetailKeys = keys(whereAndClauseDetail);
            if (whereAndClauseDetailKeys.length === 1) {
                const whereAndClauseDetailKey = head(whereAndClauseDetailKeys);
                const whereAndClauseDetailValue = whereAndClauseDetail[whereAndClauseDetailKey];
                if (query.join && query.join[whereAndClauseDetailValue]) {
                    const joinClausePart = query.join[whereAndClauseDetailValue];
                    const joinClausePartWhere = joinClausePart.where;
                    const joinClausePartWhereKey = head(keys(joinClausePartWhere));
                    const keysAreEqualBetweenJoinWhereAndMainWhere = joinClausePart.key === whereAndClauseDetailKey && joinClausePart.key === joinClausePartWhereKey;
                    if (keysAreEqualBetweenJoinWhereAndMainWhere && keys(joinClausePartWhere).length === 1) {
                        const joinPartDetails = joinClausePartWhere[joinClausePartWhereKey];
                        const keyConceptDescriptor = conceptsLookup.get(joinClausePart.key);
                        const containsInOrNinClause = !!joinPartDetails.$in || !!joinPartDetails.$nin;
                        const isEntitySetOrDomain = keyConceptDescriptor.concept_type === 'entity_set' ||
                            keyConceptDescriptor.concept_type === 'entity_domain';
                        if (keys(joinPartDetails).length === 1 && containsInOrNinClause && isEntitySetOrDomain) {
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