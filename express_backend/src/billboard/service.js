const cheerio = require("cheerio");

const { billboardAxios } = require("./client");
const { handleTracks_v2 } = require("../common/helper");

const api = billboardAxios();

async function getBillBoardChartsSong(chartName) {
  try {
    const requestURL = `${"charts/"}${chartName}`;
    let final_track_detail = new Array();
    // console.log("Request for billboard: ", requestURL)

    let billboard_response = await api.get(requestURL);
    // console.log("billboardRes: ", billboard_response);

    if (billboard_response && billboard_response.status == 200) {
      let html_doc = billboard_response.data;
      const $ = cheerio.load(html_doc);

      let chartData = new Array();
      let rank = 1;

      $(".o-chart-results-list__item").each(async (i, el) => {
        const song = $(el).find("h3.c-title").text().trim();

        const artist = $(el).find("span.c-label").first().text().trim();

        if (song && artist) {
          chartData.push({ song, artist, rank });
          rank += 1;
        }
      });

      let res = await handleTracks_v2(chartData.slice(0, 30), chartName, true);

      handleTracks_v2(chartData.slice(30, chartData.length), chartName, true);

      return { status: 200, tracks: res };
    }
    return [];
  } catch (error) {
    console.log(
      "Error in fetching songs for ",
      chartName,
      " from bnillboard: ",
      error
    );
    return error;
  }
}

module.exports = { getBillBoardChartsSong };
