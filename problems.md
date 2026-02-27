[{
"resource": "/Users/rna/Desktop/Clawtopus-main/tests/mcp/integration.test.ts",
"owner": "_generated_diagnostic_collection_name_#8",
"code": {
"value": "eslint(no-unused-vars)",
"target": {
"$mid": 1,
"path": "/docs/guide/usage/linter/rules/eslint/no-unused-vars.html",
"scheme": "https",
"authority": "oxc.rs"
}
},
"severity": 8,
"message": "Identifier 'vi' is imported but never used.\nhelp: Consider removing this import.",
"source": "oxc",
"startLineNumber": 10,
"startColumn": 55,
"endLineNumber": 10,
"endColumn": 57,
"relatedInformation": [
{
"startLineNumber": 10,
"startColumn": 55,
"endLineNumber": 10,
"endColumn": 57,
"message": "'vi' is imported here",
"resource": "/Users/rna/Desktop/Clawtopus-main/tests/mcp/integration.test.ts"
}
],
"modelVersionId": 962,
"origin": "extHost2"
},{
"resource": "/Users/rna/Desktop/Clawtopus-main/tests/mcp/integration.test.ts",
"owner": "typescript",
"code": "2322",
"severity": 8,
"message": "Type '{ send: (message: unknown) => Promise<void>; onMessage: (handler: (msg: unknown) => void) => void; close: () => Promise<void>; isClosed: () => boolean; on: (\_event: string, \_handler: (data?: unknown) => void) => void; messages: unknown[]; readonly handler: ((msg: unknown) => void) | null; simulateMessage: (msg: unkn...' is not assignable to type 'Transport & { messages: unknown[]; simulateMessage: (msg: unknown) => void; handler: ((msg: unknown) => void) | null; }'.\n Type '{ send: (message: unknown) => Promise<void>; onMessage: (handler: (msg: unknown) => void) => void; close: () => Promise<void>; isClosed: () => boolean; on: (\_event: string, \_handler: (data?: unknown) => void) => void; messages: unknown[]; readonly handler: ((msg: unknown) => void) | null; simulateMessage: (msg: unkn...' is not assignable to type 'Transport'.\n Types of property 'onMessage' are incompatible.\n Type '(handler: (msg: unknown) => void) => void' is not assignable to type '(handler: (message: MCPRequest | MCPNotification) => void) => void'.\n Types of parameters 'handler' and 'handler' are incompatible.\n Types of parameters 'message' and 'msg' are incompatible.\n Type 'unknown' is not assignable to type 'MCPRequest | MCPNotification'.",
"source": "ts",
"startLineNumber": 57,
"startColumn": 3,
"endLineNumber": 57,
"endColumn": 9,
"modelVersionId": 962,
"origin": "extHost2"
},{
"resource": "/Users/rna/Desktop/Clawtopus-main/src/mcp/tools/navigate.ts",
"owner": "typescript",
"code": "2307",
"severity": 8,
"message": "Cannot find module '../security/url-filter.js' or its corresponding type declarations.",
"source": "ts",
"startLineNumber": 9,
"startColumn": 43,
"endLineNumber": 9,
"endColumn": 70,
"modelVersionId": 107,
"origin": "extHost2"
},{
"resource": "/Users/rna/Desktop/Clawtopus-main/src/mcp/tools/evaluate.ts",
"owner": "typescript",
"code": "2307",
"severity": 8,
"message": "Cannot find module '../security/audit.js' or its corresponding type declarations.",
"source": "ts",
"startLineNumber": 9,
"startColumn": 31,
"endLineNumber": 9,
"endColumn": 53,
"modelVersionId": 117,
"origin": "extHost2"
},{
"resource": "/Users/rna/Desktop/Clawtopus-main/src/mcp/tools/evaluate.ts",
"owner": "typescript",
"code": "2307",
"severity": 8,
"message": "Cannot find module '../security/script-sandbox.js' or its corresponding type declarations.",
"source": "ts",
"startLineNumber": 10,
"startColumn": 33,
"endLineNumber": 10,
"endColumn": 64,
"modelVersionId": 117,
"origin": "extHost2"
},{
"resource": "/Users/rna/Desktop/Clawtopus-main/src/mcp/tools/close.ts",
"owner": "typescript",
"code": "2307",
"severity": 8,
"message": "Cannot find module '../session/manager.js' or its corresponding type declarations.",
"source": "ts",
"startLineNumber": 9,
"startColumn": 32,
"endLineNumber": 9,
"endColumn": 55,
"modelVersionId": 92,
"origin": "extHost2"
}]
