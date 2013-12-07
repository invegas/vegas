


浏览器的脚本引擎有一个不足之处是，你无法通过javascript语法强制让脚本引擎进行垃圾回收（Garbage Collection，在文中以GC代替）和内存释放。虽然你可以在脚本中执行 `delete someVariable` 或者 `someVariable = null` 又或者 `someVariable = void 0`。但事实上你做的都只是删除了变量对某个对象的引用而已，至于被删除引用的对象是否能够被回收，又何时能否被回收，这就只能由脚本引擎说得算了。

这会留下一个性能上的隐患，因为GC也是要消耗浏览器资源的。理想的状态应该是在浏览器进程空闲的时候进行GC，相反如果GC发生的同时也有许多脚本需要处理，这务必会影响程序的性能。为了保证良好的用户体验，我们要尽可能让程序的刷新率靠近每秒60帧。换而言之，你必须在16.7ms之内执行完每一帧的所有脚本。

这篇文章主要分为两部分，一是关于浏览器的脚本引擎如何进行垃圾回收；二是如何使用Object Pool解决GC引起性能问题。

## 脚本引擎的垃圾回收算法

### Reference Counting

早在Javascript 1.1版本和Netscape 3中（甚至在早期火狐中），一个对象是否被回收是由这个对象的被引用次数决定的。对象一旦被创建并被一个变量引用，那么它的引用次数便是1，如果该对象又被赋值给了另一个变量，那么引用便增为2.一旦某变量删除了对该对象的引用或者另被赋值，那么该对象的引用便又降为1.理论上来说，当一个对象的被引用次数降为0时，表示没有任何变量在引用该对象了，它已经毫无用处可以被回收从内存中释放了。

但是这个算法有一个缺陷，比如当存在如下图循环引用的情况时：

```
A<-------|     C----->X
|        |     D----->Y
|------->B     E----->Z
```

A与B互相引用，A和B的被引用次数都不为0，按照算法规则是不会被垃圾回收。但实际情况是A与B成了座“孤岛”，没有任何以外的变量引用他们。他们不会被回收，又不会再被发现和引用，这便造成了内存泄露。

实际的例子是在IE6、7中，DOM对象的回收使用的就是Reference Counting算法，比如下面这个例子

```
var div = document.createElement("div");
div.onclick = function handler(){
  doSomething();
};
```
引用的情况是：

- div通过onclick属性对函数handler进行引用
- 函数对div也进行了引用，因为在handler的作用域中可以访问div

这样的循环会导致两个对象都没有办法被垃圾回收，引起内存泄露。

### Mark-and-Sweep

目前大部分浏览器使用的是这一个垃圾回收算法，或是在这个算法上的变形。这个算法以图的形式将所有的对象连接起来，就像算法名称所示，回收过程分为两个阶段：

1. 标记(Mark)：它首先假设存在一些根(root)节点（比如Javascript中的全局对象），从根节点出发，试图去访问其它的每一个与它相连的节点。在Javascript中，如果访问到的节点是基本数据类型(Primitive type)，则对这个节点进行标记，如果不是基本数据类型，也就是Object或者Array，则对这个非基本类型递归这一过程，直到访问到所有节点。
2. 清除(Sweep)：经过上面的步骤之后，那么那些存在但没有被标记的对象，则进行回收。

