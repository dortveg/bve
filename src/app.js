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
make mobile friendly???
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
let sixHrs;
let prevDay;
let oneDay;
let sixDay;

let startDate;
let prevDate;
let sixDate;

let startTS;
let curTS;
let prevTS;
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

  startDate = new Date(year, month, day, hour, 0, sec);
  prevDate = new Date(year, month, oneDay, prevHour, min, sec);
  sixDate = new Date(year, month, sixDay, sixHrs, 0, sec );
  startTS = startDate.getTime();
  curTS = date.getTime();
  prevTS = prevDate.getTime();
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
    const aveVol = ((vol1 + vol2 + vol3) / 3);
    return aveVol;
  } catch (error) {
    console.error(error);
  }
};

async function get24hrPercent(pair) {
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
const hotSound = new Audio('src/sound/volAlert.wav');
const priceSound = new Audio('src/sound/priceAlert.wav');
let sounds = true;
let alertPoint = 1.0;

function Coin(pair) {
  this.name = pair;
  this.index = 0;
  this.curPrice = 0;
  this.lastPrice = 0;
  this.curVol = 0;
  this.lastVol = 0;
  this.aVm = 0;
  this.oneTicks = [];
  this.fiveTicks = [];
  this.logs = [];
  this.alert = 'higher';
  this.alertPrice = 0;
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
    document.querySelector('.notifications').innerHTML = `
    <hr class="shr">
    <h4 class="phold">Add some coin pairs!</h4>
    `;
    document.querySelector('.coinBox').innerHTML = `
    <p class="labels">
      <span class="pairlabel">Pair</span>
      <span class="priceLabel">Price</span>
      <span class="statLabel">24hr%</span>
      <span class="intLbl">${interval}min%<span class="intTool">The price change for the interval of time that you set.</span></span>
      <span class="volLabel">CurVol/Min | AveVol/Min<span class="vmTool">This compares the volume per minute for the interval of time that you set, to the average volume per minute for the last 3 hours. The average value is updated every hour. Everytime the current vol/m ticks higher than the ave vol/m, above your set alert point, it will be highlighted and added to the log.</span></span>
      <span class="removeLabel">Remove</span>
    </p>
    <hr class="hr">
    <h2 class="placehold">Click the + button or press Enter to add a coin pair.</h2>
    `;
    document.querySelector('.switch').classList.add('disabled');
    document.querySelector('.switch').disabled = true;
    document.querySelector('.btnTool').textContent = 'Add a coin pair first.';
  } else {
    document.querySelector('.notifications').innerHTML = `
    <hr class="shr">
    `;
    document.querySelector('.coinBox').innerHTML = `
    <p class="labels">
      <span class="pairlabel">Pair</span>
      <span class="priceLabel">Price</span>
      <span class="statLabel">24hr%</span>
      <span class="intLbl">${interval}min%<span class="intTool">The price change for the interval of time that you set.</span></span>
      <span class="volLabel">CurVol/Min | AveVol/Min<span class="vmTool">This compares the volume per minute for the interval of time that you set, to the average volume per minute for the last 3 hours. The average value is updated every hour. Everytime the current vol/m ticks higher than the ave vol/m, above your set alert point, it will be highlighted and added to the log.</span></span>
      <span class="removeLabel">Remove</span>
    </p>
    <hr class="hr">
    `;
    document.querySelector('.switch').classList.remove('disabled');
    document.querySelector('.switch').disabled = false;
    document.querySelector('.btnTool').textContent = 'Start Tracking.';
  };

  coins.forEach(coin => {
    coin.index = counter;
    counter++;
    coin.alertPrice = 0;

    let logHtml;
    if (coin.logs.length === 0) {
      logHtml = `
      <div class="expandbl">
        <button id="${coin.name}X" class="expBtn">${coin.name}</button>
        <div id="${coin.name}L" class="logs">
          <span class="logLbl">${coin.name}</span>
          <span id="${coin.name}Bell" class="fakeBtn hidden">
            <img class="bell" src="src/icons/bell.svg"/>
            <span id="${coin.name}AlertTool" class="alertTool"></span>
          </span>
          <div class="alertSetup">
            <span class="alertLbl">Alert when<a id="${coin.name}AlertType" style="margin-left: 4px;margin-right: 4px" href="javascript:void(0)">${coin.alert}</a>than $</span>
            <input id="${coin.name}AP" class="priceAlert" type="text" name="interval" placeholder="TYPE IN PRICE" autocomplete="off">
            <button id="${coin.name}SA" class="alBtn"><img class="check" src="src/icons/ok.svg"/></button>
            <button id="${coin.name}RA" class="rmAlrt hidden"><img class="rmAl" src="src/icons/cancel.svg"/></button>
          </div>
          <hr class="shr">
          <div id="${coin.name}Logs">
          <h4 style="text-align: center;">No events logged yet.</h4>
          </div>
        </div>
      </div>
      `;
    } else {
      logHtml = `
      <div class="expandbl">
        <button id="${coin.name}X" class="expBtn">${coin.name}</button>
        <div id="${coin.name}L" class="logs">
          <span class="logLbl">${coin.name}</span>
          <span id="${coin.name}Bell" class="fakeBtn hidden">
            <img class="bell" src="src/icons/bell.svg"/>
            <span id="${coin.name}AlertTool" class="alertTool"></span>
          </span>
          <div class="alertSetup">
            <span class="alertLbl">Alert when<a id="${coin.name}AlertType" style="margin-left: 4px;margin-right: 4px" href="javascript:void(0)">${coin.alert}</a>than $</span>
            <input id="${coin.name}AP" class="priceAlert" type="text" name="interval" placeholder="TYPE IN PRICE" autocomplete="off">
            <button id="${coin.name}SA" class="alBtn"><img class="check" src="src/icons/ok.svg"/></button>
            <button id="${coin.name}RA" class="rmAlrt hidden"><img class="rmAl" src="src/icons/cancel.svg"/></button>
          </div>
          <hr class="shr">
          <div id="${coin.name}Logs">
          </div>
        </div>
      </div>
      `;
    }

    const coinHtml = `
      <div class="item">
        <span id="${coin.name}N" class="pair">${coin.name}</span>
        <span id="${coin.name}P" class="price">--</span>
        <span id="${coin.name}DP" class="dP">--</span>
        <span id="${coin.name}PP" class="priceP">--</span>
        <span id="${coin.name}V" class="vol">-- | --</span>
        <button id="${coin.name}" class="xBtn" type="submit" name="remove">X</button>
      </div>
    `;

    document.querySelector(".coinBox").insertAdjacentHTML('beforeend', coinHtml);
    document.querySelector(".notifications").insertAdjacentHTML('beforeend', logHtml);

    if (coin.logs.length > 0) {
      coin.logs.forEach(log => {
        const html = `
        <h4>${log}</h4>
        `;
        document.querySelector(`#${coin.name}Logs`).insertAdjacentHTML('beforeend', html);
      });
    }
  });

  for (let i = 0; i < document.querySelectorAll('.xBtn').length; i++) {
    document.querySelectorAll('.xBtn')[i].addEventListener("click", function(event) {
      const pair = event.target.id;
      deleteCoin(pair);
    });
  }

  for (let i = 0; i < document.querySelectorAll('.expBtn').length; i++) {
    document.querySelectorAll('.expBtn')[i].addEventListener('mouseenter', function(event) {
      const btn = event.target.id;
      if (document.querySelector(`#${btn}`).classList.contains('pulsing')) {
        document.querySelector(`#${btn}`).classList.remove('pulsing');
      }
    });
  }

  coins.forEach(coin => {
    document.querySelector(`#${coin.name}AlertType`).addEventListener('click', function() {
      if (document.querySelector(`#${coin.name}AlertType`).textContent === 'lower') {
        document.querySelector(`#${coin.name}AlertType`).textContent = 'higher';
        coin.alert = 'higher';
      } else {
        document.querySelector(`#${coin.name}AlertType`).textContent = 'lower';
        coin.alert = 'lower';
      }
    });

    document.querySelector(`#${coin.name}SA`).addEventListener('click', function() {
      let userInput = document.querySelector(`#${coin.name}AP`).value;
      let alertPrice = parseFloat(userInput);
      coin.alertPrice = alertPrice;
      document.querySelector(`#${coin.name}AP`).value = '';
      document.querySelector(`#${coin.name}RA`).classList.remove('hidden');
      document.querySelector(`#${coin.name}AlertTool`).innerHTML = `Alert set at: $${alertPrice}`;
      document.querySelector(`#${coin.name}Bell`).classList.remove('hidden');
    });

    document.querySelector(`#${coin.name}RA`).addEventListener('click', function() {
      coin.alertPrice = 0;
      document.querySelector(`#${coin.name}RA`).classList.add('hidden');
      document.querySelector(`#${coin.name}Bell`).classList.add('hidden');
    });

    document.querySelector(`#${coin.name}AP`).addEventListener('keydown', function(event) {
      if (event.key === "Enter") {
        document.querySelector(`#${coin.name}SA`).click();
      }
    });
  });
}

