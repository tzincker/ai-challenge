/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
const TENANT_SUBDOMAIN = process.env.TENANT_SUBDOMAIN || 'iachallenge70-hdeefjc9axewfjb2';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/redirect';
const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000';
const GRAPH_ME_ENDPOINT = process.env.GRAPH_API_ENDPOINT + 'v1.0/me' || 'https://graph.microsoft.com/';

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL Node configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID || '26a5a11d-adcc-4e39-9df6-5f6d28bae2e3', // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
    //For workforce tenant
    authority: process.env.CLOUD_INSTANCE + process.env.TENANT_ID,
    clientSecret: process.env.CLIENT_SECRET || 'a747b20f-59c5-4814-9ae9-40b871d08ff6', // Client secret generated from the app registration in Azure portal
  },
  system: {
    loggerOptions: {
      loggerCallback(_loglevel, message, _containsPii) {
        console.log(message);// eslint-disable-line no-console
      },
      piiLoggingEnabled: false,
      logLevel: 'Info',
    },
  },
};

module.exports = {
  msalConfig,
  REDIRECT_URI,
  POST_LOGOUT_REDIRECT_URI,
  TENANT_SUBDOMAIN,
  GRAPH_ME_ENDPOINT
};