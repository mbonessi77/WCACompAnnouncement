import * as estree from 'estree';
import consoleLogLevel = require('console-log-level');
import * as stackdriver from '../../types/stackdriver';
import * as v8 from '../../types/v8';
import { ResolvedDebugAgentConfig } from '../config';
import { ScanStats } from '../io/scanner';
import { SourceMapper } from '../io/sourcemapper';
import * as utils from '../util/utils';
import * as debugapi from './debugapi';
export declare class V8BreakpointData {
    apiBreakpoint: stackdriver.Breakpoint;
    v8Breakpoint: v8.BreakPoint;
    parsedCondition: estree.Node;
    compile: null | ((src: string) => string);
    constructor(apiBreakpoint: stackdriver.Breakpoint, v8Breakpoint: v8.BreakPoint, parsedCondition: estree.Node, compile: null | ((src: string) => string));
}
export declare class V8DebugApi implements debugapi.DebugApi {
    breakpoints: {
        [id: string]: V8BreakpointData;
    };
    sourcemapper: SourceMapper;
    v8: v8.Debug;
    config: ResolvedDebugAgentConfig;
    fileStats: ScanStats;
    listeners: {
        [id: string]: utils.LegacyListener;
    };
    v8Version: RegExpExecArray | null;
    usePermanentListener: boolean;
    logger: consoleLogLevel.Logger;
    handleDebugEvents: (evt: v8.DebugEvent, execState: v8.ExecutionState, eventData: v8.BreakEvent) => void;
    numBreakpoints: number;
    constructor(logger: consoleLogLevel.Logger, config: ResolvedDebugAgentConfig, jsFiles: ScanStats, sourcemapper: SourceMapper);
    set(breakpoint: stackdriver.Breakpoint, cb: (err: Error | null) => void): void;
    clear(breakpoint: stackdriver.Breakpoint, cb: (err: Error | null) => void): void;
    wait(breakpoint: stackdriver.Breakpoint, callback: (err?: Error) => void): void;
    log(breakpoint: stackdriver.Breakpoint, print: (format: string, exps: string[]) => void, shouldStop: () => boolean): void;
    disconnect(): void;
    numBreakpoints_(): number;
    numListeners_(): number;
    private setInternal;
    private setByRegExp;
    private onBreakpointHit;
    /**
     * Evaluates the breakpoint condition, if present.
     * @return object with either a boolean value or an error property
     */
    private checkCondition;
    private captureBreakpointData;
}
