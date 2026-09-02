// ==UserScript==
// @name         LineSync Plus - Native React Event Bot
// @namespace    http://tampermonkey.net/
// @version      28.4
// @description  บอทพิมพ์ข้อความ แนบรูปภาพ LINE OA อัตโนมัติ (REL-WP001 Single-Worker Multi-Tab Lock Active)
// @match        https://chat.line.biz/*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    const WORKER_VERSION = '28.4';
    const WORKER_LEADER_KEY = 'linesync_worker_leader_v1';
    const WORKER_ELECTION_LOCK = 'linesync_worker_election_v1';
    const WORKER_LEASE_MS = 20000;
    const WORKER_RENEW_INTERVAL_MS = 4000;
    const NAVIGATION_LEASE_MS = 45000;

    const API_BASE = 'http://localhost:3005/api';
    const CHECK_INTERVAL = 4000;
    const MAX_RETRIES = 2;
    const MAX_SPOOL_SIZE = 50;

    const NAVIGATION_EVENTS = new Set([
        'JOB_RECEIVED',
        'NAVIGATE_TARGET',
        'NAVIGATION_404',
        'SAME_JOB_RECOVERY_START',
        'SAME_JOB_RETRY',
        'SAME_JOB_RETRY_EXHAUSTED'
    ]);

    let consecutiveErrorCount = parseInt(sessionStorage.getItem('linesync_consecutive_errors') || '0', 10);
    let isExecutingJob = false;
    let isFlushingSpool = false;

    console.log(`🤖 LineSync Plus Bot v${WORKER_VERSION}: พร้อมทำงาน (OPS-WP001 Active)...`);

    // 🛡️ Strict LINE Chat OA Context ID Validator (^U + 32 hex chars)
    function isValidChatContextId(value) {
        if (!value || typeof value !== 'string') return false;
        const trimmed = value.trim();
        return /^U[0-9a-fA-F]{32}$/.test(trimmed);
    }

    function getTabSessionId() {
        let id = sessionStorage.getItem('linesync_tab_session_id');
        if (!id) {
            id = 'ts_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('linesync_tab_session_id', id);
        }
        return id;
    }

    const TAB_IDENTITY_LOCK_PREFIX = 'linesync_tab_identity_v1_';
    let currentTabLeaseId = sessionStorage.getItem('linesync_tab_lease_id') || null;
    let isCurrentTabLeader = false;
    let isTabIdentityVerified = false;
    let isLeadershipWarningShown = false;

    // 🛡️ REL-WP001-R2 DOCUMENT-LIFETIME TAB IDENTITY DEFENSE
    async function ensureTabIdentity() {
        if (isTabIdentityVerified) return true;

        if (!navigator.locks || typeof navigator.locks.request !== 'function') {
            console.warn("🛑 [REL] TAB IDENTITY UNVERIFIED: Web Locks API unavailable in browser.");
            isTabIdentityVerified = false;
            return false;
        }

        const currentTabId = getTabSessionId();
        const identityLockName = TAB_IDENTITY_LOCK_PREFIX + currentTabId;

        return new Promise((resolve) => {
            let settled = false;

            navigator.locks.request(identityLockName, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
                if (!lock) {
                    // 🚨 CLONED / DUPLICATED TAB IDENTITY DETECTED!
                    console.warn(`🛑 [REL] DUPLICATE TAB IDENTITY DETECTED: Session ID ${currentTabId} is held by another live tab.`);

                    // 1. Generate NEW tabSessionId
                    const newTabId = 'ts_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
                    try {
                        sessionStorage.setItem('linesync_tab_session_id', newTabId);
                    } catch (e) {}

                    // 2. Remove copied lease & reset local lease state
                    try {
                        sessionStorage.removeItem('linesync_tab_lease_id');
                    } catch (e) {}
                    currentTabLeaseId = null;

                    // 3. Remove copied active-job session fields
                    sessionStorage.removeItem('linesync_jobid');
                    sessionStorage.removeItem('linesync_uid');
                    sessionStorage.removeItem('linesync_msg');
                    sessionStorage.removeItem('linesync_type');
                    sessionStorage.removeItem('linesync_img');
                    sessionStorage.removeItem('linesync_link');

                    console.log(`[REL] NEW TAB IDENTITY ASSIGNED: Reassigned identity to ${newTabId}. Becoming STANDBY.`);

                    if (!settled) {
                        settled = true;
                        // Recursively claim identity lock for the new tabSessionId
                        const ok = await ensureTabIdentity();
                        resolve(ok);
                    }
                    return;
                }

                // Normal or Reassigned Tab Identity Lock Acquired Successfully
                isTabIdentityVerified = true;

                if (!settled) {
                    settled = true;
                    resolve(true);
                }

                // Hold identity lock for the lifetime of this document
                return new Promise(() => {});
            }).catch(() => {
                isTabIdentityVerified = false;
                if (!settled) {
                    settled = true;
                    console.warn("🛑 [REL] TAB IDENTITY UNVERIFIED: Exception during identity lock request.");
                    resolve(false);
                }
            });
        });
    }

    // 🛡️ REL-WP001 / REL-WP001-R1 SINGLE WORKER LOCK SUBSYSTEM
    function readWorkerLeaderRecord() {
        try {
            const raw = localStorage.getItem(WORKER_LEADER_KEY);
            if (!raw) return null;
            const rec = JSON.parse(raw);
            if (!rec || typeof rec !== 'object' || !rec.ownerTabSessionId || !rec.leaseId || typeof rec.expiresAt !== 'number') {
                return null;
            }
            if (Date.now() > rec.expiresAt) {
                return null;
            }
            return rec;
        } catch (e) {
            return null;
        }
    }

    function writeAndVerifyLeaderRecord(record) {
        if (!record || typeof record !== 'object' || !record.ownerTabSessionId || !record.leaseId) {
            isCurrentTabLeader = false;
            return false;
        }

        try {
            const jsonStr = JSON.stringify(record);
            localStorage.setItem(WORKER_LEADER_KEY, jsonStr);

            const rawBack = localStorage.getItem(WORKER_LEADER_KEY);
            if (!rawBack) {
                console.warn("🛑 [REL] WORKER LEASE PERSIST FAILED: Read-back record missing after localStorage.setItem.");
                isCurrentTabLeader = false;
                return false;
            }

            const parsed = JSON.parse(rawBack);
            if (
                parsed &&
                parsed.ownerTabSessionId === record.ownerTabSessionId &&
                parsed.leaseId === record.leaseId &&
                parsed.workerVersion === record.workerVersion &&
                parsed.expiresAt === record.expiresAt
            ) {
                isCurrentTabLeader = true;
                isLeadershipWarningShown = false;
                return true;
            } else {
                console.warn("🛑 [REL] WORKER LEASE PERSIST FAILED: Read-back verification mismatch.");
                isCurrentTabLeader = false;
                return false;
            }
        } catch (e) {
            console.warn("🛑 [REL] WORKER LEASE PERSIST FAILED: localStorage write exception.", e);
            isCurrentTabLeader = false;
            return false;
        }
    }

    function hasValidWorkerLeadership() {
        if (!isTabIdentityVerified) return false;
        if (!currentTabLeaseId) return false;
        const rec = readWorkerLeaderRecord();
        if (!rec) return false;
        return (rec.ownerTabSessionId === getTabSessionId() && rec.leaseId === currentTabLeaseId);
    }

    async function ensureWorkerLeadership(overrideLeaseMs = WORKER_LEASE_MS) {
        if (!isTabIdentityVerified) {
            const idOk = await ensureTabIdentity();
            if (!idOk) return false;
        }

        if (!navigator.locks || typeof navigator.locks.request !== 'function') {
            isCurrentTabLeader = false;
            if (!isLeadershipWarningShown) {
                console.warn("🛑 [REL] WORKER LOCK UNSUPPORTED: Web Locks API unavailable in browser.");
                isLeadershipWarningShown = true;
            }
            return false;
        }

        return new Promise((resolve) => {
            navigator.locks.request(WORKER_ELECTION_LOCK, { mode: 'exclusive' }, async () => {
                const now = Date.now();
                const myTabId = getTabSessionId();
                const existingRec = readWorkerLeaderRecord();

                if (existingRec) {
                    if (existingRec.ownerTabSessionId === myTabId && currentTabLeaseId && existingRec.leaseId === currentTabLeaseId) {
                        existingRec.expiresAt = now + overrideLeaseMs;
                        const verified = writeAndVerifyLeaderRecord(existingRec);
                        resolve(verified);
                        return;
                    } else {
                        isCurrentTabLeader = false;
                        if (!isLeadershipWarningShown) {
                            console.log(`[REL] WORKER STANDBY: Tab ${myTabId} is standby. Active leader tab: ${existingRec.ownerTabSessionId}`);
                            isLeadershipWarningShown = true;
                        }
                        resolve(false);
                        return;
                    }
                } else {
                    const isTakeover = (localStorage.getItem(WORKER_LEADER_KEY) !== null);
                    const newLeaseId = 'lease_' + now + '_' + Math.random().toString(36).substring(2, 9);
                    currentTabLeaseId = newLeaseId;
                    try {
                        sessionStorage.setItem('linesync_tab_lease_id', newLeaseId);
                    } catch (e) {}

                    const newRecord = {
                        ownerTabSessionId: myTabId,
                        leaseId: newLeaseId,
                        workerVersion: WORKER_VERSION,
                        acquiredAt: now,
                        expiresAt: now + overrideLeaseMs
                    };

                    const verified = writeAndVerifyLeaderRecord(newRecord);
                    if (verified) {
                        console.log(`[REL] ${isTakeover ? 'WORKER LEADER TAKEOVER' : 'WORKER LEADER ACQUIRED'}: Tab ${myTabId} elected active worker (Lease: ${newLeaseId})`);
                    }
                    resolve(verified);
                    return;
                }
            }).catch(() => {
                isCurrentTabLeader = false;
                resolve(false);
            });
        });
    }

    async function confirmWorkerLeadershipForSend() {
        if (!isTabIdentityVerified) {
            const idOk = await ensureTabIdentity();
            if (!idOk) return false;
        }

        if (!hasValidWorkerLeadership()) {
            isCurrentTabLeader = false;
            return false;
        }

        if (!navigator.locks || typeof navigator.locks.request !== 'function') {
            isCurrentTabLeader = false;
            return false;
        }

        return new Promise((resolve) => {
            navigator.locks.request(WORKER_ELECTION_LOCK, { mode: 'exclusive' }, async () => {
                const now = Date.now();
                const myTabId = getTabSessionId();
                const existingRec = readWorkerLeaderRecord();

                if (existingRec && existingRec.ownerTabSessionId === myTabId && currentTabLeaseId && existingRec.leaseId === currentTabLeaseId) {
                    existingRec.expiresAt = now + WORKER_LEASE_MS;
                    const verified = writeAndVerifyLeaderRecord(existingRec);
                    resolve(verified);
                    return;
                } else {
                    isCurrentTabLeader = false;
                    resolve(false);
                    return;
                }
            }).catch(() => {
                isCurrentTabLeader = false;
                resolve(false);
            });
        });
    }

    async function navigateAsLeader(targetUrl, reason = 'BOT_NAVIGATION') {
        if (!targetUrl || typeof targetUrl !== 'string') {
            console.warn(`🛑 [REL] Navigation blocked (${reason}): Invalid target URL.`);
            return false;
        }

        if (!hasValidWorkerLeadership()) {
            console.warn(`🛑 [REL] Navigation blocked (${reason}): Tab ${getTabSessionId()} does not hold valid worker leadership.`);
            handleLeadershipLost(`NAVIGATION_BLOCKED_${reason}`);
            return false;
        }

        console.log(`🌐 [REL] Extending navigation lease (${NAVIGATION_LEASE_MS}ms) for ${reason}...`);
        const extended = await ensureWorkerLeadership(NAVIGATION_LEASE_MS);
        if (!extended) {
            console.error(`🛑 [REL] Navigation blocked (${reason}): Failed to extend navigation lease.`);
            handleLeadershipLost(`NAVIGATION_LEASE_EXTEND_FAILED_${reason}`);
            return false;
        }

        console.log(`🌐 [REL] Navigation lease verified. Navigating to: ${targetUrl}`);
        window.location.href = targetUrl;
        return true;
    }

    function handleLeadershipLost(reason = 'UNKNOWN') {
        console.warn(`🛑 [REL] WORKER LEADERSHIP LOST: Tab ${getTabSessionId()} lost worker lock (${reason}). Relinquishing local active job session.`);

        isExecutingJob = false;

        sessionStorage.removeItem('linesync_jobid');
        sessionStorage.removeItem('linesync_uid');
        sessionStorage.removeItem('linesync_msg');
        sessionStorage.removeItem('linesync_type');
        sessionStorage.removeItem('linesync_img');
        sessionStorage.removeItem('linesync_link');
    }

    // 🛡️ Periodic Leadership Renewal Loop
    setInterval(() => {
        if (isCurrentTabLeader) {
            ensureWorkerLeadership().catch(() => {});
        }
    }, WORKER_RENEW_INTERVAL_MS);

    // 🛡️ Helper: Safe Session Clear preserving diagnostic logs & session IDs
    function safeClearSessionStorage() {
        const pendingDiagnostics = sessionStorage.getItem('linesync_pending_diagnostics');
        const tabSessionId = sessionStorage.getItem('linesync_tab_session_id');
        const botId = sessionStorage.getItem('linesync_botid');

        sessionStorage.clear();

        if (pendingDiagnostics) sessionStorage.setItem('linesync_pending_diagnostics', pendingDiagnostics);
        if (tabSessionId) sessionStorage.setItem('linesync_tab_session_id', tabSessionId);
        if (botId && isValidChatContextId(botId)) sessionStorage.setItem('linesync_botid', botId);
    }

    // 🛡️ Bounded Diagnostic Spool in sessionStorage for Navigation Safety
    function getSpool() {
        try {
            const raw = sessionStorage.getItem('linesync_pending_diagnostics');
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) return arr;
            }
        } catch (e) {}
        return [];
    }

    function saveSpool(spool) {
        try {
            while (spool.length > MAX_SPOOL_SIZE) {
                spool.shift();
            }
            sessionStorage.setItem('linesync_pending_diagnostics', JSON.stringify(spool));
        } catch (e) {}
    }

    function enqueueSpool(payload) {
        try {
            const sqId = 'sq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
            const sanitized = {
                _sqId: sqId,
                clientTimestamp: payload.clientTimestamp || new Date().toISOString(),
                event: String(payload.event || 'UNKNOWN').slice(0, 50),
                scriptVersion: WORKER_VERSION,
                tabSessionId: getTabSessionId(),
                jobId: String(payload.jobId || '').slice(0, 100),
                expectedUserId: String(payload.expectedUserId || payload.userId || '').slice(0, 100),
                botId: String(payload.botId || getBotId() || '').slice(0, 100),
                currentPath: String(payload.currentPath || window.location.pathname).split('?')[0].split('#')[0].slice(0, 200),
                retryCount: typeof payload.retryCount === 'number' ? payload.retryCount : (parseInt(payload.retryCount, 10) || 0),
                reason: String(payload.reason || '').slice(0, 200)
            };

            const spool = getSpool();
            spool.push(sanitized);
            saveSpool(spool);
        } catch (e) {}
    }

    // 🛡️ ATOMIC / MERGE-SAFE SPOOL FLUSH (BUG-WP001-UATLOG-R5 Confirmed-Write Spool Removal)
    async function flushPendingDiagnostics() {
        if (isFlushingSpool) return;
        isFlushingSpool = true;

        try {
            const initialSnapshot = getSpool();
            if (initialSnapshot.length === 0) return;

            for (let i = 0; i < initialSnapshot.length; i++) {
                const item = initialSnapshot[i];

                if (!item || typeof item !== 'object' || !item.event || !item._sqId) {
                    const currentSpool = getSpool();
                    const indexToRemove = currentSpool.findIndex(el => !el || el._sqId === item?._sqId);
                    if (indexToRemove !== -1) {
                        currentSpool.splice(indexToRemove, 1);
                        saveSpool(currentSpool);
                    }
                    continue;
                }

                const { _sqId, ...backendPayload } = item;

                try {
                    const result = await fetchAPI('/diagnostics/browser-event', 'POST', backendPayload);

                    if (result && result.success === true) {
                        const currentSpool = getSpool();
                        const indexToRemove = currentSpool.findIndex(el => el._sqId === _sqId);

                        if (indexToRemove !== -1) {
                            currentSpool.splice(indexToRemove, 1);
                            saveSpool(currentSpool);
                        }
                    } else {
                        break;
                    }
                } catch (err) {
                    break;
                }
            }
        } catch (e) {
            // Safety invariant: logging failure must never affect bot execution
        } finally {
            isFlushingSpool = false;
        }
    }

    // 🛡️ Observability Emitter (Navigation-Safe, Fire-and-Forget, Non-Blocking, Never Throws)
    function emitDiagnostic(eventName, context = {}) {
        try {
            const jobId = context.jobId || sessionStorage.getItem('linesync_jobid') || '';
            const payload = {
                clientTimestamp: context.clientTimestamp || new Date().toISOString(),
                event: eventName,
                scriptVersion: WORKER_VERSION,
                tabSessionId: getTabSessionId(),
                jobId: jobId,
                expectedUserId: context.expectedUserId || context.userId || sessionStorage.getItem('linesync_uid') || '',
                botId: context.botId || getBotId() || '',
                currentPath: window.location.pathname,
                retryCount: typeof context.retryCount === 'number' ? context.retryCount : (parseInt(sessionStorage.getItem(`linesync_retry_${jobId}`) || '0', 10) || 0),
                reason: context.reason || ''
            };

            if (NAVIGATION_EVENTS.has(eventName)) {
                enqueueSpool(payload);
            } else {
                fetchAPI('/diagnostics/browser-event', 'POST', payload).catch(() => {
                    enqueueSpool(payload);
                });
            }
        } catch (e) {
            // Safety invariant: logging failure must never affect bot execution
        }
    }

    function fetchAPI(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                method: method,
                url: `${API_BASE}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    'X-LineSync-Worker-Version': WORKER_VERSION
                },
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        try { resolve(JSON.parse(response.responseText)); }
                        catch (e) { resolve(response.responseText); }
                    } else {
                        reject(`Error: ${response.status}`);
                    }
                },
                onerror: function(err) { reject(err); }
            };
            if (data) options.data = JSON.stringify(data);
            GM_xmlhttpRequest(options);
        });
    }

    let isRuntimeCompatible = false;
    let lastCompatibilityCheckTime = 0;
    let isCompatibilityWarningShown = false;

    // 🛡️ WORKER RUNTIME HANDSHAKE (OPS-WP001 / OPS-WP001-R1 Fail-Closed Version Gate)
    async function checkRuntimeCompatibility() {
        const now = Date.now();
        if (isRuntimeCompatible && (now - lastCompatibilityCheckTime < 10000)) {
            return true;
        }

        try {
            const res = await fetchAPI('/runtime/version');
            if (res && typeof res === 'object' && typeof res.requiredWorkerVersion === 'string' && res.requiredWorkerVersion === WORKER_VERSION) {
                isRuntimeCompatible = true;
                lastCompatibilityCheckTime = now;
                isCompatibilityWarningShown = false;
                return true;
            } else {
                isRuntimeCompatible = false;
                const requiredVer = (res && typeof res === 'object' && res.requiredWorkerVersion) ? String(res.requiredWorkerVersion) : 'UNKNOWN';
                if (!isCompatibilityWarningShown) {
                    console.warn(`🛑 [OPS] RUNTIME VERSION BLOCKED: Worker ${WORKER_VERSION} is incompatible with required backend version ${requiredVer}`);
                    isCompatibilityWarningShown = true;
                }
                return false;
            }
        } catch (e) {
            isRuntimeCompatible = false;
            if (!isCompatibilityWarningShown) {
                console.warn(`🛑 [OPS] RUNTIME VERSION BLOCKED: Unable to reach or validate /runtime/version endpoint`);
                isCompatibilityWarningShown = true;
            }
            return false;
        }
    }

    function deepQuerySelector(selector, root = document) {
        let found = root.querySelector(selector);
        if (found) return found;

        const allElements = root.querySelectorAll('*');
        for (let el of allElements) {
            if (el.shadowRoot) {
                let target = deepQuerySelector(selector, el.shadowRoot);
                if (target) return target;
            }
        }
        return null;
    }

    function deepQuerySelectorAll(selector, root = document) {
        let results = Array.from(root.querySelectorAll(selector));
        const allElements = root.querySelectorAll('*');
        for (let el of allElements) {
            if (el.shadowRoot) {
                results = results.concat(deepQuerySelectorAll(selector, el.shadowRoot));
            }
        }
        return results;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 🛡️ Safe getBotId(): Strictly validates and returns ONLY valid LINE Chat OA context IDs
    function getBotId() {
        let stored = sessionStorage.getItem('linesync_botid') || '';
        if (stored && !isValidChatContextId(stored)) {
            console.warn(`🛡️ [SAFETY] Removing invalid linesync_botid from sessionStorage: ${stored}`);
            sessionStorage.removeItem('linesync_botid');
            stored = '';
        }

        if (window.location.hostname === 'chat.line.biz') {
            const match = window.location.pathname.match(/^\/([a-zA-Z0-9_-]+)(?:\/|$)/);
            if (match && match[1]) {
                const currentSegment = match[1];
                if (isValidChatContextId(currentSegment) && !checkIfErrorPage()) {
                    if (stored !== currentSegment) {
                        sessionStorage.setItem('linesync_botid', currentSegment);
                    }
                    return currentSegment;
                }
            }
        }

        return isValidChatContextId(stored) ? stored : '';
    }

    // 🛡️ Safe getOAContextUrl(): Fails closed (returns null) if no valid OA context exists
    function getOAContextUrl(userId) {
        const botId = getBotId();
        if (!isValidChatContextId(botId)) {
            console.warn(`🛡️ [SAFETY] getOAContextUrl failed closed: Invalid or missing OA context ID (${botId})`);
            return null;
        }
        return userId ? `https://chat.line.biz/${botId}/chat/${userId}` : `https://chat.line.biz/${botId}/`;
    }

    // 🛡️ 1. Explicit 404 & LINE Error Page Detector
    function checkIfErrorPage() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/error') || path.includes('/404') || path.includes('/not-found')) {
            return true;
        }

        const errorBanners = deepQuerySelectorAll('h1, h2, h3, p, div, alert, ui-alert, section').find(el => {
            try {
                const txt = String(el.textContent || el.innerText || '').trim();
                if (txt.length > 200) return false;
                return txt.includes('404') ||
                       txt.includes('Page Not Found') ||
                       txt.includes('Page not found') ||
                       txt.includes('ไม่พบหน้า') ||
                       txt.includes('เกิดข้อผิดพลาดในการโหลด') ||
                       txt.includes('An error occurred') ||
                       txt.includes('This page is not available') ||
                       txt.includes('ไม่สามารถโหลดข้อมูลได้');
            } catch (e) { return false; }
        });

        return !!errorBanners;
    }

    // 🛡️ 2. Exact Recipient Verification Guard (Checks both OA Context ID & Recipient User ID)
    function verifyCurrentRecipient(expectedUserId) {
        if (!expectedUserId) return false;

        if (checkIfErrorPage()) return false;

        const currentBotId = getBotId();
        if (!isValidChatContextId(currentBotId)) {
            console.warn(`🛡️ [SAFETY] Recipient verification failed: Invalid or missing OA context ID (${currentBotId})`);
            emitDiagnostic('RECIPIENT_VERIFY_FAIL', { expectedUserId: expectedUserId, reason: 'Invalid OA context ID' });
            return false;
        }

        const pathname = window.location.pathname;
        const expectedPattern = new RegExp(`/${currentBotId}/chat/${expectedUserId}(?:/|$)`, 'i');
        const urlMatchesRecipient = expectedPattern.test(pathname);

        if (!urlMatchesRecipient) {
            console.warn(`🛡️ [SAFETY] URL path does not match expected recipient: Expected /${currentBotId}/chat/${expectedUserId}, got URL: ${pathname}`);
            emitDiagnostic('RECIPIENT_VERIFY_FAIL', { expectedUserId: expectedUserId, reason: 'URL path mismatch' });
            return false;
        }

        const activeChatElements = deepQuerySelectorAll('[data-user-id], [data-chat-id], [class*="active"], [class*="Selected"]');
        for (let el of activeChatElements) {
            const dataUid = el.getAttribute('data-user-id') || el.getAttribute('data-chat-id') || '';
            if (dataUid && dataUid.toLowerCase() !== expectedUserId.toLowerCase()) {
                console.warn(`🛡️ [SAFETY] DOM element data-user-id mismatch: Expected ${expectedUserId}, found ${dataUid}`);
                emitDiagnostic('RECIPIENT_VERIFY_FAIL', { expectedUserId: expectedUserId, reason: `DOM mismatch found ${dataUid}` });
                return false;
            }
        }

        return true;
    }

    // 🛑 ตรวจจับข้อความเตือนโควต้า LINE OA เต็มบนหน้าจอ
    function checkQuotaLimitExceeded() {
        const allEls = deepQuerySelectorAll('p, div, span, alert, ui-alert, section, h1, h2, h3');
        const limitBanner = allEls.find(el => {
            try {
                const txt = String(el.textContent || el.innerText || '').trim();
                if (txt.length > 250) return false;
                return txt.includes('ส่งข้อความเกินโควต้า') || 
                       txt.includes('โควต้าเต็ม') || 
                       txt.includes('บรอดแคสต์เต็มโควต้าแล้ว') || 
                       txt.includes('Quota limit exceeded') || 
                       txt.includes('Reached monthly limit') ||
                       txt.includes('โควต้าคงเหลือไม่เพียงพอ') ||
                       txt.includes('ไม่สามารถส่งบรอดแคสต์เพิ่มได้') ||
                       txt.includes('โควต้าข้อความของเดือนนี้หมดแล้ว');
            } catch(e) { return false; }
        });
        return !!limitBanner;
    }

    // สแกนตรวจสอบว่าผู้ใช้บล็อก/แชทถูกปิดไม่สามารถส่งข้อความได้หรือไม่
    function checkIfChatDisabledOrBlocked(chatInput) {
        let isBlocked = false;
        if (chatInput) {
            if (chatInput.disabled || chatInput.readOnly) isBlocked = true;
            const ph = String(chatInput.placeholder || '').toLowerCase();
            if (ph.includes('ไม่สามารถส่งข้อความ') || ph.includes('cannot send') || ph.includes('blocked') || ph.includes('บล็อก')) {
                isBlocked = true;
            }
        }

        if (!isBlocked) {
            const allEls = deepQuerySelectorAll('p, div, span, alert, ui-alert, section');
            const blockedBanner = allEls.find(el => {
                try {
                    const txt = String(el.textContent || el.innerText || '').trim();
                    if (txt.length > 200) return false;
                    return txt.includes('ไม่สามารถส่งข้อความได้') || 
                           txt.includes('ไม่สามารถส่งข้อความในห้องแชทนี้ได้') || 
                           txt.includes('ผู้ใช้บล็อกอยู่') || 
                           txt.includes('Cannot send message') || 
                           txt.includes('User blocked') ||
                           txt.includes('บัญชีนี้ถูกระงับ') ||
                           txt.includes('ไม่สามารถตอบกลับ');
                } catch(e) { return false; }
            });
            isBlocked = !!blockedBanner;
        }

        if (isBlocked) {
            emitDiagnostic('SEND_BLOCKED', { reason: 'User blocked or chat disabled' });
        }

        return isBlocked;
    }

    // 🛡️ ZERO-TOLERANCE IMAGE SEND GUARD: Confirm & Send image with strict expectedUserId check
    async function confirmAndCloseImageModal(expectedUserId) {
        console.log("⏳ [DEBUG] 1. รอป๊อปอัปยืนยันรูปภาพปรากฏขึ้นมาบนหน้าจอ...");

        let confirmBtn = null;
        for (let i = 0; i < 15; i++) {
            if (expectedUserId && !verifyCurrentRecipient(expectedUserId)) {
                console.error("🛑 [SAFETY] Zero-tolerance image send guard: Recipient unverified during image modal wait!");
                throw new Error('RECIPIENT_UNVERIFIED');
            }

            const dialogs = deepQuerySelectorAll('ui-dialog, [role="dialog"], [class*="modal"], [class*="Dialog"]');
            if (dialogs.length > 0) {
                for (let dialog of dialogs) {
                    const btns = deepQuerySelectorAll('button, ui-button, [role="button"], span', dialog);
                    confirmBtn = btns.find(b => {
                        const txt = String(b.textContent || b.innerText || '').trim();
                        return txt === 'ส่ง' || txt === 'Send';
                    }) || (btns.length > 0 ? btns[btns.length - 1] : null);

                    if (confirmBtn) break;
                }
            }
            if (confirmBtn) break;
            await sleep(200);
        }

        if (!confirmBtn) {
            console.log("⚠️ ไม่พบป๊อปอัปยืนยันรูปภาพ ดำเนินการขั้นตอนถัดไป...");
            return;
        }

        if (expectedUserId && !verifyCurrentRecipient(expectedUserId)) {
            console.error("🛑 [SAFETY] Zero-tolerance image send guard: Recipient unverified immediately before clicking image Send button!");
            throw new Error('RECIPIENT_UNVERIFIED');
        }

        const isImageLeaderConfirmed = await confirmWorkerLeadershipForSend();
        if (!isImageLeaderConfirmed) {
            console.error("🛑 [REL] Leadership check failed immediately before clicking image Send button!");
            throw new Error('WORKER_LEADERSHIP_LOST');
        }

        emitDiagnostic('IMAGE_PRE_SEND_VERIFIED', { expectedUserId: expectedUserId });

        console.log("🚀 [DEBUG] 2. พบป๊อปอัปแล้ว! สั่งกดปุ่ม [ส่ง] รูปภาพเพียง 1 ครั้งเท่านั้น (Single Fire)...");

        let target = confirmBtn;
        if (target.shadowRoot && target.shadowRoot.querySelector('button')) {
            target = target.shadowRoot.querySelector('button');
        }

        const opts = { bubbles: true, cancelable: true, composed: true, view: window };
        try { target.focus(); } catch(e){}
        try { target.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch(e){}
        try { target.dispatchEvent(new MouseEvent('mousedown', opts)); } catch(e){}
        try { target.dispatchEvent(new PointerEvent('pointerup', opts)); } catch(e){}
        try { target.dispatchEvent(new MouseEvent('mouseup', opts)); } catch(e){}
        try { target.click(); } catch(e){}
        try { target.dispatchEvent(new MouseEvent('click', opts)); } catch(e){}

        console.log("✅ 3. สั่งกดส่งรูปภาพ 1 ครั้งสำเร็จ! รอ 4.5 วินาที ให้รูปภาพส่งลงห้องแชทเสร็จสมบูรณ์...");
        await sleep(4500);
        console.log("✅ 4. รูปภาพส่งลงห้องแชตเป็นอันดับแรกเรียบร้อยแล้ว!");
    }

    // 🛡️ ZERO-TOLERANCE TEXT SEND GUARD: Send chat text message with strict expectedUserId check
    async function sendChatMessage(chatInput, expectedUserId) {
        console.log("🚀 [DEBUG] สั่งส่งข้อความในช่องแชท...");

        const isTextLeaderConfirmed = await confirmWorkerLeadershipForSend();
        if (!isTextLeaderConfirmed) {
            console.error("🛑 [REL] Leadership check failed immediately before text send!");
            throw new Error('WORKER_LEADERSHIP_LOST');
        }

        if (expectedUserId && !verifyCurrentRecipient(expectedUserId)) {
            console.error("🛑 [SAFETY] Zero-tolerance text send guard: Recipient unverified immediately before text send!");
            throw new Error('RECIPIENT_UNVERIFIED');
        }

        const allButtons = deepQuerySelectorAll('button, input[type="submit"], [role="button"], div, span');
        const chatSendBtns = allButtons.filter(el => {
            const txt = String(el.textContent || el.value || el.innerText || '').trim();
            if (txt !== 'ส่ง' && txt !== 'Send') return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.width < 150 && rect.top > 400;
        });

        if (chatSendBtns.length > 0) {
            let sendBtn = chatSendBtns.find(b => b.tagName.toLowerCase() === 'button') || chatSendBtns[0];
            if (sendBtn.shadowRoot && sendBtn.shadowRoot.querySelector('button')) {
                sendBtn = sendBtn.shadowRoot.querySelector('button');
            }

            if (expectedUserId && !verifyCurrentRecipient(expectedUserId)) {
                console.error("🛑 [SAFETY] Zero-tolerance text send guard: Recipient unverified right before sendBtn click!");
                throw new Error('RECIPIENT_UNVERIFIED');
            }

            emitDiagnostic('TEXT_PRE_SEND_VERIFIED', { expectedUserId: expectedUserId });

            console.log("✅ เจอและสั่งคลิกปุ่มส่งสีเขียวที่มุมล่างขวาช่องพิมพ์สำเร็จ!");
            const opts = { bubbles: true, cancelable: true, composed: true, view: window };
            try { sendBtn.focus(); } catch(e){}
            try { sendBtn.dispatchEvent(new PointerEvent('pointerdown', opts)); } catch(e){}
            try { sendBtn.dispatchEvent(new MouseEvent('mousedown', opts)); } catch(e){}
            try { sendBtn.dispatchEvent(new PointerEvent('pointerup', opts)); } catch(e){}
            try { sendBtn.dispatchEvent(new MouseEvent('mouseup', opts)); } catch(e){}
            try { sendBtn.click(); } catch(e){}
            try { sendBtn.dispatchEvent(new MouseEvent('click', opts)); } catch(e){}
        } else {
            if (expectedUserId && !verifyCurrentRecipient(expectedUserId)) {
                console.error("🛑 [SAFETY] Zero-tolerance text send guard: Recipient unverified right before Enter key fallback!");
                throw new Error('RECIPIENT_UNVERIFIED');
            }

            emitDiagnostic('TEXT_PRE_SEND_VERIFIED', { expectedUserId: expectedUserId });

            const enterOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true, shiftKey: false };
            try { chatInput.dispatchEvent(new KeyboardEvent('keydown', enterOpts)); } catch(e){}
            try { chatInput.dispatchEvent(new KeyboardEvent('keypress', enterOpts)); } catch(e){}
            try { chatInput.dispatchEvent(new KeyboardEvent('keyup', enterOpts)); } catch(e){}
        }
    }

    function fetchImageBlob(url) {
        return new Promise((resolve) => {
            if (!url) return resolve(null);

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                responseType: 'blob',
                onload: function(res) {
                    if (res.status === 200 && res.response) {
                        const blob = res.response;
                        if (blob.type && blob.type.includes('html')) {
                            const reader = new FileReader();
                            reader.onload = function() {
                                const htmlText = reader.result;
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(htmlText, 'text/html');
                                const imgTag = doc.querySelector('meta[property="og:image"]') || 
                                               doc.querySelector('meta[name="twitter:image"]') || 
                                               doc.querySelector('img[src*="image"]');
                                if (imgTag) {
                                    let directSrc = imgTag.getAttribute('content') || imgTag.getAttribute('src');
                                    if (directSrc) {
                                        if (directSrc.startsWith('//')) directSrc = 'https:' + directSrc;
                                        else if (directSrc.startsWith('/')) {
                                            const u = new URL(url);
                                            directSrc = u.origin + directSrc;
                                        }
                                        console.log("🔍 สกัดเจอ Direct Image URL จากหน้าเว็บ:", directSrc);
                                        return fetchImageBlob(directSrc).then(resolve);
                                    }
                                }
                                resolve(null);
                            };
                            reader.readAsText(blob);
                        } else {
                            resolve({ blob: blob, contentType: blob.type });
                        }
                    } else {
                        resolve(null);
                    }
                },
                onerror: function() { resolve(null); }
            });
        });
    }

    // 🛡️ SAME-JOB SAFE RECOVERY: Retries the EXACT SAME jobData up to MAX_RETRIES using ONLY validated OA context (BUG-WP002-R1)
    async function handleSafeRecovery(jobData, reason = 'RECIPIENT_UNVERIFIED', isBlocked = false) {
        console.warn(`🛡️ [SAME-JOB RECOVERY] Triggered recovery for Job ID: ${jobData.jobId}, User ID: ${jobData.userId}, Reason: ${reason}`);

        emitDiagnostic('SAME_JOB_RECOVERY_START', { jobId: jobData.jobId, userId: jobData.userId, reason: reason });

        // 1. Check if valid target OA context URL exists BEFORE incrementing retryCount or consuming retries
        const targetUrl = getOAContextUrl(jobData.userId);

        if (!targetUrl) {
            console.warn(`🛑 [SAFETY] Same-job recovery waiting for valid OA context: Target URL unavailable for Job ID: ${jobData.jobId}. Preserving active job state and failing closed.`);
            emitDiagnostic('SAME_JOB_RECOVERY_START', { jobId: jobData.jobId, userId: jobData.userId, reason: 'Missing valid OA context' });

            // Preserve SAME job session parameters intact
            sessionStorage.setItem('linesync_jobid', jobData.jobId || '');
            sessionStorage.setItem('linesync_uid', jobData.userId || '');
            sessionStorage.setItem('linesync_msg', jobData.message || '');
            sessionStorage.setItem('linesync_type', jobData.messageType || 'text');
            sessionStorage.setItem('linesync_img', jobData.imageUrl || '');
            sessionStorage.setItem('linesync_link', jobData.linkUrl || '');

            // DO NOT call finishJob, DO NOT call /campaign/fail, DO NOT increment retryCount, DO NOT fetch another job, DO NOT navigate
            isExecutingJob = false;
            return;
        }

        const retryKey = `linesync_retry_${jobData.jobId}`;
        let retryCount = parseInt(sessionStorage.getItem(retryKey) || '0', 10);

        if (retryCount < MAX_RETRIES && !isBlocked && !reason.includes('บล็อก')) {
            retryCount++;
            sessionStorage.setItem(retryKey, String(retryCount));
            console.log(`🔄 [SAME-JOB RECOVERY] Attempting bounded retry ${retryCount}/${MAX_RETRIES} for SAME Job ID: ${jobData.jobId}, User ID: ${jobData.userId}...`);

            emitDiagnostic('SAME_JOB_RETRY', { jobId: jobData.jobId, userId: jobData.userId, retryCount: retryCount, reason: reason });

            sessionStorage.setItem('linesync_jobid', jobData.jobId || '');
            sessionStorage.setItem('linesync_uid', jobData.userId || '');
            sessionStorage.setItem('linesync_msg', jobData.message || '');
            sessionStorage.setItem('linesync_type', jobData.messageType || 'text');
            sessionStorage.setItem('linesync_img', jobData.imageUrl || '');
            sessionStorage.setItem('linesync_link', jobData.linkUrl || '');

            isExecutingJob = false;

            if (window.location.href !== targetUrl) {
                console.log(`🌐 [SAME-JOB RECOVERY] Navigating to SAME user chat URL: ${targetUrl}`);
                await navigateAsLeader(targetUrl, 'SAME_JOB_RECOVERY_RECIPIENT');
            } else {
                console.log("🌐 [SAME-JOB RECOVERY] Already on target URL. Retrying execution directly...");
                setTimeout(() => executeChatBot(jobData), 2000);
            }
        } else {
            console.error(`❌ [SAME-JOB RECOVERY] Bounded retries exceeded (${retryCount}/${MAX_RETRIES}) or non-retryable error. Failing SAME job ${jobData.jobId} with reason: ${reason}`);

            emitDiagnostic('SAME_JOB_RETRY_EXHAUSTED', { jobId: jobData.jobId, userId: jobData.userId, retryCount: retryCount, reason: reason });

            sessionStorage.removeItem(retryKey);
            await finishJob(jobData.jobId, jobData.userId, false, reason, isBlocked);
        }
    }

    // 🛡️ PROCESS QUEUE GATE: Validates hostname and trusted OA context BEFORE fetching /campaign/next
    async function processQueue() {
        if (isExecutingJob) {
            console.log("⚠️ ProcessQueue skipped: Job execution currently active.");
            return;
        }

        if (window.location.hostname !== 'chat.line.biz') {
            console.warn("⚠️ [SAFETY] ProcessQueue skipped: Not running on chat.line.biz.");
            return;
        }

        if (checkIfErrorPage() || window.location.href.includes('/tagaudience') || window.location.href.includes('/error')) {
            console.log("🔀 404 / Error page detected during queue check...");
            emitDiagnostic('NAVIGATION_404', { reason: '404/error page detected during processQueue' });

            const mainUrl = getOAContextUrl(null);
            if (mainUrl && window.location.href !== mainUrl) {
                console.log(`🌐 [RECOVERY] Navigating to known valid OA chat main URL: ${mainUrl}`);
                await navigateAsLeader(mainUrl, 'PROCESS_QUEUE_404_MAIN');
                return;
            } else {
                console.warn("🛑 [SAFETY] Cannot recover from 404 automatically: No valid trusted OA context ID. Failing closed.");
                return;
            }
        }

        const validBotId = getBotId();
        if (!isValidChatContextId(validBotId)) {
            console.warn("🛑 [SAFETY] ProcessQueue blocked: Missing or invalid LINE Chat OA context. Waiting for user to open valid OA chat page.");
            return;
        }

        if (checkQuotaLimitExceeded()) {
            console.error("🛑 [CRITICAL] ตรวจพบการเตือนโควต้า LINE OA เต็ม! หยุดคิวงาน...");
            safeClearSessionStorage();
            return;
        }

        const isLeader = await ensureWorkerLeadership();
        if (!isLeader) {
            setTimeout(processQueue, WORKER_RENEW_INTERVAL_MS);
            return;
        }

        const isCompatible = await checkRuntimeCompatibility();
        if (!isCompatible) {
            setTimeout(processQueue, CHECK_INTERVAL);
            return;
        }

        try {
            const job = await fetchAPI('/campaign/next');
            if (job && job.status === 'processing') {
                if (!hasValidWorkerLeadership()) {
                    console.warn("🛑 [REL] Leadership lost immediately after /campaign/next claim. Aborting execution.");
                    handleLeadershipLost('LOST_AFTER_CLAIM');
                    return;
                }

                console.log("📥 ได้คิวส่งหา User ID:", job.userId, "ประเภท:", job.messageType);

                emitDiagnostic('JOB_RECEIVED', { jobId: job.jobId, userId: job.userId });

                sessionStorage.setItem('linesync_jobid', job.jobId || '');
                sessionStorage.setItem('linesync_msg', job.message || '');
                sessionStorage.setItem('linesync_uid', job.userId);
                sessionStorage.setItem('linesync_type', job.messageType || 'text');
                sessionStorage.setItem('linesync_img', job.imageUrl || '');
                sessionStorage.setItem('linesync_link', job.linkUrl || '');

                const targetUrl = getOAContextUrl(job.userId);
                if (!targetUrl) {
                    console.warn("🛑 [SAFETY] Cannot construct recipient URL: Invalid OA context. Handing off to safe recovery...");
                    await handleSafeRecovery(job, 'INVALID_OA_CONTEXT');
                    return;
                }

                if (window.location.href !== targetUrl) {
                    console.log("🔀 สลับไปยังหน้าแชต LINE OA ของผู้รับ:", targetUrl);

                    emitDiagnostic('NAVIGATE_TARGET', { jobId: job.jobId, userId: job.userId });

                    await navigateAsLeader(targetUrl, 'PROCESS_QUEUE_RECIPIENT');
                    return;
                }

                await executeChatBot(job);

            } else {
                if (window.location.pathname.includes('/chat/U') || window.location.pathname.includes('/chat/u')) {
                    closeUserChatAndReturnToMain();
                }
                setTimeout(processQueue, CHECK_INTERVAL);
            }
        } catch (err) {
            console.log("❌ รอเชื่อมต่อเซิร์ฟเวอร์ NestJS...");
            setTimeout(processQueue, CHECK_INTERVAL);
        }
    }

    async function closeUserChatAndReturnToMain() {
        console.log("🔙 ปิดหน้าต่างผู้ใช้และกลับสู่หน้าแชทหลักของ OA...");

        const closeBtns = deepQuerySelectorAll('button, a, [role="button"]').filter(el => {
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const text = String(el.textContent || el.innerText || '').trim().toLowerCase();
            const cls = String(el.className || '').toLowerCase();
            return aria.includes('close') || aria.includes('ปิด') || text === '✕' || text === 'x' || text === 'ปิด' || cls.includes('close-btn') || cls.includes('btn-close');
        });

        if (closeBtns.length > 0) {
            try { closeBtns[0].click(); } catch(e){}
        }

        if (window.location.pathname.includes('/chat/U') || window.location.pathname.includes('/chat/u')) {
            const targetMainUrl = getOAContextUrl(null);
            if (targetMainUrl && window.location.href !== targetMainUrl) {
                console.log(`🌐 เปลี่ยนเส้นทางกลับหน้าแชทหลัก: ${targetMainUrl}`);
                await navigateAsLeader(targetMainUrl, 'RETURN_TO_MAIN');
            }
        }
    }

    async function executeChatBot(jobData) {
        if (!hasValidWorkerLeadership()) {
            handleLeadershipLost('PRE_EXECUTE_CHECK');
            return;
        }

        if (isExecutingJob) {
            console.warn("⚠️ Job execution already in progress. Skipping re-entrant call for Job ID:", jobData.jobId);
            return;
        }
        isExecutingJob = true;

        console.log("🔍 กำลังตรวจสอบความถูกต้องก่อนเริ่มส่งข้อความหา User ID:", jobData.userId);

        if (checkIfErrorPage()) {
            console.error("🛑 [SAFETY] ตรวจพบหน้า 404 / Error Page! ยกเลิกการส่งทันที");
            await handleSafeRecovery(jobData, 'NAVIGATION_404');
            return;
        }

        if (!verifyCurrentRecipient(jobData.userId)) {
            console.error("🛑 [SAFETY] ยืนยันผู้รับไม่ผ่าน (Recipient Mismatch / Unverified)! ยกเลิกการส่งทันที");
            await handleSafeRecovery(jobData, 'RECIPIENT_MISMATCH');
            return;
        }

        emitDiagnostic('RECIPIENT_VERIFY_OK', { jobId: jobData.jobId, expectedUserId: jobData.userId });

        if (checkQuotaLimitExceeded()) {
            console.error("🛑 [CRITICAL] ตรวจพบการเตือนโควต้า LINE OA เต็ม! สั่งหยุดส่งแคมเปญทันที...");
            await fetchAPI('/campaign/stop', 'POST', {
                jobId: jobData.jobId,
                reason: '🛑 สั่งหยุดแคมเปญทันทีเนื่องจากโควต้าข้อความ LINE OA เต็ม (Quota Exceeded Limit)',
                limitReached: true
            });
            safeClearSessionStorage();
            isExecutingJob = false;
            alert('🛑 ระบบหยุดส่งแคมเปญอัตโนมัติ เนื่องจากโควต้าข้อความ LINE OA ของคุณเต็มแล้ว');
            return;
        }

        let attempts = 0;
        const maxAttempts = 35;

        const findAndType = setInterval(async () => {
            attempts++;

            if (!hasValidWorkerLeadership()) {
                clearInterval(findAndType);
                handleLeadershipLost('INPUT_SEARCH_CHECK');
                return;
            }

            if (checkIfErrorPage()) {
                clearInterval(findAndType);
                console.error("🛑 [SAFETY] ตรวจพบหน้า 404/Error Page ระหว่างค้นหาช่องพิมพ์! ยกเลิกส่งทันที");
                await handleSafeRecovery(jobData, 'NAVIGATION_404');
                return;
            }

            if (!verifyCurrentRecipient(jobData.userId)) {
                clearInterval(findAndType);
                console.error("🛑 [SAFETY] ตรวจพบผู้รับไม่ตรงตามเป้าหมาย (Recipient Mismatch) ระหว่างค้นหาช่องพิมพ์! ยกเลิกส่งทันที");
                await handleSafeRecovery(jobData, 'RECIPIENT_MISMATCH');
                return;
            }

            const chatInput = deepQuerySelector('textarea[part="input"]') || deepQuerySelector('textarea');

            if (chatInput) {
                clearInterval(findAndType);

                if (!hasValidWorkerLeadership()) {
                    handleLeadershipLost('PRE_TEXT_INSERT_CHECK');
                    return;
                }

                if (!verifyCurrentRecipient(jobData.userId)) {
                    console.error("🛑 [SAFETY] ยืนยันผู้รับไม่ผ่านก่อนเริ่มพิมพ์! ยกเลิกการส่งทันที");
                    await handleSafeRecovery(jobData, 'RECIPIENT_UNVERIFIED');
                    return;
                }

                chatInput.style.border = "3px solid #00c300";

                if (checkIfChatDisabledOrBlocked(chatInput)) {
                    console.warn(`🚫 ตรวจพบผู้ใช้นี้บล็อก/ไม่สามารถส่งข้อความได้แล้ว (LINE UserId: ${jobData.userId})`);
                    await finishJob(jobData.jobId, jobData.userId, false, '🚫 บล็อก / ไม่สามารถส่งข้อความได้แล้ว', true);
                    return;
                }

                try {
                    let hasImageToSend = (jobData.messageType === 'image_link' || jobData.messageType === 'image_only') && jobData.imageUrl;

                    if (hasImageToSend) {
                        if (!hasValidWorkerLeadership()) {
                            throw new Error('WORKER_LEADERSHIP_LOST');
                        }

                        if (!verifyCurrentRecipient(jobData.userId)) {
                            throw new Error('RECIPIENT_UNVERIFIED');
                        }

                        console.log("📸 1. กำลังแนบรูปภาพส่งขึ้นเป็นอันดับแรก...");
                        const imageData = await fetchImageBlob(jobData.imageUrl);
                        if (imageData && imageData.blob) {
                            const file = new File([imageData.blob], 'broadcast_image.png', { type: imageData.contentType || 'image/png' });
                            
                            const fileInput = deepQuerySelector('input[type="file"][accept*="image"]') || deepQuerySelector('input[type="file"]');
                            if (fileInput) {
                                const dt = new DataTransfer();
                                dt.items.add(file);
                                fileInput.files = dt.files;
                                fileInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                                console.log("✅ แนบไฟล์รูปภาพผ่าน File Input สำเร็จ!");
                            } else {
                                const dt = new DataTransfer();
                                dt.items.add(file);
                                const pasteEvent = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
                                chatInput.dispatchEvent(pasteEvent);
                                console.log("✅ จำลอง Paste รูปภาพใส่ช่องพิมพ์สำเร็จ!");
                            }

                            await confirmAndCloseImageModal(jobData.userId);
                        }
                    }

                    let textToSend = '';
                    if (jobData.messageType === 'image_only') {
                        textToSend = '';
                    } else if (jobData.messageType === 'link_only') {
                        if (jobData.linkUrl) {
                            textToSend = (jobData.message && jobData.message !== '🖼️ [ส่งรูปภาพเดี่ยว]') 
                                ? `${jobData.message}\n\n🔗 ${jobData.linkUrl}` 
                                : jobData.linkUrl;
                        } else {
                            textToSend = jobData.message || '';
                        }
                    } else {
                        textToSend = (jobData.message && jobData.message !== '🖼️ [ส่งรูปภาพเดี่ยว]') ? jobData.message : '';
                        if (jobData.linkUrl) {
                            textToSend += textToSend ? `\n\n🔗 ดูรายละเอียดเพิ่มเติม: ${jobData.linkUrl}` : `🔗 ดูรายละเอียดเพิ่มเติม: ${jobData.linkUrl}`;
                        }
                    }

                    if (textToSend && textToSend.trim() !== '') {
                        if (!hasValidWorkerLeadership()) {
                            throw new Error('WORKER_LEADERSHIP_LOST');
                        }

                        if (!verifyCurrentRecipient(jobData.userId)) {
                            throw new Error('RECIPIENT_UNVERIFIED');
                        }

                        console.log("✍️ 5. พิมพ์ข้อความ/ลิงก์ลงในช่องแชต...");
                        chatInput.focus();
                        chatInput.click();

                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                        if (nativeInputValueSetter) {
                            nativeInputValueSetter.call(chatInput, textToSend);
                        } else {
                            chatInput.value = textToSend;
                        }

                        chatInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        chatInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                        chatInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: textToSend }));

                        await sleep(1200);

                        await sendChatMessage(chatInput, jobData.userId);

                        await sleep(3000);
                        console.log("✅ ส่งแคมเปญสำเร็จ 100%!");
                        await finishJob(jobData.jobId, jobData.userId, true);
                    } else {
                        await sleep(2000);
                        console.log("✅ ส่งแคมเปญรูปภาพอย่างเดียวสำเร็จ 100%!");
                        await finishJob(jobData.jobId, jobData.userId, true);
                    }

                } catch (e) {
                    console.error("❌ เกิด Error ตอนส่ง:", e);
                    const errReason = e.message || String(e) || 'Error ในกระบวนการพิมพ์';
                    if (errReason.includes('WORKER_LEADERSHIP_LOST')) {
                        handleLeadershipLost('EXECUTE_CHATBOT_THROWN');
                    } else if (errReason.includes('RECIPIENT_UNVERIFIED') || errReason.includes('NAVIGATION_404') || errReason.includes('RECIPIENT_MISMATCH')) {
                        await handleSafeRecovery(jobData, errReason);
                    } else {
                        await finishJob(jobData.jobId, jobData.userId, false, errReason);
                    }
                }
            } else if (attempts > maxAttempts) {
                clearInterval(findAndType);
                const isBlocked = checkIfChatDisabledOrBlocked(null);
                const reason = isBlocked ? '🚫 บล็อก / ไม่สามารถส่งข้อความได้แล้ว' : 'RECIPIENT_UNVERIFIED';
                console.error(`❌ ${reason} หาช่องพิมพ์ไม่เจอหรือยืนยันผู้รับไม่ได้...`);
                await handleSafeRecovery(jobData, reason, isBlocked);
            }
        }, 1000);
    }

    async function finishJob(jobId, userId, success, reason = '', isBlocked = false) {
        try {
            sessionStorage.removeItem(`linesync_retry_${jobId}`);

            if (success) {
                emitDiagnostic('JOB_SUCCESS', { jobId: jobId, userId: userId });
                consecutiveErrorCount = 0;
                sessionStorage.setItem('linesync_consecutive_errors', '0');
                await fetchAPI('/campaign/success', 'POST', { jobId: jobId, userId: userId });
            } else {
                emitDiagnostic('JOB_FAIL', { jobId: jobId, userId: userId, reason: reason });

                const isUserBlocked = isBlocked || (reason && (reason.includes('บล็อก') || reason.includes('ไม่สามารถส่งข้อความ')));

                if (isUserBlocked) {
                    console.log(`ℹ️ ผู้ใช้บล็อกแชท/ส่งไม่ได้ (ไม่นับเป็น Error ระบบ): ${userId}`);
                } else {
                    consecutiveErrorCount++;
                    sessionStorage.setItem('linesync_consecutive_errors', String(consecutiveErrorCount));
                    console.warn(`⚠️ เกิด Error สะสมติดต่อกันแล้ว ${consecutiveErrorCount}/10 รายการ (${reason})`);
                }

                await fetchAPI('/campaign/fail', 'POST', { jobId: jobId, userId: userId, reason: reason, isBlocked: isBlocked });

                if (consecutiveErrorCount >= 10) {
                    console.error("🚨 [CRITICAL] พบ Error ติดต่อกันเกิน 10 รายการ! สั่งหยุดสคริปต์ฉุกเฉิน (Circuit Breaker)...");
                    await fetchAPI('/campaign/stop', 'POST', {
                        jobId: jobId,
                        reason: '🚨 สคริปต์หยุดทำงานอัตโนมัติเนื่องจากพบ Error ติดต่อกันเกิน 10 รายการ',
                        errorOverflow: true
                    });
                    safeClearSessionStorage();
                    isExecutingJob = false;
                    alert('🚨 ระบบเซฟตี้หยุดสคริปต์อัตโนมัติ เนื่องจากพบ Error ติดต่อกันเกิน 10 รายการเพื่อความปลอดภัยของบัญชี LINE OA');
                    return;
                }
            }
        } catch(e) {
            console.error("❌ ส่งรายงานไม่สำเร็จ");
        } finally {
            sessionStorage.removeItem('linesync_jobid');
            sessionStorage.removeItem('linesync_msg');
            sessionStorage.removeItem('linesync_uid');
            sessionStorage.removeItem('linesync_type');
            sessionStorage.removeItem('linesync_img');
            sessionStorage.removeItem('linesync_link');

            isExecutingJob = false;

            closeUserChatAndReturnToMain();
            setTimeout(processQueue, 3500);
        }
    }

    // 🛡️ SAVED ACTIVE JOB RECOVERY WITH FAIL-CLOSED RUNTIME RETRY & LEADER LOCK (REL-WP001)
    async function resumeSavedActiveJob(savedJobData) {
        if (!savedJobData) return;

        const isLeader = await ensureWorkerLeadership();
        if (!isLeader) {
            console.warn(`🛑 [REL] WORKER STANDBY: Page-load saved job exists on non-leader tab ${getTabSessionId()}. Relinquishing local active job session.`);
            sessionStorage.removeItem('linesync_jobid');
            sessionStorage.removeItem('linesync_uid');
            sessionStorage.removeItem('linesync_msg');
            sessionStorage.removeItem('linesync_type');
            sessionStorage.removeItem('linesync_img');
            sessionStorage.removeItem('linesync_link');
            return;
        }

        const isCompatible = await checkRuntimeCompatibility();
        if (!isCompatible) {
            console.warn("🛑 [OPS] Page-load active job resumption blocked: Runtime compatibility check failed. Preserving active job session safely.");
            setTimeout(() => resumeSavedActiveJob(savedJobData), CHECK_INTERVAL);
            return;
        }

        emitDiagnostic('PAGE_LOAD_ACTIVE_JOB', { jobId: savedJobData.jobId, userId: savedJobData.userId });

        if (checkIfErrorPage()) {
            console.warn("🛑 [SAFETY] โหลดหน้าเจอ 404 / Error Page พร้อมมีคิวค้าง -> ส่งเข้า Same-Job Safe Recovery...");
            emitDiagnostic('NAVIGATION_404', { jobId: savedJobData.jobId, userId: savedJobData.userId, reason: 'Page load 404 error page detected' });
            handleSafeRecovery(savedJobData, 'NAVIGATION_404');
            return;
        }

        if (verifyCurrentRecipient(savedJobData.userId)) {
            console.log("🚀 โหลดหน้าแชทสำเร็จและยืนยันผู้รับถูกต้อง เริ่มพิมพ์ข้อความต่อ...");
            executeChatBot(savedJobData);
        } else {
            console.warn("🛑 [SAFETY] โหลดหน้าแชทยืนยันผู้รับไม่ตรง -> ส่งเข้า Same-Job Safe Recovery...");
            handleSafeRecovery(savedJobData, 'RECIPIENT_UNVERIFIED');
        }
    }

    // 🛡️ PAGE-LOAD RECOVERY GUARD & DIAGNOSTIC INITIALIZATION
    window.addEventListener('load', () => {
        emitDiagnostic('BOT_START');
        flushPendingDiagnostics().catch(() => {});
        ensureTabIdentity().catch(() => {});

        setTimeout(async () => {
            const savedJobId = sessionStorage.getItem('linesync_jobid');
            const savedMsg = sessionStorage.getItem('linesync_msg');
            const savedUid = sessionStorage.getItem('linesync_uid');
            const savedType = sessionStorage.getItem('linesync_type');
            const savedImg = sessionStorage.getItem('linesync_img');
            const savedLink = sessionStorage.getItem('linesync_link');

            const savedJobData = savedJobId && savedUid ? {
                jobId: savedJobId,
                userId: savedUid,
                messageType: savedType,
                message: savedMsg,
                imageUrl: savedImg,
                linkUrl: savedLink
            } : null;

            if (savedJobData) {
                resumeSavedActiveJob(savedJobData);
            } else {
                if (checkIfErrorPage()) {
                    console.warn("🛑 [SAFETY] โหลดหน้าเจอ 404 / Error Page (ไม่มีคิวค้าง)...");
                    emitDiagnostic('NAVIGATION_404', { reason: 'Page load 404 error page without active job' });
                    const mainUrl = getOAContextUrl(null);
                    if (mainUrl && window.location.href !== mainUrl) {
                        console.log(`🌐 [RECOVERY] Navigating to known valid OA chat main URL: ${mainUrl}`);
                        await navigateAsLeader(mainUrl, 'PAGE_LOAD_404_MAIN');
                        return;
                    } else {
                        console.warn("🛑 [SAFETY] Cannot recover from 404 automatically: No valid trusted OA context ID. Failing closed.");
                        return;
                    }
                }
                processQueue();
            }
        }, 2000);
    });

})();