import { authenticator } from "otplib";
import QRCode from "qrcode";
import { UserModel } from "../models/user.model";

const ISSUER = "BasoBas";

export class MfaService {
  /**
   * Begin MFA enrollment: create a fresh TOTP secret, store it (but keep MFA
   * disabled until the user confirms a valid code), and return the otpauth URL
   * plus a QR data-URL to scan in an authenticator app.
   */
  async generateSetup(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    const secret = authenticator.generateSecret();
    user.mfaSecret = secret;
    user.mfaEnabled = false; // not enabled until confirmed
    await user.save();

    const otpauthUrl = authenticator.keyuri(user.email, ISSUER, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { otpauthUrl, qrDataUrl, secret };
  }

  /** Confirm enrollment: verify the first code, then turn MFA on. */
  async enable(userId: string, token: string) {
    const user = await UserModel.findById(userId);
    if (!user || !user.mfaSecret) throw new Error("Start MFA setup first");
    if (!this.verify(token, user.mfaSecret)) throw new Error("Invalid authentication code");

    user.mfaEnabled = true;
    await user.save();
    return { mfaEnabled: true };
  }

  /** Turn MFA off after verifying a current code, and wipe the secret. */
  async disable(userId: string, token: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");
    if (!user.mfaEnabled || !user.mfaSecret) throw new Error("MFA is not enabled");
    if (!this.verify(token, user.mfaSecret)) throw new Error("Invalid authentication code");

    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();
    return { mfaEnabled: false };
  }

  verify(token: string, secret: string): boolean {
    try {
      return authenticator.check(String(token).trim(), secret);
    } catch {
      return false;
    }
  }
}
