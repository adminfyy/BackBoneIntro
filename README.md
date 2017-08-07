# Backbone 使用经验分享
Back主要包含下面几个模块，
## Backbone.Event 事件模式
Event是View跟Model还有Collection的基础，它主要实现了事件模式(订阅发布系统)[个人理解];  
只要将Event模式集成到任何对象里面，这个对象就具备的Event的API;   
当有两个模块或者两个对象相互关联的时候，通过模式解耦之后，在这种模式下，每个对象只需要关注自身的数据以及方法，对于另外一个模块需要的就是一个信号以及数据;
引用前辈给我讲得一句话：  
>“事件模式是一个良好的解耦模式”

