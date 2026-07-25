import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({
  t: (key: string) => key,
}));

import { AcceptInvitePage } from "./AcceptInvitePage";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { ResetPasswordPage } from "./ResetPasswordPage";

describe("auth terminal step DOM", () => {
  it("defers the forgot-password confirmation until an email was submitted", () => {
    const html = ForgotPasswordPage();

    expect(html).toContain('<template x-if="step === \'link-sent\'">');
    expect(html).toContain('href="/pages/auth/login.html"');
  });

  it("defers reset terminal states while keeping their recovery links", () => {
    const html = ResetPasswordPage();

    expect(html).toContain('<template x-if="step === \'success\'">');
    expect(html).toContain('<template x-if="step === \'error\'">');
    expect(html).toContain('href="/pages/auth/forgot-password.html"');
  });

  it("defers invite success and invalid-link states while the form is active", () => {
    const html = AcceptInvitePage();

    expect(html).toContain('<template x-if="step === \'success\'">');
    expect(html).toContain('<template x-if="step === \'error\'">');
    expect(html).toContain('href="/pages/auth/login.html"');
  });
});
