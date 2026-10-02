<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="ar" dir="rtl">
      <head>
        <title>خريطة الموقع XML Sitemap | برستيج لإدارة وتشغيل الفنادق</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #F8F7F4;
            color: #1c1917;
            margin: 0;
            padding: 30px 20px;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            border: 1px solid #E8E2D8;
            padding: 32px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          }
          .header {
            border-bottom: 2px solid #F3EDE2;
            padding-bottom: 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
          }
          .title-area h1 {
            font-size: 22px;
            font-weight: 800;
            color: #1c1917;
            margin: 0 0 6px 0;
          }
          .title-area p {
            font-size: 13px;
            color: #78716c;
            margin: 0;
          }
          .badge {
            background: #FAF5EA;
            color: #B38A34;
            border: 1px solid #E6D5B8;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: right;
          }
          th {
            background: #FAF8F5;
            color: #57534e;
            font-weight: 700;
            padding: 12px 16px;
            border-bottom: 2px solid #E8E2D8;
          }
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #F5F0E8;
            color: #292524;
          }
          tr:hover td {
            background-color: #FDFAF4;
          }
          a {
            color: #B38A34;
            text-decoration: none;
            font-weight: 600;
            word-break: break-all;
          }
          a:hover {
            color: #8C6B24;
            text-decoration: underline;
          }
          .priority-tag {
            display: inline-block;
            background: #EFEFEF;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            color: #444;
          }
          .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #E8E2D8;
            font-size: 11px;
            color: #a8a29e;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title-area">
              <h1>خريطة الموقع المعتمدة (XML Sitemap)</h1>
              <p>شركة برستيج لإدارة وتشغيل الفنادق • فهرس الروابط لمحركات البحث Google</p>
            </div>
            <div class="badge">
              عدد الروابط المفهرسة: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 55%;">رابط الصفحة (URL)</th>
                <th style="width: 15%;">الأولوية (Priority)</th>
                <th style="width: 15%;">التحديث (Changefreq)</th>
                <th style="width: 15%;">تاريخ التعديل (Lastmod)</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <xsl:variable name="itemURL">
                      <xsl:value-of select="sitemap:loc"/>
                    </xsl:variable>
                    <a href="{$itemURL}" target="_blank">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <span class="priority-tag">
                      <xsl:value-of select="sitemap:priority"/>
                    </span>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <div class="footer">
            تم إنشاء هذه الخريطة القياسية برمجياً للتوافق التام مع محركات البحث العالمية Google Search Console.
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
