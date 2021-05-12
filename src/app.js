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


/*
drop down
add alerts
add notifications
make mobile friendly
*/

///////////Time/date stuff//////////////

let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();
let day = date.getDate();
let hour = date.getHours();
let min = date.getMinutes();
let sec = date.getSeconds();

let prevHour;
let oldHr;
let sixHrs;
let prevDay;
let oneDay;
let twoDay;
let sixDay;

if (day === 0) {
  prevDay = 6;
} else {
  prevDay = day - 1;
};

if ((hour - 6 ) < 0) {
  sixHrs = (hour - 6) + 24;
  sixDay = prevDay;
} else {
  sixHrs = hour - 6;
  sixDay = day;
};

if (hour === 0) {
  prevHour = 23;
  oneDay = prevDay;
} else {
  prevHour = hour - 1;
  oneDay = day;
};

if ((hour - 2 ) < 0) {
  oldHr = (hour - 2) + 24;
  twoDay = prevDay;
} else {
  oldHr = hour - 2;
  twoDay = day;
};

let startDate = new Date(year, month, day, hour, 0, sec);
let prevDate = new Date(year, month, oneDay, prevHour, min, sec);
let oldDate = new Date(year, month, twoDay, oldHr, 0, sec );
let sixDate = new Date(year, month, sixDay, sixHrs, 0, sec );

let startTS = startDate.getTime();
let curTS = date.getTime();
let prevTS = prevDate.getTime();
let oldTS = oldDate.getTime();
let sixTS = sixDate.getTime();

/////////////////////Back End///////////////////////

async function getCurVol(pair) {
  try {
    const res = await fetch('https://api.binance.com/api/v3/klines?symbol=' + pair + '&interval=1h&startTime=' + prevTS + '&endTime=' + curTS);
    const data = await res.json();
    return data[0][5];
  } catch (error) {
    console.error(error);
  }
};

function getOldVol(pair) {
  fetch('https://api.binance.com/api/v3/klines?symbol=' + pair + '&interval=1h&startTime=' + oldTS + '&endTime=' + prevTS).then(function(res) {
    return res.json();
  }).then(function(data) {
    let oldVol = data[0][5];
    console.log(oldVol);
  }).catch(function(err) {
    console.warn('Something went wrong.', err);
  });
};

async function getPrice(pair) {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=' + pair);
    const data = await res.json();
    return data.price;
  } catch (error) {
    console.error(error);
  }
};

let tracking = false;
const coins = [];
let interval;

function startTracking(int) {
  //TODO
  tracking = true;
  document.querySelector('.xBtn').disabled = true;
  document.querySelector('.xBtn').classList.add('disabled');
  coins.forEach(coin => {
    document.querySelector(`#${coin}`).disabled = true;
    document.querySelector(`#${coin}`).classList.add('disabled');
  });
  console.log(`tracking every ${int} seconds`);
}

function stopTracking() {
  //TODO
  tracking = false;
  console.log('tracking stopped');
}

///////////////Front End//////////////////

function addCoin(pair) {
  coins.push(pair);

  displayBlankCoins();
}

function deleteCoin(pair) {
  const shitCoin = coins.indexOf(pair);
  coins.splice(shitCoin, 1);

  displayBlankCoins();
}

function displayBlankCoins() {
  document.querySelector('.coinBox').innerHTML = `
  <p class="labels">
    <span class="pairlabel">Pair</span>
    <span class="priceLabel">Price</span>
    <span class="statLabel">Price %</span>
    <span class="volLabel">Vol</span>
    <span class="statLabel">Vol %</span>
    <span class="removeLabel">Remove</span>
  </p>
  <hr class="hr">
  <div class="item">
    <span class="pair">BTCUSDT</span>
    <span id="btcP" class="price">--</span>
    <span class="priceP">--</span>
    <span id="btcV" class="vol">--</span>
    <span class="volP">--</span>
    <button class="xBtn" type="submit" name="remove">X</button>
  </div>
  `;

  coins.forEach(coin => {
    const html = `
      <div class="item">
        <span class="pair">${coin}</span>
        <span id="${coin}P" class="price">--</span>
        <span class="priceP">--</span>
        <span id="${coin}V" class="vol">--</span>
        <span class="volP">--</span>
        <button id="${coin}" class="xBtn" type="submit" name="remove">X</button>
      </div>
    `;
    document.querySelector(".coinBox").insertAdjacentHTML('beforeend', html);
  });

  for (let i = 0; i < document.querySelectorAll('.xBtn').length; i++) {
    document.querySelectorAll('.xBtn')[i].addEventListener("click", function(event) {
      const pair = event.target.id
      deleteCoin(pair);
    });
  }
}

async function displayData() {
  const btcPData = await getPrice('BTCUSDT');
  const btcVData = await getCurVol('BTCUSDT');
  const btcPrice = btcPData.substring(0, 8);
  const btcVol = btcVData.substring(0, 8);
  document.querySelector('#btcP').innerHTML = btcPrice;
  document.querySelector('#btcV').innerHTML = btcVol;

  coins.forEach(async(coin) => {
    const priceData = await getPrice(coin);
    const volData = await getCurVol(coin);
    const price = priceData.substring(0, 8);
    const volume = volData.substring(0, 8);
    document.querySelector(`#${coin}P`).innerHTML = price;
    document.querySelector(`#${coin}V`).innerHTML = volume;
  });
}

document.querySelector('.add').addEventListener('click', function() {
  let userInput = document.querySelector('.coinInput').value;
  let pairing = userInput.toUpperCase();
  addCoin(pairing);
  document.querySelector('.coinInput').value = '';
});

document.querySelector('.coinInput').addEventListener('keydown', function(event) {
  if (event.key === "Enter") {
    document.querySelector('.add').click();
  }
});

document.querySelector('.intervals').addEventListener('click', function(event) {
  interval = parseInt(document.querySelector(`#${event.target.id}`).innerHTML);
  document.querySelector('.dropBtn').innerHTML = document.querySelector(`#${event.target.id}`).innerHTML;
});

document.querySelector('.switch').addEventListener('click', function() {
  if (document.querySelector('.switch').textContent === 'II') {
    document.querySelector('.switch').textContent = '>';
    document.querySelector('.add').classList.remove('disabled');
    document.querySelector('.add').disabled = false;
    document.querySelector('h3').classList.remove('disabled');
    document.querySelector('.coinInput').disabled = false;
    document.querySelector('.dropdown').classList.remove('noHover');
    document.querySelector('.dropBtn').style.color = '#f3ecce';
    document.querySelector('.dropBtn').innerHTML = '--'

    stopTracking();
    displayBlankCoins();
  } else {
    document.querySelector('.switch').textContent = 'II';
    document.querySelector('.add').disabled = true;
    document.querySelector('.add').classList.add('disabled');
    document.querySelector('h3').classList.add('disabled');
    document.querySelector('.coinInput').disabled = true;
    document.querySelector('.dropdown').classList.add('noHover');
    document.querySelector('.dropBtn').style.color = 'grey';

    startTracking(interval);
    displayData();
  };
});


/////////////////////////////////////////






