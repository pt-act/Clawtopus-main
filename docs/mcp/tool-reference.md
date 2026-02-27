# Browser Vision MCP Tool Reference

> Complete reference for all 8 browser automation tools

## Table of Contents

- [browser.navigate](#browsernavigate)
- [browser.screenshot](#browserscreenshot)
- [browser.click](#browserclick)
- [browser.fill](#browserfill)
- [browser.snapshot](#browsersnapshot)
- [browser.scroll](#browserscroll)
- [browser.evaluate](#browserevaluate)
- [browser.close](#browserclose)

---

## browser.navigate

Navigate to a URL with validation and wait conditions.

### Parameters

| Name        | Type   | Required | Default        | Description                                                          |
| ----------- | ------ | -------- | -------------- | -------------------------------------------------------------------- |
| `url`       | string | ✅       | -              | URL to navigate to                                                   |
| `waitUntil` | string | ❌       | `"load"`       | When navigation completes: `load`, `domcontentloaded`, `networkidle` |
| `timeout`   | number | ❌       | `30000`        | Navigation timeout in milliseconds                                   |
| `sessionId` | string | ❌       | auto-generated | Browser session identifier                                           |

### Example

```json
{
  "name": "browser.navigate",
  "arguments": {
    "url": "https://example.com",
    "waitUntil": "networkidle",
    "timeout": 30000
  }
}
```

### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully navigated to https://example.com (200 OK)"
    }
  ]
}
```

### Errors

- `InvalidParams`: URL is invalid
- `AuthorizationError`: URL not in allowlist
- `Timeout`: Navigation exceeded timeout

---

## browser.screenshot

Capture screenshot optimized for vision models.

### Parameters

| Name                       | Type    | Required | Default | Description                        |
| -------------------------- | ------- | -------- | ------- | ---------------------------------- |
| `selector`                 | string  | ❌       | -       | CSS selector for specific element  |
| `fullPage`                 | boolean | ❌       | `false` | Capture full page vs viewport      |
| `includeAccessibilityTree` | boolean | ❌       | `true`  | Include accessibility tree as text |
| `sessionId`                | string  | ❌       | current | Browser session identifier         |

### Example

```json
{
  "name": "browser.screenshot",
  "arguments": {
    "fullPage": false,
    "includeAccessibilityTree": true
  }
}
```

### Response

```json
{
  "content": [
    {
      "type": "image",
      "data": "base64-encoded-jpeg...",
      "mimeType": "image/jpeg"
    },
    {
      "type": "text",
      "text": "[Snapshot of example.com]\n- @e1: heading \"Example Domain\" (level: 1)\n- @e2: paragraph \"This domain...\""
    }
  ]
}
```

### Vision Optimization

Screenshots are automatically optimized:

- Format: JPEG
- Max dimensions: 2000px (configurable)
- Max file size: 5MB
- Quality: 85% (with fallback to 35%)

---

## browser.click

Click an element on the page.

### Parameters

| Name                | Type    | Required | Default | Description                        |
| ------------------- | ------- | -------- | ------- | ---------------------------------- |
| `selector`          | string  | ✅       | -       | CSS selector or @ref from snapshot |
| `waitForNavigation` | boolean | ❌       | `false` | Wait for navigation after click    |
| `timeout`           | number  | ❌       | `5000`  | Click timeout in milliseconds      |
| `sessionId`         | string  | ❌       | current | Browser session identifier         |

### Example

```json
{
  "name": "browser.click",
  "arguments": {
    "selector": "button#submit",
    "waitForNavigation": true,
    "timeout": 5000
  }
}
```

Using @ref from snapshot:

```json
{
  "name": "browser.click",
  "arguments": {
    "selector": "@e3"
  }
}
```

### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Clicked element: button#submit"
    }
  ]
}
```

### Errors

- `InvalidParams`: Selector is empty
- `NotFound`: Element not found
- `Timeout`: Click timed out

---

## browser.fill

Fill an input field with text.

### Parameters

| Name         | Type    | Required | Default | Description                            |
| ------------ | ------- | -------- | ------- | -------------------------------------- |
| `selector`   | string  | ✅       | -       | CSS selector or @ref for input element |
| `value`      | string  | ✅       | -       | Value to fill                          |
| `clearFirst` | boolean | ❌       | `true`  | Clear existing value before filling    |
| `sessionId`  | string  | ❌       | current | Browser session identifier             |

### Example

```json
{
  "name": "browser.fill",
  "arguments": {
    "selector": "input#username",
    "value": "john.doe@example.com",
    "clearFirst": true
  }
}
```

### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Filled input#username with \"john.doe@example.com\""
    }
  ]
}
```

---

## browser.snapshot

Get accessibility tree with element references.

### Parameters

| Name              | Type    | Required | Default | Description                      |
| ----------------- | ------- | -------- | ------- | -------------------------------- |
| `selector`        | string  | ❌       | -       | Scope to specific element        |
| `interactiveOnly` | boolean | ❌       | `false` | Only show interactive elements   |
| `compact`         | boolean | ❌       | `true`  | Remove empty structural elements |
| `sessionId`       | string  | ❌       | current | Browser session identifier       |

### Example

```json
{
  "name": "browser.snapshot",
  "arguments": {
    "interactiveOnly": true,
    "compact": true
  }
}
```

### Response

```text
[Snapshot of example.com]
- @e1: heading "Example Domain" (level: 1)
- @e2: paragraph "This domain is for use in illustrative examples..."
- @e3: link "More information..." → https://www.iana.org/domains/example
```

### Element References

Elements are assigned `@eN` references for use with `browser.click` and `browser.fill`.

---

## browser.scroll

Scroll the page.

### Parameters

| Name        | Type   | Required | Default  | Description                                     |
| ----------- | ------ | -------- | -------- | ----------------------------------------------- |
| `direction` | string | ❌       | `"down"` | Scroll direction: `up`, `down`, `left`, `right` |
| `pixels`    | number | ❌       | `300`    | Pixels to scroll                                |
| `selector`  | string | ❌       | -        | Scroll specific element                         |
| `sessionId` | string | ❌       | current  | Browser session identifier                      |

### Example

```json
{
  "name": "browser.scroll",
  "arguments": {
    "direction": "down",
    "pixels": 500
  }
}
```

### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Scrolled down by 500 pixels"
    }
  ]
}
```

---

## browser.evaluate

Execute JavaScript with sandboxing.

### Parameters

| Name        | Type   | Required | Default | Description                 |
| ----------- | ------ | -------- | ------- | --------------------------- |
| `script`    | string | ✅       | -       | JavaScript code to execute  |
| `args`      | array  | ❌       | `[]`    | Arguments to pass to script |
| `sessionId` | string | ❌       | current | Browser session identifier  |

### Example

```json
{
  "name": "browser.evaluate",
  "arguments": {
    "script": "return document.title"
  }
}
```

### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Example Domain"
    }
  ]
}
```

### Security Restrictions

Blocked patterns:

- `eval(` - Dynamic code execution
- `Function(` - Function constructor
- `document.cookie` - Cookie access
- `localStorage` / `sessionStorage` - Storage access

---

## browser.close

Close browser session and cleanup resources.

### Parameters

| Name        | Type    | Required | Default | Description                               |
| ----------- | ------- | -------- | ------- | ----------------------------------------- |
| `sessionId` | string  | ❌       | current | Session to close (omitted = all sessions) |
| `graceful`  | boolean | ❌       | `true`  | Wait for pending operations               |

### Example

```json
{
  "name": "browser.close",
  "arguments": {
    "sessionId": "my-session",
    "graceful": true
  }
}
```

### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Closed session: my-session"
    }
  ]
}
```

---

## Session Management

### Automatic Session Creation

Sessions are created automatically on first tool call. Use `sessionId` to maintain state across calls.

```json
// First call - creates session
{ "name": "browser.navigate", "arguments": { "url": "...", "sessionId": "my-session" } }

// Subsequent calls - reuse session
{ "name": "browser.screenshot", "arguments": { "sessionId": "my-session" } }
```

### Session Timeout

Sessions auto-close after 30 minutes of inactivity (configurable).

### Session Isolation

Sessions are isolated by default. Set `allowSharedSessions: true` in config to enable sharing.

---

## Error Codes

| Code     | Name                 | Description                         |
| -------- | -------------------- | ----------------------------------- |
| `-32700` | ParseError           | Invalid JSON                        |
| `-32600` | InvalidRequest       | Invalid request object              |
| `-32601` | MethodNotFound       | Method doesn't exist                |
| `-32602` | InvalidParams        | Invalid parameters                  |
| `-32603` | InternalError        | Internal server error               |
| `-32000` | ServerNotInitialized | Server not initialized              |
| `-32001` | ToolNotFound         | Tool doesn't exist                  |
| `-32002` | AuthorizationError   | Authentication/authorization failed |
