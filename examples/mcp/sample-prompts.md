# Sample MCP Prompts

> Example prompts demonstrating the Browser Vision MCP tools

## Basic Navigation

### Navigate and Screenshot

```
Navigate to example.com and take a screenshot so I can see what it looks like.
```

### Multi-Page Navigation

```
Go to https://news.ycombinator.com, then navigate to the top story and take a screenshot.
```

## Form Interaction

### Fill and Submit Form

```
Navigate to the login page at example.com/login, fill in the username "testuser"
and password "testpass", then click the submit button and show me the result.
```

### Search

```
Go to google.com, search for "MCP protocol browser automation", and take a
screenshot of the results.
```

## Accessibility and Snapshot

### Get Page Structure

```
Navigate to example.com and get a snapshot showing all interactive elements.
```

### Click by Reference

```
Go to example.com, get a snapshot, then click on the first link and take
a screenshot.
```

## Data Extraction

### Extract Page Data

```
Navigate to example.com and use JavaScript to extract all the headings
and their text content.
```

### Scrape Links

```
Go to https://news.ycombinator.com and extract all the story titles and URLs.
```

## E-commerce

### Product Search

```
Navigate to amazon.com, search for "wireless headphones", filter by 4 stars
and above, and show me the first 3 products.
```

### Price Comparison

```
Go to multiple retailer websites and compare prices for "iPhone 15".
```

## Testing and QA

### Visual Regression

```
Navigate to our staging site, take a screenshot of the homepage, then compare
it to the production site and tell me any visual differences.
```

### Form Validation

```
Test the signup form at example.com/signup by submitting it without filling
any fields. Take a screenshot of the error messages.
```

## Research

### Academic Paper

```
Navigate to arxiv.org, find a recent paper on "machine learning", open the PDF,
and extract the abstract.
```

### Documentation

```
Go to the React documentation, find the section on hooks, and summarize the
key concepts with code examples.
```

## Complex Workflows

### Checkout Flow

```
Navigate to an e-commerce site, add an item to cart, proceed to checkout,
fill in shipping information (use test data), and take screenshots at each step.
```

### Social Media

```
Go to Twitter/X, search for posts about "AI automation" from the last 24 hours,
and summarize the top 5 trending topics.
```

## Debugging

### Error Investigation

```
Navigate to our error page at example.com/error, open the browser console,
and extract any JavaScript errors.
```

### Performance Check

```
Go to example.com and use JavaScript to measure the page load time and
resource sizes.
```

## Multi-Session

### Compare Sessions

```
Open two browser sessions - one logged in as "user1" and one as "user2".
Navigate to the dashboard in both and compare what's visible.
```

### Parallel Tasks

```
In session "A", navigate to news site 1. In session "B", navigate to news site 2.
Extract headlines from both and compare coverage of today's top story.
```

## Advanced JavaScript

### Custom Scripts

```
Navigate to example.com and run this script: scroll to the bottom, count all
images, and return the total file size of images loaded.
```

### DOM Manipulation

```
Go to a blank page and use JavaScript to create a simple table with sample data,
then take a screenshot.
```

## Scroll and Viewport

### Long Page Capture

```
Navigate to a long article, scroll down to capture the full content, and
take a full-page screenshot.
```

### Lazy Loading

```
Go to a page with infinite scroll, scroll down 3 times to load more content,
and take a screenshot of the loaded items.
```

## Authentication

### Login Flow

```
Navigate to the login page, fill in credentials from environment variables,
click login, and verify we reach the dashboard.
```

### Session Persistence

```
Log in to example.com, navigate to the profile page, close the session,
reopen it, and verify we're still logged in.
```

## Responsive Testing

### Mobile View

```
Navigate to example.com, set viewport to iPhone dimensions, and take screenshots
of how the page looks on mobile.
```

### Multiple Viewports

```
Take screenshots of example.com at these viewports: 1920x1080, 1366x768,
768x1024, and 375x667.
```

## Content Verification

### Text Extraction

```
Navigate to example.com/about and extract all the text content. Check if it
mentions "sustainability" and tell me the context.
```

### Link Validation

```
Go to example.com, extract all links, visit each one, and report any 404 errors.
```

## Accessibility Testing

### A11y Check

```
Navigate to example.com, get a snapshot, and identify elements that might
have accessibility issues (missing alt text, low contrast, etc.).
```

### Keyboard Navigation

```
Go to a form and demonstrate that it can be navigated using only the Tab key.
```

## Tips for Best Results

### Be Specific

✅ Good:

```
Navigate to https://github.com/microsoft/playwright, click on the "Issues" tab,
filter by label "bug", and take a screenshot of the first 5 issues.
```

❌ Vague:

```
Go to GitHub and look at issues.
```

### Use Snapshots for Interaction

✅ Good:

```
Navigate to example.com, get a snapshot of interactive elements, then click
on the button labeled "Learn More".
```

### Chain Commands Thoughtfully

Break complex workflows into steps:

1. Navigate
2. Get snapshot/interact
3. Take screenshot
4. Extract data

### Handle Dynamic Content

```
Wait for the page to fully load (use waitUntil: networkidle), then get a
snapshot and interact with elements.
```

### Session Management

```
Use session "research" for this research task so we can come back to it later.
```
