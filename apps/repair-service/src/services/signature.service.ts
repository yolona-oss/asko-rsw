import { Injectable } from '@nestjs/common';
import { createSign, createVerify } from 'crypto';
import { AppConfig } from '../app.config';

@Injectable()
export class SignatureService {
    private readonly privateKey: string;
    private readonly publicKey: string;

    constructor(private readonly config: AppConfig) {
        this.privateKey = config.signature.privateKey;
        this.publicKey = config.signature.publicKey;
    }

    /** Canonicalize payload (sorted keys) and sign with ECDSA P-256 / SHA-256 */
    sign(payload: Record<string, unknown>): string {
        const canonical = this.canonicalize(payload);
        const signer = createSign('SHA256');
        signer.update(canonical);
        signer.end();
        return signer.sign(this.privateKey, 'base64url');
    }

    /** Verify a signature against the payload using the public key */
    verify(payload: Record<string, unknown>, signature: string): boolean {
        const canonical = this.canonicalize(payload);
        const verifier = createVerify('SHA256');
        verifier.update(canonical);
        verifier.end();
        try {
            return verifier.verify(this.publicKey, signature, 'base64url');
        } catch {
            return false;
        }
    }

    /** Return the PEM-encoded public key for external verification */
    getPublicKeyPem(): string {
        return this.publicKey;
    }

    /** Verify an entity's stored signature by loading its signedPayload and checking */
    verifyStoredSignature(signedPayload: string | null | undefined, signature: string | null | undefined): { valid: boolean; reason?: string } {
        if (!signature || !signedPayload) {
            return { valid: false, reason: 'No signature present' };
        }

        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(signedPayload);
        } catch {
            return { valid: false, reason: 'Invalid signed payload format' };
        }

        const valid = this.verify(parsed, signature);
        return valid ? { valid: true } : { valid: false, reason: 'Signature verification failed' };
    }

    /** Produce deterministic JSON by sorting keys */
    private canonicalize(payload: Record<string, unknown>): string {
        return JSON.stringify(payload, Object.keys(payload).sort());
    }
}
