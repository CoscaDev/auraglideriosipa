/**
 * WebAuthnService.ts
 * A service to handle biometric authentication using the Web Authentication API.
 * For this offline-first demo, we store the credential data in localStorage.
 */

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  userName: string;
}

const STORAGE_KEY = 'auraglider_biometric_credential';

export const WebAuthnService = {
  /**
   * Checks if the current browser/device supports WebAuthn and biometric sensors.
   */
  isSupported: async (): Promise<boolean> => {
    return (
      window.PublicKeyCredential !== undefined &&
      (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  },

  /**
   * Registers a new biometric credential for the user.
   */
  register: async (userName: string): Promise<boolean> => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "AuraGlider",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (credential) {
        // In a real app, we would send 'credential' to the server to store the public key.
        // For this demo, we store the credential ID to recognize the user later.
        const credentialData: WebAuthnCredential = {
          id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          publicKey: "demo-public-key", // In reality, this would be the actual public key from the attestation
          userName,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentialData));
        return true;
      }
      return false;
    } catch (error) {
      console.error("WebAuthn Registration Error:", error);
      return false;
    }
  },

  /**
   * Authenticates the user using their biometric sensor.
   */
  authenticate: async (): Promise<string | null> => {
    try {
      const storedCredential = localStorage.getItem(STORAGE_KEY);
      if (!storedCredential) return null;

      const credentialData: WebAuthnCredential = JSON.parse(storedCredential);
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [
          {
            id: Uint8Array.from(atob(credentialData.id), (c) => c.charCodeAt(0)),
            type: "public-key",
          },
        ],
        userVerification: "required",
        timeout: 60000,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (assertion) {
        return credentialData.userName;
      }
      return null;
    } catch (error) {
      console.error("WebAuthn Authentication Error:", error);
      return null;
    }
  },

  /**
   * Checks if there is a registered biometric credential.
   */
  hasCredential: (): boolean => {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },

  /**
   * Clears the stored biometric credential.
   */
  clearCredential: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
