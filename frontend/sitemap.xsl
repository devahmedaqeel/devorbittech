<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>XML Sitemap | Dev Orbit Tech</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #334155;
            background: #f8fafc;
            margin: 0;
            padding: 30px 20px;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            padding: 30px;
            border: 1px solid #e2e8f0;
          }
          h1 {
            color: #0f172a;
            font-size: 24px;
            margin: 0 0 8px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          p {
            color: #64748b;
            font-size: 14px;
            margin: 0 0 24px;
            line-height: 1.5;
          }
          .stats {
            background: #f1f5f9;
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            display: inline-block;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 12px 14px;
            border-bottom: 2px solid #e2e8f0;
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid #f1f5f9;
            word-break: break-all;
          }
          tr:hover td {
            background: #f8fafc;
          }
          a {
            color: #0284c7;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            background: #e0f2fe;
            color: #0369a1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Dev Orbit Tech — XML Sitemap</h1>
          <p>This is the official search engine XML sitemap for <strong>Dev Orbit Tech</strong> (<a href="https://devorbit.tech">https://devorbit.tech</a>). Generated for Google Search Console, Bing Webmaster Tools, and search crawlers.</p>
          <div class="stats">
            Total Indexed URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 55%;">URL</th>
                <th style="width: 15%;">Last Modified</th>
                <th style="width: 15%;">Change Frequency</th>
                <th style="width: 15%;">Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <xsl:variable name="itemURL">
                      <xsl:value-of select="sitemap:loc"/>
                    </xsl:variable>
                    <a href="{$itemURL}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><span class="badge"><xsl:value-of select="sitemap:priority"/></span></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
