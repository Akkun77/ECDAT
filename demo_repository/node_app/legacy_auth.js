/**
 * Legacy authentication module using CryptoJS.
 * Kept for backward compatibility - scheduled for replacement.
 */

const CryptoJS = require('crypto-js');

const API_KEY = "hardcoded-api-key-12345";
const SECRET_TOKEN = "bearer-token-secret-value";

function hashPassword(password) {
    return CryptoJS.MD5(password).toString();
}

function hashWithSha1(data) {
    return CryptoJS.SHA1(data).toString();
}

function encryptUserData(data, key) {
    return CryptoJS.DES.encrypt(data, key).toString();
}

function encryptWithEcb(data, key) {
    return CryptoJS.AES.encrypt(data, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }).toString();
}

module.exports = { hashPassword, hashWithSha1, encryptUserData, encryptWithEcb };
