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

    // The script is loaded in every lead iframe as well. Only the iframe runs
    // the call controls; the top window owns the menu, API, and queue.
    if (window.self !== window.top) {
        window.addEventListener('message', async (event) => {
            if (event.data?.action !== WORKER_ACTION) return;

            const { leadId, hangupSeconds } = event.data;
            try {
                await callLead(Number(hangupSeconds) || DEFAULT_HANGUP_SECONDS);
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
                <div style="background:#2b2b36;padding:10px;border-radius:4px;margin-bottom:10px"><div id="green-call-status" style="font-size:13px;color:#e6a23c">Loading filters…</div><div id="green-call-count" style="font-size:12px;color:#aaa;margin-top:5px">Completed: 0</div></div>
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
                    attempted++;
                    setStatus(`Calling ${attempted}/${pagination.totalItems || '?'} (page ${page}${totalPages ? `/${totalPages}` : ''})…`, completed);
                    if (await processLead(leadId, hangupSeconds)) completed++;
                }
                if (!totalPages || page >= totalPages) break;
                page++;
            }
            setStatus(stopRequested ? `Stopped. Completed ${completed}/${attempted} calls.` : `Finished. Completed ${completed}/${attempted} calls.`, completed);
        } catch (error) {
            console.error('Full auto call stopped:', error);
            setStatus(`Stopped: ${error.message}`, completed);
        } finally {
            isRunning = false;
            setRunning(false);
        }
    }

    function processLead(leadId, hangupSeconds) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.src = `${crm.leadUrlBase}${encodeURIComponent(leadId)}`;
            iframe.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:1000px;height:800px;border:0;visibility:hidden;';
            document.body.appendChild(iframe);

            let settled = false;
            const finish = (success) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
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
            iframe.addEventListener('load', async () => {
                await delay(1200);
                iframe.contentWindow.postMessage({ action: WORKER_ACTION, leadId, hangupSeconds }, '*');
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

    async function callLead(hangupSeconds) {
        const callButton = await waitFor('.call-img.mr-2.pointer', 30000);
        callButton.click();

        // Confirm Call and Refuse to Talk dialogs are rendered asynchronously.
        const confirmDeadline = Date.now() + 12000;
        while (Date.now() < confirmDeadline) {
            const dialogs = [...document.querySelectorAll('.el-dialog')];
            for (const dialog of dialogs) {
                const text = (dialog.textContent || '').toLowerCase();
                const button = [...dialog.querySelectorAll('button, [role="button"]')].find((item) => {
                    const label = (item.textContent || '').trim().toLowerCase();
                    return !item.disabled && item.getAttribute('aria-disabled') !== 'true' && (label === 'yes' || (text.includes('refuse to talk') && label === 'yes, call'));
                });
                if (button) button.click();
            }
            if (document.querySelector('.timer')) break;
            await delay(200);
        }

        const timer = await waitFor('.timer', 30000);
        const getSeconds = () => {
            const parts = (timer.textContent || '').trim().split(':').map(Number);
            return parts.length === 3 && parts.every(Number.isFinite) ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0;
        };
        while (getSeconds() < hangupSeconds) await delay(200);

        const hangup = document.querySelector('.el-button.el-button--danger');
        if (!hangup) throw new Error('Hangup button was not found');
        hangup.click();
        await delay(1200);
    }

    function init() {
        createWidget();
        loadFilters();
    }

    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
