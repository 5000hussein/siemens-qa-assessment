import { test as setup } from '../../core/baseTest';
import { authStatePath, getUserCredentials } from '../../config/environment';

// Runs once before the UI project; every UI test starts already signed in from this storage state
setup('authenticate UI user', async ({ page, loginPage, commonPage }) => {
  const { email, password } = getUserCredentials();
  await loginPage.navigateAndLogin(email, password);
  await commonPage.verifySignedInAs(email);
  await page.context().storageState({ path: authStatePath });
});
