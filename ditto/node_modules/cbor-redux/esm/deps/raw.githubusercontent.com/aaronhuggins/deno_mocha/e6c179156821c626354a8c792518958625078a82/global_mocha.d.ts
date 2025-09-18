import { describe as describeImpl, after as afterImpl, afterEach as afterEachImpl, before as beforeImpl, beforeEach as beforeEachImpl, it as itImpl } from "./deno_mocha.js";
declare global {
    let describe: typeof describeImpl;
    let after: typeof afterImpl;
    let afterEach: typeof afterEachImpl;
    let before: typeof beforeImpl;
    let beforeEach: typeof beforeEachImpl;
    let it: typeof itImpl;
}
