import { BadRequestException } from "@nestjs/common";

  export  const parseJsonField = (input: any): Record<string, any> | null => {
    if (!input) return null;
    if (typeof input === 'object') return input; // already an object
    if (typeof input === 'string') {
      try {
        // If it's a JSON string, parse it
        return JSON.parse(input);
      } catch (e) {
        // If it's malformed (e.g., { title: "..." }), try to fix or reject
        throw new BadRequestException(`Invalid JSON format in field: ${input}`);
      }
    }
    return null;
  };


export function validateTranslationField(
  field: any,
  languageName: string,
): asserts field is { title: string; content: string; duaReference: string } {
  if (!field || typeof field !== 'object') {
    throw new BadRequestException(`${languageName} must be an object`);
  }

  const requiredKeys = ['title', 'content', 'duaReference'] as const;
  const missingKeys: string[] = [];

  for (const key of requiredKeys) {
    if (!field.hasOwnProperty(key) || typeof field[key] !== 'string' || field[key].trim() === '') {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    throw new BadRequestException(
      `${languageName} is missing required fields: ${missingKeys.join(', ')}`,
    );
  }
}