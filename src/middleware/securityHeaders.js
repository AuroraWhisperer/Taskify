const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "style-src-attr 'none'",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
    "img-src 'self' data: https://*.googleusercontent.com",
    "connect-src 'self'"
].join("; ");

function securityHeaders(req, res, next) {
    res.setHeader("Content-Security-Policy", contentSecurityPolicy);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
}

module.exports = securityHeaders;
