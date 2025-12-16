export function roundUpAmount(value: number): number {
    const rounded = Math.ceil(value);
    return parseFloat((rounded - value).toFixed(2));
  }