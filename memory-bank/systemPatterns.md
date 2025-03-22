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

### 2. Credentials
- Located in `credentials/AitableApi.credentials.ts`
- Manages API token storage and retrieval
- Implements the ICredentialType interface from n8n-workflow

### 3. Operation Handlers
- Implemented within the node definition
- Each operation (Get Node Details, Get Node List, Search Nodes) has its own handler
- Follows a consistent pattern of parameter validation, request preparation, API call, and response formatting

## Design Patterns

### Factory Pattern
- Operation handlers are selected based on the operation name
- Different execution paths are taken depending on the selected operation

### Adapter Pattern
- Transforms AITable API responses into formats suitable for n8n workflows
- Handles different node types with consistent output structure

### Strategy Pattern
- Different parameter sets and validation rules apply based on the selected operation
- Enables flexible handling of various AITable API endpoints

## Data Flow

1. **Input**: User configures node in n8n workflow with operation and parameters
2. **Authentication**: Node retrieves API token from stored credentials
3. **Request Preparation**: Parameters are validated and formatted for API request
4. **API Call**: Request is sent to AITable API
5. **Response Processing**: API response is parsed and formatted
6. **Output**: Processed data is returned to the n8n workflow

## Error Handling
- Input validation before API calls
- Specific error messages for common failure scenarios
- HTTP error handling with status code interpretation
- Node execution stops with appropriate error message on failure

## Technical Debt & Considerations
- The node currently focuses on read operations (GET requests)
- Future expansion may include write operations (POST, PUT, DELETE)
- Rate limiting and pagination handling could be improved
- Additional filtering options for large datasets may be needed 