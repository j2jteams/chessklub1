# Legacy Role Usage Report

**Date:** 2025-12-06  
**Purpose:** Comprehensive list of all occurrences of legacy roles `'admin'` and `'owner'` in the codebase

---

## Summary

This report identifies all locations where legacy roles `'admin'` and `'owner'` are used. These roles should be migrated to `'standaloneAdmin'` and `'superAdmin'` respectively.

**Total Files with Legacy Role Usage:** 18  
**Total Occurrences:** 55+

---

## 1. Route Protection (useRequireRole)

### 1.1 `src/app/owner/dashboard/page.tsx`
**Line 14:**
```typescript
useRequireRole(['owner']);
```
**Context:** Route protection for owner dashboard page

---

### 1.2 `src/app/admin/page.tsx`
**Line 13:**
```typescript
useRequireRole(['owner']);
```
**Context:** Route protection for admin management page (should be `'superAdmin'`)

---

### 1.3 `src/app/owner/layout.tsx`
**Line 10:**
```typescript
useRequireRole(['owner']);
```
**Context:** Layout-level protection for all `/owner/**` routes

---

### 1.4 `src/app/dashboard/admin/page.tsx`
**Line 29:**
```typescript
useRequireRole(['standaloneAdmin', 'franchisee', 'superAdmin', 'admin']);
```
**Context:** Route protection includes `'admin'` for backward compatibility

---

### 1.5 `src/app/admin/layout.tsx`
**Line 10:**
```typescript
useRequireRole(['superAdmin', 'franchisee', 'standaloneAdmin', 'admin', 'owner']);
```
**Context:** Layout-level protection includes both `'admin'` and `'owner'` for backward compatibility

---

### 1.6 `src/app/admin/events/edit/[id]/page.tsx`
**Line 20:**
```typescript
const { authorized } = useRequireRole(['superAdmin', 'franchisee', 'standaloneAdmin', 'admin', 'owner']);
```
**Context:** Route protection includes both `'admin'` and `'owner'` for backward compatibility

---

### 1.7 `src/app/admin/events/create/page.tsx`
**Line 12:**
```typescript
const { authorized } = useRequireRole(['superAdmin', 'franchisee', 'standaloneAdmin', 'admin', 'owner']);
```
**Context:** Route protection includes both `'admin'` and `'owner'` for backward compatibility

---

## 2. Role Comparisons (role === 'admin' or role === 'owner')

### 2.1 `src/app/owner/dashboard/page.tsx`
**Line 24:**
```typescript
if (!loading && user && role === 'owner') {
```
**Context:** Conditional check before loading data

**Line 137:**
```typescript
{team.filter((member) => member.role === 'admin').length}
```
**Context:** Filtering team members by `'admin'` role for statistics

**Line 270:**
```typescript
) : member.role === 'admin' ? (
```
**Context:** Conditional rendering based on member role

**Line 280:**
```typescript
onClick={() => handleRoleChange(member.uid, 'admin')}
```
**Context:** Button to assign `'admin'` role to a user

---

### 2.2 `src/app/setup-owner/page.tsx`
**Line 18:**
```typescript
if (!loading && (role === 'owner' || role === 'superAdmin')) {
```
**Context:** Redirect check if user is already owner/superAdmin

**Line 44:**
```typescript
await updateUserRole(user.uid, user.uid, 'owner');
```
**Context:** Setting user role to `'owner'` (should be `'superAdmin'`)

**Line 93:**
```typescript
if (role === 'owner' || role === 'superAdmin') {
```
**Context:** Conditional rendering check

**Line 165:**
```typescript
<li>If document exists: Click on it → Click <strong>Edit document</strong> → Set <code className="bg-gray-100 px-1 rounded">role</code> field to <code className="bg-gray-100 px-1 rounded">"owner"</code></li>
```
**Context:** Documentation/instructions text mentioning `"owner"` role

**Line 170:**
```typescript
<li><code className="bg-gray-100 px-1 rounded">role</code>: "owner"</li>
```
**Context:** Documentation/instructions text mentioning `"owner"` role

---

### 2.3 `src/app/admin/page.tsx`
**Line 21:**
```typescript
if (!authLoading && user && role === 'owner') {
```
**Context:** Conditional check before loading users

**Line 123:**
```typescript
userData.role === 'owner'
```
**Context:** Conditional styling based on user role

**Line 125:**
```typescript
: userData.role === 'admin'
```
**Context:** Conditional styling based on user role

**Line 137:**
```typescript
onClick={() => handleRoleChange(userData.uid, 'admin')}
```
**Context:** Button to assign `'admin'` role to a user

**Line 138:**
```typescript
disabled={userData.role === 'admin'}
```
**Context:** Disable button if user already has `'admin'` role

