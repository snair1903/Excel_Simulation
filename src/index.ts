import { ExcelGrid } from "./ExcelGrid.js";

window.addEventListener('load', () => {
    const grid = new ExcelGrid();
    window.addEventListener('resize', () => grid.initCanvasScaling());
});
