export declare type MirrorType = 'undefined' | 'null' | 'boolean' | 'number' | 'string' | 'symbol' | 'object' | 'function' | 'regexp' | 'error' | 'property' | 'internalProperty' | 'frame' | 'script' | 'context' | 'scope' | 'promise' | 'map' | 'set' | 'iterator' | 'generator';
export interface Mirror {
    type: () => MirrorType;
    isValue: () => boolean;
    isUndefined: () => boolean;
    isNull: () => boolean;
    isBoolean: () => boolean;
    isNumber: () => boolean;
    isString: () => boolean;
    isSymbol: () => boolean;
    isObject: () => boolean;
    isFunction: () => boolean;
    isUnresolvedFunction: () => boolean;
    isArray: () => boolean;
    isDate: () => boolean;
    isRegExp: () => boolean;
    isError: () => boolean;
    isPromise: () => boolean;
    isGenerator: () => boolean;
    isProperty: () => boolean;
    isInternalProperty: () => boolean;
    isFrame: () => boolean;
    isScript: () => boolean;
    isContext: () => boolean;
    isScope: () => boolean;
    isMap: () => boolean;
    isSet: () => boolean;
    isIterator: () => boolean;
    toText: () => string;
}
export interface ValueMirror extends Mirror {
    value_: any;
    isPrimitive: () => boolean;
    value: () => any;
}
export interface UndefinedMirror extends ValueMirror {
}
export interface InternalPropertyMirror extends Mirror {
    name: () => string;
    value: () => any;
}
export interface ObjectMirror extends ValueMirror {
    className: () => string;
    constructorFunction: () => Mirror;
    prototypeObject: () => Mirror;
    protoObject: () => Mirror;
    hasNamedInterceptor: () => boolean;
    hasIndexedInterceptor: () => boolean;
    propertyNames: (kind: number, limit: number) => string[];
    properties: (kind?: number, limit?: number) => PropertyMirror[];
    internalProperties: () => PropertyMirror[];
    property: () => PropertyMirror | UndefinedMirror;
    lookupProperty: (value: Mirror) => PropertyMirror | UndefinedMirror;
    referencedBy: (opt_max_objects?: number) => Mirror[];
    GetInternalProperties: (value: any) => InternalPropertyMirror[];
}
export interface PropertyMirror extends Mirror {
    mirror_: ObjectMirror;
    isReadOnly: () => boolean;
    isEnum: () => boolean;
    canDelete: () => boolean;
    name: () => string;
    isIndexed: () => boolean;
    value: () => ValueMirror;
    isException: () => boolean;
    attributes: () => any;
    propertyType: () => any;
    hasGetter: () => boolean;
    hasSetter: () => boolean;
    getter: () => Mirror;
    setter: () => Mirror;
    isNative: () => boolean;
}
export interface FrameDetails {
    arguments: Array<{
        name: string;
        value: any;
    }>;
    locals: Array<{
        name: string;
        value: any;
    }>;
    break_id_: number;
    details_: any;
    frameId: () => any;
    receiver: () => any;
    func: () => any;
    script: () => any;
    isConstructCall: () => any;
    isAtReturn: () => any;
    isDebuggerFrame: () => any;
    isOptimizedFrame: () => any;
    isInlinedFrame: () => any;
    inlinedFrameIndex: () => any;
    argumentCount: () => any;
    argumentName: (index: number) => any;
    argumentValue: (index: number) => any;
    localCount: () => any;
    sourcePosition: () => any;
    localName: () => any;
    localValue: () => any;
    returnValue: () => any;
    scopeCount: () => any;
}
export interface FrameMirror extends Mirror {
    break_id_: number;
    index_: number;
    details_: FrameDetails;
    details: () => FrameDetails;
    index: () => number;
    func: () => FunctionMirror;
    script: () => Mirror;
    receiver: () => Mirror;
    isConstructCall: () => boolean;
    isAtReturn: () => boolean;
    isDebuggerFrame: () => boolean;
    isOptimizedFrame: () => boolean;
    isInlinedFrame: () => boolean;
    inlinedFrameIndex: () => number;
    argumentCount: () => number;
    argumentName: () => string;
    argumentValue: () => Mirror;
    localCount: () => number;
    localName: () => string;
    localValue: () => Mirror;
    returnValue: () => Mirror;
    sourcePosition: () => any;
    sourceLocation: () => any;
    sourceLine: () => number;
    sourceColumn: () => number;
    sourceLineText: () => string;
    scopeCount: () => number;
    scope: () => Mirror;
    allScopes: (opt_ignore_nested_scopes?: boolean) => ScopeMirror[];
    evaluate: (source: string, throw_on_side_effect?: boolean) => ValueMirror;
    invocationText: () => string;
    sourceAndPositionText: () => string;
    localsText: () => string;
    restart: () => any;
}
export interface ScopeDetails {
    type: () => any;
    object: () => any;
    name: () => any;
    startPosition: () => any;
    endPosition: () => any;
    func: () => any;
    setVariableValueImpl: (name: string, new_value: any) => void;
}
export interface ScopeMirror extends Mirror {
    details: () => ScopeDetails;
    frameIndex: () => number;
    scopeIndex: () => number;
    scopeType: () => any;
    scopeObject: () => Mirror;
    setVariableValue: (name: string, new_value: any) => void;
}
export interface ScriptMirror {
    name: () => string;
}
export interface Location {
}
export interface ContextMirror {
}
export interface FunctionMirror extends ObjectMirror {
    resolved: () => boolean;
    name: () => string;
    debugName: () => string;
    inferredName: () => string;
    source: () => string | undefined;
    script: () => ScriptMirror | undefined;
    sourcePosition: () => number | undefined;
    sourceLocation: () => Location | undefined;
    constructedBy: (opt_max_instances?: number) => Mirror[] | undefined;
    scopeCount: () => number;
    scope: (index: number) => ScopeMirror;
    toText: () => string;
    context: () => ContextMirror;
}
export interface ExecutionState {
    frame: (index: number) => FrameMirror;
    frameCount: () => number;
}
export interface BreakPoint {
    script_break_point: () => ScriptBreakPoint;
    number: () => number;
    active: () => boolean;
}
export interface ScriptBreakPoint {
    number: () => number;
}
export interface BreakEvent {
    eventType: () => DebugEvent;
    func: () => any;
    sourceLine: () => number;
    sourceColumn: () => number;
    sourceLineText: () => string;
    breakPointsHit: () => BreakPoint[];
}
export interface DebugEvent {
    Break: DebugEvent;
    Exception: DebugEvent;
    AfterCompile: DebugEvent;
    CompileError: DebugEvent;
    AsyncTaskEvent: DebugEvent;
}
export interface Debug {
    DebugEvent: DebugEvent;
    setListener: (listener: any, opt_data?: any) => void;
    clearBreakPoint: (break_point_number: number) => void;
    setScriptBreakPointByRegExp: (script_regexp: RegExp, opt_line?: number, opt_column?: number, opt_condition?: any, opt_groupId?: number) => number;
    findBreakPoint: (break_point_number: number, remove?: boolean) => BreakPoint;
    MakeMirror: (value: any) => Mirror;
}
