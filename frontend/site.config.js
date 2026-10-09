'use strict';

/**
 * Dev Orbit Tech — Central Website & SEO Configuration
 * Production Domain: https://devorbit.tech
 */

const siteUrl = process.env.SITE_URL || 'https://devorbit.tech';

module.exports = {
  siteUrl: siteUrl.replace(/\/+$/, ''),
  siteName: 'Dev Orbit Tech',
  founder: 'Engr. Ahmed Aqeel',
  officialEmail: 'official.devorbittech@gmail.com',
  officialPhone: '+92 316 1893004',
  legacyDomains: [
    'https://devorbittech.vercel.app',
    'https://devorbittech.org',
    'http://devorbittech.vercel.app',
    'http://devorbittech.org',
    'devorbittech.vercel.app',
    'devorbittech.org'
  ]
};
