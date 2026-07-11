import type { EditAction } from "./models.js";

export type ActionApplier = (action: EditAction, isUndo: boolean) => void;

/**
 * Generic undo/redo command stack. It doesn't know how to apply an
 * EditAction - that's delegated to the applier callback supplied by
 * whoever owns the grid/cell data - it only owns stack bookkeeping.
 */
export class HistoryManager {
    private undoStack: EditAction[] = [];
    private redoStack: EditAction[] = [];
    private readonly maxHistorySize = 200;

    constructor(private readonly applyAction: ActionApplier) {}

    public push(action: EditAction): void {
        this.undoStack.push(action);
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = []; // any new action invalidates the redo branch
    }

    public undo(): void {
        const action = this.undoStack.pop();
        if (!action) return;
        this.applyAction(action, true);
        this.redoStack.push(action);
    }

    public redo(): void {
        const action = this.redoStack.pop();
        if (!action) return;
        this.applyAction(action, false);
        this.undoStack.push(action);
    }
}
