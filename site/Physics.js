// Adapted and optimized from Hexi.js's Bump module for use on the server side without a renderer.
// https://github.com/kittykatattack/bump/blob/master/src/bump.js

// Constructs a rectangle object.
function rectangle(x, y, width, height) {
  return {
    x: x,
    y: y,
    width: width,
    halfWidth: width / 2,
    height: height,
    halfHeight: height / 2,
  };
}

// Constructs a rectangle as a square.
function square(x, y, size) {
  return {
    x: x,
    y: y,
    width: size,
    halfWidth: size / 2,
    height: size,
    halfHeight: size / 2,
  };
}

// Constructs a circle object.
function circle(x, y, radius) {
  return {
    centerX: x,
    centerY: y,
    radius: radius,
    radiusSqr: radius * radius  // For optimized hit detection
  };
}

// Determines if two circles are touching.
function hitTestCircles(c1, c2) {
    //Calculate the vector between the circles’ center points
    let vx = c2.centerX + c2.radius - (c1.centerX + c1.radius);
    let vy = c2.centerY + c2.radius - (c1.centerY + c1.radius);

    //Find the square of the distance between the circles by calculating
    //the sqquare of the vector's magnitude (how long the vector is).
    // We calculate using squares to avoid a Math.sqrt() when not needed.
    let magnitudeSqr = vx * vx + vy * vy;

    //Add together the squares of the circles' total radii
    let combinedRadiiSqr = c1.radiusSqr + c2.radiusSqr;

    //Set `hit` to `true` if the distance between the circles is
    //less than their `combinedRadii`
    return  magnitudeSqr < combinedRadiiSqr;
} 

// TODO: Finish
// Intersects a circle shape with a rectangular shape, optionally adjusting the circle to
// sit outside the rectangle (excluding it). Example: Circular sprite intersection with a
// building.
function circleRectangleCollision(c, r, exclude = false) {
    let cLeft = c.centerX - c.radius;
    let cTop = c.centerY - c.radius;
    let cRight = c.centerX + c.radius;
    let cBottom = c.centerY + c.radius; 
    let rLeft = r.x;
    let rTop = r.y;
    let rRight = r.x + r.width;
    let rBottom = r.y + r.height;
    let region;

    // We treat each dimension similarly but separately: If the circle is overlapping anywhere
    // it's a hit; if we're excluding the circle, we move it out in the x and y directions

    if (cTop < rTop) {
        if (cBottom > rTop) {
            // Circle overlaps the half-plane anchored by the top of the rectangle. Might not be touching in the x dimension.
            if (cLeft < rLeft) {
                if (cRight > rLeft) {
                    // Circle overlaps at the top left corner. Collision.
                    if (exclude) {
                        // Move the circle out of the left and top of the rectangle by the overlap amount.
                        c.centerX -= cRight - rLeft;
                        c.centerY -= cBottom - rTop;  
                    }
                    return true;
                }
                // Circle is to the upper-left of the rectangle, no collision.
                return false;
            } else if (cLeft < rRight) {
                if (cRight <= rRight) {
                    // Circle overlaps the top edge of the rectangle.
                    if (exclude) {
                        // Move the circle out of the top edge.
                        c.centerY -= cBottom - rTop;
                    }
                    return true;
                } else {
                    // Circle overlaps at the top right corner of the rectangle. Move the circle outward in both dimensions.
                    if (exclude) {
                        c.centerX += rRight - cLeft;
                        c.centerY -= cBottom - rTop;
                    }
                    return true;
                }
            }
            // Circle is above and to the right of the rectangle. No collision.
            return false;
        }
        // Circle is above the rectangle. No intersection.
        return false; 
    } else {  // cTop >= rTop.
        if (cTop < rBottom) {
            // Circle overlaps the half-plane anchored by the bottom of the rectangle. Might not be touching in the x dimension.
            if (cLeft < rLeft) {
                if (cRight > rLeft) {
                    // Circle overlaps at the left side or bottom left corner. Collision.
                    if (exclude) {
                        // Move the circle out of the left and bottom of the rectangle by the overlap amount.
                        c.centerX -= cRight - rLeft;
                        if (cTop > rTop) {
                            c.centerY += rBottom - cTop;
                        }
                    }
                    return true;
                }
                // Circle is to the bottom-left of the rectangle, no collision.
                return false;
            } else if (cLeft < rRight) {
                if (cRight <= rRight) {
                    // Circle overlaps the bottom edge of the rectangle.
                    if (exclude) {
                        // Move the circle out of the bottom edge.
                        c.centerY += rBottom - cTop;
                    }
                    return true;
                } else {
                    // Circle overlaps at the bottom right corner of the rectangle. Move the circle outward in both dimensions.
                    if (exclude) {
                        c.centerX += rRight - cLeft;
                        if (cTop > rTop) {
                            c.centerY += rBottom - cTop;
                        }
                    }
                    return true;
                }
            }
            // Circle is above and to the right of the rectangle. No collision.
            return false;
        }
        // Circle is below the rectangle. No collision.
        return false;
    }
}


// --------------------------------------------------------------------
// Exports
module.exports.rectangle = rectangle;
module.exports.square = square;
module.exports.circle = circle;
module.exports.hitTestCircles = hitTestCircles;
module.exports.circleRectangleCollision = circleRectangleCollision;
