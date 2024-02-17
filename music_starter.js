// drum: petal length
// vocals: petal shape 
// bass: background color
// other: line thickness

let flowers = [];
let circles = []; 
let numCircles = 80; // decrease this if program is laggy
let numFlowers = 12; // decrease this if program is laggy
let vanishingPointX = 0;
let vanishingPointY = 0;
// a smoothened bass value to be used for the background transitions
// the raw values are a bit weird and jumpy at the start of the song 
let smoothBass = 0; 

const colors = [  // background colours
  { r: 15, g: 15, b: 25 }, // blue
  { r: 20, g: 15, b: 20 }, // purple
  { r: 25, g: 15, b: 15 }  // red
];

function updateFlowers() {
  for (let i = flowers.length - 1; i >= 0; i--) {
    let flower = flowers[i];

    let growthRate = 0.005; // how fast flower increases in size
    flower.sizeFactor += growthRate;
    flower.sizeFactor = constrain(flower.sizeFactor, 0.01, 1.8); // caps growth so flower doesnt get infinitely larger

    // update movement - 'zoom' effect
    let dx = flower.centerX - vanishingPointX;
    let dy = flower.centerY - vanishingPointY;
    let distance = sqrt(dx * dx + dy * dy); // distance from vanishing point
    let movementScale = map(distance, 0, max(width, height), 0.005, 0.02);
    flower.centerX += dx * movementScale;
    flower.centerY += dy * movementScale;

    // fades out flowers as they increase in size
    // starts fading at sizeFactor 1.2 and completely fade by 1.8
    if (flower.sizeFactor > 1) {
      let fadeProgress = (flower.sizeFactor - 1) / (1.8 - 1);
      // ease function for smoother transition
      let easedOpacity = 1 - fadeProgress * (2 - fadeProgress);
      flower.opacity = max(easedOpacity, 0); 
    } else {
      flower.opacity = 1;
    }

    // remove flowers that are too big OR off-screen
    if (flower.sizeFactor > 1.8 || !isOnScreen(flower)) {
      flowers.splice(i, 1);
    }
  }
}


// helper function to determine if a flower is on-screen
function isOnScreen(flower) {
  let buffer = 20 + 200 * flower.sizeFactor;
  return (
    flower.centerX + buffer > 0 &&
    flower.centerX - buffer < width &&
    flower.centerY + buffer > 0 &&
    flower.centerY - buffer < height
  );
}

function drawFlower(flower, vocal, drum, bass, other, counter) {
  // Calculate base petal length without applying sizeFactor
  let basePetalLength = map(drum, 0, 100, 50, 200);

  let curveDepth = map(vocal, 0, 100, -50, -250); // Map bass volume to curvature depth
  let strokeWeightVal = map(other, 0, 100, 1, 4); // Adjust stroke weight based on 'other'

  // Adjust stroke weight for visibility
  strokeWeight(strokeWeightVal);
  stroke(flower.r, flower.g, flower.b, flower.opacity * 120); // Use flower's color with some transparency
  fill(flower.r, flower.g, flower.b, flower.opacity * 10); // Apply color with transparency
  push();
  translate(flower.centerX, flower.centerY);

  // Apply scaling based on sizeFactor here
  scale(flower.sizeFactor);

  rotate(flower.rotation);
  rotate(radians(counter)); // Additional rotation for dynamic effect

  for (let i = 0; i < flower.numPetals; i++) {
    let angle = (i * TWO_PI) / flower.numPetals;
    let endX = cos(angle) * basePetalLength; // Use basePetalLength for calculation
    let endY = sin(angle) * basePetalLength;
    drawPetal(
      0,
      0,
      endX,
      endY,
      curveDepth,
      flower.curveVariationX,
      flower.curveVariationY
    );
  }

  pop();
}

