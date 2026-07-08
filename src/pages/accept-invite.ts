/**
 * Accept Invite Page — Entry Point
 * Landing page for buyer-team invite links from email.
 * Reads ?token= from URL; if missing, shows error.
 */

import '../style.css'

import { AcceptInvitePage } from '../components/auth/AcceptInvitePage'
import { startAlpine } from '../alpine'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.innerHTML = AcceptInvitePage();

// Start Alpine AFTER innerHTML is set so it can find all x-data directives in the DOM
startAlpine();
