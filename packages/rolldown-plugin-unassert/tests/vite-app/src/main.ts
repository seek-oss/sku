import { normalizedScore } from './stats.ts';

const resultElement = document.querySelector<HTMLOutputElement>('#result');
if (!resultElement) {
  throw new Error('Missing #result element');
}

resultElement.textContent = `Score: ${normalizedScore([7, 9, 10], 10).toFixed(2)}`;
