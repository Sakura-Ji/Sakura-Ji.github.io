# MQTT阿里云

学习资料:

* [Paho mqtt C语言库介绍](http://t.csdnimg.cn/bVpaA)

## MQTT介绍

MQTT（Message Queuing Telemetry Transport）是一种轻量级、基于发布-订阅模式的消息传输协议，适用于资源受限的设备和低带宽、高延迟或不稳定的网络环境。它在物联网应用中广受欢迎，能够实现传感器、执行器和其它设备之间的高效通信。

### MQTT报文功能解释(部分)

#### 连接物联网云平台的某个具体设备

```c
报文功能：连接云的某个具体设备
CONNECT:
	固定报头：
			1b:0x10
			2b:??
	可变报头：
			1b:0x00
			2b:0x04
			3b:'M' 0x4D
			4b:'Q' 0x51
			5b:'T' 0x54
			6b:'T' 0x54
			7b:0x04
			8b:0xC2
			9b:0x00
			10:0x3C
	有效负载：
		ClienID_Len(2byte)+CilenID+
		UserName_Len(2byte)+UserName+
		PassWord_Len(2byte)+PassWord
连接报文总览：
10 74 00 04 4D 51 54 54 04 C2 00 3C 00 29 6C 69 5F 74 65 73 74 7C 73 65 63 75 72 65 6D 6F 64 65 3D 33 2C 73 69 67 6E 6D 65 74 68 6F 64 3D 68 6D 61 63 73 68 61 31 7C 00 13 6C 69 5F 74 65 73 74 26 61 31 35 4A 32 77 48 75 57 66 75 00 28 39 35 65 32 38 32 32 31 35 30 34 63 37 62 63 35 33 33 35 65 62 65 39 36 31 33 62 34 61 32 65 62 32 61 39 63 66 36 66 37 
```

#### 向物联网云平台发送消息

```c
报文功能：给云发送消息
报文名：PUBLISH
报文原型：
	固定报头：
			1b:0x30
			2b:0xE4 0x01
	可变报头：
			Topic_Len(2byte)+Topic
	00 32 2F 73 79 73 2F 61 31 35 4A 32 77 48 75 57 66 75 2F 6C 69 5F 74 65 73 74 2F 74 68 69 6E 67 2F 65 76 65 6E 74 2F 70 72 6F 70 65 72 74 79 2F 70 6F 73 74 	
	有效负载：
            纯数据、纯消息(JSON格式数据)
连接报文总览：                
	09 7B 0D 0A 09 09 22 69 64 22 3A 22 32 33 30 37 38 38 30 22 2C 0D 0A 09 09 22 6D 65 74 68 6F 64 22 3A 22 74 68 69 6E 67 2E 65 76 65 6E 74 2E 70 72 6F 70 65 72 74 79 2E 70 6F 73 74 22 2C 22 70 61 72 61 6D 73 22 3A 7B 20 20 0D 0A 09 09 09 09 22 43 75 72 72 65 6E 74 48 75 6D 69 64 69 74 79 22 3A 38 30 2C 0D 0A 09 09 09 09 22 43 75 72 72 65 6E 74 54 65 6D 70 65 72 61 74 75 72 65 22 3A 32 36 2C 0D 0A 09 09 09 09 22 52 65 6C 61 79 22 3A 31 0D 0A 09 09 09 7D 2C 0D 0A 09 09 22 76 65 72 73 69 6F 6E 22 3A 22 31 2E 30 22 0D 0A 09 7D 		
```

#### 订阅主题才能接收到物联网云平台的消息

```c
报文功能：订阅主题 才能接收到云的消息
报文名字：SUBSCRBIE
报文原型：
	固定报头：
            1b:0x82
            2b:??
	可变报头：
            1b:00
            2b:0x0A
	有效负载：
            主题长度（2字节）+主题本身+0
```

## STM32实战演习

### 阿里云物联网平台设置

1. 创建产品(你的产品名称--会有你的产品KEY)

   * **Topic类列表**:

     * 基础通信Topic

     * **物模型通信Topic**：我们想要让设备(STM32)中数据上传、数据回收 就要使用到里面的

       > 属性上报  /sys/Your产品KEY/${deviceName}/thing/event/property/post  发布  设备属性上报

       这个就是我们将STM32采集到的数据上传使用的主题

       要将里面的${deviceName} 改成  (你自己的设备名称)，上面的发布意思是 我们具有发布的权限

       > 属性设置 /sys/Your产品KEY/${deviceName}/thing/service/property/set   订阅  设备属性设置

       这个就是我们可以使用阿里云物联网下发数据使用的主题

       要将里面的${deviceName} 改成  (你自己的设备名称)，上面的订阅意思是 我们具有订阅的权限

     * 自定义Topic

   ![AliYun_Topic](https://pic.imgdb.cn/item/65210183c458853aef2e26f3/AliYun_Topic.png)

   * **功能定义**：这里放置你要上传的STM32的数据

     ![AliYun_Function](https://pic.imgdb.cn/item/6521018bc458853aef2e2844/AliYun_Function.png)

2. 添加设备 (基于上方创建的产品下--设备名称)

   * **设备信息:**MQTT连接信息

     ```json
     {
         "clientId":"Your clientId",
         "username":"Your username",
         "mqttHostUrl":"iot-06z00f5ugqk5544.mqtt.iothub.aliyuncs.com", 
         "passwd":"Your passwd",
         "port":1883
     }
     ```

   * **物模型数据**：产品中的功能定义上线的功能会在这里出现

     ![AliYun_EquipmentObjMode](https://pic.imgdb.cn/item/6521018fc458853aef2e294b/AliYun_EquipmentObjMode.png)

3. 完成以上两步后，可以先使用MQTT.fx软件实现MQTT连接阿里云，发送的数据格式应该如下

   * ```json
     {
     	"method" : "thing.event.property.post" ,
     	"id": "162277852",
     	"params" :{
     		"Tem" : 11.0,
     		"Hum" : 22.0
     		},
     	"version" : "1.0.0"
     }
     ```

     ![MQTT_fx_Set](https://pic.imgdb.cn/item/65210191c458853aef2e29b5/MQTT_fx_Set.png)

---

   ### 使用MQTT代码连接阿里云

1. 首先先移植MQTT的库[eclipse/paho.mqtt.embedded-c: Paho MQTT C client library for embedded systems. Paho is an Eclipse IoT project (https://iot.eclipse.org/) (github.com)](https://github.com/eclipse/paho.mqtt.embedded-c)

   * 路径:paho.mqtt.embedded-c-master\MQTTPacket\src

   * 这个src里面的所有`.c`和`.h`文件都要，然后将他们复制到我们keil的工程文件里面，新建一个MQTT文件夹

   * | 文件名                   | 解释                                                         |
     | ------------------------ | ------------------------------------------------------------ |
     | MQTTConnectClient.c      | 包含了作为MQTT客户端的连接服务器，断开连接，发送心跳请求的函数 |
     | MQTTConnectServer.c      | 包含了作为MQTT服务端处理连接请求所需要的函数                 |
     | MQTTDeserializePublish.c | 包含了解析PUBLISH报文的函数，通俗说就是接收消息用的          |
     | MQTTFormat.c             | 包含了报文构造函数，被其它文件中的报文构造函数调用，不直接调用里面的函数 |
     | MQTTPacket.c             | 包含了供其他文件调用的一些解析报文用的函数                   |
     | MQTTSerializePublish.c   | 包含了构造PUBLISH，PUBACK，PUBREC，PUBREL报文的函数，通俗说就是发消息用的 |
     | MQTTSubscribeClient.c    | 包含了构造SUBSCRIBE报文的函数，发送订阅主题的请求时使用的    |
     | MQTTSubscribeServer.c    | 包含了解析SUBSCRIBE和构造SUBACK的函数，服务端使用的文件      |
     | MQTTUnsubscribeClient.c  | 包含了构造UNSUBSCRIBE的函数，发送取消订阅主题的时使用        |
     | MQTTUnsubscribeServer.c  | 包含了解析UNSUBSCRIBE和构造UNSUBACK报文的函数，服务端使用的文件 |

2. 那我们如何使用这个库函数呢?可以参考 他给的库中的代码示例（示例在和src同一级里面的samples中）

3. 使用代码实现上传到阿里云

   ```c
   /*ESP8266.c中的代码*/
   
   /**
     * @brief  使用AT指令 WIFI先连接阿里云服务器
     * @param  
     * @retval 
     */
   void Wifi_ConnectAliYun(void)
   {
     if(EspSendCmdAndCheckRecvData("AT\r\n","OK",1000) == 1)
     {
       if(EspSendCmdAndCheckRecvData("AT+CWMODE=1\r\n","OK",1000) == 1)
       {
         if(EspSendCmdAndCheckRecvData("AT+CWJAP=\"Your热点名称\",\"Your 热点密码\"\r\n","OK",10000) == 1)
         {
           if(EspSendCmdAndCheckRecvData("AT+CIPSTART=\"TCP\",\"iot-06z00f5ugqk5544.mqtt.iothub.aliyuncs.com\",1883\r\n","OK",10000)==1)//连接阿里云服务器的网址和端口号都是共用的
           {
             EspSendCmdAndCheckRecvData("AT+CIPMODE=1\r\n","OK",1000);//开启透传
             EspSendCmdAndCheckRecvData("AT+CIPSEND\r\n",">",1000);//发送数据
             MqttConnect();//MQTT开始连接物联网平台 
             
             Delay_ms(100);//连接成功之后  不能立刻执行其他的功能
             //MqttSubscride();只需要订阅一次
             //清空回收的buff
             memset(wifi.rxbuff,0,1024);
             wifi.rxover = 0;     
             wifi.rxcount = 0;         
           }
         }
       }
     }
   }
   /**
     * @brief  使用MQTT连接阿里云物联网平台 -- 平台兼容MQTT协议5.0、3.11、3.1版本 --
     * @param  
     * @retval 
     */
   void MqttConnect(void)
   {
     MQTTPacket_connectData data = MQTTPacket_connectData_initializer;//使用MQTT库函数中的宏定义初始化 data
     
     data.clientID.cstring = "Your clientId";//根据上文中你的ID
     data.username.cstring = "Your username";//你的username
     data.password.cstring = "Your password";//你的密码
     /*下面这个操作就是把data中的数据 构造成可以使用的CONNECT的报文 然后将这个报文 放到wifi.txbuff缓存起来 并返回报文的长度*/
     int len = MQTTSerialize_connect(wifi.txbuff, 1024, &data);
     
     Esp8266_SendString(wifi.txbuff,len);//通过串口发送到ESP8266然后MQTT协议开始和物联网平台对接
     
   }
   ```

   ```c
   /*使用到MQTT库函数连接到物联网平台的部分代码--MQTTConnectClient.c*/
   
   #define MQTTPacket_willOptions_initializer { {'M', 'Q', 'T', 'W'}, 0, {NULL, {0, NULL}}, {NULL, {0, NULL}}, 0, 0 }
   /*初始化用到的就是👇这个宏定义DATA*/
   #define MQTTPacket_connectData_initializer { {'M', 'Q', 'T', 'C'}, 0, 4, {NULL, {0, NULL}}, 60, 1, 0, 
   		MQTTPacket_willOptions_initializer, {NULL, {0, NULL}}, {NULL, {0, NULL}} }
   
   /*包含 WILL TOPIC 和WILL MESSAGE 字段 下面的结构体包含这个*/
   typedef struct
   {
   	/** The eyecatcher for this structure.  must be MQTW. */
   	char struct_id[4];
   	/** The version number of this structure.  Must be 0 */
   	int struct_version;
   	/** The LWT topic to which the LWT message will be published. */
   	MQTTString topicName;
   	/** The LWT payload. */
   	MQTTString message;
   	/**
         * The retained flag for the LWT message (see MQTTAsync_message.retained).
         */
   	unsigned char retained;
   	/**
         * The quality of service setting for the LWT message (see
         * MQTTAsync_message.qos and @ref qos).
         */
   	char qos;
   } MQTTPacket_willOptions;
   
   /*MQTT连接服务器数据结构体*/
   typedef struct
   {
   	/** The eyecatcher for this structure.  must be MQTC. */
   	char struct_id[4];//这个就是会用来存放“MQTC”这个字符串的，因为CONNECT报文中会包含这段识别码。
   	/** The version number of this structure.  Must be 0 */
   	int struct_version;//就写0，照着注释来。
   	/** Version of MQTT to be used.  3 = 3.1  4 = 3.1.1
   	  */
   	unsigned char MQTTVersion;//这个是指明使用的MQTT协议的版本，注释说必须要3，我们遵照注释使用
   	MQTTString clientID;//用来设置clientID根据个人需要设置
   	unsigned short keepAliveInterval;//用来设置回话保持时长，默认是60s
   	unsigned char cleansession;//指定了会话状态的处理方式，控制会话状态生存时间,是继续会话还是重新开始
   	unsigned char willFlag;//遗嘱标志（Will Flag）被设置为 1，表示如果连接请求被接受了，遗嘱（Will Message）消息必须被存储在 服务端并且与这个网络连接关联 -- 此代码中默认0 没有使用遗嘱
   	MQTTPacket_willOptions will;//包含 WILL TOPIC 和WILL MESSAGE 字段 -- 遗嘱信息
   	MQTTString username;//设置连接用户名
   	MQTTString password;//设置连接密码
   } MQTTPacket_connectData;
   
   typedef struct
   {
   	int len;
   	char* data;
   } MQTTLenString;
   
   typedef struct
   {
   	char* cstring;
   	MQTTLenString lenstring;
   } MQTTString;
   
   int MQTTSerialize_connect(unsigned char* buf, int buflen, MQTTPacket_connectData* options)
    /*这个函数是用来构造MQTT协议中的CONNECT报文的，连接服务器就靠这个函数了，
      buf这个参数就是用来存放构造好的CONNECT报文的缓冲区，
      buflen就是指明缓冲区的大小，防止在构造报文时指针越界,
      MQTTPacket_connectData是Paho库声明的一种结构体，
      其中在unsigned char MQTTVersion;以下的是有效载荷，以上的是固定和可变报头*/
   ```

---

### 将STM32数据上传到阿里云

 上面已经连接到了阿里云的物联网平台 那么接下来 就是把STM32采集到的数据 发送给阿里云

```c
/**
  * @brief  发送数据给阿里云服务器
  * @param  
  * @retval 
  */

void MqttSend(void)
{
  
  char buff[512] = {0};//用来存放有效载荷的数据
  
  memset(wifi.txbuff,0,1024);//清空wifi.txbuff
  
  MQTTString topicString = MQTTString_initializer;
  
  topicString.cstring = "/sys/Your产品KEY/你的设备名称/thing/event/property/post";//你的产品中的物模型通信Topic中的 设备属性上报
  /*使用JSON数据格式，参数的数据名称和数据类型一定要和阿里云上设置的一样*/
  sprintf(buff,"{\
  \"method\":\"thing.event.property.post\" ,\
  \"id\": \"162277852\",\
  \"params\" :{\
  \"Tem\" : %.lf\
  },\
  \"version\" : \"1.0.0\"}",11.0);//11.0处可以改成你的全局变量 其它传感器获取到的数据
  
    /*下面这个操作就是把topicString和buff中的数据做成有效载荷 放到可以使用的PUBLISH的报文中 然后将这个报文 放到wifi.txbuff缓存起来 并返回报文的长度*/
  int len = MQTTSerialize_publish(wifi.txbuff, 1024, 0, 0, 0, 0, topicString, (unsigned char*)buff,strlen(buff));
  
  Esp8266_SendString(wifi.txbuff,len);//通过串口发送到ESP8266然后将MQTT数据帧格式发送给阿里云物联网平台
}
```

```c
/*使用到MQTT库函数发送数据到物联网平台的部分代码 -- MQTTSerializePublish.c*/

#define MQTTString_initializer {NULL, {0, NULL}}

typedef struct
{
	int len;
	char* data;
} MQTTLenString;

typedef struct
{
	char* cstring;
	MQTTLenString lenstring;
} MQTTString;


int MQTTSerialize_publish(unsigned char* buf, int buflen, unsigned char dup, int qos, unsigned char retained, unsigned short packetid,MQTTString topicName, unsigned char* payload, int payloadlen)
/*    
	这个函数是 构造PUBLISH报文的函数，需要发送消息的依靠此函数构造报文
    buf这个参数就是用来存放构造好的PUBLISH报文的缓冲区，buflen就是指明缓冲区的大小，防止在构造报文时指针越界,
    dup这个参数表示客户端或者服务器是第一次发送这个PUBLISH报文，当DUP被设置为1，表示这可能是一个早期报文的重发。
    qos是用于存放收到的消息的qos等级，可以根据此选择是否需要回发应答保证交付，pub时指定的qos是服务器肯定按此规则接收，但是最终订阅者不一定。sub时指定的qos表示订阅者可以接收的最高消息等级，也就是可能收到更低等级的消息。
	retained用于存放保存标志，如果retained为1，服务端需要保存这一条消息，以便将来订阅相应主题的人能够立即收到该消息。客户端可以以此判断这是否是一条服务器保存的历史消息。
	packetid这个是用来进行一个简单的识别的，如果Qos等级为0的话，没有这个字段，当Qos等级大于0时，接收此条消息的服务端和客户端需要回发应答，为了对应每一条应答报文和PUBLISH报文就需要设置这个字段，保证应答报文和PUBLISH对应上。对于某一条Qos等级大于0的报文，会有一个相应的应答，packetid就是用来区分接到的应答是否时应答对应PUBLISH报文的一个标识
	topicName这个参数是用来存放订阅主题的，每条PUBLISH报文中都会包含主题名，方便客户端区分这是来自哪一个主题的消息。
	payload和payloadlen是用于存放PUBLISH报文中的有用消息，以及消息的长度。-- 这个就是有效载荷放我们的参数数据
*/
```

---

### 阿里云下发数据到STM32

首先从阿里云的产品中功能定义中设置一个bool数据型的LED功能，然后设备上线后在 `在线调试`模式下发送LED1数据

![Anliyun_set](https://pic.imgdb.cn/item/65210198c458853aef2e302b/Anliyun_set.png)

<img src="https://pic.imgdb.cn/item/6521019ac458853aef2e310a/WIFI_RecvCmd.png" alt="WIFI_RecvCmd" style="zoom: 67%;" />

```c
/**
  * @brief  订阅主题 只需要订阅一次即可
  * @param  
  * @retval 

  */

void MqttSubscride(void)
{
  memset(wifi.txbuff,0,1024);

  MQTTString topicString = MQTTString_initializer;//使用MQTT库函数中的宏定义初始化 topicString
  
  topicString.cstring = "/sys/Your产品KEY/你的设备名称/thing/service/property/set";//你的产品中的物模型通信Topic中的 设备属性设置
  
  int req_qos = 0;
  /*下面这个操作就是把topicString中的数据做成有效载荷 放到可以使用的SUBSCRIBE的报文中 然后将这个报文 放到wifi.txbuff缓存起来 并返回报文的长度*/
  int len = MQTTSerialize_subscribe(wifi.txbuff,1024, 0, 1, 1, &topicString, &req_qos);
  
  Esp8266_SendString(wifi.txbuff,len);//通过串口发送到ESP8266然后将MQTT数据帧格式发送给阿里云物联网平台
}


/**
  * @brief  解析阿里云下发的数据JSON
  * @param  
  * @retval 
  */
void MqttDataAnay(void)
{
  if(wifi.rxover==1)
  {
    wifi.rxover = 0;
    if(wifi.rxcount>10)//判断是否是 下发指令的回传的指令 而不是上传时系统默认下发的 //防止有影响
    {
    char *addr =  strstr((char *)(wifi.rxbuff+6),"LED1");//(wifi.rxbuff+6)是因为初始几个字符会造成strstr函数认为字符串结束
    addr+=6;//获取LED1所在位置后移动6位就是0所在的位置
    if(*addr == '0')//0关闭
      LED1_OFF();
    else if(*addr == '1')//1开启
      LED1_ON();
    
    memset(wifi.rxbuff,0,1024);
    wifi.rxcount = 0;
    
    }
  }
}
```

```c
/*使用到MQTT库函数发送数据到物联网平台的部分代码 -- MQTTSubscribeClient.c*/

#define MQTTString_initializer {NULL, {0, NULL}}

typedef struct
{
	int len;
	char* data;
} MQTTLenString;

typedef struct
{
	char* cstring;
	MQTTLenString lenstring;
} MQTTString;

int MQTTSerialize_subscribe(unsigned char* buf, int buflen, unsigned char dup, unsigned short packetid, int count,MQTTString topicFilters[], int requestedQoSs[])
    /*
	这个是构造SUBSCRIBE报文的函数，需要订阅主题的时候依靠此函数构造对应的报文，
    buf这个参数就是用来存放构造好的SUBSCRIBE报文的缓冲区，buflen就是指明缓冲区的大小，防止在构造报文时指针越界,
    dup这个参数表示客户端或者服务器是第一次发送这个SUBSCRIBE报文，当DUP被设置为1，表示这可能是一个早期报文的重发。
    packetid这个是用来进行一个简单的识别的，如果Qos等级为0的话，没有这个字段，当Qos等级大于0时，接收此条消息的服务端和客户端需要回发应答，为了对应每一条应答报文和PUBLISH报文就需要设置这个字段，保证应答报文和PUBLISH对应上。对于某一条Qos等级大于0的报文，会有一个相应的应答，packetid就是用来区分接到的应答是否时应答对应PUBLISH报文的一个标识
    count和requestedQoSs这两个参数需要对应，假设只是用一个int型变量取址的形式给requestedQoSs传参，count要为1。这是由与下面这段代码的原因：
    for (i = 0; i < count; ++i)
	{
		writeMQTTString(&ptr, topicFilters[i]);
		writeChar(&ptr, requestedQoSs[i]);
	}
	如果count为0，那么这段循环将不会运行，主题名和Qos等级这两个字段将不会被加入到报文中，从而订阅失败，如果你需要一次性订阅多个主题，就需要使用MQTTString数组和一个对应每个主题Qos等级的requestedQoSs数组，然后count的数值要和订阅主题的数量相同。
    topicFilters[]就是我们要订阅的主题标题
    */
```











