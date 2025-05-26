import { CallSender, SerializedMethods } from '../types';
import { Destructor } from '../createDestructor';
declare const _default: (serializedMethods: SerializedMethods, childOrigin: string, originForSending: string, destructor: Destructor, log: Function) => (event: MessageEvent) => CallSender | undefined;
/**
 * Handles an ACK handshake message.
 */
export default _default;
