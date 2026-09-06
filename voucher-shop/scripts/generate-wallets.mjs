import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { generatePrivateKey } from "viem/accounts";

const merchantKey = process.env.MERCHANT_PRIVATE_KEY || generatePrivateKey();
const buyerKey = process.env.TEST_BUYER_PRIVATE_KEY || generatePrivateKey();

const merchant = privateKeyToAccount(merchantKey);
const buyer = privateKeyToAccount(buyerKey);

console.log("Add these to .env.local:\n");
console.log(`MERCHANT_ADDRESS=${merchant.address}`);
console.log(`MERCHANT_PRIVATE_KEY=${merchantKey}`);
console.log(`TEST_BUYER_PRIVATE_KEY=${buyerKey}`);
console.log(`\nBuyer address (fund with Sepolia ETH + USDC): ${buyer.address}`);
console.log(`USDC Sepolia: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`);
