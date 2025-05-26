declare type SerializedError = {
    name: string;
    message: string;
    stack: string | undefined;
};
/**
 * Converts an error object into a plain object.
 */
export declare const serializeError: ({ name, message, stack, }: Error) => SerializedError;
/**
 * Converts a plain object into an error object.
 */
export declare const deserializeError: (obj: SerializedError) => Error;
export {};
