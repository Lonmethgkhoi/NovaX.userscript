// notify.js
function notify(message) {
    console.log("[Bypass Notify] " + message);
    if (typeof unsafeWindow !== "undefined") {
        unsafeWindow.alert("🔔 " + message);
    }
}
