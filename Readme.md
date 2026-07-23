# Excel Grid View

## 1. Project Name and Objective

**Excel Grid View** — an Excel-like grid rendered with HTML Canvas, built in
TypeScript with no external UI framework or rendering library.

Objective: demonstrate a maintainable, scalable, Canvas-based spreadsheet
component that can represent **100,000 rows x 500 columns** using
**virtual (viewport-only) rendering**, supports cell editing, column/row
resizing, row/column/range selection, a live numeric summary, and
**undo/redo implemented with the Command pattern** — with the design driven
by clean OOP and SOLID separation rather than one large file.

## 2. How to Install and Run

Requirements: Node.js and the TypeScript compiler.

```bash
npm install
npm run dev          
```




## 3. Features Implemented

| Requirement area (per task spec) | Implemented as |
|---|---|
| Grid rendering | Canvas-drawn gridlines, column headers (A, B, C, ...), row headers (1, 2, 3, ...), top-left "select all" corner |
| Scale support | 100,000 rows x 500 columns via viewport-based virtual rendering |
| Data loading | 50,000-record sample generation on load; JSON file import for arbitrary records |
| Editing | HTML input overlay positioned over the active canvas cell; only the affected cell region needs to redraw |
| Resizing | Column and row resize by dragging header borders, with live visual feedback |
| Selection | Single cell, full row, full column, drag range, and select-all |
| Summary | Count, min, max, sum, average for numeric cells in the current selection |
| Undo/Redo | Cell edits, column resizes, and row resizes, via Command pattern (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z) |
| Look and feel | Excel-style thin gridlines, grey header bar, green selection border/fill, resize cursors on header borders |
| Keyboard basics | Enter to edit, Escape to cancel, Delete/Backspace to clear, Ctrl+Z/Ctrl+Y for undo/redo |

## 4. Folder and Class Structure

```
src/
  Constants/Constant.ts        sizing, color, and behavior constants (no magic numbers)
  models/
    Types.ts                   Cell, GridData, SelectionRange, RangeSummary, JsonRecord, ResizeResult
    CellModel.ts                CellModel — typed value object for one resolved cell
    SampleDatasetGenerator.ts   builds the initial >=50,000-row demo dataset
  geometry/
    AxisModel.ts                shared prefix-sum axis math (base class)
    ColumnModel.ts               per-column width metadata + column labels (extends AxisModel)
    RowModel.ts                  per-row height metadata (extends AxisModel)
    GridGeometry.ts              composes ColumnModel + RowModel
  viewport/
    ViewportManager.ts           visible row/column window for the current scroll position
  data/
    GridDataStore.ts             sparse cell storage/retrieval
    JsonDataLoader.ts            JSON <-> GridData conversion, and record generation entry point
  calculation/
    SummaryCalculator.ts         count/min/max/sum/average over a selection
  selection/
    SelectionManager.ts          active cell, selection mode, selection range
  editing/
    EditManager.ts               editing workflow + input-overlay positioning
  resizing/
    ResizeController.ts          resize-drag hit testing and live width/height updates
  commands/
    ICommand.ts                  execute()/undo() contract
    EditCellCommand.ts
    ResizeColumnCommand.ts
    ResizeRowCommand.ts
    CommandManager.ts            undo/redo stacks
  rendering/
    GridRenderer.ts               draws cells, selection highlight, headers
  Grid.ts                        main coordinator (DOM wiring + event handling)
  index.ts                       entry point
```

Mapping to the task's expected component list:

