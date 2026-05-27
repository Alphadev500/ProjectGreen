function setCallAsEnded () {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== "user") continue;

        let currentContent = localStorage.getItem(key);
        currentContent = JSON.parse(currentContent);

        localStorage.setItem("autoCallNextLead",
            JSON.stringify({
                closedUserId: currentContent.userId,
                createdAt: Date.now()
            })
        );

        localStorage.setItem("user",
            JSON.stringify({
                userId: currentContent.userId,
                status: "close",
                closedAt: Date.now()
            })
        );
    }
}

function userAnswered () {
    const status = document.querySelector('.status-call-start');
    const innerText = status ? status.innerText : "";

    if (innerText.toLowerCase().includes("picked up")) return true;

    return false;
}

function getProperTime (timeString)  {
    const parts = (timeString || "")
        .trim()
        .split(":")
        .map((part) => parseInt(part, 10))
        .filter((part) => !Number.isNaN(part));

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (parts.length === 3) {
        hours = parts[0];
        minutes = parts[1];
        seconds = parts[2];
    } else if (parts.length === 2) {
        minutes = parts[0];
        seconds = parts[1];
    } else if (parts.length === 1) {
        seconds = parts[0];
    }

    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

    return {hours, minutes, seconds, totalSeconds}
}

function getCallTabTimer () {
    const timer = document.querySelector('.timer');
    return timer ? timer.innerText : "";
}

function hengUpButton () {
    return document.querySelector('.el-button.el-button--danger');
}

function hengUp () {
    const button = hengUpButton();
    if (!button) return false;

    button.click();
    return true;
}

function closeLeadAfterHengUp () {
    if (Green.closeLeadAfterHengUpTimer) return;

    Green.closeLeadAfterHengUpTimer = setTimeout(() => {
        Green.closeLeadAfterHengUpTimer = null;

        if (localStorage.getItem('userFTD')) return;
        if (localStorage.getItem("user") == null) return;

        Green.onCall = false;
        setCallAsEnded();
    }, 50);
}

function actOnChangeRightShiftClickHengUp () {
    window.addEventListener("storage", function (event) {
        if (event.key != "hengUp") return;
        if (event.newValue == "true") {
            hengUp();
            console.log('in tab hengUp');
            localStorage.removeItem("hengUp");
        }
    });
}

function saveOnHengUp () {
    try {
        const button = hengUpButton();
        if (!button) return;
        if (button.dataset.greenHengUpBound === "true") return;

        button.dataset.greenHengUpBound = "true";
        button.addEventListener('click', () => {
            localStorage.setItem('OnCall', false);
            closeLeadAfterHengUp();
        });
    } catch (e) {
        //console.log(e);
    }
}

function callCanselDetect () {
    saveOnHengUp();
    let timeOnHold = getCallTabTimer();
    let properTime = getProperTime(timeOnHold);
    const hasTimer = timeOnHold.includes(":") && properTime.totalSeconds >= 0;

    if (hasTimer) {
        Green.onCall = true;
        Green.lastCallSeconds = properTime.totalSeconds;
    }

    if (localStorage.getItem("user") != null && Green.onCall) {
        if ((Green.lastCallSeconds || 0) >= 120) localStorage.setItem('userFTD', true);

        if (!hasTimer && Green.onCall == true) {
            Green.onCall = false;
            Green.autoHengupTriggered = false;
            if (!localStorage.getItem('userFTD')) setCallAsEnded();
        }

        const maxSeconds = Number(Green.getRandomIntervalNumber()) || 35;
        if (hasTimer && !userAnswered() && properTime.totalSeconds >= maxSeconds && !Green.autoHengupTriggered) {
            Green.autoHengupTriggered = hengUp();
        }

    }

    if (!hasTimer && !Green.onCall) {
        Green.autoHengupTriggered = false;
    }
}

function answer () {
    try {
        if (document.querySelector('.block-btn-call') !== null) {
            localStorage.removeItem("userFTD");
        }
        document.querySelector('.block-btn-call').querySelector('.el-button.el-button--success').click();
        localStorage.setItem('OnCall', true);
    } catch (e) {
        //console.log('nathing to do');
    }
}

function callTab ()  {
    actOnChangeRightShiftClickHengUp();
    setInterval(() => {
        callCanselDetect();
    }, 1000);

    setInterval(() => {
        const button = document.querySelector('.el-button.el-button--success span');
        if (button && button.innerHTML !== "Enable sound playback") answer();

    }, 1000);
}
