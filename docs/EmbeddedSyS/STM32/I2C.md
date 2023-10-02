---
comments: true
---

# I2C通信

学习资料: 

* [江科大-STM32入门教程](https://www.bilibili.com/video/BV1th411z7sn/?p=31&share_source=copy_web&vd_source=1f86b29b1eacf120a2143333a298e645)
* [全面解析I2C通信协议-电子工程专辑 ](https://www.eet-china.com/mp/a202065.html)
* [爱上半导体-I2C通讯协议](https://www.bilibili.com/video/BV1dg4y1H773/?share_source=copy_web&vd_source=1f86b29b1eacf120a2143333a298e645)

## 前言

**线与：**连接在总线上的设备只要有一个输出低电平（0）总线就为低电平（0），只有全部设备都为高阻态时总线才是高电平（1）

## I2C简介

I2C（Inter IC Bus）是由Philips公司开发的一种**通用数据总线**

* 两根通信线：SCL（Serial Clock）、SDA（Serial Data）
* 同步，半双工
* 带数据应答
* 支持总线挂载多设备（**一主多从**、多主多从(可利用“线与”特性来执行时钟同步和总线仲裁)）

### I2C的硬件电路设计

![I2C_Struct](https://pic.imgdb.cn/item/651aed97c458853aef1f17f8/I2C_Struct.png)

> * 所有I2C设备的SCL连在一起，SDA连在一起
> * **设备的SCL和SDA均要配置成开漏输出模式**
>
> * SCL和SDA各添加一个上拉电阻，阻值一般为4.7KΩ左右

我主要学习的是I2C**一主多从的模式**，所以下面以一主多从的模式(一主 即 MCU(STM32)来当作主机 ，其它设备当作从机)来讲解I2C的硬件电路是如何设计出来的

**解释:**

* 对于 **SCL 时钟线** 来说 它是由主机控制的 所以它可以是 开漏输出 亦可以是 推挽输出 都可以 ，但为什么选择了 开漏输出模式 是因为 :多主多从模式下可利用“线与”特性来执行 时钟同步和总线仲裁

* 对于 **SDA 时钟线 **来说 它是通信数据的线 不仅主机需要它进行 输出数据 还需要 接收从机发送过来的 数据 ，即在在此期间需要频繁的切换GPIO的输入输出模式 还要兼顾 不能在一个设备输出高电平 另一个设备输出低电平 导致的电源短路现象 所以为了防止总线没有协调好而导致此现象的产生 **I2C设计是禁止所有设备输出强上拉的高电平** 采用 **外置弱上拉电阻加开漏输出模式** 
  * 那此时 **你可能有所疑惑**: 选择开漏输出模式 那岂不是不能输入了 其实然也 不知道你是否还记得 学习GPIO时，我们的STM32输出配置框图中 无论我们选择什么输出模式 都是可以进行输入的 不信？请看下图 
  
     STM32数据手册上写到 当I/O端口被配置为输出时 
  
    * **施密特触发输入被激活**
  
    * **在每个APB2时钟周期，出现在I/O脚上的数据被采样到输入数据寄存器**
  
    * **开漏模式时，读输入数据寄存器时可得到I/O口状态** -- 我们软件模拟I2C时就使用到了这个特性 `GPIO_ReadInputDataBit` 但是我们 硬件读写的时候使用的是复用开漏输出 复用功能输入，直接读写到我们的I2C的移位寄存器中
  
    如果你对GPIO有所遗忘 可以去看我的另一篇关于[STM32之GPIO外设 - Sakura_Ji - 博客园 ](https://www.cnblogs.com/Sakura-Ji/p/17723272.html)的笔记
    
    ![I2C_GPIOModeNormal](https://pic.imgdb.cn/item/651aedbcc458853aef1f1b36/I2C_GPIOModeNormal.png)
    
    ![I2C_GPIOMode](https://pic.imgdb.cn/item/651aedc2c458853aef1f1c5f/I2C_GPIOMode.png)
    
    
  
* **开漏输出模式: **设备输出1时是高阻态，在硬件电路设计图中即SCLKN1OUT/DATAN1OUT断开使引脚浮空，为了避免引脚浮空，通过外置的上拉电阻呈现**弱上拉的高电平 但不影响数据的传输**；设备输出0时是强下拉低电平

* 所有任何设备在任何时候 是都可以进行输入的 都可以通过一个**数据缓冲器或者是施密特触发器**，进行输入 

通过上文可知：

> * 设备在进行输出时： 低电平:强下拉的低电平  高电平: 弱上拉的高电平
> * 设备在进行输入时： 可直接输出高电平(相当于高阻态 断开引脚)  然后观察总线的高低电平即可

### I2C的软件设计

> 1. 主机可以访问总线上的任何一个设备
> 2. 要与那个设备进行通信  主机在起始条件后  需要先发送 该设备的地址
> 3. 所有设备都会对这个地址进行判断，如果和自己的不一样会认为没有访问自己，之后的时序就不管了，如果一样会向主机发送应答，并准备响应之后主机的读写操作
> 4. 同一条的I2C总线上的从机的设备地址要求不能相同
> 5. 从机设备地址在I2C协议标准里分为**7位地址**和10位地址，7位地址应用最为广泛
> 6. 以7位作为示例:厂商一般规定高4位是固定死的，但低3位是可以通过电路进行改变的，这样地址就可以不同，所以I2C总线可以搭载相同的设备
> 7. **仲裁：** 当有多个设备想跟主机通讯时，为防止数据冲突，会采用仲裁的方式决定由哪个设备占用总线。在通讯分点已经说明了**一次通讯只能有一个主机和一个从机**

> I2C最大的一个特点就是有完善的应答机制，从机(主机)接收到主机(从机)的数据时，会回复一个应答信号来通知主机表示“我收到了”。
>
> **应答信号：** 出现在1个字节传输完成之后，即第9个SCL时钟周期内，此时主机需要释放SDA总线，把总线控制权交给从机，由于上拉电阻的作用，此时总线为高电平，如果从机正确的收到了主机发来的数据，会把SDA拉低，表示应答响应。
>
> **非应答信号：**当第9个SCL时钟周期时，SDA保持高电平，表示非应答信号。
>
> 非应答信号可能是主机产生也可能是从机产生，产生非应答信号的情况主要有以下几种：
>
> - I2C总线上没有主机所指定地址的从机设备；
> - 从机正在执行一些操作，处于忙状态，还没有准备好与主机通讯；
> - 主机发送的一些控制命令，从机不支持；
> - 主机接收从机数据时，主机产生非应答信号，通知从机数据传输结束，不要再发数据了；

#### I2C的时序机制

* **总线空闲状态:** SCL和SDK同时处于高电平

* **起始条件：** **SCL高电平期间**，SDA从 高电平 切换到 低电平  

* **终止条件：** **SCL高电平期间**，SDA从 低电平 切换到 高电平

* **发送一个字节：** **SCL低电平期间**，主机将数据位依次放到SDA线上（高位先行），**然后释放SCL**，从机将在SCL高电平期间读取数据位，所以SCL高电平期间SDA不允许有数据变化，依次循环上述过程8次，即可发送一个字节

* **接收一个字节：** **SCL低电平期间**，从机将数据位依次放到SDA线上（高位先行），**然后释放SCL**，主机将在SCL高电平期间读取数据位，所以SCL高电平期间SDA不允许有数据变化，依次循环上述过程8次，即可接收一个字节（主机在接收之前，需要释放SDA）

* **发送应答：**主机在接收完一个字节之后，在下一个 时钟发送一位数据，数据0表示应答，数据1表示非应答

* **接收应答：**主机在发送完一个字节之后，在下一个时钟接收一位数据，判断从机是否应答，数据0表示应答，数据1表示非应答（主机在接收之前，需要释放SDA）


![I2C_TimeSequence](https://pic.imgdb.cn/item/651aedcac458853aef1f1d1c/I2C_TimeSequence.png)

![I2C_DataChange](https://pic.imgdb.cn/item/651aedcec458853aef1f1d96/I2C_DataChange.png)

#### I2C的数据帧格式

I2C的数据帧格式有:**指定地址写**，当前地址读，**指定地址读**

![I2C_DataFlow](https://pic.imgdb.cn/item/651aedd0c458853aef1f1e04/I2C_DataFlow.png)

**PS：**起始位和停止位 只是个状态通知 并不是1位数据 也就是设备感受到总线的变换所以不要把 它们当成 1位数据来对待 它们只是个信号通知

##### 指定地址写

> 对于指定设备（Slave Address），在指定地址（Reg Address）下，写入指定数据（Data）

![I2C_WriteReg](https://pic.imgdb.cn/item/651aedd9c458853aef1f1f04/I2C_WriteReg.png)

1. 总线由空闲状态转为**起始位**:在SCL高电平的期间，SDA下降沿触发

2. **主机控制SDA** 发送**从机设备地址**(7位地址) + 发送 读(1)/**写(0)**指令(1位):

    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

3. 主机释放SDA 接收从机的应答位 **从机控制SDA** :

    * 从机回复 **0是应答**  1为非应答
    * 由于线与机制，当从机给予应答，从总线的现象上看 当主机释放SDA后 立刻被从机拉下并控制 所以在RA(Receive Ack)处显示的像未被释放过一样

4. 主机得到从机的应答 从机释放SDA **主机控制SDA** **发送寄存器地址**(8位)

    * 因为从机要在低电平尽快变化数据(释放SDA)，所以SCL的下降沿和SDA的上升沿几乎是同时发生的
    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

5. 主机释放SDA 接收从机的应答位 **从机控制SDA** :

    * 从机回复 **0是应答**  1为非应答
    * 由于线与机制，当从机给予应答，从总线的现象上看 当主机释放SDA后 立刻被从机拉下并控制 所以在RA(Receive Ack)处显示的像未被释放过一样

6. 主机得到从机的应答 从机释放SDA **主机控制SDA** **发送数据(**8位)

    * 因为从机要在低电平尽快变化数据(释放SDA)，所以SCL的下降沿和SDA的上升沿几乎是同时发生的
    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

7. 主机释放SDA 接收从机的应答位 **从机控制SDA** :

    * 从机回复 **0是应答**  1为非应答
    * 由于线与机制，当从机给予应答，从总线的现象上看 当主机释放SDA后 立刻被从机拉下并控制 所以在RA(Receive Ack)处显示的像未被释放过一样

8. 主机得到从机的应答 从机释放SDA  **主机控制SDA**  **产生停止条件**

    * 因为从机要在低电平尽快变化数据(释放SDA)，所以SCL的下降沿和SDA的上升沿几乎是同时发生的
    * 数据变化:在SCL低电平期间，SDA进行数据变化
        * 如果主机想结束通讯 就可以产生停止条件 在停止条件之前 ，先拉低SDA，为后续SDA的上升沿做准备
        * ~~如果主机想要继续传输 就可以继续发送数据 它的数据会自动写入下一个寄存器地址的位置(单独的记录地址的指针变量会自增 在下文当前地址读中有解释为什么)~~
    * ~~数据稳定:在SCL高电平期间，SDA保持不动~~

9. 在SCL高电平的期间，SDA上升沿触发 产生**停止位** 转向 总线空闲状态 

##### 当前地址读

>对于指定设备（Slave Address），在当前地址指针指示的地址下，读取从机数据（Data）

![I2C_ReadPresent](https://pic.imgdb.cn/item/651aee30c458853aef1f2534/I2C_ReadPresent.png)

1. 总线由空闲状态转为**起始位**:在SCL高电平的期间，SDA下降沿触发

2. **主机控制SDA** 发送**从机设备地址**(7位地址) + 发送 **读(1)**/写(0)指令(1位):

    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

3. 主机释放SDA 接收从机的应答位 **从机控制SDA** :

    * 从机回复 **0是应答**  1为非应答
    * 由于线与机制，当从机给予应答，从总线的现象上看 当主机释放SDA后 立刻被从机拉下并控制 所以在RA(Receive Ack)处显示的像未被释放过一样

4. 主机得到从机的应答 **从机继续控制SDA** **从机发送数据**(8位) -- **数据传输方向 变换**

    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

    * **那么问题来了** -- 此时从机是从将哪个寄存器的数据 传给主机的呢？ 在I2C协议的规定中，在主机进行寻址时，一旦读写标志位给了1，下一个字节要立马转为读的时序，所以主机还来不及指定，我要读那个寄存器，就要开始接收数据了，所以这里没有指定地址这个环节，那从机该发哪一个寄存器的数据呢? 

        > 在从机中，所有的寄存器都被分配到了一个线性区域中，并且会有一个单独的记录地址的指针变量，指示着其中的一个寄存器，这个指针上电默认指向0地址，并且每写入一个字节和读出一个字节后，这个**指针会自动自增一次**，移动到下一个位置

        那么在调用当前地址读的时序时，主机没有指定要读那个地址，从机就会返回当前 记录地址的那个指针变量的 指针指向的寄存器的值，**举例** ：

        1. 上一步刚刚调用了指定地址写的时序，在0X19的位置写入了0XAA,那么 记录地址的那个指针变量 就会自动加一 移动到 0X1A的位置 
        2. 之后再调用当前地制读的时序，读取的就是0X1A这个地址的寄存器中的值
        3. 再继续读数据，读取的就是0X1B这个地址的寄存器中的值
        4. ···
        5. 以此类推

5. 从机释放SDA 接收主机的应答位 **主机控制SDA**  **产生停止条件**

    * 从机回复 0是应答  **1为非应答**
    * 由于线与机制，当从机给予应答，从总线的现象上看 当从机释放SDA后 由于主机是非应答 所以总线依旧处于上拉状态 所以在SA(Send Ack)处显示的像未被释放过一样
    * 当从机未得到主机的应答时，从机将不会再继续发送给主机数据，由主机控制SDA
    * 数据变化:在SCL低电平期间，SDA进行数据变化
        * 如果主机想要结束通讯 就可以产生停止条件 在停止条件之前 ，先拉低SDA，为后续SDA的上升沿做准备
        * ~~如果主机想要继续读取 上面就得应答从机 然后可以继续读取下一个寄存器地址中的数据~~
    * ~~数据稳定:在SCL高电平期间，SDA保持不动~~

6. 在SCL高电平的期间，SDA上升沿触发 产生**停止位** 转向 总线空闲状态 

##### 指定地址读

> 对于指定设备（Slave Address），在指定地址（Reg Address）下，读取从机数据（Data）

![I2C_ReadReg](https://pic.imgdb.cn/item/651aee34c458853aef1f25c8/I2C_ReadReg.png)

1. 总线由空闲状态转为**起始位**:在SCL高电平的期间，SDA下降沿触发

2. 主机控制SDA 发送**从机设备地址**(7位地址) + 发送 读(1)/**写(0)**指令(1位):

    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

3. 主机释放SDA 接收从机的应答位 **从机控制SDA** :

    * 从机回复 **0是应答**  1为非应答
    * 由于线与机制，当从机给予应答，从总线的现象上看 当主机释放SDA后 立刻被从机拉下并控制 所以在RA(Receive Ack)处显示的像未被释放过一样

4. 主机得到从机的应答 从机释放SDA **主机控制SDA** **发送寄存器地址**(8位)

    * 因为从机要在低电平尽快变化数据(释放SDA)，所以SCL的下降沿和SDA的上升沿几乎是同时发生的
    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

5. 主机释放SDA 接收从机的应答位 **从机控制SDA** :

    * 从机回复 **0是应答**  1为非应答
    * 由于线与机制，当从机给予应答，从总线的现象上看 当主机释放SDA后 立刻被从机拉下并控制 所以在RA(Receive Ack)处显示的像未被释放过一样

6. 主机得到从机的应答 从机释放SDA **主机控制SDA** **重新起始SR(Start Repeat)**

    * 因为从机要在低电平尽快变化数据(释放SDA)，所以SCL的下降沿和SDA的上升沿几乎是同时发生的
    * 数据变化:在SCL低电平期间，SDA进行数据变化
    * 产生重新起始条件，从机释放SDA后，主机依旧保持SDA上拉状态，为后续SDA的下降沿做准备
    * **那么问题来了** -- 重新起始是什么鬼?为什么这么操作，上文说过 有一个单独的记录地址的指针变量 我们先像那个指定的寄存器地址进行写入操作(但不真正的写入 所以指针不会自增)，重新起始，然后进行当前地址读操作，这样不就完美的实现了 指定地址读操作嘛 ~看不懂去看当前地址读中的举例~
        *  重新起始相当于另起一个时序，因为读写标志位只能是跟着起始条件的第一个字节，因此想要切换读写操作，只能再启动一次时序即重新起始
    * **起始位**:在SCL高电平的期间，SDA下降沿触发

7. **主机控制SDA** 发送**从机设备地址**(7位地址) + 发送 **读(1)**/写(0)指令(1位):

    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

8. 主机释放SDA 接收从机的应答位 **从机控制SDA** :

    * 从机回复 **0是应答**  1为非应答
    * 由于线与机制，当从机给予应答，从总线的现象上看 当主机释放SDA后 立刻被从机拉下并控制 所以在RA(Receive Ack)处显示的像未被释放过一样

9. 主机得到从机的应答 **从机继续控制SDA** **从机发送数据**(8位) -- **数据传输方向 变换**

    * 数据变化:在SCL低电平期间，SDA进行数据变化

    * 数据稳定:在SCL高电平期间，SDA保持不动

10. 从机释放SDA 接收主机的应答位 **主机控制SDA**  **产生停止条件**

    * 从机回复 0是应答  **1为非应答**
    * 由于线与机制，当从机给予应答，从总线的现象上看 当从机释放SDA后 由于主机是非应答 所以总线依旧处于上拉状态 所以在SA(Send Ack)处显示的像未被释放过一样
    * 当从机未得到主机的应答时，从机将不会再继续发送给主机数据，由主机控制SDA
    * 数据变化:在SCL低电平期间，SDA进行数据变化
        * 如果主机想结束通讯 就可以产生停止条件 在停止条件之前 ，先拉低SDA，为后续SDA的上升沿做准备
        * ~~如果主机想要继续读取 上面就得应答从机 然后可以继续读取下一个寄存器地址中的数据~~
    * ~~数据稳定:在SCL高电平期间，SDA保持不动~~

11. 在SCL高电平的期间，SDA上升沿触发 产生**停止位** 转向 总线空闲状态 

## STM32之I2C外设

> * STM32内部集成了硬件I2C收发电路，可以由硬件自动执行时钟生成、起始终止条件生成、应答位收发、数据收发等功能，减轻CPU的负担
>
> * 支持多主机模型
>
> * 支持7位/10位地址模式
>
> * 支持不同的通讯速度，标准速度(高达100 kHz)，快速(高达400 kHz)
>
> * 支持DMA
>
> * 兼容系统管理总线SMBus协议

**10位地址的操作方式：**起始位后 发送的第一个字节的 前5位必须是: 11110 然后是2位地址 + 读写位 第二个字节是 后8位地址 所以7位地址的前5位不能是11110

**外设引脚:**一般都是借用GPIO的复用模式和外界链接起来的，要想使用STM32的硬件电路，就只能使用它规定好的引脚 **举例:**

| I2C引脚 | I2C1                  | I2C2 |
| ------- | --------------------- | ---- |
| SCL     | PB6-->可以重映射到PB8 | PB10 |
| SDA     | PB7-->可以重映射到PB9 | PB11 |

![STM32_I2C_Struct](https://pic.imgdb.cn/item/651aee3ac458853aef1f26b4/STM32_I2C_Struct.png)

> * **想要发送数据：**可以把一字节的数据写到数据寄存器DR，当移位寄存器没有数据移位时(也就是空)，这个数据寄存器的值就会进一步转到移位寄存器里，在上一个数据的移位过程中，我们就可以把下一个数据写到数据寄存器DR中等着了，一旦上一个数据移位成功，下一个数据就可以无缝衔接，继续发送了
>   * 当数据从数据寄存器 转移到 移位寄存器时，就会置状态寄存器 TXE 为1 表示发送数据寄存器为空
> * **想要接收数据：**输入的数据，一位一位的从引脚 移进 移位寄存器 ，当一个字节的数据接收完成，数据就整体从移位寄存器转到数据寄存器，同时置标志位RXNE为1，表示接收数据寄存器非空，这时我们就可以把数据寄存器DR里的数据都出来了
> * PS：可对比串口USART那一章的的框图 -- 你就会发现串口的数据收发 也是由移位寄存器 和 数据寄存器 来实现的，只不过串口USART是全双工有两个数据和移位寄存器。而I2C是半双工只有一个数据和移位寄存器 可参考[STM32之USART通信 - Sakura_Ji - 博客园 ](https://www.cnblogs.com/Sakura-Ji/p/17723363.html#stm32中的usart外设) 
> * 通过控制寄存器的对应位操作，就可以控制什么时候收发数据，对于起始条件，终止条件，和应答位的相关控制电路STM32的框图并没有详细画出，对于软件工程师的我们知道有相关电路可完成此操作就可以了
> * **比较器和地址寄存器**: 是从机模式使用的，由于STM32是基于可变多主机模型设计的，STM32不进行通信时就是从机模式，既然作为从机就要有从机地址，所以从机地址就可以由自身地址寄存器来指定，这个地址可以自定，然后写入到这个自身地址寄存器中，STM32作为从机被寻址时，可通过比较器来与自身地址寄存器进行比较，如果相同，STM32就可以响应外部主机的召唤。
> * STM32可支持同时响应两个从机地址，所以就有自身地址寄存器和双地址寄存器 -- 多主机模式下的，但此次学习是以STM32做为主机，此模式 ~未待完续~
> * **帧错误校验(PEC):** 当发送/接收一个多字节的数据帧时，硬件可自行执行CRC校验(是一种很常见的数据校验算法，可根据前面的数据就行各种数据的运算，然后会得到一个字节的校验位，附加到数据帧的后面)，接收发送都可以启动这个CRC校验，如果数据出错，CRC校验就会通不过，就会置校验错误标置位

### I2C之STM32发送流程 {#Send}

要学会读懂下发的序列图，要与对应相关寄存器的位进行互动学习，我已将重要的寄存器标志位放在了下方

![STM32_I2C_Send](https://pic.imgdb.cn/item/651aee3fc458853aef1f274f/STM32_I2C_Send.png)

**默认情况下，STM32的I2C接口总是工作在从模式**。从从模式切换到主模式，需要产生一个起始条件 也就是将 I2C的**控制寄存器I2C_CR1**中的START置1

**EV**可以理解为:组合了好几个标志位的 大标志位

**EV5**: SB = 1当检测EV5完成后，就可以发送一个字节的从机地址了，从机地址需要写入数据寄存器DR中，当这个字节写入到数据寄存器DR时，硬件电路就会自动将这一个字节转移到移位寄存器中，再把这一个字节发送到I2C的SDA总线上，之后硬件会自动接收应答位并判断，如果没有应答，硬件会置硬件失败的标志位，然后这个失败的标志位可以申请中断来告诉我们

**EV6**: ADDR = 1 地址发送结束

**EV8_1**: TXE = 1 移位和数据寄存器都是空，需要我们向数据寄存器写入数据

==**EV8**==: TXE = 1 移位寄存器非空，数据寄存器是空，也就是说 我们可以将新的数据写进 数据寄存器了 所以 当EV8产生的时候 也就是我们能将新数据写入到 数据寄存器的时候 

**EV8_2**: TXE = 1; BTF = 1 此时是 移位和数据寄存器都是空，我们**没有新数据**要继续发送给从机了， BTF = 1字节发送结束

---

**控制寄存器I2C_CR1**👇

> ==**START**==：起始条件产生 (Start generation)  软件可以设置或清除该位，或当起始条件发出后或PE=0时，由硬件清除。
>
>  在主模式下：
>
> * 0 :  无起始条件产生；
>
> * 1：**重复产生起始条件**。 
>
> 在从模式下： 
>
> * 0：无起始条件产生；
>
> * 1：**当总线空闲时，产生起始条件**。

> ==**STOP**==：停止条件产生 (Stop generation)  
>
> 软件可以设置或清除该位；或当检测到停止条件时，由硬件清除；当检测到超时错误时，硬件 将其置位。 
>
> 在主模式下： 
>
> 0：无停止条件产生； 
>
> 1：**在当前字节传输或在当前起始条件发出后产生停止条件**。 
>
> 在从模式下： 
>
> 0：无停止条件产生； 
>
> 1：在当前字节传输或释放SCL和SDA线。 
>
> 注：当设置了STOP、START或PEC位，在硬件清除这个位之前，软件不要执行任何对 I2C_CR1的写操作；否则有可能会第2次设置STOP、START或PEC位。

> ==**ACK**==：应答使能 (Acknowledge enable)  
>
> 软件可以设置或清除该位，或当PE=0时，由硬件清除。
>
>  0：无应答返回； 
>
> 1：在接收到一个字节后返回一个应答(匹配的地址或数据)。

> ==**PE**==：I2C模块使能 (Peripheral enable)  
>
> 0：禁用I 2 C模块； 
>
> 1：启用I 2 C模块：根据SMBus位的设置，相应的I/O口需配置为复用功能。
>
>  注：如果清除该位时通讯正在进行，在当前通讯结束后，I 2 C模块被禁用并返回空闲状态。 由于在通讯结束后发生PE＝0，所有的位被清除。
>
>  在主模式下，通讯结束之前，绝不能清除该位。

---

**状态寄存器 1(I2C_SR1)**👇

> ==**SB**==：起始位(主模式) (Start bit (Master mode))  
>
> 0：未发送起始条件； 
>
> 1：起始条件已发送。
>
>  – **当发送出起始条件时该位被置’1’**。
>
>  – **软件读取SR1寄存器后，写数据寄存器的操作将清除该位**，或当PE=0时，硬件清除该位。

> ==**TxE**==：数据寄存器为空(发送时) (Data register empty (transmitters)) 
>
>  0：数据寄存器非空；
>
>  1：数据寄存器空。
>
> – 在发送数据时，数据寄存器为空时该位被置’1’，在发送地址阶段不设置该位。 
>
> – 软件写数据到DR寄存器可清除该位；或在发生一个起始或停止条件后，或当PE=0时由硬件 自动清除。 
>
> 如果收到一个NACK，或下一个要发送的字节是PEC(PEC=1)，该位不被置位。 
>
> 注：在写入第1个要发送的数据后，或设置了BTF时写入数据，都不能清除TxE位，这是因为 数据寄存器仍然为空。

> ==**ADDR**==：地址已被发送(主模式)/地址匹配(从模式) (Address sent (master mode)/matched  (slave mode))  
>
> 在软件读取SR1寄存器后，对SR2寄存器的读操作将清除该位，或当PE=0时，由硬件清除该 位。
>
> **地址匹配(从模式)** 
>
> 0：地址不匹配或没有收到地址；
>
> 1：收到的地址匹配。 
>
> – 当收到的从地址与OAR寄存器中的内容相匹配、或发生广播呼叫、或SMBus设备默认地址 或SMBus主机识别出SMBus提醒时，硬件就将该位置’1’(当对应的设置被使能时)。 
>
> **地址已被发送(主模式)**
>
> 0：地址发送没有结束； 
>
> 1：**地址发送结束**。
>
>  – 10位地址模式时，当收到地址的第二个字节的ACK后该位被置’1’。
>
>  – 7位地址模式时，当收到地址的ACK后该位被置’1’。
>
>  注：在收到NACK后，ADDR位不会被置位。

> ==**BTF**==：字节发送结束 (Byte transfer finished)  
>
> 0：字节发送未完成； 
>
> 1：字节发送结束。 当NOSTRETCH=0时，在下列情况下硬件将该位置’1’： 
>
> – 在接收时，当收到一个新字节(包括ACK脉冲)且数据寄存器还未被读取(RxNE=1)。 
>
> – **在发送时，当一个新数据将被发送且数据寄存器还未被写入新的数据(TxE=1)**。 
>
> – 在软件读取SR1寄存器后，对数据寄存器的读或写操作将清除该位；**或在传输中发送一个起始或停止条件后**，或当PE=0时，**由硬件清除该位**。 
>
> 注：在收到一个NACK后，BTF位不会被置位。 如果下一个要传输的字节是PEC(I2C_SR2寄存器中TRA为’1’，同时I2C_CR1寄存器中PEC 为’1’)，BTF位不会被置位。

---

**数据寄存器 1(I2C_DR)**👇

> ==**DR[7:0]**==：8位数据寄存器 (8-bit data register)  
>
> 用于存放接收到的数据或放置用于发送到总线的数据 
>
> **发送器模式**：当写一个字节至DR寄存器时，自动启动数据传输。一旦传输开始(TxE=1)，如果 能及时把下一个需传输的数据写入DR寄存器，I 2 C模块将保持连续的数据流。 
>
> **接收器模式**：接收到的字节被拷贝到DR寄存器(RxNE=1)。在接收到下一个字节(RxNE=1)之 前读出数据寄存器，即可实现连续的数据传送。 
>
> 注：在从模式下，地址不会被拷贝进数据寄存器DR；
>
> 注：硬件不管理写冲突(如果TxE=0，仍能写入数据寄存器)；
>
> 注：如果在处理ACK脉冲时发生ARLO事件，接收到的字节不会被拷贝到数据寄存器里，因此 不能读到它。

### I2C之STM32接收流程 {#Recv}

下放的7位主接收时序，很明显是 当前地址读 的模式，并没有给我们 指定地址读所以还需要我们进行相对应的配置

![STM32_I2C_Recv](https://pic.imgdb.cn/item/651aee47c458853aef1f280b/STM32_I2C_Recv.png)

**默认情况下，STM32的I2C接口总是工作在从模式**。从从模式切换到主模式，需要产生一个起始条件 也就是将 I2C的**控制寄存器I2C_CR1**中的START置1

**EV**可以理解为:组合了好几个标志位的 大标志位

**EV5**: SB = 1当检测EV5完成后，就可以发送一个字节的从机地址了，从机地址需要写入数据寄存器DR中，当这个字节写入到数据寄存器DR时，硬件电路就会自动将这一个字节转移到移位寄存器中，再把这一个字节发送到I2C的SDA总线上，之后硬件会自动接收应答位并判断，如果没有应答，硬件会置硬件失败的标志位，然后这个失败的标志位可以申请中断来告诉我们

**EV6**: ADDR = 1 地址发送结束

**EV6_1**：该事件发生时，其数据1其实还在移位，还没收到数据1，所以并没有标志位，当数据1接收完成，硬件会自动根据我们的配置将应答位发送出去，表示这个时序单元已经结束，说明移位寄存器已经成功移入了一个字节的数据1了，之后将这一个字节的数据1从 移位寄存器 发送给 数据寄存器

**EV7**:RXNE=1,表示数据寄存器非空，如果STM32对该数据寄存器进行读取，硬件会将RXNE位置零，当然数据还没有被读走的时候，数据2已经可以进入移位寄存器了

**EV7_1**:当不想在继续读取数据时，需要**提前**将最后一个读取数据的应答位ACK **写非应答** 也就是置0，同时设置终止条件请求STOP

## I2C的外设应用

### MPU6050的介绍

MPU6050是一个6轴姿态传感器，可以测量芯片自身X、Y、Z轴的加速度、角速度参数，通过数据融合，可进一步得到姿态角，常应用于平衡车、飞行器等需要检测自身姿态的场景

* 3轴加速度计（Accelerometer）：测量X、Y、Z轴的加速度

* 3轴陀螺仪传感器（Gyroscope）：测量X、Y、Z轴的角速度

![MPU6050](https://pic.imgdb.cn/item/651aee4ec458853aef1f290f/MPU6050.png)

**MPU6050的参数：**

* 16位ADC采集传感器的模拟信号，量化范围：-32768~32767

* 加速度计满量程选择：±2、±4、±8、±16（g）

* 陀螺仪满量程选择： ±250、±500、±1000、±2000（°/sec）

* 可配置的数字低通滤波器

* 可配置的时钟源

* 可配置的采样分频

* I2C的地址
  * 1101000（AD0=0） 
  * 1101001（AD0=1）

~未待完续之更详细的MPU6050的笔记~

## I2C的实战演习

为什么分 软件读写 和 硬件读写 ? 

* **软件读写** 是完全利用I2C的基本原理 时序来写的 ，也就是说无论使用那个 GPIO口都可以实现本操作，甚至你可以使用其它型号的MCU都可以的，只要逻辑和软件读写的一样，当然还要看一下双方支持最大的引脚接收翻转的频率
* **硬件读写** 因为在这里学习的是STM32单片机，而且它内部已经拥有I2C外设，这样很方便快捷我们的操作，所以在了解I2C是什么的基础上我们学习STM32的I2C外设会更加快速方便助我们使用 -- 库函数

### 软件模拟I2C之MPU6050

`MyI2C.h`

```c
#ifndef  __MYI2C_H__//如果没有定义了则参加以下编译
#define  __MYI2C_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"
#include "Delay.h"

void MyI2C_W_SCL(uint8_t BitValue);
void MyI2C_W_SDA(uint8_t BitValue);
uint8_t MyI2C_R_SDA(void);
void MyI2C_Init(void);
void MyI2C_Start(void);
void MyI2C_Stop(void);
void MyI2C_SendByte(uint8_t Byte);
uint8_t MyI2C_ReceiveByte(void);
void MyI2C_SendAck(uint8_t AckBit);
uint8_t MyI2C_ReceiveAck(void);

#endif  //结束编译
```

`MyI2C.c`

```c
#include "MyI2C.h"
/*
  PB10 -- SCL
  PB11 -- SDA
*/
//以下这些引脚操作 可使用带参宏定义
/**
  * @brief  主机发送时钟SCL
  * @param  
  * @retval 
  */
void MyI2C_W_SCL(uint8_t BitValue)
{
	GPIO_WriteBit(GPIOB, GPIO_Pin_10, (BitAction)BitValue);
	Delay_us(10);//如果单片机主频比较快 可增加引脚延时 
}
/**
  * @brief  主机发送数据SDA -- 按位 每次都是改变GPIO的高低电平
            BitValue 即使传入的是0X80 -- (BitAction)转成1 传入0X00 -- (BitAction)转成0 
  * @param  
  * @retval 
  */
void MyI2C_W_SDA(uint8_t BitValue)
{
	GPIO_WriteBit(GPIOB, GPIO_Pin_11, (BitAction)BitValue);
	Delay_us(10);
}
/**
  * @brief  主机接收数据SDA -- 按位 每次都是GPIO接收外部电平的变化
  * @param  
  * @retval 
  */
uint8_t MyI2C_R_SDA(void)
{
	uint8_t BitValue;
	BitValue = GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_11);
	Delay_us(10);
	return BitValue;
}
/**
  * @brief  I2C引脚初始化
  * @param  
  * @retval 
  */
void MyI2C_Init(void)
{
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB,ENABLE);

    //为初始化函数做准备
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10|GPIO_Pin_11;//设置PB10,PB11引脚
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_OD ;//设置输出模式为开漏输出(也是可以输入的 先输出1 再读取输入数据寄存器就可)
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  //初始化函数↓
  GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
  GPIO_SetBits(GPIOB,GPIO_Pin_10|GPIO_Pin_11);//初始化为高电平 即总线空闲状态
}

/**
  * @brief  I2C起始条件 --  SCL高电平期间，SDA从 高电平 切换到 低电平
  * @param  
  * @retval 
  */
void MyI2C_Start(void)
{
	MyI2C_W_SDA(1);//SDA在前 为了确保SDA上升沿
	MyI2C_W_SCL(1);
	MyI2C_W_SDA(0);
	MyI2C_W_SCL(0);//起始条件后 将SCL拉低 拼接发送发送数据格式
}
/**
  * @brief  I2C停止条件 -- SCL高电平期间，SDA从 低电平 切换到 高电平
  * @param  
  * @retval 
  */
void MyI2C_Stop(void)
{
	MyI2C_W_SDA(0);//SDA在前 为了确保SDA下降沿
	MyI2C_W_SCL(1);
	MyI2C_W_SDA(1);
}
/**
  * @brief  I2C发送字节 -- SCL低电平期间，主机将数据位依次放到SDA线上（高位先行），然后释放SCL，
            从机将在SCL高电平期间读取数据位
  * @param  
  * @retval 
  */
void MyI2C_SendByte(uint8_t Byte)
{
	uint8_t i;
	for (i = 0; i < 8; i ++)
	{
		MyI2C_W_SDA(Byte & (0x80 >> i));//按位操作 依次取最高位 -- 第一个对应上 起始条件的SCL低电平
		MyI2C_W_SCL(1);//高电平期间发送数据
		MyI2C_W_SCL(0);//低电平期间数据变换
	}
}
/**
  * @brief  I2C接收字节 -- SCL低电平期间，从机将数据位依次放到SDA线上（高位先行），然后释放SCL，
            主机将在SCL高电平期间读取数据位
  * @param  
  * @retval 
  */
uint8_t MyI2C_ReceiveByte(void)
{
	uint8_t i, Byte = 0x00;
	MyI2C_W_SDA(1);//为了防止主机干扰从机的数据发送 主机将开启并保持高阻态 总线SDA只能由从机控制 也就相当于开启了输入模式
	for (i = 0; i < 8; i ++)
	{
		MyI2C_W_SCL(1);//①接受完应答位后 先把时钟线拉高 来读取从机发送过来的数据 -- 高电平期间接收数据
		if (MyI2C_R_SDA() == 1){Byte |= (0x80 >> i);}//那个字节是 就把 那一位置1 高位先行
		MyI2C_W_SCL(0);//低电平期间数据变换
	}
	return Byte;
}
/**
  * @brief  I2C主机发送应答 -- 数据0表示应答，数据1表示非应答
  * @param  
  * @retval 
  */
void MyI2C_SendAck(uint8_t AckBit)
{
	MyI2C_W_SDA(AckBit);//是否应答
	MyI2C_W_SCL(1);//高电平期间发送数据
	MyI2C_W_SCL(0);//拉低SCL
}
/**
  * @brief  I2C主机接收应答 -- 数据0表示应答，数据1表示非应答
  * @param  
  * @retval 
  */
uint8_t MyI2C_ReceiveAck(void)
{
	uint8_t AckBit;
	MyI2C_W_SDA(1);//主机释放SDA 从机控制SDA
	MyI2C_W_SCL(1);//高电平期间接收数据
	AckBit = MyI2C_R_SDA();//接收从机发送过来的应答位
	MyI2C_W_SCL(0);//拉低SCL
	return AckBit;//返回 从机是否应答
}
```

> 可以在主函数中使用下面的代码 来检测I2C的代码逻辑是否有误 没有则 MPU6050会传给你一个0应答
>
> ```c
>   OLED_Init();
>   MyI2C_Init();
>   MyI2C_Start();
>   MyI2C_SendByte(0XD0);
>   uint8_t ACK = MyI2C_ReceiveAck();
>   OLED_ShowNum(1,1,ACK,2);
> ```

`MPU6050.h`

```c
#ifndef  __MPU6050_H__//如果没有定义了则参加以下编译
#define  __MPU6050_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"
#include "MyI2C.h"
#define  MPU6050_ADDRESS         0xD0 //默认为写操作 1101 000 0
#define  MPU6050_SMPLRT_DIV      0x19 //采样率分频寄存器地址 -- 地址内容就是采样分频
#define  MPU6050_CONFIG          0x1A //配置寄存器 -- Bit5~3(外部同步 000不需要) Bit2~0(数字低通滤波器 -- 110最平滑的滤波)
#define  MPU6050_GYRO_CONFIG     0x1B //陀螺仪寄存器 -- Bit7~5(自测使能 000不自测)Bit4~3(满量程选择 11最大量程)后三位为无关位
#define  MPU6050_ACCEL_CONFIG    0x1C //加速度计配置寄存器 -- Bit7~5(自测使能 000不自测)Bit4~3(满量程选择 11最大量程)Bit2~0(高通滤波器 000不使用)
      
#define  MPU6050_ACCEL_XOUT_H    0x3B  //加速度计X 高8位
#define  MPU6050_ACCEL_XOUT_L    0x3C  //加速度计X 低8位
#define  MPU6050_ACCEL_YOUT_H    0x3D  //加速度计Y 高8位
#define  MPU6050_ACCEL_YOUT_L    0x3E  //加速度计Y 低8位
#define  MPU6050_ACCEL_ZOUT_H    0x3F  //加速度计Z 高8位
#define  MPU6050_ACCEL_ZOUT_L    0x40  //加速度计Z 低8位
#define  MPU6050_TEMP_OUT_H      0x41  //温度 高8位
#define  MPU6050_TEMP_OUT_L      0x42  //温度 低8位
#define  MPU6050_GYRO_XOUT_H     0x43  //陀螺仪计X 高8位
#define  MPU6050_GYRO_XOUT_L     0x44  //陀螺仪计X 低8位
#define  MPU6050_GYRO_YOUT_H     0x45  //陀螺仪计Y 高8位
#define  MPU6050_GYRO_YOUT_L     0x46  //陀螺仪计Y 低8位
#define  MPU6050_GYRO_ZOUT_H     0x47  //陀螺仪计Z 高8位
#define  MPU6050_GYRO_ZOUT_L     0x48  //陀螺仪计Z 低8位
                                 
#define  MPU6050_PWR_MGMT_1      0x6B   //电源管理 --设备复位(不复位),睡眠模式(0解除睡眠),循环模式(0不循环)，无关位(给0)，温度传感器(0不失能)，时钟(000选择内部时钟 001陀螺仪时钟)
#define  MPU6050_PWR_MGMT_2      0x6C   //电源管理 --(前两位)循环模式和唤醒频率(00不需要) 后6位每一个轴的待机位(全给0 不需要待机)
#define  MPU6050_WHO_AM_I        0x75   //查询芯片ID号 -- 0X68  0 110 1000 其实就是7地址

void MPU6050_WriteReg(uint8_t RegAddress, uint8_t Data);
uint8_t MPU6050_ReadReg(uint8_t RegAddress);
void MPU6050_Init(void);
uint8_t MPU6050_GetID(void);
void MPU6050_GetData(int16_t *AccX, int16_t *AccY, int16_t *AccZ, 
                     int16_t *GyroX, int16_t *GyroY, int16_t *GyroZ);
#endif  //结束编译
```

`MPU6050.c`

```c
#include "MPU6050.h"

//此代码优化处 可处理是否应答了 
/**
  * @brief  指定地址写 -- 对于指定设备（Slave Address），在指定地址（Reg Address）下，写入指定数据（Data）
  * @param  
  * @retval 
  */
void MPU6050_WriteReg(uint8_t RegAddress, uint8_t Data)
{
  MyI2C_Start();
  MyI2C_SendByte(MPU6050_ADDRESS);//指定设备·写
  MyI2C_ReceiveAck();
  MyI2C_SendByte(RegAddress);//指定地址
  MyI2C_ReceiveAck();
  
  //想要写入多个字节 可以 在把下面两行代码 加入一个for循环 然后参数输入一个数组即可
  MyI2C_SendByte(Data);//写入数据 1字节
  MyI2C_ReceiveAck();
  
  MyI2C_Stop();
}
/**
  * @brief  指定地址读 -- 对于指定设备（Slave Address），在指定地址（Reg Address）下，读取从机数据（Data）
  * @param  
  * @retval 
  */
uint8_t MPU6050_ReadReg(uint8_t RegAddress)
{
  uint8_t Data;

  MyI2C_Start();
  MyI2C_SendByte(MPU6050_ADDRESS);//指定设备·写
  MyI2C_ReceiveAck();
  MyI2C_SendByte(RegAddress);//指定地址
  MyI2C_ReceiveAck();

  MyI2C_Start();//重新起始
  MyI2C_SendByte(MPU6050_ADDRESS | 0x01);////指定设备·读
  MyI2C_ReceiveAck();
  //想要写入多个字节 可以 在把下面代码 加入一个for循环 读出来的数据保存到一个数组内
  //同时要改为 应答从机 MyI2C_SendAck(0); 在读完最后一个 不应答 MyI2C_SendAck(1);
  Data = MyI2C_ReceiveByte();//读取数据 1字节
 
  MyI2C_SendAck(1);
  MyI2C_Stop();
  return Data;
}

void MPU6050_Init(void)
{
	MyI2C_Init();
	MPU6050_WriteReg(MPU6050_PWR_MGMT_1, 0x01);    //电源管理1
	MPU6050_WriteReg(MPU6050_PWR_MGMT_2, 0x00);    //电源管理2
	MPU6050_WriteReg(MPU6050_SMPLRT_DIV, 0x09);    //采样率分频 
	MPU6050_WriteReg(MPU6050_CONFIG, 0x06);        //配置寄存器 
	MPU6050_WriteReg(MPU6050_GYRO_CONFIG, 0x18);   //陀螺仪寄存器 
	MPU6050_WriteReg(MPU6050_ACCEL_CONFIG, 0x18);  //加速度计配置寄存器
}
/**
  * @brief  获取MPU6050的ID号
  * @param  
  * @retval 
  */
uint8_t MPU6050_GetID(void)
{
  return MPU6050_ReadReg(MPU6050_WHO_AM_I);
}
/**
  * @brief  获取加速度计，陀螺仪数据
  * @param  
  * @retval 
  */
void MPU6050_GetData(int16_t *AccX, int16_t *AccY, int16_t *AccZ, 
                     int16_t *GyroX, int16_t *GyroY, int16_t *GyroZ)
{
  uint8_t DataH, DataL;

  DataH = MPU6050_ReadReg(MPU6050_ACCEL_XOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_ACCEL_XOUT_L);
  *AccX = (DataH << 8) | DataL;//加速度计X  16位的数据 PS:虽然DataH是8位的 然后左移8位 由于运算时计算结果并不存储在data变量中  所以最后赋值给16位的也没什么影响

  DataH = MPU6050_ReadReg(MPU6050_ACCEL_YOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_ACCEL_YOUT_L);
  *AccY = (DataH << 8) | DataL;//加速度计Y

  DataH = MPU6050_ReadReg(MPU6050_ACCEL_ZOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_ACCEL_ZOUT_L);
  *AccZ = (DataH << 8) | DataL;//加速度计Z

  DataH = MPU6050_ReadReg(MPU6050_GYRO_XOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_GYRO_XOUT_L);
  *GyroX = (DataH << 8) | DataL;//陀螺仪X

  DataH = MPU6050_ReadReg(MPU6050_GYRO_YOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_GYRO_YOUT_L);
  *GyroY = (DataH << 8) | DataL;//陀螺仪Y

  DataH = MPU6050_ReadReg(MPU6050_GYRO_ZOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_GYRO_ZOUT_L);
  *GyroZ = (DataH << 8) | DataL;//陀螺仪Z
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "MyI2C.h"
#include "MPU6050.h"
uint8_t ID;
int16_t AX, AY, AZ, GX, GY, GZ;

int main(void)
{
  NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
  OLED_Init();
  MPU6050_Init();

  OLED_ShowString(1, 1, "ID:");
  ID = MPU6050_GetID();
  OLED_ShowHexNum(1, 4, ID, 2);

  while(1)
  {
      MPU6050_GetData(&AX, &AY, &AZ, &GX, &GY, &GZ);
      OLED_ShowSignedNum(2, 1, AX, 5);
      OLED_ShowSignedNum(3, 1, AY, 5);
      OLED_ShowSignedNum(4, 1, AZ, 5);
      OLED_ShowSignedNum(2, 8, GX, 5);
      OLED_ShowSignedNum(3, 8, GY, 5);
      OLED_ShowSignedNum(4, 8, GZ, 5);
  }
}
```

### 硬件读写I2C之MPU6050

请结合STM32的[发送流程](#Send)和[接收流程](#Recv) 进行研究以下代码 会更加的清晰 

`MPU6050.h`

```c
#ifndef  __MPU6050_H__//如果没有定义了则参加以下编译
#define  __MPU6050_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"

#define  MPU6050_ADDRESS         0xD0 //默认为写操作 1101 000 0
#define  MPU6050_SMPLRT_DIV      0x19 //采样率分频寄存器地址 -- 地址内容就是采样分频
#define  MPU6050_CONFIG          0x1A //配置寄存器 -- Bit5~3(外部同步 000不需要) Bit2~0(数字低通滤波器 -- 110最平滑的滤波)
#define  MPU6050_GYRO_CONFIG     0x1B //陀螺仪寄存器 -- Bit7~5(自测使能 000不自测)Bit4~3(满量程选择 11最大量程)后三位为无关位
#define  MPU6050_ACCEL_CONFIG    0x1C //加速度计配置寄存器 -- Bit7~5(自测使能 000不自测)Bit4~3(满量程选择 11最大量程)Bit2~0(高通滤波器 000不使用)
      
#define  MPU6050_ACCEL_XOUT_H    0x3B  //加速度计X 高8位
#define  MPU6050_ACCEL_XOUT_L    0x3C  //加速度计X 低8位
#define  MPU6050_ACCEL_YOUT_H    0x3D  //加速度计Y 高8位
#define  MPU6050_ACCEL_YOUT_L    0x3E  //加速度计Y 低8位
#define  MPU6050_ACCEL_ZOUT_H    0x3F  //加速度计Z 高8位
#define  MPU6050_ACCEL_ZOUT_L    0x40  //加速度计Z 低8位
#define  MPU6050_TEMP_OUT_H      0x41  //温度 高8位
#define  MPU6050_TEMP_OUT_L      0x42  //温度 低8位
#define  MPU6050_GYRO_XOUT_H     0x43  //陀螺仪计X 高8位
#define  MPU6050_GYRO_XOUT_L     0x44  //陀螺仪计X 低8位
#define  MPU6050_GYRO_YOUT_H     0x45  //陀螺仪计Y 高8位
#define  MPU6050_GYRO_YOUT_L     0x46  //陀螺仪计Y 低8位
#define  MPU6050_GYRO_ZOUT_H     0x47  //陀螺仪计Z 高8位
#define  MPU6050_GYRO_ZOUT_L     0x48  //陀螺仪计Z 低8位
                                 
#define  MPU6050_PWR_MGMT_1      0x6B   //电源管理 --设备复位(不复位),睡眠模式(0解除睡眠),循环模式(0不循环)，无关位(给0)，温度传感器(0不失能)，时钟(000选择内部时钟 001陀螺仪时钟)
#define  MPU6050_PWR_MGMT_2      0x6C   //电源管理 --(前两位)循环模式和唤醒频率(00不需要) 后6位每一个轴的待机位(全给0 不需要待机)
#define  MPU6050_WHO_AM_I        0x75   //查询芯片ID号 -- 0X68  0 110 1000 其实就是7地址

void MPU6050_WriteReg(uint8_t RegAddress, uint8_t Data);
uint8_t MPU6050_ReadReg(uint8_t RegAddress);
void MPU6050_Init(void);
uint8_t MPU6050_GetID(void);
void MPU6050_GetData(int16_t *AccX, int16_t *AccY, int16_t *AccZ, 
                     int16_t *GyroX, int16_t *GyroY, int16_t *GyroZ);
#endif  //结束编译
```

`MPU6050.C`

```C
#include "MPU6050.h"
/**
  * @brief  判断 等待 EV事件 是否完成 -- 标志位的作用 并增加超时机制
  * @param  
  * @retval 
  */
void MPU6050_WaitEvent(I2C_TypeDef* I2Cx, uint32_t I2C_EVENT)
{
  uint32_t Timeout;
  Timeout = 10000;
  while (I2C_CheckEvent(I2Cx, I2C_EVENT) != SUCCESS)
  {
    Timeout --;
    if (Timeout == 0)
    {
      break;
    }
  }
}

//此代码优化处 可处理是否应答了 
/**
  * @brief  指定地址写 -- 对于指定设备（Slave Address），在指定地址（Reg Address）下，写入指定数据（Data）
  * @param  
  * @retval 
  */
void MPU6050_WriteReg(uint8_t RegAddress, uint8_t Data)
{
  I2C_GenerateSTART(I2C2, ENABLE); //I2C起始位
  /*
   *软件读写I2C中，我们有堵塞Delay函数 可以等待 数据发送完成
   *硬件读写I2C中，没有堵塞函数，硬件I2C函数只管给寄存器置1,至于波形是否发送完毕它是不管的，
    所以我们需要在函数执行完后，等待相应的标志位，来确保函数的操作执行到位 使用 事件 来观察
  */
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_MODE_SELECT);//EV5事件 -- SB=1 当发送出起始条件时该位被置’1’

  I2C_Send7bitAddress(I2C2, MPU6050_ADDRESS, I2C_Direction_Transmitter);//设备从机地址 第三个参数是给读写位 置1或者置0 --置0写
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED);//EV6事件 -- ADDR = 1 地址发送结束
  /*
   *接收应答并不需要一个专门的函数来操作 发送/接收函数都自带了接收/发送应答的过程
   *如果应答错误 硬件会通过标志位 和 中断 来提示我们
   *PS:我并没在发送/接收函数中发现自带应答 难道是因为初始化的时候I2C_Ack_Enable所以不需要了吗 -- 结合下个函数的EV6_1事件 所以应该就是我认为的这个I2C_Ack_Enable产生的自动应答 --??未待完续 
  */
  /*EV8_1事件，并不需要等待，是告诉我们该向DR写入数据 然后发送了 所以我们直接写入数据即可*/
  I2C_SendData(I2C2, RegAddress);//指定地址
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_BYTE_TRANSMITTING);//EV8事件 -- TXE = 1 移位寄存器非空，数据寄存器是空,可以写入新数据

  I2C_SendData(I2C2, Data);//发送数据
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_BYTE_TRANSMITTED);//EV8_2事件 -- TXE = 1; BTF = 1 此时是 移位和数据寄存器都是空,没有新的写入DR数据寄存器了

  I2C_GenerateSTOP(I2C2, ENABLE);//I2C停止位
}
/**
  * @brief  指定地址读 -- 对于指定设备（Slave Address），在指定地址（Reg Address）下，读取从机数据（Data）
  * @param  
  * @retval 
  */
uint8_t MPU6050_ReadReg(uint8_t RegAddress)
{
  uint8_t Data;

  I2C_GenerateSTART(I2C2, ENABLE);//I2C起始位
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_MODE_SELECT);//EV5事件 -- SB=1 当发送出起始条件时该位被置’1’

  I2C_Send7bitAddress(I2C2, MPU6050_ADDRESS, I2C_Direction_Transmitter);//设备从机地址 第三个参数是给读写位 置1或者置0 --置0写
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED);//EV6事件 -- ADDR = 1 地址发送结束

  I2C_SendData(I2C2, RegAddress);//指定地址
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_BYTE_TRANSMITTED);//EV8_2事件-- TXE = 1; BTF = 1 此时是 移位和数据寄存器都是空,没有新的写入DR数据寄存器了
  /*
  *细节研究 在重新起始的上面是 使用EV8事件(TXE = 1 移位寄存器非空，数据寄存器是空,可以写入新数据) 还是EV8_2事件(移位和数据寄存器都是空)呢?
  *使用EV8:在使用EV8时，也就是EV8完成了==可以写入新数据了==可以下一步操作了，此时RegAddress的波形还没有发送完毕 
  -- 我们是否可以直接重新起始?让START位置1? 这样操作会不会把数据流截断? -- 经过JKD老师的实测并不会截断 
  -- 因为在调用重复起始后 如果当前还要数据在移位 它会等到数据移位完成后 再重复起始
  *使用EV8_2:保险!它是等待移位和数据都完成
  */
  I2C_GenerateSTART(I2C2, ENABLE);//重新起始
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_MODE_SELECT);//EV5事件 -- SB=1 当发送出起始条件时该位被置’1’

  I2C_Send7bitAddress(I2C2, MPU6050_ADDRESS, I2C_Direction_Receiver);//设备从机地址 第三个参数是给读写位 置1或者置0 -- 置1读
  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_RECEIVER_MODE_SELECTED);//EV6事件 -- 这个和上面的EV6都不一样 这个是主机接收的EV6事件

  /*EV6_1不需要等待，它是指定读一个字节 而我们这个函数就是指定读一个字节 
   *但是我们要注意它的要求 虽然不用等待 但是 要清除响应和产生停止条件
   *不要疑惑 为什么数据还没接收到 就给先给 非应答和停止位了 
   *是因为如果你在接收一个数据后再给 按时序图已经给完应答了 再给就晚了
   *并且停止位也不会截断当前字节 它会等字节接收完成后 再产生终止条件的波形 
   */
  /*如果你要接收多个字节 那么在接收完第一个字节后 你只需判断EV7事件是否完成
   *循环多次就可以接收多个字节
   *同上面EV6_1同理 也需要在最后一个数据收到之前提前 写入非应答和置停止位
   */
  I2C_AcknowledgeConfig(I2C2, DISABLE);//应答位 -- 置0非应答
  I2C_GenerateSTOP(I2C2, ENABLE);//I2C停止位

  MPU6050_WaitEvent(I2C2, I2C_EVENT_MASTER_BYTE_RECEIVED);//EV7事件 -- RXNE=1,表示数据寄存器非空,表示可以读取DR数据了
  Data = I2C_ReceiveData(I2C2);//读取数据

  I2C_AcknowledgeConfig(I2C2, ENABLE);//使能应答位 恢复I2C_ACK_ENABLE

  return Data;
}

void MPU6050_Init(void)
{
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB,ENABLE);
  RCC_APB1PeriphClockCmd(RCC_APB1Periph_I2C2,ENABLE);;
  //GPIO初始化
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10|GPIO_Pin_11;//设置PB10,PB11引脚
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_OD ;//设置输出模式为复用开漏输出(也是可以输入的 读取的数值输入到I2C的移位寄存器就可)
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
  //I2C结构初始化
  I2C_InitTypeDef I2C_InitStructure; 
  I2C_InitStructure.I2C_Mode = I2C_Mode_I2C; //初始化模式
  I2C_InitStructure.I2C_ClockSpeed = 50000; //0~100KHZ标准速度状态 100KHZ~400KHZ之间快速速度状态
  /* I2C_DutyCycle -- SCL时钟占空比
   * 在小于等于100KZ的标准速度下 占空比是固定的 低电平时间:高电平时间 = 1:1 
   * 占空比是为了快速传输数据而设计的 由于若上拉所以数据的上升沿变化比较慢 所以在快速传输的状态下增大了低电平的占空比
  */
  I2C_InitStructure.I2C_DutyCycle = I2C_DutyCycle_2; 
  I2C_InitStructure.I2C_Ack = I2C_Ack_Enable; //应答位 -- 默认给应答ACK==1
  I2C_InitStructure.I2C_AcknowledgedAddress = I2C_AcknowledgedAddress_7bit; //STM32作为从机的地址 选择响应7位/10位地址
  I2C_InitStructure.I2C_OwnAddress1 = 0x00; //STM32作为从机的自身地址 方便别的主机呼叫 -- 随便给一个和上面位数相同的地址
  //使能I2C2
  I2C_Init(I2C2, &I2C_InitStructure);

  MPU6050_WriteReg(MPU6050_PWR_MGMT_1, 0x01);    //电源管理1
  MPU6050_WriteReg(MPU6050_PWR_MGMT_2, 0x00);    //电源管理2
  MPU6050_WriteReg(MPU6050_SMPLRT_DIV, 0x09);    //采样率分频 
  MPU6050_WriteReg(MPU6050_CONFIG, 0x06);        //配置寄存器 
  MPU6050_WriteReg(MPU6050_GYRO_CONFIG, 0x18);   //陀螺仪寄存器 
  MPU6050_WriteReg(MPU6050_ACCEL_CONFIG, 0x18);  //加速度计配置寄存器
}
/**
  * @brief  获取MPU6050的ID号
  * @param  
  * @retval 
  */
uint8_t MPU6050_GetID(void)
{
  return MPU6050_ReadReg(MPU6050_WHO_AM_I);
}
/**
  * @brief  获取加速度计，陀螺仪数据
  * @param  
  * @retval 
  */
void MPU6050_GetData(int16_t *AccX, int16_t *AccY, int16_t *AccZ, 
                     int16_t *GyroX, int16_t *GyroY, int16_t *GyroZ)
{
  uint8_t DataH, DataL;

  DataH = MPU6050_ReadReg(MPU6050_ACCEL_XOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_ACCEL_XOUT_L);
  *AccX = (DataH << 8) | DataL;//加速度计X  16位的数据 PS:虽然DataH是8位的 然后左移8位 由于运算时计算结果并不存储在data变量中  所以最后赋值给16位的也没什么影响

  DataH = MPU6050_ReadReg(MPU6050_ACCEL_YOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_ACCEL_YOUT_L);
  *AccY = (DataH << 8) | DataL;//加速度计Y

  DataH = MPU6050_ReadReg(MPU6050_ACCEL_ZOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_ACCEL_ZOUT_L);
  *AccZ = (DataH << 8) | DataL;//加速度计Z

  DataH = MPU6050_ReadReg(MPU6050_GYRO_XOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_GYRO_XOUT_L);
  *GyroX = (DataH << 8) | DataL;//陀螺仪X

  DataH = MPU6050_ReadReg(MPU6050_GYRO_YOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_GYRO_YOUT_L);
  *GyroY = (DataH << 8) | DataL;//陀螺仪Y

  DataH = MPU6050_ReadReg(MPU6050_GYRO_ZOUT_H);
  DataL = MPU6050_ReadReg(MPU6050_GYRO_ZOUT_L);
  *GyroZ = (DataH << 8) | DataL;//陀螺仪Z
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "MPU6050.h"
uint8_t ID;
int16_t AX, AY, AZ, GX, GY, GZ;

int main(void)
{
  NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
  OLED_Init();
  MPU6050_Init();

  OLED_ShowString(1, 1, "ID:");
  ID = MPU6050_GetID();
  OLED_ShowHexNum(1, 4, ID, 2);

  while(1)
  {
      MPU6050_GetData(&AX, &AY, &AZ, &GX, &GY, &GZ);
      OLED_ShowSignedNum(2, 1, AX, 5);
      OLED_ShowSignedNum(3, 1, AY, 5);
      OLED_ShowSignedNum(4, 1, AZ, 5);
      OLED_ShowSignedNum(2, 8, GX, 5);
      OLED_ShowSignedNum(3, 8, GY, 5);
      OLED_ShowSignedNum(4, 8, GZ, 5);
  }
}
```



## I2C的库函数

**Table 1. I2C** 库函数 

| 函数名                      | 描述                                                    |      |
| --------------------------- | ------------------------------------------------------- | ---- |
| I2C_DeInit                  | 将外设  I2Cx 寄存器重设为缺省值                         |      |
| **I2C_Init**                | 根据  I2C_InitStruct 中指定的参数初始化外设 I2Cx 寄存器 |      |
| I2C_StructInit              | 把 I2C_InitStruct 中的每一个参数按缺省值填入            |      |
| **I2C_Cmd**                 | 使能或者失能  I2C 外设                                  |      |
| I2C_DMACmd                  | 使能或者失能指定  I2C 的 DMA 请求                       |      |
| I2C_DMALastTransferCmd      | 使下一次  DMA 传输为 后一次传输                         |      |
| **I2C_GenerateSTART**       | 产生  I2Cx 传输 START 条件                              |      |
| **I2C_GenerateSTOP**        | 产生  I2Cx 传输 STOP 条件                               |      |
| **I2C_AcknowledgeConfig**   | 使能或者失能指定  I2C 的应答功能                        |      |
| I2C_OwnAddress2Config       | 设置指定  I2C 的自身地址 2                              |      |
| I2C_DualAddressCmd          | 使能或者失能指定  I2C 的双地址模式                      |      |
| I2C_GeneralCallCmd          | 使能或者失能指定  I2C 的广播呼叫功能                    |      |
| I2C_ITConfig                | 使能或者失能指定的  I2C 中断                            |      |
| **I2C_SendData**            | 通过外设  I2Cx 发送一个数据                             |      |
| **I2C_ReceiveData**         | 返回通过  I2Cx 近接收的数据                             |      |
| **I2C_Send7bitAddress**     | 向指定的从  I2C 设备传送地址字                          |      |
| I2C_ReadRegister            | 读取指定的  I2C 寄存器并返回其值                        |      |
| I2C_SoftwareResetCmd        | 使能或者失能指定  I2C 的软件复位                        |      |
| I2C_SMBusAlertConfig        | 驱动指定  I2Cx 的 SMBusAlert 管脚电平为高或低           |      |
| I2C_TransmitPEC             | 使能或者失能指定  I2C 的 PEC 传输                       |      |
| I2C_PECPositionConfig       | 选择指定  I2C 的 PEC 位置                               |      |
| I2C_CalculatePEC            | 使能或者失能指定  I2C 的传输字 PEC 值计算               |      |
| I2C_GetPEC                  | 返回指定  I2C 的 PEC 值                                 |      |
| I2C_ARPCmd                  | 使能或者失能指定  I2C 的 ARP                            |      |
| I2C_StretchClockCmd         | 使能或者失能指定  I2C 的时钟延展                        |      |
| I2C_FastModeDutyCycleConfig | 选择指定  I2C 的快速模式占空比                          |      |
| I2C_GetLastEvent            | 返回  近一次 I2C 事件                                   |      |
| **I2C_CheckEvent**          | 检查  近一次 I2C 事件是否是输入的事件                   |      |
| **I2C_GetFlagStatus**       | 检查指定的  I2C 标志位设置与否                          |      |
| **I2C_ClearFlag**           | 清除  I2Cx 的待处理标志位                               |      |
| **I2C_GetITStatus**         | 检查指定的  I2C 中断发生与否                            |      |
| **I2C_ClearITPendingBit**   | 清除  I2Cx 的中断待处理位                               |      |

### 函数 I2C_ Init 

**Table 2.** 函数 **I2C_Init** 

| 函数名     | I2C_Init                                                     |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void I2C_Init(I2C_TypeDef* I2Cx,  I2C_InitTypeDef* I2C_InitStruct) |
| 功能描述   | 根据 I2C_InitStruct 中指定的参数初始化外设 I2Cx 寄存器       |
| 输入参数 1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数 2 | I2C_InitStruct：指向结构 I2C_InitTypeDef  的指针，包含了外设 GPIO 的配置信息参阅  Section：I2C_InitTypeDef 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**I2C_InitTypeDef structure** 

```c
//I2C_InitTypeDef 定义于文件“stm32f10x_i2c.h”： 

typedef struct 
{ 
 u16 I2C_Mode; 
 u16 I2C_DutyCycle; 
 u16 I2C_OwnAddress1; 
 u16 I2C_Ack; 
 u16 I2C_AcknowledgedAddress; 
 u32 I2C_ClockSpeed; 
} I2C_InitTypeDef; 
```

#### 参数 I2C_Mode 

I2C_Mode 用以设置 I2C 的模式。Table 208. 给出了该参数可取的值 

**Table 3. I2C_Mode** 值 

| **I2C_Mode**         | 描述                        |
| -------------------- | --------------------------- |
| I2C_Mode_I2C         | 设置  I2C 为 I2C 模式       |
| I2C_Mode_SMBusDevice | 设置  I2C 为 SMBus 设备模式 |
| I2C_Mode_SMBusHost   | 设置  I2C 为 SMBus 主控模式 |

#### 参数 I2C_DutyCycle

I2C_DutyCycle 用以设置 I2C 的占空比。Table 209. 给出了该参数可取的值 

**Table 4. I2C_DutyCycle** 值 

| **I2C_DutyCycle**  | 描述                             |
| ------------------ | -------------------------------- |
| I2C_DutyCycle_16_9 | I2C 快速模式 Tlow / Thigh = 16/9 |
| I2C_DutyCycle_2    | I2C 快速模式 Tlow / Thigh = 2    |

注意：该参数只有在 I2C 工作在快速模式（时钟工作频率高于 100KHz）下才有意义。 

#### 参数 I2C_OwnAddress1

该参数用来设置第一个设备自身地址，它可以是一个 7 位地址或者一个 10 位地址。 

#### 参数 I2C_Ack 

I2C_Ack 使能或者失能应答（ACK），Table 210. 给出了该参数可取的值 

**Table 5. I2C_Ack** 值 

| **I2C_Ack**     |                 | 描述 |
| --------------- | --------------- | ---- |
| I2C_Ack_Enable  | 使能应答（ACK） |      |
| I2C_Ack_Disable | 失能应答（ACK） |      |

#### 参数 I2C_AcknowledgedAddress

I2C_AcknowledgedAddres 定义了应答 7 位地址还是 10 位地址。Table 211. 给出了该参数可取的值  

**Table 6. I2C_AcknowledgedAddres** 值 

| **I2C_AcknowledgedAddres**   |                | 描述 |
| ---------------------------- | -------------- | ---- |
| I2C_AcknowledgeAddress_7bit  | 应答 7 位地址  |      |
| I2C_AcknowledgeAddress_10bit | 应答 10 位地址 |      |

#### 参数 I2C_ClockSpeed

该参数用来设置时钟频率，这个值不能高于 400KHz。

例：

```c
/* Initialize the I2C1 according to the I2C_InitStructure members */ 

I2C_InitTypeDef I2C_InitStructure; 

I2C_InitStructure.I2C_Mode = I2C_Mode_SMBusHost; 
I2C_InitStructure.I2C_DutyCycle = I2C_DutyCycle_2; 
I2C_InitStructure.I2C_OwnAddress1 = 0x03A2; 
I2C_InitStructure.I2C_Ack = I2C_Ack_Enable; 
I2C_InitStructure.I2C_AcknowledgedAddress = I2C_AcknowledgedAddress_7bit; 
I2C_InitStructure.I2C_ClockSpeed = 200000; 

I2C_Init(I2C1, &I2C_InitStructure);
```

### 函数 I2C_ Cmd 

**Table 7.** 函数 **I2C_ Cmd** 

| 函数名      | I2C_ Cmd                                                     |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void I2C_Cmd(I2C_TypeDef* I2Cx,  FunctionalState NewState)   |
| 功能描述    | 使能或者失能  I2C 外设                                       |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数  2 | NewState: 外设 I2Cx 的新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Enable I2C1 peripheral */ 

I2C_Cmd(I2C1, ENABLE); 
```

### 函数 I2C_ GenerateSTART 

**Table 217.** 函数 **I2C_ GenerateSTART** 

| 函数名      | I2C_ GenerateSTART                                           |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void I2C_GenerateSTART(I2C_TypeDef*  I2Cx, FunctionalState NewState) |
| 功能描述    | 产生  I2Cx 传输 START 条件                                   |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数  2 | NewState: I2Cx START 条件的新状态   这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Generate a START condition on I2C1 */ 

I2C_GenerateSTART(I2C1, ENABLE); 
```

### 函数 I2C_ GenerateSTOP 

**Table 218.** 函数 **I2C_ GenerateSTOP** 

| 函数名      | I2C_ GenerateSTOP                                            |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void I2C_GenerateSTOP(I2C_TypeDef*  I2Cx, FunctionalState NewState) |
| 功能描述    | 产生  I2Cx 传输 STOP 条件                                    |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数  2 | NewState: I2Cx STOP 条件的新状态   这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Generate a STOP condition on I2C2 */ 

I2C_GenerateSTOP(I2C2, ENABLE); 
```

### 函数 I2C_ AcknowledgeConfig 

**Table 219.** 函数 **I2C_ AcknowledgeConfig** 

| 函数名      | I2C_ AcknowledgeConfig                                       |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  I2C_AcknowledgeConfig(I2C_TypeDef* I2Cx, FunctionalState NewState) |
| 功能描述    | 使能或者失能指定  I2C 的应答功能                             |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数  2 | NewState: I2Cx 应答的新状态   这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Enable the I2C1 Acknowledgement */ 

I2C_AcknowledgeConfig(I2C1, ENABLE); 
```

### 函数 I2C_ SendData 

**Table 225.** 函数 **I2C_ SendData** 

| 函数名      | I2C_ SendData                                  |
| ----------- | ---------------------------------------------- |
| 函数原形    | void I2C_SendData(I2C_TypeDef* I2Cx,  u8 Data) |
| 功能描述    | 通过外设  I2Cx 发送一个数据                    |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设      |
| 输入参数  2 | Data: 待发送的数据                             |
| 输出参数    | 无                                             |
| 返回值      | 无                                             |
| 先决条件    | 无                                             |
| 被调用函数  | 无                                             |

例： 

```c
/* Transmit 0x5D byte on I2C2 */

I2C_SendData(I2C2, 0x5D); 
```

### 函数 I2C_ ReceiveData 

**Table 226.** 函数 **I2C_ReceiveData** 

| 函数名     | I2C_ ReceiveData                          |
| ---------- | ----------------------------------------- |
| 函数原形   | u8 I2C_ReceiveData(I2C_TypeDef* I2Cx)     |
| 功能描述   | 返回通过  I2Cx 近接收的数据               |
| 输入参数   | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设 |
| 输出参数   | 无                                        |
| 返回值     | 接收到的字                                |
| 先决条件   | 无                                        |
| 被调用函数 | 无                                        |

例： 

```c
/* Read the received byte on I2C1 */
u8 ReceivedData; 

ReceivedData = I2C_ReceiveData(I2C1); 
```

### 函数 I2C_ Send7bitAddress 

**Table 227.** 函数 **I2C_ Send7bitAddress** 

| 函数名     | I2C_ Send7bitAddress                                         |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void I2C_Send7bitAddress(I2C_TypeDef*  I2Cx, u8 Address, u8 I2C_Direction) |
| 功能描述   | 向指定的从 I2C 设备传送地址字                                |
| 输入参数 1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数 2 | Address: 待传输的从 I2C  地址                                |
| 输入参数 3 | I2C_Direction：设置指定的 I2C 设备工作为发射端还是接收端参阅 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**I2C_Direction**

该参数设置 I2C 界面为发送端模式或者接收端模式（见 Table 228.）。 

**Table 228. I2C_Direction** 值 

| **I2C_Direction**         |              | 描述 |
| ------------------------- | ------------ | ---- |
| I2C_Direction_Transmitter | 选择发送方向 |      |
| I2C_Direction_Receiver    | 选择接收方向 |      |

例： 

```c
/* Send, as transmitter, the Slave device address 0xA8 in 7-bit addressing mode in I2C1 */ 

I2C_Send7bitAddress(I2C1, 0xA8, I2C_Direction_Transmitter); 
```

### 函数 I2C_CheckEvent

| 函数名     | I2C_CheckEvent                                               |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | ErrorStatus I2C_CheckEvent(I2C_TypeDef* I2Cx, uint32_t I2C_EVENT) |
| 功能描述   | 检查最后一个 I2Cx 事件是否等于传递的事件作为参数。           |
| 输入参数 1 | I2Cx：其中 x 可以是 1 或 2 以选择 I2C 外设                   |
| 输入参数 2 | I2C_EVENT：指定要检查的事件                                  |
| 输出参数   | 无                                                           |
| 返回值     | 错误状态枚举值：  * 成功：最后一个事件等于I2C_EVENT  * 错误：上一个事件与I2C_EVENT不同 |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**函数原型：**

```c
/**
  * @brief  Checks whether the last I2Cx Event is equal to the one passed
  *   as parameter.
  * @param  I2Cx: where x can be 1 or 2 to select the I2C peripheral.
  * @param  I2C_EVENT: specifies the event to be checked. 
  *   This parameter can be one of the following values:
  *     @arg I2C_EVENT_SLAVE_TRANSMITTER_ADDRESS_MATCHED           : EV1
  *     @arg I2C_EVENT_SLAVE_RECEIVER_ADDRESS_MATCHED              : EV1
  *     @arg I2C_EVENT_SLAVE_TRANSMITTER_SECONDADDRESS_MATCHED     : EV1
  *     @arg I2C_EVENT_SLAVE_RECEIVER_SECONDADDRESS_MATCHED        : EV1
  *     @arg I2C_EVENT_SLAVE_GENERALCALLADDRESS_MATCHED            : EV1
  *     @arg I2C_EVENT_SLAVE_BYTE_RECEIVED                         : EV2
  *     @arg (I2C_EVENT_SLAVE_BYTE_RECEIVED | I2C_FLAG_DUALF)      : EV2
  *     @arg (I2C_EVENT_SLAVE_BYTE_RECEIVED | I2C_FLAG_GENCALL)    : EV2
  *     @arg I2C_EVENT_SLAVE_BYTE_TRANSMITTED                      : EV3
  *     @arg (I2C_EVENT_SLAVE_BYTE_TRANSMITTED | I2C_FLAG_DUALF)   : EV3
  *     @arg (I2C_EVENT_SLAVE_BYTE_TRANSMITTED | I2C_FLAG_GENCALL) : EV3
  *     @arg I2C_EVENT_SLAVE_ACK_FAILURE                           : EV3_2
  *     @arg I2C_EVENT_SLAVE_STOP_DETECTED                         : EV4
  *     @arg I2C_EVENT_MASTER_MODE_SELECT                          : EV5
  *     @arg I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED            : EV6     
  *     @arg I2C_EVENT_MASTER_RECEIVER_MODE_SELECTED               : EV6
  *     @arg I2C_EVENT_MASTER_BYTE_RECEIVED                        : EV7
  *     @arg I2C_EVENT_MASTER_BYTE_TRANSMITTING                    : EV8
  *     @arg I2C_EVENT_MASTER_BYTE_TRANSMITTED                     : EV8_2
  *     @arg I2C_EVENT_MASTER_MODE_ADDRESS10                       : EV9
  *     
  * @note: For detailed description of Events, please refer to section 
  *    I2C_Events in stm32f10x_i2c.h file.
  *    
  * @retval An ErrorStatus enumeration value:
  * - SUCCESS: Last event is equal to the I2C_EVENT
  * - ERROR: Last event is different from the I2C_EVENT
  */
ErrorStatus I2C_CheckEvent(I2C_TypeDef* I2Cx, uint32_t I2C_EVENT)
{
  uint32_t lastevent = 0;
  uint32_t flag1 = 0, flag2 = 0;
  ErrorStatus status = ERROR;

  /* Check the parameters */
  assert_param(IS_I2C_ALL_PERIPH(I2Cx));
  assert_param(IS_I2C_EVENT(I2C_EVENT));

  /* Read the I2Cx status register */
  flag1 = I2Cx->SR1;
  flag2 = I2Cx->SR2;
  flag2 = flag2 << 16;

  /* Get the last event value from I2C status register */
  lastevent = (flag1 | flag2) & FLAG_Mask;

  /* Check whether the last event contains the I2C_EVENT */
  if ((lastevent & I2C_EVENT) == I2C_EVENT)
  {
    /* SUCCESS: last event is equal to I2C_EVENT */
    status = SUCCESS;
  }
  else
  {
    /* ERROR: last event is different from I2C_EVENT */
    status = ERROR;
  }
  /* Return status */
  return status;
}
```

### 函数 I2C_ GetFlagStatus 

**Table 246.** 函数 **I2C_ GetFlagStatus** 

| 函数名      | I2C_ GetFlagStatus                                           |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | FlagStatus  I2C_GetFlagStatus(I2C_TypeDef* I2Cx, u32 I2C_FLAG) |
| 功能描述    | 检查指定的  I2C 标志位设置与否                               |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数  2 | I2C_FLAG：待检查的 I2C 标志位   参阅  Section：I2C_FLAG 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | I2C_FLAG 的新状态 1.                                         |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

1. 读取寄存器可能会清除某些标志位

**I2C_FLAG** 

Table 247. 给出了所有可以被函数 I2C_ GetFlagStatus 检查的标志位列表 

**Table 247. I2C_FLAG** 值 

| **I2C_FLAG**        | 描述                                                         |
| ------------------- | ------------------------------------------------------------ |
| I2C_FLAG_DUALF      | 双标志位（从模式）                                           |
| I2C_FLAG_SMBHOST    | SMBus 主报头（从模式）                                       |
| I2C_FLAG_SMBDEFAULT | SMBus 缺省报头（从模式）                                     |
| I2C_FLAG_GENCALL    | 广播报头标志位（从模式）                                     |
| I2C_FLAG_TRA        | 发送/接收标志位                                              |
| I2C_FLAG_BUSY       | 总线忙标志位                                                 |
| I2C_FLAG_MSL        | 主/从标志位                                                  |
| I2C_FLAG_SMBALERT   | SMBus 报警标志位                                             |
| I2C_FLAG_TIMEOUT    | 超时或者  Tlow 错误标志位                                    |
| I2C_FLAG_PECERR     | 接收  PEC 错误标志位                                         |
| I2C_FLAG_OVR        | 溢出/不足标志位（从模式）                                    |
| I2C_FLAG_AF         | 应答错误标志位                                               |
| I2C_FLAG_ARLO       | 仲裁丢失标志位（主模式）                                     |
| I2C_FLAG_BERR       | 总线错误标志位                                               |
| I2C_FLAG_TXE        | 数据寄存器空标志位（发送端）                                 |
| I2C_FLAG_RXNE       | 数据寄存器非空标志位（接收端）                               |
| I2C_FLAG_STOPF      | 停止探测标志位（从模式）                                     |
| I2C_FLAG_ADD10      | 10 位报头发送（主模式）                                      |
| I2C_FLAG_BTF        | 字传输完成标志位                                             |
| I2C_FLAG_ADDR       | 地址发送标志位（主模式）“ADSL” 地址匹配标志位（从模式）“ENDAD” |
| I2C_FLAG_SB         | 起始位标志位（主模式）                                       |

注意：只有位[27：0]被函数 I2C_ GetFlagStatus 用来返回指定的标志位状态。值对应经计算的寄存器中的标志位位置，该寄存器包含 2 个 I2C 状态寄存器 I2C_SR1 和 I2C_SR2。

例： 

```C
/* Return the I2C_FLAG_AF flag state of I2C2 peripheral */ 

Flagstatus Status; 

Status = I2C_GetFlagStatus(I2C2, I2C_FLAG_AF); 
```

### 函数 I2C_ ClearFlag 

**Table 248.** 函数 **I2C_ ClearFlag** 

| 函数名      | I2C_ ClearFlag                                               |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void I2C_ClearFlag(I2C_TypeDef* I2Cx,  u32 I2C_FLAG)         |
| 功能描述    | 清除  I2Cx 的待处理标志位                                    |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数  2 | I2C_FLAG：待清除的 I2C 标志位参阅 Section：I2C_FLAG  查阅更多该参数允许取值范围    注意：标志位 DUALF, SMBHOST, SMBDEFAULT, GENCALL, TRA, BUSY,MSL, TXE 和 RXNE  不能被本函数清除 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**I2C_FLAG** 

Table 249. 给出了所有可以被函数 I2C_ ClearFlag 清除的标志位列表 

**Table 249. I2C_FLAG** 值 

| **I2C_FLAG**      | 描述                                                         |
| ----------------- | ------------------------------------------------------------ |
| I2C_FLAG_SMBALERT | SMBus 报警标志位                                             |
| I2C_FLAG_TIMEOUT  | 超时或者  Tlow 错误标志位                                    |
| I2C_FLAG_PECERR   | 接收  PEC 错误标志位                                         |
| I2C_FLAG_OVR      | 溢出/不足标志位（从模式）                                    |
| I2C_FLAG_AF       | 应答错误标志位                                               |
| I2C_FLAG_ARLO     | 仲裁丢失标志位（主模式）                                     |
| I2C_FLAG_BERR     | 总线错误标志位                                               |
| I2C_FLAG_STOPF    | 停止探测标志位（从模式）                                     |
| I2C_FLAG_ADD10    | 10 位报头发送（主模式）                                      |
| I2C_FLAG_BTF      | 字传输完成标志位                                             |
| I2C_FLAG_ADDR     | 地址发送标志位（主模式）“ADSL” 地址匹配标志位（从模式）“ENDAD” |
| I2C_FLAG_SB       | 起始位标志位（主模式）                                       |

例： 

```C
/* Clear the Stop detection flag on I2C2 */

I2C_ClearFlag(I2C2, I2C_FLAG_STOPF); 
```

### 函数 I2C_ GetITStatus 

**Table 250.** 函数 **I2C_ GetITStatus** 

| 函数名      | I2C_ GetITStatus                                             |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | ITStatus I2C_GetITStatus(I2C_TypeDef*  I2Cx, u32 I2C_IT)     |
| 功能描述    | 检查指定的  I2C 中断发生与否                                 |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数  2 | I2C_IT：待检查的 I2C 中断源   参阅  Section：I2C_IT 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | I2C_IT 的新状态（SET 或者 RESET）1.                          |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

1. 读取寄存器可能会清除某些标志位

**I2C_IT** 

Table 251. 给出了所有可以被函数 I2C_ GetITStatus 检查的中断标志位列表 

**Table 251. I2C_IT** 值 

| **I2C_IT**      | 描述                                                         |
| --------------- | ------------------------------------------------------------ |
| I2C_IT_SMBALERT | SMBus 报警标志位                                             |
| I2C_IT_TIMEOUT  | 超时或者  Tlow 错误标志位                                    |
| I2C_IT_PECERR   | 接收  PEC 错误标志位                                         |
| I2C_IT_OVR      | 溢出/不足标志位（从模式）                                    |
| I2C_IT_AF       | 应答错误标志位                                               |
| I2C_IT_ARLO     | 仲裁丢失标志位（主模式）                                     |
| I2C_IT_BERR     | 总线错误标志位                                               |
| I2C_IT_STOPF    | 停止探测标志位（从模式）                                     |
| I2C_IT_ADD10    | 10 位报头发送（主模式）                                      |
| I2C_IT_BTF      | 字传输完成标志位                                             |
| I2C_IT_ADDR     | 地址发送标志位（主模式）“ADSL” 地址匹配标志位（从模式）“ENDAD” |
| I2C_IT_SB       | 起始位标志位（主模式）                                       |

例： 

```C
/* Return the I2C_IT_OVR flag state of I2C1 peripheral */ 

ITstatus Status; 

Status = I2C_GetITStatus(I2C1, I2C_IT_OVR); 
```

### 函数 I2C_ ClearITPendingBit 

**Table 252.** 函数 **I2C_ ClearITPendingBit** 

| 函数名      | I2C_ ClearITPendingBit                                       |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  I2C_ClearITPendingBit(I2C_TypeDef* I2Cx, u32 I2C_IT)   |
| 功能描述    | 清除  I2Cx 的中断待处理位                                    |
| 输入参数  1 | I2Cx：x 可以是 1 或者 2，来选择 I2C  外设                    |
| 输入参数  2 | I2C_IT：待检查的 I2C 中断源   参阅  Section：I2C_IT 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**I2C_IT** 

**Table 253. I2C_IT** 值 

| **I2C_IT**      | 描述                                                         |
| --------------- | ------------------------------------------------------------ |
| I2C_IT_SMBALERT | SMBus 报警标志位                                             |
| I2C_IT_TIMEOUT  | 超时或者  Tlow 错误标志位                                    |
| I2C_IT_PECERR   | 接收  PEC 错误标志位                                         |
| I2C_IT_OVR      | 溢出/不足标志位（从模式）                                    |
| I2C_IT_AF       | 应答错误标志位                                               |
| I2C_IT_ARLO     | 仲裁丢失标志位（主模式）                                     |
| I2C_IT_BERR     | 总线错误标志位                                               |
| I2C_IT_STOPF    | 停止探测标志位（从模式）                                     |
| I2C_IT_ADD10    | 10 位报头发送（主模式）                                      |
| I2C_IT_BTF      | 字传输完成标志位                                             |
| I2C_IT_ADDR     | 地址发送标志位（主模式）“ADSL” 地址匹配标志位（从模式）“ENDAD” |
| I2C_IT_SB       | 起始位标志位（主模式）                                       |

例： 

```C
/* Clear the Timeout interrupt opending bit on I2C2 */ 

I2C_ClearITPendingBit(I2C2, I2C_IT_TIMEOUT); 
```
