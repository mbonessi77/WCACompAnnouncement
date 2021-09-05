import { PackageInfo } from './client/stackdriver/debug';
import { StatusMessage } from './client/stackdriver/status-message';
export declare type CanaryMode = 'CANARY_MODE_UNSPECIFIED' | 'CANARY_MODE_ALWAYS_ENABLED' | 'CANARY_MODE_ALWAYS_DISABLED' | 'CANARY_MODE_DEFAULT_ENABLED' | 'CANARY_MODE_DEFAULT_DISABLED';
export interface DebuggeeProperties {
    project?: string;
    uniquifier?: string;
    description?: string;
    agentVersion: string;
    labels?: {
        [key: string]: string;
    };
    sourceContexts?: Array<{
        [key: string]: {};
    }>;
    statusMessage?: StatusMessage;
    packageInfo?: PackageInfo;
    canaryMode?: CanaryMode;
}
export declare class Debuggee {
    uniquifier?: string;
    description?: string;
    agentVersion?: string;
    sourceContexts?: Array<{
        [key: string]: {};
    }>;
    project?: string;
    labels?: {
        [key: string]: string;
    };
    statusMessage?: StatusMessage;
    id: string;
    isDisabled?: boolean;
    isInactive?: boolean;
    canaryMode?: CanaryMode;
    /**
     * Creates a Debuggee service object.
     * @ref https://cloud.google.com/debugger/api/reference/rest/v2/Debuggee
     *
     * @param {object} properties - an object with properties to use for Debuggee
     *     initialization.
     * @param {object} properties.project - Google Cloud Project ID
     * @param {string} properties.uniquifier - Debuggee uniquifier within the
     *     project. Any string that identifies the application within the project
     *     can be used. Including environment and version or build IDs is
     *     recommended.
     * @param {string} properties.description - A user specified string identifying
     *     this debuggable instance.
     * @param {?string} properties.agentVersion - version ID of the agent. (default:
     *     the version of this module)
     * @param {?object} labels - a set of custom properties about the debuggee that
     *     are reported to the service.
     * @param {?array<object>} properties.sourceContexts
     * @param {?StatusMessage} properties.statusMessage - A error string to register
     *     this as an erroring debuggable instance. This is useful if we have a
     *     problem starting the debugger support, and want to report to the API so
     *     that the user has a way of noticing.
     *     TODO(ofrobots): has this been renamed to `status` in the API?
     */
    constructor(properties: DebuggeeProperties);
}
