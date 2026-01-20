import { Wallet, HDNodeWallet } from "ethers";

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
        return await this.wallet.signMessage(value);
    }
}
