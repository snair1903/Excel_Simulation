import {
    sampleDatasetRowCount,
    sampleAgeUpperBoundExclusive,
    sampleSalaryUpperBoundExclusive,
    sampleLastNameSuffixUpperBoundExclusive,
} from "./Constants/Constant.js";

export interface Cell {
    row: number;
    col: number;
}

export interface GridData {
    [row: number]: { [col: number]: string };
}

function generateSampleDataset(): GridData {
    const dataset: GridData = { 0: { 0: "FirstName", 1: "LastName", 2: "Age", 3: "Salary" } };
    for (let i = 1; i < sampleDatasetRowCount; i++) {
        dataset[i] = {
            0: "smit" + i,
            1: "warang" + Math.floor(Math.random() * sampleLastNameSuffixUpperBoundExclusive),
            2: "" + Math.floor(Math.random() * sampleAgeUpperBoundExclusive) + " yrs",
            3: "" + Math.floor(Math.random() * sampleSalaryUpperBoundExclusive),
        };
    }
    return dataset;
}

export interface SelectionRange {
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
}

export interface RangeSummary {
    count: number;
    min: number | null;
    max: number | null;
    sum: number;
    average: number | null;
}

export type EditAction =
    | { type: 'cell-edit'; row: number; col: number; oldValue: string; newValue: string }
    | { type: 'col-resize'; col: number; oldWidth: number; newWidth: number }
    | { type: 'row-resize'; row: number; oldHeight: number; newHeight: number };

export interface JsonRecord {
    [key: string]: string | number | boolean | null | undefined;
}

export const initialSparseData: GridData = generateSampleDataset();
