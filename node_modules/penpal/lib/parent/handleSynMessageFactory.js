import { MessageType } from '../enums';
/**
 * Handles a SYN handshake message.
 */
export default (log, serializedMethods, childOrigin, originForSending) => {
    return (event) => {
        // Under specific timing circumstances, we can receive an event
        // whose source is null. This seems to happen when the child iframe is
        // removed from the DOM about the same time it has sent the SYN event.
        // https://github.com/Aaronius/penpal/issues/85
        if (!event.source) {
            return;
        }
        if (childOrigin !== '*' && event.origin !== childOrigin) {
            log(`Parent: Handshake - Received SYN message from origin ${event.origin} which did not match expected origin ${childOrigin}`);
            return;
        }
        log('Parent: Handshake - Received SYN, responding with SYN-ACK');
        const synAckMessage = {
            penpal: MessageType.SynAck,
            methodNames: Object.keys(serializedMethods),
        };
        event.source.postMessage(synAckMessage, originForSending);
    };
};
