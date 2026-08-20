/**
 * Application Pending Page — Entry Point
 * Shows seller application status (Draft, Submitted, Under Review, Rejected).
 */

// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import '../style.css'

import { ApplicationPendingPage } from '../components/seller/ApplicationPendingPage'
import { startAlpine } from '../alpine'
// B-2: seller Alpine modülü page-specific (applicationPendingPage bu sayfada).
import '../alpine/seller'

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.innerHTML = ApplicationPendingPage();

startAlpine();
