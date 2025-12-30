# Social Charges Calculation Policy (Working Days + Leave Adjusted Model)

## 1. Core Principles

✅ **Salary is always paid in full for paid leaves.** All leave types are paid.

✅ **Social Charges are variable** and depend on:
   - Actual working days
   - Attendance status
   - Leave days

✅ **Leave cost is recovered from Social Charges, not salary.**

✅ **Unpaid Social Charges are accumulated** in balance and payable later by admin.

---

## 2. Attendance Categories & Impact

| Status | Salary | Social Charges |
|---------|---------|----------------|
| P – Present | Paid | Earned |
| W – Weekend | Paid | Earned |
| H – National Holiday | Paid | Earned |
| T – Tour / Site Visit | Paid | Earned |
| WH – Work From Home | Paid | Earned |
| SL / CL / EL / CO | Paid | **Deducted** |
| A – Absent | Not Paid | Not Earned |
| CD – COVID Leave | Paid | Not Earned |

---

## 3. Monthly Working Days Rule

Social Charges are earned **ONLY** on eligible days:
- Present (P)
- Weekend (W)
- Holiday (H)
- Tour / Site Visit (T)
- Work From Home (WH)

**Leave days are excluded from earning days.**

**Absent days are excluded from both salary and SC.**

---

## 4. Monthly Base Calculations

### Daily Salary Rate
```
Daily Salary Rate = Monthly Salary / Total Days in Month
```

### Monthly Social Charges
```
Monthly SC = Monthly Salary × 20%
```

### Daily SC Rate
```
Daily SC Rate = Monthly SC / Total Days in Month
```

---

## 5. Working-Day Based Social Charges

### Eligible Days
```
Eligible Days = P + W + H + T + WH
```

### Working Ratio
```
Working Ratio = Eligible Days / Total Days in Month
```

### Earned Social Charges
```
Earned Social Charges = Monthly SC × Working Ratio
```

---

## 6. Leave-Based Social Charges Deduction

For every leave day (SL, CL, EL, CO):
```
Leave Deduction = Daily Salary Rate × Leave Days
```

This amount is:
- **Deducted from earned social charges**
- **Added to Social Charges Balance**
- **Payable later by admin**

---

## 7. Final Monthly Social Charges Formula

```
Final Payable SC = (Monthly SC × Working Ratio) − (Daily Salary Rate × Leave Days)
```

**If result is negative:**
```
Payable SC = 0
Entire amount moves to SC Balance
```

---

## 8. Social Charges Component Structure (20%)

| Component | Percentage | Type |
|-----------|-------------|-------|
| Other Payable | 8.33% | Earned |
| Earned Leave (EL) | 8.33% | Earned |
| Sick Leave (SL) | 1.67% | Earned |
| Casual Leave (CL) | 1.67% | Earned |
| **Total** | **20.00%** | |

**Each component is adjusted proportionally to final SC value.**

---

## 9. Example (December 2023)

### Given:
- **Monthly Salary**: 455,000 PKR
- **Days in month**: 31
- **Eligible working days**: 29 (P, W, H, T, WH)
- **Leave days**: 2 (CL)

### Step-by-Step Calculation:

**1. Daily Salary Rate:**
```
Daily Salary Rate = 455,000 / 31 = 14,677.42 PKR
```

**2. Monthly SC:**
```
Monthly SC = 455,000 × 20% = 91,000 PKR
```

**3. Working Ratio:**
```
Working Ratio = 29 / 31 = 0.9355 (93.55%)
```

**4. Earned Social Charges:**
```
Earned SC = 91,000 × 0.9355 = 85,145 PKR
```

**5. Leave Deduction:**
```
Leave Deduction = 14,677.42 × 2 = 29,354.84 PKR
```

**6. Final Payable Social Charges:**
```
Final Payable SC = 85,145 - 29,354.84 = 55,790.16 PKR
```

### Monthly Summary:
- **Salary Paid**: 455,000 PKR
- **SC Paid Now**: 55,790 PKR
- **SC Balance Added**: 29,354 PKR (to be paid later)

---

## 10. Admin Controls

Admin can:
- ✅ Edit attendance per day and project
- ✅ Recalculate payroll instantly
- ✅ Approve SC payments
- ✅ Hold or release SC balance
- ✅ Generate monthly payroll
- ✅ Generate project-wise cost reports
- ✅ Generate employee yearly summaries
- ✅ Generate SC liability reports

---

## 11. Audit & Compliance

✅ Every attendance change recalculate:
   - Working ratio
   - Leave deductions
   - SC balance

✅ Full history preserved

✅ Month locking supported

---

## 12. Key Differences from Previous Policy

### Changed (NEW):
1. **Tour (T) and Work From Home (WH) now EARN social charges**
   - Previously: These were leave types (no SC)
   - Now: These are work days (earn SC)

2. **Leave deduction formula changed**
   - Previously: Deferred = Daily Salary × Leave Days × 20%
   - Now: Leave Deduction = Daily Salary Rate × Leave Days

3. **SC eligibility days expanded**
   - Previously: P, W, H only
   - Now: P, W, H, T, WH

### Unchanged:
- All leave types still receive full salary
- Leave days still have SC deducted
- 20% total SC rate maintained
- Component breakdown maintained (SL 1.67%, CL 1.67%, EL 8.33%, Other 8.33%)
- SC balance and payment management

---

## 13. Calculation Flow Summary

```
1. Count paid days = All except Absent
2. Count eligible days = P, W, H, T, WH
3. Count leave days = CL, SL, EL, CO
4. Calculate Daily Salary Rate = Monthly Salary / Total Days
5. Calculate Monthly SC = Monthly Salary × 20%
6. Calculate Working Ratio = Eligible Days / Total Days
7. Calculate Earned SC = Monthly SC × Working Ratio
8. Calculate Leave Deduction = Daily Salary Rate × Leave Days
9. Calculate Final Payable SC = Earned SC - Leave Deduction
10. If negative, move entire amount to SC Balance
11. Distribute SC proportionally to components (SL, CL, EL, Other)
```

This ensures:
✅ Salary is paid for all worked + leave days
✅ SC only earned on actual working days
✅ Leave cost recovered from SC, not salary
✅ Accurate tracking of deferred amounts
