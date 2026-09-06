/**
 * Cryptographic service module for Node.js application.
 * Contains both legacy and modern crypto patterns.
 */
const crypto = require('crypto');

// Legacy hash for cache keys - INSECURE
function computeCacheKey(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}

// Legacy integrity check
function verifySha1Integrity(data, expectedHash) {
    const hash = crypto.createHash('sha1').update(data).digest('hex');
    return hash === expectedHash;
}

// Modern hash function
function computeSecureHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Deprecated createCipher API - no IV, weak key derivation
function encryptLegacy(text, password) {
    const cipher = crypto.createCipher('aes-192-cbc', password);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// DES encryption - BROKEN
function encryptWithDes(text, key) {
    const iv = Buffer.alloc(8, 0);
    const cipher = crypto.createCipheriv('des-ecb', key.slice(0, 8), '');
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Modern AES-256-GCM encryption
function encryptAesGcm(plaintext, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return { iv: iv.toString('hex'), encrypted, authTag: authTag.toString('hex') };
}

// Insecure random for token generation
function generateToken() {
    return Math.random().toString(36).substring(2);
}

module.exports = {
    computeCacheKey,
    verifySha1Integrity,
    computeSecureHash,
    encryptLegacy,
    encryptWithDes,
    encryptAesGcm,
    generateToken
};
