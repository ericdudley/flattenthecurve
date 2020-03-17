const dots = [];

function windowResized() {
  const p5Wrapper = document.querySelector("#p5-wrapper");
  const rect = p5Wrapper.getBoundingClientRect();
  resizeCanvas(rect.width, rect.height);
}

function dotStep(dot, delta) {
  var mean_acc = 0.1;
  var max_vel = 4.0;
  var curr_vel = Math.sqrt(dot.vel.x ** 2 + dot.vel.y ** 2);
  var acc = ((max_vel / curr_vel) * delta) + 1;
  dot.vel.x *= acc;
  dot.vel.y *= acc;
}

function setup() {
  var canvas = createCanvas(windowWidth, windowHeight);

  // Move the canvas so it’s inside our <div id="sketch-holder">.
  canvas.parent("p5-wrapper");

  for (let i = 0; i < 100; i++) {
    dots.push(new Dot());
    dots[i].pos.x = Math.random() * width;
    dots[i].pos.y = Math.random() * height;
    dots[i].rad = 15;
    dots[i].vel.x = (Math.random() - 0.5);
    dots[i].vel.y = (Math.random() - 0.5);

    if (dots[i].vel.x < 0.7) {
      dots[i].vel.x = 0;
    }
    if (dots[i].vel.y < 0.7) {
      dots[i].vel.y = 0;
    }
  }
}

function draw() {
  background(0, 0, 0);
  translate(width / 2, height / 2);
  for (let i = 0; i < dots.length; i++) {
    dots[i].update();
    dots[i].render();
    dotStep(dots[i], 0.001);

    for (let j = 0; j < dots.length; j++) {
      const other = dots[j];
      const other_modpos = other.modpos;
      if (dots[i].modpos.dist(other.modpos) < 25 && dots[i].infected) {
        if (Math.random() > 0.5) {
          if (dots[j].infected  == false) {
              dots[j].vel.x = (Math.random() - 0.5);
              dots[j].vel.y = (Math.random() - 0.5);
          }
          dots[j].infected = true;

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
}

class Dot {
  constructor() {
    this.pos = createVector(0, 0);
    this.vel = createVector(0, 0);
    this.rad = 0;
    this.spd = 0;
    this.clr = 0;
    this.infected = Math.random() < 0.02;
  }

  update() {
    this.pos.add(this.vel);
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
    if (this.infected) {
      fill(0, 255, 0);
    } else {
      fill(255, 255, 255);
    }
    ellipse(this.modpos.x, this.modpos.y, this.rad, this.rad);
    pop();
  }
}
