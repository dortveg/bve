//                  END OF TERMS AND CONDITIONS

// Big Volume Energy (BVE) - Crypto price/volume momentum tracker
// Copyright (C) 2021  George Tevdo

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.


// native node server boilercode from MDN
const http = require('http');
const fs = require('fs');
const path = require('path');

http
  .createServer((request, response) => {
    console.log(`request ${request.url}`);

    let filePath = `.${request.url}`;
    if (filePath === './') {
      filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm',
    };

    const contentType = mimeTypes[extname] ?? 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          fs.readFile('./404.html', (error, content) => {
            response.writeHead(404, { 'Content-Type': 'text/html' });
            response.end(content, 'utf-8');
          });
        } else {
          response.writeHead(500);
          response.end(
            `Sorry, check with the site admin for error: ${error.code} ..\n`
          );
        }
      } else {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
      }
    });
  })
  .listen(80);
console.log('Server running at http://127.0.0.1:80/');
///////////////////////////////////////////////////////////////////////////


///////////Time/date stuff//////////////

// let date;
// let year;
// let month;
// let day;
// let hour;
// let min;
// let sec;

// let prevHour;
// let foHrs;
// let prevDay;
// let oneDay;
// let foDay;

// let startDate;
// let prevDate;
// let foDate;

// let startTS;
// let curTS;
// let prevTS;
// let foTS;

// function setDates() {
//   date = new Date();
//   year = date.getFullYear();
//   month = date.getMonth();
//   day = date.getDate();
//   hour = date.getHours();
//   min = date.getMinutes();
//   sec = date.getSeconds();

//   if (day === 0) {
//     prevDay = 6;
//   } else {
//     prevDay = day - 1;
//   };

//   if ((hour - 4 ) < 0) {
//     foHrs = (hour - 4) + 24;
//     foDay = prevDay;
//   } else {
//     foHrs = hour - 6;
//     foDay = day;
//   };

//   if (hour === 0) {
//     prevHour = 23;
//     oneDay = prevDay;
//   } else {
//     prevHour = hour - 1;
//     oneDay = day;
//   };

//   startDate = new Date(year, month, day, hour, 0, sec);
//   prevDate = new Date(year, month, oneDay, prevHour, min, sec);
//   foDate = new Date(year, month, foDay, foHrs, 0, sec );
//   startTS = startDate.getTime();
//   curTS = date.getTime();
//   prevTS = prevDate.getTime();
//   foTS = foDate.getTime();
// }

// setDates();

// ////////////////////////////////////////////////

// async function getCurVol(pair) {
//   try {
//     const res = await fetch('https://api.binance.com/api/v3/klines?symbol=' + pair + '&interval=1h&startTime=' + prevTS + '&endTime=' + curTS);
//     const data = await res.json();
//     return data[0][5];
//   } catch (error) {
//     console.error(error);
//   }
// };

// async function getAveVol(pair) {
//   try {
//     const res = await fetch('https://api.binance.com/api/v3/klines?symbol=' + pair + '&interval=1h&startTime=' + foTS + '&endTime=' + prevTS);
//     const data = await res.json();
//     const vol1 = parseFloat(data[0][5]);
//     const vol2 = parseFloat(data[1][5]);
//     const vol3 = parseFloat(data[2][5]);
//     const aveVol = ((vol1 + vol2 + vol3) / 3);
//     return aveVol;
//   } catch (error) {
//     console.error(error);
//   }
// };

// async function get24hrPercent(pair) {
//   try {
//     const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=' + pair);
//     const data = await res.json();
//     return data.priceChangePercent;
//   } catch (error) {
//     console.error(error);
//   }
// };

// async function getPrice(pair) {
//   try {
//     const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=' + pair);
//     const data = await res.json();
//     return data.price;
//   } catch (error) {
//     console.error(error);
//   }
// };

// let tracking;
// let ticker;
// const coins = [];
// let interval = 1;
// let sounds = true;
// let alertPoint = 1.0;
// let intervalOption = 'one';
// let alertOption = 'dbl';
// let soundOption = 'soundon';

// function Coin(pair) {
//   this.name = pair;
//   this.index = 0;
//   this.curPrice = 0;
//   this.lastPrice = 0;
//   this.curVol = 0;
//   this.lastVol = 0;
//   this.aVm = 0;
//   this.oneTicks = [];
//   this.fiveTicks = [];
//   this.logs = [];
//   this.alert = 'higher';
//   this.alertPrice = 0;
// }

// function addCoin(pair) {
//   pair = new Coin(pair);
//   coins.push(pair);

//   displayBlankCoins();
// }

// function deleteCoin(pair) {
//   let shitCoin;
//   coins.forEach(coin => {
//     if (coin.name === pair) {
//       shitCoin = coin.index;
//     }
//   });
//   coins.splice(shitCoin, 1);

//   displayBlankCoins();
// }
