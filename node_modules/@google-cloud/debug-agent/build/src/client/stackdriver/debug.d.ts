import { GoogleAuthOptions, Service } from '@google-cloud/common';
export interface PackageInfo {
    name: string;
    version: string;
}
export interface DebugOptions extends GoogleAuthOptions {
    /**
     * The API endpoint of the service used to make requests.
     * Defaults to `clouddebugger.googleapis.com`.
     */
    apiEndpoint?: string;
}
export declare class Debug extends Service {
    options: DebugOptions;
    packageInfo: PackageInfo;
    /**
     * <p class="notice">
     *   **This is an experimental release of Stackdriver Debug.** This API is not
     *   covered by any SLA of deprecation policy and may be subject to backwards
     *   incompatible changes.
     * </p>
     *
     * This module provides Stackdriver Debugger support for Node.js applications.
     * [Stackdriver Debugger](https://cloud.google.com/debug/) is a feature of
     * [Google Cloud Platform](https://cloud.google.com/) that lets you debug your
     * applications in production without stopping or pausing your application.
     *
     * This module provides an agent that lets you automatically enable debugging
     * without changes to your application.
     *
     * @constructor
     * @alias module:debug
     *
     * @resource [What is Stackdriver Debug]{@link
     * https://cloud.google.com/debug/}
     *
     * @param options - [Authentication options](#/docs)
     */
    constructor(options: DebugOptions | undefined, packageJson: {
        name: string;
        version: string;
    });
}
