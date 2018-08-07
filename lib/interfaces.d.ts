export interface IReader {
    recordTransformer: Function;
    setRecordTransformer(recordTransformer: Function): any;
    readText(filePath: string, onFileRead: Function): any;
}
export declare enum QueryFeature {
    WhereClauseBasedOnConjunction = "WhereClauseBasedOnConjunction",
    ConjunctionPartFromWhereClauseCorrespondsToJoin = "ConjunctionPartFromWhereClauseCorrespondsToJoin"
}
export interface IQuery {
    from: string;
    select: {
        key: string[];
        value: string[];
    };
    where?: any;
    join?: any;
    order_by?: string[];
}
export declare type IQueryFeatureDetector = (query: IQuery, conceptsLookup?: any) => QueryFeature | null;
