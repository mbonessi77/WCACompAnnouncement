/// <reference types="node" />
import * as inspector from 'inspector';
export declare class V8Inspector {
    private session;
    constructor(session: inspector.Session);
    setBreakpointByUrl(options: inspector.Debugger.SetBreakpointByUrlParameterType): {
        error?: Error | undefined;
        response?: inspector.Debugger.SetBreakpointByUrlReturnType | undefined;
    };
    removeBreakpoint(breakpointId: string): {
        error?: Error | undefined;
    };
    evaluateOnCallFrame(options: inspector.Debugger.EvaluateOnCallFrameParameterType): {
        error?: Error | undefined;
        response?: inspector.Debugger.EvaluateOnCallFrameReturnType | undefined;
    };
    getProperties(options: inspector.Runtime.GetPropertiesParameterType): {
        error?: Error | undefined;
        response?: inspector.Runtime.GetPropertiesReturnType | undefined;
    };
}
