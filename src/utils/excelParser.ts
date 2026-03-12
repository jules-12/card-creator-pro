/**
 * Re-export barrel for backward compatibility.
 * Actual logic is split into src/utils/excel/ modules.
 */
export { parseExcelFile, MAX_ROWS, MAX_PROCESSING_TIME_S } from './excel/parseExcelFile';
export { generateTestData } from './excel/testData';
export { findColumnKey, normalizeColumnName, COLUMN_MAPPINGS } from './excel/columnMappings';
