import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { ConnectFormState } from '../connect-form-state';

export async function setConnectFormState(
  browser: CompassBrowser,
  state: ConnectFormState
): Promise<void> {
  await browser.resetConnectForm();

  await browser.expandConnectFormOptions();

  // General
  await browser.navigateToConnecTab('General');

  if (state.scheme) {
    await browser.clickParent(
      Selectors.connectionFormSchemeRadio(state.scheme)
    );
  }

  if (state.hosts) {
    for (let i = 0; i < state.hosts.length; ++i) {
      if (i > 0) {
        await browser.clickVisible(
          '[data-testid="host-input-container"]:last-child [data-testid="connection-add-host-button"]'
        );
      }
      await browser.setValueVisible(
        `[data-testid="connection-host-input-${i}"]`,
        state.hosts[i]
      );
    }
  }

  if (state.directConnection) {
    await browser.clickParent(Selectors.ConnectionFormDirectConnectionCheckbox);
  }

  // Authentication
  await browser.navigateToConnecTab('Authentication');

  if (state.authMethod) {
    await browser.clickParent(
      Selectors.connectionFormAuthenticationMethodRadio(state.authMethod)
    );
  }

  // Username/Password
  if (state.defaultUsername && state.defaultPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputUsername,
      state.defaultUsername
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputPassword,
      state.defaultPassword
    );
  }
  if (state.defaultAuthSource) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputAuthSource,
      state.defaultAuthSource
    );
  }
  if (state.defaultAuthMechanism) {
    await browser.clickParent(
      Selectors.connectionFormAuthMechanismRadio(state.defaultAuthMechanism)
    );
  }

  // Kerberos
  if (state.kerberosPrincipal) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputGssApiPrincipal,
      state.kerberosPrincipal
    );
  }
  if (state.kerberosServiceName) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputGssApiServiceName,
      state.kerberosServiceName
    );
  }
  if (state.kerberosCanonicalizeHostname) {
    await browser.clickParent(
      Selectors.connectionFormCanonicalizeHostNameRadio(
        state.kerberosCanonicalizeHostname
      )
    );
  }
  if (state.kerberosServiceRealm) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputGssApiServiceRealm,
      state.kerberosServiceRealm
    );
  }
  if (state.kerberosServiceRealm) {
    await browser.clickParent(Selectors.ConnectionFormGssApiPasswordCheckbox);
  }
  if (state.kerberosPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputGssApiPassword,
      state.kerberosPassword
    );
  }

  // LDAP
  if (state.ldapUsername && state.ldapPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputPlainUsername,
      state.ldapUsername
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputPlainPassword,
      state.ldapPassword
    );
  }

  // AWS IAM
  if (state.awsAccessKeyId && state.awsSecretAccessKey) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputAWSAccessKeyId,
      state.awsAccessKeyId
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputAWSSecretAccessKey,
      state.awsSecretAccessKey
    );
  }
  if (state.awsSessionToken) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputAWSSessionToken,
      state.awsSessionToken
    );
  }

  // TLS/SSL
  await browser.navigateToConnecTab('TLS/SSL');

  if (state.sslConnection) {
    await browser.clickParent(
      Selectors.connectionFormSSLConnectionRadio(state.sslConnection)
    );
  }

  if (state.tlsCAFile) {
    await browser.selectFile(
      Selectors.ConnectionFormTlsCaFile,
      state.tlsCAFile
    );
  }
  if (state.tlsCertificateKeyFile) {
    await browser.selectFile(
      Selectors.ConnectionFormTlsCertificateKeyFile,
      state.tlsCertificateKeyFile
    );
  }
  if (state.clientKeyPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputTlsCertificateKeyFilePassword,
      state.clientKeyPassword
    );
  }
  if (state.tlsInsecure) {
    await browser.clickParent(Selectors.ConnectionFormTlsInsecureCheckbox);
  }
  if (state.tlsAllowInvalidHostnames) {
    await browser.clickParent(
      Selectors.ConnectionFormTlsAllowInvalidHostnamesCheckbox
    );
  }
  if (state.tlsAllowInvalidCertificates) {
    await browser.clickParent(
      Selectors.ConnectionFormTlsAllowInvalidCertificatesCheckbox
    );
  }

  // Proxy/SSH Tunnel
  await browser.navigateToConnecTab('Proxy/SSH Tunnel');

  //proxyMethod
  if (state.proxyMethod) {
    await browser.clickParent(
      Selectors.connectionFormProxyMethodRadio(state.proxyMethod)
    );
  }

  // SSH with Password
  // NOTE: these don't affect the URI
  if (state.sshPasswordHost && state.sshPasswordPort) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshPasswordHost,
      state.sshPasswordHost
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshPasswordPort,
      state.sshPasswordPort
    );
  }
  if (state.sshPasswordUsername) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshPasswordUsername,
      state.sshPasswordUsername
    );
  }
  if (state.sshPasswordPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshPasswordPassword,
      state.sshPasswordPassword
    );
  }

  // SSH with Identity File
  // NOTE: these don't affect the URI
  if (state.sshIdentityHost && state.sshIdentityPort) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshIdentityHost,
      state.sshIdentityHost
    );
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshIdentityPort,
      state.sshIdentityPort
    );
  }
  if (state.sshIdentityUsername) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshIdentityUsername,
      state.sshIdentityUsername
    );
  }
  if (state.sshIdentityKeyFile) {
    await browser.selectFile(
      Selectors.ConnectionFormSshIdentityKeyFile,
      state.sshIdentityKeyFile
    );
  }
  if (state.sshIdentityPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSshIdentityPassword,
      state.sshIdentityPassword
    );
  }

  // Socks5
  if (state.socksHost) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSocksHost,
      state.socksHost
    );
  }
  if (state.socksPort) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSocksPort,
      state.socksPort
    );
  }
  if (state.socksUsername) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSocksUsername,
      state.socksUsername
    );
  }
  if (state.socksPassword) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputSocksPassword,
      state.socksPassword
    );
  }

  // Advanced
  await browser.navigateToConnecTab('Advanced');

  if (state.readPreference) {
    await browser.clickParent(
      Selectors.connectionFormReadPreferenceRadio(state.readPreference)
    );
  }
  if (state.replicaSet) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputReplicaset,
      state.replicaSet
    );
  }
  if (state.defaultDatabase) {
    await browser.setValueVisible(
      Selectors.ConnectionFormInputDefaultDatabase,
      state.defaultDatabase
    );
  }
  if (state.urlOptions) {
    for (const [index, [key, value]] of Object.entries(
      state.urlOptions
    ).entries()) {
      // key
      await browser.clickVisible(
        Selectors.connectionFormUrlOptionKeyButton(index)
      );
      // this is quite hacky, unfortunately
      const options = await browser.$$('#select-key-menu [role="option"]');
      for (const option of options) {
        const span = await option.$(`span=${key}`);
        if (await span.isExisting()) {
          await span.waitForDisplayed();
          await span.click();
          break;
        }
      }

      // value
      await browser.setValueVisible(
        Selectors.connectionFormUrlOptionValueInput(index),
        value
      );
    }
  }
}