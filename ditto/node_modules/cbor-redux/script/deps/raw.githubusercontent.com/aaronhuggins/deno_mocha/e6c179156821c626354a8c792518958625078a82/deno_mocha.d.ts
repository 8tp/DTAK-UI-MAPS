type Done = (err?: any) => void;
/** Callback function used for tests and hooks. */
type Func = (done: Done) => void;
/** Async callback function used for tests and hooks. */
type AsyncFunc = () => PromiseLike<any>;
export declare function describe(name: string, fn: () => void): void;
export declare function before(fn: Func | AsyncFunc): void;
export declare function beforeEach(fn: Func | AsyncFunc): void;
export declare function after(fn: Func | AsyncFunc): void;
export declare function afterEach(fn: Func | AsyncFunc): void;
export declare function it(name: string, fn: Func | AsyncFunc): void;
export {};
