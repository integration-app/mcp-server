import { SerializedMethods, Methods } from './types';
/**
 * Given a `keyPath`, set it to be `value` on `subject`, creating any intermediate
 * objects along the way.
 *
 * @param {Object} subject The object on which to set value.
 * @param {string} keyPath The key path at which to set value.
 * @param {Object} value The value to store at the given key path.
 * @returns {Object} Updated subject.
 */
export declare const setAtKeyPath: (subject: Record<string, any>, keyPath: string, value: any) => Record<string, any>;
/**
 * Given a dictionary of (nested) keys to function, flatten them to a map
 * from key path to function.
 *
 * @param {Object} methods The (potentially nested) object to serialize.
 * @param {string} prefix A string with which to prefix entries. Typically not intended to be used by consumers.
 * @returns {Object} An map from key path in `methods` to functions.
 */
export declare const serializeMethods: (methods: Methods, prefix?: string | undefined) => SerializedMethods;
/**
 * Given a map of key paths to functions, unpack the key paths to an object.
 *
 * @param {Object} flattenedMethods A map of key paths to functions to unpack.
 * @returns {Object} A (potentially nested) map of functions.
 */
export declare const deserializeMethods: (flattenedMethods: SerializedMethods) => Methods;
