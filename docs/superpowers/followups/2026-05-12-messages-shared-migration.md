# Followup: Migrate /messages page to shared chat-shared components

**Filed:** 2026-05-12
**Origin:** Batch 7 of chat popup implementation (`docs/superpowers/plans/2026-05-12-chat-popup-implementation.md`)
**Status:** Deferred

## Context

During the chat popup brainstorm, the user chose the "shared module" option (popup and `/messages` page consume the same chat-shared components). Batch 7 was intended to refactor `src/components/messages/MessagesLayout.ts`, `InboxPanel.ts`, `MessageList.ts`, `MessageContent.ts` to consume `src/components/chat-shared/*` instead of their own bespoke chat bubble/header/composer implementations.

## Why deferred

`src/alpine/messages.ts` (223 lines) and `src/components/messages/MessageContent.ts` (184 lines) already implement a complete chat thread UI with their own state shape (`selectedConversation`, `newMessage`, `messages`, etc.). The shape diverges from `$store.chatPopup` (which uses `activeConversationId`, `activeMessages`, `draft`). Bridging the two without regression on the `/messages` page requires:

1. Renaming state fields OR adding a translation layer
2. Refactoring template references in 4 files (`MessagesLayout`, `InboxPanel`, `MessageList`, `MessageContent`)
3. Ensuring search filtering, category tabs, and the empty-state SVG illustration continue working
4. Regression testing across desktop and the mobile (max-2xl) breakpoint

This is a 2-3 day refactor in its own right. Shipping it together with the popup risks breaking the existing `/messages` page in production, which already works.

## Plan when picked up

1. Promote `chatStore` state fields to match what `/messages` expects (or vice-versa). Most likely: rename `chatStore.draft` → `chatStore.newMessage`, `activeConversationId` → keep, expose `activeConversation` getter (already done).
2. Refactor `MessagesLayout` to import from `chat-shared/`: replace its `MessageContent`'s chat header/messages/composer rendering with `ChatHeader`, `ChatMessages`, `ChatComposer`.
3. Keep `messages/InboxPanel` and `messages/MessageList` as-is (they're page-specific with search/category-tabs/scroll behaviors).
4. Migrate `messages.ts` Alpine module to use the same chatService stub.
5. Add `/messages` regression test: snapshot the rendered HTML at desktop and mobile, verify after refactor.

## Acceptance

- /messages page renders identically (same screenshots) before and after the refactor.
- Chat popup continues to work on product detail, TopBar trigger, mobile tabs.
- Search input on /messages still filters conversations.
- Mobile swipe-to-go-back from `/messages` chat view continues to work.

## Estimate

3-5 PRs spread over a week, behind no flag (the refactor is internal). Suggested branching: `feat/chat-shared-migration`.
