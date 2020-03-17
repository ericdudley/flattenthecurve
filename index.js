const dots = [];

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

const POPULATION_SIZE = 200;
const CONTAGION_PROXIMITY = 25;
const STUBBORNESS_TRESHOLD_MS = 1000; // a random actor may start moving every second; 
const STUBBORNESS_PROB = 0.5;
const GOES_TO_HOSPITAL_PROB = 0.2; // probably want to model this after elderly population;
const VIRAL_TRANSMISSION_PROB = 0.5;
const INITIAL_INFECTION_PROB = 0.1;
const SOCIAL_DISTANCER_PROB = 0.7;
const RECOVERY_TICKS_SEED = 1000;
const RECOVER_TICKS_RANGE = 150; // means it could be within -150 to +150 of the seed;

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

  setInterval(() => {
    if (probablyTrue(STUBBORNESS_PROB)) return;

    const dot = dots[getRandomIndex()]
    if (!dot.vel.x && !dot.vel.y) {
      dot.vel.x = Math.random();
      dot.vel.y = Math.random();
    } else {
      dot.vel.x = 0
      dot.vel.y = 0
    }


  }, STUBBORNESS_TRESHOLD_MS);
}

function draw() {
  background(0, 0, 0);
  translate(width / 2, height / 2);
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
        stroke(0, 255, 0);
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
  static VIRAL_STATE_NONE = 0;
  static VIRAL_STATE_RECOVERED = 1;

  constructor() {
    this.pos = createVector(0, 0);
    this.vel = createVector(0, 0);
    this.rad = 0;
    this.spd = 0;
    this.clr = 0;
    this.viral_state = probablyTrue(INITIAL_INFECTION_PROB) ? Dot.VIRAL_STATE_INFECTED : Dot.VIRAL_STATE_NONE; // -1 for infected; 0 for uninfected; 1 for recovered
    this.recovery_countdown = (Math.random() - 0.5) * RECOVER_TICKS_RANGE + RECOVERY_TICKS_SEED;
  }

  isInfected() {
    return this.viral_state === Dot.VIRAL_STATE_INFECTED;
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
      fill(255, 0, 0);
    } else if (this.viral_state === Dot.VIRAL_STATE_NONE) {
      fill(255, 255, 255);
    } else if (this.viral_state === Dot.VIRAL_STATE_RECOVERED) {
      fill(0, 255, 0);
    }
    ellipse(this.modpos.x, this.modpos.y, this.rad, this.rad);
    pop();
  }
}
