# 📸 Adding Screenshots to README

## Required Screenshots

You need to add 2 screenshots to make the README complete:

### 1. Hero Screenshot (`hero.png`)
- **Location**: Save as `docs/screenshots/hero.png`
- **Content**: Main landing page
- **What to capture**:
  - Full page view
  - "Map every dependency. Score every risk." heading
  - Input field with example address
  - Analyze button
  - Background graph animation

### 2. Dashboard Screenshot (`dashboard.png`)
- **Location**: Save as `docs/screenshots/dashboard.png`
- **Content**: Dashboard with analyzed contract
- **What to capture**:
  - Full dashboard view
  - Dependency tree on the left
  - Interactive graph in the center
  - Node details on the right
  - Header with input field
  - Multiple nodes with different risk colors

## How to Take Screenshots

### Option 1: Using Browser DevTools
1. Open the page you want to screenshot
2. Press `F12` to open DevTools
3. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
4. Type "screenshot" and select "Capture full size screenshot"
5. Save the file

### Option 2: Using macOS Screenshot Tool
1. Press `Cmd+Shift+4`
2. Press `Space` to capture the entire window
3. Click on the browser window
4. Save the file

### Option 3: Using Windows Snipping Tool
1. Open Snipping Tool
2. Select "Window Snip"
3. Click on the browser window
4. Save the file

## Screenshot Guidelines

- **Format**: PNG (preferred) or JPG
- **Resolution**: 1920x1080 or higher
- **Quality**: High quality, no compression artifacts
- **Content**: Use a real contract address for demo (e.g., `0xA1D94F746dEfa1928926b84fB2596c06926C0405`)
- **Theme**: Dark theme (default)
- **Browser**: Chrome or Firefox (for consistency)

## After Adding Screenshots

1. Save screenshots to `docs/screenshots/` directory:
   ```
   docs/screenshots/hero.png
   docs/screenshots/dashboard.png
   ```

2. Verify the README displays them correctly:
   ```bash
   # View README in browser or GitHub
   ```

3. Commit the screenshots:
   ```bash
   git add docs/screenshots/
   git commit -m "Add screenshots to README"
   ```

## Example Contract for Screenshots

Use this contract address for consistent demo screenshots:
```
0xA1D94F746dEfa1928926b84fB2596c06926C0405
```

This contract has a good dependency graph that shows multiple levels and various risk scores.

## Troubleshooting

### Screenshots not showing in README
- Check file paths are correct
- Ensure files are named exactly `hero.png` and `dashboard.png`
- Verify files are in `docs/screenshots/` directory
- Check file permissions

### Screenshots too large
- Optimize with tools like TinyPNG or ImageOptim
- Target size: < 500KB per image
- Don't sacrifice quality for size

### Screenshots look blurry
- Use higher resolution display
- Capture at 2x or 3x scale
- Use PNG format instead of JPG
- Avoid browser zoom
