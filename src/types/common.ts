// Authored by - Sarthak Kumar
//
// common types: callback shapes shared across components and hooks.

export type Callback = () => void;
export type Callback1<T> = (arg: T) => void;
