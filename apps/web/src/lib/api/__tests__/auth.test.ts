import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockApi, type MockApi } from './client-mock';

let mockApi: MockApi;
vi.mock('../client', () => {
  mockApi = createMockApi();
  return { api: mockApi };
});

const { authApi } = await import('../auth');

beforeEach(() => {
  Object.values(mockApi).forEach(fn => fn.mockClear());
  mockApi.get.mockResolvedValue({ data: {} });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.delete.mockResolvedValue({ data: {} });
});

// ── Auth core ──

describe('login', () => {
  it('sends POST /auth/login with credentials', () => {
    const credentials = { email: 'test@test.com', password: 'pass123' } as any;
    authApi.login(credentials);
    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', credentials);
  });
});

describe('signup', () => {
  it('sends POST /auth/signup with data', () => {
    const data = { email: 'new@test.com', password: 'pass123', name: 'Test' } as any;
    authApi.signup(data);
    expect(mockApi.post).toHaveBeenCalledWith('/auth/signup', data);
  });
});

describe('logout', () => {
  it('sends POST /auth/logout', () => {
    authApi.logout();
    expect(mockApi.post).toHaveBeenCalledWith('/auth/logout');
  });
});

describe('getSession', () => {
  it('sends GET /auth/session', () => {
    authApi.getSession();
    expect(mockApi.get).toHaveBeenCalledWith('/auth/session');
  });
});

describe('refresh', () => {
  it('sends POST /auth/refresh', () => {
    authApi.refresh();
    expect(mockApi.post).toHaveBeenCalledWith('/auth/refresh');
  });
});

// ── Email ──

describe('checkEmail', () => {
  it('sends GET /auth/check-email with email param and _silent flag', () => {
    authApi.checkEmail('test@example.com');
    expect(mockApi.get).toHaveBeenCalledWith('/auth/check-email', {
      params: { email: 'test@example.com' },
      _silent: true,
    });
  });
});

describe('confirmEmail', () => {
  it('sends POST /auth/confirm-email with token', () => {
    authApi.confirmEmail('tok-123');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/confirm-email', { token: 'tok-123' });
  });
});

describe('resendConfirmation', () => {
  it('sends POST /auth/resend-confirmation with email', () => {
    authApi.resendConfirmation('test@example.com');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/resend-confirmation', { email: 'test@example.com' });
  });
});

// ── MFA ──

describe('verifyMfaOtp', () => {
  it('sends POST /auth/mfa/verify with data', () => {
    const data = { mfaToken: 'mfa-tok', code: '123456', trustDevice: true };
    authApi.verifyMfaOtp(data);
    expect(mockApi.post).toHaveBeenCalledWith('/auth/mfa/verify', data);
  });
});

describe('resendMfaOtp', () => {
  it('sends POST /auth/mfa/resend with mfaToken', () => {
    authApi.resendMfaOtp('mfa-tok');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/mfa/resend', { mfaToken: 'mfa-tok' });
  });
});

describe('enableMfa', () => {
  it('sends POST /auth/mfa/enable', () => {
    authApi.enableMfa();
    expect(mockApi.post).toHaveBeenCalledWith('/auth/mfa/enable');
  });
});

describe('verifyEnableMfa', () => {
  it('sends POST /auth/mfa/enable/verify with code', () => {
    authApi.verifyEnableMfa('654321');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/mfa/enable/verify', { code: '654321' });
  });
});

describe('initiateDisableMfa', () => {
  it('sends POST /auth/mfa/disable', () => {
    authApi.initiateDisableMfa();
    expect(mockApi.post).toHaveBeenCalledWith('/auth/mfa/disable');
  });
});

describe('confirmDisableMfa', () => {
  it('sends POST /auth/mfa/disable/verify with code', () => {
    authApi.confirmDisableMfa('111222');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/mfa/disable/verify', { code: '111222' });
  });
});

describe('getMfaStatus', () => {
  it('sends GET /auth/mfa/status', () => {
    authApi.getMfaStatus();
    expect(mockApi.get).toHaveBeenCalledWith('/auth/mfa/status');
  });
});

// ── Email change ──

describe('confirmEmailChange', () => {
  it('sends POST /auth/confirm-email-change with token', () => {
    authApi.confirmEmailChange('change-tok');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/confirm-email-change', { token: 'change-tok' });
  });
});

// ── Password ──

describe('forgotPassword', () => {
  it('sends POST /auth/forgot-password with email', () => {
    authApi.forgotPassword('user@example.com');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'user@example.com' });
  });
});

describe('resetPassword', () => {
  it('sends POST /auth/reset-password with token and newPassword', () => {
    authApi.resetPassword('reset-tok', 'newPass!23');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'reset-tok',
      newPassword: 'newPass!23',
    });
  });
});

// ── Phone register ──

describe('verifyPhoneRegister', () => {
  it('sends POST /auth/phone-register/verify with data', () => {
    const data = { pendingToken: 'pend-tok', code: '999888' };
    authApi.verifyPhoneRegister(data);
    expect(mockApi.post).toHaveBeenCalledWith('/auth/phone-register/verify', data);
  });
});

describe('resendPhoneRegisterOtp', () => {
  it('sends POST /auth/phone-register/resend with pendingToken', () => {
    authApi.resendPhoneRegisterOtp('pend-tok');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/phone-register/resend', { pendingToken: 'pend-tok' });
  });
});

// ── Phone verification ──

describe('sendPhoneVerification', () => {
  it('sends POST /auth/phone/send-verification', () => {
    authApi.sendPhoneVerification();
    expect(mockApi.post).toHaveBeenCalledWith('/auth/phone/send-verification');
  });
});

describe('confirmPhoneVerification', () => {
  it('sends POST /auth/phone/confirm-verification with code', () => {
    authApi.confirmPhoneVerification('112233');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/phone/confirm-verification', { code: '112233' });
  });
});

// ── Phone change ──

describe('requestPhoneChange', () => {
  it('sends POST /auth/phone/request-change with newPhone', () => {
    authApi.requestPhoneChange('+79001234567');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/phone/request-change', { newPhone: '+79001234567' });
  });
});

describe('confirmPhoneChange', () => {
  it('sends POST /auth/phone/confirm-change with code', () => {
    authApi.confirmPhoneChange('445566');
    expect(mockApi.post).toHaveBeenCalledWith('/auth/phone/confirm-change', { code: '445566' });
  });
});

// ── OAuth ──

describe('getOAuthLinks', () => {
  it('sends GET /auth/oauth/links', () => {
    authApi.getOAuthLinks();
    expect(mockApi.get).toHaveBeenCalledWith('/auth/oauth/links');
  });
});

describe('unlinkOAuth', () => {
  it('sends DELETE /auth/oauth/:provider', () => {
    authApi.unlinkOAuth('google');
    expect(mockApi.delete).toHaveBeenCalledWith('/auth/oauth/google');
  });

  it('interpolates provider correctly', () => {
    authApi.unlinkOAuth('yandex');
    expect(mockApi.delete).toHaveBeenCalledWith('/auth/oauth/yandex');
  });
});
