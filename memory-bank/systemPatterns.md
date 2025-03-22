# System Patterns

## Architecture Overview
The n8n-aitable integration follows the standard n8n community node architecture pattern:

```
n8n Core ↔ n8n-aitable Node ↔ AITable API
```

The node acts as a bridge between n8n workflows and the AITable API, handling authentication, request formatting, and response parsing.

## Key Components

### 1. Node Definition
- Located in `nodes/Aitable/Aitable.node.ts`
- Defines the node's properties, operations, and execution logic
- Implements the INodeType interface from n8n-workflow
- Contains all operation implementations within the execute method

### 2. Credentials
- Located in `credentials/AitableApi.credentials.ts`
- Manages API token storage and retrieval
- Implements the ICredentialType interface from n8n-workflow
- Includes credential testing functionality

### 3. Operation Handlers
- Implemented within the node definition's execute method
- Five main operations: 
  - searchNodes
  - searchNodesInDatasheet
  - createRecord
  - editRecord
  - deleteRecord
- Each operation follows a consistent pattern of parameter validation, request preparation, API call, and response formatting

## Design Patterns

### Factory Pattern
- Operation handlers are selected based on the operation name specified in the node configuration
- Different execution paths are taken depending on the selected operation
- A switch-case like structure determines which code path to execute

### Adapter Pattern
- Transforms AITable API responses into formats suitable for n8n workflows
- Handles different node types with consistent output structure
- Adapts complex AITable data structures into simpler, more usable formats

### Strategy Pattern
- Different parameter sets and validation rules apply based on the selected operation
- Configuration UI dynamically shows relevant fields based on the operation
- Enables flexible handling of various AITable API endpoints

## Data Flow

1. **Input**: User configures node in n8n workflow with operation and parameters
2. **Authentication**: Node retrieves API token from stored credentials
3. **Request Preparation**: Parameters are validated and formatted for API request
4. **API Call**: Request is sent to appropriate AITable API endpoint
5. **Response Processing**: API response is parsed and formatted
6. **Output**: Processed data is returned to the n8n workflow

## Error Handling
- Input validation before API calls with specific error messages
- HTTP error handling with status code interpretation
- Response validation after API calls
- Error messages tailored to the specific operation and failure point
- Node execution stops with appropriate error message on failure

## Technical Debt & Future Enhancements
- Batch operations could be implemented for improved performance
- Pagination could be enhanced for very large datasets
- Webhooks integration for real-time data changes
- Advanced filtering options could be expanded
- Test suite needed for automated testing 