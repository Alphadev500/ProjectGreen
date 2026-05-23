const Green = {
    autoSendEmailTempName: localStorage.getItem("autoEmailTempName") || "new",
    sendEmail: localStorage.getItem("AutoEmails") !== "false" ? true : false,
    autoCallLeads: localStorage.getItem("AutoCalling") !== "false" ? true : false,
    userFTD: false,
    callCanselIntervals: [Number(localStorage.getItem("autoHengupTimer")) || 35],
    onCall: false,
    page: false,
    callConfirmWatcherActive: false,
    autoCallReady: false,
    getRandomNumber : (from, to) => {
        return Math.random() * (from - to) + to;
    },
    modManu: () => {
        (function () {
            if (document.getElementById("modMenuInjected")) return;

            // ===== STYLE =====
            const style = document.createElement("style");
            style.innerHTML = `
                #modMenuInjected {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0.85);
                    width: 320px;
                    background: rgba(20, 20, 20, 0.95);
                    border-radius: 14px;
                    padding: 20px;
                    box-shadow: 0 0 30px rgba(0,0,0,0.7);
                    backdrop-filter: blur(10px);
                    display: none;
                    opacity: 0;
                    pointer-events: none;
                    transition: 0.2s ease;
                    z-index: 999999;
                    color: white;
                    font-family: Arial, sans-serif;
                }
        
                #modMenuInjected.active {
                    display: block;
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                    pointer-events: all;
                }
        
                #modMenuInjected h2 {
                    text-align: center;
                    margin-top: 0;
                }
        
                .mod-option {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 12px 0;
                }
        
                .mod-input {
                    width: 100%;
                    padding: 8px;
                    border-radius: 8px;
                    border: none;
                    background: #222;
                    color: white;
                    margin-top: 5px;
                }
        
                .save-btn {
                    width: 100%;
                    padding: 10px;
                    margin-top: 15px;
                    border: none;
                    border-radius: 10px;
                    background: #4CAF50;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                }
        
                .save-btn:hover {
                    background: #45a049;
                }
            `;
            document.head.appendChild(style);

            // ===== MENU =====
            const menu = document.createElement("div");
            menu.id = "modMenuInjected";

            menu.innerHTML = `
                <h2>⚙ Mod Menu</h2>
        
                <div class="mod-option">
                    <span>Auto Emails</span>
                    <input type="checkbox" id="autoEmail">
                </div>

                <div class="mod-option">
                    <span>Auto Calling</span>
                    <input type="checkbox" id="autoCalling">
                </div>
        
                <div class="mod-option">
                    <span>Switch Keys (F8/F9)</span>
                    <input type="checkbox" id="switchKeys">
                </div>
        
                <div class="mod-option" style="flex-direction: column; align-items: flex-start;">
                    <span>Email Template Name</span>
                    <input type="text" id="autoEmailTempName" class="mod-input" placeholder="Enter name...">
                </div>

                <div class="mod-option" style="flex-direction: column; align-items: flex-start;">
                    <span>Auto Hengup Timer</span>
                    <input type="number" id="autoHengupTimer" class="mod-input" min="1" placeholder="35">
                </div>
        
                <button class="save-btn" id="saveSettings">Save</button>
            `;

            document.body.appendChild(menu);

            // ===== ELEMENTS =====
            const autoEmail = document.getElementById("autoEmail");
            const autoCalling = document.getElementById("autoCalling");
            const switchKeys = document.getElementById("switchKeys");
            const autoEmailTempName = document.getElementById("autoEmailTempName");
            const autoHengupTimer = document.getElementById("autoHengupTimer");
            const saveBtn = document.getElementById("saveSettings");

            // ===== LOAD FROM LOCALSTORAGE =====
            autoEmail.checked = localStorage.getItem("AutoEmails") !== "false";
            autoCalling.checked = localStorage.getItem("AutoCalling") !== "false";
            switchKeys.checked = localStorage.getItem("switchKeys") === "true";
            autoEmailTempName.value = localStorage.getItem("autoEmailTempName") || "";
            autoHengupTimer.value = localStorage.getItem("autoHengupTimer") || "35";

            // ===== SAVE LOGIC =====
            saveBtn.addEventListener("click", () => {
                localStorage.setItem("autoEmail", autoEmail.checked);
                localStorage.setItem("AutoEmails", autoEmail.checked);
                localStorage.setItem("AutoCalling", autoCalling.checked);
                localStorage.setItem("switchKeys", switchKeys.checked);
                localStorage.setItem("autoEmailTempName", autoEmailTempName.value);
                localStorage.setItem("autoHengupTimer", autoHengupTimer.value || "35");
                Green.callCanselIntervals = [Number(autoHengupTimer.value) || 35];
                Green.sendEmail = autoEmail.checked;
                Green.setAutoCalling(autoCalling.checked);

                menu.classList.remove("active");
            });

            // ===== TOGGLE MENU =====
            document.addEventListener("keydown", (e) => {
                if (e.ctrlKey && e.key.toLowerCase() === "m") {
                    menu.classList.toggle("active");
                }
            });

        })();
    },
    setTimeout:  (callback, from=2000, to=2900) => {
        if (to == false) {
            setTimeout(callback, from);
        } else {
            setTimeout(callback, Green.getRandomNumber(from, to));
        }
    },
    ifElementExists: (element, callback=null, timeout=30000, interval=500) => {
        const startedAt = Date.now();

        const intervalID = setInterval(() => {
            const foundElement = typeof element === 'string' ? document.querySelector(element) : element;

            if (foundElement) {
                clearInterval(intervalID);

                if (callback) {
                    callback(foundElement);
                }
            }

            if (Date.now() - startedAt >= timeout) {
                clearInterval(intervalID);
            }
        }, interval);

        return intervalID;
    },
    renderAutomationHaze: () => {
        const oldHaze = document.getElementById("greenAutomationHaze");
        if (oldHaze) oldHaze.remove();

        const targets = [document.documentElement, document.body].filter(Boolean);
        if (!targets.length) return;

        const color = Green.autoCallLeads ? "46, 204, 113" : "231, 76, 60";

        targets.forEach((target) => {
            target.style.transition = "box-shadow 0.18s ease, outline-color 0.18s ease";
            target.style.outline = `4px solid rgba(${color}, 0.18)`;
            target.style.outlineOffset = "-4px";
            target.style.boxShadow = `inset 0 0 24px 7px rgba(${color}, 0.18)`;
        });
    },
    setAutoCalling: (enabled) => {
        Green.autoCallLeads = enabled;
        localStorage.setItem("AutoCalling", enabled);

        const autoCalling = document.getElementById("autoCalling");
        if (autoCalling) autoCalling.checked = enabled;

        if (!enabled) {
            if (Green.autoCallNextLeadTimer) clearTimeout(Green.autoCallNextLeadTimer);
            localStorage.removeItem("autoCallNextLead");
            localStorage.removeItem("autoCallNextLeadClaim");
        } else {
            Green.scheduleAutoCallNextLead();
        }

        Green.renderAutomationHaze();
    },
    bindStopToggle: () => {
        document.addEventListener("keydown", (event) => {
            if (event.key !== "F6") return;

            event.preventDefault();
            Green.setAutoCalling(!Green.autoCallLeads);
        });
    },
    callIconClick: (callback=null) => {
        Green.ifElementExists('.table-row__image.call-img', (callButton) => {
            callButton.addEventListener("click", callback);
            Green.autoCallReady = true;

            if (Green.scheduleAutoCallNextLead) {
                Green.scheduleAutoCallNextLead();
            }
        }, 30000, 100);
    },
    clickActivityTab: (callback=null) => {
        let completed = false;
        const done = () => {
            if (completed) return;
            completed = true;
            if (callback) callback();
        };

        Green.ifElementExists('.main-tabsNav .tab-item.purple', (tab) => {
            if ((tab.innerText || "").trim() === "Activity") {
                tab.click();
                done();
                return;
            }

            const activityTab = Array.from(document.querySelectorAll('.main-tabsNav .tab-item'))
                .find((item) => (item.innerText || "").trim() === "Activity");

            if (activityTab) {
                activityTab.click();
                done();
            }
        }, 10000, 100);

        Green.setTimeout(done, 1200, false);
    },
    onShiftHengUp: () => {
        document.addEventListener('keydown', function(event) {
            if (localStorage.getItem("switchKeys") == 'true') {
                if (event.key === "F9") {
                    localStorage.removeItem("hengUp");
                    localStorage.setItem('hengUp', true);
                }
            } else{
                if (event.key === "Shift" && event.location === 2) {
                    localStorage.removeItem("hengUp");
                    localStorage.setItem('hengUp', true);
                }
            }

        });
    },
    clickCallAndConfirm: () => {
        const callButton = document.querySelector('.table-row__image.call-img');
        if (!callButton) return;

        Green.ifElementExists('.table-row__image.call-img', () => {
            callButton.click();
        });
    },
    getCurrentLeadId: () => {
        try {
            return getUserId();
        } catch (e) {
            return null;
        }
    },
    isActiveTab: () => {
        return document.visibilityState === 'visible' || document.hasFocus();
    },
    scheduleAutoCallNextLead: () => {
        if (!Green.autoCallLeads) return false;
        if (Green.autoCallNextLeadTimer) clearTimeout(Green.autoCallNextLeadTimer);

        let tries = 0;
        const tryCall = () => {
            tries++;

            if (Green.tryAutoCallNextLead(localStorage.getItem("autoCallNextLead"))) return;
            if (tries >= 40) return;

            Green.autoCallNextLeadTimer = setTimeout(tryCall, 100);
        };

        Green.autoCallNextLeadTimer = setTimeout(tryCall, 25);
    },
    tryAutoCallNextLead: (signal) => {
        if (window.parent && window.parent !== window) return false;
        if (!Green.autoCallLeads) return false;
        if (!Green.autoCallReady) return false;

        let content = signal;

        if (typeof content === 'string') {
            try {
                content = JSON.parse(content);
            } catch (e) {
                return false;
            }
        }

        if (!content || !content.createdAt) return false;
        if (Date.now() - content.createdAt > 120000) return false;

        const currentLeadId = Green.getCurrentLeadId();
        if (!currentLeadId || currentLeadId == content.closedUserId) return false;

        const claim = JSON.parse(localStorage.getItem("autoCallNextLeadClaim") || "null");
        if (claim) {
            if (Date.now() - claim.createdAt >= 30000 || claim.userId != currentLeadId) {
                localStorage.removeItem("autoCallNextLeadClaim");
            } else {
                return false;
            }
        }

        localStorage.setItem("autoCallNextLeadClaim", JSON.stringify({
            userId: currentLeadId,
            createdAt: Date.now()
        }));

        Green.ifElementExists('.table-row__image.call-img', (callButton) => {
            const latestClaim = JSON.parse(localStorage.getItem("autoCallNextLeadClaim") || "null");
            if (!latestClaim || latestClaim.userId != currentLeadId) return;

            callButton.click();
            localStorage.removeItem("autoCallNextLeadClaim");
            localStorage.removeItem("autoCallNextLead");
        });

        return true;
    },
    bindAutoCallNextLead: () => {
        const tryPendingAutoCall = () => {
            Green.scheduleAutoCallNextLead();
        };

        window.addEventListener("storage", function (event) {
            if (event.key !== "autoCallNextLead") return;
            Green.scheduleAutoCallNextLead();
        });

        window.addEventListener("focus", tryPendingAutoCall);
        window.addEventListener("pageshow", tryPendingAutoCall);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                tryPendingAutoCall();
            }
        });

        tryPendingAutoCall();
    },
    getLeadQueue: () => {
        try {
            const queue = JSON.parse(localStorage.getItem("greenLeadQueue") || "null");
            if (!queue || !Array.isArray(queue.hrefs)) return null;

            queue.index = Number(queue.index) || 0;
            queue.hrefs = queue.hrefs.filter((href) => typeof href === "string" && href.length > 0);

            if (!queue.hrefs.length) return null;

            return queue;
        } catch (e) {
            localStorage.removeItem("greenLeadQueue");
            return null;
        }
    },
    saveLeadQueue: (queue) => {
        localStorage.setItem("greenLeadQueue", JSON.stringify(queue));
    },
    resolveLeadHref: (href) => {
        if (!href) return null;

        const link = document.createElement("a");
        link.href = href;

        return link.href;
    },
    prefetchLeadHref: (href) => {
        const resolvedHref = Green.resolveLeadHref(href);
        if (!resolvedHref) return false;

        try {
            document.querySelectorAll('link[data-green-lead-prefetch="true"]').forEach((link) => link.remove());

            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = resolvedHref;
            link.setAttribute("data-green-lead-prefetch", "true");
            document.head.appendChild(link);

            return true;
        } catch (e) {
            return false;
        }
    },
    prefetchQueuedLead: (offset=1) => {
        const queue = Green.getLeadQueue();
        if (!queue) return false;

        return Green.prefetchLeadHref(queue.hrefs[queue.index + offset]);
    },
    startLeadQueue: (hrefs) => {
        if (!Array.isArray(hrefs) || !hrefs.length) return false;

        const resolvedHrefs = hrefs.map((href) => Green.resolveLeadHref(href)).filter(Boolean);
        if (!resolvedHrefs.length) return false;

        const queue = {
            hrefs: resolvedHrefs,
            index: 0,
            createdAt: Date.now()
        };

        Green.saveLeadQueue(queue);
        Green.prefetchQueuedLead(1);
        return Green.openLeadIframeRunner(queue.hrefs);
    },
    openLeadIframeRunner: (hrefs) => {
        const runner = window.open("", "green-auto-lead");
        if (!runner) return false;

        const runnerHtml = `
            <!doctype html>
            <html>
            <head>
                <title>Green Auto Lead Runner</title>
                <style>
                    html, body {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        overflow: hidden;
                        background: #111;
                    }

                    iframe {
                        position: fixed;
                        inset: 0;
                        width: 100%;
                        height: 100%;
                        border: 0;
                        background: white;
                    }

                    iframe.green-hidden-lead {
                        opacity: 0;
                        pointer-events: none;
                        z-index: 1;
                    }

                    iframe.green-visible-lead {
                        opacity: 1;
                        pointer-events: auto;
                        z-index: 2;
                    }
                </style>
            </head>
            <body>
                <script>
                    (function () {
                        const hrefs = ${JSON.stringify(hrefs)};
                        let index = 0;
                        let currentFrame = null;
                        let nextFrame = null;
                        let callStartedFor = null;

                        window.GreenIframeRunner = true;

                        function makeFrame(src, visible) {
                            const frame = document.createElement("iframe");
                            frame.src = src;
                            frame.className = visible ? "green-visible-lead" : "green-hidden-lead";
                            frame.addEventListener("load", function () {
                                if (frame === currentFrame) {
                                    startCallingWhenReady(frame);
                                }
                            });
                            document.body.appendChild(frame);
                            return frame;
                        }

                        function markFrameReadyWhenLeadUiLoads(frame) {
                            frame.dataset.greenReady = "false";

                            waitForFrameElement(frame, ".table-row__image.call-img", function () {
                                frame.dataset.greenReady = "true";
                            }, 60000, 250);
                        }

                        function waitForFrameElement(frame, selector, callback, timeout = 30000, interval = 250) {
                            const startedAt = Date.now();
                            const timer = setInterval(function () {
                                let element = null;

                                try {
                                    element = frame.contentDocument && frame.contentDocument.querySelector(selector);
                                } catch (e) {
                                    clearInterval(timer);
                                    return;
                                }

                                if (element) {
                                    clearInterval(timer);
                                    callback(element);
                                    return;
                                }

                                if (Date.now() - startedAt >= timeout) {
                                    clearInterval(timer);
                                }
                            }, interval);
                        }

                        function clickFrameActivityTab(frame, callback) {
                            let completed = false;
                            const done = function () {
                                if (completed) return;
                                completed = true;
                                if (callback) callback();
                            };

                            waitForFrameElement(frame, ".main-tabsNav .tab-item", function () {
                                try {
                                    const activityTab = Array.from(frame.contentDocument.querySelectorAll(".main-tabsNav .tab-item"))
                                        .find(function (item) {
                                            return (item.innerText || "").trim() === "Activity";
                                        });

                                    if (activityTab) {
                                        activityTab.click();
                                    }
                                } catch (e) {}

                                done();
                            }, 10000, 100);

                            setTimeout(done, 1500);
                        }

                        function startCallingWhenReady(frame) {
                            const src = frame.src;
                            if (callStartedFor === src) return;
                            callStartedFor = src;

                            setTimeout(function () {
                                clickFrameActivityTab(frame, function () {
                                    try {
                                        if (
                                            frame.contentWindow.Green &&
                                            frame.contentWindow.Green.sendEmailAndCall &&
                                            !frame.contentWindow.Green.autoCallReady
                                        ) {
                                            frame.contentWindow.Green.sendEmailAndCall();
                                        }
                                    } catch (e) {}

                                    waitForFrameElement(frame, ".table-row__image.call-img", function (callButton) {
                                        setTimeout(function () {
                                            callButton.click();
                                        }, 500);
                                    });
                                });
                            }, 500);
                        }

                        function preloadNext() {
                            if (nextFrame) nextFrame.remove();
                            nextFrame = null;

                            const nextHref = hrefs[index + 1];
                            if (!nextHref) return;

                            nextFrame = makeFrame(nextHref, false);
                            markFrameReadyWhenLeadUiLoads(nextFrame);
                        }

                        function showCurrentFrame() {
                            currentFrame = makeFrame(hrefs[index], true);
                            preloadNext();
                        }

                        function goToNextLead() {
                            if (!nextFrame) return;

                            if (nextFrame.dataset.greenReady !== "true") {
                                if (nextFrame.dataset.greenWaitingToSwap === "true") return;
                                nextFrame.dataset.greenWaitingToSwap = "true";

                                nextFrame.addEventListener("load", function () {
                                    markFrameReadyWhenLeadUiLoads(nextFrame);
                                }, {once: true});

                                waitForFrameElement(nextFrame, ".table-row__image.call-img", function () {
                                    nextFrame.dataset.greenReady = "true";
                                    nextFrame.dataset.greenWaitingToSwap = "false";
                                    goToNextLead();
                                }, 60000, 250);
                                return;
                            }

                            if (currentFrame) currentFrame.remove();
                            index++;
                            localStorage.setItem("greenLeadQueue", JSON.stringify({
                                hrefs: hrefs,
                                index: index,
                                createdAt: Date.now()
                            }));

                            currentFrame = nextFrame;
                            nextFrame = null;
                            callStartedFor = null;
                            currentFrame.className = "green-visible-lead";
                            startCallingWhenReady(currentFrame);
                            preloadNext();
                        }

                        window.addEventListener("storage", function (event) {
                            if (event.key !== "user" || !event.newValue) return;

                            try {
                                const content = JSON.parse(event.newValue);
                                if (content.status === "close") {
                                    goToNextLead();
                                }
                            } catch (e) {}
                        });

                        window.addEventListener("message", function (event) {
                            if (!event.data || event.data.type !== "greenLeadClosed") return;
                            goToNextLead();
                        });

                        localStorage.setItem("greenLeadQueue", JSON.stringify({
                            hrefs: hrefs,
                            index: index,
                            createdAt: Date.now()
                        }));

                        showCurrentFrame();
                    })();
                <\/script>
            </body>
            </html>
        `;

        runner.document.open();
        runner.document.write(runnerHtml);
        runner.document.close();
        runner.focus();

        return true;
    },
    openNextLeadFromPage: () => {
        const nextButton = document.querySelector('button.collapse-next, .collapse-next');
        if (!nextButton) return false;

        const previousLeadId = Green.getCurrentLeadId();
        nextButton.click();
        Green.autoCallReady = false;

        let tries = 0;
        const waitForNextLead = setInterval(() => {
            tries++;

            const currentLeadId = Green.getCurrentLeadId();
            if (currentLeadId && currentLeadId != previousLeadId) {
                clearInterval(waitForNextLead);
                Green.sendEmailAndCall();
                return;
            }

            if (tries >= 60) {
                clearInterval(waitForNextLead);
            }
        }, 500);

        return true;
    },
    openNextQueuedLead: () => {
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage({type: "greenLeadClosed"}, "*");
                return true;
            } catch (e) {}
        }

        const queue = Green.getLeadQueue();
        if (!queue) return Green.openNextLeadFromPage();

        const nextIndex = queue.index + 1;
        const nextHref = Green.resolveLeadHref(queue.hrefs[nextIndex]);

        if (!nextHref) {
            localStorage.removeItem("greenLeadQueue");
            return Green.openNextLeadFromPage();
        }

        queue.index = nextIndex;
        Green.saveLeadQueue(queue);
        Green.prefetchQueuedLead(1);

        Green.setTimeout(() => {
            window.location.assign(nextHref);
        }, 10, false);

        return true;
    },
    onAltCall: () => {
        document.addEventListener('keydown', function(event) {
            if (localStorage.getItem("switchKeys") == 'true') {
                if (event.key === "F8") {
                    Green.clickCallAndConfirm();
                }
            } else {
                if (event.key === "Control" && event.location === 2) {
                    Green.clickCallAndConfirm();
                }
            }
        });
    },
    changeSendEmailStatus: () => {},
    initOnConfirm: () => {
        //let intervalID = setInterval(() => {
            Green.callIconClick(() => {
                let talk = document.querySelectorAll('.table-content')[2].querySelectorAll('.table-row')[6].querySelector('.value-input-text').innerText;

                if (talk == 'Yes') {
                    Green.ifElementExists('.el-button.el-button--danger', () => {
                        document.querySelector('.el-button.el-button--danger').click();
                    });

                    // Green.ifElementExists('.el-button.el-button--success.mt-4', () => {
                    //     document.querySelector('.el-button.el-button--success.mt-4').click();
                    // });
                } else {
                    // Green.ifElementExists('.el-button.el-button--success.mt-4', () => {
                    //     document.querySelector('.el-button.el-button--success.mt-4').click();
                    // });
                }

                saveAndCloseLeedsPage();
                if (Green.sendEmail == true) {
                    Green.setTimeout(() => {
                        sendEmail();
                    }, 1000, 1500);
                }
            });
            //clearInterval(intervalID);
        //}, 500);
    },
    sendEmailAndCall () {
        Green.clickActivityTab(() => {
            Green.initOnConfirm();
        });
    },
    getRandomIntervalNumber: () => {
        return Green.callCanselIntervals[Math.floor(Math.random() * Green.callCanselIntervals.length)];
    },
    init: () => {
        Green.modManu();
        Green.bindStopToggle();
        Green.renderAutomationHaze();
        Green.onAltCall();
        Green.onShiftHengUp();
        Green.bindAutoCallNextLead();
        //Green.bindCallImageConfirm();
        DetectPage();
    },
};

Green.init();


// clicks: {
//     phoneIcon: () => {
//         document.querySelector('.table-row__image.call-img').click();
//     },
//     refusedCall: (callback) => {
//         try {
//             document.querySelector('.el-button.el-button--danger').click();
//         } catch (e) {
//             console.log('ref null');
//         }
//         callback();
//     },
//},
