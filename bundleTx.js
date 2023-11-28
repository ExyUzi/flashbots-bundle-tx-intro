const { Wallet, ethers } = require('ethers');
const { FlashbotsBundleProvider, FlashbotsBundleResolution } = require('@flashbots/ethers-provider-bundle');

async function main() {
    const provider = new ethers.providers.JsonRpcProvider("https://eth-goerli.g.alchemy.com/v2/xxxxxx");
    // Set up a random authSigner
    const authSigner = Wallet.createRandom()
    // Your private key
    const wallet = new Wallet("", provider);
    // Setup the flashbots provider (here on goerli)
    const flashbotsProvider = await FlashbotsBundleProvider.create(provider, authSigner, "https://relay-goerli.flashbots.net", 'goerli');


    // Get the current block number
    const blockNumber = await provider.getBlockNumber();
    // create our Tx Bundle
    const bundle = [
        {
            transaction: {
                chainId: 5,
                to: "WalletA",
                value: ethers.utils.parseEther('2'),
                type: 2,
                maxFeePerGas: ethers.utils.parseUnits('18', 'gwei'),
                maxPriorityFeePerGas: ethers.utils.parseUnits('15', 'gwei'),
            },
            signer: wallet
        },
        {
            transaction: {
                chainId: 5,
                to: "walletB",
                value: ethers.utils.parseEther('1'),
                type: 2,
                maxFeePerGas: ethers.utils.parseUnits('18', 'gwei'),
                maxPriorityFeePerGas: ethers.utils.parseUnits('15', 'gwei'),
            },
            signer: wallet
        },
    ];
    // We sign the bundle
    const signedTxBundle = await flashbotsProvider.signBundle(bundle);
    console.log(signedTxBundle)
    // Send the bundle to the flashbotsProvider (to the next block (blockNumber +1))
    const res = await flashbotsProvider.sendBundle(bundle, blockNumber + 1);
    console.log(res);

    if ("error" in res) {
        throw new Error(res.error.message);
    }
    // Check if the transaction is included in the block
    const bundleResolution = await res.wait();
    // Transaction can have three states: Included in block / Failed to include / Nonce too high.
    if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
        console.log(`Congratulations, transaction included in block: ${blockNumber + 1}`);
        console.log(JSON.stringify(res, null, 2));
        process.exit(0);
    } else if (
        bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion
    ) {
        console.log(`Please retry, transaction not included in block: ${blockNumber + 1}`);
    } else if (
        bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh
    ) {
        console.log("Nonce too high, please reset");
        process.exit(1);
    }
}
main().catch(console.error);