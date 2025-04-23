import { ethers } from 'ethers';
import { UserOperation } from './interface/UserOperation.js';
import {
  IBundler,
  StateOverride,
  UserOpDetail,
  UserOpGas,
  UserOpReceipt,
} from './interface/IBundler.js';
import { UserOpErrorCodes, UserOpErrors } from './interface/IUserOpErrors.js';
import { Ok, Err, Result } from '@elytro/result';
import { userOperationToJSON } from './tools/convert.js';

export class Bundler implements IBundler {
  private bundler: ethers.JsonRpcProvider;

  constructor(bundler: string | ethers.JsonRpcProvider) {
    if (typeof bundler === 'string') {
      this.bundler = new ethers.JsonRpcProvider(bundler, undefined, {
        batchMaxCount: 1,
      });
    } else {
      this.bundler = bundler;
    }
  }

  async eth_sendUserOperation(
    entryPoint: string,
    userOp: UserOperation
  ): Promise<Result<string, UserOpErrors>> {
    try {
      const userOpHash = await this.bundler.send('eth_sendUserOperation', [
        JSON.parse(userOperationToJSON(userOp)),
        entryPoint,
      ]);
      return new Ok(userOpHash);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subError = (<any>error).error;
        if (
          typeof subError === 'object' &&
          typeof subError.code === 'number' &&
          typeof subError.message === 'string'
        ) {
          return new Err(
            new UserOpErrors(
              subError.code,
              subError.message,
              typeof subError.data === 'object' ? subError.data : undefined
            )
          );
        } else {
          return new Err(
            new UserOpErrors(UserOpErrorCodes.UnknownError, error.message)
          );
        }
      } else {
        return new Err(
          new UserOpErrors(UserOpErrorCodes.UnknownError, 'unknown error')
        );
      }
    }
  }

  async eth_estimateUserOperationGas(
    entryPoint: string,
    userOp: UserOperation,
    stateOverride?: Record<string, StateOverride>
  ): Promise<Result<UserOpGas, UserOpErrors>> {
    try {
      const params = [JSON.parse(userOperationToJSON(userOp)), entryPoint];
      if (stateOverride !== undefined) {
        params.push(stateOverride);
      }
      const userOpGas = (await this.bundler.send(
        'eth_estimateUserOperationGas',
        params
      )) as UserOpGas;
      if (userOpGas === null) {
        return new Err(
          new UserOpErrors(UserOpErrorCodes.UnknownError, 'unknown error')
        );
      } else {
        return new Ok(userOpGas);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subError = (<any>error).error;
        if (
          typeof subError === 'object' &&
          typeof subError.code === 'number' &&
          typeof subError.message === 'string'
        ) {
          return new Err(
            new UserOpErrors(
              subError.code,
              subError.message,
              typeof subError.data === 'object' ? subError.data : undefined
            )
          );
        } else {
          return new Err(
            new UserOpErrors(UserOpErrorCodes.UnknownError, error.message)
          );
        }
      } else {
        return new Err(
          new UserOpErrors(UserOpErrorCodes.UnknownError, 'unknown error')
        );
      }
    }
  }

  async eth_getUserOperationByHash(
    userOpHash: string
  ): Promise<Result<null | UserOpDetail, Error>> {
    try {
      const ret = await this.bundler.send('eth_estimateUserOperationGas', [
        userOpHash,
      ]);
      return new Ok(ret);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        console.error(error);
        return new Err(new Error('unknown error'));
      }
    }
  }

  async eth_getUserOperationReceipt(
    userOpHash: string
  ): Promise<Result<null | UserOpReceipt, Error>> {
    try {
      const ret = await this.bundler.send('eth_getUserOperationReceipt', [
        userOpHash,
      ]);
      return new Ok(ret);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        console.error(error);
        return new Err(new Error('unknown error'));
      }
    }
  }

  async eth_supportedEntryPoints(): Promise<Result<string[], Error>> {
    try {
      const ret = await this.bundler.send('eth_supportedEntryPoints', []);
      if (Array.isArray(ret)) {
        return new Ok(ret);
      } else {
        return new Err(new Error('unknown error'));
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        console.error(error);
        return new Err(new Error('unknown error'));
      }
    }
  }

  async eth_chainId(): Promise<Result<number, Error>> {
    try {
      const chain = await this.bundler.send('eth_chainId', []);
      return new Ok(parseInt(chain));
    } catch (error: unknown) {
      if (error instanceof Error) {
        return new Err(error);
      } else {
        console.error(error);
        return new Err(new Error('unknown error'));
      }
    }
  }
}
