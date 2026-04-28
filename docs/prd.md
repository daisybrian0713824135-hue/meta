# Requirements Document

## 1. Application Overview

### 1.1 Application Name
MetaPay

### 1.2 Application Description
A complete production-ready full-stack earning platform enabling users to earn money through various tasks including surveys, watching ads, app testing, data annotation, offers, video tasks, daily tasks, and referrals. The platform features a premium modern UI with purple, blue, and green gradients, glassmorphism effects, and responsive design similar to Remotask, Meta Earn, and Timebucks.

## 2. Users and Usage Scenarios

### 2.1 Target Users
- General users seeking to earn money through online tasks
- Inactive users (newly registered, awaiting account activation)
- Active users (paid package holders with full platform access)
- Administrators (moderators, admins, super admins)

### 2.2 Core Usage Scenarios
- Users register and activate accounts through package purchase
- Active users complete tasks to earn rewards
- Users refer others to earn 10% referral commission
- Users withdraw earnings via M-Pesa
- Administrators manage users, tasks, payments, and withdrawals

## 3. Page Structure and Functionality

### 3.1 Page Hierarchy

```
MetaPay Platform
├── Public Pages (No Login Required)
│   ├── Home Page
│   ├── Login Page
│   └── Registration Page
├── User Dashboard (Login Required)
│   ├── Dashboard Home
│   ├── Tasks Page
│   │   ├── Surveys
│   │   ├── Watching Ads
│   │   ├── App Testing
│   │   ├── Data Annotation
│   │   ├── Offers
│   │   ├── Video Tasks
│   │   ├── Daily Tasks
│   │   └── Referrals
│   ├── Packages Page
│   ├── Payment Page
│   ├── Earnings Page
│   ├── Referrals Page
│   ├── Withdrawals Page
│   └── Account Page
└── Admin Panel (Admin Login Required)
    ├── Admin Dashboard
    ├── User Management
    ├── Task Management
    ├── Payment Management
    ├── Withdrawal Management
    ├── Referral Management
    ├── Live Activity Manager
    ├── Announcement Manager
    └── Site Settings
```

### 3.2 Public Pages

#### 3.2.1 Home Page
- Display hero section with platform introduction
- Show platform statistics (total users, total earnings, active tasks)
- Display testimonials from users
- Show FAQ section
- Display available packages with pricing
- Show task preview section
- Display live activity ticker showing real-time platform activities
- Show about section explaining platform purpose
- Display how it works section with step-by-step guide
- Show recent winners section
- Provide login button
- Provide register button

#### 3.2.2 Login Page
- Input fields: username, phone number, password
- Login button to authenticate user
- Link to registration page
- Forgot password option

#### 3.2.3 Registration Page
- Input fields: full name, username, email, phone number, password, confirm password, optional referral code
- Register button to create account
- Upon successful registration, automatically create user profile with default values: status=\"inactive\", account_approved=false, package=null, completed_tasks=0, withdrawal_balance=0, premium_referrals_used=0, payment_verified=false
- Generate unique referral code for new user
- Redirect to dashboard after registration

### 3.3 User Dashboard

#### 3.3.1 Dashboard Home
- Display welcome card with user name
- Show current balance card
- Display today's earnings card
- Show weekly earnings card
- Display monthly earnings card
- Show referral earnings card
- Display completed tasks count card
- Show active package card
- Display package expiry date card
- Show recent activity list
- Display earnings chart (line/bar chart)
- Show task completion graph
- Display real-time activity graph
- Show leaderboard section
- Display announcements section
- Show daily rewards section
- Display recent transactions list
- Show live feed with platform activities
- Display task categories grid
- Show referral panel with referral code and link

**Inactive User Dashboard Restrictions:**
- Display all dashboard sections with locked/disabled state
- Show \"Activate your account to unlock earning\" message on locked sections
- Display 0 available tasks
- Apply blur/lock effect on task cards
- Disable all earning-related buttons
- Show package upgrade banner prominently
- Allow viewing but not interacting with tasks, earnings, referrals

