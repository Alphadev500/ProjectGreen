// ==UserScript==
// @name         Green Search Page Full Auto Call
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Call filtered CRM leads one at a time and hang up after the selected time.
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const WORKER_ACTION = 'GREEN_FULL_AUTO_CALL';
    const DONE_ACTION = 'GREEN_FULL_AUTO_CALL_DONE';
    const DEFAULT_HANGUP_SECONDS = 35;
    const ACTIVE_CALL_KEY = 'greenSearchFullAutoActiveCall';
    const CALL_RESULT_KEY = 'greenSearchFullAutoCallResult';

    const readActiveCall = () => {
        try {
            return JSON.parse(localStorage.getItem(ACTIVE_CALL_KEY) || 'null');
        } catch (_) {
            return null;
        }
    };

    const writeActiveCall = (call) => localStorage.setItem(ACTIVE_CALL_KEY, JSON.stringify(call));

    function callPageIsVisible() {
        return Boolean(document.querySelector('.page-holder .wrapper .connect span, .block-btn-call, .timer'));
    }

    // A CRM call opens on its own call page/window. This watcher is deliberately
    // started in every frame and top-level page so that the page containing the
    // timer, rather than the lead iframe, owns answering and hanging up.
    function startCallPageWatcher() {
        let watcherRunning = false;
        setInterval(() => {
            if (watcherRunning || !callPageIsVisible()) return;
            const activeCall = readActiveCall();
            if (!activeCall || Date.now() - activeCall.startedAt > 120000 || activeCall.finishedAt) return;
            watcherRunning = true;
            monitorLiveCall(activeCall).finally(() => {
                watcherRunning = false;
            });
        }, 250);
    }

    async function monitorLiveCall(initialCall) {
        let activeCall = initialCall;
        let sawCallTimer = false;
        const deadline = Date.now() + Math.max(60000, (Number(activeCall.hangupSeconds) + 30) * 1000);

        while (Date.now() < deadline) {
            activeCall = readActiveCall();
            if (!activeCall || activeCall.runId !== initialCall.runId || activeCall.leadId !== initialCall.leadId || activeCall.finishedAt) return;

            const answerButton = document.querySelector('.block-btn-call .el-button.el-button--success, .block-btn-call button.el-button--success');
            if (answerButton && !activeCall.answerClicked) {
                activeCall.answerClicked = true;
                writeActiveCall(activeCall);
                answerButton.click();
            }

            const timer = document.querySelector('.timer');
            if (timer) {
                sawCallTimer = true;
                const seconds = parseTimerSeconds(timer.innerText || timer.textContent);
                activeCall.status = 'in-call';
                activeCall.elapsedSeconds = seconds;
                activeCall.pickedUp = isCallPickedUp();
                writeActiveCall(activeCall);

                if (seconds >= Number(activeCall.hangupSeconds)) {
                    const hangupButton = findHangupButton();
                    if (!hangupButton) {
                        activeCall.status = 'waiting-for-hangup-control';
                        writeActiveCall(activeCall);
                        await delay(200);
                        continue;
                    }

                    // Mark immediately before the real click so a second
                    // watcher cannot issue another hangup for this call.
                    activeCall.finishedAt = Date.now();
                    activeCall.status = 'hangup-requested';
                    writeActiveCall(activeCall);
                    hangupButton.click();
                    localStorage.setItem(CALL_RESULT_KEY, JSON.stringify({
                        runId: activeCall.runId,
                        leadId: activeCall.leadId,
                        status: 'success',
                        elapsedSeconds: seconds,
                        finishedAt: activeCall.finishedAt
                    }));
                    return;
                }
            } else if (sawCallTimer) {
                // A timer that was present and then disappeared means the call
                // ended in the call tab (including when the user hangs up).
                // Finish this lead immediately instead of waiting for the
                // configured automatic-hangup time.
                activeCall.finishedAt = Date.now();
                activeCall.status = 'ended-early';
                writeActiveCall(activeCall);
                localStorage.setItem(CALL_RESULT_KEY, JSON.stringify({
                    runId: activeCall.runId,
                    leadId: activeCall.leadId,
                    status: 'success',
                    elapsedSeconds: Number(activeCall.elapsedSeconds) || 0,
                    finishedAt: activeCall.finishedAt
                }));
                return;
            }
            await delay(200);
        }
    }

    function parseTimerSeconds(value) {
        const parts = String(value || '').trim().split(':').map(Number);
        if (!parts.every(Number.isFinite)) return 0;
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
    }

    function isCallPickedUp() {
        const status = document.querySelector('.status-call-start, .page-holder .wrapper .connect');
        return (status?.textContent || '').toLowerCase().includes('picked up');
    }

    function findHangupButton() {
        const candidates = [
            ...document.querySelectorAll('.block-btn-call .el-button.el-button--danger'),
            ...document.querySelectorAll('.el-button.el-button--danger'),
            ...document.querySelectorAll('button, [role="button"]')
        ];
        return candidates.find((button) => {
            if (button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
            const label = (button.innerText || button.textContent || '').trim().toLowerCase();
            // Some CRM skins use an icon-only danger button, hence the danger
            // class fallback in addition to the readable label checks.
            return button.matches('.el-button.el-button--danger') || /hang.?up|end call|cancel call|disconnect/.test(label);
        }) || null;
    }

    function isCarouselLead() {
        const pageHtml = document.documentElement?.outerHTML?.toLowerCase() || '';
        return pageHtml.includes('carusel') || pageHtml.includes('carousel');
    }

    startCallPageWatcher();

    // The script is loaded in every lead iframe as well. Only the iframe runs
    // the call controls; the top window owns the menu, API, and queue.
    if (window.self !== window.top) {
        let callAlreadyStarted = false;
        window.addEventListener('message', async (event) => {
            if (event.data?.action !== WORKER_ACTION) return;

            const { leadId, hangupSeconds, runId } = event.data;
            // A duplicate postMessage or a delayed iframe load must never start
            // a second call for the same lead.
            if (callAlreadyStarted) {
                window.parent.postMessage({ action: DONE_ACTION, leadId, status: 'error', error: 'Call already started for this iframe.' }, '*');
                return;
            }
            callAlreadyStarted = true;
            try {
                await callLead(leadId, runId, Number(hangupSeconds) || DEFAULT_HANGUP_SECONDS);
                window.parent.postMessage({ action: DONE_ACTION, leadId, status: 'success' }, '*');
            } catch (error) {
                window.parent.postMessage({ action: DONE_ACTION, leadId, status: 'error', error: error.message }, '*');
            }
        });
        return;
    }

    function resolveCrmConfig() {
        if (window.location.hostname === 'app.techconpro.net') {
            return {
                leadUrlBase: 'https://app.techconpro.net/callcenter/#/lead/',
                apiBaseUrl: 'https://backoffice.techconpro.net/api/lead/list',
                appOrigin: 'https://app.techconpro.net'
            };
        }
        return {
            leadUrlBase: 'https://app.licacrm.co/callcenter/#/lead/',
            apiBaseUrl: 'https://licacrm.co/api/lead/list',
            appOrigin: 'https://app.licacrm.co'
        };
    }

    const crm = resolveCrmConfig();
    const pagination = { totalItems: 0, totalPages: 0, limit: 20 };
    let isRunning = false;
    let stopRequested = false;
    const handledLeadIds = new Set();
    let activeRunId = null;
    let previousAutoCallingSetting = null;

    function credentials() {
        const clean = (value) => typeof value === 'string' ? value.replace(/['"]+/g, '').trim() : value;
        return {
            role: clean(localStorage.getItem('crm_role')),
            token: clean(localStorage.getItem('crm_token')),
            userId: clean(localStorage.getItem('crm_id'))
        };
    }

    function apiHeaders() {
        const auth = credentials();
        return {
            Accept: 'application/json',
            Authorization: `Bearer ${auth.token}`,
            'lica-role': auth.role,
            'lica-user': auth.userId,
            Origin: crm.appOrigin,
            Referer: `${crm.appOrigin}/`
        };
    }

    function hasCredentials() {
        const auth = credentials();
        return Boolean(auth.role && auth.token && auth.userId);
    }

    function createWidget() {
        if (document.getElementById('green-search-full-auto')) return;

        const panel = document.createElement('div');
        panel.id = 'green-search-full-auto';
        panel.innerHTML = `
            <div style="position:fixed;top:80px;right:20px;z-index:999999;background:#1e1e2d;color:#fff;width:280px;padding:15px;border:1px solid #333;border-radius:8px;box-shadow:0 6px 12px rgba(0,0,0,.5);font-family:Arial,sans-serif">
                <h3 style="margin:0 0 12px;color:#67c23a;text-align:center;font-size:16px">☎ Search Full Auto</h3>
                <label style="display:block;margin-bottom:10px;font-size:12px;color:#aaa">Assign (Manager)
                    <select id="green-call-manager" style="display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:6px;background:#2b2b36;border:1px solid #444;border-radius:4px;color:#fff"><option>Loading managers…</option></select>
                </label>
                <label style="display:block;margin-bottom:10px;font-size:12px;color:#aaa">Category
                    <select id="green-call-category" style="display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:6px;background:#2b2b36;border:1px solid #444;border-radius:4px;color:#fff"><option>Loading categories…</option></select>
                </label>
                <label style="display:block;margin-bottom:12px;font-size:12px;color:#aaa">Hangup time (seconds)
                    <input id="green-call-hangup" type="number" min="1" step="1" value="${localStorage.getItem('greenSearchFullAutoHangup') || DEFAULT_HANGUP_SECONDS}" style="display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:6px;background:#2b2b36;border:1px solid #444;border-radius:4px;color:#fff">
                </label>
                <div style="background:#2b2b36;padding:10px;border-radius:4px;margin-bottom:10px"><div id="green-call-status" style="font-size:13px;color:#e6a23c">Loading filters…</div><div id="green-call-live" style="font-size:12px;color:#67c23a;margin-top:5px">Live call: waiting</div><div id="green-call-count" style="font-size:12px;color:#aaa;margin-top:5px">Completed: 0</div></div>
                <button id="green-call-start" disabled style="width:100%;padding:10px;background:#67c23a;border:0;border-radius:4px;color:white;font-weight:bold;cursor:pointer">Loading…</button>
                <button id="green-call-stop" style="display:none;width:100%;padding:10px;background:#f56c6c;border:0;border-radius:4px;color:white;font-weight:bold;cursor:pointer">Stop after current lead</button>
            </div>`;
        document.body.appendChild(panel);

        document.getElementById('green-call-start').addEventListener('click', start);
        document.getElementById('green-call-stop').addEventListener('click', () => {
            stopRequested = true;
            setStatus('Stopping after the current lead…');
        });
        document.getElementById('green-call-manager').addEventListener('change', refreshPagination);
        document.getElementById('green-call-category').addEventListener('change', refreshPagination);
        document.getElementById('green-call-hangup').addEventListener('change', (event) => {
            const value = Math.max(1, Number(event.target.value) || DEFAULT_HANGUP_SECONDS);
            event.target.value = value;
            localStorage.setItem('greenSearchFullAutoHangup', String(value));
        });
        setInterval(updateLiveCallDisplay, 250);
    }

    function setStatus(message, completed) {
        const status = document.getElementById('green-call-status');
        const count = document.getElementById('green-call-count');
        if (status) status.textContent = message;
        if (completed !== undefined && count) count.textContent = `Completed: ${completed}`;
    }

    function setRunning(running) {
        document.getElementById('green-call-start').style.display = running ? 'none' : 'block';
        document.getElementById('green-call-stop').style.display = running ? 'block' : 'none';
    }

    function updateLiveCallDisplay() {
        const live = document.getElementById('green-call-live');
        if (!live) return;
        const activeCall = readActiveCall();
        if (!isRunning || !activeCall || activeCall.runId !== activeRunId) {
            live.textContent = 'Live call: waiting';
            return;
        }
        const elapsed = Number(activeCall.elapsedSeconds) || 0;
        const hangupAt = Number(activeCall.hangupSeconds) || DEFAULT_HANGUP_SECONDS;
        const remaining = Math.max(0, hangupAt - elapsed);
        live.textContent = activeCall.status === 'in-call'
            ? `Live call: ${elapsed}s elapsed · hangup in ${remaining}s${activeCall.pickedUp ? ' · picked up' : ''}`
            : 'Live call: connecting…';
    }

    function setPagination(source) {
        const totalItems = Number(source?.total_items ?? source?.total ?? 0);
        const limit = Number(source?.limit ?? 20) || 20;
        pagination.totalItems = totalItems;
        pagination.limit = limit;
        pagination.totalPages = Math.ceil(totalItems / limit) || Number(source?.total_pages ?? source?.last ?? source?.last_page ?? 0);
    }

    async function fetchLeads(page, manager = '', category = '') {
        if (!hasCredentials()) throw new Error('CRM credentials were not found in localStorage. Open the CRM and sign in first.');
        const url = new URL(crm.apiBaseUrl);
        url.searchParams.set('page', String(page));
        if (manager) url.searchParams.set('assign', manager);
        if (category) url.searchParams.set('lead_category', category);

        const response = await fetch(url, { headers: apiHeaders() });
        if (!response.ok) throw new Error(`Lead API returned ${response.status}`);
        const data = await response.json();
        const payload = data?.data || data || {};
        const items = Array.isArray(payload.items) ? payload.items : (Array.isArray(data?.items) ? data.items : []);
        setPagination(payload);
        return {
            ids: items.map((lead) => lead?.id ?? lead?.lead_id ?? lead?.uuid).filter(Boolean),
            totalPages: Number(payload.total_pages ?? payload.last ?? payload.last_page ?? pagination.totalPages)
        };
    }

    async function loadFilters() {
        try {
            if (!hasCredentials()) throw new Error('CRM credentials were not found. Open the CRM and sign in first.');
            const response = await fetch(`${crm.apiBaseUrl}?page=1`, { headers: apiHeaders() });
            if (!response.ok) throw new Error(`Lead API returned ${response.status}`);
            const data = await response.json();
            const payload = data?.data || data || {};
            setPagination(payload);

            const managerSelect = document.getElementById('green-call-manager');
            const categorySelect = document.getElementById('green-call-category');
            managerSelect.innerHTML = '<option value="">-- All Managers --</option>';
            categorySelect.innerHTML = '<option value="">-- All Categories --</option>';

            Object.entries(payload.managers || data.managers || {}).forEach(([key, manager]) => {
                const value = manager?.value ?? key;
                const name = manager?.full_name ?? manager?.name ?? String(value);
                managerSelect.add(new Option(name, String(value)));
            });
            const categories = payload.categories || data.categories || payload.statuses || data.statuses || {};
            (Array.isArray(categories) ? categories : Object.entries(categories).map(([id, category]) => ({ id, category }))).forEach((item) => {
                const category = item?.category ?? item;
                const value = category?.value ?? category?.id ?? item?.id ?? category;
                const label = category?.name ?? category?.title ?? String(value);
                categorySelect.add(new Option(label, String(value)));
            });

            await refreshPagination();
            const button = document.getElementById('green-call-start');
            button.disabled = false;
            button.textContent = '▶ Start calling';
        } catch (error) {
            console.error('Could not load call filters:', error);
            setStatus(error.message);
        }
    }

    async function refreshPagination() {
        try {
            const result = await fetchLeads(1, document.getElementById('green-call-manager').value, document.getElementById('green-call-category').value);
            const pages = result.totalPages || pagination.totalPages || 0;
            setStatus(`Ready: ${pagination.totalItems} users across ${pages} pages.`);
        } catch (error) {
            setStatus(error.message);
        }
    }

    async function start() {
        if (isRunning) return;
        isRunning = true;
        stopRequested = false;
        activeRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        // Other installed FullAutoCall scripts auto-click the same lead button
        // on iframe load. Disable only that automatic path during this queue;
        // this script still performs its own one deliberate click per lead.
        previousAutoCallingSetting = localStorage.getItem('AutoCalling');
        localStorage.setItem('AutoCalling', 'false');
        setRunning(true);

        const manager = document.getElementById('green-call-manager').value;
        const category = document.getElementById('green-call-category').value;
        const hangupSeconds = Math.max(1, Number(document.getElementById('green-call-hangup').value) || DEFAULT_HANGUP_SECONDS);
        localStorage.setItem('greenSearchFullAutoHangup', String(hangupSeconds));

        let page = 1;
        let completed = 0;
        let attempted = 0;
        let totalPages = 0;
        try {
            while (!stopRequested) {
                setStatus(`Loading page ${page}${totalPages ? `/${totalPages}` : ''}…`, completed);
                const result = await fetchLeads(page, manager, category);
                totalPages = result.totalPages || pagination.totalPages;
                if (!result.ids.length) break;

                for (const leadId of result.ids) {
                    if (stopRequested) break;
                    const leadKey = String(leadId);
                    if (handledLeadIds.has(leadKey)) continue;
                    // Record before loading the iframe so an API page overlap,
                    // retry, or moving pagination cannot call a user twice.
                    handledLeadIds.add(leadKey);
                    attempted++;
                    setStatus(`Calling ${attempted}/${pagination.totalItems || '?'} (page ${page}${totalPages ? `/${totalPages}` : ''})…`, completed);
                    if (await processLead(leadId, hangupSeconds, activeRunId)) completed++;
                }
                if (!totalPages || page >= totalPages) break;
                page++;
            }
            setStatus(stopRequested ? `Stopped. Completed ${completed}/${attempted} calls.` : `Finished. Completed ${completed}/${attempted} calls.`, completed);
        } catch (error) {
            console.error('Full auto call stopped:', error);
            setStatus(`Stopped: ${error.message}`, completed);
        } finally {
            if (previousAutoCallingSetting === null) localStorage.removeItem('AutoCalling');
            else localStorage.setItem('AutoCalling', previousAutoCallingSetting);
            previousAutoCallingSetting = null;
            isRunning = false;
            setRunning(false);
        }
    }

    function processLead(leadId, hangupSeconds, runId) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.src = `${crm.leadUrlBase}${encodeURIComponent(leadId)}`;
            // Keep the lead/call page visible while it is processed. The control
            // panel remains above it on the right side.
            iframe.style.cssText = 'position:fixed;z-index:999998;left:16px;top:70px;width:calc(100vw - 340px);height:calc(100vh - 86px);border:1px solid #444;background:#fff;box-shadow:0 4px 18px rgba(0,0,0,.35);';
            document.body.appendChild(iframe);

            let settled = false;
            let resultPoll = null;
            const finish = (success) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                clearInterval(resultPoll);
                window.removeEventListener('message', onMessage);
                iframe.remove();
                resolve(success);
            };
            const timeout = setTimeout(() => finish(false), Math.max(60000, (hangupSeconds + 35) * 1000));
            const onMessage = (event) => {
                if (event.source !== iframe.contentWindow || event.data?.action !== DONE_ACTION || event.data.leadId !== leadId) return;
                finish(event.data.status === 'success');
            };
            window.addEventListener('message', onMessage);
            // The CRM can navigate the iframe into its call-tab route. That
            // destroys the iframe worker before it can postMessage back, so the
            // parent queue also observes the shared completion record itself.
            resultPoll = setInterval(() => {
                let result = null;
                try {
                    result = JSON.parse(localStorage.getItem(CALL_RESULT_KEY) || 'null');
                } catch (_) {}
                if (result?.runId === runId && String(result.leadId) === String(leadId)) {
                    finish(result.status === 'success');
                }
            }, 150);
            iframe.addEventListener('load', async () => {
                await delay(1200);
                iframe.contentWindow.postMessage({ action: WORKER_ACTION, leadId, hangupSeconds, runId }, '*');
            }, { once: true });
        });
    }

    async function waitFor(selector, timeout = 20000) {
        const endsAt = Date.now() + timeout;
        while (Date.now() < endsAt) {
            const element = document.querySelector(selector);
            if (element) return element;
            await delay(150);
        }
        throw new Error(`Timed out waiting for ${selector}`);
    }

    async function callLead(leadId, runId, hangupSeconds) {
        const callButton = await waitFor('.call-img.mr-2.pointer', 30000);
        writeActiveCall({
            runId,
            leadId,
            hangupSeconds,
            startedAt: Date.now(),
            status: 'starting',
            answerClicked: false
        });
        callButton.click();

        // Confirm Call and Refuse to Talk dialogs are rendered asynchronously.
        const confirmDeadline = Date.now() + 12000;
        let refuseToTalkConfirmed = false;
        let callConfirmed = false;
        while (Date.now() < confirmDeadline) {
            const dialogs = [...document.querySelectorAll('.el-dialog')];
            for (const dialog of dialogs) {
                const text = (dialog.textContent || '').toLowerCase();
                const buttons = [...dialog.querySelectorAll('button, [role="button"]')];
                const enabledButton = (label) => buttons.find((item) =>
                    !item.disabled && item.getAttribute('aria-disabled') !== 'true' && (item.textContent || '').trim().toLowerCase() === label
                );

                // Each dialog action is intentionally clicked once. Re-clicking
                // the same confirmation while a call is connecting starts a
                // duplicate call in this CRM.
                if (text.includes('refuse to talk') && !refuseToTalkConfirmed) {
                    const refuseButton = enabledButton('yes, call');
                    if (refuseButton) {
                        refuseToTalkConfirmed = true;
                        refuseButton.click();
                    }
                } else if (!text.includes('refuse to talk') && !callConfirmed) {
                    // FullAutoCall treats carousel numbers specially: after
                    // pressing the call icon, that UI opens/starts its own call.
                    // Clicking the normal Yes button as well creates a second
                    // call, so only wait for its call-page timer here.
                    if (isCarouselLead()) {
                        callConfirmed = true;
                        continue;
                    }
                    const yesButton = enabledButton('yes');
                    if (yesButton) {
                        callConfirmed = true;
                        yesButton.click();
                    }
                }
            }
            if (document.querySelector('.timer')) break;
            await delay(200);
        }

        // The timer may be in this iframe or in the CRM's separate call page.
        // Wait for the watcher on whichever page owns it to complete the call.
        const deadline = Date.now() + Math.max(60000, (hangupSeconds + 35) * 1000);
        while (Date.now() < deadline) {
            const result = (() => {
                try { return JSON.parse(localStorage.getItem(CALL_RESULT_KEY) || 'null'); } catch (_) { return null; }
            })();
            if (result?.runId === runId && result?.leadId === leadId) {
                if (result.status === 'success') return;
                throw new Error(result.error || 'Call did not complete');
            }
            await delay(200);
        }
        throw new Error('Timed out waiting for the call page timer');
    }

    function init() {
        createWidget();
        loadFilters();
    }

    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
