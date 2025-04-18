/**
 * Defines a Result type, which can be either Ok or Err.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * Defines an Ok class, representing a successful operation result.
 *
 * @export
 * @class Ok
 * @template T
 * @template E
 */
export class Ok<T, E> {
  private readonly _value: T | undefined = undefined;

  /**
   * Creates an instance of Ok.
   * @param {T} value
   * @memberof Ok
   */
  constructor(value: T) {
    this._value = value;
  }

  /**
   * Gets the successful result value.
   *
   * @readonly
   * @type {T}
   * @memberof Ok
   */
  get OK(): T {
    return this._value!;
  }

  /**
   * Gets the error.
   *
   * @readonly
   * @type {E}
   * @memberof Ok
   */
  get ERR(): E {
    throw new Error("Ok.ERR: Ok doesn't have error");
  }

  /**
   *
   *
   * @return {*}  {boolean}
   * @memberof Ok
   */
  isOk(): boolean {
    return true;
  }

  /**
   *
   *
   * @return {*} {boolean}
   * @memberof Ok
   */
  isErr(): boolean {
    return false;
  }
}

/**
 * Defines an Err class, representing a failed operation result.
 *
 * @export
 * @class Err
 * @template T
 * @template E
 */
export class Err<T, E> {
  private readonly _error: E | undefined = undefined;

  /**
   * Creates an instance of Err.
   * @param {E} error
   * @memberof Err
   */
  constructor(error: E) {
    this._error = error;
  }

  /**
   * Gets the successful result value.
   *
   * @readonly
   * @type {T}
   * @memberof Err
   */
  get OK(): T {
    throw new Error("Err.OK: Err doesn't have value");
  }

  /**
   * Gets the error.
   *
   * @readonly
   * @type {E}
   * @memberof Err
   */
  get ERR(): E {
    return this._error!;
  }

  /**
   *
   *
   * @return {*}  {boolean}
   * @memberof Err
   */
  isOk(): boolean {
    return false;
  }

  /**
   *
   *
   * @return {*}  {boolean}
   * @memberof Err
   */
  isErr(): boolean {
    return true;
  }
}
