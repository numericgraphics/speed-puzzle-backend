export const getCollectionPropertyValue = <
  T extends Record<string, unknown>,
  K extends keyof T
>(
  arr: T[],
  property: K
): Array<T[K]> => {
  return arr.map((a) => a[property]);
};
