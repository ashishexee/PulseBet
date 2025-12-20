import { ethers } from "ethers";

/**
 * A signer implementation that uses the MetaMask browser extension for signing.
 */
export class MetaMask {
    public provider: ethers.BrowserProvider;

    constructor() {
        if (typeof window === "undefined" || !window.ethereum) {
            throw new Error("MetaMask is not available");
        }
        this.provider = new ethers.BrowserProvider(window.ethereum);
    }

    async sign(owner: string, value: Uint8Array): Promise<string> {
        if (!window.ethereum) {
            throw new Error("MetaMask is not available");
        }

        // Explicitly type the result and check for undefined
        const accounts = (await window.ethereum.request({
            method: "eth_requestAccounts",
        })) as string[];

        if (!accounts || accounts.length === 0) {
            throw new Error("No MetaMask accounts connected");
        }

        const connected = accounts.find((acc) => acc.toLowerCase() === owner.toLowerCase());
        if (!connected) {
            throw new Error(`MetaMask is not connected with the requested owner: ${owner}`);
        }

        // Encode message as hex string
        const msgHex = `0x${this.uint8ArrayToHex(value)}`;

        try {
            const signature = (await window.ethereum.request({
                method: "personal_sign",
                params: [msgHex, owner],
            })) as string;

            if (!signature) {
                throw new Error("No signature returned");
            }
            return signature;
        } catch (err: any) {
            throw new Error(`MetaMask signature request failed: ${err?.message || err}`);
        }
    }

    async containsKey(owner: string): Promise<boolean> {
        if (!window.ethereum) return false;
        try {
            const accounts = await this.provider.send("eth_requestAccounts", []);
            return accounts.some((acc: string) => acc.toLowerCase() === owner.toLowerCase());
        } catch (e) {
            return false;
        }
    }

    /**
     * Returns the currently connected MetaMask account address.
     */
    async address(): Promise<string> {
        const signer = await this.provider.getSigner();
        const address = await signer.getAddress();
        return address;
    }

    private uint8ArrayToHex(bytes: Uint8Array): string {
        return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }
}
