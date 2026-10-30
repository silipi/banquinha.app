// Admin credentials of the e2e runs. The hash is of TEST_ADMIN.password.
export const TEST_ADMIN = {
  username: 'test-admin-username',
  password: 'test-admin-password-123',
  totpSecret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
};

export const TEST_ADMIN_ENV = {
  ADMIN_USERNAME: TEST_ADMIN.username,
  ADMIN_PASSWORD_HASH:
    'scrypt$32768$8$1$ErnAsXT2YbSKTHXXcPHzbA$V_inAnI2L1NkPjyLjF6WCwVo-hpU3fvgOt9PswK8f74fFBJ1DbzvT2sGBRVt9Dk3YZ5hKjEVU-11_slQXysVXA',
  ADMIN_TOTP_SECRET: TEST_ADMIN.totpSecret,
};
