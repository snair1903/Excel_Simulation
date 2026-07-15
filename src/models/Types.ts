/**
 * Shared, storage-agnostic type definitions used across the grid.
 * Kept free of any class logic so every layer (data, selection, rendering,
 * commands) can depend on these without creating circular imports.
 */

/** A row/column coordinate pair. Used for the active cell, hit-testing results, etc. */
export interface Cell {
    row: number;
    col: number;
}

/** Sparse row-major storage shape: only rows/columns with a value are present. */
export interface GridData {
    [row: number]: { [col: number]: string };
}

/** An inclusive rectangular range of rows/columns. */
export interface SelectionRange {
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
}

/** Aggregate statistics for the numeric values inside a SelectionRange. */
export interface RangeSummary {
    count: number;
    min: number | null;
    max: number | null;
    sum: number;
    average: number | null;
}

/** One record as produced by JSON.parse of an array-of-objects payload. */
export interface JsonRecord {
    [key: string]: string | number | boolean | null | undefined;
}

/** The result of a completed column/row resize drag, used to build resize commands. */
export interface ResizeResult {
    type: 'col-resize' | 'row-resize';
    index: number;
    oldSize: number;
    newSize: number;
}
