/*!
 * @module debug/controller
 */
import { ServiceObject } from '@google-cloud/common';
import * as t from 'teeny-request';
import { Debug } from '../client/stackdriver/debug';
import { Debuggee } from '../debuggee';
import * as stackdriver from '../types/stackdriver';
export declare class Controller extends ServiceObject {
    private nextWaitToken;
    private agentId;
    apiUrl: string;
    /**
     * @constructor
     */
    constructor(debug: Debug, config?: {
        apiUrl?: string;
    });
    /**
     * Register to the API (implementation)
     *
     * @param {!function(?Error,Object=)} callback
     * @private
     */
    register(debuggee: Debuggee, callback: (err: Error | null, result?: {
        debuggee: Debuggee;
        agentId: string;
    }) => void): void;
    /**
     * Fetch the list of breakpoints from the server. Assumes we have registered.
     * @param {!function(?Error,Object=,Object=)} callback accepting (err, response,
     * body)
     */
    listBreakpoints(debuggee: Debuggee, callback: (err: Error | null, response?: t.Response, body?: stackdriver.ListBreakpointsResponse) => void): void;
    /**
     * Update the server about breakpoint state
     * @param {!Debuggee} debuggee
     * @param {!Breakpoint} breakpoint
     * @param {!Function} callback accepting (err, body)
     */
    updateBreakpoint(debuggee: Debuggee, breakpoint: stackdriver.Breakpoint, callback: (err?: Error, body?: {}) => void): void;
}
