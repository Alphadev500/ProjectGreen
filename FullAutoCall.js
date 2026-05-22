const Green = {
    autoSendEmailTempName: localStorage.getItem("autoEmailTempName") || "new",
    sendEmail: localStorage.getItem("AutoEmails") !== "false" ? true : false,
    userFTD: false,
    callCanselIntervals: [Number(localStorage.getItem("autoHengupTimer")) || 35],
    onCall: false,
    page: false,
    callConfirmWatcherActive: false,
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
            const switchKeys = document.getElementById("switchKeys");
            const autoEmailTempName = document.getElementById("autoEmailTempName");
            const autoHengupTimer = document.getElementById("autoHengupTimer");
            const saveBtn = document.getElementById("saveSettings");

            // ===== LOAD FROM LOCALSTORAGE =====
            autoEmail.checked = localStorage.getItem("AutoEmails") !== "false";
            switchKeys.checked = localStorage.getItem("switchKeys") === "true";
            autoEmailTempName.value = localStorage.getItem("autoEmailTempName") || "";
            autoHengupTimer.value = localStorage.getItem("autoHengupTimer") || "35";

            // ===== SAVE LOGIC =====
            saveBtn.addEventListener("click", () => {
                localStorage.setItem("autoEmail", autoEmail.checked);
                localStorage.setItem("AutoEmails", autoEmail.checked);
                localStorage.setItem("switchKeys", switchKeys.checked);
                localStorage.setItem("autoEmailTempName", autoEmailTempName.value);
                localStorage.setItem("autoHengupTimer", autoHengupTimer.value || "35");
                Green.callCanselIntervals = [Number(autoHengupTimer.value) || 35];
                Green.sendEmail = autoEmail.checked;

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
    callIconClick: (callback=null) => {
        Green.ifElementExists('.table-row__image.call-img', () => {
            document.querySelector('.table-row__image.call-img').addEventListener("click", callback);
        });
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
    tryAutoCallNextLead: (signal) => {
        if (!Green.isActiveTab()) return false;

        let content = signal;

        if (typeof content === 'string') {
            try {
                content = JSON.parse(content);
            } catch (e) {
                return false;
            }
        }

        if (!content || !content.createdAt) return false;
        if (Date.now() - content.createdAt > 30000) return false;

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
            localStorage.removeItem("autoCallNextLead");
        });

        return true;
    },
    bindAutoCallNextLead: () => {
        const tryPendingAutoCall = () => {
            Green.tryAutoCallNextLead(localStorage.getItem("autoCallNextLead"));
        };

        window.addEventListener("storage", function (event) {
            if (event.key !== "autoCallNextLead") return;
            Green.tryAutoCallNextLead(event.newValue);
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
    prefetchLeadHref: (href) => {
        if (!href) return false;

        try {
            document.querySelectorAll('link[data-green-lead-prefetch="true"]').forEach((link) => link.remove());

            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = href;
            link.setAttribute("data-green-lead-prefetch", "true");
            document.head.appendChild(link);

            fetch(href, {
                credentials: "include",
                cache: "force-cache"
            }).catch(() => {});

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

        const queue = {
            hrefs: hrefs,
            index: 0,
            createdAt: Date.now()
        };

        Green.saveLeadQueue(queue);
        Green.prefetchQueuedLead(1);
        window.open(queue.hrefs[0], "green-auto-lead");

        return true;
    },
    openNextQueuedLead: () => {
        const queue = Green.getLeadQueue();
        if (!queue) return false;

        const nextIndex = queue.index + 1;
        const nextHref = queue.hrefs[nextIndex];

        if (!nextHref) {
            localStorage.removeItem("greenLeadQueue");
            return false;
        }

        queue.index = nextIndex;
        Green.saveLeadQueue(queue);
        Green.prefetchQueuedLead(1);
        window.location.href = nextHref;

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
        Green.setTimeout(() => {
            Green.initOnConfirm();
        }, 1000, 1500);
    },
    getRandomIntervalNumber: () => {
        return Green.callCanselIntervals[Math.floor(Math.random() * Green.callCanselIntervals.length)];
    },
    init: () => {
        Green.modManu();
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
