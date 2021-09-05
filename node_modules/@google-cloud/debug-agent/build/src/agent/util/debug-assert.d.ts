export interface FakeAssert {
    deepEqual: Function;
    deepStrictEqual: Function;
    doesNotThrow: Function;
    equal: Function;
    fail: Function;
    ifError: Function;
    notDeepEqual: Function;
    notDeepStrictEqual: Function;
    notEqual: Function;
    notStrictEqual: Function;
    ok: Function;
    strictEqual: Function;
    throws: Function;
    AssertionError: Function;
    rejects: Function;
    doesNotReject: Function;
    strict: Function;
    match: Function;
    doesNotMatch: Function;
}
export declare function debugAssert(enableAssertions: boolean): FakeAssert;
