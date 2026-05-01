(function () {
    const CLEAR_DELAYS = [0, 50, 150, 300, 600, 1000, 1500, 2500, 4000, 6000, 8000];
    let userInteractedWithLogin = false;
    let userEditedLogin = false;

    function getLoginFields() {
        const form = document.querySelector('form[action="/login"][data-clear-on-load="true"]');

        if (!form) {
            return null;
        }

        return {
            form,
            fields: [
                form.querySelector('input[name="LoginEmail"]'),
                form.querySelector('input[name="LoginPassword"]')
            ].filter(Boolean)
        };
    }

    function clearSavedLoginFields() {
        const login = getLoginFields();

        if (!login || userEditedLogin) {
            return;
        }

        login.fields.forEach((field) => {
            if (!field) {
                return;
            }

            field.defaultValue = "";
            field.value = "";
        });
    }

    function bindLoginFieldGuards() {
        const login = getLoginFields();

        if (!login) {
            return;
        }

        login.fields.forEach((field) => {
            const enableField = () => {
                userInteractedWithLogin = true;
                field.removeAttribute("readonly");

                if (!userEditedLogin) {
                    field.defaultValue = "";
                    field.value = "";
                    window.setTimeout(clearSavedLoginFields, 0);
                    window.setTimeout(clearSavedLoginFields, 100);
                }
            };
            const markUserEdited = () => {
                if (userInteractedWithLogin) {
                    userEditedLogin = true;
                }
            };

            field.setAttribute("readonly", "readonly");
            field.addEventListener("pointerdown", enableField, { once: true });
            field.addEventListener("touchstart", enableField, { once: true });
            field.addEventListener("focus", enableField, { once: true });
            field.addEventListener("keydown", (event) => {
                enableField();

                if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                    markUserEdited();
                }
            }, { once: true, capture: true });
            field.addEventListener("beforeinput", (event) => {
                if (event.inputType !== "insertReplacementText") {
                    markUserEdited();
                }
            });
            field.addEventListener("paste", markUserEdited);
            field.addEventListener("drop", markUserEdited);
        });
    }

    function scheduleLoginFieldClearing() {
        CLEAR_DELAYS.forEach((delay) => {
            window.setTimeout(clearSavedLoginFields, delay);
        });
    }

    window.addEventListener("pageshow", clearSavedLoginFields);
    window.addEventListener("load", scheduleLoginFieldClearing);
    document.addEventListener("DOMContentLoaded", () => {
        bindLoginFieldGuards();
        scheduleLoginFieldClearing();
    });
}());
