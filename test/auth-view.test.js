const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const ejs = require("ejs");

const signupViewPath = path.join(__dirname, "../views/signup.ejs");

function renderSignupView(data) {
    return ejs.renderFile(signupViewPath, {
        csrfToken: "test_csrf_token",
        error: null,
        activeForm: "signup",
        formData: {},
        ...data
    });
}

test("signup error view preserves non-sensitive signup input", async () => {
    const html = await renderSignupView({
        error: "Please enter a valid email address.",
        formData: {
            signupUsername: "Alice Dev",
            signupEmail: "alice@example.com"
        }
    });

    assert.match(html, /role="alert"/);
    assert.match(html, /name="SignUpUsername"[^>]*value="Alice Dev"/);
    assert.match(html, /name="SignUpEmail"[^>]*value="alice@example.com"/);
    assert.doesNotMatch(html, /name="SignUpPassword"[^>]*value=/);
});

test("login error view keeps login panel active and preserves email", async () => {
    const html = await renderSignupView({
        activeForm: "login",
        error: "Email or password is incorrect.",
        formData: {
            loginEmail: "alice@example.com"
        }
    });

    assert.match(html, /id="chk"[^>]*checked/);
    assert.match(html, /name="LoginEmail"[^>]*value="alice@example.com"/);
    assert.doesNotMatch(html, /name="LoginPassword"[^>]*value=/);
});