// Adjusted draw_one_frame function
function draw_one_frame(words, vocal, drum, bass, other, counter) {
  angleMode(RADIANS);

  // point we are zooming into
  vanishingPointX = width / 2;
  vanishingPointY = height / 2;


  // refill the circle array 
  while (circles.length < numCircles) {
    let circle = {
      centerX: random(width / 2 - width / 8, width / 2 + width / 8),
      centerY: random(height / 2 - height / 8, height / 2 + height / 8),
      sizeFactor: random(0.01, 0.02),
      color: {
        r: random(150, 240), 
        g: random(60, 180),
        b: random(60, 120),
      },
      opacity: 1.0,
    };
    circles.push(circle);
  }


  // refill the flower array 
  while (flowers.length < numFlowers) {

    // will attempt to spawn flower 'minDistance' away from every other existing flower
    // this spaces the flowers out from each other
    let validPosition = false;
    let newPos = {};
    let attempts = 0; 
    let maxAttempts = 100; 
    let minDistance = 40;

    while (!validPosition && attempts < maxAttempts) {
      newPos = {
        centerX: random(width / 2 - width / 8, width / 2 + width / 8),
        centerY: random(height / 2 - height / 8, height / 2 + height / 8), 
        sizeFactor: random(0.01, 0.02), 
        numPetals: floor(random(4, 13)), // random number of petals between 4 and 12
        curveVariationX: random(-20, 20), // petal x curve control point (petal variation)
        curveVariationY: random(-80, 80), // petal y curve control point (petal variation)
        rotation: 0,
        rotationIncrement: random(0.01, 0.05),  // how fast flower rotates
        r: random(150, 240),
        g: random(60, 180), 
        b: random(60, 120), 
        opacity: 1.0, 
      };

      validPosition = true; 
      for (let j = 0; j < flowers.length; j++) {
        let existingFlower = flowers[j];
        let d = dist(
          newPos.centerX,
          newPos.centerY,
          existingFlower.centerX,
          existingFlower.centerY
        );
        if (d < minDistance) {
          validPosition = false; 
          break;
        }
      }
      attempts++;
    }
    if (validPosition) {
      flowers.push(newPos);
    } else {
      console.log("Could not find a position for flower " + i);
    }
  }


  // change background color according to bass value
  // blue -> purple -> red
  let smoothingFactor = 0.05;
  smoothBass += (bass - smoothBass) * smoothingFactor;
  let bgColor = getBackgroundColor(smoothBass);
  background(bgColor.r, bgColor.g, bgColor.b);

  // now to update the circles and flowers with their new positions
  updateCircles(); 
  updateFlowers(drum); 

  // now to draw them
  circles.forEach(drawCircle);
  for (let i = flowers.length - 1; i >= 0; i--) { // iterates backward to maintain drawing order
    let flower = flowers[i];
    flower.rotation += flower.rotationIncrement; 
    drawFlower(flower, vocal, drum, bass, other, counter);
  }
}

// helper function for drawFlower
function drawPetal(
  startX,
  startY,
  endX,
  endY,
  curveDepth,
  curveVariationX,
  curveVariationY
) {
  push();
  let angle = atan2(endY - startY, endX - startX);
  rotate(angle);

  // determines petal shape
  let controlX = 50 + curveVariationX;
  let controlY = curveDepth + curveVariationY;

  // draw the curve
  beginShape();
  vertex(0, 0);
  quadraticVertex(controlX, controlY, dist(0, 0, endX, endY), 0);
  endShape();

  // mirrors the curve we just drew, creating the 'petal' shape
  beginShape();
  vertex(0, 0);
  quadraticVertex(controlX, -controlY, dist(0, 0, endX, endY), 0);
  endShape();

  pop();
}

function updateCircles() {
  // very similar to updateFlowers()
  // note the circles are a lot faster
  for (let i = circles.length - 1; i >= 0; i--) {
    let circle = circles[i];

    circle.sizeFactor += 0.005;
    circle.sizeFactor = constrain(circle.sizeFactor, 0.01, 2);

    let dx = circle.centerX - vanishingPointX;
    let dy = circle.centerY - vanishingPointY;
    let movementScale = map(
      sqrt(dx * dx + dy * dy),
      0,
      max(width, height),
      0.01,
      0.04
    );
    circle.centerX += dx * movementScale;
    circle.centerY += dy * movementScale;

    // remove circles that are off-screen
    if (!isOnScreen(circle)) {
      circles.splice(i, 1);
    }
  }
}

function drawCircle(circle) {
  push();
  translate(circle.centerX, circle.centerY);
  scale(circle.sizeFactor);
  let fillColor = color(
    circle.color.r,
    circle.color.g,
    circle.color.b,
    circle.opacity * 80
  );
  stroke(fillColor);
  strokeWeight(1);
  fill(fillColor);
  ellipse(0, 0, 10, 10); // base size, this is scaled by circle.sizeFactor
  pop();
}

function getBackgroundColor(bass) {
  let index;
  let fraction;

  if (bass < 33) {  // blue
    index = 0;
    fraction = bass / 33;
  } else if (bass < 66) { // purple
    index = 1;
    fraction = (bass - 33) / 33;
  } else {  // red
    index = 2;
    fraction = (bass - 66) / 34; 
  }

  // ensure we dont exceed the array bounds
  let color1 = colors[index];
  let color2 = colors[Math.min(index + 1, colors.length - 1)];

  // linearly interpolate between the two colors
  let r = lerp(color1.r, color2.r, fraction);
  let g = lerp(color1.g, color2.g, fraction);
  let b = lerp(color1.b, color2.b, fraction);

  return { r, g, b };
}