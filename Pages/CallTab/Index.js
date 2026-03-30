function setCallAsEnded () {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== "user") continue;

        let currentContent = localStorage.getItem(key);
        currentContent = JSON.parse(currentContent);

        localStorage.setItem("user",
            JSON.stringify({
                userId: currentContent.userId,
                status: "close"
            })
        );
    }
}

function userAnswered () {
    let innerText = document.querySelector('.status-call-start').innerText;

    if (innerText == "The customer picked up the phone.") return true;

    return false;
}

function getProperTime (timeString)  {
    const parts = timeString.split(":");

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);

    return {hours, minutes, seconds}
}

function getCallTabTimer () {
    return document.querySelector('.timer').innerText;
}

function hengUpButton () {
    return document.querySelector('.el-button.el-button--danger');
}

function hengUp () {
    hengUpButton().click();
}

function saveOnHengUp () {
    hengUpButton().addEventListener('click', () => {
        localStorage.setItem('OnCall', false);
    });
}

function callCanselDetect () {
    saveOnHengUp();
    let timeOnHold = getCallTabTimer();
    let properTime = getProperTime(timeOnHold);
    if (timeOnHold.trim().length != 0) {
        Green.onCall = true;
    }

    if (localStorage.getItem("user") != null && Green.onCall) {
        if (properTime.minutes >= 2) localStorage.setItem('userFTD', true);

        if (timeOnHold == '' && localStorage.getItem('userFTD') != true  && Green.onCall == true) {
            Green.onCall = false;
            setCallAsEnded();
        }

        if (!userAnswered() && properTime.seconds === Green.getRandomIntervalNumber()) hengUp();

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
        console.log('nathing to do');
    }
}

function callTab ()  {
    setInterval(() => {
        callCanselDetect();
    }, 1000);

    setInterval(() => {
        let buttons = document.querySelector('.el-button.el-button--success span').innerHTML;
        if (buttons.innerHTML !== "Enable sound playback") answer();

    }, 1000);
}