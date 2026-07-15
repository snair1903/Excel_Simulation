import { Grid } from "./Grid.js";

window.addEventListener('load', () => {
    const grid = new Grid();
    window.addEventListener('resize', () => grid.initCanvasScaling());
});
