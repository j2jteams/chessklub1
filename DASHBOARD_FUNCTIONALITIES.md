# Chess Tourneys - Dashboard Functionalities Documentation

This document provides a comprehensive overview of the dashboard functionalities available to each user role in the Chess Tourneys platform.

## Table of Contents
1. [Player Role](#player-role)
2. [Standalone Admin Role](#standalone-admin-role)
3. [Franchisee Role](#franchisee-role)
4. [Super Admin Role](#super-admin-role)

---

## Player Role

### Overview
Players are the end-users of the platform who register for and participate in chess tournaments. They have the most limited access to dashboard features.

### Dashboard Access
- **Route**: `/dashboard`
- **Navigation Links Available**: 
  - Overview

### Available Functionalities

#### 1. Overview Page (`/dashboard`)
The Overview page provides players with a personalized view of their chess tournament activities.

**Features:**
- **Welcome Section**: Displays the user's email and a brief description of the dashboard purpose
- **Statistics Cards**:
  - **Registered Events**: Shows the count of events the player has registered for
  - **Saved Events**: Shows the count of events the player has bookmarked/saved for later
- **Admin Access Request**: 
  - A call-to-action section that allows players to request admin access
  - Includes a button that redirects to `/request-admin` page
  - Only visible to players (not shown to admins)
- **Registered Events Section**:
  - Displays a grid of all events the player has registered for
  - Each event card shows:
    - Event date
    - Event title
    - Event price
    - Event description (truncated)
    - Event location
    - Event status
  - Clicking on an event card navigates to the event detail page
  - Shows a message if no events are registered
- **Saved Events Section**:
  - Displays a grid of all events the player has saved/bookmarked
  - Same card format as Registered Events
  - Shows a message if no events are saved

**Limitations:**
- Cannot create, edit, or delete events
- Cannot approve or reject events
- Cannot manage user roles
- Cannot view events created by other users (except public approved events)
- Cannot access Event Management or User Management sections

---

## Standalone Admin Role

### Overview
Standalone Admins are administrators who manage standalone events (events not linked to any franchise). They have moderate access to dashboard features focused on event management.

### Dashboard Access
- **Route**: `/dashboard`
- **Navigation Links Available**: 
  - Overview
  - Event Management

### Available Functionalities

#### 1. Overview Page (`/dashboard`)
Same as Player role - displays registered and saved events.

#### 2. Event Management (`/dashboard/admin`)
This is the primary workspace for Standalone Admins to manage their events.

**Features:**

**Event Listing:**
- **Filter Tabs**: 
  - **All**: Shows all events created by the standalone admin
  - **PendingApproval**: Shows events waiting for Super Admin approval
  - **Approved**: Shows approved events
  - **Rejected**: Shows rejected events
- **Event Display**: 
  - Card-based layout showing event details
  - Each card displays:
    - Event title
    - Event description
    - Event date
    - Event location
    - Event status badge (approved/pending/rejected)
    - Creator information
    - Action buttons (Edit/Delete)

**Event Actions:**
- **Create Event**: 
  - Button to create new events
  - Redirects to `/admin/events/create`
  - Can create:
    - **Standalone Events**: Events not linked to any franchise (automatically approved)
    - **Franchise Events**: Events linked to a franchise (requires Super Admin approval)
  - When creating franchise events:
    - Can select from a dropdown of existing franchises
    - Can manually enter a franchise name/UID
    - Event will be marked as "pendingApproval" until Super Admin approves
- **Edit Event**: 
  - Can only edit events they created
  - Redirects to `/admin/events/edit/[eventId]`
  - Can modify all event details
- **Delete Event**: 
  - Can only delete events they created
  - Requires confirmation before deletion

**Event Creation Rules:**
- **Standalone Events**: 
  - Can be created freely
  - Automatically approved (status: "approved")
  - No Super Admin approval required
- **Franchise Events**: 
  - Can be created but require Super Admin approval
  - Status set to "pendingApproval" on creation
  - Will not be visible to public until approved by Super Admin
  - Shows warning message during creation

**Limitations:**
- Cannot see events created by other admins or franchisees
- Cannot approve or reject events (only Super Admin can)
- Cannot manage user roles
- Cannot access User Management section
- Cannot edit or delete events created by other users

---

## Franchisee Role

### Overview
Franchisees represent chess clubs/franchises and manage events tied to their franchise. They have similar access to Standalone Admins but with franchise-specific features.

### Dashboard Access
- **Route**: `/dashboard`
- **Navigation Links Available**: 
  - Overview
  - Event Management

### Available Functionalities

#### 1. Overview Page (`/dashboard`)
Same as Player role - displays registered and saved events.

#### 2. Event Management (`/dashboard/admin`)
This is the primary workspace for Franchisees to manage their franchise events.

**Features:**

**Event Listing:**
- **Filter Tabs**: 
  - **All**: Shows all events linked to their franchise or created by them
  - **PendingApproval**: Shows events waiting for Super Admin approval
  - **Approved**: Shows approved events
  - **Rejected**: Shows rejected events
- **Event Display**: 
  - Card-based layout showing event details
  - Each card displays:
    - Event title
    - Event description
    - Event date
    - Event location
    - Event status badge
    - Creator information
    - Action buttons (Edit/Delete)

**Event Actions:**
- **Create Event**: 
  - Button to create new events
  - Redirects to `/admin/events/create`
  - Can create:
    - **Franchise Events**: Events linked to their franchise (automatically approved)
    - **Standalone Events**: Events not linked to any franchise (requires Super Admin approval)
  - When creating events:
    - "Linked to Franchise" option is pre-selected
    - Automatically linked to their franchise (no manual input needed)
    - If "Standalone" is selected, event requires Super Admin approval
- **Edit Event**: 
  - Can edit:
    - Events they created
    - Events linked to their franchise (where `franchiseId` matches their UID)
  - Redirects to `/admin/events/edit/[eventId]`
  - Can modify all event details
- **Delete Event**: 
  - Can delete:
    - Events they created
    - Events linked to their franchise
  - Requires confirmation before deletion

**Event Creation Rules:**
- **Franchise Events**: 
  - Can be created freely
  - Automatically linked to their franchise
  - Automatically approved (status: "approved")
  - No Super Admin approval required
- **Standalone Events**: 
  - Can be created but require Super Admin approval
  - Status set to "pendingApproval" on creation
  - Will not be visible to public until approved by Super Admin
  - Shows warning message during creation

**Event Visibility:**
- Can see:
  - All events linked to their franchise (`franchiseId` matches their UID)
  - All events they created (including standalone events)
- Cannot see:
  - Events created by other franchisees
  - Events created by standalone admins (unless linked to their franchise)

**Limitations:**
- Cannot see events from other franchises
- Cannot approve or reject events (only Super Admin can)
- Cannot manage user roles
- Cannot access User Management section
- Cannot edit or delete events from other franchises

---

## Super Admin Role

### Overview
Super Admins have the highest level of access and can manage all aspects of the platform, including events, users, and admin requests.

### Dashboard Access
- **Route**: `/dashboard`
- **Navigation Links Available**: 
  - Overview
  - Event Management
  - User Management

### Available Functionalities

#### 1. Overview Page (`/dashboard`)
Same as Player role - displays registered and saved events.

#### 2. Event Management (`/dashboard/admin`)
This is the comprehensive event management workspace for Super Admins.

**Features:**

**Event Listing:**
- **Filter Tabs**: 
  - **All**: Shows all events in the system
  - **PendingApproval**: Shows events waiting for approval
  - **Approved**: Shows approved events
  - **Rejected**: Shows rejected events
- **Event Display**: 
  - **Table View** (Super Admin specific):
    - Detailed table with columns:
      - Event Title
      - Created By (with role badge and email)
      - Location
      - Date
      - Status (with special highlighting for events needing approval)
      - Actions (Approve/Reject/Edit/Delete)
    - Highlights events that need approval with warning indicators
    - Shows creator information including:
      - Creator name
      - Creator role (Franchise, Standalone Admin, Super Admin)
      - Creator email
  - **Card View** (for other admin roles):
    - Standard card layout (not used by Super Admin)

**Event Actions:**
- **Create Event**: 
  - Can create events with or without franchise linkage
  - All events created by Super Admin are automatically approved
  - Can link events to any franchise or create standalone events
  - No approval required for any events created by Super Admin
- **Edit Event**: 
  - Can edit **any event** in the system
  - No restrictions on which events can be edited
- **Delete Event**: 
  - Can delete **any event** in the system
  - Requires confirmation before deletion
- **Approve Event**: 
  - Can approve events with "pendingApproval" status
  - Approves events created by:
    - Franchisees who created standalone events
    - Standalone Admins who created franchise events
  - Changes event status from "pendingApproval" to "approved"
- **Reject Event**: 
  - Can reject events with "pendingApproval" status
  - Changes event status from "pendingApproval" to "rejected"
  - Rejected events are not visible to the public

**Event Visibility:**
- Can see **all events** in the system regardless of:
  - Creator
  - Franchise linkage
  - Status (approved, pending, rejected, draft)

**Special Features:**
- **Approval Workflow**: 
  - Super Admins see a special indicator for events needing approval
  - Can quickly identify which events require attention
  - Approval/rejection actions are prominently displayed

#### 3. User Management (`/dashboard/super-admin`)
This is the user and role management workspace exclusively for Super Admins.

**Features:**

**Statistics Dashboard:**
- **Statistics Cards** (clickable to view detailed tables):
  - **Pending Admin Requests**: 
    - Shows count of pending admin signup requests
    - Clicking opens a table view (if requests exist)
    - Card is not clickable (data shown in section below)
  - **Franchisees**: 
    - Shows count of franchisee accounts
    - Clicking opens detailed table view
  - **Standalone Admins**: 
    - Shows count of standalone admin accounts
    - Clicking opens detailed table view
  - **Total Users**: 
    - Shows count of all users in the system
    - Clicking opens detailed table view

**Pending Admin Signup Requests Section:**
- **Purpose**: Review and approve/reject admin account requests
- **Display**: 
  - List of pending requests with:
    - Request date
    - Applicant name (firstName + lastName)
    - Applicant email
    - Request type (Franchise Admin or Standalone Admin)
    - Franchise Name (if applicable)
- **Actions**:
  - **Approve**: 
    - Approves the admin request
    - Updates user role to "franchisee" or "standaloneAdmin" based on request
    - Updates user profile with firstName, lastName, and franchiseId (if applicable)
    - Removes the request from pending list
  - **Reject**: 
    - Rejects the admin request
    - Removes the request from pending list
    - User remains as "player" role

**User Role Management Section:**
- **Purpose**: Assign and change user roles
- **Display**: 
  - List of all users in the system
  - Each user shows:
    - Email address
    - Current role
    - Role dropdown selector
    - Update button (when role is changed)
- **Available Roles**:
  - **Player**: Default role, no special permissions
  - **Standalone Admin**: Can create and manage standalone events
  - **Franchisee**: Can create and manage franchise events
  - **Super Admin**: Full platform access (only Super Admin can assign this)
- **Actions**:
  - **Change Role**: 
    - Select new role from dropdown
    - Click "Update Role" button
    - Requires confirmation before updating
    - Updates user's role in the database
    - Reloads user list to show updated roles
- **Restrictions**:
  - Cannot change own role (indicated by "(You)" label)
  - Only Super Admin can change user roles

**Detailed User Tables:**
When clicking on statistics cards, detailed tables are displayed:

- **Franchisees Table**:
  - Columns: Email, Name, Franchise Name, Created Date, Role
  - Shows all users with "franchisee" role
  - Displays franchise information

- **Standalone Admins Table**:
  - Columns: Email, Name, Created Date, Role
  - Shows all users with "standaloneAdmin" role

- **All Users Table**:
  - Columns: Email, Name, Role, Franchise Name, USCF ID, Created Date
  - Shows complete list of all users
  - Color-coded role badges:
    - Super Admin: Red badge
    - Franchisee: Purple badge
    - Standalone Admin: Blue badge
    - Player: Gray badge
  - Indicates current user with "(You)" label

**Special Permissions:**
- **Full System Access**: 
  - Can view all users
  - Can view all events
  - Can manage all aspects of the platform
- **Role Assignment**: 
  - Only role that can assign or change user roles
  - Can promote players to admins
  - Can demote admins to players
  - Can assign franchisee or standalone admin roles
- **Admin Request Approval**: 
  - Only role that can approve admin signup requests
  - Controls who can become admins on the platform

---

## Summary of Role Permissions

### Event Management Permissions

| Action | Player | Standalone Admin | Franchisee | Super Admin |
|--------|--------|------------------|------------|-------------|
| View Own Events | ✅ | ✅ | ✅ | ✅ |
| View All Events | ❌ | ❌ | ❌ | ✅ |
| Create Standalone Events | ❌ | ✅ (Auto-approved) | ✅ (Needs approval) | ✅ (Auto-approved) |
| Create Franchise Events | ❌ | ✅ (Needs approval) | ✅ (Auto-approved) | ✅ (Auto-approved) |
| Edit Own Events | ❌ | ✅ | ✅ | ✅ |
| Edit Any Event | ❌ | ❌ | ❌ | ✅ |
| Delete Own Events | ❌ | ✅ | ✅ | ✅ |
| Delete Any Event | ❌ | ❌ | ❌ | ✅ |
| Approve Events | ❌ | ❌ | ❌ | ✅ |
| Reject Events | ❌ | ❌ | ❌ | ✅ |

### User Management Permissions

| Action | Player | Standalone Admin | Franchisee | Super Admin |
|--------|--------|------------------|------------|-------------|
| View Own Profile | ✅ | ✅ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ❌ | ✅ |
| Approve Admin Requests | ❌ | ❌ | ❌ | ✅ |
| Reject Admin Requests | ❌ | ❌ | ❌ | ✅ |

### Dashboard Access

| Section | Player | Standalone Admin | Franchisee | Super Admin |
|---------|--------|------------------|------------|-------------|
| Overview | ✅ | ✅ | ✅ | ✅ |
| Event Management | ❌ | ✅ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |

---

## Event Approval Workflow

### When Approval is Required

1. **Franchisee creates Standalone Event**:
   - Event status: `pendingApproval`
   - Requires Super Admin approval
   - Event not visible to public until approved

2. **Standalone Admin creates Franchise Event**:
   - Event status: `pendingApproval`
   - Requires Super Admin approval
   - Event not visible to public until approved

### When Approval is NOT Required

1. **Franchisee creates Franchise Event**:
   - Event status: `approved`
   - Automatically approved
   - Immediately visible to public

2. **Standalone Admin creates Standalone Event**:
   - Event status: `approved`
   - Automatically approved
   - Immediately visible to public

3. **Super Admin creates ANY Event**:
   - Event status: `approved`
   - Automatically approved
   - Immediately visible to public

---

## Navigation and Routing

### Dashboard Routes

- `/dashboard` - Overview page (all roles)
- `/dashboard/admin` - Event Management (admins only)
- `/dashboard/super-admin` - User Management (Super Admin only)

### Event Creation/Edit Routes

- `/admin/events/create` - Create new event (admins only)
- `/admin/events/edit/[id]` - Edit existing event (admins only)

### Access Control

- Routes are protected by `useRequireRole` hook
- Unauthorized access redirects to home page
- Role-based navigation links are automatically filtered

---

## Notes

- All event management is now centralized in `/dashboard/admin`
- The old `/admin/events` listing page has been removed
- "Back to Events" links have been removed from create/edit pages
- User Management was previously called "Admin Management" but has been renamed for clarity
- All users can see all approved events on the public site, regardless of role
- Event approval workflow ensures quality control for cross-role event creation

