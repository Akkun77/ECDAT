package com.example.legacy;

import java.security.*;
import java.util.Random;

/**
 * Legacy security module - uses outdated cryptographic practices.
 */
public class LegacySecurity {

    private static final String SECRET_KEY = "hardcoded-secret-key-value";

    /**
     * Weak digital signature using SHA1withRSA
     */
    public static byte[] signData(byte[] data, PrivateKey privateKey)
            throws NoSuchAlgorithmException, InvalidKeyException, SignatureException {
        Signature sig = Signature.getInstance("SHA1withRSA");
        sig.initSign(privateKey);
        sig.update(data);
        return sig.sign();
    }

    /**
     * Insecure random number generation
     */
    public static int generateVerificationCode() {
        Random random = new Random();
        return 100000 + random.nextInt(900000);
    }

    /**
     * Modern secure signature - SHA256withRSA
     */
    public static byte[] signDataSecure(byte[] data, PrivateKey privateKey)
            throws NoSuchAlgorithmException, InvalidKeyException, SignatureException {
        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initSign(privateKey);
        sig.update(data);
        return sig.sign();
    }
}