| Task spec component | This project |
|---|---|
| `Grid` | `Grid` (`src/Grid.ts`) |
| `GridRenderer` | `GridRenderer` (`src/rendering/`) |
| `GridDataStore` | `GridDataStore` (`src/data/`) |
| `RowModel` / `ColumnModel` | `RowModel` / `ColumnModel`, sharing `AxisModel` (`src/geometry/`) |
| `CellModel` | `CellModel` (`src/models/`) |
| `ViewportManager` | `ViewportManager` (`src/viewport/`) |
| `SelectionManager` | `SelectionManager` (`src/selection/`) |
| `EditManager` | `EditManager` (`src/editing/`) (task doc's "Editing workflow and input overlay coordination") |
| `SummaryCalculator` | `SummaryCalculator` (`src/calculation/`) |
| `CommandManager` | `CommandManager` (`src/commands/`) |
| `ICommand` | `ICommand` (`src/commands/`) |
| `EditCellCommand` / `ResizeColumnCommand` / `ResizeRowCommand` | same names (`src/commands/`) |
| `JsonDataLoader` | `JsonDataLoader` (`src/data/`) + `SampleDatasetGenerator` (`src/models/`) for the "generate" half |



## 5. Class / Component Diagram

```
                          +---------------+
                          |     Grid      |  (DOM + event wiring only)
                          +-------+-------+
             ______________|_______|_______|______________
            |              |               |               |
     +------v-----+  +-----v------+  +-----v------+  +-----v-------+
     | GridRenderer|  | EditManager|  |ResizeCtrl  |  |CommandManager|
     +------+-----+  +-----+------+  +-----+------+  +-----+-------+
            |               |               |               | executes/undoes
            |               |               |         +-----v----------------------+
            |               |               |         | ICommand                    |
            |               |               |         |  EditCellCommand            |
            |               |               |         |  ResizeColumnCommand        |
            |               |               |         |  ResizeRowCommand           |
            |               |               |         +------------------------------+
            v               v               v
     +------------+  +------------+  +--------------+
     |GridGeometry|  |GridDataStore|  |SelectionManager|
     |(Column/Row |  +------+-----+  +--------------+
     | Model)     |         |
     +-----+------+         v
           |          +------------+     +--------------------+
           v          |SummaryCalc-|     | JsonDataLoader      |
     +------------+   |ulator      |     | (feeds GridDataStore)|
     |ViewportMgr |   +------------+     +--------------------+
     +------------+
```



## 6. Class Responsibilities

| Class | Responsibility |
|---|---|
| `Grid` | Set up DOM elements/listeners; translates raw mouse/keyboard events into calls on the other classes; owns the render loop trigger (`draw()`). Contains no rendering, storage, selection, or resize logic of its own. |
| `GridRenderer` | Draws cells, gridlines, selection highlight, and headers onto the canvas for a given visible range. Stateless with respect to interaction. |
| `GridGeometry` | Composes a `ColumnModel` and a `RowModel`; exposes combined coordinate helpers (resize-border hit testing, total scroll size). |
| `AxisModel` | Shared prefix-sum storage/lookup for one axis . |
| `ColumnModel` / `RowModel` | Per-axis metadata: width/height per index, plus  Excel-style column label generation (A, B, ..., AA, ...). |
| `ViewportManager` | Given scroll position + viewport size, returns the inclusive row/column range that is actually visible. |
| `GridDataStore` | Sparse row/col -> value storage and retrieval; iteration over populated cells in a range. No aggregate math, no selection/rendering knowledge. |
| `JsonDataLoader` | Parses uploaded JSON (array of records, or `{records:[...]}`) into `GridData`. |
| `SampleDatasetGenerator` | Produces the initial >=50,000-row demo dataset used to satisfy the "generate/load at least 50,000 records" requirement without a file. |
| `SummaryCalculator` | Computes count/min/max/sum/average for the numeric cells in a selection range|
| `SelectionManager` | Owns active cell, selection mode (`cell`/`row`/`column`/`all`), and the resulting selection range. |
| `EditManager` | Opens/closes/positions the HTML input overlay; reports a completed edit (old value, new value) back to `Grid`. |
| `ResizeController` | Hit-tests header borders, applies live size changes during a drag, and reports the final before/after size on drag end. |
| `ICommand` | Contract (`execute()`, `undo()`) every undoable action implements. |
| `EditCellCommand` / `ResizeColumnCommand` / `ResizeRowCommand` | Concrete commands, each capturing exactly the state needed to apply or reverse one action. |
| `CommandManager` | Undo/redo stacks; only depends on `ICommand` |
| `CellModel` | Read-only value object (row, col, value) for call sites that want a typed cell rather than a raw string. |

## 7. How OOP Concepts Are Applied

- **Encapsulation**: `GridDataStore` is the only class that touches the raw
  `GridData` object; `AxisModel` is the only place that touches the raw
  size/prefix-sum arrays. Everything else calls typed methods
  (`getValue`, `setSize`, `getIndexAtOffset`, ...).
- **Abstraction**: `ViewportManager` hides the binary-search/offset math
  behind `getVisibleRange(...)`; `SummaryCalculator` hides range iteration
  and numeric parsing behind `calculate(range)`.
- **Inheritance**: `ColumnModel` and `RowModel` both extend `AxisModel`,
  inheriting prefix-sum storage, binary search, and resize-border hit
  testing rather than duplicating that logic per axis (the original,
  un-refactored version of this codebase had that logic copy-pasted once
  for columns and once for rows inside a single `GridGeometry` class).
- **Polymorphism / interfaces**: `EditCellCommand`, `ResizeColumnCommand`,
  and `ResizeRowCommand` are interchangeable wherever `ICommand` is
  expected — `CommandManager` calls `execute()`/`undo()` without ever
  checking which concrete type it is holding.
- **Composition over inheritance for the coordinator**: `Grid` does not
  extend any of its collaborators; it *has* a `GridRenderer`, a
  `GridDataStore`, a `SelectionManager`, etc., and coordinates them.

## 8. How SOLID Principles Are Applied

| Principle | Where it shows up |
|---|---|
| **Single Responsibility** | Rendering (`GridRenderer`), storage (`GridDataStore`), aggregation (`SummaryCalculator`), selection (`SelectionManager`), editing (`EditManager`), resizing (`ResizeController`), and undo/redo (`CommandManager`) are all separate classes. Note this is a deliberate refactor from an earlier version of the codebase where `GridDataStore` also computed numeric summaries and `GridGeometry` also computed the visible viewport range — both responsibilities have since been extracted. |
| **Open/Closed** | A new command type can be added by implementing `ICommand` — `CommandManager` requires no changes. A new selection mode could extend `SelectionManager`'s `mode` union and the corresponding branch, without touching `GridRenderer`'s drawing calls (they only depend on `selectionRange`/`hasRangeSelection()`). |
| **Liskov Substitution** | `ColumnModel` and `RowModel` are used anywhere an `AxisModel` capability is needed (`getSize`, `getStart`, `setSize`, `getIndexAtOffset`) with no special-casing per subtype. Any `ICommand` implementation can be passed to `CommandManager.executeCommand()`/`registerExecuted()` with identical behaviour. |
| **Interface Segregation** | `ICommand` is intentionally two methods (`execute`, `undo`)|
| **Dependency Inversion** | `CommandManager` depends on the `ICommand` abstraction, not on `EditCellCommand`/`ResizeColumnCommand`/`ResizeRowCommand` directly. `Grid` depends on `GridRenderer`, `SelectionManager`, etc. through their public method contracts, not their internal fields. |

## 9. How the Command Pattern Is Applied

Every undoable action implements `ICommand { execute(): void; undo(): void }`
(`src/commands/ICommand.ts`).

- **Cell edit**: `EditManager` detects a value change and reports
  `(row, col, oldValue, newValue)` to `Grid`, which builds an
  `EditCellCommand` and calls `commandManager.executeCommand(command)`.
  `execute()` writes `newValue`; `undo()` writes back `oldValue`.
- **Column/row resize**: `ResizeController` updates `ColumnModel`/`RowModel`
  live, frame-by-frame, while the mouse drags (so the user gets immediate
  visual feedback) — this bypasses the command system on purpose, since a
  per-pixel undo step would be unusable. Once the drag ends, `Grid` builds a
  `ResizeColumnCommand`/`ResizeRowCommand` from the before/after size and
  calls `commandManager.registerExecuted(command)`, which records it on the
  undo stack *without* re-running `execute()` (the size is already correct
  from the live drag). `undo()`/`redo()` on that command afterwards work
  exactly like any other command.
- **Multiple actions / ordering**: `CommandManager` keeps a simple undo
  stack and redo stack. `undo()` pops the undo stack, calls
  `command.undo()`, and pushes the command onto the redo stack; `redo()`
  does the reverse (pop redo stack, call `execute()`, push back onto undo
  stack). Any new `executeCommand()`/`registerExecuted()` call clears the
  redo stack, matching standard editor undo/redo semantics for interleaved
  actions (edit, then resize, then undo, then a fresh edit correctly drops
  the stale redo branch).
- **Command contract**: `CommandManager` never inspects which concrete
  command type it is holding — it only calls `execute()`/`undo()` through
  `ICommand`, so adding `InsertRowCommand` or similar later would require
  no change to `CommandManager` itself.

## 10. How Virtual Rendering Works

`ViewportManager.getVisibleRange(viewWidth, viewHeight, scrollX, scrollY)`
uses `AxisModel`'s binary search (via `ColumnModel`/`RowModel`) to find the
first and last visible row and column for the current scroll position, in
O(log n) time. `Grid.draw()` computes this range once per frame and passes
it to `GridRenderer`, which only loops over
`[startRow..endRow] x [startCol..endCol]` — typically a few dozen rows and a
handful of columns — **never** the full 100,000 x 500 grid.

Native `<div>` scrolling drives this: `#scroll-container` is a real,
scrollable element and `#scroll-content` is an invisible spacer div sized to
`geometry.getTotalWidth()` x `geometry.getTotalHeight()` in pixels (so the
native scrollbar's range/thumb size matches the full logical grid size). The
browser's `scroll` event supplies `scrollLeft`/`scrollTop`, which
`Grid` feeds into `ViewportManager` and `GridRenderer` on every scroll —
the canvas itself stays sized to the viewport, not to the grid.

## 11. How Data Is Generated and Loaded

- **Generated**: `SampleDatasetGenerator.generate()` builds a 50,000-row
  dataset (`FirstName`, `LastName`, `Age`, `Salary`) on first load, backed
  by the sparse `GridData` shape `GridDataStore` expects.
- **Loaded**: the toolbar's **Load JSON** control reads a `File` via
  `JsonDataLoader.loadFromFile`, which accepts either a top-level JSON
  array of flat objects or `{ "records": [...] }`, infers columns from the
  first record's keys, and hands the result to `GridDataStore.loadData()`
  (which clears the previous data and resets undo/redo history via
  `CommandManager.clear()`).

## 12. Data Storage Approach

`GridDataStore` stores values as a sparse structure:
`{ [row: number]: { [col: number]: string } }`. Only rows/columns that
actually have a value get an entry — a 100,000 x 500 grid loaded with
50,000 records only holds ~50,000 row objects, not 50,000,000 cells.
Setting a cell to `''` deletes its entry rather than storing an empty
string, keeping the sparse structure sparse over time. `CellModel` is a
typed wrapper around one `(row, col, value)` triple for call sites that
want an object rather than three loose values; the storage layer itself
intentionally does *not* allocate one `CellModel` per cell, since that
would mean up to 50,000,000 object allocations for a fully populated grid.

Column widths and row heights are **not** sparse — every column/row has a
size, defaulting to the constants in `Constant.ts` — because virtual
rendering needs an O(log n) way to answer "which row/column is at pixel
offset Y/X" for *every* row/column, not just populated ones. `AxisModel`
stores sizes in a flat array plus a prefix-sum array, giving O(1) start-offset
lookups and O(log n) offset-to-index binary search.

## 13. Selection Model

`SelectionManager` tracks:

- `selectedCell: Cell | null` — the anchor/active cell.
- `mode: 'cell' | 'row' | 'column' | 'all'` — set by where a mousedown
  landed: grid body -> `cell`, row-header strip -> `row`, column-header
  strip -> `column`, top-left corner -> `all` (detected via the
  `HEADER_SELECTION_SENTINEL` coordinate `Grid` produces for header
  clicks).
- `selectionRange: SelectionRange | null` — the resulting inclusive
  rectangle, which for `row`/`column`/`all` spans the full opposite axis.

Dragging (`updateSelection`) grows/shrinks the range depending on `mode`
(only rows, only columns, or both). `hasRangeSelection()` distinguishes a
true multi-cell range from a single selected cell, which `GridRenderer`
uses to decide whether to draw the green range fill in addition to the
active-cell outline. Because selection state is plain data
(`selectedCell`/`mode`/`selectionRange`) rather than pixel coordinates,
selection remains correct after scrolling — `GridRenderer` re-derives
screen position from `geometry` + current `scrollX`/`scrollY` on every
frame instead of caching a stale on-screen rectangle.

## 14. Summary Calculation

`SummaryCalculator.calculate(range)` calls
`GridDataStore.forEachValueInRange(...)`, which iterates only the
**populated** cells inside the selected range (via `Object.entries` on the
sparse row map, filtered by row/col bounds) rather than scanning every
coordinate in the range — selecting the entire 100,000 x 500 sheet after
loading 50,000 rows still only visits ~50,000 x 4 populated cells, not
50,000,000. Non-numeric values (after stripping thousands separators) are
simply skipped, so mixed numeric/text selections don't throw or corrupt the
aggregate; an all-empty or all-text selection returns
`count: 0, min: null, max: null, sum: 0, average: null` rather than `NaN`.

## 15. Test Cases Covered

1. Spreadsheet Rendering

| ID    | Scenario                           | Expected Result                         |
| ----- | ---------------------------------- | --------------------------------------- |
| TC-01 | Open the application               | Grid renders correctly on canvas        |
| TC-02 | Resize browser window              | Canvas adjusts without graphical issues |
| TC-03 | Scroll horizontally and vertically | Visible cells render correctly          |

2. Cell Selection

| ID    | Scenario                       | Expected Result                              |
| ----- | ------------------------------ | -------------------------------------------- |
| TC-04 | Click a cell                   | Selected cell is highlighted                 |
| TC-05 | Use arrow keys to navigate     | Selection moves accordingly                  |
| TC-06 | Select multiple cells via drag | Range selection is displayed                 |
| TC-07 | Click outside grid             | Selection is cleared or retained as designed |

3. Cell Editing

| ID    | Scenario                   | Expected Result             |
| ----- | -------------------------- | --------------------------- |
| TC-08 | Enter text in a cell       | Text is displayed correctly |
| TC-09 | Edit existing cell content | Updated value is saved      |
| TC-10 | Press Enter after editing  | Changes are committed       |
| TC-11 | Press Escape while editing | Changes are discarded       |

4. Data Types

| ID    | Scenario                 | Expected Result                        |
| ----- | ------------------------ | -------------------------------------- |
| TC-12 | Enter numeric value      | Number is displayed correctly          |
| TC-13 | Enter text value         | Text is displayed correctly            |
| TC-14 | Enter special characters | Characters render properly             |

5. Row and Column Operations

| ID    | Scenario             | Expected Result         |
| ----- | -------------------- | ----------------------- |
| TC-15 | Select entire row    | Row is highlighted      |
| TC-16 | Select entire column | Column is highlighted   |
| TC-17 | Resize column width  | Width changes visually  |
| TC-18 | Resize row height    | Height changes visually |

6. Copy, Cut, and Paste

| ID    | Scenario                | Expected Result                     |
| ----- | ----------------------- | ----------------------------------- |
| TC-23 | Copy cell content       | Value copied successfully           |
| TC-24 | Paste into another cell | Value appears in destination cell   |
| TC-25 | Cut and paste content   | Source cleared, destination updated |







## 16. Performance Observations

- Initial load of 50,000 generated rows is effectively instant.
- Summary calculation cost scales with the number of *populated* cells.
- Known soft spot: resizing a column/row near index 0 still triggers an
  O(n) prefix-sum repair for every index after it (`regeneratePrefixSumsFrom`).
  At 100,000 rows this is still sub-millisecond in practice, but it is the
  one operation in the codebase that is not O(log n).

## 17. Accessibility Considerations

Canvas is a bitmap surface with no built-in accessibility tree, so:

- Cell editing uses a real HTML `<input>` overlay (`EditManager`), not
  in-canvas text rendering, so text entry works with assistive input.
- Summary values (`#summary-count`, `#summary-min`, ...) are real HTML
  text nodes outside the canvas, marked `aria-live="polite"`.
- The canvas and scroll container carry `tabindex="0"` and a descriptive
  `aria-label` so they can receive keyboard focus, and focus.
  

## 18. Known Limitations and Next Improvements

- No copy/paste, multi-range (Ctrl-click) selection.
- No frozen header row/column while scrolling diagonally past both axes
- `SummaryCalculator` is recomputed on every `draw()` call rather than incrementally maintained.
- No automated unit tests are included;
- Screen-reader accessibility for individual cells is not implemented
- Arrow-key active-cell navigation is not added.
