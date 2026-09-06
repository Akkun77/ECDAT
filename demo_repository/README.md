# Harmless static-analysis fixtures

Deliberately insecure examples for scanner testing only. Do not deploy, import, or execute this directory as an application. All credentials are fake; no network service is started. ECDAT reads source text without executing it, so cryptography, PyCryptodome, Node and Java dependencies are not required to scan these files.

Comments describing configurations are not evidence of key size or operation. For example, the Python AES function takes an unknown-length key; the Node `aes-256-gcm` literal provides explicit 256-bit evidence.

TLS configuration is retained as a future scanner fixture; the current core scans Python, JS/TS and Java only.
