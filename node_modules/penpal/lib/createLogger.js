export default (debug) => {
    /**
     * Logs a message if debug is enabled.
     */
    return (...args) => {
        if (debug) {
            console.log('[Penpal]', ...args); // eslint-disable-line no-console
        }
    };
};
