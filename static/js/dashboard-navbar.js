document.addEventListener("DOMContentLoaded", () => {
    const dropdownButton = document.querySelector(".dashboard-navbar-dropbtn");
    const dropdown = document.getElementById("dashboard-navbar-myDropdown");
    const deleteAccountForm = document.querySelector(".dashboard-navbar-delete-account-form");

    if (dropdownButton && dropdown) {
        dropdownButton.addEventListener("click", (event) => {
            event.stopPropagation();
            dropdown.classList.toggle("dashboard-navbar-show");
        });

        dropdown.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        document.addEventListener("click", () => {
            dropdown.classList.remove("dashboard-navbar-show");
        });
    }

    if (deleteAccountForm) {
        deleteAccountForm.addEventListener("submit", (event) => {
            const confirmed = window.confirm("Confirm account deletion? This action cannot be undone.");

            if (!confirmed) {
                event.preventDefault();
            }
        });
    }
});
