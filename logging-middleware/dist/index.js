export async function Log(stack, level, pkg, message, meta) {
    const payload = {
        stack,
        level,
        package: pkg,
        message,
        meta,
        timestamp: new Date().toISOString(),
    };
    const serverUrl = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_TEST_SERVER_URL) ||
        (typeof window !== "undefined" ? window.__TEST_SERVER_URL : undefined);
    if (!serverUrl) {
        if (level === "error" || level === "warn")
            console.error("[LOG]", payload);
        else
            console.log("[LOG]", payload);
        return;
    }
    try {
        await fetch(serverUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }
    catch (err) {
        console.error("Failed to send log to test server", err);
        console.log("[LOG-local]", payload);
    }
}
