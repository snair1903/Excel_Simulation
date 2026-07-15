import {
    sampleRowCount,
    sampleAgeUpper,
    sampleSalaryUpper,
    sampleLastNameSuffix,
} from "../Constants/Constant.js";
import type { GridData } from "./Types.js";

export class SampleDatasetGenerator {
    public static generate(rowCount: number = sampleRowCount): GridData {
        const dataset: GridData = { 0: { 0: "FirstName", 1: "LastName", 2: "Age", 3: "Salary" } };

        for (let i = 1; i < rowCount; i++) {
            dataset[i] = {
                0: "smit" + i,
                1: "warang" + Math.floor(Math.random() * sampleLastNameSuffix),
                2: "" + Math.floor(Math.random() * sampleAgeUpper) + " yrs",
                3: "" + Math.floor(Math.random() * sampleSalaryUpper),
            };
        }

        return dataset;
    }
}
