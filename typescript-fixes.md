// Fix TypeScript errors by adding 'any' type annotations to parameters
// This is a quick fix for build readiness

// Admin Dashboard fixes
const adminDashboardFixes = [
  { file: 'app/[locale]/admin/dashboard/page.tsx', line: 352, param: 'user' },
  { file: 'app/[locale]/admin/dashboard/page.tsx', line: 427, param: 'job' },
  { file: 'app/[locale]/admin/dashboard/page.tsx', line: 574, param: 'dispute' },
];

// HR Dashboard fixes
const hrDashboardFixes = [
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 299, param: 'w' },
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 306, param: 'w' },
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 308, param: 'worker' },
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 325, param: 'skill' },
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 325, param: 'idx' },
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 347, param: 'w' },
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 365, param: 'dispute' },
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 626, param: 'skill' },
  { file: 'app/[locale]/admin/hr/dashboard/page.tsx', line: 626, param: 'idx' },
];

// Outsource Dashboard fixes
const outsourceDashboardFixes = [
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 313, param: 'project' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 386, param: 'client' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 488, param: 'c' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 501, param: 'p' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 515, param: 'p' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 516, param: 'sum' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 516, param: 'p' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 526, param: 'p' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 544, param: 'p' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 546, param: 'project' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 561, param: 'a' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 561, param: 'b' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 566, param: 'client' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 578, param: 'p' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 580, param: 'project' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 595, param: 'p' },
  { file: 'app/[locale]/admin/outsource/dashboard/page.tsx', line: 597, param: 'project' },
];

// Client Dashboard fixes
const clientDashboardFixes = [
  { file: 'app/[locale]/client/dashboard/page.tsx', line: 482, param: 'job' },
  { file: 'app/[locale]/client/dashboard/page.tsx', line: 798, param: 'd' },
  { file: 'app/[locale]/client/dashboard/page.tsx', line: 799, param: 'dispute' },
  { file: 'app/[locale]/client/dashboard/page.tsx', line: 850, param: 'd' },
];

// Worker Dashboard fixes
const workerDashboardFixes = [
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 213, param: 'prev' },
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 214, param: 'n' },
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 220, param: 'prev' },
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 229, param: 'prev' },
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 230, param: 'n' },
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 236, param: 'prev' },
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 1197, param: 'job' },
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 1271, param: 'app' },
  { file: 'app/[locale]/worker/dashboard/page.tsx', line: 1759, param: 'notification' },
];

console.log('TypeScript fixes needed for build readiness');
