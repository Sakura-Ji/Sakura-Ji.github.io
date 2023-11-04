---
comments: true
---

# Can通信

学习资料: 

* [正点原子 CAN总线的学习](https://www.bilibili.com/video/BV1G54y1M785/?share_source=copy_web&vd_source=1f86b29b1eacf120a2143333a298e645)
* [瓶邪!-CAN详解](http://t.csdnimg.cn/qEIMB)

## 前言

**LAN（即局域网）**是最常见且应用最为广泛的一种网络，它是指在1~5公里范围内两台以上的计算机设备（如服务器、工作站）通过线缆（如同轴线缆、双绞线、光缆等）连接起来实现的资源共享的计算机网络，如家庭、办公室、学校或者有计算机、服务器和外围设备（如打印机、扫描仪、投影仪以及其他存储）的建筑群。

目前，以太网（IEEE 802.3 标准）是最常见的局域网组网方式，近年来随着802.11标准的制定，IEEE802.11a/b/g/n等无线协议得到广泛应用，无线局域网的应用也越来越普及，此外，LAN（局域网）类型还有令牌环和FDDI（光纤分布数字接口，IEEE 802.8）。

**差分数据传输**可以有效减少外界电磁噪声对信号的干扰，尤其是共模噪声，当总线受到干扰时，两根总线会同时受影响，但其差分电压并不会受影响

**双绞线**由两根相互绝缘的导线相互缠绕而成，特别适合差分信号传输场合，与平行线相比，双绞线不仅可以降低自身对外界的干扰，同时可以消除与外界干扰源的电容耦合和感应耦合，因此CAN通讯中经常使用双绞线进行数据传输

## CAN的简介

CAN（Controller Area Network），是ISO国际标准化的**串行通信协议**

* **低速CAN**(ISO11519)通信速率10~125Kbps，总线长度可达1000米
  * 开环总线

* ==**高速CAN**==(ISO11898)通信速率125Kbps~1Mbps，总线长度≤40米
  * 闭环总线 -- 有终端电阻，用于阻抗匹配，以减少回波反射

* **CAN FD** 通信速率可达5Mbps，并且兼容经典CAN，遵循ISO 11898-1 做数据收发

![CAN_Struct](https://pic.imgdb.cn/item/6545ad51c458853aef973910/CAN_Struct.png)

CAN总线由两根线（ CANL 和 CANH ）组成，允许挂载多个设备节点

==**CAN总线的特点**==

1.  多主控制 			每个设备都可以主动发送数据
2. 系统的柔软性       没有类似地址的信息，添加设备不改变原来总线的状态
3. 通信速度              速度快，距离远
4. 错误检测&错误通知&错误恢复功能
5. 故障封闭             判断故障类型，并且进行隔离
6. 连接节点多          速度与数量找个平衡

CAN总线协议已广泛应用在汽车电子、工业自动化、船舶、医疗设备、工业设备等方面

本文以**高速CAN**作为讲解

## CAN的通信原理

要想进行Can通信 必须要有专门的CAN**收发芯片** 

CAN使用差分信号进行数据传输，根据CAN_H和CAN_L上的**电位差**来判断总线电平，总线电平分为显性电平(逻辑0)和隐性电平(逻辑1)，二者必居其一，**显性电平具有优先权**。发送方通过使**总线电平发生变化**，将消息发送给接收方。

![Can_Connect](https://pic.imgdb.cn/item/6545ad55c458853aef97450b/Can_Connect.png)

单片机发送给Can收发器的是普通信号(0--低电平，1--高电平)，但经过Can收发器后，变成了差分信号，差分信号是用两根线表示一个信号，CAN High和CAN LOW

* 当单片机给CAN收发器一个 低电平时 --> CAN HIGH输出3.5V  CAN LOW输出1.5V 差值2V 表示低电平 逻辑0  -- 显性电平

* 当单片机给CAN收发器一个 高电平时 --> CAN HIGH输出2.5V  CAN LOW输出2.5V 差值0V 表示高电平 逻辑1  -- 隐性电平

  ![CAN_ElectricalLecel](https://pic.imgdb.cn/item/6545ad59c458853aef974fb6/CAN_ElectricalLecel.png)

| 电平          | 高速CAN                 | 低速CAN                    |
| ------------- | ----------------------- | -------------------------- |
| 显性电平（0） | UCAN_H –  UCAN_L= 2V    | UCAN_H –  UCAN_L  =  3V    |
| 隐性电平（1） | UCAN_H –  UCAN_L  =  0V | UCAN_H –  UCAN_L  = - 1.5V |

同样的CAN收发器也可以把收到的差分信号，转换成普通的电平信号，传输给单片机

这样使用差分信号的是两根线共同作用，并且是双绞线缠绕这样即使是收到干扰，也是两根线同时收到干扰，它们的压差也会保持不变，这样就可以保证传输的信号不受干扰，传输距离很长，可达1000米(低速)

## CAN协议层

**CAN总线以“帧”形式进行通信**。CAN协议定义了5种类型的帧：**数据帧、遥控帧、错误帧、过载帧、间隔帧**，其中数据帧最为常用。

| 帧类型                      | 帧作用                                         |
| --------------------------- | ---------------------------------------------- |
| **数据帧**（Data Frame）    | 用于发送单元向接收单元传输数据的帧             |
| **遥控帧**（Remote Frame）  | 用于接收单元向具有相同ID的发送单元请求数据的帧 |
| 错误帧（Error Frame）       | 用于当检测出错误时向其他单元通知错误的帧       |
| 过载帧（Overload Frame）    | 用于接收单元通知其尚未做好接收准备的帧         |
| 间隔帧（Inter Frame Space） | 用于将数据帧  及遥控帧与前面的帧分离开来的帧   |

数据帧和遥控帧最大的区别在于有没有数据段

### CAN的数据帧

数据帧由**7段**组成。数据帧又分为标准帧(CAN2.0A)和扩展帧(CAN2.0B)，主要体现在仲裁段和控制段

![Can_DataFrames](https://pic.imgdb.cn/item/6545ad5dc458853aef975b77/Can_DataFrames.png)

**起始位(1位):** 逻辑0 -- 显性信号

**识别码(11位)：**通过识别码就可以知道这一帧数据发送给哪一个设备，每一个设备都有属于自己的11位识别码

**RTR位(1位)：**用来区分数据帧(0)或者远程请求帧(1) 

**控制码(6位)：**是用来控制长度的

* 第一位 **IDE位**，用来区分标准格式和扩展格式
  * 在标准格式中有11位识别码
  * 在扩展格式中有29位识别码

* 第二位 预留位 也是**空闲(保留)位**--逻辑0 -- 显性信号
* 接下来4位是 DLC位 -- **DLC即数据长度代码**
  * 当DLC为 0001 时 后面跟 1个字节的代码
  * 当DLC为 0010 时 后面跟 2个字节的代码
  * 当DLC为 0011 时 后面跟 3个字节的代码
  * ···
  * 当DLC为 1000 时 后面跟 8个字节的代码

**CRC(16位)**：循环冗余校验位，是为了确保数据的准确性而设置的

* 15位CRC校验码 设备接收端会根据数据计数出它的CRC位，如果计算出来的和接收到的CRC不一致，说明数据存在问题，就会发送设备就会重新发送一遍数据帧
* 第16位是CRC的界定符就是**DEL位**，是逻辑1 -- 隐性信号，是为了把后面的信息隔开

**ACK(2位)：**应答位

* 第一位是ACK确认槽，发送端发送的是逻辑1，接收端回复逻辑0来表示应答
* 第二位是ACK界定位也就是**DEL位**，一定是逻辑1 -- 隐性信号，作用是把后面的数据隔开

**结束位(7位)：**7位都是逻辑1 -- 隐性信号，表示数据帧传输结束

## CAN的位时序介绍

CAN总线以==“**位同步**”==机制，实现对电平的正确采样。**位数据**都由四段组成：

* **同步段(SS) ：**它的作用就是判断 **节点 与 总线** 的时序是否一致
* **传播时间段(PTS) ：**用于补偿网络的延时时间
* **相位缓冲段1(PBS1) ：** 用来补偿阶段的误差
* **相位缓冲段2(PBS2) ：** 用来补偿阶段的误差

**每段由多个位时序Tq组成**，Tq可以理解为时间单位，我们可以规定其大小，一般是 1Tq = 1us

![CAN_BitAlignment](https://pic.imgdb.cn/item/6545ad61c458853aef9765b4/CAN_BitAlignment.png)

* **采样点**是指读取总线电平，并将读到的电平作为位值的点

* **注意 :只有** ==**节点监测到总线上信号的跳变在SS段范围内**==，才 表示节点与总线的时序是同步，**此时采样点的电平即该位的电平**。

* 根据位时序，就可以计算CAN通信的  波特率= 1/正常的位时间 可跳转到[CAN控制器的时序图](#CANTIME)学习

### CAN的数据同步

由于时钟频率误差、传输上的相位延迟引起偏差会导致数据不同步，CAN为了实现对总线电平信号的正确采样，采取**数据同步**，数据同步分为**硬件同步和再同步**

#### 硬件同步

由于CAN通讯协议并没有时钟信号线，所以各个节点之间要约定好特定的波特率进行通讯， **节点**通过CAN总线发送数据，一开始发送**帧起始信号**。总线上其他节点会**检测帧起始信号在不在位数据的SS段内**，判断内部时序与总线是否同步。假如不在SS段内，这种情况下，采样点获得的电平状态是不正确的。所以，节点会使用硬件同步方式调整， 把自己的SS段平移到检测到边沿的地方，获得同步，同步情况下，采样点获得的电平状态才是正确的。

硬件同步就是在监测到帧起始位的时候 -- 视为SS同步段 所以 硬件同步的坏处就是 必须有帧起始信号(当然了 我觉得起始信号本来就是必须的)

![CAN_HardwareSynchro](https://pic.imgdb.cn/item/6545ad65c458853aef976eea/CAN_HardwareSynchro.png)

#### 再同步

再同步利用**普通数据位**的边沿信号（帧起始信号是特殊的边沿信号）进行同步。再同步的方式分为两种情况：**超前和滞后**，即**边沿信号与SS段的相对位置**。

**超前:** 即边沿信号 出现在 SS之前 

![CAN_ResynchroAhead](https://pic.imgdb.cn/item/6545ad6bc458853aef978100/CAN_ResynchroAhead.png)

**滞后:** 即边沿信号 出现在SS之后

![CAN_ResynchroHysteresis](https://pic.imgdb.cn/item/6545ad6dc458853aef978751/CAN_ResynchroHysteresis.png)

再同步时，PSB1和PSB2中增加或者减少的时间被称为“**再同步补偿宽度（SJW）**”,其范围：1~4 Tq，限定了SJW值后，再同步时，不能增加限定长度的SJW值。SJW值较大时，吸收误差能力更强，但是通讯速度会下降。

## CAN总线仲裁

CAN总线处于空闲状态(隐性电平)，最先开始发送消息的单元获得发送权

多个单元**同时开始发送**时，从**仲裁段(报文ID)的第一位开始进行仲裁**。**连续输出显性电平最多的单元可继续发送**，即首先出现隐性电平的单元失去对总线的占有权变为接收。(至于为什么是 显性 我觉得可同I2C理解 即因硬件电路原因 总线有0则全体被拉低)

![CAN_Arbitration](https://pic.imgdb.cn/item/6545ad80c458853aef97bd26/CAN_Arbitration.png)

**竞争失败单元，会自动检测总线空闲，在第一时间再次尝试发送**

## STN32之CAN控制器

**STM32 CAN控制器**（bxCAN 是基本扩展CAN(Basic Extended CAN)的缩写），支持CAN 2.0A 和 CAN 2.0B Active版本协议，它的设计 目标是，以最小的CPU负荷来高效处理大量收到的报文，它也支持报文发送的优先级要求(优先 级特性可软件配置) 

CAN 2.0A 只能处理标准数据帧且扩展帧的内容会识别错误，而CAN 2.0B Active 可以处理标准数据帧和扩展数据帧，CAN 2.0B Passive只能处理标准数据帧且扩展帧的内容会忽略。

**bxCAN主要特点：**

* 波特率最高可达1M bps
* 支持时间触发通信（CAN的硬件内部定时器可以在TX/RX的帧起始位的采样点位置生成时间戳）
* 具有3级发送邮箱
* 具有3级深度的2个接收FIFO
* 可变的过滤器组（也就是滤波器/筛选器 最多28个 - F103有14个 F407有28个）

CAN控制器的==**工作模式**==有三种：**初始化模式、正常模式 和 睡眠模式**。

![STM32_CANMode](https://pic.imgdb.cn/item/6545ad86c458853aef97cd87/STM32_CANMode.png)

CAN控制器的==**测试模式**==有三种：**静默模式、环回模式 和 环回静默模式**

==**CAN的测试模式是在初始化模式下进行配置的**==

![STM32_CANDetectionMode](https://pic.imgdb.cn/item/6545ad8ac458853aef97d684/STM32_CANDetectionMode.png)

### CAN控制器的框图

1. **CAN内核** -- 包含各种控制/状态/配置寄存器，可以配置模式、波特率等
2. **发送邮箱** -- 用来缓存待发送的报文，最多可以缓存3个报文
3. **接收FIFO** -- 缓存接收到的有效报文
4. **接收过滤器** -- 筛选有效报文

![STM32_CANStruct](https://pic.imgdb.cn/item/6545ad8dc458853aef97de24/STM32_CANStruct.png)

### CAN发送/接收流程

**发送流程:** 发送优先级由邮箱中报文的标识符决定。标识符数值越低有最高优先级。如果标识符值相同，邮箱小的先被发送

![STM32_CANSend](https://pic.imgdb.cn/item/6545ad93c458853aef97ee6b/STM32_CANSend.png)

**接收流程：**有效报文指的是（数据帧直到EOF段的最后一位都没有错误），且**通过过滤器组对标识符过滤**。

![STM32_CANRecv](https://pic.imgdb.cn/item/6545ad96c458853aef97f6f0/STM32_CANRecv.png)

### CAN的接收过滤器

当总线上报文数据量很大时，总线上的设备会频繁获取报文，占用CPU。**过滤器的存在，选择性接收有效报文，减轻系统负担。**

每个过滤器组都有两个32位寄存器CAN_FxR1和CAN_FxR2。根据过滤器组的工作模式不同，寄存器的作用不尽相同。工作模式由位宽和选择模式决定，位宽可设置32位或16位，寄存器存储的内容就有所区别

| 过滤器组Reg | 32位                               | 16位（寄存器由两部分组成）          |
| ----------- | ---------------------------------- | ----------------------------------- |
| CAN_FxR1    | STDID[10:0]、EXTID[17:0]、IDE、RTR | STDID[10:0]、EXTID[17:15]、IDE、RTR |
| CAN_FxR2    | STDID[10:0]、EXTID[17:0]、IDE、RTR | STDID[10:0]、EXTID[17:15]、IDE、RTR |

选择模式可设置屏蔽位模式或标识符列表模式，寄存器内容的功能就有所区别。

* **屏蔽位模式**，可以选择出**一组符合条件**的报文。寄存器内容功能相当于是否符合条件 -- 关键词搜索
* **标识符列表模式**，可以选择出**几个特定ID**的报文。寄存器内容功能就是标识符本身 -- 特定名单

![STM32_CANReg](https://pic.imgdb.cn/item/6545ad9ac458853aef98009d/STM32_CANReg.png)

~~上图哥们暂时没理解啊 未待完续~~

![STM32_CANRecvFilter](https://pic.imgdb.cn/item/6545ad9ec458853aef980b5a/STM32_CANRecvFilter.png)

* 屏蔽位寄存器中位值为1，表示与ID要必须匹配；位值为0，表示可不与ID匹配。
* 在使能过滤器情况下，总线上广播的报文ID与过滤器的配置都不匹配，CAN控制器会丢弃该报文，不会进入到接收FIFO中。
* 注意：标识符选择位IDE和帧类型RTR需要一致。不同过滤器组的工作模式可以设置为不同。(也就是 屏蔽F0R2的IDE和RTR上置一 最好)

### CAN控制器的时序图{#CANTIME}

STM32的CAN外设位时序分为三段：

* **同步段**    SYNC_SEG
* **时间段1  BS1** -- 这一段 包括了 上文说的 **传播时间段(PTS)  + 相位缓冲段1(PBS1)** 
* **时间段2  BS2** 

![STM32_CANBaudRate](https://pic.imgdb.cn/item/6545ada4c458853aef981953/STM32_CANBaudRate.png)

$$波特率 = \cfrac {1}{1tq+tq \times(TS1[3:0]+1)+tq \times (TS2[2:0] + 1) }$$

举例: 

* STM32F103，设TS1=8、TS2=7、BRP=3，波特率 = 36000 / [( 9 + 8 + 1 ) * 4] = 500Kbps。 (36000 是由 1/t~PCLK~ 来的)

* STM32F407，设TS1=6、TS2=5、BRP=5，波特率 = 42000 / [( 7 + 6 + 1 ) * 6] = 500Kbps。 (42000 是由 1/t~PCLK~ 来的)

注意：通信双方波特率需要一致才能通信成功

### CAN的相关寄存器

| **寄存器**    | **名称**               | **作用**                                        |
| ------------- | ---------------------- | ----------------------------------------------- |
| CAN_MCR       | CAN主控制寄存器        | 主要负责CAN工作模式的配置                       |
| CAN_BTR       | 位时序寄存器           | 用来设置分频/TBS1/TBS2/TSWJ等参数，设置测试模式 |
| CAN_(T/R)IxR  | 标识符寄存器           | 存放(待发送/接收)的报文ID、扩展ID、IDE位及RTR位 |
| CAN_(T/R)DTxR | 数据长度和时间戳寄存器 | 存放(待发送/接收)报文的DLC段                    |
| CAN_(T/R)DLxR | 低位数据寄存器         | 存放 (待发送/接收)报文数据段的Data0~Data3的内容 |
| CAN_(T/R)DHxR | 高位数据寄存器         | 存放 (待发送/接收)报文数据段的Data4~Data7的内容 |
| CAN_FM1R      | 过滤器模式寄存器       | 用于设置各过滤器组的工作模式                    |
| CAN_FS1R      | 过滤器位宽寄存器       | 用于设置各过滤器组的位宽                        |
| CAN_FFA1R     | FIFO关联寄存器         | 用于设置报文通过过滤器后，被存入的FIFO          |
| CAN_FA1R      | 过滤器激活寄存器       | 用于开启对应的过滤器组                          |
| CAN_FxR(1/2)  | 过滤器组x寄存器        | 根据位宽和模式设置不同，CAN_FxR1和FxR2功能不同  |

### CAN的HAL库驱动

| **驱动函数**                           | **关联寄存器**             | **功能描述**      |
| -------------------------------------- | -------------------------- | ----------------- |
| **__****HAL_RCC_CANx_CLK_ENABLE(…)**   |                            | 使能CAN时钟       |
| **HAL_CAN_Init(…)**                    | MCR / BTR                  | 初始化CAN         |
| **HAL_CAN_ConfigFilter(…)**            | 过滤器寄存器               | 配置CAN接收过滤器 |
| **HAL_CAN_Start(…)**                   | MCR / MSR                  | 启动CAN设备       |
| **HAL_CAN_ActivateNotification(…)**    | IER                        | 使能中断          |
| **__HAL_CAN_ENABLE_IT(…)**             | IER                        | 使能CAN中断允许   |
| **HAL_CAN_AddTxMessage(…)**            | TSR/TIxR/TDTxR/TDLxR/TDHxR | 发送消息          |
| **HAL_CAN_GetTxMailboxesFreeLevel(…)** | TSR                        | 等待发送完成      |
| **HAL_CAN_GetRxFifoFillLevel(…)**      | RF0R/RF1R                  | 等待接收完成      |
| **HAL_CAN_GetRxMessage(…)**            | RF0R/RF1R/RDLxR/RDHxR      | 接收消息          |

CAN外设相关重要结构体：**CAN_InitTypeDef、CAN_FilterTypeDef和CAN_(T/R)xHeaderTypeDef**

* `CAN_InitTypeDef` can 初始化结构体，用于配置 CAN 的工作模式、波特率等等

```c
typedef struct
{
 uint32_t Prescaler; /* 分频值，可以配置为 1~1024 间的任意整数 */
 uint32_t Mode; /* can 操作模式，有效值参考 CAN_operating_mode 的描述 */
 uint32_t SyncJumpWidth; /* CAN 硬件的最大超时时间 */
 uint32_t TimeSeg1; /* CAN_time_quantum_in_bit_segment_1 时间段1(BS1)长度*/
 uint32_t TimeSeg2; /* CAN_time_quantum_in_bit_segment_2 时间段1(BS1)长度*/
 FunctionalState TimeTriggeredMode; /* 启用或禁用时间触发模式 */
 FunctionalState AutoBusOff; /* 禁止/使能软件自动断开总线的功能 */
 FunctionalState AutoWakeUp; /* 禁止/使能 CAN 的自动唤醒功能 */
 FunctionalState AutoRetransmission; /* 禁止/使能 CAN 的自动传输模式 */
 FunctionalState ReceiveFifoLocked; /* 禁止/使能 CAN 的接收 FIFO */
 FunctionalState TransmitFifoPriority; /* 禁止/使能 CAN 的发送 FIFO */
} CAN_InitTypeDef;
```

* `CAN_FilterTypeDef`是过滤器的结构体，这个是根据 STM32 的 CAN 过滤器模式设置的一些配置参数,我们通过配置过滤器，通过过滤器组的报文，即可从关联的 FIFO 的输出邮箱中获取

```c
typedef struct
{
 uint32_t FilterIdHigh; /* 过滤器标识符高位 */
 uint32_t FilterIdLow; /* 过滤器标识符低位 */
 uint32_t FilterMaskIdHigh; /* 过滤器掩码号高位（列表模式下，也是属于标识符） */
 uint32_t FilterMaskIdLow; /* 过滤器掩码号低位（列表模式下，也是属于标识符） */
 uint32_t FilterFIFOAssignment; /* 与过滤器组管理的 FIFO */
 uint32_t FilterBank; /* 指定过滤器组，单 CAN 为 0~13，双 CAN 可为 0~27 */
 uint32_t FilterMode; /* 过滤器的模式 标识符屏蔽位模式/标识符列表模式 */
 uint32_t FilterScale; /* 过滤器的位宽 32 位/16 位 */
 uint32_t FilterActivation; /* 禁用或者使能过滤器 */
 uint32_t SlaveStartFilterBank; /* 双 CAN 模式下，规定 CAN 的主从模式的过滤器分配 */
} CAN_FilterTypeDef;
```

* `CAN_TxHeaderTypeDef`是 CAN 发送的结构体，它的结构如下, 注意: 当标识符选择位 IDE 为 CAN_ID_STD 时，表示本报文是标准帧，使 用 StdId 成员存储报文 ID；当它的值为 CAN_ID_EXT 时，表示本报文是扩展帧，使用 ExtId 成 员存储报文 ID

```c
typedef struct
{
 uint32_t StdId; /* 标准标识符 11 位 范围:0~0x7FF */
 uint32_t ExtId; /* 扩展标识符 29 位 范围:0~0x1FFFFFFF */
 uint32_t IDE; /* 标识符类型 CAN_ID_STD / CAN_ID_EXT */
 uint32_t RTR; /* 帧类型 CAN_RTR_DATA / CAN_RTR_REMOTE */
 uint32_t DLC; /* 帧长度 范围:0~8byte */
 FunctionalState TransmitGlobalTime; /* 时间戳是否在开始时捕获 */
} CAN_TxHeaderTypeDef;
```

* `CAN_RxHeaderTypeDef`是 CAN 接收的结构体，它的结构如下,同样的，也是通过 IDE 位确认该消息报文的标识符类型，该结构体不同 于发送结构体还有一个过滤器匹配序号成员，可以查看到是此报文是通过哪里过滤器到达接收 FIFO

```c
typedef struct
{
 uint32_t StdId; /* 标准标识符 11 位 范围:0~0x7FF */
 uint32_t ExtId; /* 扩展标识符 29 位 范围:0~0x1FFFFFFF */
 uint32_t IDE; /* 标识符类型 CAN_ID_STD / CAN_ID_EXT */
 uint32_t RTR; /* 帧类型 CAN_RTR_DATA / CAN_RTR_REMOTE */
 uint32_t DLC; /* 帧长度 范围:0~8byte */
 uint32_t Timestamp; /* 在帧接收开始时开始捕获的时间戳 */
 uint32_t FilterMatchIndex; /* 过滤器匹配序号 */
} CAN_RxHeaderTypeDef;
```

### CAN硬件电路

我使用的开发板是STM32F407，CAN的收发器芯片是SIT1050T，SIT1050T 支持高速CAN，传输速率可达1Mbps，5V供电

| SIT1050T引脚 | 引脚说明                        |
| ------------ | ------------------------------- |
| D            | CAN发送引脚                     |
| R            | CAN接收引脚                     |
| CANL         | 低电位CAN电压输入输出端         |
| CANH         | 高电位CAN电压输入输出端         |
| Vref         | 参考电压输出                    |
| RS           | 高速/静音模式选择(低电平为高速) |

![STM32F407_CANHardware](https://pic.imgdb.cn/item/6545adacc458853aef982edf/STM32F407_CANHardware.png)
