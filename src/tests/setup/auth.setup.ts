import { test as setup } from '../../core/fixtures';
import { authStatePath, userEmail, userPassword } from '../../config/environment';

// Runs once before the UI project; every UI test starts already signed in from this storage state
setup('authenticate UI user', async ({ page, loginPage, commonPage }) => {
  await loginPage.navigateAndLogin(userEmail, userPassword);
  await commonPage.verifySignedInAs(userEmail);
  await page.context().storageState({ path: authStatePath });
});
