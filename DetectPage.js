let elements = {
    playerName: document.querySelector(".player-title"),
    callTabName: document.querySelector('.page-holder .wrapper .connect span'),
    getSearchTabName: document.querySelector('.main-container')
};
function DetectPage (callback) {
    let intervalID = setInterval(() => {
        let app = document.querySelector('#app');
        if (app !== null && typeof app.innerText != 'undefined') {
            if (elements.playerName !== null) {
                Green.page = "Lead";
                clearInterval(intervalID);
                Green.sendEmailAndCall();
            } else if (elements.callTabName !== null) {
                localStorage.removeItem("userFTD");
                Green.page = "Call";
                clearInterval(intervalID);
                callTab();
            } else if (elements.getSearchTabName !== null) {
                Green.page = "Search";
                clearInterval(intervalID);
                SearchTab();
            }
        }
    }, 500);
}