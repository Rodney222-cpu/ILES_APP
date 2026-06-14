# Company-Based Filtering for Workplace Supervisors

## Overview
Workplace supervisors are now restricted to viewing and managing only students who are interning at their specific company. This ensures proper data isolation and reflects real-world workplace supervision scenarios.

## Key Changes

### 1. User Model Enhancement
- Added `company_name` field to `CustomUser` model
- Required for all workplace supervisors during registration
- Academic supervisors don't need a company (they can supervise students across different companies)

### 2. Filtering Logic

#### Workplace Supervisors:
- Can only see placements where:
  - `workplace_supervisor` = themselves
  - `company_name` matches their assigned company (case-insensitive)
- Can only see weekly logs from students at their company

#### Academic Supervisors:
- Can see students from ANY company
- No company-based restriction
- Can supervise students across multiple companies

### 3. Admin Assignment Validation
- When assigning a workplace supervisor to a placement, the system validates:
  - Supervisor's company matches the placement's company
  - Error message if mismatch: "This supervisor works at 'Company A' but the placement is at 'Company B'"

## Database Migration
Run the following command to apply the migration:
```bash
python manage.py migrate users
```

## How It Works

### Registration:
- Workplace supervisors MUST provide:
  - Staff number
  - Company name
  - Department (optional)

### Viewing Data:
- Workplace supervisor at "ABC Corp" only sees:
  - Placements at "ABC Corp"
  - Weekly logs from students at "ABC Corp"

- Academic supervisor sees:
  - All assigned students regardless of company

### Assignment:
- Admin can only assign workplace supervisors to placements at matching companies
- System prevents mismatched assignments

## Example Scenarios

### Scenario 1: Correct Assignment
- Placement: Student at "Microsoft"
- Workplace Supervisor: John (company_name="Microsoft")
- ✅ Assignment allowed

### Scenario 2: Prevented Assignment
- Placement: Student at "Google"
- Workplace Supervisor: John (company_name="Microsoft")
- ❌ Assignment blocked with error message

### Scenario 3: Academic Supervisor (No Restriction)
- Placement 1: Student at "Microsoft"
- Placement 2: Student at "Google"
- Academic Supervisor: Dr. Smith
- ✅ Can supervise both students

## API Changes

### User Registration (Workplace Supervisor)
```json
{
  "username": "john_supervisor",
  "email": "john@microsoft.com",
  "password": "secure123",
  "role": "workplace_supervisor",
  "staff_number": "WS001",
  "company_name": "Microsoft",  // NEW REQUIRED FIELD
  "department": "Engineering"
}
```

### Placement Response (New Field)
```json
{
  "workplace_supervisor_company": "Microsoft",  // NEW FIELD
  "workplace_supervisor_username": "john_supervisor"
}
```

## Benefits
1. **Data Security**: Supervisors can't access other companies' data
2. **Real-World Accuracy**: Reflects actual workplace supervision structure
3. **Error Prevention**: System prevents incorrect supervisor assignments
4. **Scalability**: Supports multiple companies in the same system
