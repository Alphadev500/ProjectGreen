// ==UserScript==
// @name         GreenAutoSMS Main - Auto API Filters
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Send SMS via API, dynamically grab Managers/Categories, and search via URL parameters.
// @author       Programming Assistant
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // --- CONFIGURATION ---
    const TEMPLATE_NAME = "AutoSmsP";
    const delay = (min, max) => new Promise(r => setTimeout(r, Math.random() * (max - min) + min));

    // ========================================================================
    // 1. IFRAME WORKER BOT (Executes clicks for SMS)
    // ========================================================================
    if (window.self !== window.top) {
        window.addEventListener("message", async (e) => {
            if (e.data && e.data.action === "RUN_SMS") {
                try {
                    await processSms(e.data.template);
                    window.parent.postMessage({ action: "SMS_DONE", status: "success", leadId: e.data.leadId }, "*");
                } catch (error) {
                    window.parent.postMessage({ action: "SMS_DONE", status: "error", error: error.message, leadId: e.data.leadId }, "*");
                }
            }
        });

        async function processSms(templateName) {
            await delay(3000, 4500); // Wait for the lead card to load

            // 1. Click the SMS icon
            const smsIcon = document.querySelector('.flaticon2-sms.sms-img') || document.querySelector('[title="Send SMS"]');
            if (!smsIcon) throw new Error("SMS icon not found");
            smsIcon.click();

            await delay(1000, 1500);

            // 2. Open the template dropdown
            const selectWrapper = document.querySelector('.el-select__wrapper');
            if (!selectWrapper) throw new Error("Template dropdown not found");
            selectWrapper.click();

            await delay(1000, 1500);

            // 3. Select the AutoSmsP template
            const options = document.querySelectorAll('.el-select-dropdown__item, .el-select-dropdown__item span');
            const targetOption = Array.from(options).find(opt => opt.innerText.trim() === templateName);
            if (!targetOption) throw new Error(`Template '${templateName}' not found`);
            targetOption.click();

            await delay(1000, 1500);

            // 4. Click the Send SMS button
            const buttons = document.querySelectorAll('button.form__btn.form__btn-success');
            const sendBtn = Array.from(buttons).find(btn => btn.innerText.trim() === 'Send SMS');
            if (!sendBtn) throw new Error("Send SMS button not found");
            sendBtn.click();

            await delay(1500, 2000); // Wait for the request to be sent
            return true;
        }
        return; // Stop execution of the main code inside the iframe
    }

    // ========================================================================
    // 2. PARENT CONTROLLER (Control Panel and API)
    // ========================================================================

    // CRM configuration definition
    function resolveCrmConfig() {
        const hostname = window.location.hostname;
        if (hostname === "app.techconpro.net") {
            return {
                leadUrlBase: "https://app.techconpro.net/callcenter/#/lead/",
                apiBaseUrl: "https://backoffice.techconpro.net/api/lead/list",
                appOrigin: "https://app.techconpro.net"
            };
        }
        return {
            leadUrlBase: "https://app.licacrm.co/callcenter/#/lead/",
            apiBaseUrl: "https://licacrm.co/api/lead/list",
            appOrigin: "https://app.licacrm.co"
        };
    }

    const crmConfig = resolveCrmConfig();
    let isRunning = false;
    let stopRequested = false;
    const apiPaginationState = {
        totalPages: null,
        totalItems: null,
        limit: null
    };
    const CATEGORY_LABELS = {
        becomeacquainted: "Become Acquainted",
        "t.property.category.becomeacquainted": "Become Acquainted",
        "t.property.category.acquaintance": "Acquaintance",
        "t.property.category.luxuriousacquaintance": "Luxurious Acquaintance",
        "t.property.category.acquaintancecalledback": "Acquaintance Calledback",
        "t.property.category.failedacquaintance": "Failed Aacquaintance",
        "t.property.category.playedlastweek": "Played Last Week",
        "t.property.category.playedthisweek": "Played This Week",
        "t.property.category.retention": "Retention"
    };

    // Create Widget on the screen
    function createWidget() {
        if (document.getElementById('green-auto-sms-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'green-auto-sms-widget';

        widget.innerHTML = `
            <div style="background: #1e1e2d; color: #fff; padding: 15px; border-radius: 8px; width: 280px; font-family: Arial, sans-serif; box-shadow: 0 6px 12px rgba(0,0,0,0.5); border: 1px solid #333; z-index: 999999; position: fixed; top: 80px; right: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #67c23a; text-align: center;">✉️ GreenAutoSMS API</h3>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 12px; color: #aaa;">Assign (Manager):</label>
                    <select id="sms-filter-manager" style="width: 100%; padding: 6px; margin-top: 4px; background: #2b2b36; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; cursor: pointer;">
                        <option value="">-- Loading Managers... --</option>
                    </select>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="font-size: 12px; color: #aaa;">Category:</label>
                    <select id="sms-filter-category" style="width: 100%; padding: 6px; margin-top: 4px; background: #2b2b36; border: 1px solid #444; color: #fff; border-radius: 4px; box-sizing: border-box; cursor: pointer;">
                        <option value="">-- Loading Categories... --</option>
                    </select>
                </div>

                <div style="background: #2b2b36; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                    <div id="sms-stats" style="font-size: 13px; font-weight: bold; color: #e6a23c;">Status: Initializing API...</div>
                    <div id="sms-counter" style="font-size: 12px; color: #888; margin-top: 5px;">Processed: 0</div>
                </div>

                <button id="sms-start-btn" style="width: 100%; padding: 10px; background: #67c23a; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; transition: 0.2s;" disabled>▶ Loading...</button>
                <button id="sms-stop-btn" style="width: 100%; padding: 10px; background: #f56c6c; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer; display: none; transition: 0.2s;">⏹ Stop</button>
            </div>
        `;
        document.body.appendChild(widget);

        document.getElementById('sms-start-btn').addEventListener('click', startApiProcess);
        document.getElementById('sms-stop-btn').addEventListener('click', () => {
            stopRequested = true;
            updateStatus("Stopping after current lead...");
        });
        document.getElementById('sms-filter-manager').addEventListener('change', refreshPaginationForCurrentFilters);
        document.getElementById('sms-filter-category').addEventListener('change', refreshPaginationForCurrentFilters);

        // Initialize and fetch filters from API right away
        fetchFiltersAndPopulate();
    }

    function updateStatus(text, processedCount = null) {
        const statsEl = document.getElementById('sms-stats');
        const countEl = document.getElementById('sms-counter');
        if (statsEl) statsEl.innerText = `Status: ${text}`;
        if (processedCount !== null && countEl) countEl.innerText = `Processed: ${processedCount}`;
    }

    function toggleButtons(running) {
        document.getElementById('sms-start-btn').style.display = running ? 'none' : 'block';
        document.getElementById('sms-stop-btn').style.display = running ? 'block' : 'none';
    }

    function bootstrapFetchLeads() {
        if (window.crmLeadFetcher) {
            return;
        }

        window.crmLeadFetcher = {
            config: {
                apiBaseUrl: crmConfig.apiBaseUrl,
                defaultPage: 1,
                appOrigin: crmConfig.appOrigin,
                storageKeys: {
                    role: "crm_role",
                    token: "crm_token",
                    userId: "crm_id"
                }
            },
            state: {
                credentials: null,
                isFetching: false,
                lastResponse: null,
                lastPagination: null
            },
            loadCredentials() {
                const clean = (value) => (typeof value === "string" ? value.replace(/['"]+/g, "").trim() : value);
                const credentials = {
                    role: clean(localStorage.getItem(this.config.storageKeys.role)),
                    token: clean(localStorage.getItem(this.config.storageKeys.token)),
                    userId: clean(localStorage.getItem(this.config.storageKeys.userId))
                };
                this.state.credentials = credentials;
                return credentials;
            },
            hasCredentials(credentials = this.state.credentials) {
                return Boolean(credentials && credentials.role && credentials.token && credentials.userId);
            },
            logCredentialStatus() {
                const credentials = this.loadCredentials();
                if (!this.hasCredentials(credentials)) {
                    console.error("CRM user credentials are missing from localStorage.");
                    return false;
                }

                console.log("User credentials loaded successfully.");
                return true;
            },
            createHeaders() {
                const credentials = this.state.credentials || this.loadCredentials();
                return {
                    Accept: "application/json",
                    Authorization: `Bearer ${credentials.token}`,
                    "lica-role": credentials.role,
                    "lica-user": credentials.userId,
                    Origin: this.config.appOrigin,
                    Referer: `${this.config.appOrigin}/`
                };
            },
            extractPagination(data, requestedPage) {
                const source = data && typeof data === "object" ? data : {};
                const totalPages = source.total_pages ?? source.last ?? source.last_page ?? source.pages ?? null;
                const currentPage = source.current ?? source.current_page ?? source.page ?? requestedPage;
                const leadItems = source.items ?? source.data ?? source.leads ?? source.results ?? [];
                return {
                    currentPage,
                    totalPages,
                    totalItems: source.total_items ?? leadItems.length,
                    nextPage: source.next ?? null,
                    previousPage: source.previous ?? null,
                    leadCount: Array.isArray(leadItems) ? leadItems.length : 0,
                    hasNextPage: totalPages ? Number(currentPage) < Number(totalPages) : null
                };
            },
            async fetchPage(page = this.config.defaultPage) {
                if (this.state.isFetching) {
                    console.warn("Fetch already in progress. Wait until it finishes before requesting another page.");
                    return null;
                }

                if (!this.logCredentialStatus()) {
                    return null;
                }

                this.state.isFetching = true;

                try {
                    const response = await fetch(`${this.config.apiBaseUrl}?page=${page}`, {
                        method: "GET",
                        headers: this.createHeaders()
                    });

                    if (!response.ok) {
                        throw new Error(`Request failed with status ${response.status}`);
                    }

                    const data = await response.json();
                    const payload = data?.data ?? {};
                    const items = Array.isArray(payload.items) ? payload.items : [];
                    const pagination = this.extractPagination(payload, page);
                    const result = {
                        page,
                        status: data?.status ?? null,
                        code: data?.code ?? null,
                        payload,
                        items,
                        pagination,
                        data
                    };

                    this.state.lastResponse = result;
                    this.state.lastPagination = pagination;
                    console.log("Lead page fetched successfully.", result);
                    return result;
                } catch (error) {
                    console.error("Error fetching leads:", error);
                    return null;
                } finally {
                    this.state.isFetching = false;
                }
            },
            async run(page = this.config.defaultPage) {
                return this.fetchPage(page);
            }
        };
    }

    function ensureDependencies() {
        const missing = [];

        if (!window.crmLeadFetcher) {
            missing.push("crmLeadFetcher");
        }

        if (!window.GreenAutoEmail) {
            missing.push("GreenAutoEmail");
        }

        if (!window.dosLoader) {
            missing.push("dosLoader");
        }

        if (missing.length > 0) {
            throw new Error(`Missing dependencies: ${missing.join(", ")}`);
        }
    }

    async function fetchFiltersAndPopulate() {
        bootstrapFetchLeads();
        const credentials = window.crmLeadFetcher.loadCredentials();
        if (!window.crmLeadFetcher.hasCredentials(credentials)) return;

        //try {
            // Make a dummy request to get the metadata (managers, categories)
            const response = await fetch(crmConfig.apiBaseUrl + '?page=1', {
                method: 'GET',
                headers: window.crmLeadFetcher.createHeaders()
            });

            const data = await response.json();
            const paginationSource = data?.data || data || {};
            updatePaginationStateFromSource(paginationSource);

            const managerSelect = document.getElementById('sms-filter-manager');
            const categorySelect = document.getElementById('sms-filter-category');

            // 1. Populate Managers (supports data.data.managers object shape)
            const managers = data?.data.managers || data.managers;
            if (managers && managerSelect) {
                managerSelect.innerHTML = '<option value="">-- All Managers --</option>';

                console.log(managers);
                Object.entries(managers).forEach(([key, val]) => {
                    const managerValue = val?.value;
                    const managerName = val?.full_name;
                    managerSelect.add(new Option(managerName, String(managerValue)));
                });
            }

            // 2. Populate Categories
            const categories = data.categories || data.data?.categories || data.statuses || data.data?.statuses;
            if (categories && categorySelect) {
                categorySelect.innerHTML = '<option value="">-- All Categories --</option>';

                if (Array.isArray(categories)) {
                    categories.forEach(c => {
                        const rawValue = c?.value ?? c?.id ?? c;
                        const key = String(c?.name ?? c?.title ?? rawValue ?? "");
                        const label = CATEGORY_LABELS[key] || c?.name || c?.title || String(rawValue);
                        categorySelect.add(new Option(label, rawValue));
                    });
                } else if (typeof categories === 'object') {
                    Object.entries(categories).forEach(([id, val]) => {
                        const categoryValue = val?.value ?? val?.id ?? id;
                        const key = String(val?.name ?? val?.title ?? val ?? id);
                        const label = CATEGORY_LABELS[key] || val?.name || val?.title || String(val);
                        categorySelect.add(new Option(label, String(categoryValue)));
                    });
                }
            }

            // Enable start button
            const startBtn = document.getElementById('sms-start-btn');
            startBtn.innerText = "▶ Start (API)";
            startBtn.disabled = false;
            updateStatus("Filters loaded. Ready to start.");
            await refreshPaginationForCurrentFilters();

        // } catch (error) {
        //     console.error("Failed to load filters:", error);
        //     updateStatus("Error loading filters.");
        // }
    }

    function updatePaginationStateFromSource(source) {
        const parsedTotalItems = Number(source?.total_items ?? source?.total ?? 0);
        const parsedLimit = Number(source?.limit ?? 20);
        const apiTotalPages = Number(source?.total_pages ?? source?.last ?? source?.last_page ?? 0);

        const hasValidCalc = parsedTotalItems > 0 && parsedLimit > 0;
        const calculatedPages = hasValidCalc ? Math.ceil(parsedTotalItems / parsedLimit) : 0;
        const resolvedTotalPages = calculatedPages || apiTotalPages || 0;

        apiPaginationState.totalItems = parsedTotalItems || 0;
        apiPaginationState.limit = parsedLimit || 20;
        apiPaginationState.totalPages = resolvedTotalPages;
    }

    async function refreshPaginationForCurrentFilters() {
        const managerFilter = document.getElementById('sms-filter-manager')?.value || "";
        const categoryFilter = document.getElementById('sms-filter-category')?.value || "";
        const result = await fetchLeadsFromApi(1, managerFilter, categoryFilter);
        if (!result) return;

        const source = result.rawPayload || {};
        updatePaginationStateFromSource(source);
        updateStatus(`Ready: ${apiPaginationState.totalItems} leads across ${apiPaginationState.totalPages} pages (limit ${apiPaginationState.limit}).`);
    }

    // ========================================================================
    // UPDATED: Fetch Leads via URL Attributes (Query Parameters)
    // ========================================================================
    async function fetchLeadsFromApi(page, manager, category) {
        bootstrapFetchLeads();
        const credentials = window.crmLeadFetcher.loadCredentials();
        if (!window.crmLeadFetcher.hasCredentials(credentials)) {
            alert("Authorization token not found.");
            return null;
        }

        const url = new URL(crmConfig.apiBaseUrl);
        url.searchParams.set("page", String(page));
        const managerValue = String(manager || "").trim();
        const categoryValue = String(category || "").trim();
        if (managerValue) url.searchParams.set("assign", managerValue);
        if (categoryValue) url.searchParams.set("lead_category", categoryValue);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    ...window.crmLeadFetcher.createHeaders()
                }
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = await response.json();
            const payload = data?.data || {};
            const leads = Array.isArray(payload.items) ? payload.items : (Array.isArray(data?.items) ? data.items : []);
            const pagination = window.crmLeadFetcher.extractPagination(payload, page);

            return {
                leadIds: leads.map(lead => lead?.id ?? lead?.lead_id ?? lead?.uuid).filter(Boolean),
                pagination,
                rawPayload: payload
            };

        } catch (error) {
            console.error("API request error:", error);
            return null;
        }
    }

    // Main processing loop
    async function startApiProcess() {
        if (isRunning) return;
        isRunning = true;
        stopRequested = false;
        toggleButtons(true);

        const managerFilter = document.getElementById('sms-filter-manager').value;
        const categoryFilter = document.getElementById('sms-filter-category').value;
        await refreshPaginationForCurrentFilters();

        let currentPage = 1;
        let totalPages = apiPaginationState.totalPages;
        let totalProcessed = 0;
        let totalAttempted = 0;
        let hasMoreLeads = true;

        while (hasMoreLeads && !stopRequested) {
            updateStatus(`Loading page ${currentPage}${totalPages ? `/${totalPages}` : ''} of ${apiPaginationState.totalItems || 0} filtered users...`, totalProcessed);

            // Fetch array of lead IDs with URL filters
            const pageResult = await fetchLeadsFromApi(currentPage, managerFilter, categoryFilter);

            if (!pageResult) {
                updateStatus("Failed to load leads from API.");
                break;
            }

            const leadIds = pageResult.leadIds;
            if (pageResult.pagination?.totalPages) {
                totalPages = pageResult.pagination.totalPages;
            }

            if (!leadIds || leadIds.length === 0) {
                const canTryNextPage = totalPages ? Number(currentPage) < Number(totalPages) : false;
                if (canTryNextPage) {
                    updateStatus(`No leads on page ${currentPage}. Moving to next page...`, totalProcessed);
                    currentPage++;
                    continue;
                }
                updateStatus("No more leads found.");
                hasMoreLeads = false;
                break;
            }

            updateStatus(`Filtered users: ${apiPaginationState.totalItems || 0}. Processing page ${currentPage}${totalPages ? `/${totalPages}` : ''}...`, totalProcessed);

            // Process leads one by one in iframe
            for (let i = 0; i < leadIds.length; i++) {
                if (stopRequested) break;

                const leadId = leadIds[i];
                const leadUrl = `${crmConfig.leadUrlBase}${leadId}`;

                totalAttempted++;
                updateStatus(`Sending SMS ${totalAttempted}/${apiPaginationState.totalItems || 0} (page ${currentPage}${totalPages ? `/${totalPages}` : ''})...`, totalProcessed);

                try {
                    const success = await processLeadInIframe(leadUrl, leadId);
                    if (success) totalProcessed++;
                } catch (err) {
                    console.error("Error processing lead:", leadId, err);
                }
            }

            const reachedEndByTotalPages = totalPages ? Number(currentPage) >= Number(totalPages) : false;
            if (reachedEndByTotalPages) {
                hasMoreLeads = false;
            } else {
                currentPage++;
            }
        }

        const finishText = stopRequested
            ? `Stopped by user. Sent ${totalProcessed}/${totalAttempted} attempted.`
            : `Processing finished. Sent ${totalProcessed}/${totalAttempted} attempted.`;
        updateStatus(finishText, totalProcessed);
        isRunning = false;
        toggleButtons(false);
    }

    // Load lead in Iframe and control sending
    function processLeadInIframe(url, leadId) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.position = 'fixed';
            iframe.style.bottom = '-2000px';
            iframe.style.width = '1000px';
            iframe.style.height = '800px';
            document.body.appendChild(iframe);

            const timeoutId = setTimeout(() => {
                cleanup();
                resolve(false);
            }, 25000);

            const messageListener = (e) => {
                if (e.data && e.data.action === "SMS_DONE" && e.data.leadId === leadId) {
                    cleanup();
                    resolve(e.data.status === "success");
                }
            };

            window.addEventListener("message", messageListener);

            iframe.onload = async () => {
                await delay(2000, 3000);
                iframe.contentWindow.postMessage({ action: "RUN_SMS", template: TEMPLATE_NAME, leadId: leadId }, "*");
            };

            function cleanup() {
                clearTimeout(timeoutId);
                window.removeEventListener("message", messageListener);
                if (document.body.contains(iframe)) document.body.removeChild(iframe);
            }
        });
    }

    function showNotAuthorizedMessage(message = "Not authorized") {
        const existing = document.getElementById("green-auto-sms-auth-status");
        if (existing) existing.remove();

        const notice = document.createElement("div");
        notice.id = "green-auto-sms-auth-status";
        notice.style.position = "fixed";
        notice.style.top = "20px";
        notice.style.left = "50%";
        notice.style.transform = "translateX(-50%)";
        notice.style.padding = "10px 14px";
        notice.style.background = "#c0392b";
        notice.style.color = "#fff";
        notice.style.borderRadius = "6px";
        notice.style.zIndex = "999999";
        notice.style.fontFamily = "Arial, sans-serif";
        notice.style.fontSize = "14px";
        notice.textContent = message;
        document.body.appendChild(notice);
    }

    function extractAgentName() {
        const header = document.querySelector(".header__ip");
        if (!header) return null;

        const lines = header.querySelectorAll("p");
        for (const line of lines) {
            const text = (line.textContent || "").trim();
            if (!text.toLowerCase().includes("agent name")) continue;

            const parts = text.split("⏤");
            if (parts.length > 1) {
                const name = parts.slice(1).join("⏤").trim();
                if (name) return name;
            }

            const fallback = text.replace(/agent name\s*[:\-–—⏤]?\s*/i, "").trim();
            if (fallback) return fallback;
        }

        return null;
    }

    function waitForAgentName(maxAttempts = 20, delayMs = 500) {
        return new Promise((resolve) => {
            let attempts = 0;

            const tick = () => {
                const name = extractAgentName();
                if (name) return resolve(name);

                attempts += 1;
                if (attempts >= maxAttempts) return resolve(null);
                setTimeout(tick, delayMs);
            };

            tick();
        });
    }

    async function authorizeAutoSms() {
        const agentName = await waitForAgentName();
        if (!agentName) {
            showNotAuthorizedMessage("Not authorized: Agent name not found");
            return false;
        }

        try {
            const response = await fetch("https://alphadev.space/Green/GreenAutoEmailV2/AutoEmailM/API/autoStatusSms.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: new URLSearchParams({
                    username: agentName
                }).toString()
            });

            const data = await response.json();
            if (Number(data?.status) === 1) return true;

            showNotAuthorizedMessage("Not authorized");
            return false;
        } catch (error) {
            console.error("AutoSMS authorization request failed:", error);
            showNotAuthorizedMessage("Not authorized");
            return false;
        }
    }

    async function initAutoSms() {
        const isAuthorized = await authorizeAutoSms();
        if (!isAuthorized) {
            return;
        }

        createWidget();
    }

    // Widget initialization
    if (document.readyState === "complete" || document.readyState === "interactive") {
        initAutoSms();
    } else {
        window.addEventListener('DOMContentLoaded', initAutoSms);
    }

})();
