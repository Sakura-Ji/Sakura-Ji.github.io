

# SPI通信

学习资料:

* [江科大-STM32入门教程](https://www.bilibili.com/video/BV1th411z7sn/?p=36&share_source=copy_web&vd_source=1f86b29b1eacf120a2143333a298e645)

## SPI简介

SPI（Serial Peripheral Interface）是由Motorola公司开发的一种通用数据总线,**SPI本质是移位寄存器**

**spi有很多种类:**

* 两线，只有时钟线，数据线双向复用
* 三线，含使能脚，时钟脚，双向数据脚

* **四线**，SCK（Serial Clock）时钟线、MOSI（Master Output Slave Input）主机输出从机输入、MISO（Master Input Slave Output）主机输入从机输出、SS（Slave Select）片选，如果两条数据线都双向运行，叫DSPI (双倍spi，一次传输两位数据)

* 六线，叫 QSPI，四条数据线，一次传输四位数据


**SPI特征:**

* 同步，全双工，支持总线挂载多设备（**一主多从**）
* spi的片选引脚可以高电平有效，也可以低电平有效 -- 一般默认是低电平有效
* 时钟脚可以默认高电平也可以默认低电平 
* 数据传输可以在时钟前沿发生，也可以在时钟后沿发生

**和I2C比较:**

* I2C是同步半双工，SPI是同步全双工
* I2C由于开漏输出上升沿耗时较长(若上拉)，会限制I2C的最大通信速度100~400KHZ,后续经改进达到3.4MHZ(但普及程度不是很高) 而 SPI并没有严格规定最大传输速度，SPI的输出引脚为推挽输出，高低电平均有很强的驱动能力，这会使上升沿/下降沿非常迅速，这个传输速度取决于芯片厂商的需求，比如W25Q64的时钟频率最大可达80MHZ
* I2C有应答机制，SPI没有应答机制，发送数据就发送，接收数据就接收，至于对面是否存在SPI是不管的

### SPI的硬件电路设计

![SPI_HardwareStruct](https://pic.imgdb.cn/item/652102bdc458853aef2f3736/SPI_HardwareStruct.png)

> * 所有SPI设备的SCK、MOSI、MISO分别连在一起
>   * SCK时钟线是由主机控制的
>
> * 主机另外引出多条SS控制线，分别接到各从机的SS引脚 
>   * SS一般默认低电平有效
>   * 主机同一时间只能置一个SS为低电平，只能和一个从机进行通讯，其它从机的SS要置高电平
>
> * 输出引脚配置为**推挽输出**，输入引脚配置为**浮空或上拉输入**
>   * 当从机的SS片选引脚为高电平时，即从机的片选引脚未被选中时，该从机的MISO(主机输入从机输出的线)必须为高阻态模式，不可以输出任何电平，该引脚的空闲电平(即高阻态时由外部决定引脚是高还是低)，由主机的配置决定，当主机为上拉输入，空闲电平为高电平，为浮空输入时，引脚电平不确定，这样就可以防止，一条线有多个输出，而导致电平冲突的问题了；只有在其片选引脚为低电平时，MISO才允许变为推挽输出

#### SPI的通信之移位原理

下面移位原理的讲解是以[模式1](#Mode1)来进行讲解的，模式1是最容易让人理解的，但通常用的却是[模式0](#Mode0)

![SPI_SmaplingData](https://pic.imgdb.cn/item/652102c1c458853aef2f3cf4/SPI_SmaplingData.png)

* SPI内部含有一个8位的移位寄存器
* SPI是**高位先行**
* SPI的时钟源是主机提供的 -- **波特率发生器** 它会驱动主机/从机的移位寄存器进行移位
* 主机移位寄存器左边移出去的数据，通过MOSI引脚，输入到从机移位寄存器的右边
* 从机移位寄存器左边移出去的数据，通过MISO引脚，输入到主机移位寄存器的右边
* 波特率发生器时钟(SCK)的 **上升沿** 主机和选中的从机的移位寄存器，向左移动一位，移出去的位放到引脚上(引脚给高低电平 就相当于 把数据放到引脚上了) ![SPI_UsingData_GPIO](https://pic.imgdb.cn/item/652102c7c458853aef2f4444/SPI_UsingData_GPIO.png)
* 波特率发生器时钟(SCK)的 **下降沿** 将引脚上的位，采样输入到 主机和选中的从机的移位寄存器的最低位也就是最右边![SPI_UsingData_Reg](https://pic.imgdb.cn/item/652102c8c458853aef2f4624/SPI_UsingData_Reg.png)
* 将上两个动作经8个时钟后,就实现了主机和从机的一个字节的数据交换![SPI_UsedSmaplingData](https://pic.imgdb.cn/item/652102d0c458853aef2f51d0/SPI_UsedSmaplingData.png)
* **SPI的数据收发，都是基于字节交换，这个基本单元来进行的**
  * 当主机需要发送一个字节，同时需要接收一个字节时，执行一下上方的逻辑，这样就可以完成发送同时接收的目的
  * 如果主机只想发送不想接收，我们只需要让从机给主机一个dummy数据，我们主机不要那个数据即可
  * 反之主机只想接收不想发送，那就给从机一个dummy数据，只把从 从机接收过来的数据保存就好了，并且那个dummy数据从机一般也不会管它

### SPI的软件设计

> * **起始条件**：SS片选从高电平切换到低电平 -- 选中从机
> * **终止条件**：SS片选从低电平切换到高电平 -- 释放从机

#### SPI时序的基本单元

* CPOL(Clock Polarity) 时钟极性

* CPHA(Clock Phase)   时钟相位

##### 模式0 {#Mode0}

> * 交换一个字节（模式0）
> * CPOL=0：空闲状态时，SCK为低电平
> * CPHA=0：SCK第一个边沿移入数据(数据采样)，第二个边沿移出数据

![SPI_Mode0](https://pic.imgdb.cn/item/652102d7c458853aef2f5b4c/SPI_Mode0.png)

①由于SCK一旦开始变化，就要移入数据(数据采样)了，所以此时趁SCK还没有变化，要在SS下降沿时，就要立刻触发移出数据，相当于把SS的下降沿也当入了时钟的一部分

②如果只是交换一个字节，那么在第8个时钟的下降沿，就不会再移出数据，如果继续交换字节，就正好是第8个时钟的下降沿，移出下一个字节的B7

##### 模式1 {#Mode1}

> * 交换一个字节（模式1）
> * CPOL=0：空闲状态时，SCK为低电平
> * CPHA=1：SCK第一个边沿移出数据(到引脚上)，第二个边沿移入数据(数据采样)

![SPI_Mode1](https://pic.imgdb.cn/item/652102dcc458853aef2f67a9/SPI_Mode1.png)

##### 模式2

> * 交换一个字节（模式2）
> * CPOL=1：空闲状态时，SCK为高电平
> * CPHA=0：SCK第一个边沿移入数据(数据采样)，第二个边沿移出数据

![SPI_Mode2](https://pic.imgdb.cn/item/652102e3c458853aef2f75d2/SPI_Mode2.png)

①由于SCK一旦开始变化，就要移入数据(数据采样)了，所以此时趁SCK还没有变化，要在SS下降沿时，就要立刻触发移出数据，相当于把SS的下降沿也当入了时钟的一部分

②如果只是交换一个字节，那么在第8个时钟的上升沿，就不会再移出数据，如果继续交换字节，就正好是第8个时钟的上升沿，移出下一个字节的B7

##### 模式3

> * 交换一个字节（模式3）
> * CPOL=1：空闲状态时，SCK为高电平
> * CPHA=1：SCK第一个边沿移出数据，第二个边沿移入数据(数据采样)

![SPI_Mode3](https://pic.imgdb.cn/item/652102e5c458853aef2f7a8b/SPI_Mode3.png)

#### SPI的数据帧格式

SPI一般使用 **指令码加读写数据** 的模式

* SPI第一个和从机交换的数据 叫做 指令码 -- 从机会有一个关于指令的指令集手册
* 有的指令 只需要一个字节 就可以完成了 比如W25Q64的写使能/写失能
* 有的指令 不仅需要一个命令 后面还要再跟读写的数据 比如W25Q64的写数据/读数据

## SPI应用之W25Q64

### W25Q64的介绍

> * W25Qxx系列是一种低成本、小型化、使用简单的非易失性存储器，常应用于数据存储、字库存储、固件程序存储等场景
>
> * 存储介质：Nor Flash（闪存）
>
> * 时钟频率：**80MHz** / 160MHz (Dual SPI) / 320MHz (Quad SPI)
>
> * 存储容量（24位地址）：
>
> > W25Q40：  4Mbit / 512KByte
> >
> > W25Q80：  8Mbit / 1MByte
> >
> > W25Q16：  16Mbit / 2MByte
> >
> > W25Q32：  32Mbit / 4MByte
> >
> > W25Q64：  64Mbit / 8MByte
> >
> > W25Q128： 128Mbit / 16MByte
> >
> > W25Q256： 256Mbit / 32MByte -- 分为3字节地址模式 (只能写前16MB的数据)和 4字节地址模式(可以都到 -- 32MB数据)

 ==**24位地址的最大寻址空间是 16MB**== 

 $$ 2^{24} = 16,777,216 Byte   $$

 $$ 2^{24} \div 1024  = 16,777,216 \div 1024 =  16384KB $$

 $$ 2^{24} \div 1024 \div 1024  = 16,777,216 \div 1024 \div 1024=  16MB $$

### W25Q64的硬件电路图

![W25Q64_Struct](https://pic.imgdb.cn/item/652102e9c458853aef2f8276/W25Q64_Struct.png)

### W25Q64的结构框图

![W25Q64_OrignStruct](https://pic.imgdb.cn/item/652102fcc458853aef2fa14e/W25Q64_OrignStruct.png)

W25Q64 只有了8M 地址只用到了0X7FFFFF 将 -- 整个存储空间分为 **128块** ，*每一块* 再分为 **16个扇区**   *每一个扇区* 再分为 **16页**  *每一页* 再分为 **256个字节**也就是👇

> **储存空间**：8M = 8*1024 =8192KB -- 128块/2048扇区/32768页
>
> **块**：   16扇区  4096*16Byte =  65536Byte =64KB 
>
> **扇区**：16页      256*16 = 4096Byte = 4KB
>
> **页**：256字节

存储器以字节为单位，每个字节都有字节的单独地址

> 0x  7F      F       F        FF
>
> ​      块    扇区   页     字节

**页地址变化（以第一块内第一个扇区的页作为解释）:**

> 第一页: 00 00 00 --> 00 00 FF
>
> 第二页: 00 01 00 --> 00 01 FF
>
> 第三页: 00 02 00 --> 00 02 FF
>
> ···
>
> 第16页: 00 0F 00 --> 00 02 FF

**扇地址变化（以第一块内的扇区作为解释）:**

> 第一扇: 00 00 00 --> 00 0F FF
>
> 第二扇: 00 10 00 --> 00 1F FF
>
> 第三扇: 00 20 00 --> 00 2F FF
>
> ···
>
> 第16扇: 00 F0 00 --> 00 FF FF

**块内的地址变化规律:**

> 第一块 : 00 00 00 --> 00 FF FF
>
> 第二块 : 01 00 00 --> 01 FF FF
>
> ...
>
> 第127块：7F 00 00 --> 7F FF FF

==**Page/Byte Address Latch/Counter:**==

页地址/字节地址 都是有一个锁存器(Latch)的 地址指针，在读写之后可以自动加一,(计数器 Counter)，所以这就可以从指定地址开始 连续读写多个字节的目的了

==**256-Byte Page Buffer:**==

数据读写 都是依靠 那 **256字节缓冲区** 来 读写的 写入的数据会先放到缓存区里 然后在时序结束后，芯片再将缓存区的数据复制到对应的Flash里进行永久保存

由于Flash的写入，需要掉电不丢失，而高电压发生器需要对Flash留下“刻骨铭心”的现象，而SPI的写入和读取速度是非常快的，所以设计思路就是，写入的数据，先放到页缓存区里面存着，因为缓存区是RAM，速度是非常快的，可以跟上SPI的读写速度，由于这个缓冲区只有256字节，所以写入的时序有限制条件，也就是写入的一个时序，连续写入的数据量不能超过256字节,等你写完了，芯片再慢慢的把数据从缓存区转移到Flash存储器里，数据从缓存区转移到Flash里面，需要一定的时间，所以在写入时序结束后，芯片会进入一段忙的状态，此时会给状态寄存器的BUSY位置置1，表示芯片当前正在“搬砖”，正在忙状态

由于读取只是看一下电路的状态就行了，基本不花时间，所以读取的限制就很少，速度也非常快

### W25Q64的注意事项

> **写入操作时：**
>
> * 写入操作前，必须先进行**写使能**
> * **每个数据位只能由1改写为0，不能由0改写为1**
> * 写入数据前**必须先擦除**，擦除后，所有数据位变为1
> * 擦除必须按**最小擦除单元(扇)**进行
> * 连续写入多字节时，**最多写入一页的数据**，超过页尾位置的数据，会回到页首覆盖写入
> * 写入操作结束后，芯片进入忙状态，不响应新的读写操作
>
> **读取操作时：**
>
> * 直接调用读取时序，无需使能，无需额外操作，没有页的限制，读取操作结束后不会进入忙状态，但不能在忙状态时读取

## STM32之SPI外设

> * STM32内部集成了硬件SPI收发电路，可以由硬件自动执行时钟生成、数据收发等功能，减轻CPU的负担
>
> * 可配置**8位**/16位数据帧、**高位先行**/低位先行
>
> * 时钟频率： fPCLK / (2, 4, 8, 16, 32, 64, 128, 256)
>
> * 支持多主机模型、主或从操作
>
> * 可精简为半双工/单工通信
>
> * 支持DMA
>
> * 兼容I2S协议
>
> * STM32F103C8T6 硬件SPI资源：SPI1、SPI2

**STM32的SPI框图:**

![SPI_Struct](https://pic.imgdb.cn/item/652102f1c458853aef2f9412/SPI_Struct.png)

LSBFIRST控制位: 置0:高位先行 置1:低位先行

MOSI和MISO的交叉部分: 在STM32做主机时不用，MOSI输出，MISO输入，当STM32做为从机时使用:MOSI相当于输入，MISO相当于输出，并且图中的交叉部分可能存在画错，交叉部分的箭头应该向下MISO应该

BR[2:0] : 可以控制波特率发生器的分频系数(2, 4, 8, 16, 32, 64, 128, 256)

**SPI的数据流:** 

* 第一个数据，写入到TDR，此时移位寄存器没有数据移位，TDR的数据会立刻转移到移位寄存器，开始移位，这个转入时刻，会置状态寄存器TXE为1，表示发送数据寄存器为空
* 紧跟着下一个数据，就可以提前写到TDR等着，一旦上一个数据发送完成，下一个数据就可以立刻跟进，实现不间断的连续传输，
* 对于移位数据寄存器，一旦有数据过来，就会自动产生时钟(SCK)，将数据移出去
* 在移出的过程中，MISO的数据也会移入，一旦数据移出完成，数据移入也就完成了
* 这时移入的数据就会整体的，从移位寄存器转入到接收数据缓冲区RDR，这个时刻会置状态寄存器的RXNE为1，表示接收寄存器非空
* 当检测到RXNE置1后，就要尽快的把数据从RDR读出来，在下一个数据到来之前，读出RDR，就可以实现连续接收

### 连续传输模式

此模式好处:传输更快，性能更高，缺点:不易理解，不易封装，操作起来复杂,流程比较混乱：写入0XF1，读出0XA1时，0XF2已经开始发送，读出0XA2时，0XF3已经发送。最后读出0XA3，相当于 发送0XF1,发送0XF2,接收0XA1，发送0XF3，接收0XA2,接收0XA3,读写并没有关联

![STM32SPI_Continuous](https://pic.imgdb.cn/item/652102f5c458853aef2f9888/STM32SPI_Continuous.png)

**BSY标志**:当有数据传输时，BSY置1；数据传输结束，BSY，置0

**上图时序解释:**

1. SS片选拉低(图中未画出)，开始时序，在刚开始时，TXE为1，发送数据寄存器为空，可以写入数据开始传输
2. **写:** 软件写入 0XF1 到 TDR ，同时时 TXE 由1变0，表示TDR有数据了，由于第一个数据 移位寄存器里面肯定没有数据，所以TDR的数据会瞬间转移到移位寄存器中，TXE置1，表示发送数据寄存器为空(上图的输出数据可能绘制的有些早了，应该在TXE的第一个上升沿才有第一个b0才合理一些，在TXE下降沿之前0XF1应该还没写入到TDR内感觉 或者 太快了?)
3. **写:** 在等待0XF1的输出波形时,TXE置1，发送数据寄存器是空的，为了在发送时下一个数据可以立马转移到移位寄存器中，所以软件此时应该将0XF2写入到TDR发送数据寄存器中，等待0XF1发送完成
4. **读：**SPI为同步全双工，所以在第一个字节发送完成时，第一个接收的数据也完成了，接收到的第一个数据时0XA1，保存在移位寄存器中，接收完成时从移位寄存器，立刻会整体转移到接收数据寄存器中，转入的同时，RXNE置1，表示接收数据寄存器非空，可以使用软件读取数据了，读取数据完成后由软件将RXNE置0
5. **写:** 在等待0XF2的输出波形时,TXE置1，发送数据寄存器是空的，为了在发送时下一个数据可以立马转移到移位寄存器中，所以软件此时应该将0XF3写入到TDR发送数据寄存器中，等待0XF2发送完成
6. **读：**在第二个数据读取到之后，RXNE重新置1，监测到RXNE=1时，就继续读出数据2 -- 0XA2,然后软件将RXNE置0
7. 如果只发送三个数据，TXE在硬件置1以后将不再拉低，当最后一个TXE置1后，还需要一段时间最后一个数据才会发送完成，当数据都发送完成，此时BSY标志位就会被硬件清除，此时表示SPI时序结束
8. **读：**在最后一个字节时序完全结束后，RXNE置1，0XA3才能读出来(注意：当一个字节的波形结束后，移位寄存器会将接收数据寄存器中的数据覆盖掉，所以我们要即使的将数据读出来，防止数据丢失)

PS:上图虽然说使用软件将TXE,RXNE清除，**但手册中写了:**

* 发送缓冲器空闲标志(TXE)  此标志为’1’时表明发送缓冲器为空，可以写下一个待发送的数据进入缓冲器中。

* 当写入SPI_DR 时，TXE标志被清除。 接收缓冲器非空(RXNE)  此标志为’1’时表明在接收缓冲器中包含有效的接收数据。读SPI数据寄存器可以清除此标志。

所以在程序上我们并不需要使用SPI_I2S_ClearFlag清除这两个标志位

### 非连续传输模式

此模式的好处:容易封装，好理解，大部分人使用的模式，缺点:造成一点点资源浪费，损失一些性能

![STM32SPI_NoContinuous](https://pic.imgdb.cn/item/652102f9c458853aef2f9d3f/STM32SPI_NoContinuous.png)

**上图时序解释:**

1. SS片选拉低(图中未画出)，开始时序，在刚开始时，TXE为1，发送数据寄存器为空，可以写入数据开始传输
2. **写:** 软件写入 0XF1 到 TDR ，同时时 TXE 由1变0，表示TDR有数据了，由于第一个数据 移位寄存器里面肯定没有数据，所以TDR的数据会瞬间转移到移位寄存器中，TXE置1，表示发送数据寄存器为空
3. **读:** TXE=1了，不着急把下一个数据写进去，而是等待第一个时序完成后，也就是BSY置0，没有数据在传输ing，这时接收的RXNE也置1，我们等待RXNE置1后，先把第一个数据读取出来，再将下一个0XF2写入到发送数据寄存器中
4. **写:** 软件写入 0XF2 到 TDR ，同时时 TXE 由1变0，表示TDR有数据了，由于我们是较晚写入且是在读取第一个字节结束后再写入，所以，移位寄存器里面还是没有数据，TDR的数据会瞬间转移到移位寄存器中，TXE置1，表示发送数据寄存器为空
5. **读:** TXE=1了，不着急把下一个数据写进去，而是等待上一个时序完成后，也就是BSY置0，没有数据在传输ing，这时接收的RXNE也置1，我们等待RXNE置1后，先把上一个数据读取出来，再将下一个0XF3写入到发送数据寄存器中
6. **写:** 软件写入 0XF3 到 TDR ，同时时 TXE 由1变0，表示TDR有数据了，由于我们是较晚写入且是在读取上一个字节结束后再写入，所以，移位寄存器里面还是没有数据，TDR的数据会瞬间转移到移位寄存器中，TXE置1，表示发送数据寄存器为空
7. **读:** TXE=1了，此时后续没有数据写入，我们秩序等待RXNE=1，将数据读取出来即可结束

## SPI实战演习

### 软件读写SPI之W25Q64

`SPI.h`

```c
#ifndef  __SPI_H__//如果没有定义了则参加以下编译
#define  __SPI_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"  

void MYSPI_W_SS(uint8_t BitValue);//片选
void MYSPI_W_SCK(uint8_t BitValue);//时钟 -- 产生 上升沿/下降沿
void MYSPI_W_MOSI(uint8_t BitValue);//主机输出+从机输入 -- 数据发送
uint8_t MYSPI_R_MISO(void);//主机输入+从机输出 -- 数据接收
void MYSPI_Init(void);
void MYSPI_Start(void);// 片选 -- 起始
void MYSPI_Stop(void);//片选 -- 结束
uint8_t MYSPI_SwapByte(uint8_t ByteSend);//软件模拟 -- 主从交换数据
#endif  //结束编译
```

`SPI.c`

```c
#include "SPI.h"

/*
 *DI  -- MOSI --> PA7
 *DO  -- MISO --> PA6
 *CLK -- SCK  --> PA5
 *CS  -- SS   --> PA4
*/



void MYSPI_W_SS(uint8_t BitValue)//片选  起始/结束
{
  GPIO_WriteBit(GPIOA,GPIO_Pin_4,(BitAction)BitValue);
  
}

void MYSPI_W_SCK(uint8_t BitValue)//时钟 -- 产生 上升沿/下降沿
{
  GPIO_WriteBit(GPIOA,GPIO_Pin_5,(BitAction)BitValue);
  
}
void MYSPI_W_MOSI(uint8_t BitValue)//主机输出+从机输入 -- 数据发送
{
  GPIO_WriteBit(GPIOA,GPIO_Pin_7,(BitAction)BitValue);
  
}
uint8_t MYSPI_R_MISO(void)//主机输入+从机输出 -- 数据接收
{
  return GPIO_ReadInputDataBit(GPIOA,GPIO_Pin_6);
  
}

void MYSPI_Init(void)
{
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);//使能时钟B
  
  //为初始化函数做准备
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_4|GPIO_Pin_5|GPIO_Pin_7;//设置PA的4,5,7引脚
  
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP ;//设置输出模式为推挽输出
  
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  //初始化函数↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6;//设置PA的6引脚
  
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;//设置上拉输入
  
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  //初始化函数↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  
  MYSPI_W_SS(1);//默认不选择从机
  MYSPI_W_SCK(0);// 使用模式0
  
}

void MYSPI_Start(void)// 片选 -- 起始
{
  MYSPI_W_SS(0);
}

void MYSPI_Stop(void)//片选 -- 结束
{
  MYSPI_W_SS(1);
}

uint8_t MYSPI_SwapByte(uint8_t ByteSend)//软件模拟 -- 主从交换数据
{
  uint8_t i,ByteReceive = 0x00;
  
  	for (i = 0; i < 8; i ++)
    {
      MYSPI_W_MOSI(ByteSend & (0x80 >> i));//准备数据 -- 高位优先发送 -- 移位机制 --也叫掩码 -- 屏蔽掉其他无关作用的数据

      MYSPI_W_SCK(1);//时钟线 上升沿 主+从 读取(接收) 数据

      if(MYSPI_R_MISO() == 1)//如果 主机读取到消息 且 读取到的电平是高电平1
      {
        ByteReceive |= (0x80 >> i); //0X00 | (0X80 >> i) 那一位是高电平那一位就会被置1
      }
      MYSPI_W_SCK(0);//时钟线 下降沿 主+从 放置(准备) 数据 
    }
  
  return ByteReceive;
  
}


//uint8_t MYSPI_SwapByte2(uint8_t ByteSend)//软件模拟 -- 主从交换数据 好处更加像是移位寄存器 效率高 坏处 破坏传递的参数ByteSend
//{
//  uint8_t i;
//  
//  for (i = 0; i < 8; i ++)
//{
//  MYSPI_W_MOSI(ByteSend & 0x80);//准备数据 -- 高位优先发送
//  
//  ByteSend <<= 1;//移位机制 移除最高位 低位补零             <-- 这是核心
//  
//  MYSPI_W_SCK(1);//时钟线 上升沿 主+从 读取(接收) 数据
//  
//  if(MYSPI_R_MISO() == 1)//如果 主机读取到消息 且 读取到的电平是高电平1
//  {
//     ByteSend |= 0X01; // 或上 最低位 
//  }
//  MYSPI_W_SCK(0);//时钟线 下降沿 主+从 放置(准备) 数据 
//}
//  
//  return ByteSend;
//  
//}
```

`W25Q64Order.h`

```c
#ifndef  __W25Q64Order_H__//如果没有定义了则参加以下编译
#define  __W25Q64Order_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#define W25Q64_WRITE_ENABLE                         0x06
#define W25Q64_WRITE_DISABLE                        0x04
#define W25Q64_READ_STATUS_REGISTER_1               0x05
#define W25Q64_READ_STATUS_REGISTER_2               0x35
#define W25Q64_WRITE_STATUS_REGISTER                0x01
#define W25Q64_PAGE_PROGRAM                         0x02
#define W25Q64_QUAD_PAGE_PROGRAM                    0x32
#define W25Q64_BLOCK_ERASE_64KB                     0xD8
#define W25Q64_BLOCK_ERASE_32KB                     0x52
#define W25Q64_SECTOR_ERASE_4KB                     0x20
#define W25Q64_CHIP_ERASE                           0xC7
#define W25Q64_ERASE_SUSPEND                        0x75
#define W25Q64_ERASE_RESUME                         0x7A
#define W25Q64_POWER_DOWN                           0xB9
#define W25Q64_HIGH_PERFORMANCE_MODE                0xA3
#define W25Q64_CONTINUOUS_READ_MODE_RESET           0xFF
#define W25Q64_RELEASE_POWER_DOWN_HPM_DEVICE_ID     0xAB
#define W25Q64_MANUFACTURER_DEVICE_ID               0x90
#define W25Q64_READ_UNIQUE_ID                       0x4B
#define W25Q64_JEDEC_ID                             0x9F
#define W25Q64_READ_DATA                            0x03
#define W25Q64_FAST_READ                            0x0B
#define W25Q64_FAST_READ_DUAL_OUTPUT                0x3B
#define W25Q64_FAST_READ_DUAL_IO                    0xBB
#define W25Q64_FAST_READ_QUAD_OUTPUT                0x6B
#define W25Q64_FAST_READ_QUAD_IO                    0xEB
#define W25Q64_OCTAL_WORD_READ_QUAD_IO              0xE3

#define W25Q64_DUMMY_BYTE                           0xFF

#endif  //结束编译
```

`W25Q64.h`

```c
#ifndef  __W25Q64_H__//如果没有定义了则参加以下编译
#define  __W25Q64_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"  

void W25Q64_Init(void);
void W25Q64_ReadID(uint8_t *MID, uint16_t *DID);
void W25Q64_WriteEnable(void);
void W25Q64_WaitBusy(void);
void W25Q64_PageProgram(uint32_t Address, uint8_t *DataArray, uint16_t Count);
void W25Q64_SectorErase(uint32_t Address);
void W25Q64_ReadData(uint32_t Address, uint8_t *DataArray, uint32_t Count);
#endif  //结束编译
```

`W25Q64.c`

```c
#include "SPI.h"
#include "W25Q64.h"
#include "W25Q64Order.h"


void W25Q64_Init(void)
{
  MYSPI_Init();
}
/**
  * @brief  W25Q64_ReadID -- 读取芯片ID
  * @param  
  * @retval 
  */
void W25Q64_ReadID(uint8_t *MID, uint16_t *DID)//因为需要返回两个数值，如果你直接返回只能返回一个，所以参数指针，来返回多个值 <-- 定义两个参数 取地址
{
  MYSPI_Start();//片选 -- 起始
  MYSPI_SwapByte(W25Q64_JEDEC_ID);//发送0X9F指令 -- 读取芯片ID -- 可查芯片手册
  *MID = MYSPI_SwapByte(W25Q64_DUMMY_BYTE);//读取厂商ID  -- 置换给从机的 数据 给他一个dummy就可以了
  *DID = MYSPI_SwapByte(W25Q64_DUMMY_BYTE);//读取存储类型
  *DID <<= 8;
  *DID |= MYSPI_SwapByte(W25Q64_DUMMY_BYTE);//读取存储容量
  MYSPI_Stop();//片选 -- 结束
}
/**
  * @brief  W25Q64_WriteEnable -- 写使能函数
  * @param  
  * @retval 
  */
void W25Q64_WriteEnable(void)
{
  MYSPI_Start();//片选 -- 起始
  MYSPI_SwapByte(W25Q64_WRITE_ENABLE);
  MYSPI_Stop();//片选 -- 结束
}

/**
  * @brief  W25Q64_WaitBusy -- 检测芯片是否在忙的状态
  * @param  无
  * @retval 无
  */
void W25Q64_WaitBusy(void)
{
  uint32_t Timeout;//为了防止一直等待死循环 系统卡死 设置的参数
  MYSPI_Start();//片选 -- 起始
  
  MYSPI_SwapByte(W25Q64_READ_STATUS_REGISTER_1);//读取 寄存器1的指令 0x05 判断最后一位是否 在忙
  
  Timeout = 100000;//至于这个值写多少合适 要自己研究 弹幕-->1200
  while ((MYSPI_SwapByte(W25Q64_DUMMY_BYTE) & 0x01) == 0x01) //判断W25Q64是否在忙 --> 读寄存器1 最低位
  {
    Timeout --;
    if (Timeout == 0)
    {
      break;//这里可以返回个东西 来通知 W25Q64卡死了 
    }
  }
  MYSPI_Stop();//片选 -- 结束
}
/**
  * @brief  W25Q64_PageProgram -- 页写入数据
  * @param  Address -- 页地址 -- C语言无24位类型 so 32
  * @param  DataArray -- 传入的数据数组
  * @param  uint16_t Count -- 最大传入256个字节数据 -- 所以 uint8_t -- 255 就不行了  
  * @retval 
  */
void W25Q64_PageProgram(uint32_t Address, uint8_t *DataArray, uint16_t Count)
{
  uint16_t i;

  /*
   * 等待芯片不忙 -- 这个写在函数前面 和 后面 有不同的效果 
   * 写在前面 --> 在等待的事件 可做别的事情 效率高
   * 写在后面 --> 调用读数据肯定不用担心 芯片还在忙 读数据函数内可不写W25Q64_WaitBusy()函数
  */
  W25Q64_WaitBusy();//等待芯片不忙
  
  W25Q64_WriteEnable();//写使能 -- 这个根据芯片要求 在每次写入数据前都要进行写使能操作

  MYSPI_Start();//片选 -- 起始
  
  MYSPI_SwapByte(W25Q64_PAGE_PROGRAM);//发送页写入指令 0x02 
  
  /*  
   * Address我们使用的是24位 0X00123456 数据向右偏移16位 0X00000012 
   * 由于我们MYSPI_SwapByte(uint8_t ByteSend); 所以只会发送 12  --> 块
   * 同理Address >> 8  -- 0X00123456 -->  0X00001234  --> 所以只会发送 3(扇)4(页)
   * 同理Address -- 0X00123456   --> 所以只会发送 56 --> 字节
   * 这样 地址就发送过去了 
  */
  MYSPI_SwapByte(Address >> 16);
  MYSPI_SwapByte(Address >> 8);
  MYSPI_SwapByte(Address);
  
  for (i = 0; i < Count; i ++)
  {
    MYSPI_SwapByte(DataArray[i]);//发送的数据 -- 每次一个字节
  }
  
  MYSPI_Stop();//片选 -- 结束


}
/**
  * @brief  W25Q64_SectorErase -- 扇区擦除
  * @param  Address -- > 只要给 0X00 0 000 确定了块 扇 那么 从起始地址000~到最终地址FFF 都是删除那个扇区 所以我们一般给起始地址 000  
  * @retval 无
  */
void W25Q64_SectorErase(uint32_t Address)
{
  W25Q64_WaitBusy();//等待芯片不忙
  
  W25Q64_WriteEnable();//写使能 -- 这个根据芯片要求 在每次写入数据前都要进行写使能操作

  MYSPI_Start();//片选 -- 起始
  
  MYSPI_SwapByte(W25Q64_SECTOR_ERASE_4KB);//扇区擦除函数指令  0x20
  
  MYSPI_SwapByte(Address >> 16);
  MYSPI_SwapByte(Address >> 8);
  MYSPI_SwapByte(Address);
  
  MYSPI_Stop();//片选 -- 结束


}
/**
  * @brief  W25Q64_ReadData 读取数据
  * @param  Address -- 从哪里开始读取
  * @param  DataArray -- 读取的数据存放的数组
  * @param  Count -- 一次都多少个  读取无限制 可读完整个FLASH
  * @retval 无
  */
void W25Q64_ReadData(uint32_t Address, uint8_t *DataArray, uint32_t Count)
{
  uint32_t i;
  W25Q64_WaitBusy();//等待芯片不忙
  
  MYSPI_Start();//片选 -- 起始
  
  MYSPI_SwapByte(W25Q64_READ_DATA);// 读数据指令  0x03
  
  MYSPI_SwapByte(Address >> 16);
  MYSPI_SwapByte(Address >> 8);
  MYSPI_SwapByte(Address);
  
  for (i = 0; i < Count; i ++)
  {
    DataArray[i] = MYSPI_SwapByte(W25Q64_DUMMY_BYTE);//接收的数据 -- 每次一个字节
  }
  
  MYSPI_Stop();//片选 -- 结束
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "Timer.h"
#include "Server.h"
#include "Key.h"
#include "Motor.h"
#include "W25Q64.h"

uint8_t MID;
uint16_t DID;

uint8_t ArrayWrite[] = {0x01, 0x02, 0x03, 0x04};
uint8_t ArrayRead[4];

int main(void)
{
  OLED_Init();
  W25Q64_Init();

  OLED_ShowString(1, 1, "MID:   DID:");
  OLED_ShowString(2, 1, "W:");
  OLED_ShowString(3, 1, "R:");
  
  W25Q64_ReadID(&MID,&DID);
  OLED_ShowHexNum(1, 5, MID, 2);
  OLED_ShowHexNum(1, 12, DID, 4);
  
  W25Q64_SectorErase(0x000000);
  
  W25Q64_PageProgram(0x000000, ArrayWrite, 4);

  W25Q64_ReadData(0x000000, ArrayRead, 4);
  
  //  W25Q64_ReadData(0x0000FF, ArrayRead, 1); //这是为了验证 页在最后一个字节写入4个 是继续下一个页 还是回到了最开始
//  W25Q64_ReadData(0x000000, ArrayRead+1, 3);
  
  OLED_ShowHexNum(2, 3, ArrayWrite[0], 2);
  OLED_ShowHexNum(2, 6, ArrayWrite[1], 2);
  OLED_ShowHexNum(2, 9, ArrayWrite[2], 2);
  OLED_ShowHexNum(2, 12, ArrayWrite[3], 2);

  OLED_ShowHexNum(3, 3, ArrayRead[0], 2);
  OLED_ShowHexNum(3, 6, ArrayRead[1], 2);
  OLED_ShowHexNum(3, 9, ArrayRead[2], 2);
  OLED_ShowHexNum(3, 12, ArrayRead[3], 2);
  
  while(1)
  {

  }
}
```



### 硬件读写SPI之W25Q64

硬件读写 只有`SPI.c`改动` W25Q64.c`和`main.c`都未改动,和软件读写的一致

`SPI.h`

```c
#ifndef  __SPI_H__//如果没有定义了则参加以下编译
#define  __SPI_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"  

void MYSPI_W_SS(uint8_t BitValue);//片选
void MYSPI_Init(void);
void MYSPI_Start(void);// 片选 -- 起始
void MYSPI_Stop(void);//片选 -- 结束
uint8_t MYSPI_SwapByte(uint8_t ByteSend);//软件模拟 -- 主从交换数据
#endif  //结束编译
```

`SPI.c`

```c
#include "SPI.h"

/*
 *DI  -- MOSI --> PA7
 *DO  -- MISO --> PA6
 *CLK -- SCK  --> PA5
 *CS  -- SS   --> PA4
*/

void MYSPI_W_SS(uint8_t BitValue)//片选  起始/结束
{
  GPIO_WriteBit(GPIOA,GPIO_Pin_4,(BitAction)BitValue);
  
}

void MYSPI_Init(void)//SPI初始化
{
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA|RCC_APB2Periph_SPI1, ENABLE);//使能时钟B和SPI1时钟

  //为初始化函数做准备
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_4;//设置PA的4引脚 片选引脚
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP ;//设置输出模式为推挽输出
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  //初始化函数↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_5 | GPIO_Pin_7;//设置PA的5，7引脚 SCK,MOSI
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;//设置输出模式为复用推挽输出
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
  GPIO_Init(GPIOA, &GPIO_InitStructure);

  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6;//设置PA的6引脚 MISO
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU;//设置为上拉输入模式
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
  GPIO_Init(GPIOA, &GPIO_InitStructure);
  
  SPI_InitTypeDef SPI_InitStructure;
  SPI_InitStructure.SPI_Mode = SPI_Mode_Master;//设置模式为为主机
  SPI_InitStructure.SPI_Direction = SPI_Direction_2Lines_FullDuplex;//双线全双工模式
  SPI_InitStructure.SPI_DataSize = SPI_DataSize_8b;//8位数据帧
  SPI_InitStructure.SPI_FirstBit = SPI_FirstBit_MSB;//高位先行
  SPI_InitStructure.SPI_BaudRatePrescaler = SPI_BaudRatePrescaler_128;//设置SCK的频率--128分频
  SPI_InitStructure.SPI_CPOL = SPI_CPOL_Low;//时钟极性 -- 模式0
  SPI_InitStructure.SPI_CPHA = SPI_CPHA_1Edge;//时钟相位 -- 模式0
  SPI_InitStructure.SPI_NSS = SPI_NSS_Soft;//选择主机的 此代码使用的是GPIO模拟SS-- 不管
  SPI_InitStructure.SPI_CRCPolynomial = 7;//CRC校验位 -- 此代码不用so不管
  SPI_Init(SPI1, &SPI_InitStructure);

  SPI_Cmd(SPI1, ENABLE);//使能SPI1 
  
  MYSPI_W_SS(1);
}

void MYSPI_Start(void)// 片选 -- 起始
{
  MYSPI_W_SS(0);
}

void MYSPI_Stop(void)//片选 -- 结束
{
  MYSPI_W_SS(1);
}

uint8_t MYSPI_SwapByte(uint8_t ByteSend)//硬件配置 --非连续传输-- 主从交换数据
{
  while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) != SET);//等待发送数据数据寄存器为空==标志位TXE为1

  SPI_I2S_SendData(SPI1, ByteSend);//发送数据 -- 数据写到TDR 然后 数据会自动转入移位寄存器中
  //一旦移位寄存器有数据了 时序波形就会自动产生 应该是根据我们上方配置的SPI_Init结构体中的模式0
  //和SCK时钟频率 就自动化的进行 无需我们再调用其它函数
  
  //然后死等 一个字节时序结束 然后读取从机发送过来的字节 
  while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) != SET);//当移位寄存器中接收完成 会自动转入RDR 同时会置RXNE=1

  return SPI_I2S_ReceiveData(SPI1);//接收数据  
  
}
```

## SPI的库函数

**Table 1. SPI** 库函数 

| 函数名                        | 描述                                                    |
| ----------------------------- | ------------------------------------------------------- |
| SPI_DeInit                    | 将外设  SPIx 寄存器重设为缺省值                         |
| **SPI_Init**                  | 根据  SPI_InitStruct 中指定的参数初始化外设 SPIx 寄存器 |
| SPI_StructInit                | 把 SPI_InitStruct 中的每一个参数按缺省值填入            |
| **SPI_Cmd**                   | 使能或者失能  SPI 外设                                  |
| SPI_ITConfig                  | 使能或者失能指定的  SPI 中断                            |
| SPI_DMACmd                    | 使能或者失能指定  SPI 的 DMA 请求                       |
| **SPI_I2S_SendData**          | 通过外设  SPIx 发送一个数据                             |
| **SPI_I2S_ReceiveData**       | 返回通过  SPIx 近接收的数据                             |
| SPI_DMALastTransferCmd        | 使下一次  DMA 传输为 后一次传输                         |
| SPI_NSSInternalSoftwareConfig | 为选定的  SPI 软件配置内部 NSS 管脚                     |
| SPI_SSOutputCmd               | 使能或者失能指定的  SPI SS 输出                         |
| SPI_DataSizeConfig            | 设置选定的  SPI 数据大小                                |
| SPI_TransmitCRC               | 发送  SPIx 的 CRC 值                                    |
| SPI_CalculateCRC              | 使能或者失能指定  SPI 的传输字 CRC 值计算               |
| SPI_GetCRC                    | 返回指定  SPI 的发送或者接受 CRC 寄存器值               |
| SPI_GetCRCPolynomial          | 返回指定  SPI 的 CRC 多项式寄存器值                     |
| SPI_BiDirectionalLineConfig   | 选择指定  SPI 在双向模式下的数据传输方向                |
| **SPI_I2S_GetFlagStatus**     | 检查指定的  SPI 标志位设置与否                          |
| **SPI_I2S_ClearFlag**         | 清除  SPIx 的待处理标志位                               |
| **SPI_I2S_GetITStatus**       | 检查指定的  SPI 中断发生与否                            |
| **SPI_I2S_ClearITPendingBit** | 清除  SPIx 的中断待处理位                               |

### 函数 SPI_Init 

**Table 2.** 函数 **SPI_Init** 

| 函数名     | SPI_Init                                                     |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void SPI_Init(SPI_TypeDef* SPIx,  SPI_InitTypeDef* SPI_InitStruct) |
| 功能描述   | 根据 SPI_InitStruct 中指定的参数初始化外设 SPIx 寄存器       |
| 输入参数 1 | SPIx：x 可以是 1 或者 2，来选择 SPI  外设                    |
| 输入参数 2 | SPI_InitStruct：指向结构 SPI_InitTypeDef  的指针，包含了外设 SPI 的配置信息参阅  Section：SPI_InitTypeDef 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**SPI_InitTypeDef structure** 

```c
//SPI_InitTypeDef 定义于文件“stm32f10x_spi.h”： 

typedef struct 
{ 
	u16 SPI_Direction;
    u16 SPI_Mode; 
    u16 SPI_DataSize; 
    u16 SPI_CPOL; 
    u16 SPI_CPHA;
    u16 SPI_NSS; 
    u16 SPI_BaudRatePrescaler; 
    u16 SPI_FirstBit; 
    u16 SPI_CRCPolynomial; 
} SPI_InitTypeDef;  
```

#### 参数 SPI_Direction 

SPI_Dirention 设置了 SPI 单向或者双向的数据模式。见 Table3. 查阅该参数可取的值。

**Table 3. SPI_Direction** 值 

| **SPI_Mode**                    | 描述                     |
| ------------------------------- | ------------------------ |
| SPI_Direction_2Lines_FullDuplex | SPI 设置为双线双向全双工 |
| SPI_Direction_2Lines_RxOnly     | SPI 设置为双线单向接收   |
| SPI_Direction_1Line_Rx          | SPI 设置为单线双向接收   |
| SPI_Direction_1Line_Tx          | SPI 设置为单线双向发送   |

#### 参数 SPI_Mode 

SPI_Mode 设置了 SPI 工作模式。见 Table 4. 查阅该参数可取的值。

**Table 4. SPI_Mode** 值 

| **SPI_Mode**    |              | 描述 |
| --------------- | ------------ | ---- |
| SPI_Mode_Master | 设置为主 SPI |      |
| SPI_Mode_Slave  | 设置为从 SPI |      |

#### 参数 SPI_DataSize 

SPI_DataSize 设置了 SPI 的数据大小。见 Table 5. 查阅该参数可取的值。

**Table 5. SPI_DataSize** 值 

| **SPI_DataSize** | 描述                     |
| ---------------- | ------------------------ |
| SPI_DataSize_16b | SPI 发送接收 16 位帧结构 |
| SPI_DataSize_8b  | SPI 发送接收 8 位帧结构  |

#### 参数 SPI_CPOL 

SPI_CPOL 选择了串行时钟的稳态。见 Table 6. 查阅该参数可取的值。 

**Table 6. SPI_ SPI_CPOL** 值 

| **SPI_CPOL**  |            | 描述 |
| ------------- | ---------- | ---- |
| SPI_CPOL_High | 时钟悬空高 |      |
| SPI_CPOL_Low  | 时钟悬空低 |      |

#### 参数 SPI_CPHA 

SPI_CPHA 设置了位捕获的时钟活动沿。见 Table 7. 查阅该参数可取的值。 

**Table 7. SPI_SPI_CPHA** 值 

| **SPI_CPHA**   | 描述                   |
| -------------- | ---------------------- |
| SPI_CPHA_2Edge | 数据捕获于第二个时钟沿 |
| SPI_CPHA_1Edge | 数据捕获于第一个时钟沿 |

#### 参数 SPI_NSS 

SPI_NSS 指定了 NSS 信号由硬件（NSS 管脚）还是软件（使用 SSI 位）管理。见 Table 416. 查阅该参数可取的值。 

**Table 8. SPI_NSS** 值 

| **SPI_NSS**  | 描述                        |
| ------------ | --------------------------- |
| SPI_NSS_Hard | NSS 由外部管脚管理          |
| SPI_NSS_Soft | 内部  NSS 信号有 SSI 位控制 |

#### 参数 SPI_BaudRatePrescaler 

SPI_BaudRatePrescaler 用来定义波特率预分频的值，这个值用以设置发送和接收的 SCK 时钟。见 Table 8. 查阅该参数可取的值。

**Table 8. SPI_BaudRatePrescaler** 值 

| **SPI_NSS**             | 描述                 |
| ----------------------- | -------------------- |
| SPI_BaudRatePrescaler2  | 波特率预分频值为  2  |
| SPI_BaudRatePrescaler4  | 波特率预分频值为  4  |
| SPI_BaudRatePrescaler8  | 波特率预分频值为  8  |
| SPI_BaudRatePrescaler16 | 波特率预分频值为  16 |
| SPI_BaudRatePrescaler32 | 波特率预分频值为  32 |
| SPI_BaudRatePrescaler64 | 波特率预分频值为  64 |

注意：通讯时钟由主 SPI 的时钟分频而得，不需要设置从 SPI 的时钟。 

#### 参数 SPI_FirstBit 

SPI_FirstBit 指定了数据传输从 MSB 位还是 LSB 位开始。见 Table 9. 查阅该参数可取的值。 

**Table 9. SPI_FirstBit** 值 

| **SPI_FirstBit** | 描述                   |
| ---------------- | ---------------------- |
| SPI_FisrtBit_MSB | 数据传输从  MSB 位开始 |
| SPI_FisrtBit_LSB | 数据传输从  LSB 位开始 |

#### 参数 SPI_CRCPolynomial 

SPI_CRCPolynomial 定义了用于 CRC 值计算的多项式。

例： 

```c
/* Initialize the SPI1 according to the SPI_InitStructure members */ 

SPI_InitTypeDef SPI_InitStructure; 
SPI_InitStructure.SPI_Direction = SPI_Direction_2Lines_FullDuplex; 
SPI_InitStructure.SPI_Mode = SPI_Mode_Master; 
SPI_InitStructure.SPI_DatSize = SPI_DatSize_16b;
SPI_InitStructure.SPI_CPOL = SPI_CPOL_Low; 
SPI_InitStructure.SPI_CPHA = SPI_CPHA_2Edge; 
SPI_InitStructure.SPI_NSS = SPI_NSS_Soft; 
SPI_InitStructure.SPI_BaudRatePrescaler = SPI_BaudRatePrescaler_128; 
SPI_InitStructure.SPI_FirstBit = SPI_FirstBit_MSB; 
SPI_InitStructure.SPI_CRCPolynomial = 7; SPI_Init(SPI1,&SPI_InitStructure);
```

### 函数 SPI_Cmd 

**Table 10.** 函数 **SPI_ Cmd** 

| 函数名     | SPI_ Cmd                                                     |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void SPI_Cmd(SPI_TypeDef* SPIx,  FunctionalState NewState)   |
| 功能描述   | 使能或者失能  SPI 外设                                       |
| 输入参数 1 | SPIx：x 可以是 1 或者 2，来选择 SPI  外设                    |
| 输入参数 2 | NewState: 外设 SPIx 的新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

例： 

```c
/* Enable SPI1 */ 

SPI_Cmd(SPI1, ENABLE); 
```

### 函数 SPI_I2S_SendData 

**Table 11.** 函数 **SPI_ SendData** 

| 函数名     | SPI_I2S_SendData                                        |
| ---------- | ------------------------------------------------------- |
| 函数原形   | void SPI_I2S_SendData(SPI_TypeDef* SPIx, uint16_t Data) |
| 功能描述   | 通过外设 SPIx 发送一个数据                              |
| 输入参数 1 | SPIx：x 可以是 1 或者 2，来选择 SPI  外设               |
| 输入参数 2 | Data: 待发送的数据                                      |
| 输出参数   | 无                                                      |
| 返回值     | 无                                                      |
| 先决条件   | 无                                                      |
| 被调用函数 | 无                                                      |

例： 

```c
/* Send 0xA5 through the SPI1 peripheral */ 

SPI_I2S_SendData(SPI1, 0xA5); 
```

### 函数 SPI_I2S_ReceiveData

**Table 12.** 函数 **SPI_ReceiveData** 

| 函数名     | SPI_I2S_ReceiveData                             |
| ---------- | ----------------------------------------------- |
| 函数原形   | uint16_t SPI_I2S_ReceiveData(SPI_TypeDef* SPIx) |
| 功能描述   | 返回通过  SPIx 近接收的数据                     |
| 输入参数   | SPIx：x 可以是 1 或者 2，来选择 SPI  外设       |
| 输出参数   | 无                                              |
| 返回值     | 接收到的字                                      |
| 先决条件   | 无                                              |
| 被调用函数 | 无                                              |

例： 

```c
/* Read the most recent data received by the SPI2 peripheral */ u16 ReceivedData; 

ReceivedData = SPI_I2S_ReceiveData(SPI2); 
```

### 函数 SPI_I2S_GetFlagStatus 

**Table 13.** 函数 **SPI_ GetFlagStatus** 

| 函数名     | SPI_ GetFlagStatus                                           |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | FlagStatus SPI_GetFlagStatus(SPI_TypeDef*  SPIx, u16 SPI_FLAG) |
| 功能描述   | 检查指定的 SPI 标志位设置与否                                |
| 输入参数 1 | SPIx：x 可以是 1 或者 2，来选择 SPI  外设                    |
| 输入参数 2 | SPI_FLAG：待检查的 SPI 标志位   参阅  Section：SPI_FLAG 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | SPI_FLAG 的新状态（SET 或者 RESET）                          |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**SPI_FLAG** 

Table 14. 给出了所有可以被函数SPI_ GetFlagStatus检查的标志位列表 

**Table 14. SPI_FLAG** 值 

| **SPI_FLAG**    | 描述               |
| --------------- | ------------------ |
| SPI_FLAG_BSY    | 忙标志位           |
| SPI_FLAG_OVR    | 超出标志位         |
| SPI_FLAG_MODF   | 模式错位标志位     |
| SPI_FLAG_CRCERR | CRC 错误标志位     |
| SPI_FLAG_TXE    | 发送缓存空标志位   |
| SPI_FLAG_RXNE   | 接受缓存非空标志位 |

例： 



### 函数 SPI_I2S_ClearFlag 

**Table 15.** 函数 **SPI_ ClearFlag** 

| 函数名     | SPI_ ClearFlag                                               |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void SPI_ClearFlag(SPI_TypeDef* SPIx, u16  SPI_FLAG)         |
| 功能描述   | 清除 SPIx 的待处理标志位                                     |
| 输入参数 1 | SPIx：x 可以是 1 或者 2，来选择 SPI  外设                    |
| 输入参数 2 | SPI_FLAG：待清除的 SPI 标志位参阅 Section：SPI_FLAG  查阅更多该参数允许取值范围注意：标志位  BSY,  TXE 和 RXNE 由硬件重置 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

例： 

```c
/* Clear the SPI2 Overrun pending bit */

SPI_I2S_ClearFlag(SPI2, SPI_FLAG_OVR); 

```

### 函数 SPI_I2S_GetITStatus 

**Table 16.** 函数 **SPI_ GetITStatus** 

| 函数名     | SPI_ GetITStatus                                             |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | ITStatus SPI_GetITStatus(SPI_TypeDef*  SPIx, u8 SPI_IT)      |
| 功能描述   | 检查指定的 SPI 中断发生与否                                  |
| 输入参数 1 | SPIx：x 可以是 1 或者 2，来选择 SPI  外设                    |
| 输入参数 2 | SPI_IT：待检查的 SPI 中断源   参阅  Section：SPI_IT 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | SPI_IT 的新状态                                              |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**SPI_IT** 

Table 17. 给出了所有可以被函数SPI_ GetITStatus检查的中断标志位列表 

**Table 17. SPI_IT** 值 

| **SPI_IT**    | 描述                   |
| ------------- | ---------------------- |
| SPI_IT_OVR    | 超出中断标志位         |
| SPI_IT_MODF   | 模式错误标志位         |
| SPI_IT_CRCERR | CRC 错误标志位         |
| SPI_IT_TXE    | 发送缓存空中断标志位   |
| SPI_IT_RXNE   | 接受缓存非空中断标志位 |

例： 

```c
/* Test if the SPI1 Overrun interrupt has occurred or not */ 

ITStatus Status; 

Status = SPI_I2S_GetITStatus(SPI1, SPI_IT_OVR); 
```

### 函数 SPI_I2S_ClearITPendingBit 

**Table 18.** 函数 **SPI_ ClearITPendingBit** 

| 函数名     | SPI_ ClearITPendingBit                                       |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void SPI_ClearITPendingBit(SPI_TypeDef*  SPIx, u8 SPI_IT)    |
| 功能描述   | 清除 SPIx 的中断待处理位                                     |
| 输入参数 1 | SPIx：x 可以是 1 或者 2，来选择 SPI  外设                    |
| 输入参数 2 | SPI_IT：待检查的 SPI 中断源   参阅 Section：SPI_IT 查阅更多该参数允许取值范围注意：中断标志位 BSY,  TXE 和 RXNE 由硬件重置 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

例： 

```c
/* Clear the SPI2 CRC error interrupt pending bit */ 

SPI_I2S_ClearITPendingBit(SPI2, SPI_IT_CRCERR); 
```

