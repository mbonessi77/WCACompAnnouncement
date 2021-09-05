export interface FileStats {
    hash?: string;
    lines: number;
}
export interface ScanStats {
    [filename: string]: FileStats | undefined;
}
export interface ScanResults {
    errors(): Map<string, Error>;
    all(): ScanStats;
    selectStats(regex: RegExp): ScanStats;
    selectFiles(regex: RegExp, baseDir: string): string[];
    hash: string;
}
export declare function scan(baseDir: string, regex: RegExp, precomputedHash?: string): Promise<ScanResults>;
