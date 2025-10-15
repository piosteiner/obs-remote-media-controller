# GitHub Pages SPA Routing Fix

## Problem
When deploying a Single Page Application (SPA) to GitHub Pages, direct URL navigation fails:

- ✅ `https://obs-media-control.piogino.ch/` - Works
- ✅ `https://obs-media-control.piogino.ch/control` - Works when navigating from home
- ❌ `https://obs-media-control.piogino.ch/control` - **404 when refreshing or accessing directly**
- ❌ `https://obs-media-control.piogino.ch/library` - **404 when refreshing or accessing directly**
- ❌ `https://obs-media-control.piogino.ch/scenes` - **404 when refreshing or accessing directly**

### Why This Happens
GitHub Pages serves static files. When you request `/control`, it looks for a file at `control/index.html` which doesn't exist. Your React Router handles routing on the client side, but GitHub Pages doesn't know about that.

## Solution
Implemented the **spa-github-pages** solution:

1. **404.html** - Catches all failed routes
2. **index.html** - Decodes the redirect and restores the correct URL
3. **React Router** - Takes over and renders the correct page

### How It Works

```
User visits: https://obs-media-control.piogino.ch/library
     ↓
GitHub Pages: "No file at /library, serve 404.html"
     ↓
404.html: Redirects to /?/library (as query parameter)
     ↓
index.html: Decodes /?/library back to /library in browser history
     ↓
React Router: Sees /library route, renders Library component
     ↓
✅ Page loads correctly!
```

## Files Changed

### 1. `frontend/public/404.html` (NEW)
- Catches all 404 errors
- Converts path to query string
- Redirects to index.html with encoded path

### 2. `frontend/index.html` (UPDATED)
- Added script in `<head>` to decode redirect
- Restores correct URL using `history.replaceState`
- No page reload, seamless for user

## Testing

After deployment, test these scenarios:

### ✅ Should All Work Now:
1. **Direct URL access:**
   - Type `https://obs-media-control.piogino.ch/control` directly → Works!
   - Type `https://obs-media-control.piogino.ch/library` directly → Works!
   - Type `https://obs-media-control.piogino.ch/scenes` directly → Works!
   - Type `https://obs-media-control.piogino.ch/display` directly → Works!

2. **Refresh:**
   - Navigate to Control page → Press F5 → Still on Control page ✅
   - Navigate to Library → Press F5 → Still on Library ✅
   - Navigate to Scenes → Press F5 → Still on Scenes ✅

3. **Bookmarks:**
   - Bookmark any page → Click bookmark → Goes to correct page ✅

4. **Share links:**
   - Send library link to someone → They open it → Works! ✅

## Deployment

```bash
cd frontend
npm run deploy
```

The `gh-pages` package will automatically copy `public/404.html` to the deployed site.

## Verification Steps

1. Deploy the changes
2. Wait 1-2 minutes for GitHub Pages to rebuild
3. Test direct URLs:
   ```
   https://obs-media-control.piogino.ch/control
   https://obs-media-control.piogino.ch/library
   https://obs-media-control.piogino.ch/scenes
   https://obs-media-control.piogino.ch/display
   ```
4. All should load correctly! ✅

## Alternative Solutions (Not Used)

### ❌ Hash Routing
```jsx
<HashRouter>  // URLs become /#/control
```
**Why not:** Ugly URLs with `#`, not SEO friendly

### ❌ Server-side rewrites
```
All routes → index.html
```
**Why not:** GitHub Pages doesn't support custom server config

### ✅ spa-github-pages (Our choice)
- Clean URLs
- No server config needed
- Works perfectly with GitHub Pages
- Industry standard solution

## How It Works (Technical)

### 404.html Script
```javascript
// Converts: /library → /?/library
var l = window.location;
l.replace(
  l.protocol + '//' + l.hostname + 
  '/?/' + l.pathname.slice(1) + 
  l.search + l.hash
);
```

### index.html Script
```javascript
// Converts: /?/library → /library (in history)
if (l.search[1] === '/') {
  var decoded = l.search.slice(1);
  window.history.replaceState(null, null, decoded);
}
```

### React Router
```jsx
// Now sees /library in history, renders correctly
<Route path="/library" element={<Library />} />
```

## Browser History

The solution uses `history.replaceState()` which:
- ✅ Updates URL in address bar
- ✅ Doesn't reload the page
- ✅ Doesn't add to history (no extra back button press)
- ✅ Works with browser back/forward buttons

## SEO Considerations

While this works for users:
- Search engines may still see 404s initially
- The redirect happens client-side
- For better SEO, consider using Vercel/Netlify which support server-side rewrites

But for your use case (internal tool for meetings), this solution is perfect! ✅

## Troubleshooting

### If direct URLs still don't work:

1. **Clear browser cache:**
   ```
   Ctrl+Shift+R (hard refresh)
   ```

2. **Check GitHub Pages deployed the 404.html:**
   - Visit `https://obs-media-control.piogino.ch/404.html`
   - Should see minimal page with redirect script

3. **Check browser console:**
   - Should see no errors
   - URL should update from `/?/control` to `/control` instantly

4. **Verify deployment:**
   ```bash
   # Check if 404.html exists in gh-pages branch
   git checkout gh-pages
   ls 404.html  # Should exist
   git checkout main
   ```

## Related Issues

This solution also fixes:
- Bookmarking specific pages
- Sharing direct links to pages
- Opening links from external sources (email, Slack, etc.)
- iOS "Add to Home Screen" deep links

## Credits

Solution based on:
- https://github.com/rafgraph/spa-github-pages
- MIT License
- Used by many React apps on GitHub Pages

## Summary

**Before:** Only home page worked on refresh/direct access
**After:** All routes work perfectly, even with direct URLs! 🎉

Deploy and test - your routing issues should be completely fixed!
