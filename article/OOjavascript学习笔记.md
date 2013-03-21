# 面向对象javascript学习笔记

## 继承

### 方法1

```
function Shape(){
  this.name = 'shape';
  this.toString = function() {return this.name;};
}

function TwoDShape(){
  this.name = '2D shape';
}

function Triangle(side, height) {
  this.name = 'Triangle';
  this.side = side;
  this.height = height;
  this.getArea = function(){return this.side * this.height / 2;};
}

TwoDShape.prototype = new Shape();
Triangle.prototype = new TwoDShape();

var my = new Triangle(5, 10);
my.toString()

```
new 一个函数时，即生成了一个对象，其中this即指该对象的拥有者，
但要注意 `= new Shape()` 和 `= Shape()` 的区别

因为重新赋值了prototype，要重新对构造函数再重新赋值一遍

```
TwoDShape.prototype.constructor = TwoDShape;
Triangle.prototype.constructor = Triangle;
```

当实例my调用toString()时，要经过三次查找

- 查看my实例自己的属性里有没有：没有

- 查看my的prototype的属性里，即TwoDShape实例属性里有没有这个方法：没有

- 去TwoDShape的prototype的属性里，即Shape实例属性里有没有这个方法：有





### 方法2：把属性都放入Prototype中

上面的方法有一个问题，如果创建对象的属性使用this关键字的话，那么每使用
new关键字创建一个对象，使用this创建的属性都会被加载入内存中，那么不如使用
function的prototype属性，采用引用的方式

```
function Shape(){}
Shape.prototype.name = 'shape';
function Shape(){}

// augment prototype
Shape.prototype.name = 'shape';
Shape.prototype.toString = function() {return this.name;};
function TwoDShape(){}

// take care of inheritance
TwoDShape.prototype = new Shape();
TwoDShape.prototype.constructor = TwoDShape;

// augment prototype
TwoDShape.prototype.name = '2D shape';

function Triangle(side, height) {
  this.side = side;
  this.height = height;
}
// take care of inheritance
Triangle.prototype = new TwoDShape();
Triangle.prototype.constructor = Triangle;

// augment prototype
Triangle.prototype.name = 'Triangle';
Triangle.prototype.getArea = function(){return this.side * this.height / 2;};

var my = new Triangle(5, 10);
my.toString();
```

这样节省了内存，也更优雅了一些，但当最后一个实例调用toString时，则需要
查找4次

- 查看my实例自己的属性里有没有：没有

- 查看my的prototype的属性里，即TwoDShape实例属性里有没有这个方法：没有

- 去TwoDShape的prototype的属性里，即Shape实例属性里有没有这个方法：没有

- 去Shape的prototype属性里找：有

### 方法3：只继承prototype属性

其实是对上面方案的进一步优化，既然你需要prototype，那就只给你prototype！

```
function Shape(){}

// augment prototype
Shape.prototype.name = 'shape';
Shape.prototype.toString = function() {return this.name;};
function TwoDShape(){}

// take care of inheritance
TwoDShape.prototype = Shape.prototype;
TwoDShape.prototype.constructor = TwoDShape;

// augment prototype
TwoDShape.prototype.name = '2D shape';
function Triangle(side, height) {
  this.side = side;
  this.height = height;
}

// take care of inheritance
Triangle.prototype = TwoDShape.prototype;
Triangle.prototype.constructor = Triangle;

// augment prototype
Triangle.prototype.name = 'Triangle';
Triangle.prototype.getArea = function(){return this.side * this.height / 2;}

var my = new Triangle();
my.toString();

```
虽然这样的效率极大的提高了，但是有一个副作用，
所有的父类和子类都共享共同引用同一个prototype，并且拥有同样的
修改权限

### 方法4：使用一个中间构造函数F();

```
function Shape(){}

// augment prototype
Shape.prototype.name = 'shape';
Shape.prototype.toString = function() {return this.name;};
function TwoDShape(){}

// take care of inheritance
var F = function(){};
F.prototype = Shape.prototype;
TwoDShape.prototype = new F();
TwoDShape.prototype.constructor = TwoDShape;

// augment prototype
TwoDShape.prototype.name = '2D shape';
function Triangle(side, height) {
  this.side = side;
  this.height = height;
}

// take care of inheritance
var F = function(){};
F.prototype = TwoDShape.prototype;
Triangle.prototype = new F();
Triangle.prototype.constructor = Triangle;

// augment prototype
Triangle.prototype.name = 'Triangle';
Triangle.prototype.getArea = function(){return this.side * this.height / 2;};

var my = new Triangle();
my.toString();
```

试着想想my调用toString的过程

- 先去my实例中去查找：没有
- 然后去my的prototype中查找，即F的实例中查找：没有
- 去F的prototype中查找：有

