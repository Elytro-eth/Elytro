import 'ses';
import type { LockdownOptions } from 'ses';

type SecurityConfig = {
  isUI?: boolean;
};

// ! This is a workaround to make lockdown work in the extension, otherwise lockdown will throw an error
if (typeof process === 'undefined' || !process.exit) {
  const globalObj = globalThis as SafeAny;
  globalObj.process = {
    ...globalObj.process,
    exit: (code: number) => {
      console.error(`Process exit called with code ${code}`);
    },
  };
}

export const initializeSecurity = ({ isUI = false }: SecurityConfig = {}) => {
  if (typeof lockdown !== 'function') {
    console.error('SES is not properly initialized');
    return;
  }

  const defaultLockdownConfig: LockdownOptions = {
    errorTaming: 'unsafe',
    overrideTaming: 'moderate',
    consoleTaming: 'unsafe',
    domainTaming: 'unsafe',
    evalTaming: 'unsafeEval',
    __hardenTaming__: 'unsafe',
  };

  const lockdownConfig: LockdownOptions = isUI
    ? defaultLockdownConfig
    : {
        ...defaultLockdownConfig,
        overrideTaming: 'severe',
        evalTaming: 'noEval',
        mathTaming: 'unsafe',
      };

  lockdown(lockdownConfig);

  if (isUI) {
    configureDOMSecurity();
  }
};

const configureDOMSecurity = () => {
  const dangerousAPIs = ['document.write', 'document.writeln', 'window.execScript'];

  dangerousAPIs.forEach((api) => {
    const [obj, prop] = api.split('.');
    try {
      // @ts-ignore
      Object.defineProperty(window[obj], prop, {
        get: () => {
          throw new Error(`${api} is disabled for security reasons`);
        },
        configurable: false,
      });
    } catch (e) {
      console.warn(`Failed to disable ${api}:`, e);
    }
  });

  document.addEventListener('securitypolicyviolation', (e) => {
    //
    if (e.violatedDirective !== 'script-src') {
      // TODO: handle CSP violation
      console.error('Elytro:: CSP violation:', e);
    }
  });
};

// export const safeEval = (
//   code: string,
//   context: Record<string, SafeAny> = {}
// ) => {
//   const compartment = new Compartment({
//     ...context,
//     console,
//   });

//   try {
//     return compartment.evaluate(code);
//   } catch (error) {
//     console.error('Elytro:: Safe eval failed:', error);
//     throw error;
//   }
// };
