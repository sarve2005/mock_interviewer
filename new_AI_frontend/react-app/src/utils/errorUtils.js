/**
 * Maps raw error objects (Firebase, Axios, DOMException) to user-friendly messages.
 * @param {Error|Object|string} error - The error object caught in try/catch blocks.
 * @returns {string} A sanitized, user-friendly error message.
 */
export function getFriendlyErrorMessage(error) {
    if (!error) return "An unexpected error occurred.";

    // 1. Handle String errors
    if (typeof error === "string") return error;

    const message = error.message || "";
    const code = error.code || ""; // Firebase errors often have a 'code' property

    // 2. Firebase Auth Errors
    if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        return "Invalid email or password.";
    }
    if (code === "auth/email-already-in-use") {
        return "Email is already registered. Please login instead.";
    }
    if (code === "auth/weak-password") {
        return "Password must be at least 6 characters.";
    }
    if (code === "auth/too-many-requests") {
        return "Too many failed login attempts. Please try again later.";
    }
    if (code === "auth/network-request-failed") {
        return "Network error. Please check your internet connection.";
    }

    // 3. Network / Axios Errors
    if (message === "Network Error" || code === "ERR_NETWORK") {
        return "Unable to connect to the server. Please check your internet connection.";
    }
    if (error.response) {
        // server responded with a status code usually 4xx or 5xx
        const status = error.response.status;
        if (status === 404) return "Requested resource not found.";
        if (status === 401 || status === 403) return "You are not authorized to perform this action.";
        if (status >= 500) return "A server error occurred. Please try again later.";

        // Sometimes the backend sends a specific detail message we might want to show if it's safe
        // But for strict security, we might want to ignore it. 
        // Strategy: prefer generic, but if we need backend-specific logic, we'd add it here.
        // For now, sticking to generic status-based messages.
    }

    // 4. Media Device Errors (Microphone)
    if (error.name === "NotAllowedError" || message.includes("permission")) {
        return "Microphone access denied. Please allow microphone permissions in your browser.";
    }
    if (error.name === "NotFoundError" || message.includes("device not found")) {
        return "No microphone found. Please connect a microphone.";
    }
    if (error.name === "NotReadableError") {
        return "Microphone is in use by another application or not responding.";
    }

    // 5. Fallback
    // console.warn("Unhandled error type:", error); // Optional: keep for dev debugging if needed, but remove for stricter prod cleanup
    return "An unexpected error occurred. Please try again.";
}
