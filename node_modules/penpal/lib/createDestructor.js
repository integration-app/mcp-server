export default (localName, log) => {
    const callbacks = [];
    let destroyed = false;
    return {
        destroy(error) {
            if (!destroyed) {
                destroyed = true;
                log(`${localName}: Destroying connection`);
                callbacks.forEach((callback) => {
                    callback(error);
                });
            }
        },
        onDestroy(callback) {
            destroyed ? callback() : callbacks.push(callback);
        },
    };
};
