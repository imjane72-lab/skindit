export const CREDIT_COSTS = {
  analysis: 1,
  chat: 1,
  report_trouble: 10,
  report_treatment: 10,
  report_derma: 15,
} as const;

export const DAILY_FREE = {
  analysis: 3,
  chat: 10,
} as const;

export const PACKAGES = {
  basic: { credits: 50, price: 3000 },
  standard: { credits: 100, price: 5000 },
  premium: { credits: 200, price: 9000 },
} as const;
