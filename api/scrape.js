import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // 1. リクエストからSUUMOのURLを取得
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // 2. axiosでSUUMOのページにアクセスしてHTMLを取得
    const { data: html } = await axios.get(url, {
      // Bot対策のふりをするためのヘッダー情報
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 3. cheerioでHTMLを読み込み、必要な情報を抜き出す
    const $ = cheerio.load(html);

    const propertyName = $('h1.section_h1-header-title').text().trim();
    const price = $('.property_view_note-emphasis').eq(0).text().trim();
    const address = $('th:contains("所在地")').next('td').text().trim();

    // メインの画像URLを取得
    const mainImage = $('.property_view_object-img img').attr('src');

    // 4. 抜き出した情報をJSON形式で返す
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // キャッシュ設定
    res.status(200).json({
      name: propertyName,
      price: price,
      address: address,
      imageUrl: mainImage,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch property data', details: error.message });
  }
}
