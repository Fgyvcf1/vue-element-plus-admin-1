/**
 * 通用类型定义
 */

export type Fn<T = any> = (...arg: T[]) => T

export type Nullable<T> = T | null

export type Recordable<T = any, K extends string = string> = Record<K, T>

export type ElRef<T extends HTMLElement = HTMLDivElement> = Nullable<T>

export type RemoveReadonly<T> = {
  -readonly [P in keyof T]: T[P]
}

export type ComponentRef<T extends abstract new (...args: any) => any> = InstanceType<T>

export type TimeoutHandle = ReturnType<typeof setTimeout>

export type IntervalHandle = ReturnType<typeof setInterval>
