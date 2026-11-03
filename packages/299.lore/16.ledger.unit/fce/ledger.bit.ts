export default interface LedgerBit<T = any> {
    idx: string;
    src?: string;
    val?: number;
    dat?: T;
    slv?: Function;
}
