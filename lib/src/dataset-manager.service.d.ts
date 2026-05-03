export declare function getRepositoryPath(basePath: any, queryParam: any): string;
export declare function getFilePath(repositoryPath: any, filePath?: string): string;
export interface IReposConfig {
    repositoryDescriptors: any;
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
export declare function extendQueryWithRepository(queryParam: any, config?: IReposConfig): Error | IQueryRepoDescriptor;
