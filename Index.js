const Green = {
    autoSendEmailTempName: "new",
    sendEmail: true,
    userFTD: false,
    callCanselIntervals: [36, 37, 38],
    onCall: false,
    page: false,
    getRandomNumber : (from, to) => {
        return Math.random() * (from - to) + to;
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
            if (event.key === "Shift" && event.location === 2) {
                localStorage.removeItem("hengUp");
                localStorage.setItem('hengUp', true);
            }
        });
    },
    onAltCall: () => {
        document.addEventListener('keydown', function(event) {
            if (event.key === "Control" && event.location === 2) {
                document.querySelector('.table-row__image.call-img').click();
            }
        });
    },
    changeSendEmailStatus: () => {
        document.addEventListener('keydown', function(event) {
            if (event.key === "Alt" && event.location === 2) {
                localStorage.setItem('AutoEmails', true);
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
        Green.onAltCall();
        Green.onShiftHengUp();
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