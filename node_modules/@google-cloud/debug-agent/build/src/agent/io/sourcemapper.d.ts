import * as sourceMap from 'source-map';
import { Logger } from '../config';
/** Represents one source map file. */
export interface MapInfoInput {
    outputFile: string;
    inputFile: string;
    mapFile: string;
    mapConsumer: sourceMap.SourceMapConsumer;
    sources: string[];
}
export interface MapInfoOutput {
    file: string;
    line: number;
    column?: number;
}
export declare class MultiFileMatchError implements Error {
    readonly files: string[];
    readonly name = "MultiFileMatchError";
    readonly message = "Error: matching multiple files";
    constructor(files: string[]);
}
export declare class SourceMapper {
    readonly logger: Logger;
    /** Maps each original source path to the corresponding source map info. */
    infoMap: Map<string, MapInfoInput>;
    constructor(logger: Logger);
    /**
     * Used to get the information about the transpiled file from a given input
     * source file provided there isn't any ambiguity with associating the input
     * path to exactly one output transpiled file.
     *
     * If there are more than one matches, throw the error to include all the
     * matched candidates.
     *
     * If there is no such mapping, it could be because the input file is not
     * the input to a transpilation process or it is the input to a transpilation
     * process but its corresponding .map file was not given to the constructor of
     * this mapper.
     *
     * @param inputPath The path to an input file that could possibly be the input
     *     to a transpilation process.
     *  The path can be relative to the process's current working directory.
     * @return The `MapInfoInput` object that describes the transpiled file
     *  associated with the specified input path. `null` is returned if there is
     *  no files that are associated with the input path.
     */
    getMapInfoInput(inputPath: string): MapInfoInput | null;
    /**
     * @param {number} The line number in the input file where the line number is
     *   zero-based.
     * @param {number} (Optional) The column number in the line of the file
     *   specified where the column number is zero-based.
     * @param {string} The entry of the source map info in the sourceMapper. Such
     *     an entry is supposed to be got by the getMapInfoInput method.
     *
     * @return {Object} The object returned has a "file" attribute for the
     *   path of the output file associated with the given input file (where the
     *   path is relative to the process's current working directory),
     *   a "line" attribute of the line number in the output file associated with
     *   the given line number for the input file, and an optional "column" number
     *   of the column number of the output file associated with the given file
     *   and line information.
     *
     *   If the given input file does not have mapping information associated
     *   with it then null is returned.
     */
    getMapInfoOutput(lineNumber: number, colNumber: number, entry: MapInfoInput): MapInfoOutput | null;
    /** Prints the debugging information of the source mapper to the logger. */
    debug(): void;
}
/**
 * @param {Array.<string>} sourcemapPaths An array of paths to .map sourcemap
 *  files that should be processed.  The paths should be relative to the
 *  current process's current working directory
 * @param {Logger} logger A logger that reports errors that occurred while
 *  processing the given sourcemap files
 */
export declare function create(sourcemapPaths: string[], logger: Logger): Promise<SourceMapper>;
