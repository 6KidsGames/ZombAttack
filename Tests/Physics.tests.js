// Tests for Physics module.

const chai = require('chai');
const assert = chai.assert;
const Physics = require('../site/Physics');

describe('Physics', function() {
  describe('#hitTestCircles()', function() {
    it('should return false for circles that are far apart', function() {
      let c1 = Physics.circle(10, 10, 5);
      let c2 = Physics.circle(20, 20, 5);
      assert(!Physics.hitTestCircles(c1, c2)); 
    });

    it('should return true for circles that overlap slightly', function() {
      let c1 = Physics.circle(10, 10, 5);
      let c2 = Physics.circle(10, 14, 5);
      assert(Physics.hitTestCircles(c1, c2)); 
    });

    it('should return true for circles that lie atop one another', function() {
      let c1 = Physics.circle(10, 10, 5);
      let c2 = Physics.circle(10, 10, 5);
      assert(Physics.hitTestCircles(c1, c2)); 
    });
  });

  describe('#circleRectangleCollision() non-intersection', function() {
    it('should return false and not change the circle if above and left of the rectangle', function() {
      let c = Physics.circle(1, 2, 1);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(!Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 1);
      assert(c.centerY === 2);
      assert(c.radius === 1);
    });

    it('should return false and not change the circle if above rectangle', function() {
      let c = Physics.circle(5, 1, 1);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(!Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 5, 'x should not have been modified, was changed to ' + c.centerX);
      assert(c.centerY === 1, 'y should not have been modified, was changed to ' + c.centerY);
      assert(c.radius === 1);
    });

    it('should return false and not change the circle if above and right of the rectangle', function() {
      let c = Physics.circle(10, 1, 1);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(!Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 10);
      assert(c.centerY === 1);
      assert(c.radius === 1);
    });

    it('should return false and not change the circle if left of the rectangle', function() {
      let c = Physics.circle(1, 5, 1);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(!Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 1);
      assert(c.centerY === 5);
      assert(c.radius === 1);
    });

    it('should return false and not change the circle if right of the rectangle', function() {
      let c = Physics.circle(1, 10, 1);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(!Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 1);
      assert(c.centerY === 10);
      assert(c.radius === 1);
    });

    it('should return false and not change the circle if below and left of the rectangle', function() {
      let c = Physics.circle(10, 2, 1);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(!Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 10);
      assert(c.centerY === 2);
      assert(c.radius === 1);
    });

    it('should return false and not change the circle if below rectangle', function() {
      let c = Physics.circle(5, 10, 1);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(!Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 5, 'x should not have been modified, was changed to ' + c.centerX);
      assert(c.centerY === 10, 'y should not have been modified, was changed to ' + c.centerY);
      assert(c.radius === 1);
    });

    it('should return false and not change the circle if below and right of the rectangle', function() {
      let c = Physics.circle(10, 10, 1);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(!Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 10);
      assert(c.centerY === 10);
      assert(c.radius === 1);
    });
  });

  describe('#circleRectangleCollision() partial intersections', function() {
    it('should return true and move the circle if intersecting top left corner', function() {
      let c = Physics.circle(3, 3, 2);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 2, 'x should have been moved. Actual value: ' + c.centerX);
      assert(c.centerY === 2, 'y should have been moved. Actual value: ' + c.centerY);
      assert(c.radius === 2);
    });

    it('should return true and move the circle if intersecting top', function() {
      let c = Physics.circle(6, 3, 2);
      let r = Physics.rectangle(4, 4, 4, 4);
      assert(Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 6, 'x should not have been moved. Actual value: ' + c.centerX);
      assert(c.centerY === 2, 'y should have been moved. Actual value: ' + c.centerY);
      assert(c.radius === 2);
    });

    it('should return true and move the circle if intersecting top right corner', function() {
      let c = Physics.circle(8, 3, 2);
      let r = Physics.rectangle(4, 4, 3, 3);
      assert(Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 9, 'x should have been moved. Actual value: ' + c.centerX);
      assert(c.centerY === 2, 'y should have been moved. Actual value: ' + c.centerY);
      assert(c.radius === 2);
    });

    it('should return true and move the circle if intersecting left', function() {
      let c = Physics.circle(3, 6, 2);
      let r = Physics.rectangle(4, 4, 4, 4);
      assert(Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 2, 'x should have been moved. Actual value: ' + c.centerX);
      assert(c.centerY === 6, 'y should not have been moved. Actual value: ' + c.centerY);
      assert(c.radius === 2);
    });

    it('should return true and move the circle if intersecting right', function() {
      let c = Physics.circle(9, 6, 2);
      let r = Physics.rectangle(4, 4, 4, 4);
      assert(Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 10, 'x should have been moved. Actual value: ' + c.centerX);
      assert(c.centerY === 6, 'y should not have been moved. Actual value: ' + c.centerY);
      assert(c.radius === 2);
    });

    it('should return true and move the circle if intersecting bottom left corner', function() {
      let c = Physics.circle(3, 9, 2);
      let r = Physics.rectangle(4, 4, 4, 4);
      assert(Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 2, 'x should have been moved. Actual value: ' + c.centerX);
      assert(c.centerY === 10, 'y should have been moved. Actual value: ' + c.centerY);
      assert(c.radius === 2);
    });

    it('should return true and move the circle if intersecting bottom', function() {
      let c = Physics.circle(6, 9, 2);
      let r = Physics.rectangle(4, 4, 4, 4);
      assert(Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 6, 'x should not have been moved. Actual value: ' + c.centerX);
      assert(c.centerY === 10, 'y should have been moved. Actual value: ' + c.centerY);
      assert(c.radius === 2);
    });

    it('should return true and move the circle if intersecting bottom right corner', function() {
      let c = Physics.circle(8, 9, 2);
      let r = Physics.rectangle(4, 4, 4, 4);
      assert(Physics.circleRectangleCollision(c, r, exclude = true));
      assert(c.centerX === 10, 'x should have been moved. Actual value: ' + c.centerX);
      assert(c.centerY === 10, 'y should have been moved. Actual value: ' + c.centerY);
      assert(c.radius === 2);
    });
  });
});

