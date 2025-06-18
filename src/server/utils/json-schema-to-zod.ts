import { z, ZodRawShape, ZodTypeAny } from 'zod';

export function zodFromJsonSchema(schema: any): ZodRawShape {
  const shape: Record<string, ZodTypeAny> = {};

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

function zodTypeFromJsonSchema(schema: any): ZodTypeAny {
  switch (schema?.type) {
    case 'string':
      return z.string();
    case 'number':
      return z.number();
    case 'integer':
      return z.number().int();
    case 'boolean':
      return z.boolean();
    case 'array':
      return z.array(
        // membrane may not have an items field on array types, let's default to string
        schema.items ? zodTypeFromJsonSchema(schema.items) : z.string()
      );
    case 'object': {
      const shape: ZodRawShape = {};
      const props = schema.properties || {};
      const required = new Set(schema.required || []);
      for (const key in props) {
        const field = zodTypeFromJsonSchema(props[key]);
        shape[key] = required.has(key) ? field : field.optional();
      }
      return z.object(shape);
    }
    default:
      return z.any();
  }
}
