// errorCounter.ts
let errorCount = 0;

/**
 * Error count বাড়ানোর ফাংশন
 */
export const incrementErrorCount = () => {
  errorCount += 1;
};

/**
 * বর্তমানে কতবার error হয়েছে তা ফেরত দেয়
 */
export const getErrorCount = () => {
  return errorCount;
};