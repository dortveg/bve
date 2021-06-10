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
make mobile friendly
5 a row (1) or 2 a row (5) alerts, or adjustable; take out 15??; use array and add 'yes' or 'no' on every tick to check
create individual dropdowns within main drop for individual notifications, create at coin add
*/

///////////Time/date stuff//////////////

let date;
let year;
let month;
let day;
let hour;
let min;
let sec;

let prevHour;
let oldHr;
let sixHrs;
let prevDay;
let oneDay;
let twoDay;
let sixDay;

let startDate;
let prevDate;
let oldDate;
let sixDate;

let startTS;
let curTS;
let prevTS;
let oldTS;
let sixTS;

function setDates() {
  date = new Date();
  year = date.getFullYear();
  month = date.getMonth();
  day = date.getDate();
  hour = date.getHours();
  min = date.getMinutes();
  sec = date.getSeconds();

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

  startDate = new Date(year, month, day, hour, 0, sec);
  prevDate = new Date(year, month, oneDay, prevHour, min, sec);
  oldDate = new Date(year, month, twoDay, oldHr, 0, sec );
  sixDate = new Date(year, month, sixDay, sixHrs, 0, sec );
  startTS = startDate.getTime();
  curTS = date.getTime();
  prevTS = prevDate.getTime();
  oldTS = oldDate.getTime();
  sixTS = sixDate.getTime();
}

setDates();

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

async function getAveVol(pair) {
  try {
    const res = await fetch('https://api.binance.com/api/v3/klines?symbol=' + pair + '&interval=1h&startTime=' + sixTS + '&endTime=' + prevTS);
    const data = await res.json();
    // const vol1 = parseFloat(data[0][5]);
    // const vol2 = parseFloat(data[1][5]);
    const vol1 = parseFloat(data[2][5]);
    const vol2 = parseFloat(data[3][5]);
    const vol3 = parseFloat(data[4][5]);
    const ave = ((vol1 + vol2 + vol3) / 3);
    return ave;
  } catch (error) {
    console.error(error);
  }
};

async function get24P(pair) {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=' + pair);
    const data = await res.json();
    return data.priceChangePercent;
  } catch (error) {
    console.error(error);
  }
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

let tracking;
let ticker;
const coins = [];
let interval = 1;
const alertSound = new Audio('src/sound/boop.wav');
let sounds = true;
let alertPoint = 1.0;
const notifications = [];

function Coin(pair) {
  this.name = pair;
  this.index = 0;
  this.curPrice = 0;
  this.lastPrice = 0;
  this.curVol = 0;
  this.lastVol = 0;
  this.aVm = 0;
}

function startTracking(int) {
  let ms = int * 60000;
  document.querySelector('.xBtn').disabled = true;
  document.querySelector('.xBtn').classList.add('disabled');
  coins.forEach(coin => {
    document.querySelector(`#${coin.name}`).disabled = true;
    document.querySelector(`#${coin.name}`).classList.add('disabled');
  });
  ticker = setInterval(displayTickData, 4000);
  tracking = setInterval(displayIntData, ms);
}

function stopTracking() {
  clearInterval(ticker);
  clearInterval(tracking);
}

///////////////Front End//////////////////

function addCoin(pair) {
  pair = new Coin(pair);
  coins.push(pair);

  displayBlankCoins();
}

function deleteCoin(pair) {
  let shitCoin;
  coins.forEach(coin => {
    if (coin.name === pair) {
      shitCoin = coin.index;
    }
  });
  coins.splice(shitCoin, 1);

  displayBlankCoins();
}

function displayBlankCoins() {
  let counter = 0;
  if (coins.length === 0) {
    document.querySelector('.coinBox').innerHTML = `
    <p class="labels">
      <span class="pairlabel">Pair</span>
      <span class="priceLabel">Price</span>
      <span class="statLabel">24hr%</span>
      <span class="statLabel">${interval}min%</span>
      <span class="volLabel">CurVol/Min | AveVol/Min</span>
      <span class="removeLabel">Remove</span>
    </p>
    <hr class="hr">
    <h2 class="placehold">Click the + button or press Enter to add a coin pair.</h2>
    `;
    document.querySelector('.switch').classList.add('disabled');
    document.querySelector('.switch').disabled = true;
  } else {
    document.querySelector('.coinBox').innerHTML = `
    <p class="labels">
      <span class="pairlabel">Pair</span>
      <span class="priceLabel">Price</span>
      <span class="statLabel">24hr%</span>
      <span class="statLabel">${interval}min%</span>
      <span class="volLabel">CurVol/Min | AveVol/Min</span>
      <span class="removeLabel">Remove</span>
    </p>
    <hr class="hr">
    `;
    document.querySelector('.switch').classList.remove('disabled');
    document.querySelector('.switch').disabled = false;
  };

  coins.forEach(coin => {
    coin.index = counter;
    counter++;
    const html = `
      <div class="item">
        <span class="pair">${coin.name}</span>
        <span id="${coin.name}P" class="price">--</span>
        <span id="${coin.name}DP" class="dP">--</span>
        <span id="${coin.name}PP" class="priceP">--</span>
        <span id="${coin.name}V" class="vol">-- | --</span>
        <button id="${coin.name}" class="xBtn" type="submit" name="remove">X</button>
      </div>
    `;
    document.querySelector(".coinBox").insertAdjacentHTML('beforeend', html);
  });

  for (let i = 0; i < document.querySelectorAll('.xBtn').length; i++) {
    document.querySelectorAll('.xBtn')[i].addEventListener("click", function(event) {
      const pair = event.target.id;
      deleteCoin(pair);
    });
  }
}

