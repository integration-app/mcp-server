import { MessageType } from '../enums';
import connectCallReceiver from '../connectCallReceiver';
import connectCallSender from '../connectCallSender';
/**
 * Handles a SYN-ACK handshake message.
 */
export default (parentOrigin, serializedMethods, destructor, log) => {
    const { destroy, onDestroy } = destructor;
    return (event) => {
        let originQualifies = parentOrigin instanceof RegExp
            ? parentOrigin.test(event.origin)
            : parentOrigin === '*' || parentOrigin === event.origin;
        if (!originQualifies) {
            log(`Child: Handshake - Received SYN-ACK from origin ${event.origin} which did not match expected origin ${parentOrigin}`);
            return;
        }
        log('Child: Handshake - Received SYN-ACK, responding with ACK');
        // If event.origin is "null", the remote protocol is file: or data: and we
        // must post messages with "*" as targetOrigin when sending messages.
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Using_window.postMessage_in_extensions
        const originForSending = event.origin === 'null' ? '*' : event.origin;
        const ackMessage = {
            penpal: MessageType.Ack,
            methodNames: Object.keys(serializedMethods),
        };
        window.parent.postMessage(ackMessage, originForSending);
        const info = {
            localName: 'Child',
            local: window,
            remote: window.parent,
            originForSending,
            originForReceiving: event.origin,
        };
        const destroyCallReceiver = connectCallReceiver(info, serializedMethods, log);
        onDestroy(destroyCallReceiver);
        const callSender = {};
        const destroyCallSender = connectCallSender(callSender, info, event.data.methodNames, destroy, log);
        onDestroy(destroyCallSender);
        return callSender;
    };
};
