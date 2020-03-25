

let populationChart;
let timeStepCount = 0;
let isSimulationComplete = false;
let chartInterval;
const dots = [];

/* Color Theme Swatches in Hex */
const PINK = '#F27E88';
const GREEN = '#155902';
const YELLOW = '#F2CB05';
const RED = '#BF1717';
const WHITE = '#EBEBEB';
const BACKGROUND_COLOR = '#171717';

function updateChart() {
  let numOfSick = 0;
  let numOfHealthy = 0;
  let numOfRecovered = 0;

  for (const dot of dots) {
    if (dot.isInfected()) {
      numOfSick += 1;
    } else if (dot.isHealthy()) {
      numOfHealthy +=1;
    } else if (dot.isRecovered()) {
      numOfRecovered += 1;
    } else {
      throw Error('wtf');
    }
  }

  populationChart.data.labels.push(timeStepCount++);
  populationChart.data.datasets[0].data.push(numOfSick);
  populationChart.data.datasets[1].data.push(numOfHealthy);
  populationChart.data.datasets[2].data.push(numOfRecovered);

  
  populationChart.update({
    duration: 200,
    lazy: false,
    easing: 'easeOutBounce'
  });

  if (numOfSick === 0) {
    isSimulationComplete = true;
    clearInterval(chartInterval);
  }
}

function windowResized() {
  const p5Wrapper = document.querySelector("#p5-wrapper");
  const rect = p5Wrapper.getBoundingClientRect();
  resizeCanvas(rect.width, rect.height);
}

function getRandomIndex() {
  return Math.floor(dots.length * Math.random());
}

function probablyTrue(percentRatio) {
  return Math.random() < percentRatio;
}

const POPULATION_SIZE = 150;
const CONTAGION_PROXIMITY = 25;

const GOES_TO_HOSPITAL_PROB = 0.2; // probably want to model this after elderly population;
const VIRAL_TRANSMISSION_PROB = 0.95;
const INITIAL_INFECTION_PROB = 0.05;
const SOCIAL_DISTANCER_PROB = 0.001;
const IMPATIENCE_PROB = 0.0001; // probability that someone decides to move/stop
const RECOVERY_TICKS_SEED = 700;
const RECOVER_TICKS_RANGE = 100; // means it could be within -150 to +150 of the seed;

function setup() {
  var canvas = createCanvas(windowWidth, windowHeight);
  
  // Move the canvas so it’s inside our <div id="sketch-holder">.
  canvas.parent("p5-wrapper");

  for (let i = 0; i < POPULATION_SIZE; i++) {
    dots.push(new Dot());
    dots[i].pos.x = Math.random() * width;
    dots[i].pos.y = Math.random() * height;
    dots[i].rad = 12;

    // some agents are not a fan of social distancing
    if (!probablyTrue(SOCIAL_DISTANCER_PROB)) {
      dots[i].vel.x = (Math.random() - 0.5) * 3;
      dots[i].vel.y = (Math.random() - 0.5) * 3;
    }
  }

  const chartCtx = document.getElementById('populationChart').getContext('2d');
  populationChart = new Chart(chartCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: '# of Sick',
            data: [],
            backgroundColor: PINK,
        }, {
          label: '# of Healthy',
          data: [],
          backgroundColor: WHITE,
        }, {
          label: '# of Recovered',
          data: [],
          backgroundColor: GREEN,
        }],
    },
    options: {
        responsive: true,
        scales: {
            yAxes: [{
                stacked: true,
            }]
        }
    }
  });

  chartInterval = setInterval(updateChart, 250);
}

