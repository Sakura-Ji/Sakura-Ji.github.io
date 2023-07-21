# 特性工具的测试

## 思维导图

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<title>Markmap</title>
<style>
* {
  margin: 0;
  padding: 0;
}
#mindmap {
  display: block;
  width: 100vw;
  height: 100vh;
}
</style>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/markmap-toolbar@0.14.4/dist/style.css">
</head>
<body>
<svg id="mindmap"></svg>
<script src="https://cdn.jsdelivr.net/npm/d3@6.7.0"></script><script src="https://cdn.jsdelivr.net/npm/markmap-view@0.14.4"></script><script src="https://cdn.jsdelivr.net/npm/markmap-toolbar@0.14.4/dist/index.umd.min.js"></script><script>(r => {
                setTimeout(r);
              })(() => {
  const {
    markmap,
    mm
  } = window;
  const toolbar = new markmap.Toolbar();
  toolbar.attach(mm);
  const el = toolbar.render();
  el.setAttribute('style', 'position:absolute;bottom:20px;right:20px');
  document.body.append(el);
})</script><script>((getMarkmap, getOptions, root, jsonOptions) => {
        const markmap = getMarkmap();
        window.mm = markmap.Markmap.create('svg#mindmap', (getOptions || markmap.deriveOptions)(jsonOptions), root);
      })(() => window.markmap,null,{"type":"heading","depth":0,"payload":{"lines":[0,1]},"content":"网络通信","children":[{"type":"heading","depth":1,"payload":{"lines":[2,3]},"content":"客户端","children":[{"type":"list_item","depth":2,"payload":{"lines":[4,5],"index":1},"content":"1. socket()"},{"type":"list_item","depth":2,"payload":{"lines":[5,6],"index":2},"content":"2. 设置要登录的服务器地址IP和端口号Port"},{"type":"list_item","depth":2,"payload":{"lines":[6,7],"index":3},"content":"3. connect()向服务器端请求建立连接"},{"type":"list_item","depth":2,"payload":{"lines":[7,8],"index":4},"content":"4. send()向服务器发送消息--参数中的socket是客户端自己创建的"},{"type":"list_item","depth":2,"payload":{"lines":[8,9],"index":5},"content":"5. recv()接收服务器消息--参数中的socket是客户端自己创建的"},{"type":"list_item","depth":2,"payload":{"lines":[9,10],"index":6},"content":"6. close()关闭客户端创建的套接字"}]},{"type":"heading","depth":1,"payload":{"lines":[12,13]},"content":"服务器","children":[{"type":"list_item","depth":2,"payload":{"lines":[14,15],"index":1},"content":"1. socket()"},{"type":"list_item","depth":2,"payload":{"lines":[15,16],"index":2},"content":"2. 设置服务器地址IP和端口号Port"},{"type":"list_item","depth":2,"payload":{"lines":[16,17],"index":3},"content":"3. bind()将套接字与特定的地址和端口绑定"},{"type":"list_item","depth":2,"payload":{"lines":[17,18],"index":4},"content":"4. listen()设置服务器在同一时刻最多允许多少个客户端连接"},{"type":"list_item","depth":2,"payload":{"lines":[18,19],"index":5},"content":"5. accept()等待客户端连接并创建新的套接字--通信套接字"},{"type":"list_item","depth":2,"payload":{"lines":[19,20],"index":6},"content":"6. recv()接收客户端发送的消息--参数中的socket是accept创建的通信套接字"},{"type":"list_item","depth":2,"payload":{"lines":[20,21],"index":7},"content":"7. send()向客户端发送消息--参数中的socket是accept创建的通信套接字"},{"type":"list_item","depth":2,"payload":{"lines":[21,22],"index":8},"content":"8. close()关闭服务器创建的套接字和accept创建的新的用来通信的套接字+"}]}]},{})</script>
</body>
</html>

## 视频插件

<iframe height=498 width=710 src="//player.bilibili.com/player.html?aid=995462295&bvid=BV1os4y197wb&cid=1107961344&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

## 音乐播放器

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=34341360&auto=1&height=66"></iframe>


## 浮空音乐播放

<!--音乐播放器-->
<script src="https://cdn.bootcdn.net/ajax/libs/jquery/1.10.0/jquery.min.js"></script>
<script src="https://myhkw.cn/player/js/player.js" id="myhk" key="demo" m="1"></script>