---

### 2.4 `src/components/Header.tsx`
**Line 22:**
```typescript
role === 'superAdmin' || role === 'owner'
```
**Context:** Dashboard link logic - checks for superAdmin or owner

**Line 24:**
```typescript
: role === 'franchisee' || role === 'standaloneAdmin' || role === 'admin'
```
**Context:** Dashboard link logic - checks for admin role

---

### 2.5 `src/app/dashboard/super-admin/page.tsx`
**Line 28:**
```typescript
// Also check for old 'owner' role for migration
```
**Context:** Comment about owner role migration

**Line 29:**
```typescript
if (role !== 'owner') {
```
**Context:** Check for owner role (migration logic)

**Line 35:**
```typescript
if (user && (role === 'superAdmin' || role === 'owner')) {
```
**Context:** Conditional check before loading data

---

### 2.6 `src/app/tournaments/page.tsx`
**Line 18:**
```typescript
const isOwner = role === 'owner';
```
**Context:** Variable assignment for owner check

---

### 2.7 `src/app/events/page.tsx`
**Line 18:**
```typescript
const isOwner = role === 'owner';
```
**Context:** Variable assignment for owner check

---

### 2.8 `src/app/events/[id]/page.tsx`
**Line 590:**
```typescript
{(role === 'admin' || role === 'owner') && (
```
**Context:** Conditional rendering - show status to admins and owners

---

### 2.9 `src/app/all/page.tsx`
**Line 18:**
```typescript
const isOwner = role === 'owner';
```
**Context:** Variable assignment for owner check

---

## 3. Role Migration Logic

### 3.1 `src/app/dashboard/admin/page.tsx`
**Line 16:**
```typescript
if (r === 'admin') r = 'standaloneAdmin';
```
**Context:** Migration logic in `ensureUserRole()` function

**Line 29:**
```typescript
useRequireRole(['standaloneAdmin', 'franchisee', 'superAdmin', 'admin']);
```
**Context:** Route protection includes `'admin'` for backward compatibility

**Line 126:**
```typescript
// After ensureUserRole, 'admin' is converted to 'standaloneAdmin', so only check for 'standaloneAdmin'
```
**Context:** Comment about admin migration

---

### 3.2 `src/lib/userRoles.ts`
**Line 27:**
```typescript
if (r === 'admin') {
  r = 'standaloneAdmin';
}
```
**Context:** Migration logic in `fromFirestoreUser()` function

**Line 30:**
```typescript
// Note: 'owner' role migration removed - all owners have been manually migrated to 'superAdmin' in Firebase
```
**Context:** Comment about owner migration

**Line 102:**
```typescript
if (r === 'admin') {
  r = 'standaloneAdmin';
}
```
**Context:** Migration logic in `getUserRole()` function

**Line 105:**
```typescript
// Note: 'owner' role migration removed - all owners have been manually migrated to 'superAdmin' in Firebase
```
**Context:** Comment about owner migration

---

### 3.3 `src/app/dashboard/layout.tsx`
**Line 62:**
```typescript
// Handle role migration: old 'owner' and 'admin' should still work
```
**Context:** Comment about role migration

**Line 66:**
```typescript
if (r === 'owner') return 'superAdmin';
```
**Context:** Migration logic for navigation links

**Line 67:**
```typescript
if (r === 'admin') return 'standaloneAdmin';
```
**Context:** Migration logic for navigation links

---

## 4. Type Definitions

### 4.1 `src/lib/types.ts`
**Line 3:**
```typescript
// Note: 'admin' and 'owner' are included for backward compatibility (migrated to 'standaloneAdmin' and 'superAdmin')
```
**Context:** Comment about backward compatibility

**Line 4:**
```typescript
export type UserRole = 'player' | 'standaloneAdmin' | 'franchisee' | 'superAdmin' | 'admin' | 'owner' | null;
```
**Context:** Type definition includes `'admin'` and `'owner'` for backward compatibility

---

### 4.2 `src/app/login/page.tsx`
**Line 11:**
```typescript
type AccountType = 'player' | 'admin' | null;
```
**Context:** Local type definition for account type selection

**Line 292:**
```typescript
onClick={() => setAccountType('admin')}
```
**Context:** Button to set account type to `'admin'`

---

## 5. Event Form Logic

### 5.1 `src/components/admin/ChessEventForm.tsx`
**Line 64:**
```typescript
if (userRole === 'superAdmin' || userRole === 'owner') {
```
**Context:** Conditional check for super admin or owner

**Line 93:**
```typescript
} else if (userRole === 'superAdmin' || userRole === 'owner') {
```
**Context:** Conditional check for super admin or owner

