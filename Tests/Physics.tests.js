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

  describe('#circleRectangleCollision()', function() {
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
      assert(c.centerX === 5, 'x should not have been modified, was changed to ' + c.x);
      assert(c.centerY === 1, 'y should not have been modified, was changed to ' + c.y);
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
  });
});

