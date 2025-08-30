// 修正版の api/scrape.js
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // 1. リクエストからSUUMOのURLを取得
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 2. axiosでSUUMOのページにアクセスしてHTMLを取得
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 3. cheerioでHTMLを読み込み、必要な情報を抜き出す
    const $ = cheerio.load(html);

    const propertyName = $('h1.section_h1-header-title').text().trim();
    const price = $('.property_view_note-emphasis').eq(0).text().trim();
    const address = $('th:contains("所在地")').next('td').text().trim();
    const mainImage = $('.property_view_object-img img').attr('src');

    // 値が一つも取れなかった場合はエラーとみなす
    if (!propertyName && !price && !address) {
      throw new Error('Could not find property details. The page structure may have changed.');
    }

    // 4. 抜き出した情報をJSON形式で返す
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    res.status(200).json({
      name: propertyName || '取得できませんでした',
      price: price || '取得できませんでした',
      address: address || '取得できませんでした',
      imageUrl: mainImage || '取得できませんでした',
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch property data', details: error.message });
  }
};
