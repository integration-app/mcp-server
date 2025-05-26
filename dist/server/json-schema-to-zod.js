"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodFromJsonSchema = zodFromJsonSchema;
exports.zodTypeFromJsonSchema = zodTypeFromJsonSchema;
const zod_1 = require("zod");
function zodFromJsonSchema(schema) {
    const shape = {};
    if (schema?.type === 'object') {
        const props = schema.properties || {};
        const required = new Set(schema.required || []);
        for (const key in props) {
            const field = zodTypeFromJsonSchema(props[key]);
            shape[key] = required.has(key) ? field : field.optional();
        }
    }
    return shape;
}
function zodTypeFromJsonSchema(schema) {
    switch (schema?.type) {
        case 'string':
            return zod_1.z.string();
        case 'number':
            return zod_1.z.number();
        case 'integer':
            return zod_1.z.number().int();
        case 'boolean':
            return zod_1.z.boolean();
        case 'array':
            return zod_1.z.array(zodTypeFromJsonSchema(schema.items));
        case 'object': {
            const shape = {};
            const props = schema.properties || {};
            const required = new Set(schema.required || []);
            for (const key in props) {
                const field = zodTypeFromJsonSchema(props[key]);
                shape[key] = required.has(key) ? field : field.optional();
            }
            return zod_1.z.object(shape);
        }
        default:
            return zod_1.z.any();
    }
}
