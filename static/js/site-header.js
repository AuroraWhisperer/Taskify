(function () {
    var header = document.querySelector("header.site-header");
    if (!header) {
        return;
    }

    var scrolledClass = "is-scrolled";

    function syncShadow() {
        if (window.scrollY > 6) {
            header.classList.add(scrolledClass);
        } else {
            header.classList.remove(scrolledClass);
        }
    }

    syncShadow();
    window.addEventListener("scroll", syncShadow, { passive: true });
})();
