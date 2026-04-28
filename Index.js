const Green = {
    autoSendEmailTempName: "new",
    sendEmail: true,
    userFTD: false,
    callCanselIntervals: [35],
    onCall: false,
    page: false,
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
        
                    display: none; /* 👈 FIXED */
                    opacity: 0;
                    pointer-events: none;
        
                    transition: 0.2s ease;
                    z-index: 999999;
                    color: white;
                    font-family: Arial, sans-serif;
                }
        
                #modMenuInjected.active {
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
                    <input type="text" id="autoEmailTempName" class="mod-input" placeholder="` + localStorage.getItem("autoEmailTempName") + `">
                </div>
                
                <button class="save-btn" id="saveSettings">Save</button>
            `;

            document.body.appendChild(menu);

            // ===== ELEMENTS =====
            const autoEmail = document.getElementById("autoEmail");
            const switchKeys = document.getElementById("switchKeys");
            const autoEmailTempName = document.getElementById("autoEmailTempName");
            const saveBtn = document.getElementById("saveSettings");

            // ===== LOAD FROM LOCALSTORAGE =====
            autoEmail.checked = localStorage.getItem("autoEmail") === "true";
            switchKeys.checked = localStorage.getItem("switchKeys") === "true";
            autoEmailTempName.value = localStorage.getItem("autoEmailTempName") || "";

            // ===== SAVE LOGIC =====
            saveBtn.addEventListener("click", () => {
                localStorage.setItem("autoEmail", autoEmail.checked);
                localStorage.setItem("switchKeys", switchKeys.checked);
                localStorage.setItem("autoEmailTempName", autoEmailTempName.value);

                console.log("Saved:", {
                    autoEmail: autoEmail.checked,
                    switchKeys: switchKeys.checked,
                    autoEmailTempName: autoEmailTempName.value
                });

                hideMenu();
            });

            // ===== SHOW MENU =====
            function showMenu() {
                menu.style.display = "block";

                requestAnimationFrame(() => {
                    menu.classList.add("active");
                });
            }

            // ===== HIDE MENU =====
            function hideMenu() {
                menu.style.opacity = "0";
                menu.style.pointerEvents = "none";

                setTimeout(() => {
                    menu.classList.remove("active");
                    menu.style.display = "none";
                }, 200);
            }

            // ===== TOGGLE MENU =====
            document.addEventListener("keydown", (e) => {
                if (e.ctrlKey && e.key.toLowerCase() === "m") {
                    if (menu.style.display === "block") {
                        hideMenu();
                    } else {
                        showMenu();
                    }
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
    playerName: (callback=null) => {
        Green.setTimeout(() => {
            if (callback) {
                // This is the call Icon on the man page of the lead
                document.querySelector('.table-row__image.call-img').addEventListener("click", callback);
            }
        });
    },
    onShiftHengUp: () => {
        document.addEventListener('keydown', function(event) {
            if (localStorage.getItem('switchKeys') == 'true') {
                if (event.key === "F9") {
                    localStorage.removeItem("hengUp");
                    localStorage.setItem('hengUp', true);
                }
            } else {
                if ((event.key === "Shift" && event.location === 2)) {
                    localStorage.removeItem("hengUp");
                    localStorage.setItem('hengUp', true);
                }
            }
        });
    },
    autoConfirmCallDialog: () => {
        console.log('autoConfirmCallDialog');
       Green.setTimeout(() => {
            document.querySelector('.el-button.el-button--success').click();
        }, 1500, 2000);
    },
    clickCallAndConfirm: () => {
        const callIcon = document.querySelector('.table-row__image.call-img');
        if (!callIcon) return;

        callIcon.click();
        console.log('clickCallAndConfirm');
       // Green.autoConfirmCallDialog();
    },
    bindCallImageConfirm: () => {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (target && target.closest && target.closest('.table-row__image.call-img')) {
                Green.autoConfirmCallDialog();
            }
        });
    },
    onAltCall: () => {
        document.addEventListener('keydown', function(event) {
            if (localStorage.getItem('switchKeys') == 'true') {
                if (event.key === "F8") {
                    Green.clickCallAndConfirm();
                }
            } else {
                if ((event.key === "Control" && event.location === 2)) {
                    Green.clickCallAndConfirm();
                }
            }
        });
    },
    changeSendEmailStatus: () => {
        document.addEventListener('keydown', function(event) {
            if (event.key === "Alt" && event.location === 2) {
                if (localStorage.getItem('AutoEmails') == 'true') {
                    localStorage.removeItem('AutoEmails');
                    localStorage.setItem('AutoEmails', false);
                } else {
                    localStorage.removeItem('AutoEmails');
                    localStorage.setItem('AutoEmails', true);
                }
            }
        });
    },
    initOnConfirm: () => {
        let intervalID = setInterval(() => {
            Green.playerName(() => {
                saveAndCloseLeedsPage();
                Green.setTimeout(() => {
                    sendEmail();
                }, 1000, 1500);
            });
            clearInterval(intervalID);
        }, 500);
    },
    sendEmailAndCall () {
        Green.setTimeout(() => {
            Green.initOnConfirm()
        }, 1000, 1500);
    },
    getRandomIntervalNumber: () => {
        return Green.callCanselIntervals[Math.floor(Math.random() * Green.callCanselIntervals.length)];
    },
    init: () => {
        Green.modManu();
        Green.onAltCall();
        Green.onShiftHengUp();
        Green.bindCallImageConfirm();
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
