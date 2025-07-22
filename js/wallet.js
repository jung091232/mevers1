// Wallet interaction helper for the Meverse presale site
//
// This script wires up the “Connect Wallet” buttons found on the presale
// page to MetaMask (or any provider injected at `window.ethereum`) and
// exposes a handful of helper functions for interacting with the
// MVS ERC‑20 contract.  You should include this file after loading
// ethers.js via CDN.

// Address of the deployed MVS token contract
const contractAddress = "0x1F0925D9F524c0d761bB85D0B3D44EDBDA15f5DE";

// ABI extracted from the provided contract description.  Only the
// functions and events relevant for typical wallet operations are
// included here.  If you add new functions to the contract later on,
// extend this array accordingly.
const abi = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ],
    "name": "allowance",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ],
    "name": "balanceOf",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [ { "internalType": "string", "name": "", "type": "string" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [ { "internalType": "string", "name": "", "type": "string" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ],
    "name": "transfer",
    "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" } ],
    "name": "transferFrom",
    "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Global references to the provider, signer and contract.  These are
// initialised on successful wallet connection.
let provider;
let signer;
let contract;

/**
 * Request account access from the user and initialise provider/signer.
 *
 * When MetaMask (or another provider) is installed in the browser,
 * `window.ethereum` will be defined.  We request access to the user’s
 * accounts and then construct an ethers provider and signer.  The
 * signer is used for signing transactions; read‑only operations
 * (balance queries, name/symbol) can be performed via the provider.
 */
async function connectWallet() {
  if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
    alert('MetaMask is not available. Please install it to continue.');
    return;
  }
  try {
    // Ask MetaMask to prompt the user for account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, abi, signer);
    const account = await signer.getAddress();
    console.log('Connected account:', account);
    alert('Wallet connected: ' + account);
    return account;
  } catch (err) {
    console.error('Wallet connection failed', err);
    alert('Could not connect wallet: ' + err.message);
    throw err;
  }
}

/**
 * Read the token name from the contract.
 *
 * @returns {Promise<string>} The name of the token.
 */
async function getTokenName() {
  if (!contract) {
    throw new Error('Contract not initialised. Call connectWallet() first.');
  }
  return await contract.name();
}

/**
 * Read the token symbol from the contract.
 *
 * @returns {Promise<string>} The symbol of the token.
 */
async function getTokenSymbol() {
  if (!contract) {
    throw new Error('Contract not initialised. Call connectWallet() first.');
  }
  return await contract.symbol();
}

/**
 * Get the current balance of the connected account.
 *
 * @returns {Promise<string>} The balance in human readable format.
 */
async function getMyTokenBalance() {
  if (!contract || !signer) {
    throw new Error('Contract not initialised. Call connectWallet() first.');
  }
  const account = await signer.getAddress();
  const decimals = await contract.decimals();
  const raw = await contract.balanceOf(account);
  // Convert from raw units to human readable (assumes token uses standard decimals)
  return ethers.utils.formatUnits(raw, decimals);
}

/**
 * Attach click listeners to all elements with a `data-i18n` attribute
 * matching the connect‑wallet translation key.  When clicked, the
 * wallet connection routine will run.
 */
function attachWalletButtonHandlers() {
  document.querySelectorAll('[data-i18n="presale.connect_wallet"], [data-i18n="presale.connect_wallet_btn"], [data-i18n="referral.connect_wallet_btn"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      connectWallet().catch(() => {});
    });
  });
}

// Once the DOM is ready, set up the button listeners.  We wait for
// components and translations to finish loading first so that our
// query selectors can find the target elements.
document.addEventListener('DOMContentLoaded', () => {
  // Allow a slight delay to ensure that load‑components.js has injected
  // included HTML fragments and translations have been applied.  Without
  // this, the elements may not yet exist in the DOM when this script
  // runs.
  setTimeout(attachWalletButtonHandlers, 500);
});