**Line 621:**
```typescript
const creatorRole = (userRole === 'owner' ? 'superAdmin' : 
                     userRole === 'admin' ? 'standaloneAdmin' : 
                     userRole) as 'superAdmin' | 'franchisee' | 'standaloneAdmin' | undefined;
```
**Context:** Role migration logic when creating events

---

### 5.2 `src/app/admin/events/edit/[id]/page.tsx`
**Line 44:**
```typescript
userRole === 'superAdmin' || userRole === 'owner' || // Super Admin can edit all
```
**Context:** Permission check for editing events

**Line 46:**
```typescript
((userRole === 'standaloneAdmin' || userRole === 'admin') && event.createdBy === user?.uid); // Standalone Admin can edit own events
```
**Context:** Permission check includes `'admin'` for backward compatibility

---

## 6. Admin Requests Logic

### 6.1 `src/lib/adminRequests.ts`
**Line 128:**
```typescript
* This will also update the user's role to 'admin'
```
**Context:** Comment about role assignment

**Line 237:**
```typescript
if (role !== 'standaloneAdmin' && role !== 'franchisee' && role !== 'admin') {
```
**Context:** Permission check includes `'admin'` for backward compatibility

---

## 7. Function Parameters and Type Annotations

### 7.1 `src/app/owner/dashboard/page.tsx`
**Line 67:**
```typescript
const handleRoleChange = async (uid: string, newRole: 'player' | 'admin') => {
```
**Context:** Function parameter type includes `'admin'` (should be `'standaloneAdmin'`)

---

## Summary by Category

### Route Protection (useRequireRole)
- **Files:** 7
- **Total occurrences:** 7
- **Files:**
  1. `src/app/owner/dashboard/page.tsx` - Line 14
  2. `src/app/admin/page.tsx` - Line 13
  3. `src/app/owner/layout.tsx` - Line 10
  4. `src/app/dashboard/admin/page.tsx` - Line 29
  5. `src/app/admin/layout.tsx` - Line 10
  6. `src/app/admin/events/edit/[id]/page.tsx` - Line 20
  7. `src/app/admin/events/create/page.tsx` - Line 12

### Role Comparisons (===)
- **Files:** 9
- **Total occurrences:** 20+
- **Files:**
  1. `src/app/owner/dashboard/page.tsx` - Lines 24, 137, 270, 280
  2. `src/app/setup-owner/page.tsx` - Lines 18, 44, 93, 165, 170
  3. `src/app/admin/page.tsx` - Lines 21, 123, 125, 137, 138
  4. `src/components/Header.tsx` - Lines 22, 24
  5. `src/app/dashboard/super-admin/page.tsx` - Lines 28, 29, 35
  6. `src/app/tournaments/page.tsx` - Line 18
  7. `src/app/events/page.tsx` - Line 18
  8. `src/app/events/[id]/page.tsx` - Line 590
  9. `src/app/all/page.tsx` - Line 18

### Migration Logic
- **Files:** 3
- **Total occurrences:** 8
- **Files:**
  1. `src/app/dashboard/admin/page.tsx` - Lines 16, 29, 126
  2. `src/lib/userRoles.ts` - Lines 27, 30, 102, 105
  3. `src/app/dashboard/layout.tsx` - Lines 62, 66, 67

### Type Definitions
- **Files:** 2
- **Total occurrences:** 3
- **Files:**
  1. `src/lib/types.ts` - Lines 3, 4
  2. `src/app/login/page.tsx` - Lines 11, 292

### Event Form Logic
- **Files:** 2
- **Total occurrences:** 4
- **Files:**
  1. `src/components/admin/ChessEventForm.tsx` - Lines 64, 93, 621
  2. `src/app/admin/events/edit/[id]/page.tsx` - Lines 44, 46

### Admin Requests Logic
- **Files:** 1
- **Total occurrences:** 2
- **Files:**
  1. `src/lib/adminRequests.ts` - Lines 128, 237

### Function Parameters
- **Files:** 1
- **Total occurrences:** 1
- **Files:**
  1. `src/app/owner/dashboard/page.tsx` - Line 67

---

## Priority for Cleanup

### High Priority (Breaking Changes)
1. Route protection arrays - Update to remove `'admin'` and `'owner'`
2. Role comparison logic - Replace with `'standaloneAdmin'` and `'superAdmin'`
3. Function parameter types - Update type annotations

### Medium Priority (Backward Compatibility)
1. Migration logic - Keep for now but document as deprecated
2. Type definitions - Keep in union type for backward compatibility

### Low Priority (Documentation/Comments)
1. Comments mentioning legacy roles
2. Documentation text in setup pages

---

**End of Report**

