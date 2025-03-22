# Technical Context

## Technologies Used

### Core Technologies
- **TypeScript**: Primary development language
- **Node.js**: Runtime environment (v18.10+)
- **pnpm**: Package manager (v9.1+)

### Dependencies
- **n8n-workflow**: Core n8n library for node development
- **HTTP Client**: Built-in Node.js http/https modules for API communication

### Development Tools
- **ESLint**: Code linting with custom rules for n8n nodes
- **Prettier**: Code formatting
- **TypeScript Compiler**: Transpilation to JavaScript
- **Gulp**: Build process automation, especially for icon handling

## Development Setup

### Environment Requirements
- Node.js v18.10 or higher
- pnpm v9.1 or higher
- n8n (for testing)

### Build Process
1. Clone repository
2. Install dependencies with `pnpm install`
3. Build with `pnpm build`
   - Transpiles TypeScript to JavaScript
   - Processes icons with Gulp
   - Outputs to `dist/` directory

### Development Workflow
1. Make changes to source files
2. Use `pnpm dev` for watch mode during development
3. Lint with `pnpm lint`
4. Format with `pnpm format`
5. Test manually by installing the node in n8n
6. Version with appropriate `pnpm version:*` command
7. Release with `pnpm release`

## Technical Constraints

### AITable API Limitations
- Request rate limits may apply
- API version compatibility must be maintained (currently v1)
- Authentication is token-based only

### n8n Integration Constraints
- Must follow n8n community node structure
- Compatible with n8n v1.0+
- Limited to capabilities exposed by n8n-workflow interfaces
- Node's output must be compatible with n8n data formats

## Module Structure

```
n8n-aitable/
├── credentials/               # Credential definitions
│   └── AitableApi.credentials.ts
├── nodes/                     # Node definitions
│   └── Aitable/
│       └── Aitable.node.ts
├── dist/                      # Compiled output (generated)
├── package.json               # Project configuration
└── tsconfig.json              # TypeScript configuration
```

## Configuration Files

### package.json
- Defines project metadata, dependencies, and scripts
- Contains n8n-specific configuration for node and credential registration

### tsconfig.json
- TypeScript compiler configuration
- Target ECMAScript version and module system
- Source and output directory settings

### ESLint & Prettier
- Code quality and style enforcement
- n8n-specific linting rules via eslint-plugin-n8n-nodes-base 