**Active User Dashboard:**
- Full access to all dashboard features
- Enable task start buttons
- Enable withdrawal functionality
- Enable premium features
- Show actual available tasks count

#### 3.3.2 Tasks Page
- Display task categories: Surveys, Watching Ads, App Testing, Data Annotation, Offers, Video Tasks, Daily Tasks, Referrals
- Each task card shows: task title, reward amount, difficulty level, estimated time, start button
- Filter tasks by category
- Sort tasks by reward, difficulty, or time
- For inactive users: display all tasks but disable start buttons and show lock icon
- For active users: enable start button to begin task
- Track task completion and update user earnings

#### 3.3.3 Packages Page
- Display available packages:
  - Starter: KES 500
  - Bronze: KES 1000
  - Silver: KES 2000
  - Gold: KES 3500
  - VIP: KES 5500
- Each package card shows: name, features list, task limits, daily earnings estimate, benefits, activate button
- Highlight current active package if user has one
- Show package comparison table

#### 3.3.4 Payment Page
- Display selected package details
- Show payment amount
- Embed Paynecta payment page (https://paynecta.co.ke/pay/metapay-agencies) within application using webview or modal
- Do not redirect user outside application
- After payment completion, verify payment using Paynecta API key: hmp_xCRICKlyM0TfR9x4YG08wH5cUYPrr0w5X1EQDCon
- Save transaction record with: transaction ID, receipt, payment amount, package name, payment date
- Upon successful verified payment:
  - Update user status to \"active\"
  - Set account_approved=true
  - Set payment_verified=true
  - Record activation_date as current timestamp
  - Save selected package to user profile
  - Create transaction record in database
  - Create activation log entry
  - Submit activation history to admin panel
  - Send notification to user
- Redirect to dashboard with success page
- Display confetti animation
- Show success card: \"Payment successful. Welcome to MetaPay\"
- Unlock tasks, withdrawals, premium features, and referrals

#### 3.3.5 Earnings Page
- Display total earnings
- Show earnings breakdown by source (tasks, referrals)
- Display earnings history table with date, source, amount
- Show earnings chart (daily, weekly, monthly)
- Display pending earnings
- Show available balance for withdrawal

#### 3.3.6 Referrals Page
- Display user's unique referral code
- Show referral link
- Provide copy button for code and link
- Display total referral earnings (10% of referred user's earnings)
- Show referral count (total referrals)
- Display remaining premium referrals count (maximum 3 premium referrals)
- Show list of referred users with status and earnings
- Display referral statistics chart

#### 3.3.7 Withdrawals Page
- Display current withdrawal balance
- Show minimum withdrawal amount: KES 500
- Provide withdrawal method selection: M-Pesa
- Input field for M-Pesa phone number
- Input field for withdrawal amount
- Withdraw button (enabled only for active users with balance ≥ KES 500)
- Display withdrawal history table with: date, amount, method, status (Pending, Approved, Rejected)
- Show pending withdrawal requests
- For inactive users: disable withdraw button and show activation required message

#### 3.3.8 Account Page
- Display user profile information: full name, username, email, phone number
- Show account status (active/inactive)
- Display current package details
- Show account creation date
- Display activation date (if active)
- Show package expiry date
- Provide edit profile option
- Display change password option
- Show account statistics: total tasks completed, total earnings, total referrals

### 3.4 Admin Panel

#### 3.4.1 Admin Login
- Secure admin login page separate from user login
- Input fields: admin username, password
- Role-based access: Moderator, Admin, Super Admin

#### 3.4.2 Admin Dashboard
- Display total users count
- Show active users count
- Display inactive users count
- Show total revenue
- Display total transactions count
- Show pending withdrawals count
- Display pending payments count
- Show earnings graph
- Display user growth chart
- Show transaction volume graph
- Display recent activities list

#### 3.4.3 User Management
- Search users by username, email, phone number
- Display users table with: ID, name, username, email, status, package, registration date
- Edit user details
- Delete user account
- Suspend user account
- Activate user account manually
- View user profile with complete details
- Change user package
- View user transaction history
- View user task completion history

#### 3.4.4 Task Management
- Create new task with: title, description, category, reward amount, difficulty, estimated time, task limit
- Edit existing task details
- Delete task
- Set reward amount for task
- Configure task limits per package
- Manage task categories
- Enable/disable tasks
- View task completion statistics

#### 3.4.5 Payment Management
- Display payment logs table with: transaction ID, user, package, amount, date, status
- View verification logs
- Display all transactions history
- View activation logs with user details and package activated
- Filter payments by date, package, status
- Export payment reports

#### 3.4.6 Withdrawal Management
- Display pending withdrawal requests table
- Approve withdrawal request
- Reject withdrawal request with reason
- Bulk approve/reject multiple requests
- View withdrawal history
- Filter withdrawals by status, date, user
- Export withdrawal reports

#### 3.4.7 Referral Management
- View all referral relationships
- Display referral statistics: total referrals, active referrals, referral earnings
- Monitor premium referral usage
- View referral leaderboard
- Export referral reports

#### 3.4.8 Live Activity Manager
- Enable/disable live activity system
- View current live activities
- Create manual activity entry
- Moderate activity feed
- Pin important announcements
- Configure activity types to display
- Set activity refresh interval

#### 3.4.9 Announcement Manager
- Create new announcement with title, content, priority
- Edit existing announcements
- Delete announcements
- Publish/unpublish announcements
- Schedule announcements
- Target announcements to specific user groups

#### 3.4.10 Site Settings
- Configure site name
- Upload/change logo
- Set support email
- Edit terms and conditions
- Edit privacy policy
- Configure SEO settings (meta title, description, keywords)
- Enable/disable maintenance mode
- Configure push notification settings
- Set minimum withdrawal amount
- Configure referral commission percentage
- Set maximum premium referrals limit

## 4. Business Rules and Logic

### 4.1 Account Status Rules
- New users start with status=\"inactive\"
- Inactive users can login and view dashboard but cannot perform earning activities
- Users become active only after successful package payment verification
- Active status enables: task completion, earnings, withdrawals, premium features

### 4.2 Package Activation Rules
- User selects package from packages page
- Payment processed through embedded Paynecta payment page (https://paynecta.co.ke/pay/metapay-agencies)
- Payment verification uses Paynecta API key: hmp_xCRICKlyM0TfR9x4YG08wH5cUYPrr0w5X1EQDCon
- Webhook secret for payment verification: devan1234
- Upon successful payment verification:
  - User status changes to \"active\"
  - account_approved set to true
  - payment_verified set to true
  - activation_date recorded
  - Package details saved to user profile
  - Transaction record created
  - Activation log created
  - User redirected to active dashboard

### 4.3 Task Access Rules
- Inactive users see 0 available tasks
- Active users see tasks based on their package limits
- Task completion updates user's completed_tasks count
- Task rewards added to user's earnings balance
- Each task has category, difficulty, estimated time, and reward amount

### 4.4 Referral System Rules
- Each user receives unique referral code upon registration
- Referral code can be shared via referral link
- Referrer earns 10% commission on referred user's earnings
- Maximum 3 premium referrals allowed per user
- Premium referral count tracked in premium_referrals_used field
- Referral earnings added to user's referral_earnings balance

### 4.5 Withdrawal Rules
- Minimum withdrawal amount: KES 500
- Only active users can request withdrawals
- Withdrawal method: M-Pesa
- Withdrawal requests have status: Pending, Approved, Rejected
- Admin must approve withdrawal before processing
- Upon approval, amount deducted from user's withdrawal_balance
- Withdrawal history maintained for user and admin reference

### 4.6 Live Activity System Rules
- Real-time activity feed displays on homepage and dashboard
- Activity types: registrations, withdrawals, task completions, earnings, package activations
- Examples: \"John from Nairobi earned KES 200\", \"Sarah activated Gold package\", \"Kevin withdrew KES 3,500\"
- Activity feed updates in real-time using Supabase realtime subscription
- Admin can enable/disable, moderate, pin announcements, create manual activities
- Activity ticker shows animated pulse indicators
- Auto-refresh enabled for live updates

### 4.7 Payment Verification Flow
- User initiates payment from payment page
- Paynecta payment page embedded within application
- Payment processed through Paynecta
- Webhook callback received with payment status
- Verify webhook signature using webhook secret: devan1234
- Verify payment details using API key
- Update user account status upon successful verification
- Create transaction and activation records
- Send success notification to user
- Redirect to active dashboard

## 5. Exceptions and Edge Cases

| Scenario | Handling |
|----------|----------|
| User attempts to start task while inactive | Display message: \"Activate your account to unlock earning\". Disable start button. |
| User attempts withdrawal with balance < KES 500 | Display error: \"Minimum withdrawal amount is KES 500\". Disable withdraw button. |
| Inactive user attempts withdrawal | Display message: \"Activate your account to withdraw earnings\". Disable withdraw button. |
| User reaches maximum 3 premium referrals | Disable premium referral option. Display message: \"Maximum premium referrals reached\". |
| Payment verification fails | Display error message. Do not activate account. Log failed transaction. Allow retry. |
| Paynecta payment page fails to load | Display error message. Provide retry option. Log error for admin review. |
| User registers with invalid referral code | Display warning but allow registration to proceed. Do not link referral. |
| Admin approves withdrawal but M-Pesa transfer fails | Mark withdrawal as failed. Restore user balance. Notify admin and user. |
| User attempts to activate multiple packages simultaneously | Allow only one active package at a time. Display current package status. |
| Package expiry date reached | Notify user. Optionally downgrade to inactive or prompt renewal. |
| Duplicate username or email during registration | Display error: \"Username/Email already exists\". Prevent registration. |
| User forgets password | Provide password reset option via email. |
| Admin deletes user with pending withdrawal | Cancel pending withdrawals. Archive user data. Log deletion action. |
| Live activity feed fails to load | Display cached activities. Show error indicator. Retry connection. |
| Task completion submission fails | Allow retry. Save progress if possible. Notify user of failure. |

## 6. Acceptance Criteria

1. User registers account with full name, username, email, phone number, password, and optional referral code, creating inactive profile with default values
2. User logs in with username, phone number, and password, accessing dashboard with inactive restrictions
3. User selects package from packages page, completes payment through embedded Paynecta page (https://paynecta.co.ke/pay/metapay-agencies), payment verified using API key (hmp_xCRICKlyM0TfR9x4YG08wH5cUYPrr0w5X1EQDCon), account status changes to active, user redirected to active dashboard
4. Active user starts and completes task from tasks page, earning reward added to balance
5. Active user requests withdrawal of minimum KES 500 via M-Pesa, admin approves request, withdrawal processed successfully
6. User shares referral code, referred user registers and activates account, referrer earns 10% commission on referred user's earnings
7. Admin logs into admin panel, views pending withdrawals, approves withdrawal request, user receives payment confirmation

## 7. Out of Scope for Current Release

- Multi-language support beyond English
- Mobile native applications (iOS/Android)
- Cryptocurrency payment options
- Advanced analytics and reporting dashboards
- Automated task verification systems
- Integration with payment methods other than M-Pesa
- Social media login options (Google, Facebook)
- In-app chat or messaging system
- Gamification features (badges, achievements, levels)
- Affiliate marketing program beyond basic referrals
- API access for third-party integrations
- White-label or multi-tenant capabilities
- Advanced fraud detection algorithms
- Automated customer support chatbot
- Email marketing automation
- SMS notification system
- Video tutorials or onboarding guides
- User-generated content or reviews
- Community forum or discussion board
- Advanced user segmentation and targeting
- A/B testing framework
- Custom branding per user or organization