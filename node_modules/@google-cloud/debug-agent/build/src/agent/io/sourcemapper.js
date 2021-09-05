"use strict";
// Copyright 2016 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.SourceMapper = exports.MultiFileMatchError = void 0;
const fs = require("fs");
const pLimit = require("p-limit");
const path = require("path");
const util_1 = require("util");
const sourceMap = require("source-map");
const utils_1 = require("../util/utils");
const CONCURRENCY = 10;
const WEBPACK_PREFIX = 'webpack://';
const readFilep = util_1.promisify(fs.readFile);
/** @define {string} */ const MAP_EXT = '.map';
class MultiFileMatchError {
    constructor(files) {
        this.files = files;
        this.name = 'MultiFileMatchError';
        this.message = 'Error: matching multiple files';
    }
}
exports.MultiFileMatchError = MultiFileMatchError;
/**
 * @param {!Map} infoMap The map that maps input source files to
 *  SourceMapConsumer objects that are used to calculate mapping information
 * @param {string} mapPath The path to the sourcemap file to process.  The
 *  path should be relative to the process's current working directory
 * @private
 */
async function processSourcemap(infoMap, mapPath) {
    // this handles the case when the path is undefined, null, or
    // the empty string
    if (!mapPath || !mapPath.endsWith(MAP_EXT)) {
        throw new Error(`The path ${mapPath} does not specify a sourcemap file`);
    }
    mapPath = path.normalize(mapPath);
    let rawSourceMapString;
    try {
        rawSourceMapString = await readFilep(mapPath, 'utf8');
    }
    catch (e) {
        throw new Error('Could not read sourcemap file ' + mapPath + ': ' + e);
    }
    let rawSourceMap;
    try {
        rawSourceMap = JSON.parse(rawSourceMapString);
    }
    catch (e) {
        throw new Error('Could not parse the raw sourcemap ' + mapPath + ': ' + e);
    }
    let consumer;
    try {
        consumer = await new sourceMap.SourceMapConsumer(rawSourceMapString);
    }
    catch (e) {
        throw new Error('An error occurred while reading the ' +
            'sourcemap file ' +
            mapPath +
            ': ' +
            e);
    }
    /*
     * If the sourcemap file defines a "file" attribute, use it as
     * the output file where the path is relative to the directory
     * containing the map file.  Otherwise, use the name of the output
     * file (with the .map extension removed) as the output file.
     */
    const outputBase = rawSourceMap.file
        ? rawSourceMap.file
        : path.basename(mapPath, '.map');
    const parentDir = path.dirname(mapPath);
    const outputPath = path.normalize(path.join(parentDir, outputBase));
    // The paths of the sources that are relative to the source map file. Sort
    // them in ascending order from shortest to longest.
    // For webpack file path, normalize the path after the webpack prefix so that
    // the source map library can recognize it.
    const sourcesRelToSrcmap = rawSourceMap.sources
        .filter((val) => !!val)
        .map((val) => {
        if (val.toLowerCase().startsWith(WEBPACK_PREFIX)) {
            return (WEBPACK_PREFIX +
                path.normalize(val.substr(WEBPACK_PREFIX.length)).replace(/\\/g, '/'));
        }
        return val;
    })
        .sort((src1, src2) => src1.length - src2.length);
    // The paths of the sources that are relative to the current process's working
    // directory. These are the ones that are used for the fuzzy search (thus are
    // platform specific, e.g. using '\\' on Windows and using '/' in Unix, etc.).
    // For webpack file path, the prefix is filtered out for better fuzzy search
    // result.
    const normalizedSourcesRelToProc = sourcesRelToSrcmap
        .map((src) => {
        if (src.toLowerCase().startsWith(WEBPACK_PREFIX)) {
            return src.substring(WEBPACK_PREFIX.length);
        }
        return src;
    })
        .map((relPath) => {
        // resolve the paths relative to the map file so that they are relative to
        // the process's current working directory
        return path.normalize(path.join(parentDir, relPath));
    });
    for (const src of normalizedSourcesRelToProc) {
        const inputFile = path.normalize(src);
        infoMap.set(inputFile, {
            outputFile: outputPath,
            inputFile,
            mapFile: mapPath,
            mapConsumer: consumer,
            sources: sourcesRelToSrcmap,
        });
    }
}
class SourceMapper {
    constructor(logger) {
        this.logger = logger;
        this.infoMap = new Map();
    }
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
    getMapInfoInput(inputPath) {
        if (this.infoMap.has(path.normalize(inputPath))) {
            return this.infoMap.get(inputPath);
        }
        const matches = utils_1.findScriptsFuzzy(inputPath, Array.from(this.infoMap.keys()));
        this.logger.debug(`sourcemapper fuzzy matches: ${matches}`);
        if (matches.length === 1) {
            return this.infoMap.get(matches[0]);
        }
        if (matches.length > 1) {
            throw new MultiFileMatchError(matches);
        }
        return null;
    }
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
    getMapInfoOutput(lineNumber, colNumber, entry) {
        var _a;
        this.logger.debug(`sourcemapper entry.inputFile: ${entry.inputFile}`);
        const relPath = path
            .relative(path.dirname(entry.mapFile), entry.inputFile)
            .replace(/\\/g, '/');
        /**
         * Note: Since `entry.sources` is in ascending order from shortest
         *       to longest, the first source path that ends with the
         *       relative path is necessarily the shortest source path
         *       that ends with the relative path.
         */
        let source;
        for (const src of entry.sources) {
            if (src.endsWith(relPath)) {
                source = src;
                break;
            }
        }
        const sourcePos = {
            source: source || relPath,
            line: lineNumber + 1,
            // to be one-based but expects the column number
            column: colNumber,
        };
        this.logger.debug(`sourcemapper sourcePos: ${JSON.stringify(sourcePos)}`);
        const allPos = entry.mapConsumer.allGeneratedPositionsFor(sourcePos);
        /*
         * Based on testing, it appears that the following code is needed to
         * properly get the correct mapping information.
         *
         * In particular, the generatedPositionFor() alone doesn't appear to
         * give the correct mapping information.
         */
        const mappedPos = allPos && allPos.length > 0
            ? allPos.reduce((accumulator, value) => {
                var _a, _b;
                return ((_a = value.line) !== null && _a !== void 0 ? _a : 0) < ((_b = accumulator.line) !== null && _b !== void 0 ? _b : 0)
                    ? value
                    : accumulator;
            })
            : entry.mapConsumer.generatedPositionFor(sourcePos);
        this.logger.debug(`sourcemapper mappedPos: ${JSON.stringify(mappedPos)}`);
        return {
            file: entry.outputFile,
            line: ((_a = mappedPos.line) !== null && _a !== void 0 ? _a : 0) - 1,
            // by the SourceMapConsumer to the expected
            // zero-based output.
            // TODO: The `sourceMap.Position` type definition has a `column`
            //       attribute and not a `col` attribute.  Determine if the type
            //       definition or this code is correct.
            column: mappedPos.col,
        };
    }
    /** Prints the debugging information of the source mapper to the logger. */
    debug() {
        this.logger.debug('Printing source mapper debugging information ...');
        for (const [key, value] of this.infoMap) {
            this.logger.debug(`  source ${key}:`);
            this.logger.debug(`    outputFile: ${value.outputFile}`);
            this.logger.debug(`    mapFile: ${value.mapFile}`);
            this.logger.debug(`    sources: ${value.sources}`);
        }
    }
}
exports.SourceMapper = SourceMapper;
/**
 * @param {Array.<string>} sourcemapPaths An array of paths to .map sourcemap
 *  files that should be processed.  The paths should be relative to the
 *  current process's current working directory
 * @param {Logger} logger A logger that reports errors that occurred while
 *  processing the given sourcemap files
 */
async function create(sourcemapPaths, logger) {
    const limit = pLimit(CONCURRENCY);
    const mapper = new SourceMapper(logger);
    const promises = sourcemapPaths.map(path => limit(() => processSourcemap(mapper.infoMap, path)));
    try {
        await Promise.all(promises);
    }
    catch (err) {
        throw new Error('An error occurred while processing the sourcemap files' + err);
    }
    mapper.debug();
    return mapper;
}
exports.create = create;
//# sourceMappingURL=sourcemapper.js.map