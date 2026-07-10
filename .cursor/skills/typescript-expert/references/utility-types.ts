export type Brand<K, T> = K & { readonly __brand: T }

export type UserId = Brand<string, 'UserId'>
export type Email = Brand<string, 'Email'>
export type UUID = Brand<string, 'UUID'>
export type Timestamp = Brand<number, 'Timestamp'>
export type PositiveNumber = Brand<number, 'PositiveNumber'>

export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E }

export const ok = <T>(data: T): Result<T, never> => ({
    success: true,
    data
})

export const err = <E>(error: E): Result<never, E> => ({
    success: false,
    error
})

export type Option<T> = Some<T> | None
export type Some<T> = { type: 'some'; value: T }
export type None = { type: 'none' }

export const some = <T>(value: T): Some<T> => ({ type: 'some', value })
export const none: None = { type: 'none' }

export type DeepReadonly<T> = T extends (...args: any[]) => any
    ? T
    : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T

export type DeepPartial<T> = T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

export type DeepRequired<T> = T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T

export type DeepMutable<T> = T extends object
    ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
    : T

export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never
}[keyof T]

export type PickByType<T, V> = Pick<T, KeysOfType<T, V>>
export type OmitByType<T, V> = Omit<T, KeysOfType<T, V>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
export type ReadonlyBy<T, K extends keyof T> = Omit<T, K> & Readonly<Pick<T, K>>
export type Merge<T, U> = Omit<T, keyof U> & U

export type ElementOf<T> = T extends (infer E)[] ? E : never

export type Tuple<T, N extends number> = N extends N
    ? number extends N
        ? T[]
        : _TupleOf<T, N, []>
    : never

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>

export type NonEmptyArray<T> = [T, ...T[]]
export type AtLeast<T, N extends number> = [...Tuple<T, N>, ...T[]]

export type Arguments<T> = T extends (...args: infer A) => any ? A : never
export type FirstArgument<T> = T extends (first: infer F, ...args: any[]) => any ? F : never
export type AsyncFunction<T extends (...args: any[]) => any> = (
    ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>
export type Promisify<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : never

export type Split<S extends string, D extends string> =
    S extends `${infer T}${D}${infer U}`
        ? [T, ...Split<U, D>]
        : [S]

export type Join<T extends string[], D extends string> =
    T extends []
        ? ''
        : T extends [infer F extends string]
            ? F
            : T extends [infer F extends string, ...infer R extends string[]]
                ? `${F}${D}${Join<R, D>}`
                : never

export type PathOf<T, K extends keyof T = keyof T> = K extends string
    ? T[K] extends object
        ? K | `${K}.${PathOf<T[K]>}`
        : K
    : never

export type UnionLast<T> = UnionToIntersection<
    T extends any ? () => T : never
> extends () => infer R
    ? R
    : never

export type UnionToIntersection<U> = (
    U extends any ? (k: U) => void : never
) extends (k: infer I) => void
    ? I
    : never

export type UnionToTuple<T, L = UnionLast<T>> = [T] extends [never]
    ? []
    : [...UnionToTuple<Exclude<T, L>>, L]

export type AssertEqual<T, U> =
    (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2)
        ? true
        : false

export type IsNever<T> = [T] extends [never] ? true : false
export type IsAny<T> = 0 extends 1 & T ? true : false
export type IsUnknown<T> = IsAny<T> extends true
    ? false
    : unknown extends T
        ? true
        : false

export type JsonPrimitive = string | number | boolean | null
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

export type Jsonify<T> = T extends JsonPrimitive
    ? T
    : T extends undefined | ((...args: any[]) => any) | symbol
        ? never
        : T extends { toJSON(): infer R }
            ? R
            : T extends object
                ? { [K in keyof T]: Jsonify<T[K]> }
                : never

export function assertNever(value: never, message?: string): never {
    throw new Error(message ?? `Unexpected value: ${value}`)
}

export function exhaustiveCheck(_value: never): void {
}
