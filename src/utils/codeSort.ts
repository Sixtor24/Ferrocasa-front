const DEFAULT_CODE_KEYS = ['codigo', 'codigoInterno', 'identificacionParcela', 'identificacion'];

function getCodeValue(item: unknown, codeKeys = DEFAULT_CODE_KEYS) {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  for (const key of codeKeys) {
    const value = record[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value);
    }
  }
  return null;
}

export function compareNaturalCodes(a: unknown, b: unknown) {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  return String(a).localeCompare(String(b), 'es', {
    numeric: true,
    sensitivity: 'base',
  });
}

export function sortByNaturalCode<T>(data: T[], codeKeys = DEFAULT_CODE_KEYS) {
  return [...data].sort((a, b) => compareNaturalCodes(getCodeValue(a, codeKeys), getCodeValue(b, codeKeys)));
}
