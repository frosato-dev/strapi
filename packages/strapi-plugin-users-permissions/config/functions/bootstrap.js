'use strict';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */
const _ = require('lodash');
const uuid = require('uuid/v4');

module.exports = async () => {
  const pluginStore = strapi.store({
    environment: '',
    type: 'plugin',
    name: 'users-permissions',
  });

  const grantConfig = {
    email: {
      enabled: true,
      icon: 'envelope',
    },
    discord: {
      enabled: false,
      icon: 'discord',
      key: '',
      secret: '',
      callback: '/auth/discord/callback',
      scope: ['identify', 'email'],
    },
    facebook: {
      enabled: false,
      icon: 'facebook-square',
      key: '',
      secret: '',
      callback: '/auth/facebook/callback',
      scope: ['email'],
    },
    google: {
      enabled: false,
      icon: 'google',
      key: '',
      secret: '',
      callback: '/auth/google/callback',
      scope: ['email'],
    },
    github: {
      enabled: false,
      icon: 'github',
      key: '',
      secret: '',
      redirect_uri: '/auth/github/callback',
      scope: ['user', 'user:email'],
    },
    microsoft: {
      enabled: false,
      icon: 'windows',
      key: '',
      secret: '',
      callback: '/auth/microsoft/callback',
      scope: ['user.read'],
    },
    twitter: {
      enabled: false,
      icon: 'twitter',
      key: '',
      secret: '',
      callback: '/auth/twitter/callback',
    },
    instagram: {
      enabled: false,
      icon: 'instagram',
      key: '',
      secret: '',
      callback: '/auth/instagram/callback',
    },
    vk: {
      enabled: false,
      icon: 'vk',
      key: '',
      secret: '',
      callback: '/auth/vk/callback',
      scope: ['email'],
    },
  };
  const prevGrantConfig = (await pluginStore.get({ key: 'grant' })) || {};
  // store grant auth config to db
  // when plugin_users-permissions_grant is not existed in db
  // or we have added/deleted provider here.
  if (!prevGrantConfig || !_.isEqual(_.keys(prevGrantConfig), _.keys(grantConfig))) {
    // merge with the previous provider config.
    _.keys(grantConfig).forEach(key => {
      if (key in prevGrantConfig) {
        grantConfig[key] = _.merge(grantConfig[key], prevGrantConfig[key]);
      }
    });
    await pluginStore.set({ key: 'grant', value: grantConfig });
  }

  if (!(await pluginStore.get({ key: 'email' }))) {
    const value = {
      reset_password: {
        display: 'Email.template.reset_password',
        icon: 'sync',
        options: {
          from: {
            name: 'Administration Panel',
            email: 'no-reply@strapi.io',
          },
          response_email: '',
          object: 'Reset password',
          message: `<p>We heard that you lost your password. Sorry about that!</p>

<p>But don’t worry! You can use the following link to reset your password:</p>

<p><%= URL %>?code=<%= TOKEN %></p>

<p>Thanks.</p>`,
        },
      },
      email_confirmation: {
        display: 'Email.template.email_confirmation',
        icon: 'check-square',
        options: {
          from: {
            name: 'Administration Panel',
            email: 'no-reply@strapi.io',
          },
          response_email: '',
          object: 'Account confirmation',
          message: `<p>Thank you for registering!</p>

<p>You have to confirm your email address. Please click on the link below.</p>

<p><%= URL %>?confirmation=<%= CODE %></p>

<p>Thanks.</p>`,
        },
      },
    };

    await pluginStore.set({ key: 'email', value });
  }

  if (!(await pluginStore.get({ key: 'advanced' }))) {
    const host = strapi.config.get('server.host');
    const port = strapi.config.get('server.port');

    const uri = `http://${host}:${port}/admin`;

    const value = {
      unique_email: true,
      allow_register: true,
      email_confirmation: false,
      email_confirmation_redirection: uri,
      email_reset_password: uri,
      default_role: 'authenticated',
    };

    await pluginStore.set({ key: 'advanced', value });
  }

  await strapi.plugins['users-permissions'].services.userspermissions.initialize();

  if (!_.get(strapi.plugins['users-permissions'], 'config.jwtSecret')) {
    const jwtSecret = uuid();
    _.set(strapi.plugins['users-permissions'], 'config.jwtSecret', jwtSecret);

    strapi.reload.isWatching = false;

    await strapi.fs.writePluginFile(
      'users-permissions',
      'config/jwt.js',
      `module.exports = {\n  jwtSecret: process.env.JWT_SECRET || '${jwtSecret}'\n};`
    );

    strapi.reload.isWatching = true;
  }
};