async function initData() {
  coins.forEach(async(coin) => {
    const priceData = await getPrice(coin.name);
    const volData = await getCurVol(coin.name);
    coin.curPrice = priceData.substring(0, 8);
    coin.curVol = volData.substring(0, 8);
    const dayPercentData = await get24hrPercent(coin.name);
    const convertedData = parseFloat(dayPercentData);
    const dayPricePercent = convertedData.toFixed(2);

    if (dayPricePercent > 0) {
      document.querySelector(`#${coin.name}DP`).style.color = '#05b114';
      document.querySelector(`#${coin.name}DP`).innerHTML = `+${dayPricePercent}%`;
    } else {
      document.querySelector(`#${coin.name}DP`).style.color = '#d2121a';
      document.querySelector(`#${coin.name}DP`).innerHTML = `${dayPricePercent}%`;
    };

    const aveVol = await getAveVol(coin.name);
    const aveVolMin = aveVol / 60;
    coin.aVm = aveVolMin.toFixed();

    document.querySelector(`#${coin.name}P`).innerHTML = coin.curPrice;
    document.querySelector(`#${coin.name}V`).innerHTML = `xxxxxx/min | ${coin.aVm}/min`;
  });
}

async function displayTickData() {
  setDates();
  
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
    const dayPercentData = await get24hrPercent(coin.name);
    const price = priceData.substring(0, 8);
    const convertedData = parseFloat(dayPercentData);
    const dayPricePercent = convertedData.toFixed(2);
    
    document.querySelector(`#${coin.name}P`).innerHTML = price;

    if (dayPricePercent > 0) {
      document.querySelector(`#${coin.name}DP`).style.color = '#05b114';
      document.querySelector(`#${coin.name}DP`).innerHTML = `+${dayPricePercent}%`;
    } else {
      document.querySelector(`#${coin.name}DP`).style.color = '#d2121a';
      document.querySelector(`#${coin.name}DP`).innerHTML = `${dayPricePercent}%`;
    };

    const floatPrice = parseFloat(price);
    if (coin.alertPrice !== 0) {
      if (coin.alert === 'higher') {
        if (floatPrice >= coin.alertPrice) {
          priceSound.play();
          document.querySelector('#noteDrop').classList.add('pulsing');
          document.querySelector(`#${coin.name}X`).classList.add('pulsing');
          if (min < 10) {
              coin.logs.unshift(`Alert price hit! $${price} at ${hour}:0${min}`);
          } else {
              coin.logs.unshift(`Alert Price hit! $${price} at ${hour}:${min}`);
          }
          document.querySelector(`#${coin.name}Logs`).innerHTML = '';
  
          coin.logs.forEach(log => {
            const html = `
            <h4>${log}</h4>
            `;
            document.querySelector(`#${coin.name}Logs`).insertAdjacentHTML('beforeend', html);
          });
          coin.alertPrice = 0;
          document.querySelector(`#${coin.name}RA`).classList.add('hidden');
          document.querySelector(`#${coin.name}Bell`).classList.add('hidden');
        }
      } else {
        if (floatPrice <= coin.alertPrice) {
          priceSound.play();
          document.querySelector('#noteDrop').classList.add('pulsing');
          document.querySelector(`#${coin.name}X`).classList.add('pulsing');
          if (min < 10) {
              coin.logs.unshift(`Alert price hit! $${price} at ${hour}:0${min}`);
          } else {
              coin.logs.unshift(`Alert Price hit! $${price} at ${hour}:${min}`);
          }
          document.querySelector(`#${coin.name}Logs`).innerHTML = '';
  
          coin.logs.forEach(log => {
            const html = `
            <h4>${log}</h4>
            `;
            document.querySelector(`#${coin.name}Logs`).insertAdjacentHTML('beforeend', html);
          });
          coin.alertPrice = 0;
          document.querySelector(`#${coin.name}RA`).classList.add('hidden');
          document.querySelector(`#${coin.name}Bell`).classList.add('hidden');
        }
      }
    }
  });
}

