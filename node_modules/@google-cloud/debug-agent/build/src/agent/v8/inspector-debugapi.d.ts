/// <reference types="node" />
import * as estree from 'estree';
import * as inspector from 'inspector';
import consoleLogLevel = require('console-log-level');
import * as stackdriver from '../../types/stackdriver';
import { ResolvedDebugAgentConfig } from '../config';
import { ScanStats } from '../io/scanner';
import { SourceMapper } from '../io/sourcemapper';
import * as utils from '../util/utils';
import * as debugapi from './debugapi';
import { V8Inspector } from './v8inspector';
/**
 * An interface that describes options that set behavior when interacting with
 * the V8 Inspector API.
 */
interface InspectorOptions {
    /**
     * Whether to add a 'file://' prefix to a URL when setting breakpoints.
     */
    useWellFormattedUrl: boolean;
}
/** Data related to the v8 inspector. */
interface V8Data {
    session: inspector.Session;
    inspectorOptions: InspectorOptions;
    inspector: V8Inspector;
    setBreakpointsParams: {
        [v8BreakpointId: string]: inspector.Debugger.SetBreakpointByUrlParameterType;
    };
}
export declare class BreakpointData {
    id: inspector.Debugger.BreakpointId;
    apiBreakpoint: stackdriver.Breakpoint;
    parsedCondition: estree.Node;
    locationStr: string;
    compile: null | ((src: string) => string);
    constructor(id: inspector.Debugger.BreakpointId, apiBreakpoint: stackdriver.Breakpoint, parsedCondition: estree.Node, locationStr: string, compile: null | ((src: string) => string));
}
export declare class InspectorDebugApi implements debugapi.DebugApi {
    logger: consoleLogLevel.Logger;
    config: ResolvedDebugAgentConfig;
    fileStats: ScanStats;
    breakpoints: {
        [id: string]: BreakpointData;
    };
    sourcemapper: SourceMapper;
    listeners: {
        [id: string]: utils.InspectorListener;
    };
    scriptMapper: {
        [id: string]: {
            url: string;
        };
    };
    locationMapper: {
        [id: string]: stackdriver.BreakpointId[];
    };
    breakpointMapper: {
        [id: string]: stackdriver.BreakpointId[];
    };
    numBreakpoints: number;
    numBreakpointHitsBeforeReset: number;
    v8: V8Data;
    constructor(logger: consoleLogLevel.Logger, config: ResolvedDebugAgentConfig, jsFiles: ScanStats, sourcemapper: SourceMapper);
    /** Creates a new V8 Debugging session and the related data. */
    private createV8Data;
    set(breakpoint: stackdriver.Breakpoint, cb: (err: Error | null) => void): void;
    clear(breakpoint: stackdriver.Breakpoint, cb: (err: Error | null) => void): void;
    wait(breakpoint: stackdriver.Breakpoint, callback: (err?: Error) => void): void;
    log(breakpoint: stackdriver.Breakpoint, print: (format: string, exps: string[]) => void, shouldStop: () => boolean): void;
    disconnect(): void;
    numBreakpoints_(): number;
    numListeners_(): number;
    /**
     * Internal breakpoint set function. At this point we have looked up source
     * maps (if necessary), and scriptPath happens to be a JavaScript path.
     *
     * @param {!Breakpoint} breakpoint Debug API Breakpoint object
     * @param {!MapInfoOutput|null} mapInfo A map that has a "file" attribute for
     *    the path of the output file associated with the given input file
     * @param {function(string)=} compile optional compile function that can be
     *    be used to compile source expressions to JavaScript
     * @param {function(?Error)} cb error-back style callback
     */
    private setInternal;
    private setAndStoreBreakpoint;
    private onBreakpointHit;
    private captureBreakpointData;
    private handleDebugPausedEvent;
    /**
     * Periodically resets breakpoints to prevent memory leaks in V8 (for holding
     * contexts of previous breakpoint hits).
     */
    private tryResetV8Debugger;
}
export {};
