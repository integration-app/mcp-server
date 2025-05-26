import { CallSender, Connection, Methods } from '../types';
declare type Options = {
    /**
     * The iframe to which a connection should be made.
     */
    iframe: HTMLIFrameElement;
    /**
     * Methods that may be called by the iframe.
     */
    methods?: Methods;
    /**
     * The child origin to use to secure communication. If
     * not provided, the child origin will be derived from the
     * iframe's src or srcdoc value.
     */
    childOrigin?: string;
    /**
     * The amount of time, in milliseconds, Penpal should wait
     * for the iframe to respond before rejecting the connection promise.
     */
    timeout?: number;
    /**
     * Whether log messages should be emitted to the console.
     */
    debug?: boolean;
};
declare const _default: <TCallSender extends object = CallSender>(options: Options) => Connection<TCallSender>;
/**
 * Attempts to establish communication with an iframe.
 */
export default _default;
