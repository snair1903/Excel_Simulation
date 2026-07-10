export interface Cell{
    row: number;
    col: number;
}

export interface GridData {
    [row: number]: { [col: number]: string };
}

let dataset:GridData = { 0: { 0: "FirstName", 1: "LastName", 2: "Age", 3: "Salary" }}
for (let i = 1; i < 50000; i++) {
  dataset[i] = {
    0:"smit"+i,
    1:"warang"+Math.floor(Math.random()*1000),
    2:""+Math.floor(Math.random()*100)+" yrs",
    3:""+Math.floor(Math.random()*10000)
  };
}

 export interface SelectionRange {
    startRow: number;
    startColumn: number;
    endRow:number;
    endColumn:number;
}

export type EditAction =
    | { type: 'cell-edit'; row: number; col: number; oldValue: string; newValue: string }
    | { type: 'col-resize'; col: number; oldWidth: number; newWidth: number }
    | { type: 'row-resize'; row: number; oldHeight: number; newHeight: number };



export const initialSparseData: GridData = dataset

