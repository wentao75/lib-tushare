import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { name } from "./package.json";

export default {
    input: "src/tushare.js",
    external: [
        "moment",
        "lodash",
        "axios",
        "pino",
        "@wt/lib-flowcontrol",
        "@wt/lib-taskqueue",
        "@babel/runtime",
    ],
    plugins: [
        resolve(),
        babel({
            exclude: "node_modules/**",
            babelHelpers: "runtime",
        }),
        commonjs({
            include: "node_modules/**",
        }),
        terser(),
    ],
    output: [
        {
            file: "tushare.js",
            format: "umd",
            name,
            sourcemap: true,
        },
        {
            file: "tushare.esm.js",
            format: "es",
        },
    ],
};
