# Animated workflow update

Plain HTML, CSS and vanilla JavaScript. No React, GSAP or animation dependencies.
The complete project in this ZIP already has everything connected.

## Upload to your existing GitHub repository

1. Extract the ZIP and open its `rys-automate` folder.
2. Upload the **contents** of that folder into your repository root. The root should contain `package.json`, `vercel.json`, `public/`, `api/`, and the other folders. Do not upload the ZIP itself or put an extra `rys-automate` folder inside the repository.
3. Commit the changes. If your repository is connected to Vercel, the commit triggers the next deployment.
4. Keep the existing Vercel project and environment variables. This visual update requires no new secrets or services.

Vercel reference: [Git deployments](https://vercel.com/docs/git) and [build configuration](https://vercel.com/docs/builds/configure-a-build).

The included configuration uses Framework Preset **Other**, Build Command **npm run build**, and Output Directory **dist**. If Vercel reports that `api/*.js` matches no functions, confirm that `api/intake.js` and `api/retry-deliveries.js` were uploaded at the same root level as `vercel.json`. Do not deploy only `public/` with the full project's server configuration.

To preview locally with Node.js 24:

```sh
npm run dev
```

Open `http://localhost:4173`. Use a local server instead of double-clicking the HTML file, because JavaScript modules need HTTP. Run `npm run build` to verify asset paths and produce `dist/`.

## Updating only the animation files

If you have made additional edits to your live portfolio, merge these changes rather than overwriting those edits:

- New: `public/workflow-background.css`, `public/workflow-background.js`.
- Updated: `public/index.html` (background layer, imports, workflow icons, pause button, fallback tool list).
- Updated: `public/app.js` (four workflow events and step timing).
- Updated: `public/tools.js` (8 new tools and activation listeners).
- Copy all of `public/assets/tools/`; it now contains 41 SVG files.
- Keep the existing `public/tools.css` and `public/styles.css`.

The backend is independent of these visual changes. The playground sends no data. The real contact form still needs the Supabase/Resend setup documented in `README.md` if you have not configured it yet.

## Drop the background into another plain HTML page

Copy the two `workflow-background` files. Load the stylesheet after your site styles, and load the JavaScript as a module:

```html
<link rel="stylesheet" href="/workflow-background.css">
<script type="module" src="/workflow-background.js"></script>
```

Place this immediately after the opening `<body>` tag:

```html
<div class="automation-background" aria-hidden="true"><canvas></canvas></div>
```

Place its optional motion control inside your visible page content:

```html
<button id="background-toggle" class="background-control" type="button"
        aria-pressed="false" hidden>Pause background</button>
```

The layer uses a negative z-index inside an isolated body and `pointer-events: none`. It cannot capture clicks. Existing opaque sections intentionally cover it. Avoid adding a transform to the body: that changes how fixed positioning works.

To trigger the background from a different workflow, dispatch this event once per stage from your own external JavaScript file:

```js
document.dispatchEvent(new CustomEvent('portfolio:workflow-step', {
  detail: { step: 0, tool: 'google-workspace' }
}));
```

Use stage numbers 0, 1, 2, 3 and tool IDs `google-workspace`, `codex`, `supabase`, `slack`. About 1.1 seconds per stage gives a 4.4-second sequence. At completion dispatch:

```js
document.dispatchEvent(new CustomEvent('portfolio:workflow-end'));
```

The included `app.js` already does this; do not add a second click handler to that version. The CSS activation effects use `.node.active`, `.node.done`, and `.demo.workflow-running`. Keep the supplied workflow markup if you want the same foreground icon sequence.

## Colors and speed

- `workflow-background.css`: change `--network-rgb` for circuit color, `--network-success-rgb` for the final-stage lime tint, and `--network-opacity` for overall subtlety. Values for the RGB variables are comma-separated channels, without `rgb()`.
- `styles.css`: the existing `--accent`, `--bg`, `--panel`, `--ink` variables control the portfolio theme. Some translucent teal values in `workflow-background.css` are decorative accents you can also change.
- `workflow-background.js`: `SETTINGS` controls frame rate, pixel density, circuit spacing, idle/burst speed, cursor glow radius, and burst duration.
- `app.js`: `workflowStepMs` sets each step's duration. Keep it aligned with `SETTINGS.burstDuration` and the `1.05s` foreground animation durations in the CSS if you change the pacing significantly.
- `workflow-background.css`: `--tools-duration` sets the first row's loop time. The second row has a separate `76s` rule. Larger numbers scroll more slowly.

## Tool list and logos

There are **41 unique tools**: the previous 33 plus Zcode, OpenCode, Codex, Docker, Ollama, Git, Ngrok and Cursor. Google Workspace, Slack, Vapi, Supabase, Vercel and GitHub were already present, so they appear once each. Google Workspace's individual app icons and Calendly are retained.

Edit `toolGroups` in `public/tools.js`:

```js
['Display name', 'icon-file-without-extension']
```

Add the corresponding SVG to `public/assets/tools/`. Update the HTML `<noscript>` list when changing the tool list. The second copy of each row is generated automatically for the seamless left-to-right loop and is hidden from assistive technology. Do not manually duplicate tools in the data.

The new recognizable logos come from the locally bundled Iconify Logos/Simple Icons collections. Zcode and OpenCode use custom code/terminal placeholders as requested; these are not official marks. The Google Workspace entry uses the recognizable Google G mark. Brand marks belong to their respective owners. See `TOOLS-UPDATE.md` for the existing icon sources; collection references are https://github.com/gilbarbara/logos and https://github.com/simple-icons/simple-icons.

## Motion and performance

- Canvas draws at up to 30 fps; device pixel ratio is capped at 1.5.
- Static circuit paths are cached and rebuilt only on resize; graph size is capped.
- Only bounded packets and one cursor glow repaint. Marquee and icon motion use CSS transforms/opacity.
- Background animation stops while the page is hidden. Marquee motion pauses when the tab is hidden, on hover/focus, or with its Pause motion button.
- Pause background stops decorative background and workflow icon motion. The demo still produces its result. The marquee has its own pause control.
- Reduced-motion preferences disable decorative motion and display a readable static tool list. The demo presents its final result without waiting for animation.
- No CDN requests, canvas images, API calls, or tracking are needed by this effect.

Verify after deployment: run the demo, check all four stages finish, try both pause controls, expand the tool list, and inspect the page on your phone. This update uses a decorative simulation; it does not claim that Codex or any other displayed service is being called by the playground.
