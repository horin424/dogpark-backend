/** SHA-256(pin + ":" + salt) hex. Salt is the friend code (lowercased). */
export async function hashPin(pin: string, salt: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(`${pin}:${salt.toLowerCase()}`);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
