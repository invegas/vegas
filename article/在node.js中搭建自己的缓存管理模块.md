##为什么要搭建自己的缓存管理模块？

这个问题其实也是在问，为什么不使用现有的Cache存储系统，比如Redis，比如memcached。不是说Redis不够好，只是在处理某些场景中使用的Redis会显的太“笨重”了——Redis的优势之一在于能够使用于多进程共享，有完善的备份和恢复机制。但问题在于如果你的缓存仅供单个进程使用，单个node实例使用，并且是可以承受缓存的丢失，承受冷启动。那么是值得使用不到500行的代码来搭建一个自己的缓存模块。

在node中做缓存最简单的作法莫过于使用一个Object对象，将缓存以key-value的形式存入这个对象中，并且这么做的理由只有一个，就是更快的存取速度。相比Redis通过TCP连接的形式与客户端进行通信，在程序中直接使用对象进行存储的效率会是Redis的40倍。文章的最后我会给出一个性能测试：10000次的set操作，Redis使用的时间为12.5秒左右，平均运算次数为(operations per second)为8013 o/s，而如果使用原生的Object对象，10000次操作只需要0.3秒，平均运算次数为322581 o/s


##搭建自己的Cache模块需要解决什么问题

### 缓存淘汰算法
介于缓存只能够有限的使用内存，任何Cache系统都需要一个如何淘汰缓存的方案（缓存淘汰算法，或者称之页面置换算法）。在node中无法像Redis那样设置使用内存大小（Redis中的maxmemory），所以我们只能通过缓存的个数（key-value对数）来间接对缓存大小进行控制。但这同时也赋予了我们另一自由，就是用何种算法来淘汰多余的缓存，以便能提高命中率。Redis的只提供五种淘汰方案(maxmemory-policy):

- volatile-lru: remove a key among the ones with an expire set, trying to remove keys not recently used(根据过期时间，移除最长时间没有使用过的).
- volatile-ttl: remove a key among the ones with an expire set, trying to remove keys with short remaining time to live(根据过期时间，移除即将过期的).
- volatile-random: remove a random key among the ones with an expire set(根据过期时间任意移除一个).
- allkeys-lru: like volatile-lru, but will remove every kind of key, both normal keys or keys with an expire set(无论是否有过期时间，根据LRU原则来移除).
- allkeys-random: like volatile-random, but will remove every kind of keys, both normal keys and keys with an expire set(无论是否有过期时间，随机移除).

可见Redis的移除策略大部分是根据缓存的过期时间和LRU(Least Recently Used，最近最少使用，，其核心思想是“如果数据最近被访问过，那么将来被访问的几率也更高”)算法来移除的。但过期时间和LRU算法并非适用于任何的业务逻辑：1.有的业务可以无需给缓存设置过期时间；2.在某些场景中LFU(Least Frequently Used, 最近最多使用，其核心思想是“如果数据过去被访问多次，那么将来被访问的频率也更高”)算法比LRU更优，能够减少缓存缓存污染，同时正因为LRU算法存在一定的缺陷（存在热点数据时，LRU的效率很好，但偶发性的、周期性的批量操作会导致LRU命中率急剧下降），才会有一些列LRU算法的变形，比如LRU-K, Two queues, Multi Queue等。

所以我们决定在缓存模块中嵌入多个淘汰算法，不仅仅如此，我还设想将当用户不确定他所需要的淘汰算法时，我们可以同时运行多个算法，比如对前100000次get操作的各个算法进行命中率统计，100000次操作之后自动切换至命中率最高的算法。

###数据结构

以LRU算法为例，因为需要根据缓存访问的新鲜度来淘汰冷门缓存，非常明显这会是一个队首进热门数据，队尾出冷门数据的队列，假设我们用数组来实现：

```
Recently used unshift in                                  Cold cache pop
------>[{key: value}, {key: value},{key: value}......{key: value}]------>
|                                                |
|<--------------Recently used--------------------|
```

每一项的数据结构如下：
```
var cache = [
    {
        key: key,
        value: value,
        expire: 1000 * 3
    },
    {
        key: key,
        value: value,
        expire: 1000 * 3
    } 
    ...   
]
```
那么在每一次取缓存时(get操作)，就不得不对这个数组进行遍历。因为遍历的时间复杂度会是O(n)，如果当n较大时，遍历花费的时间（包括遍历判断是否过期，以及过期之后的连锁操作）是相当可观的。

所以我们应该避免遍历——为了争取时间上的优势，就不得不在空间上有所牺牲。

仅仅考虑优化get操作的话，最理想的状态是把所有的key-value缓存都存入一个Object中，这样以来每次get操作都无需遍历，直接通过key就可以取得相应的value值：

```
var cache = {
    key1: {
        value: "value1",
        expire: 2000,
        ...
    },
    key2: {
        value: "value2",
        expire: 2000,
        ...
    }    
}

// Get 方法
var get = function (key) {
    return cache[key];
}
```

那么的队列如何体现？我的解决方案是另提供一个索引链表，仅将所以的key存入链表中：

```
head => key1 <=> key2 <=> key3 <=> ...<=> keyn <= tail
```

那么如何将索引与缓存关联起来呢？Key吗？根据用户传入的key再去索引链表中查找位置吗？这又回到了遍历，并且比数组更耗费时间。

总所周知，链表是通过无数个node节点以前后指针的形式连接起来的，考虑到避免遍历，便于插入，删除等操作，该链表应该是双向链表，每一个key在链表中对应一个node结构：

```
var node = {
    key: "key",
    count: 0 //访问次数，供LFU算法使用
    prev: null,
    next: null
}
```
每当有新的缓存插入时，链表应该返回被插入的节点的引用，cache中的缓存除了记录value，expire参数外，还应该记录自己节点在链表中的引用

```
var cache = {
    key1: {
        value: "value1",
        expire: 2000,
        node: node //在链表中对应位置的引用
    }  
}
```

这样以来，当我们尝试get某个缓存时，我们能通过节点的引用（node）很快的得到该缓存在队列中的位置，并且跳过遍历，仅通过修改相关节点的指针，来对顺序进行调整。

###缓存逻辑与算法的分离

在上一节我讲过希望能使用户根据自己的业务需求选择相应的缓存淘汰算法，那么就要考虑将算法独立出来，并提供相同的接口，供上一层调用。结构如下图所示：

```
|  Cache    Algorithm      Link
|                     
|---set---|---insert---|---unshift(LRU)
|                      |
|                      |---push(LFU)
|                      |
|                      |---pop
|                      
|---get---|---update---|---moveHead(LRU)
|         |            |
|         |            |---forward(LFU)
|         |            |
|         |            |---backward(LFU)
|         |
|-expire--|---del------|---del
```

注意到在Algorithm算法层，虽然提供的接口都非常简单，仅有插入链表(insert)，更新链表(update)，删除节点(del)三个接口，但内部的实现却大相径庭，实质上是对链表各个方法的调用。

以插入链表(insert)为例，在LRU算法中最近访问的数据在队首，较长时间未访问数据靠近队尾，所以数据务必从队首进，队尾出，所以应该调用的是队首插入的unshift方法，并且插入之后如果队列超长，那么需要调用pop方法将队尾元素弹出。

而LFU算法不同，虽然热门数据同样待在队首，但介于新数据的访问次数少热度低，应该从队尾进，所以插入时应该调用的方法是push，并且如果无位置插入，需要先将队尾的冷门数据用方法pop弹出。所以LFU队列的数据是队尾进，队尾出。

##实现

当数据结构，接口，层次决定好之后，实现不过就是按部就班的事情了


