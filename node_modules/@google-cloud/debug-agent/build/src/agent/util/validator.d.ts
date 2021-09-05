import * as estree from 'estree';
/**
 * Validates if the AST represented by the node has obvious side-effects.
 * It catches the most common cases such as assignments, method calls, and
 * control flow. It doesn't (presently) catch property access that may end
 * up calling accessors.
 *
 * @param {Object} node AST Node (as per the Mozilla Parser API)
 * @return {boolean} if the exper
 */
export declare function isValid(node: estree.Node | null): boolean;
