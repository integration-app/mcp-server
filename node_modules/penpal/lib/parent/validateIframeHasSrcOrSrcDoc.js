import { ErrorCode } from '../enums';
export default (iframe) => {
    if (!iframe.src && !iframe.srcdoc) {
        const error = new Error('Iframe must have src or srcdoc property defined.');
        error.code = ErrorCode.NoIframeSrc;
        throw error;
    }
};
