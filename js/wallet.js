// Wallet interaction helper for the Meverse presale site
//
// This script wires up the “Connect Wallet” buttons found on the presale
// page to MetaMask (or any provider injected at `window.ethereum`) and
// exposes a handful of helper functions for interacting with the
// MVS ERC‑20 contract.  You should include this file after loading
// ethers.js via CDN.

// Address of the deployed MVS token contract
const contractAddress = "0x1F0925D9F524c0d761bB85D0B3D44EDBDA15f5DE";

/*
 * This implementation avoids relying on the external ethers.js
 * library.  Instead, it uses the Ethereum provider injected by
 * MetaMask (window.ethereum) directly to request accounts and
 * perform read‑only contract calls via the eth_call RPC method.  To
 * keep things simple, only the functions necessary for basic wallet
 * interaction are provided.
 */

// Currently connected account address (set by connectWallet)
let currentAccount = null;

/**
 * Prompt the user to connect their wallet via MetaMask.
 *
 * The function stores the selected account in `currentAccount` and
 * displays a confirmation alert.  If MetaMask is not available,
 * it will alert the user accordingly.
 */
async function connectWallet() {
  if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
    alert('MetaMask is not available. Please install it to continue.');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      alert('No account selected');
      return;
    }
    currentAccount = accounts[0];
    console.log('Connected account:', currentAccount);
    alert('Wallet connected: ' + currentAccount);
    return currentAccount;
  } catch (err) {
    console.error('Wallet connection failed', err);
    alert('Could not connect wallet: ' + err.message);
    throw err;
  }
}

/*
 * Helper to perform an eth_call against the MVS token contract.
 *
 * @param {string} data The hex encoded call data (function selector + params)
 * @returns {Promise<string>} The hex encoded return data
 */
async function callContract(data) {
  const result = await window.ethereum.request({
    method: 'eth_call',
    params: [ { to: contractAddress, data: data }, 'latest' ]
  });
  return result;
}

/**
 * Decode a dynamic string returned from an eth_call.  Ethereum
 * ABI‑encoded strings are returned as a series of 32‑byte words.  The
 * first word is an offset to the start of the data, the second word
 * contains the length, followed by the string bytes padded to a
 * multiple of 32 bytes.  This helper reads the length and extracts
 * the UTF‑8 string.
 *
 * @param {string} hex The hex encoded return data (with or without 0x prefix)
 * @returns {string} The decoded UTF‑8 string
 */
function decodeString(hex) {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  // offset is stored in the first 32 bytes, but can be ignored since
  // the dynamic data immediately follows the length in the return value
  const length = parseInt(hex.slice(64, 128), 16) * 2; // bytes * 2 hex chars
  const data = hex.slice(128, 128 + length);
  let result = '';
  for (let i = 0; i < data.length; i += 2) {
    const code = parseInt(data.substr(i, 2), 16);
    if (code === 0) continue;
    result += String.fromCharCode(code);
  }
  return result;
}

/**
 * Fetch the token name from the contract via eth_call.
 *
 * @returns {Promise<string>} The name of the token
 */
async function getTokenName() {
  const data = '0x06fdde03'; // function selector for name()
  const result = await callContract(data);
  return decodeString(result);
}

/**
 * Fetch the token symbol from the contract via eth_call.
 *
 * @returns {Promise<string>} The symbol of the token
 */
async function getTokenSymbol() {
  const data = '0x95d89b41'; // function selector for symbol()
  const result = await callContract(data);
  return decodeString(result);
}

/**
 * Fetch the token decimals from the contract via eth_call.
 *
 * @returns {Promise<number>} The number of decimals
 */
async function getTokenDecimals() {
  const data = '0x313ce567'; // function selector for decimals()
  const result = await callContract(data);
  return parseInt(result, 16);
}

/**
 * Get the current MVS token balance for the connected account.
 *
 * This helper constructs the call data for balanceOf(account) and then
 * decodes the returned 32‑byte integer.  The balance is returned as
 * a human readable string taking into account the token decimals.
 *
 * @returns {Promise<string>} The balance as a decimal string
 */
async function getMyTokenBalance() {
  if (!currentAccount) {
    throw new Error('Wallet not connected. Call connectWallet() first.');
  }
  const decimals = await getTokenDecimals();
  // function selector for balanceOf(address)
  const selector = '70a08231';
  const addressNoPrefix = currentAccount.toLowerCase().replace('0x', '');
  const paddedAddress = addressNoPrefix.padStart(64, '0');
  const data = '0x' + selector + paddedAddress;
  const result = await callContract(data);
  const value = BigInt(result);
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  // pad fractional part with leading zeros
  let fractionStr = fraction.toString();
  fractionStr = fractionStr.padStart(decimals, '0');
  // Remove trailing zeros for cleanliness
  fractionStr = fractionStr.replace(/0+$/, '');
  return fractionStr ? `${whole}.${fractionStr}` : `${whole}`;
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