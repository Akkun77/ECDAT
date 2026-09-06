package com.example.security;

import java.security.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.util.Base64;

/**
 * Cryptographic helper class demonstrating various JCA patterns.
 * Contains both secure and insecure implementations for testing.
 */
public class CryptoHelper {

    /**
     * Legacy MD5 hash - INSECURE
     */
    public static String hashMD5(String input) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(input.getBytes());
        return Base64.getEncoder().encodeToString(digest);
    }

    /**
     * SHA-1 hash - DEPRECATED
     */
    public static String hashSHA1(String input) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        byte[] digest = md.digest(input.getBytes());
        return Base64.getEncoder().encodeToString(digest);
    }

    /**
     * SHA-256 hash - ACCEPTABLE
     */
    public static String hashSHA256(String input) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(input.getBytes());
        return Base64.getEncoder().encodeToString(digest);
    }

    /**
     * DES encryption - BROKEN (56-bit key)
     * Uses default provider which defaults to ECB mode
     */
    public static byte[] encryptDES(byte[] data, SecretKey key)
            throws NoSuchAlgorithmException, NoSuchPaddingException,
                   InvalidKeyException, IllegalBlockSizeException, BadPaddingException {
        Cipher cipher = Cipher.getInstance("DES");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher.doFinal(data);
    }

    /**
     * AES with explicit ECB mode - INSECURE mode
     */
    public static byte[] encryptAesEcb(byte[] data, SecretKey key)
            throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher.doFinal(data);
    }

    /**
     * RSA with PKCS1 padding - vulnerable to padding oracle
     */
    public static byte[] encryptRsaPkcs1(byte[] data, PublicKey publicKey)
            throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        return cipher.doFinal(data);
    }

    /**
     * Weak RSA key generation - 1024-bit
     */
    public static KeyPair generateWeakRsaKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(1024);
        return keyGen.generateKeyPair();
    }

    /**
     * Modern AES-GCM encryption - ACCEPTABLE
     */
    public static byte[] encryptAesGcm(byte[] data, SecretKey key, byte[] iv)
            throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, spec);
        return cipher.doFinal(data);
    }
}