![Alt text](http://www.html5rocks.com/en/tutorials/memory/effectivemanagement/images/image03.png)

如果说Reference Counting的回收条件是“当某个对象不再被需要”，那么Mark-and-Sweep的回收条件则是“当某个对象不再能被访问”。

同时我们再回过头来看在前一个算法中会造成内存泄露的例子，很明显如果将算法换成Mark-and-Sweep，即使A与B互相引用，但是从根节点出发无法被访问，那么还是会对他们进行回收。


### V8

实际情况会比我们想象的复杂的多，比如V8引擎就一共使用了三种垃圾回收算法。

#### Two Generational Collector(分代收集算法)

分代收集算法实际只能算三色标记算法(Tri-color marking)的一种策略。该算法的依据是：根据对大量计算机程序进行统计，发现最新被分配内存空间的对象通常活的时间都不会太长。这也被称作“弱代假说”(infant mortality or the generational hypothesis)。

这个算法将内存空间分为两代(generation)，年青一代(young generation)和老一代(old generation)。在年青一代区域内存的分配和回收频繁并且迅速，老一代的区域内存的分配缓慢并且次数较少。一个对象被划分为“年青”和“老”的依据是，它从出生到存活至今被分配的字节数。

V8引擎的最外层使用的是这个算法，但是在年青一代和老一代的内存空间中又有独立的垃圾回收算法。年青一代使用的是切尼算法(Cheney's algorithm)，而老一代使用的是标记压缩(Mark-compact)算法。

#### Cheney's algorithm(切尼算法)

切尼算法将堆(heap)分为相等的两个空间，分别命名为from和to，新增对象的内存空间分配是从名为to的那一部分开始的。当to空间的内存不够分配时，年青一代的GC便被触发。首先GC会交换from和to，并对新的from空间(原来的to)进行扫描，所有“活着”的对象都面临着选择：是被复制到to空间还是被分配到老一代内存中。一般来说这样一个过程不会超过10毫秒。

假设我们已经将from和to空间互相交换过了，接下来需要做的如何找到“活着”的对象，并且将活着的对象转移到新的to空间上去：

- 算法依次扫描被栈(stack)引用的堆(heap) 上的对象（至于栈和堆的关系，可以参考C#：在C#中数据类型被分为两种，值类型和引用类型，值类型只需要一段单独的内存，用于存储实际的数据，存储在栈上；引用类型需要两段内存，第一段存储实际的数据，它总是位于堆上，第二段是一个引用指向数据在堆中存放的位置，位于栈上）：
    - 如果对象还没有被转移到新的to空间上，那么就在to空间创建一份拷贝，并且将当前from空间的该对象修改为一个指向to空间拷贝的指针。并更新栈上引用，指向新的拷贝；
    - 如果对象已经被转移到了新的to空间上，那么把栈上指向from的指针改为指向to上的新拷贝即可
- 算法依次扫描已经转移到to上的对象，并且检查它们在from空间上的引用，重复上面的步骤

#### Mark-compact algorithm(标记压缩算法)

标记压缩算法是标记清除算法的一种变形，它主要解决的是标记清除之后内存空间空间碎片化不连续的问题。以基于表(Table-based)的标记压缩算法为例：

1. 标记与清除过程与Mark-and-sweep算法相同
2. 压缩过程从堆的底部（低位）向头部（高位）进行，每当扫描到一个被标记的对象，将它转移至第一个可用低位。并且将当前的移动记录插入至表(break table)中，该记录包括对象重置的位置，以及重置位置与原位置的差别。表的位置就放在压缩的堆中，但是该位置对其他对象来说是未被使用的。
3. 随着压缩的进行，被标记的对象不断的向低位移动，因此表占用的空间可会被征用，需要转移到新的空间
4. 等到压缩完毕，堆中幸存的对象需要根据表的记录，来更新对其他对象的指针引用

需要注意的是，表可能是不连续的(break)，因此在第三步中表可能只是某一部分在堆中移动。这样会导致表里的记录不是按堆中对象的顺序排列的。所以在压缩之后，需要对表进行一次排序。

为了更好的理解压缩过程，可以将堆比作书架的一格，其中一部分放满了不同厚度的图书。空闲空间就是图书之间的空隙。压缩就是将所有图书朝一个方向推移，以弥合所有空隙。它从最靠近隔板的图书开始，将它推向隔板，然后将离隔板第二近的图书推向第一本图书，接着将第三本图书推向第二本图书，依此类推。最后，所有图书在一端，所有空闲空间在另一端。

## Object Pool

在文章的开头，我提到GC也是会占用资源影响到性能的。让我们来看一个实际的例子。

首先我来模拟一个场景，想象一个街机平面射击游戏，玩家控制飞船不断的发射子弹攻击BOSS，每一轮发射10000颗子弹，同时每一轮发射的时候只有10%的子弹会击中BOSS而损失掉：

```
//  子弹
var Bullet = function () {};
var gun = [];
// 射击
var shoot = function () {
    var num = 100  * 100;
    for (var i = 0; i < num; i++) {
        gun.push(new Bullet());
    }
};
 
var shootAgain = function () {
    
    // 每次射击都会损失10%的子弹
    for (var i = 0, len = parseInt(gun.length * 0.1); i < len ;i++) {
        gun.shift();
    }
    shoot();
    console.log("TOTAL LEN------>", gun.length);
};
 
 // 无限执行下去
(function repeat() {
    setTimeout(function () {
        shootAgain();
        repeat();
    }, 100);            
})();
```

如果你在Chrome中执行代码，并且在devtools中timeline中查看内存(memory标签下)的使用情况，你会看到类似于下图的锯齿图：

![Alt text](http://www.html5rocks.com/en/tutorials/speed/static-mem-pools/fig1.jpg)

每一次峰值意味着使用的内存不断的增长，同时峰值之后的回落意味着一个GC的发生，将无用的内存进行回收。

![Alt text](http://www.html5rocks.com/en/tutorials/speed/static-mem-pools/fig2.jpg)

就像开头说的那样，GC会影响你的性能，如何运行GC是由引擎自己决定的，你没有控制权，GC可以发生在代码执行的任何时候，并且会中断你的代码执行知道GC完成。

如上图那样锯齿状的原因是因为频繁的创建和销毁对象，为了阻止这样的事情发生，其中一个办法就是延长对象的寿命，尽可能的不去触发GC。因此我们可以利用Object Pool模式。

Object Pool采取的是这样一种策略，在程序初始化时一次性创建相当数量的对象，存放在“池(pool)”中，当需要使用时不是在创建新的对象，而是从池中获取，当对象使用完毕后，还回池中，以上面的子弹代码为例，我们可以增加两个关于“池”的方法：

```
// 使用中的子弹
var activeBullets = [];
// 池子 object pool
var bulletPool = [];
 
// 初始化创建20颗子弹，存入池中
for (var i=0; i < 20; i++)
    bulletPool.push( new Bullet() );
 
// 获得子弹
function getNewBullet()
{
    var b = null;
 
    if (bulletPool.length > 0)
        b = bulletPool.pop();
    else 
        // 如果池中对象不够用了，再增加新的对象
        b = new Bullet();   
 
    // 使用子弹
    activeBullets.push(b);
    return b;
}
 
// 释放对象，还回池中
function freeBullet(b)
{
    for (var i=0, l=activeBullets.length; i < l; i++)
        if (activeBullets[i] == b)
            array.slice(i, 1);
    
    bulletPool.push(b);
}
```
我们可以进一步的将Object Pool模式抽象出来，封装成一个lib：

```
var ObjectPool = (function() {

    var ObjectPool = function(Cls) {

        // 池子里的对象必须是同一类，
        // 所以你首先要传入一个构造函数        

        this.cls = Cls;

        // metrics用于记录pool的当前状态
        // 比如 totalalloc(总已分配数)、 totalfree(可用)
        this.metrics = {};

        // 重置池子
        this._clearMetrics();

        this._objpool = [];
    };

    ObjectPool.prototype = {
        // 分配
        alloc: function () {
            var obj;

            // 如果池中已无对象可供分配
            if (this._objpool.length == 0) {

                obj = new this.cls();
                this.metrics.totalalloc++;

            } else {

                obj = this._objpool.pop();
                this.metrics.totalfree--;
            }

            obj.init.apply(obj, arguments);

            return obj;
        },
        // 释放对象
        free: function(obj) {
            var k;

            this._objpool.push(obj);

            this.metrics.totalfree++;
            // 对象还回池中后，
            // 还需要对对象进行清理，清除脏数据
            for (k in obj) { 
                delete obj[k]; 
            }

            // 重新初始化
            obj.init.call(obj);
        },
        // 垃圾回收
        // 在Object Pool模式下，垃圾回收便显得多余了
        // 如果有需求的话，还是提供这样一个接口
        collect: function () {
            this._objpool = [];

            var inUse = this.metrics.totalalloc - this.metrics.totalfree;
            // 记录下当前未被回收但已分配的个数
            this._clearMetrics(inUse);
        },
        _clearMetrics: function (allocated) {
            this.metrics.totalalloc = allocated || 0;
            this.metrics.totalfree = 0;            
        }

    }

    return ObjectPool

})();


```

有了上面的类库，我的子弹代码可以继续改进：

```
// 子弹类
var Bullet = function () {};
// 创建 Object Pool
var bulletPool = new ObjectPool(Bullet);
// 新的子弹
var bullet = bulletPool.alloc();
// 销毁子弹
bullPool.free(bullet)

```

最后要说明的是Object Pool并非万能。如果对于一些性能要求较高的大型应用，预先的一次性创建大批对象同样是一种代价；而对于小型应用，因为Object Pool基本不会对内存进行回收，所以会长时间大量占用内存，这同样是值得商榷的。使用Object Pool之后内存的使用情况应该如下图所示：

![Alt text](http://www.html5rocks.com/en/tutorials/speed/static-mem-pools/fig3.jpg)

参考资料

- [Effectively managing memory at Gmail scale - HTML5 Rocks](http://www.html5rocks.com/en/tutorials/memory/effectivemanagement/)
- [Static Memory Javascript with Object Pools - HTML5 Rocks](http://www.html5rocks.com/en/tutorials/speed/static-mem-pools/)
- [High-Performance, Garbage-Collector-Friendly Code - Build New Games](http://buildnewgames.com/garbage-collector-friendly-code/)
- [Garbage Collection (JavaScript: The Definitive Guide, 4th Edition)](http://docstore.mik.ua/orelly/webprog/jscript/ch11_03.htm)
- [Mark-compact algorithm - Wikipedia, the free encyclopedia](http://en.wikipedia.org/wiki/Mark-compact_algorithm)
- [Cheney's algorithm - Wikipedia, the free encyclopedia](http://en.wikipedia.org/wiki/Cheney%27s_algorithm)
- [Garbage collection (computer science) - Wikipedia, the free encyclopedia](http://en.wikipedia.org/wiki/Garbage_collection_(computer_science))
- [Memory Management - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)










