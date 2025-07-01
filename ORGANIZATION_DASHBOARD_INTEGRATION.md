# Organization Dashboard Integration

## Overview

The organization dashboard has been integrated with the backend API to fetch real project data and provide dynamic project selection functionality.

## Features Implemented

### 1. Organization Context

- Organization ID is stored in sessionStorage for security (not visible in URL)
- Dashboard fetches organization details using `/api/organizations/details` endpoint
- Organization name is displayed in the header

### 2. Project Dropdown Integration

- Fetches projects using `/api/projects/names` endpoint
- Displays all projects for the selected organization
- Shows project status (Active/Inactive) in dropdown items
- Handles empty state when no projects are available
- Automatically selects the first project if available

### 3. Dynamic Project Selection

- When user changes project selection, metrics are updated
- Project context is maintained in navigation URLs (only projectId, not orgId)
- All quick actions and navigation include project context
- Project status chip shows "Active Project" or "Inactive Project" based on project.active field

### 4. Error Handling

- Loading states with spinner
- Error messages for failed API calls
- Graceful handling of missing organization or projects
- Authentication redirects

## API Endpoints Used

### 1. Get Organization Details

```
POST /api/organizations/details
Body: { "organizationId": "..." }
Response: { "success": true, "data": { organization details } }
```

### 2. Get Project Names

```
POST /api/projects/names
Body: { "organizationId": "..." }
Response: { "success": true, "count": 3, "data": [ project objects ] }
```

## URL Structure

- Organization Dashboard: `/organization-dashboard` (orgId stored in sessionStorage)
- Navigation with Project: `/<page>?projectId=<project_id>` (orgId in sessionStorage)

## State Management

- `organization`: Current organization details
- `projects`: Array of projects for the organization
- `selectedProject`: Currently selected project ID
- `metrics`: Project-specific metrics (currently using dummy data)
- `sessionStorage.selectedOrganizationId`: Organization ID (not visible in URL)

## Security Improvements

- Organization ID is no longer visible in URL for security
- Uses sessionStorage to maintain context between pages
- Project status is properly validated before showing "Active" status

## Future Enhancements

1. **Real Metrics API**: Replace dummy metrics with actual project statistics
2. **Project Creation**: Add ability to create new projects from dashboard
3. **Project Filtering**: Add search and filter functionality
4. **Caching**: Implement caching for better performance
5. **Real-time Updates**: Add WebSocket support for live updates

## Testing

To test the integration:

1. Start the backend server: `cd backend && npm start`
2. Start the frontend: `cd frontend && npm run dev`
3. Login and navigate to an organization dashboard
4. Verify that projects are loaded in the dropdown with status indicators
5. Test project switching and verify status chip updates correctly

## Error Scenarios Handled

- Missing organization ID in sessionStorage
- Organization not found
- No projects available
- API authentication failures
- Network errors
- Invalid project selection
- Project status validation
