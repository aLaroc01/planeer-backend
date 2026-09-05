"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorCount = exports.incrementErrorCount = void 0;
// errorCounter.ts
let errorCount = 0;
/**
 * Error count বাড়ানোর ফাংশন
 */
const incrementErrorCount = () => {
    errorCount += 1;
};
exports.incrementErrorCount = incrementErrorCount;
/**
 * বর্তমানে কতবার error হয়েছে তা ফেরত দেয়
 */
const getErrorCount = () => {
    return errorCount;
};
exports.getErrorCount = getErrorCount;
