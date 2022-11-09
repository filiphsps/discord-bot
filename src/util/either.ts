/*
 * Copyright (c) 2022, the SerenityOS developers.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

type Failure<T> = {
    error: T;
    result?: never;
};
type Success<U> = {
    error?: never;
    result: U;
} | void;

export type Either<T, U> = Failure<T> | Success<U>;
export type UnwrapEither = <T, U>(e: Either<T, U>) => T | U;

export const unwrapEither = <T, U>(e: Either<T, U>): NonNullable<T | U> =>
    e?.error !== undefined ? (e?.error as T) : ((e ? e.result : e) as NonNullable<U>);

/*export const unwrapEither: UnwrapEither = <T, U>(e: Either<T, U>) =>
    e?.error !== undefined ? (e?.error as T) : (e as U);*/

export const createFailure = <T>(value: T): Failure<T> => ({ error: value });
export const createSuccess = <U>(value: U): Success<U> => ({ result: value });

export const isFailure = <T, U>(e: Either<T, U>): e is Failure<T> => e!.error !== undefined;
export const isSuccess = <T, U>(e: Either<T, U>): e is Success<U> => e!.error === undefined;
