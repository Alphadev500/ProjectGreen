function getUserId () {
    return document.querySelector('.table-content').querySelectorAll('.table-row')[2].querySelector('.table-row__value').innerText;
}
function saveUserId () {
    localStorage.setItem("user", JSON.stringify({
        userId: getUserId(),
        status: "onCall"
    }));
}
function removeUserId () {
    localStorage.removeItem("user");
}

function onRightAltCall () {
    console.log('keydown function');
    let lastShiftTime = 0;
    const DOUBLE_PRESS_DELAY = 300;

    document.addEventListener('keydown', function (event) {
        if (event.key === "Shift" && event.location === 2 && !event.repeat) {
            const now = Date.now();

            if (now - lastShiftTime < DOUBLE_PRESS_DELAY) {
                console.log("Right Shift double pressed!");

                const el = document.querySelector('.table-row__image.call-img');
                if (el) el.click();
            }

            lastShiftTime = now;
        }
    });
}

function actOnChange () {
    window.addEventListener("storage", function (event) {
        if (event.key !== "user") return;

        let currentUserID = getUserId();
        const content = JSON.parse(event.newValue);

        if (content.status == "close" && content.userId == currentUserID) {
            removeUserId();
            window.close();
        }
    })
}

function saveAndCloseLeedsPage () {
    onRightAltCall();
    actOnChange();
    saveUserId();
}
