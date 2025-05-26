import { PenpalError } from './types';
export declare type Destructor = {
    /**
     * Calls all onDestroy callbacks.
     */
    destroy(error?: PenpalError): void;
    /**
     * Registers a callback to be called when destroy is called.
     */
    onDestroy(callback: Function): void;
};
declare const _default: (localName: "Parent" | "Child", log: Function) => Destructor;
export default _default;