function draw() {
  background(BACKGROUND_COLOR);
  translate(width / 2, height / 2);

  // TODO: optimize this check
  for (let i = 0; i < dots.length; i++) {
    dots[i].update();
    dots[i].render();

    if (dots[i].viral_state === Dot.VIRAL_STATE_RECOVERED) {
      continue;
    }

    for (let j = 0; j < dots.length; j++) {
      const other = dots[j];
      const other_modpos = other.modpos;
      
      if (dots[i].modpos.dist(other.modpos) < CONTAGION_PROXIMITY && dots[i].isInfected()) {
        if (probablyTrue(VIRAL_TRANSMISSION_PROB)) {
          // A newly infected agents may move to go seek care
          if (!dots[j].isInfected() && probablyTrue(GOES_TO_HOSPITAL_PROB)) {
              dots[j].vel.x = (Math.random() - 0.5);
              dots[j].vel.y = (Math.random() - 0.5);
          }
          dots[j].viral_state = Dot.VIRAL_STATE_INFECTED;
        }

        push();
        stroke(WHITE);
        line(
          dots[i].modpos.x,
          dots[i].modpos.y,
          other_modpos.x,
          other_modpos.y
        );
        pop();
      }
    }
  }

  if (mouseIsPressed) {
    // do something; mouseX mouseY
  }
}

class Dot { 

  static VIRAL_STATE_INFECTED = -1;
  static VIRAL_STATE_HEALTHY = 0;
  static VIRAL_STATE_RECOVERED = 1;

  constructor() {
    this.pos = createVector(0, 0);
    this.vel = createVector(0, 0);
    this.rad = 0;
    this.spd = 0;
    this.clr = 0;
    this.viral_state = probablyTrue(INITIAL_INFECTION_PROB) ? Dot.VIRAL_STATE_INFECTED : Dot.VIRAL_STATE_HEALTHY;
    this.recovery_countdown = (Math.random() - 0.5) * RECOVER_TICKS_RANGE + RECOVERY_TICKS_SEED;
    // this.patience = (Math.random() - 0.5) * PATIENCE_TICKS_RANGE + PATIENCE_TICKS_SEED;
  }

  isInfected() {
    return this.viral_state === Dot.VIRAL_STATE_INFECTED;
  }

  isRecovered() {
    return this.viral_state === Dot.VIRAL_STATE_RECOVERED;
  }

  isHealthy() {
    return this.viral_state === Dot.VIRAL_STATE_HEALTHY;
  }

  update() {
    this.pos.add(this.vel);
    const delta = (Math.random() - 0.5) * 0.001; // sometimes slow down sometimes speed up
    var mean_acc = 0.1;
    var max_vel = 1.0;
    var curr_vel = Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2);
    var acc = ((max_vel / curr_vel) * delta) + 1;
    this.vel.x *= acc;
    this.vel.y *= acc;

    if (this.isInfected()) {
      this.recovery_countdown -= 1;
      if (this.recovery_countdown < 0) {
        this.viral_state = Dot.VIRAL_STATE_RECOVERED
      }
    }

    if (probablyTrue(IMPATIENCE_PROB)) {
      if (!this.vel.x && !this.vel.y && !this.isInfected()) {
        this.vel.x = (Math.random() - 0.5) * 2.5;
        this.vel.y = (Math.random() - 0.5) * 2.5;
      } else {
        this.vel.x = 0
        this.vel.y = 0
      }
    }
  }

  get modpos() {
    let x = this.pos.x;
    let y = this.pos.y;

    if (x < 0) {
      x = windowWidth - (Math.abs(x) % windowWidth);
    } else {
      x = Math.abs(x) % windowWidth;
    }

    if (y < 0) {
      y = windowHeight - (Math.abs(y) % windowHeight);
    } else {
      y = Math.abs(y) % windowHeight;
    }

    x -= windowWidth / 2;
    y -= windowHeight / 2;

    return createVector(x, y);
  }

  render() {
    push();
    if (this.viral_state === Dot.VIRAL_STATE_INFECTED) {
      fill(PINK);
    } else if (this.viral_state === Dot.VIRAL_STATE_HEALTHY) {
      fill(WHITE);
    } else if (this.viral_state === Dot.VIRAL_STATE_RECOVERED) {
      fill(GREEN);
    }
    ellipse(this.modpos.x, this.modpos.y, this.rad, this.rad);
    pop();
  }
}
