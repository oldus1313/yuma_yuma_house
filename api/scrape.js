// デバッグモード付きの最終版 api/scrape.js
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // "debug"というパラメータも受け取れるようにする
  const { url, debug } = req.query; 

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

    // ★デバッグモードの処理を追加★
    // URLの最後に &debug=true を付けると、ここの処理が動く
    if (debug === 'true') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(html); // HTMLをそのままテキストとして返す
    }

    // --- 通常のスクレイピング処理 ---
    const $ = cheerio.load(html);

    const propertyName = $('.property_main-title').text().trim();
    let price = $('.property_view_note-emphasis').first().text().trim();
    if (!price) {
      price = $('th:contains("賃料")').next().text().trim();
    }
    const address = $('th:contains("所在地")').next('td').text().trim();
    const mainImage = $('.property_view_object-img img').attr('src');

    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
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
