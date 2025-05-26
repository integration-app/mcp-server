import { ErrorCode } from './enums';
/**
 * Starts a timeout and calls the callback with an error
 * if the timeout completes before the stop function is called.
 */
export default (timeout, callback) => {
    let timeoutId;
    if (timeout !== undefined) {
        timeoutId = window.setTimeout(() => {
            const error = new Error(`Connection timed out after ${timeout}ms`);
            error.code = ErrorCode.ConnectionTimeout;
            callback(error);
        }, timeout);
    }
    return () => {
        clearTimeout(timeoutId);
    };
};
