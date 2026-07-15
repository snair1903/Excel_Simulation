import type { GridData, JsonRecord } from "../models/Types.js";

export class JsonDataLoader {
    public static fromRecords(records: JsonRecord[]): GridData {
        const gridData: GridData = {};
        if (records.length === 0) return gridData;

        const headers = Object.keys(records[0]!);
        const headerRow: { [col: number]: string } = {};
        headers.forEach((header, col) => {
            headerRow[col] = header;
        });
        gridData[0] = headerRow;

        records.forEach((record, recordIndex) => {
            const row: { [col: number]: string } = {};
            headers.forEach((header, col) => {
                const value = record[header];
                if (value !== undefined && value !== null && value !== '') {
                    row[col] = String(value);
                }
            });
            gridData[recordIndex + 1] = row;
        });

        return gridData;
    }

    public static parse(jsonText: string): GridData {
        const parsed: unknown = JSON.parse(jsonText);

        if (Array.isArray(parsed)) {
            return this.fromRecords(parsed as JsonRecord[]);
        }

        if (parsed && typeof parsed === 'object') {
            const wrapped = (parsed as { records?: unknown }).records;
            if (Array.isArray(wrapped)) {
                return this.fromRecords(wrapped as JsonRecord[]);
            }
        }

        throw new Error('Unsupported JSON structure. Expected an array of records, e.g. [{"FirstName":"Ada"}, ...], or { "records": [...] }.');
    }

    public static async loadFromFile(file: File): Promise<GridData> {
        const text = await file.text();
        return this.parse(text);
    }
}
