'use stric';

const fib = (n: number): number => {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
};

module.exports = (n: number) => fib(n);
