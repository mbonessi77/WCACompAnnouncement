import consoleLogLevel = require('console-log-level');
import * as stackdriver from '../../types/stackdriver';
import { DebugAgentConfig } from '../config';
import { ScanStats } from '../io/scanner';
import { SourceMapper } from '../io/sourcemapper';
export interface DebugApi {
    set(breakpoint: stackdriver.Breakpoint, cb: (err: Error | null) => void): void;
    clear(breakpoint: stackdriver.Breakpoint, cb: (err: Error | null) => void): void;
    wait(breakpoint: stackdriver.Breakpoint, callback: (err?: Error) => void): void;
    log(breakpoint: stackdriver.Breakpoint, print: (format: string, exps: string[]) => void, shouldStop: () => boolean): void;
    disconnect(): void;
    numBreakpoints_(): number;
    numListeners_(): number;
}
export declare function willUseInspector(nodeVersion?: string): boolean;
export declare const MODULE_WRAP_PREFIX_LENGTH: any;
export declare function create(logger: consoleLogLevel.Logger, config: DebugAgentConfig, jsFiles: ScanStats, sourcemapper: SourceMapper): DebugApi;
