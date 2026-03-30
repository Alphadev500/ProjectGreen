let DetectPageElements = {
    playerName: document.querySelector(".player-title"),
    callTabName: document.querySelector('.page-holder .wrapper .connect span'),
    getSearchTabName: document.querySelector('.main-container')
};
function DetectPage (callback) {
    let intervalID = setInterval(() => {
        let app = document.querySelector('#app');
        if (app !== null && typeof app.innerText != 'undefined') {
            if (DetectPageElements.playerName !== null) {
                Green.page = "Lead";
                clearInterval(intervalID);
                Green.sendEmailAndCall();
            } else if (DetectPageElements.callTabName !== null) {
                localStorage.removeItem("userFTD");
                Green.page = "Call";
                clearInterval(intervalID);
                callTab();
            } else if (DetectPageElements.getSearchTabName !== null) {
                Green.page = "Search";
                clearInterval(intervalID);
                SearchTab();
            }


            console.log('Page');
        }
    }, 500);
}