const { ethers } = require("ethers");
const { SimpleAccountAPI, HttpRpcClient } = require('@account-abstraction/sdk');
const { packPaymasterData } = require("./utils");
const STACKUP_BUNDLER_URL = "http://localhost:4337/rpc"
const STACKUP_DEDICATED_BUNDLER_URL = "https://api.stackup.sh/v1/dedicated-bundler/65283540e7c04943a4f1f1c1e9cf8bf7ff0bddb30eb1d2677ad2d3d794311372"
const RPC_URL = "https://rpc-grubby-red-rodent-a6u9rz8x70.t.conduit.xyz";
const ENTRY_POINT_CONTRACT = "0x6C1cdB0DE263b60093B3cA92a7DC72e92c1E4133"
const FACTORY = "0x5bc005161c3da76F8953DE8e9C2F90899Ff3b243"; 
const TEST_USDT_FAUCET = "0x6A04c328bcC3b560c01d756a6D6dD2bAEDF848D9";
const ACCEPT_ALL_PAYMASTER_CONTRACT = "0xA9d9027A5283B357a73C6B3A0ef287d7cA7c84b4";
const EXPLORER_URL = "https://explorerl2new-grubby-red-rodent-a6u9rz8x70.t.conduit.xyz";


(async () => {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet.createRandom(provider);
    console.log("Random Wallet Address:", await signer.getAddress())
    const httpRpcClient = new HttpRpcClient(STACKUP_BUNDLER_URL, ENTRY_POINT_CONTRACT, await provider.getNetwork().then(net => net.chainId))

    /* 
        With `STACKUP_DEDICATED_BUNDLER_URL`:  preVerificationGas: below expected gas of 139502
    */

    const walletAPI = new SimpleAccountAPI({
        provider, 
        entryPointAddress: ENTRY_POINT_CONTRACT,
        owner: signer,
        factoryAddress: FACTORY,
        paymasterAPI: {
            getPaymasterAndData: () => packPaymasterData(ACCEPT_ALL_PAYMASTER_CONTRACT, 3e5, 0),
        },
        overheads: {
            fixed: 31000,
            perUserOp: 18300,
            perUserOpWord: 4,
            zeroByte: 4,
            nonZeroByte: 16,
            bundleSize: 1,
            sigSize: 65
        }
    })
    const smartAccountAddr = await walletAPI.getAccountAddress();
    console.log("Smart Account Address:", smartAccountAddr)

    const op = await walletAPI.createSignedUserOp({
      target: TEST_USDT_FAUCET,
      data: "0x9f678cca"
    })
    
    const out = await httpRpcClient.sendUserOpToBundler(op)
    console.log(out)
    console.log(`${EXPLORER_URL}/address/${smartAccountAddr}`)
})()
