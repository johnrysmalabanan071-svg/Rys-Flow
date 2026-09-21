# Scrolling tools update

This update adds icons and two continuously scrolling rows moving **left to right**. It retains the original tools and adds Google Workspace, Gmail, Drive, Docs, Sheets, Slides, Calendar, Meet, Forms, Apps Script, Slack, Vapi, Supabase, Vercel, GitHub, and Calendly.

Hovering over the section or focusing a control pauses the animation. Visitors can also use **Pause motion** or **View all tools**. Reduced-motion settings automatically show a static, wrapped list. All 33 icons are bundled locally.

## Update your existing GitHub repository

1. Extract the ZIP.
2. In your repository, upload these three files from the package's `public` folder into the existing `public` folder: `index.html`, `tools.css`, and `tools.js`.
3. Upload the entire `public/assets/tools` folder, preserving that path. It contains the icons.
4. Optionally replace `scripts/build.mjs` with the included version; it now checks that every tool icon exists before building.
5. Commit the upload to the branch connected to Vercel. Vercel will build the new commit automatically when Git deployments are enabled. Otherwise, redeploy the latest commit from your Vercel project.
6. Open the deployed site, scroll to the tools section, and refresh with Ctrl+Shift+R if you still see the old version.

This ZIP also includes the complete portfolio if you prefer a full upload. Keep the existing backend credentials and environment variables. This tools update requires no additional services or keys.

If you have edited other content in `public/index.html` since the previous ZIP, preserve your copy and merge only these changes:

- Add `<link rel="stylesheet" href="/tools.css">` after the existing stylesheet link.
- Add `<script type="module" src="/tools.js"></script>` after the existing app script.
- Replace the old `<section class="tools-section wrap" ...>...</section>` with the new tools section from the included file.

## Vercel settings

- Framework: **Other**
- Root Directory: the folder containing `package.json`, `vercel.json`, `public`, and `api` together. Leave it empty when those files are at the repository root.
- Build command: `npm run build`
- Output directory: `dist`

Do not set the Root Directory to `public` or `dist`. Keep `api/intake.js` and `api/retry-deliveries.js` in their existing locations to avoid the earlier unmatched-functions error.

## Customize

- Tool names and order: `public/tools.js`, in `toolGroups`.
- Animation speed: change `68s` and `88s` in `public/tools.css`. Larger values move more slowly.
- Card colors and spacing: `.tool-chip` in `public/tools.css`.
- Direction: `tools-move-right` animates from `translateX(-50%)` to `translateX(0)`.
- Icons: `public/assets/tools/`.

Only the tools section and its integration were changed. No background animation or profile-title changes are part of this update.

## Icon sources

Brand icons are sourced from the [Iconify Logos collection](https://github.com/gilbarbara/logos), [Simple Icons](https://github.com/simple-icons/simple-icons), [Vapi's brand assets](https://vapi.ai/brand), the Apollo website icon, and the existing portfolio's HighLevel icon. REST API, webhook, and SQL icons are generic symbols. Brand marks identify the tools and do not imply endorsement.
