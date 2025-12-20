import { Wallet, HDNodeWallet } from "ethers";

/**
 * A signer implementation that uses a local ethers.Wallet (PrivateKey) for signing.
 * Replaces MetaMask to avoid browser extension issues/hanging.
 */
export class LocalSigner {
    private wallet: Wallet | HDNodeWallet;

    constructor(privateKeyOrMnemonic: string) {
        if (privateKeyOrMnemonic.includes(" ")) {
            this.wallet = Wallet.fromPhrase(privateKeyOrMnemonic);
        } else {
            this.wallet = new Wallet(privateKeyOrMnemonic);
        }
    }

    async address(): Promise<string> {
        return this.wallet.address;
    }

    async sign(owner: string, value: Uint8Array): Promise<string> {
        if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new Error(`Signer address ${this.wallet.address} does not match requested owner ${owner}`);
        }
        // ethers.signMessage automatically adds the Ethereum prefix, matching MetaMask's personal_sign behavior
        return await this.wallet.signMessage(value);
    }
}
