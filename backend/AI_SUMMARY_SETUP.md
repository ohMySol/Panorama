# AI Summary Setup

The AI summary feature generates protocol summaries when no node is selected in the dashboard.

## Free AI API (Groq)

We use **Groq** - a free, fast AI API that doesn't require a credit card.

### Setup Steps:

1. **Get a free API key** (no credit card required):
   - Go to https://console.groq.com
   - Sign up for a free account
   - Navigate to API Keys section
   - Create a new API key

2. **Add the key to your `.env` file**:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Restart the backend**:
   ```bash
   npm run dev
   ```

## Fallback Mode

If no API key is configured, the system automatically generates a simple summary from the graph data without AI. This includes:
- Number of contracts and dependencies
- Contract categories
- Risk score
- Top risk flags
- Total TVL (if available)

## Models Used

- **Groq Model**: `llama-3.3-70b-versatile`
  - Fast inference (< 1 second)
  - Free tier: 30 requests/minute
  - No credit card required

## Alternative: No API Key

The system works perfectly fine without any API key - it will just show a data-driven summary instead of an AI-generated one.
