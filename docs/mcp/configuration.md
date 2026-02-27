# Configuration Reference

> Complete configuration options for the Browser Vision MCP Server

## Configuration File

Configuration is loaded from YAML files in the following order:

1. `CLAWTOPUS_MCP_CONFIG` environment variable
2. `./clawtopus-mcp.yaml` (project root)
3. `~/.clawtopus/mcp-config.yaml` (user home)
4. `~/.config/clawtopus/mcp-config.yaml` (XDG config)

## Configuration Schema

```yaml
mcp:
  browser:
    # Server identity
    name: "clawtopus-browser-mcp"
    version: "1.0.0"

    # Transport configuration
    transport:
      type: "stdio" # or "http", "sse"
      port: 8081 # for http/sse
      host: "localhost"
      pathPrefix: "/mcp"

    # Authentication
    auth:
      mode: "token" # "none", "token", "bearer"
      token: "" # or use MCP_AUTH_TOKEN env var
      tokenFile: "~/.clawtopus/mcp-token"
      useGatewayAuth: false

    # Session management
    sessions:
      maxConcurrent: 10
      maxPerClient: 3
      timeoutMinutes: 30
      allowSharedSessions: false

    # Security settings
    security:
      requireHttps: true
      blockPrivateIps: false
      urlAllowlist:
        - "*.example.com"
        - "localhost"
        - "127.0.0.1"
      allowedDomains:
        - "example.com"
        - "github.com"
      blockedJsPatterns:
        - "eval\\s*\\("
        - "Function\\s*\\("
        - "document\\.cookie"
        - "localStorage"
        - "sessionStorage"
      auditLogging: true
      auditLogPath: "~/.clawtopus/audit.log"

    # Screenshot optimization
    screenshot:
      maxWidth: 2000
      maxHeight: 2000
      maxBytes: 5242880 # 5MB
      quality: 85 # JPEG quality (0-100)
      fallbackQuality: 35

    # Browser configuration
    defaultCdpUrl: "" # Default CDP WebSocket URL
    browserProfile: "" # Browser profile name
```

## Configuration Options

### Server Identity

| Option    | Type   | Default                 | Description                         |
| --------- | ------ | ----------------------- | ----------------------------------- |
| `name`    | string | `clawtopus-browser-mcp` | Server name reported to MCP clients |
| `version` | string | `1.0.0`                 | Server version                      |

### Transport

| Option       | Type   | Default     | Description                            |
| ------------ | ------ | ----------- | -------------------------------------- |
| `type`       | enum   | `stdio`     | Transport type: `stdio`, `http`, `sse` |
| `port`       | number | `8081`      | Port for HTTP/SSE transport            |
| `host`       | string | `localhost` | Host for HTTP/SSE transport            |
| `pathPrefix` | string | `/mcp`      | URL path prefix for HTTP routes        |

#### Transport Types

**stdio** (default)

- Used for Claude Desktop, Cline
- Communicates via stdin/stdout
- No additional configuration needed

```yaml
transport:
  type: "stdio"
```

**http**

- REST-like HTTP endpoints
- Good for web-based integrations

```yaml
transport:
  type: "http"
  port: 8081
  host: "0.0.0.0"
```

**sse** (Server-Sent Events)

- Real-time bidirectional communication
- Supports streaming responses

```yaml
transport:
  type: "sse"
  port: 8081
```

### Authentication

| Option           | Type    | Default | Description                          |
| ---------------- | ------- | ------- | ------------------------------------ |
| `mode`           | enum    | `token` | Auth mode: `none`, `token`, `bearer` |
| `token`          | string  | -       | Static token (or use env var)        |
| `tokenFile`      | string  | -       | Path to token file                   |
| `useGatewayAuth` | boolean | `false` | Use gateway auth service             |

#### Auth Modes

**none**

- No authentication required
- Use only in trusted environments

```yaml
auth:
  mode: "none"
```

**token** (default)

- Bearer token validation
- Token from env var `MCP_AUTH_TOKEN` or config

```yaml
auth:
  mode: "token"
  token: "your-secret-token"
```

**bearer**

- Full OAuth2 bearer token flow
- Requires gateway auth integration

```yaml
auth:
  mode: "bearer"
  useGatewayAuth: true
```

### Sessions

