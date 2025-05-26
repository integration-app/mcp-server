import { SerializedMethods, WindowsInfo } from './types';
declare const _default: (info: WindowsInfo, serializedMethods: SerializedMethods, log: Function) => () => void;
/**
 * Listens for "call" messages coming from the remote, executes the corresponding method, and
 * responds with the return value.
 */
export default _default;
