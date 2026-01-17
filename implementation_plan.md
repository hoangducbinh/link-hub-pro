# Integrated Ad-Blocker Implementation Plan

Implement a network-level ad-blocker to provide a clean, fast, and secure browsing experience within the application's webviews.

## User Review Required

> [!IMPORTANT]
> The ad-blocker will operate at the **network level** via `session.webRequest`. It will not inject any CSS or JavaScript into the page by default, ensuring that the original website design and animations remain intact.

## Proposed Changes

### Main Process

#### [MODIFY] [main.ts](file:///Users/mac/Documents/freelance/linkhub-electron/electron/main.ts)
- Install `@cliqz/adblocker-electron` and `cross-fetch`.
- Initialize `ElectronBlocker` from `@cliqz/adblocker-electron`.
- Load standard lists (EasyList, EasyPrivacy, Peter Lowe's List).
- Apply the blocker to the default session and all future `persist:` sessions.
- Enhance `setWindowOpenHandler` to block unwanted redirects and popups even more strictly.

## Verification Plan

### Automated Tests
- N/A (Manual verification is more effective for ad-blocking).

### Manual Verification
- Navigate to ad-heavy sites (e.g., news sites, YouTube) and verify that ads are blocked.
- Verify that trackers are blocked in the developer tools network tab.
- Confirm that no "broken" layouts or missing critical assets occur.
- Verify that popups are effectively suppressed.

---

# Internal Tool System (Extensions) Plan

Implement a modular extension system where tools run on an overlay canvas above webviews, ensuring zero mutation of the guest website's DOM.

## Proposed Architecture

### Directory Structure
- `src/tools/`
  - `types.ts`: Interface and context definitions.
  - `registry.ts`: Singleton to manage tool registration.
  - `modules/`
    - `measure/`: Measuring tool.
    - `draw/`: Drawing tool.
- `src/components/`
  - `ToolMenu.tsx`: UI for toggling tools.
  - `ToolOverlay.tsx`: Generic canvas/SVG container for active tools.

### Technical Decision: Non-Destructive Overlay
We will use a `pointer-events: none` overlay container (or selective `auto` for drawing) that sits exactly above the webview. Tools will render into this layer using React Portals or direct composition. This avoids any conflict with the website's CSS, security policies (CSP), or performance.

## Proposed Changes

### [NEW] Tool Infrastructure
- Define `Tool` lifecycle: `onEnable`, `onDisable`, and `render`.
- `ToolContext` will provide access to the webview element and the overlay canvas.

### [MODIFY] App.tsx
- Store `activeTools: Record<string, string[]>` (instanceId -> toolIds).
- Update `TitleBar` to include the Extension icon.

### [MODIFY] WebViewManager.tsx
- Wrap each webview in a container that includes the `ToolOverlay`.
