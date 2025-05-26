import { Destructor } from '../createDestructor';
declare const _default: (iframe: HTMLIFrameElement, destructor: Destructor) => void;
/**
 * Monitors for iframe removal and destroys connection if iframe
 * is found to have been removed from DOM. This is to prevent memory
 * leaks when the iframe is removed from the document and the consumer
 * hasn't called destroy(). Without this, event listeners attached to
 * the window would stick around and since the event handlers have a
 * reference to the iframe in their closures, the iframe would stick
 * around too.
 */
export default _default;