| Option                | Type    | Default | Description                 |
| --------------------- | ------- | ------- | --------------------------- |
| `maxConcurrent`       | number  | `10`    | Maximum concurrent sessions |
| `maxPerClient`        | number  | `3`     | Maximum sessions per client |
| `timeoutMinutes`      | number  | `30`    | Session timeout in minutes  |
| `allowSharedSessions` | boolean | `false` | Allow session sharing       |

```yaml
sessions:
  maxConcurrent: 20
  maxPerClient: 5
  timeoutMinutes: 60
  allowSharedSessions: true
```

### Security

| Option              | Type    | Default | Description             |
| ------------------- | ------- | ------- | ----------------------- |
| `requireHttps`      | boolean | `true`  | Require HTTPS URLs      |
| `blockPrivateIps`   | boolean | `false` | Block private IP ranges |
| `urlAllowlist`      | array   | `[]`    | URL patterns to allow   |
| `allowedDomains`    | array   | `[]`    | Allowed domains         |
| `blockedJsPatterns` | array   | `[...]` | Blocked JS patterns     |
| `auditLogging`      | boolean | `true`  | Enable audit logging    |
| `auditLogPath`      | string  | -       | Path to audit log       |

#### URL Allowlist Patterns

Supports wildcards:

```yaml
security:
  urlAllowlist:
    - "https://*.example.com" # Subdomains
    - "https://api.example.com/*" # Paths
    - "localhost:*" # Localhost with any port
    - "127.0.0.1" # IPv4
    - "::1" # IPv6 localhost
```

#### Blocked JavaScript Patterns

Default blocked patterns:

```yaml
security:
  blockedJsPatterns:
    - "eval\\s*\\(" # eval()
    - "Function\\s*\\(" # Function()
    - "document\\.cookie" # Cookie access
    - "localStorage" # Local storage
    - "sessionStorage" # Session storage
    - "fetch\\s*\\([^)]*\\)" # fetch() with dynamic URLs
    - "XMLHttpRequest" # XHR requests
```

### Screenshots

| Option            | Type   | Default   | Description                  |
| ----------------- | ------ | --------- | ---------------------------- |
| `maxWidth`        | number | `2000`    | Maximum width in pixels      |
| `maxHeight`       | number | `2000`    | Maximum height in pixels     |
| `maxBytes`        | number | `5242880` | Maximum file size (5MB)      |
| `quality`         | number | `85`      | JPEG quality (0-100)         |
| `fallbackQuality` | number | `35`      | Quality if maxBytes exceeded |

```yaml
screenshot:
  maxWidth: 1920
  maxHeight: 1080
  maxBytes: 2097152 # 2MB
  quality: 90
  fallbackQuality: 50
```

## Environment Variables

Override config with environment variables:

| Variable                    | Description                     |
| --------------------------- | ------------------------------- |
| `MCP_AUTH_TOKEN`            | Authentication token            |
| `CLAWTOPUS_MCP_CONFIG`      | Config file path                |
| `CHROME_PATH`               | Chrome/Chromium executable path |
| `CLAWTOPUS_BROWSER_PROFILE` | Default browser profile         |

## Example Configurations

### Development

```yaml
mcp:
  browser:
    auth:
      mode: "none"
    security:
      requireHttps: false
      blockPrivateIps: false
```

### Production

```yaml
mcp:
  browser:
    auth:
      mode: "token"
      tokenFile: "/etc/clawtopus/mcp-token"
    security:
      requireHttps: true
      blockPrivateIps: true
      urlAllowlist:
        - "https://*.company.com"
      auditLogging: true
      auditLogPath: "/var/log/clawtopus/audit.log"
    sessions:
      maxConcurrent: 50
      timeoutMinutes: 15
```

### CI/CD

```yaml
mcp:
  browser:
    auth:
      mode: "none"
    transport:
      type: "stdio"
    screenshot:
      quality: 70
      maxBytes: 1048576 # 1MB for faster uploads
```

## Configuration Validation

The server validates configuration on startup:

- Transport type must be valid
- Port must be in valid range (1-65535)
- Timeout must be positive
- Quality must be 0-100

Invalid configuration will cause the server to exit with an error.

## Reloading Configuration

Configuration is loaded once at startup. To apply changes:

1. Update config file
2. Restart MCP server
3. Restart Claude Desktop (if using stdio transport)
