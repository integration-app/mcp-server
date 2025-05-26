export var MessageType;
(function (MessageType) {
    MessageType["Call"] = "call";
    MessageType["Reply"] = "reply";
    MessageType["Syn"] = "syn";
    MessageType["SynAck"] = "synAck";
    MessageType["Ack"] = "ack";
})(MessageType || (MessageType = {}));
export var Resolution;
(function (Resolution) {
    Resolution["Fulfilled"] = "fulfilled";
    Resolution["Rejected"] = "rejected";
})(Resolution || (Resolution = {}));
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["ConnectionDestroyed"] = "ConnectionDestroyed";
    ErrorCode["ConnectionTimeout"] = "ConnectionTimeout";
    ErrorCode["NoIframeSrc"] = "NoIframeSrc";
})(ErrorCode || (ErrorCode = {}));
export var NativeErrorName;
(function (NativeErrorName) {
    NativeErrorName["DataCloneError"] = "DataCloneError";
})(NativeErrorName || (NativeErrorName = {}));
export var NativeEventType;
(function (NativeEventType) {
    NativeEventType["Message"] = "message";
})(NativeEventType || (NativeEventType = {}));
