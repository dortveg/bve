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
add alerts
add notifications
possibly more tracking settings for user? 
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
const coins = [];
let interval;
const alertSound = new Audio('src/alert.wav');
let sounds = true;

function Coin(pair) {
  this.name = pair;
  this.index = 0;
  this.curPrice = 0;
  this.lastPrice = 0;
  this.hrlyPrice = 0;
  this.curVol = 0;
  this.lastVol = 0;
  this.aVm = 0;
}

function startTracking(int) {
  let ms = int * 20000; //faster for testing, for now
  document.querySelector('.xBtn').disabled = true;
  document.querySelector('.xBtn').classList.add('disabled');
  coins.forEach(coin => {
    document.querySelector(`#${coin.name}`).disabled = true;
    document.querySelector(`#${coin.name}`).classList.add('disabled');
  });
  tracking = setInterval(displayData, ms);
  console.log(`tracking every ${int} minutes`);
}

function stopTracking() {
  clearInterval(tracking);
  console.log('tracking stopped');
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
      <span class="statLabel">Price %</span>
      <span class="volLabel">CurVol/Min | AveVol/Min</span>
      <span class="removeLabel">Remove</span>
    </p>
    <hr class="hr">
    <h2 class="placehold">Click the + button or press Enter to add a coin pair.</h2>
    `;
  } else {
    document.querySelector('.coinBox').innerHTML = `
    <p class="labels">
      <span class="pairlabel">Pair</span>
      <span class="priceLabel">Price</span>
      <span class="statLabel">Price %</span>
      <span class="volLabel">CurVol/Min | AveVol/Min</span>
      <span class="removeLabel">Remove</span>
    </p>
    <hr class="hr">
    `;
  };

  coins.forEach(coin => {
    coin.index = counter;
    counter++;
    const html = `
      <div class="item">
        <span class="pair">${coin.name}</span>
        <span id="${coin.name}P" class="price">--</span>
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

    const aveVol = await getAveVol(coin.name);
    const aveVolMin = aveVol / 60;
    const aveVMin = aveVolMin.toString();
    coin.aVm = aveVMin.substring(0, 5);
    
    document.querySelector(`#${coin.name}P`).innerHTML = coin.curPrice;
    document.querySelector(`#${coin.name}V`).innerHTML = `xxxxx/min | ${coin.aVm}/min`;
  });
}

async function displayData() {
  coins.forEach(async(coin) => {
    coin.lastPrice = coin.curPrice;
    coin.lastVol = coin.curVol;
    document.querySelector(`#${coin.name}V`).classList.remove('hot');

    const priceData = await getPrice(coin.name);
    const volData = await getCurVol(coin.name);
    coin.curPrice = priceData.substring(0, 8);
    coin.curVol = volData.substring(0, 8);

    const priceDif = (coin.curPrice - coin.lastPrice) / coin.lastPrice;
    const volFlow = (coin.curVol - coin.lastVol) * 3; //x3 for testing since faster tick

    if ((volFlow - parseFloat(coin.aVm)) / parseFloat(coin.aVm) >= .15 && sounds === true) {
      alertSound.play();
      document.querySelector(`#${coin.name}V`).classList.add('hot');
    } else if ((volFlow - parseFloat(coin.aVm)) / parseFloat(coin.aVm) >= .15 && sounds === false) {
      document.querySelector(`#${coin.name}V`).classList.add('hot');
    }

    const pDif = priceDif.toFixed(3);
    const vFlow = volFlow.toString();
    const vF = vFlow.substring(0, 5);

    document.querySelector(`#${coin.name}P`).innerHTML = coin.curPrice;
    document.querySelector(`#${coin.name}V`).innerHTML = `${vF}/min | ${coin.aVm}/min`;
    if (pDif > 0) {
      document.querySelector(`#${coin.name}PP`).style.color = '#05b114';
      document.querySelector(`#${coin.name}PP`).innerHTML = `+${pDif}%`;
    } else {
      document.querySelector(`#${coin.name}PP`).style.color = '#d2121a';
      document.querySelector(`#${coin.name}PP`).innerHTML = `${pDif}%`;
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

document.querySelector('.intervals').addEventListener('click', function(event) {
  interval = parseInt(document.querySelector(`#${event.target.id}`).innerHTML);
  document.querySelector('.dropBtn').innerHTML = document.querySelector(`#${event.target.id}`).innerHTML;
  document.querySelector('.switch').classList.remove('disabled');
  document.querySelector('.switch').disabled = false;
});

document.querySelector('.switch').addEventListener('click', function() {
  if (document.querySelector('.switch').textContent === 'II') {
    document.querySelector('.switch').textContent = '>';
    document.querySelector('.switch').classList.add('disabled');
    document.querySelector('.switch').disabled = true;
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

    initData();
    startTracking(interval);
  };
});



/////////////////////////////////////////






