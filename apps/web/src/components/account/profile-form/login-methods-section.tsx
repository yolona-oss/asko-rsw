interface LoginMethodsSectionProps {
  providers: string[];
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
}

export function LoginMethodsSection({
  providers,
  email,
  emailVerified,
  phone,
  phoneVerified,
}: LoginMethodsSectionProps) {
  const hasEmail = providers.includes('EMAIL');
  const hasPhone = providers.includes('PHONE');
  const hasGoogle = providers.includes('GOOGLE');

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-medium text-text-main">Способы входа</h3>

      <div className="flex flex-col gap-1">
        {/* Email */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <MethodIcon active={hasEmail} />
            <div>
              <p className="text-sm font-medium text-text-main">Email</p>
              {email && <p className="text-xs text-text-sub">{email}</p>}
            </div>
          </div>
          {hasEmail && email ? (
            <VerificationBadge verified={emailVerified} />
          ) : (
            <span className="text-xs text-text-sub">Не подключён</span>
          )}
        </div>

        {/* Phone */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <MethodIcon active={hasPhone || !!phone} />
            <div>
              <p className="text-sm font-medium text-text-main">Телефон</p>
              {phone && <p className="text-xs text-text-sub">{phone}</p>}
            </div>
          </div>
          {phone ? (
            <div className="flex items-center gap-3">
              <VerificationBadge verified={phoneVerified} />
              {!phoneVerified && (
                <button
                  type="button"
                  disabled
                  className="text-xs text-brand-red font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Функция в разработке"
                >
                  Подтвердить
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-text-sub">Не указан</span>
          )}
        </div>

        {/* Google */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <MethodIcon active={hasGoogle} />
            <p className="text-sm font-medium text-text-main">Google</p>
          </div>
          <span className={`text-xs ${hasGoogle ? 'text-green-600' : 'text-text-sub'}`}>
            {hasGoogle ? 'Подключён' : 'Не подключён'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MethodIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#F0F0F1] flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-text-sub" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
      </svg>
    </div>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <div className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span className="text-xs text-green-600">Подтверждён</span>
      </div>
    );
  }
  return (
    <span className="text-xs text-amber-600">Не подтверждён</span>
  );
}