async function displayIntData() {
  coins.forEach(async(coin) => {
    coin.lastPrice = coin.curPrice;
    coin.lastVol = coin.curVol;

    if (document.querySelector(`#${coin.name}V`).classList.contains('hot')) {
      document.querySelector(`#${coin.name}V`).classList.remove('hot');
    }
    if (document.querySelector(`#${coin.name}N`).classList.contains('hot')) {
      document.querySelector(`#${coin.name}N`).classList.remove('hot');
    }

    const priceData = await getPrice(coin.name);
    const volData = await getCurVol(coin.name);
    coin.curPrice = priceData.substring(0, 8);
    coin.curVol = volData.substring(0, 8);
    const priceDiffRaw = (coin.curPrice - coin.lastPrice) / coin.lastPrice;
    const volPerMin = (coin.curVol - coin.lastVol);
    const volPerMinRate = (volPerMin - coin.aVm) / coin.aVm;
    const volPerMinPercent = (volPerMinRate * 100).toFixed();
    const priceDifference = (priceDiffRaw * 100).toFixed(3);
    const volPerMinute = volPerMin.toFixed();

    if (volPerMinRate < alertPoint) {
      if (interval === 1) {
        coin.oneTicks.push(0);

        if (coin.oneTicks.length > 10) {
          coin.oneTicks.shift();
        }
      } else if (interval === 5) {
        coin.fiveTicks.push(0);

        if (coin.fiveTicks.length > 3) {
          coin.fiveTicks.shift();
        }
      }
    }

    if (volPerMinRate >= alertPoint && sounds === true) {
      alertSound.play();
      document.querySelector(`#${coin.name}V`).classList.add('hot');

      if (interval === 1) {
        coin.oneTicks.push(1);

        if (coin.oneTicks.length > 10) {
          coin.oneTicks.shift();
          const total = coin.oneTicks.reduce((a, b) => a + b, 0);

          if (total >= 7) {
            document.querySelector(`#${coin.name}N`).classList.add('hot');
            hotSound.play();
          }
        }
      } else if (interval === 5) {
        coin.fiveTicks.push(1);

        if (coin.fiveTicks.length > 3) {
          coin.fiveTicks.shift();
          const total = coin.fiveTicks.reduce((a, b) => a + b, 0);

          if (total >= 2) {
            document.querySelector(`#${coin.name}N`).classList.add('hot');
            hotSound.play();
          }
        }
      }

      if (coin.logs.length >= 10) {
        coin.logs.pop();
      }

      if (min < 10) {
        if (priceDifference > 0) {
          coin.logs.unshift(`$${coin.curPrice} (+${priceDifference}%) and +${volPerMinPercent}%v/m at ${hour}:0${min}`);
        } else {
          coin.logs.unshift(`$${coin.curPrice} (${priceDifference}%) and +${volPerMinPercent}%v/m at ${hour}:0${min}`);
        }
      } else {
        if (priceDifference > 0) {
          coin.logs.unshift(`$${coin.curPrice} (+${priceDifference}%) and +${volPerMinPercent}%v/m at ${hour}:${min}`);
        } else {
          coin.logs.unshift(`$${coin.curPrice} (${priceDifference}%) and +${volPerMinPercent}%v/m at ${hour}:${min}`);
        }
      }

      document.querySelector('#noteDrop').classList.add('pulsing');
      document.querySelector(`#${coin.name}X`).classList.add('pulsing');

    } else if (volPerMinRate >= alertPoint && sounds === false) {
      document.querySelector(`#${coin.name}V`).classList.add('hot');

      if (interval === 1) {
        coin.oneTicks.push(1);

        if (coin.oneTicks.length > 10) {
          coin.oneTicks.shift();
          const total = coin.oneTicks.reduce((a, b) => a + b, 0);

          if (total >= 7) {
            document.querySelector(`#${coin.name}N`).classList.add('hot');
          }
        }
      } else if (interval === 5) {
        coin.fiveTicks.push(1);

        if (coin.fiveTicks.length > 3) {
          coin.fiveTicks.shift();
          const total = coin.fiveTicks.reduce((a, b) => a + b, 0);

          if (total >= 2) {
            document.querySelector(`#${coin.name}N`).classList.add('hot');
          }
        }
      }

      if (coin.logs.length >= 10) {
        coin.logs.pop();
      }

      if (min < 10) {
        if (priceDifference > 0) {
          coin.logs.unshift(`$${coin.curPrice} (+${priceDifference}%) and +${volPerMinPercent}%v/m at ${hour}:0${min}`);
        } else {
          coin.logs.unshift(`$${coin.curPrice} (${priceDifference}%) and +${volPerMinPercent}%v/m at ${hour}:0${min}`);
        }
      } else {
        if (priceDifference > 0) {
          coin.logs.unshift(`$${coin.curPrice} (+${priceDifference}%) and +${volPerMinPercent}%v/m at ${hour}:${min}`);
        } else {
          coin.logs.unshift(`$${coin.curPrice} (${priceDifference}%) and +${volPerMinPercent}%v/m at ${hour}:${min}`);
        }
      }

      document.querySelector('#noteDrop').classList.add('pulsing');
      document.querySelector(`#${coin.name}X`).classList.add('pulsing');
    };

    document.querySelector(`#${coin.name}V`).innerHTML = `${volPerMinute}/min | ${coin.aVm}/min`;

    if (priceDifference > 0) {
      document.querySelector(`#${coin.name}PP`).style.color = '#05b114';
      document.querySelector(`#${coin.name}PP`).innerHTML = `+${priceDifference}%`;
    } else {
      document.querySelector(`#${coin.name}PP`).style.color = '#d2121a';
      document.querySelector(`#${coin.name}PP`).innerHTML = `${priceDifference}%`;
    };

    if (coin.logs.length === 0) {
      document.querySelector(`#${coin.name}Logs`).innerHTML = '<h4 style="text-align: center;">No events logged yet.</h4>';
    } else {
      document.querySelector(`#${coin.name}Logs`).innerHTML = '';

      coin.logs.forEach(log => {
        const html = `
        <h4>${log}</h4>
        `;
        document.querySelector(`#${coin.name}Logs`).insertAdjacentHTML('beforeend', html);
      });
    }
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
  if (document.querySelector('#noteDrop').classList.contains('pulsing')) {
    document.querySelector('#noteDrop').classList.remove('pulsing');
  }
});

let intervalOption = 'one';
document.querySelector('.intervals').addEventListener('click', function(event) {
  interval = parseInt(document.querySelector(`#${event.target.id}`).innerHTML);
  document.querySelector(`#${intervalOption}`).classList.remove('selected');
  document.querySelector(`#${event.target.id}`).classList.add('selected');
  intervalOption = event.target.id;
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
  if (document.querySelector('.switch').innerHTML === 'II<span class="btnTool">Stop Tracking.</span>') {
    document.querySelector('.switch').innerHTML = '><span class="btnTool">Start Tracking.</span>';
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
    document.querySelector('.switch').innerHTML = 'II<span class="btnTool">Stop Tracking.</span>';
    document.querySelector('.add').disabled = true;
    document.querySelector('.add').classList.add('disabled');
    document.querySelector('.coinInput').disabled = true;
    document.querySelector('.intervals').classList.add('noClick');
    document.querySelector('.intervals').style.color = 'dimgrey';

    initData();
    startTracking(interval);
  };
});
