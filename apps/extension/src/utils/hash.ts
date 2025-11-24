import { keccak256, encodeAbiParameters, AbiParameter, encodePacked } from 'viem';

function findTypeDependencies(
  primaryType: string,
  types: EIP712Type['types'],
  deps: Set<string> = new Set()
): Set<string> {
  deps.add(primaryType);
  for (const field of types[primaryType]) {
    if (types[field.type] && !deps.has(field.type)) {
      findTypeDependencies(field.type, types, deps);
    }
  }
  return deps;

  // todo: more efficient way to find type dependencies?
  // const deps = new Set<string>();
  // const queue = [primaryType];

  // while (queue.length > 0) {
  //   const currentType = queue.shift()!;
  //   deps.add(currentType);
  //   for (const field of types[currentType]!) {
  //     if (types[field.type] && !deps.has(field.type)) {
  //       queue.push(field.type);
  //     }
  //   }
  // }
  // return deps;
}

function encodeType(primaryType: string, types: EIP712Type['types']): string {
  let result = '';
  const deps = findTypeDependencies(primaryType, types);
  deps.delete(primaryType);

  const sorted = [primaryType, ...Array.from(deps).sort()];
  for (const type of sorted) {
    result += `${type}(${types[type].map(({ name, type }) => `${type} ${name}`).join(',')})`;
  }

  return result;
}

function hashType(primaryType: string, types: EIP712Type['types']): `0x${string}` {
  const encodedType = encodeType(primaryType, types);
  return keccak256(encodePacked(['string'], [encodedType]));
}
function encodeData(primaryType: string, data: Record<string, SafeAny>, types: EIP712Type['types']): `0x${string}` {
  const encodedTypes: Array<AbiParameter> = [{ type: 'bytes32' }];
  const encodedValues: Array<SafeAny> = [hashType(primaryType, types)];

  function getArrayType(baseType: string): string {
    return types[baseType] ? 'bytes32' : baseType;
  }

  for (const field of types[primaryType]) {
    let value = data[field.name];
    if (types[field.type]) {
      // Complex type
      encodedTypes.push({ type: 'bytes32' });
      value = hashStruct(field.type, value, types);
    } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
      // Array type
      const baseType = field.type.slice(0, field.type.lastIndexOf('['));
      encodedTypes.push({ type: 'bytes32' });
      value = keccak256(
        encodeAbiParameters(
          [{ type: `${getArrayType(baseType)}[]` }],
          [value.map((item: SafeAny) => encodeArrayItem(baseType, item, types))]
        )
      );
    } else {
      // Simple type
      encodedTypes.push({ type: field.type });
    }
    encodedValues.push(value);
  }

  return encodeAbiParameters(encodedTypes, encodedValues);
}

function encodeArrayItem(baseType: string, item: SafeAny, types: EIP712Type['types']): SafeAny {
  if (types[baseType]) {
    return hashStruct(baseType, item, types);
  }
  if (baseType === 'string' || baseType === 'bytes') {
    return keccak256(encodePacked([baseType], [item]));
  }
  return item;
}

function hashStruct(primaryType: string, data: Record<string, SafeAny>, types: EIP712Type['types']): `0x${string}` {
  return keccak256(encodeData(primaryType, data, types));
}

function hashDomain(domain: EIP712Domain, domainFields: Array<{ name: string; type: string }>): `0x${string}` {
  const activeFields = domainFields.filter(
    (field) =>
      (domain as Record<string, SafeAny>)[field.name] !== null &&
      (domain as Record<string, SafeAny>)[field.name] !== undefined
  );
  return hashStruct('EIP712Domain', domain, { EIP712Domain: activeFields });
}

/**
 * Hash EIP712 typed data
 */
export const hashSignTypedData = ({ domain, types, primaryType, message }: EIP712Type): `0x${string}` => {
  const domainSeparator = hashDomain(domain, types.EIP712Domain);
  const structHash = hashStruct(primaryType, message, types);
  return keccak256(encodePacked(['bytes2', 'bytes32', 'bytes32'], ['0x1901', domainSeparator, structHash]));
};

/**
 * Hash eth_signTypedData data
 */
export function hashEarlyTypedData(data: TTypedDataItem[]) {
  const encodedData: Array<string | number> = [];

  for (const item of data) {
    encodedData.push(item.type);
    encodedData.push(item.name);
    if (item.type === 'string' || item.type === 'bytes') {
      encodedData.push(keccak256(encodePacked([item.type], [item.value])));
    } else {
      encodedData.push(item.value);
    }
  }

  return keccak256(encodePacked(Array(encodedData.length).fill('string'), encodedData));
}
