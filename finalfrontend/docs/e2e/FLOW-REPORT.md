# E2E Flow Report

> Generated: **2026-06-03** · `npm run test:e2e`

## Summary

| Metric | Count |
|--------|------:|
| **Total results** | 132 |
| **Passed** | **121** |
| **Failed** | 0 |
| **Skipped** | 11 |
| **Pass rate** | **92%** |

## By project

| Project | Pass | Fail | Skip |
|---------|-----:|-----:|-----:|
| auth | 9 | 0 | 0 |
| flows | 39 | 0 | 11 |
| setup | 6 | 0 | 0 |
| smoke-admin | 12 | 0 | 0 |
| smoke-analytics | 1 | 0 | 0 |
| smoke-contributor | 13 | 0 | 0 |
| smoke-enterprise | 14 | 0 | 0 |
| smoke-mentor | 21 | 0 | 0 |
| smoke-public | 1 | 0 | 0 |
| smoke-reviewer | 5 | 0 | 0 |

## Commands

```bash
cd frontend && npm run test:e2e:smoke   # route smoke only
cd frontend && npm run test:e2e:flows    # golden paths + edge cases
cd frontend && npm run test:e2e          # full suite
cd frontend && npm run test:e2e:report   # HTML report
```
