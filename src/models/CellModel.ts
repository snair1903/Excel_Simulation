export class CellModel {
    constructor(
        public readonly row: number,
        public readonly col: number,
        public readonly value: string,
    ) {}

    public isEmpty(): boolean {
        return this.value === '';
    }

    public asNumber(): number | null {
        const normalized = this.value.replace(/,/g, '').trim();
        if (normalized === '') return null;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
}
