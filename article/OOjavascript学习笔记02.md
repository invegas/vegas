# 面向对象javascript学习笔记

### 另一个继承方法

上一讲中我们总结出了一个通用的继承方法：

```
function extend(Child, Parent) {
  var F = function(){};
  F.prototype = Parent.prototype;
  Child.prototype = new F();
  Child.prototype.constructor = Child;
  Child.uber = Parent.prototype;
}
extend(TwoDShape, Shape);
extend(Triangle, TwoDShape);
```

上面采用的方法是对prototype进行引用，但是我们其实可以更
简单一点，把prototype的每个属性拷贝一份到子类中：

```
function extend2(Child, Parent) {
  var p = Parent.prototype;
  var c = Child.prototype;
  for (var i in p) {
     c[i] = p[i];
  }
  c.uber = p;
}
```
因为不是对Child.prototype.contructor进行覆盖，所以没有必要进行重新赋值。

这个方法与前一个方法相比效率会低一点，因为child中的prototype复制了一份，
而不是引用父类的。

但要注意，能被复制的只有primitive types（我不知道怎么翻译比较好，但就是类似于prototype.name/prototype.age），
所有的object类型，包括函数和数组是不能被复制(比如prototype.toString = function () {}/prototype.arr = [])，
只能被引用

### 要注意的是

不要随意修改引用（父类）而来的属性（比如函数和数组），比如下面这个惨痛的例子

```
var A = function(){}, B = function(){};
A.prototype.stuff = [1,2,3];
```

用上面拷贝的属性的方法进行继承，让B继承A

```
extend2(B, A);
```

此时此刻如果我们对B的name进行修改，对A是没有任何影响的

```
>>> B.prototype.name += 'b'
"ab"
>>> A.prototype.name
"a"
```

但是一旦我们队B的stuff进行修改，会发现A的stuff已经被修改了

```
>>> B.prototype.stuff.push(4,5,6);
>>> A.prototype.stuff
   [1, 2, 3, 4, 5, 6]
```

但是如果对B的prototype进行整个覆盖，比如<code>B.prototype.stuff = ['a', 'b', 'c'];</code>对A是没有影响的
