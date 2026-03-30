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
    document.addEventListener('keydown', function(event) {
        if (event.key === "Alt" && event.location === 2) {
            document.querySelector('.table-row__image.call-img').click();
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
