import { createRequire } from "module";
const require = createRequire(import.meta.url);
const tool = require("eip7702-tool");

const address = process.argv[2] ?? "0xE432A39eA2303dD8DD71C4afEc65AFa904AfB6Cb";
const faucetUrl = "https://sepolia-faucet.pk910.de";
const clientVersion = "voucher-shop/1.0";

const { Pk910Api, pk910CreateHashSolver, pk910GetPowParamsString, pk910IsValidPowHash, pk910Base64ToHex, Pk910PowSocket } = tool;

async function mineSession(api, sessionId, targetWei) {
  const session = await api.getSession(sessionId);
  const config = await api.getConfig();
  const powConfig = config.modules?.pow;
  const powState = session.modules?.pow;
  if (!powConfig || !powState) throw new Error("No PoW module");

  const solver = pk910CreateHashSolver(powConfig.powParams);
  const difficulty = Number(powConfig.powDifficulty);
  const params = pk910GetPowParamsString(powConfig.powParams, difficulty);
  const preimageHex = pk910Base64ToHex(powState.preImage);
  const socket = new Pk910PowSocket(
    `${faucetUrl.replace(/^http/, "ws")}/ws/pow`,
    sessionId,
    clientVersion
  );
  await socket.connect();

  let nonce = Number(powState.lastNonce || -1) + 1;
  let balance = BigInt((await api.getSessionStatus(sessionId)).balance || 0);

  while (balance < targetWei) {
    const hash = solver(preimageHex, nonce, params);
    if (pk910IsValidPowHash(hash, difficulty)) {
      await socket.request("verifyPow", { nonce, hash });
      const status = await api.getSessionStatus(sessionId);
      balance = BigInt(status.balance || 0);
      console.log(`Mined balance: ${Number(balance) / 1e18} ETH`);
    }
    nonce += 1;
  }

  const claim = await api.claimReward(sessionId);
  console.log("Claim result:", claim);
}

async function main() {
  const api = new Pk910Api(faucetUrl, clientVersion);
  const config = await api.getConfig();
  console.log("Faucet config loaded");

  let sessionId;
  try {
    const started = await api.startSession(address, "");
    if (started.status === "failed") {
      throw new Error(started.failedReason || started.failedCode);
    }
    sessionId = started.session;
    console.log("Session:", sessionId);
  } catch (error) {
    console.error("startSession failed:", error.message);
    process.exit(1);
  }

  const targetWei = BigInt(5e16); // 0.05 ETH
  await mineSession(api, sessionId, targetWei);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
