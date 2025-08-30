// 改善版の api/scrape.js
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    const $ = cheerio.load(html);

    // --- 目印（セレクタ）を改善 ---
    // 物件名：より具体的に狙う
    const propertyName = $('.property_main-title').text().trim();

    // 家賃：複数の候補を探す
    let price = $('.property_view_note-emphasis').first().text().trim();
    if (!price) {
      price = $('th:contains("賃料")').next().text().trim();
    }

    // 所在地：これもテーブルから探す
    const address = $('th:contains("所在地")').next('td').text().trim();

    // 画像URL：より具体的に狙う
    const mainImage = $('.property_view_object-img img').attr('src');

    // 抜き出した情報をJSON形式で返す
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate'); // キャッシュを短く
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
