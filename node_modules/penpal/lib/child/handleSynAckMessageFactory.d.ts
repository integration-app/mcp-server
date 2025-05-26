import { CallSender, SerializedMethods } from '../types';
import { Destructor } from '../createDestructor';
declare const _default: (parentOrigin: string | RegExp, serializedMethods: SerializedMethods, destructor: Destructor, log: Function) => (event: MessageEvent) => CallSender | undefined;
/**
 * Handles a SYN-ACK handshake message.
 */
export default _default;