async function initData() {
  coins.forEach(async(coin) => {
    const priceData = await getPrice(coin.name);
    const volData = await getCurVol(coin.name);
    coin.curPrice = priceData.substring(0, 8);
    coin.curVol = volData.substring(0, 8);
    const dayPData = await get24P(coin.name);
    const pricePNum = parseFloat(dayPData);
    const priceP = pricePNum.toFixed(2);

    if (priceP > 0) {
      document.querySelector(`#${coin.name}DP`).style.color = '#05b114';
      document.querySelector(`#${coin.name}DP`).innerHTML = `+${priceP}%`;
    } else {
      document.querySelector(`#${coin.name}DP`).style.color = '#d2121a';
      document.querySelector(`#${coin.name}DP`).innerHTML = `${priceP}%`;
    };

    const aveVol = await getAveVol(coin.name);
    const aveVolMin = aveVol / 60;
    coin.aVm = aveVolMin.toFixed();

    document.querySelector(`#${coin.name}P`).innerHTML = coin.curPrice;
    document.querySelector(`#${coin.name}V`).innerHTML = `xxxxxx/min | ${coin.aVm}/min`;
  });
}

async function displayTickData() {
  if (min === 0 && sec < 5) {
    coins.forEach(async(coin) => {
      const aveVol = await getAveVol(coin.name);
      const aveVolMin = aveVol / 60;
      coin.aVm = aveVolMin.toFixed();
      coin.curVol = 0;
    });
  };

  coins.forEach(async(coin) => {
    const priceData = await getPrice(coin.name);
    const dayPData = await get24P(coin.name);
    const price = priceData.substring(0, 8);
    const pricePNum = parseFloat(dayPData);
    const priceP = pricePNum.toFixed(2);
    
    document.querySelector(`#${coin.name}P`).innerHTML = price;
    if (priceP > 0) {
      document.querySelector(`#${coin.name}DP`).style.color = '#05b114';
      document.querySelector(`#${coin.name}DP`).innerHTML = `+${priceP}%`;
    } else {
      document.querySelector(`#${coin.name}DP`).style.color = '#d2121a';
      document.querySelector(`#${coin.name}DP`).innerHTML = `${priceP}%`;
    };
  });

  setDates();
}

