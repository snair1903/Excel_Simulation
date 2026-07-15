import type { ICommand } from "./ICommand.js";
import { GridDataStore } from "../data/GridDataStore.js";

export class EditCellCommand implements ICommand {
    constructor(
        private readonly dataStore: GridDataStore,
        private readonly row: number,
        private readonly col: number,
        private readonly oldValue: string,
        private readonly newValue: string,
    ) {}

    public execute(): void {
        this.dataStore.setValue(this.row, this.col, this.newValue);
    }

    public undo(): void {
        this.dataStore.setValue(this.row, this.col, this.oldValue);
    }
}
