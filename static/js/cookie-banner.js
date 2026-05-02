(function () {
    const STORAGE_KEY = "taskify_cookie_consent";
    const ACCEPTED = "accepted";
    const REJECTED = "rejected";

    const banner = document.getElementById("cookieBanner");
    const acceptButton = document.getElementById("cookieAcceptBtn");
    const rejectButton = document.getElementById("cookieRejectBtn");

    if (!banner || !acceptButton || !rejectButton) {
        return;
    }

    const currentChoice = localStorage.getItem(STORAGE_KEY);
    if (currentChoice === ACCEPTED || currentChoice === REJECTED) {
        return;
    }

    banner.classList.add("is-visible");

    function saveChoice(value) {
        localStorage.setItem(STORAGE_KEY, value);
        banner.classList.remove("is-visible");
    }

    acceptButton.addEventListener("click", function () {
        saveChoice(ACCEPTED);
    });

    rejectButton.addEventListener("click", function () {
        saveChoice(REJECTED);
    });
})();
