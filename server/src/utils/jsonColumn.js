// MariaDB implements the JSON type as LONGTEXT with a check constraint rather
// than a true JSON wire type, so mysql2 never auto-parses it and a freshly
// loaded model instance gets the raw JSON string back instead of the parsed
// value (only a same-request write-then-read looks correct, since that reads
// straight from the in-memory value). These getter/setter pairs normalize a
// JSON column so it always reads back as its intended shape.
export function jsonColumnGetSet(fieldName, defaultValue) {
  return {
    get() {
      const raw = this.getDataValue(fieldName);
      if (raw === null || raw === undefined) return defaultValue;
      if (typeof raw !== 'string') return raw;
      try {
        return JSON.parse(raw);
      } catch {
        return defaultValue;
      }
    },
    set(value) {
      this.setDataValue(fieldName, value ?? defaultValue);
    },
  };
}
