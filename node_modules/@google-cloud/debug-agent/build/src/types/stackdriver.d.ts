export declare type Action = 'CAPTURE' | 'LOG';
export declare type Reference = 'UNSPECIFIED' | 'BREAKPOINT_SOURCE_LOCATION' | 'BREAKPOINT_CONDITION' | 'BREAKPOINT_EXPRESSION' | 'BREAKPOINT_AGE' | 'VARIABLE_NAME' | 'VARIABLE_VALUE';
export interface FormatMessage {
    format: string;
    parameters?: string[];
}
export interface StatusMessage {
    isError: boolean;
    refersTo: Reference;
    description: FormatMessage;
}
export interface SourceLocation {
    path: string;
    column?: number;
    line: number;
}
export declare type LogLevel = 'INFO' | 'WARNING' | 'ERROR';
export interface Variable {
    varTableIndex?: number;
    name?: string;
    value?: string;
    type?: string;
    members?: Variable[];
    status?: StatusMessage;
}
export interface StackFrame {
    function: string;
    location: SourceLocation;
    arguments: Variable[];
    locals: Variable[];
}
export interface Timestamp {
    seconds: string;
    nano: string;
}
export interface Breakpoint {
    stackFrames: StackFrame[];
    evaluatedExpressions: Array<Variable | null>;
    variableTable: Array<Variable | null>;
    id: BreakpointId;
    action?: Action;
    location?: SourceLocation;
    condition?: string;
    expressions?: string[];
    logMessageFormat?: string;
    logLevel?: LogLevel;
    isFinalState?: boolean;
    createdTime?: Timestamp;
    finalTime?: string;
    userEmail?: string;
    status?: StatusMessage;
    labels?: {
        [key: string]: string;
    };
}
export declare type BreakpointId = string;
export interface ListBreakpointsQuery {
    waitToken?: string;
    successOnTimeout?: boolean;
    agentId?: string;
}
export interface ListBreakpointsResponse {
    breakpoints: Breakpoint[];
    nextWaitToken: string;
    waitExpired: boolean;
}