async function displayIntData() {
  coins.forEach(async(coin) => {
    coin.lastPrice = coin.curPrice;
    coin.lastVol = coin.curVol;
    document.querySelector(`#${coin.name}V`).classList.remove('hot');

    const priceData = await getPrice(coin.name);
    const volData = await getCurVol(coin.name);
    coin.curPrice = priceData.substring(0, 8);
    coin.curVol = volData.substring(0, 8);

    const priceDif = (coin.curPrice - coin.lastPrice) / coin.lastPrice;
    const volFlow = (coin.curVol - coin.lastVol);
    const cVP = (volFlow - coin.aVm) / coin.aVm;
    const curVP = (cVP * 100).toFixed();
    const pDif = (priceDif * 100).toFixed(3);
    const vF = volFlow.toFixed();

    if (cVP >= alertPoint && sounds === true) {
      alertSound.play();
      document.querySelector(`#${coin.name}V`).classList.add('hot');
      if (notifications.length >= 10) {
        notifications.pop();
      }
      if (min < 10) {
        notifications.unshift(`${coin.name} +${curVP}%v/m at $${coin.curPrice} on ${hour}:0${min}`);
      } else {
        notifications.unshift(`${coin.name} +${curVP}%v/m at $${coin.curPrice} on ${hour}:${min}`);
      }
      document.querySelector('#noteDrop').classList.add('pulsing');
    } else if (cVP >= alertPoint && sounds === false) {
      document.querySelector(`#${coin.name}V`).classList.add('hot');
      if (notifications.length >= 10) {
        notifications.pop();
      }
      if (min < 10) {
        notifications.unshift(`${coin.name} +${curVP}%v/m at $${coin.curPrice} on ${hour}:0${min}`);
      } else {
        notifications.unshift(`${coin.name} +${curVP}%v/m at $${coin.curPrice} on ${hour}:${min}`);
      }
      document.querySelector('#noteDrop').classList.add('pulsing');
    };

    document.querySelector(`#${coin.name}V`).innerHTML = `${vF}/min | ${coin.aVm}/min`;

    if (pDif > 0) {
      document.querySelector(`#${coin.name}PP`).style.color = '#05b114';
      document.querySelector(`#${coin.name}PP`).innerHTML = `+${pDif}%`;
    } else {
      document.querySelector(`#${coin.name}PP`).style.color = '#d2121a';
      document.querySelector(`#${coin.name}PP`).innerHTML = `${pDif}%`;
    };

    if (notifications.length === 0) {
      document.querySelector('.notifications').innerHTML = `
      <hr class="shr">
      <h4 style="color: grey;">No notifications yet.</h4>
      `;
    } else {
      document.querySelector('.notifications').innerHTML = `
      <hr class="shr">
      `;
      notifications.forEach(note => {
        const html = `
          <h4>${note}</h4>
        `;
        document.querySelector(".notifications").insertAdjacentHTML('beforeend', html);
      });
    };
  });
}

document.querySelector('.add').addEventListener('click', function() {
  let userInput = document.querySelector('.coinInput').value;
  let pairing = userInput.toUpperCase();
  
  document.querySelector('.coinInput').value = '';

  if (document.querySelector(`#${pairing}`)) {
    alert('This pair was already added');
  } else {
    fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pairing}`).then(function(res) {
    addCoin(pairing);
  }).catch(function(err) {
    alert('Please enter a valid coin pairing. Make sure not to use dashes or slashes.');
  });
  }
});

document.querySelector('.coinInput').addEventListener('keydown', function(event) {
  if (event.key === "Enter") {
    document.querySelector('.add').click();
  }
});

document.querySelector('#noteDrop').addEventListener('mouseenter', function() {
  if (document.querySelector('.pulsing')) {
    document.querySelector('#noteDrop').classList.remove('pulsing');
  }
});

let intOption = 'one';
document.querySelector('.intervals').addEventListener('click', function(event) {
  interval = parseInt(document.querySelector(`#${event.target.id}`).innerHTML);
  document.querySelector(`#${intOption}`).classList.remove('selected');
  document.querySelector(`#${event.target.id}`).classList.add('selected');
  intOption = event.target.id;
});

let alertOption = 'dbl';
document.querySelector('.alertP').addEventListener('click', function(event) {
  alertPoint = parseFloat(document.querySelector(`#${event.target.id}`).innerHTML) / 100;
  document.querySelector(`#${alertOption}`).classList.remove('selected');
  document.querySelector(`#${event.target.id}`).classList.add('selected');
  alertOption = event.target.id;
});

let soundOption = 'soundon';
document.querySelector('.alertS').addEventListener('click', function(event) {
  if (event.target.id === 'soundon') {
    sounds = true;
  } else if (event.target.id ==='soundoff') {
    sounds = false;
  };
  document.querySelector(`#${soundOption}`).classList.remove('selected');
  document.querySelector(`#${event.target.id}`).classList.add('selected');
  soundOption = event.target.id;
});

document.querySelector('.switch').addEventListener('click', function() {
  if (document.querySelector('.switch').textContent === 'II') {
    document.querySelector('.switch').textContent = '>';
    document.querySelector('.switch').classList.add('disabled');
    document.querySelector('.switch').disabled = true;
    document.querySelector('.add').classList.remove('disabled');
    document.querySelector('.add').disabled = false;
    document.querySelector('.coinInput').disabled = false;
    document.querySelector('.intervals').classList.remove('noClick');
    document.querySelector('.intervals').style.color = '#F7F2DE';

    stopTracking();
    displayBlankCoins();
  } else {
    document.querySelector('.switch').textContent = 'II';
    document.querySelector('.add').disabled = true;
    document.querySelector('.add').classList.add('disabled');
    document.querySelector('.coinInput').disabled = true;
    document.querySelector('.intervals').classList.add('noClick');
    document.querySelector('.intervals').style.color = 'dimgrey';

    initData();
    startTracking(interval);
  };
});
