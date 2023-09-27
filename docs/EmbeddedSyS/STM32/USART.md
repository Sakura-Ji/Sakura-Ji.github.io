---
comments: true
---
# USART

## 通信是什么

* 通信的目的：将一个设备的数据传送到另一个设备，扩展硬件系统

* 通信协议：是两个（或多个）设备之间进行通信，必须要遵循的一种协议。通讯协议分为物理层和协议层。

  - 物理层：规定通讯系统中具有机械、电子功能部分的特性，确保原始数据在物理媒体的传输；
  - 协议层：规定通讯逻辑，统一收发双方的数据打包、解包标准。

* 通信的方式:

  ![commun](https://pic.imgdb.cn/item/6513cea1c458853aef34fab2/commun.png)

## USART介绍

**USART(通用同步异步收发器):**提供了一种灵活的方法与使用工业标准NRZ异步串行数据格式的外部设备之间进行全双工数据交换。

>  USART利用分数波特率发生器提供宽范围的波特率选择。 它支持同步单向通信和半双工单线通信，也支持LIN(局部互连网)，智能卡协议和IrDA(红外数据 组织)SIR ENDEC规范，以及调制解调器(CTS/RTS)操作。它还允许多处理器通信。 使用多缓冲器配置的DMA方式，可以实现高速数据通信。

![USART_HardWare](https://pic.imgdb.cn/item/6513cea0c458853aef34fa42/USART_HardWare.png)



### 同步通信

同步通信双方都要有时钟引脚，双方的时钟CLK引脚是连接在一起的，通信时由主机传送时钟信号，提供同步脉冲，双方根据这个时钟信号，来确定发送或接受每个位，确保数据传输的时候完全同步。

* 时钟同步
* 信息格式为信息帧(一次通信中传输的数据，可 不止8位)

具体信息将在SPI一节讲解

### 异步通信

我们使用USART实现异步通信，那么如何保证异步通信的可靠性

* 固定的数据帧
* 传输速度双方必须相同,波特率

对于发送设备和接收设备来说，两者的串行通信配置（波特率、单位字的位数、奇偶校验、起始位数与结束位、流量控制）应该设置为完全相同。通过在数据流中插入特定的比特序列，可以指示通信的开始与结束。当发送一个字节数据的时候，需要在比特流的开头加上起始位，并在比特流的末尾加上结束位。数据字节的最低位紧接在起始位之后。

### 电平标准

电平标准是数据1和数据0的表达方式，是传输线缆中人为规定的电压与数据的对应关系，串口常用的电平标准有如下三种：

* **TTL电平**：+3.3V或+5V表示1，0V表示0

* RS232电平：-3V ~ -15V表示1，+3 ~ +15V表示0

* RS485电平：两线压差+2 ~ +6V表示1，-2 ~ -6V表示0（差分信号）

### 串口的专业名词

* **波特率**：串口通信的速率,单位时间传输了多少个码元，0或1
  * 码元:数据传输过程中等时出现的符号
  * 单片机中，采用二进制码元，码元就是0或9600bps: 每秒传输9600个二进制位数 或 传输一个0或1需要1/9600s
  * **比特率**: 每秒传输了多少个二进制位数 0或1
  * **总结**:在单片机里，波特率和比特率代表的意义相同，但是其它领域，不一定相同。因为不果所有领域里面的码元都是二进制的0或1。

* **起始位（1位）**：标志一个数据帧的开始，**固定为低电平**，也就是 空闲状态下 为高电平 

* **数据位（8位）**：数据帧的有效载荷，1为高电平，0为低电平，**低位先行**

* **奇偶校验位（1位）**：用于数据验证，根据数据位计算得来 -- 可选 无校验位，奇校验，偶校验

* **停止位（1位）**：用于数据帧间隔，**固定为高电平**

## STM32中的USART外设

**USART的框图**

![USART_Struct](https://pic.imgdb.cn/item/6513ce7bc458853aef34e3f6/USART_Struct.png)

* 标志位TXE(TX Empty)，当其置1时，其实数据还未发送过去，但是此时我们可以写入下一个数据 原因是 : 只是从发送数据寄存器TDR转移到了 发送移位寄存中 其就会置1 在代码中 就是

```c
void  Usart_Tx(uint8_t data)//单字节 8位 发送
{
  while(USART_GetFlagStatus(USART1,USART_FLAG_TC)==0);//等待数据转移到发送移位寄存器中 直到TC == 1时 表示数据已经发送给移位寄存器了 可以写入新的数据了
  USART_SendData(USART1,data);
}
/**
  * @brief  Transmits single data through the USARTx peripheral.
  * @param  USARTx: Select the USART or the UART peripheral. 
  *   This parameter can be one of the following values:
  *   USART1, USART2, USART3, UART4 or UART5.
  * @param  Data: the data to transmit.
  * @retval None
  */
void USART_SendData(USART_TypeDef* USARTx, uint16_t Data)
{
  /* Check the parameters */
  assert_param(IS_USART_ALL_PERIPH(USARTx));
  assert_param(IS_USART_DATA(Data)); 
    
  /* Transmit Data */
  USARTx->DR = (Data & (uint16_t)0x01FF); //这里就是TDR
}
```

* TDR 和 RDR占用一个地址，但实际硬件中是两个寄存器 可对比51单片机中的 SUBF来理解
  *  SBUF: 串口数据缓存寄存器，物理上是两个独立的寄存器相同的地址。写操作时，写入的是发送寄存器，读操作时，读出的是接收寄存器 也就是 串口通信的发送和接收电路在物理上有 2 个名字相同的 SBUF 寄存器，它们的地址也都是 0x99，但是一个用来做发送缓冲，一个用来做接收缓冲。意思就是说，有 2 个房间，两个房间的门牌号是一样的，其中一个只出人不进人，另外一个只进人不出人，这样的话，我们就可以实现 UART 的全双工通信，相互之间不会产生干扰。但是在逻辑上呢，我们每次只操作 SBUF，单片机会自动根据对它执行的是“读”还是“写”操作来选择是接收 SBUF 还是发送 SBUF

* 发送移位寄存器是**向右移位数据**的 正好对应串口的低位先行
* 接收移位寄存器是先将接收的数据放在最高位，然后一位一位的向右移动，移位8次就可以得到1个字节
* 标志位RXNE(RX  Not Empty)，接收数据寄存器非空，当检测其置1时，我们就可以从 接收移位寄存器 把数据移到 接收数据寄存器RDR中 在程序上的体现就是

```c
uint8_t Usart_Rx(void)//接收 单字节 8位
{
  uint8_t data = 0;
  while( USART_GetFlagStatus(USART1, USART_FLAG_RXNE)==0){}//等待接收数据完成标志 直到RXNE == 1表示数据接收完成
  data = USART_ReceiveData(USART1);
  return data;
}
/**
  * @brief  Returns the most recent received data by the USARTx peripheral.
  * @param  USARTx: Select the USART or the UART peripheral. 
  *   This parameter can be one of the following values:
  *   USART1, USART2, USART3, UART4 or UART5.
  * @retval The received data.
  */
uint16_t USART_ReceiveData(USART_TypeDef* USARTx)
{
  /* Check the parameters */
  assert_param(IS_USART_ALL_PERIPH(USARTx));
  
  /* Receive Data */
  return (uint16_t)(USARTx->DR & (uint16_t)0x01FF);//这里其实是 RDR
}
```

* **数据帧**可以通过编程USART_CR1寄存器中的M位，选择成8或9位
* **可配置的停止位** 随每个字符发送的停止位的位数可以通过控制寄存器2的位13、12进行编程。 
  * 1个停止位：停止位位数的默认值。 
  * 2个停止位：可用于常规USART模式、单线模式以及调制解调器模式。
  * 0.5个停止位：在智能卡模式下接收数据时使用。 
  * 1.5个停止位：在智能卡模式下发送和接收数据时使用。

### 数据是如何稳定接收的

**起始位侦测** 

在USART中，如果辨认出一个特殊的采样序列，那么就认为侦测到一个起始位。 该序列为：1 1 1 0 X 0 X 0 X 0 0 0 0

下图就是 起始位侦测 和 采样位置对齐策略

![USART_Start](https://pic.imgdb.cn/item/6513ce75c458853aef34e35a/USART_Start.png)

关于接收器的设计最主要的一点是如何提高采样的准确率，最好是保证采样点处于被采样数据的时间中间点。所以，在接收采样时要用比数据波特率高n倍(n≥1)速率的时钟对数据进行采样

> * 如果该序列不完整，那么接收端将退出起始位侦测并回到空闲状态(不设置标志位)等待下降沿。 
>
> * 如果3个采样点都为’0’(在第3、5、7位的第一次采样，和在第8、9、10的第二次采样都为’0’)， 则确认收到起始位，这时设置RXNE标志位，如果RXNEIE=1，则产生中断。 
>
> * 如果两次3个采样点上仅有2个是’0’(第3、5、7位的采样点和第8、9、10位的采样点)，那么起始 位仍然是有效的，但是会设置NE噪声标志位。如果不能满足这个条件，则中止起始位的侦测过 程，接收器会回到空闲状态(不设置标志位)。
>
> *  如果有一次3个采样点上仅有2个是’0’(第3、5、7位的采样点或第8、9、10位的采样点)，那么起 始位仍然是有效的，但是会设置NE噪声标志位。

![USART_DataSamp](https://pic.imgdb.cn/item/6513ce75c458853aef34e2ef/USART_DataSamp.png)

### 波特率发生器

**发送器** 和 **接收器** 的波特率由波特率寄存器BRR里的分频系数DIV确定 -- 除以16是因为上方的采样数据时钟频率，所以在除以分频系数DIV后再除以16

计算公式： $$Tx / Rx波特率 = \cfrac { f_{PCLK2/1}}{16 * DIV}$$

![USART_BRR](https://pic.imgdb.cn/item/6513ce74c458853aef34e289/USART_BRR.png)



## USART实战演习

简单的串口发送和接收(串口助手向单片机发送 然后单片机通过printf再次打印到串口助手上)

`USART.H`

```c
#ifndef  __USART_H__//如果没有定义了则参加以下编译
#define  __USART_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"
#include "stdio.h"
#include <stdarg.h>

void Usart_Init(void);
void Usart1_SendByte(uint8_t Byte);
void Usart1_SendArray(uint8_t *Array,uint16_t Lenth);
void Usart1_SendString(char *string);
uint32_t Math_Pow(uint32_t X, uint32_t Y);
void Usart1_SendNumber(uint32_t Num,uint8_t Length);
void Serial_Printf(char *format, ...);

#endif  //结束编译
```

`USART.C`

```C
#include "usart.h"

/*
 *PA9  --  TX
 *PA10 --  RX
*/
void Usart_Init(void)
{
  //使能时钟
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);//使能时钟A和USART1
  
  //为初始化函数做准备
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;//设置PA9引脚
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP ;//设置输出模式为复用推挽输出
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  //初始化函数PIN9↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;//设置PA10引脚
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU ;//设置输出模式为上拉输入
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  //初始化函数PIN10↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  
  USART_InitTypeDef USART_InitStructure; //定义串口结构体
  USART_InitStructure.USART_BaudRate = 9600; //波特率
  USART_InitStructure.USART_WordLength = USART_WordLength_8b;//数字帧长度
  USART_InitStructure.USART_StopBits = USART_StopBits_1; //停止位
  USART_InitStructure.USART_Parity = USART_Parity_No; //不使用校验位 
  USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;//不使用硬件流控制
  USART_InitStructure.USART_Mode = USART_Mode_Tx|USART_Mode_Rx; //模式为发送+接收
  //初始化串口1
  USART_Init(USART1, &USART_InitStructure); 
  
  USART_ITConfig(USART1, USART_IT_RXNE, ENABLE);
  NVIC_InitTypeDef NVIC_InitStructure; //定义结构体
  NVIC_InitStructure.NVIC_IRQChannel = USART1_IRQn; //根据上面的我们所选取的USART1
  NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;//这里选择的是抢占 1
  NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1; //这里选择的是响应1
  NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE; //使能指定的中断通道
  //初始化函数↓
  NVIC_Init(&NVIC_InitStructure);
  //使能串口1
  USART_Cmd(USART1, ENABLE);
}
/**
  * @brief  串口1发送字节 -- 发送的最基本的函数 -->其它发送函数都是基于它
  * @param  
  * @retval 
  */
void Usart1_SendByte(uint8_t Byte)
{
  USART_SendData(USART1,Byte);
  /*
  *当TDR寄存器中的数据被硬件转移到移位寄存器的时候该位被硬件置位 也就是TXE = 1
  * 当又对USART_DR-TDR进行写操作时，该位将自动清零
  */
  while(USART_GetFlagStatus(USART1,USART_FLAG_TXE) == RESET );
}
/**
  * @brief  串口接收函数 -- 对于串口来说 有查询和中断两种方法进行接收数据判断  
            查询的方式是:在主函数中不断查询标志位的方式 -- 👇
            中断的方式: 和其它中断一样 当这个标志位发生了 再进入中断
  * @param  
  * @retval 
  */
uint8_t Usart1_RecvByte(void)
{
  uint8_t Data = 0;
  if(USART_GetFlagStatus(USART1, USART_FLAG_RXNE) == SET)//接收数据完成标志 RXNE == 1表示数据接收完成
  {
    Data = USART_ReceiveData(USART1);
  }
  return Data;
}
/**
  * @brief  串口中断函数
            当RDR移位寄存器中的数据被转移到USART_DR寄存器中，该位被硬件置位
            对USART_DR的读操作可以将该位清零 -- 也就是说当有单片机接收并读取了数据 这个就会自动清零 如果没读取需要手动清除
            中断函数里面可以放你想要实现的功能函数
  * @param  
  * @retval 
  */
void USART1_IRQHandler(void)
{
  uint8_t RxData = 0;
  if (USART_GetITStatus(USART1, USART_IT_RXNE) == SET)
  {
    RxData = USART_ReceiveData(USART1);
    printf("%X\r\n",RxData);
    USART_ClearITPendingBit(USART1, USART_IT_RXNE);
  }
}

/**
  * @brief  发送数组
  * @param  
  * @retval 
  */
void Usart1_SendArray(uint8_t *Array,uint16_t Length)
{
  for(uint8_t i = 0;i<Length;i++)
  {
    Usart1_SendByte(Array[i]);
  }
}
/**
  * @brief  发送字符串
  * @param  string 字符串
  * @retval 
  */
void Usart1_SendString(char *string)
{
  for(uint8_t i = 0;string[i] != '\0';i++)
  {
    Usart1_SendByte(string[i]);
  }
}
/**
  * @brief  发送十进制数字
  * @param  
  * @retval 
  */
void Usart1_SendNumber(uint32_t Num,uint8_t Length)//以文本模式查看发送的数字--发送的啥 就在串口助手上显示啥
{
  uint8_t i;
  for (i = 0; i < Length; i ++)
  {
    Usart1_SendByte(Num / Math_Pow(10, Length - i - 1) % 10 + '0');//10进制 转换成 十六进制 1. 取出这一位的数--NUM/10的Length方%10 2.加上ASCLL的值
  }
}
/**
  * @brief  数学公式X的Y次方
  * @param  
  * @retval X的Y次方
  */
uint32_t Math_Pow(uint32_t X, uint32_t Y)//返回的是X的Y次方
{
  uint32_t Result = 1;
  while (Y --)
  {
    Result *= X;
  }
  return Result;
}
/**
  * @brief  函数重定义--封装printf函数
  * @param  
  * @retval 
  */
int fputc(int ch, FILE *f)
{
  Usart1_SendByte(ch);
  return ch;
}

void Serial_Printf(char *format, ...)//可变参数 -- 封装
{
  char String[100];
  va_list arg;//创建名为 arg的列表
  va_start(arg, format);//从format开始
  vsprintf(String, format, arg);//sprintf 在这里 要写成 vsprintf
  va_end(arg);//释放名为arg的列表
  Usart1_SendString(String);
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "usart.h"

uint8_t Data ;

int main(void)
{
  NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
  OLED_Init();  
  Usart_Init();

  while(1)
  {
    
//    if(USART_GetFlagStatus(USART1, USART_FLAG_RXNE) == SET)//接收数据完成标志 RXNE == 1表示数据接收完成
//    {
//      Data = USART_ReceiveData(USART1);
//      OLED_ShowHexNum(1,1,Data,2);
//    }
    
  }
}
```

## USART 库函数

**Table 1. USART** 库函数 

| 函数名                           | 描述                                                        |
| -------------------------------- | ----------------------------------------------------------- |
| USART_DeInit                     | 将外设  USARTx 寄存器重设为缺省值                           |
| **USART_Init**                   | 根据 USART_InitStruct  中指定的参数初始化外设 USARTx 寄存器 |
| USART_StructInit                 | 把 USART_InitStruct 中的每一个参数按缺省值填入              |
| **USART_Cmd**                    | 使能或者失能  USART 外设                                    |
| **USART_ITConfig**               | 使能或者失能指定的  USART 中断                              |
| USART_DMACmd                     | 使能或者失能指定  USART 的 DMA 请求                         |
| USART_SetAddress                 | 设置  USART 节点的地址                                      |
| USART_WakeUpConfig               | 选择  USART 的唤醒方式                                      |
| USART_ReceiverWakeUpCmd          | 检查  USART 是否处于静默模式                                |
| USART_LINBreakDetectLengthConfig | 设置  USART LIN 中断检测长度                                |
| USART_LINCmd                     | 使能或者失能  USARTx 的 LIN 模式                            |
| **USART_SendData**               | 通过外设  USARTx 发送单个数据                               |
| **USART_ReceiveData**            | 返回  USARTx 近接收到的数据                                 |
| USART_SendBreak                  | 发送中断字                                                  |
| USART_SetGuardTime               | 设置指定的  USART 保护时间                                  |
| USART_SetPrescaler               | 设置  USART 时钟预分频                                      |
| USART_SmartCardCmd               | 使能或者失能指定  USART 的智能卡模式                        |
| USART_SmartCardNackCmd           | 使能或者失能  NACK 传输                                     |
| USART_HalfDuplexCmd              | 使能或者失能  USART 半双工模式                              |
| USART_IrDAConfig                 | 设置  USART IrDA 模式                                       |
| USART_IrDACmd                    | 使能或者失能  USART IrDA 模式                               |
| **USART_GetFlagStatus**          | 检查指定的  USART 标志位设置与否                            |
| **USART_ClearFlag**              | 清除  USARTx 的待处理标志位                                 |
| **USART_GetITStatus**            | 检查指定的  USART 中断发生与否                              |
| **USART_ClearITPendingBit**      | 清除  USARTx 的中断待处理位                                 |

### 函数 USART_Init 

**Table 2.** 函数 **USART_Init** 

| 函数名     | USART_Init                                                   |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void USART_Init(USART_TypeDef* USARTx,  USART_InitTypeDef* USART_InitStruct) |
| 功能描述   | 根据  USART_InitStruct 中指定的参数初始化外设 USARTx 寄存器  |
| 输入参数 1 | **USARTx**：x 可以是 1，2 或者 3，来选择 USART  外设         |
| 输入参数 2 | **USART_InitStruct**：指向结构 USART_InitTypeDef  的指针，包含了外设 USART 的配置信息。参阅 Section：USART_InitTypeDef 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

#### 结构体 USART_InitTypeDef structure 

```c title="USART_InitTypeDef structure"
//USART_InitTypeDef 定义于文件“stm32f10x_usart.h”： 

typedef struct 
{ 
    
	u32 USART_BaudRate; 
    u16 USART_WordLength; 
    u16 USART_StopBits;
    u16 USART_Parity;
    u16 USART_HardwareFlowControl;
    u16 USART_Mode;
    u16 USART_Clock; 
    u16 USART_CPOL;
    u16 USART_CPHA;
    u16 USART_LastBit; 
    
} USART_InitTypeDef; 
```

Table 3. 描述了结构 USART_InitTypeDef 在同步和异步模式下使用的不同成员。

**Table 708. USART_InitTypeDef** 成员 **USART** 模式对比 

| 成员                      | 异步模式 | 同步模式 |
| ------------------------- | -------- | --------|
| USART_BaudRate            | √        | √       |
| USART_WordLength          | √        | √       |
| USART_StopBits            | √        | √       |
| USART_Parity              | √        | √       |
| USART_HardwareFlowControl | √        | √       |
| USART_Mode                | √        | √       |
| USART_Clock               |    	   | √       |
| USART_CPOL                |          | √       |
| USART_CPHA                |          | √       |
| USART_LastBit             |          | √       |

#### 参数 USART_BaudRate 

该成员设置了 USART 传输的波特率，波特率可以由以下公式计算：

IntegerDivider = ((APBClock) / (16 * (USART_InitStruct->USART_BaudRate))) 

FractionalDivider = ((IntegerDivider - ((u32) IntegerDivider)) * 16) + 0.5 

#### 参数 USART_WordLength 

USART_WordLength 提示了在一个帧中传输或者接收到的数据位数。Table 709. 给出了该参数可取的值。 

**Table 4. USART_WordLength** 定义 

| **USART_WordLength** |          | 描述 |
| -------------------- | -------- | ---- |
| USART_WordLength_8b  | 8 位数据 |      |
| USART_WordLength_9b  | 9 位数据 |      |

#### 参数 USART_StopBits 

USART_StopBits 定义了发送的停止位数目。Table 710. 给出了该参数可取的值。 

**Table 5. USART_StopBits** 定义 

| **USART_StopBits** | 描述                       |
| ------------------ | -------------------------- |
| USART_StopBits_1   | 在帧结尾传输  1 个停止位   |
| USART_StopBits_0.5 | 在帧结尾传输  0.5 个停止位 |
| USART_StopBits_2   | 在帧结尾传输  2 个停止位   |
| USART_StopBits_1.5 | 在帧结尾传输  1.5 个停止位 |

#### 参数 USART_Parity 

USART_Parity 定义了奇偶模式。Table 711. 给出了该参数可取的值。

**Table 6. USART_Parity** 定义 

| **USART_Parity**  |          | 描述 |
| ----------------- | -------- | ---- |
| USART_Parity_No   | 奇偶失能 |      |
| USART_Parity_Even | 偶模式   |      |
| USART_Parity_Odd  | 奇模式   |      |

注意：奇偶校验一旦使能，在发送数据的 MSB 位插入经计算的奇偶位（字长 9 位时的第 9 位，字长 8 位时的第 8 位）。 

#### 参数 USART_HardwareFlowControl 

USART_HardwareFlowControl 指定了硬件流控制模式使能还是失能。Table 712. 给出了该参数可取的值。 

**Table 7. USART_HardwareFlowControl** 定义 

| **USART_HardwareFlowControl**     | 描述               |
| --------------------------------- | ------------------ |
| USART_HardwareFlowControl_None    | 硬件流控制失能     |
| USART_HardwareFlowControl_RTS     | 发送请求  RTS 使能 |
| USART_HardwareFlowControl_CTS     | 清除发送  CTS 使能 |
| USART_HardwareFlowControl_RTS_CTS | RTS 和 CTS 使能    |

#### 参数 USART_Mode 

USART_Mode 指定了使能或者失能发送和接收模式。Table 713. 给出了该参数可取的值。 

**Table 8. USART_Mode** 定义 

| **USART_Mode** |          | 描述 |
| -------------- | -------- | ---- |
| USART_Mode_Tx  | 发送使能 |      |
| USART_Mode_Rx  | 接收使能 |      |

例： 

```c
/* The following example illustrates how to configure the USART1 */ 

USART_InitTypeDef USART_InitStructure; 

USART_InitStructure.USART_BaudRate = 9600; //波特率

USART_InitStructure.USART_WordLength = USART_WordLength_8b; //数据帧长度

USART_InitStructure.USART_StopBits = USART_StopBits_1; //停止位

USART_InitStructure.USART_Parity = USART_Parity_NO; //检验位

USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None; //硬件流控制

USART_InitStructure.USART_Mode = USART_Mode_Tx | USART_Mode_Rx; //模式

USART_Init(USART1, &USART_InitStructure); 
```



### 函数 USART_Cmd 

**Table 9.** 函数 **USART_ Cmd** 

| 函数名      | USART_ Cmd                                                   |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void USART_Cmd(USART_TypeDef* USARTx,  FunctionalState NewState) |
| 功能描述    | 使能或者失能  USART 外设                                     |
| 输入参数  1 | **USARTx**：x 可以是 1，2 或者 3，来选择 USART  外设         |
| 输入参数  2 | **NewState**: 外设 USARTx 的新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Enable the USART1 */ 

USART_Cmd(USART1, ENABLE); 
```

### 函数 USART_ITConfig 

**Table 10.** 函数 **USART_ITConfig** 

| 函数名      | USART_ITConfig                                               |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void USART_ITConfig(USART_TypeDef*  USARTx, u16 USART_IT, FunctionalState NewState) |
| 功能描述    | 使能或者失能指定的  USART 中断                               |
| 输入参数  1 | **USARTx**：x 可以是 1，2 或者 3，来选择 USART  外设         |
| 输入参数  2 | **USART_IT**：待使能或者失能的 USART 中断源参阅 Section：USART_IT 查阅更多该参数允许取值范围 |
| 输入参数  3 | **NewState**：USARTx 中断的新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

#### 参数 USART_IT 

输入参数 USART_IT 使能或者失能 USART 的中断。可以取下表的一个或者多个取值的组合作为该参数的值。

**Table 11. USART_IT** 值 

| **USART_IT**      |                  | 描述 |
| ----------------- | ---------------- | ---- |
| USART_IT_PE       | 奇偶错误中断     |      |
| USART_IT_TXE      | 发送中断         |      |
| USART_IT_TC       | 传输完成中断     |      |
| **USART_IT_RXNE** | 接收中断         |      |
| **USART_IT_IDLE** | 空闲总线中断     |      |
| USART_IT_LBD      | LIN 中断检测中断 |      |
| USART_IT_CTS      | CTS 中断         |      |
| USART_IT_ERR      | 错误中断         |      |

例： 

```c
/* Enables the USART1 transmit interrupt */ 

USART_ITConfig(USART1, USART_IT_RXNE，ENABLE); 
```

### 函数 USART_SendData 

**Table 12.** 函数 **USART_ SendData** 

| 函数名      | USART_ SendData                                      |
| ----------- | ---------------------------------------------------- |
| 函数原形    | void USART_SendData(USART_TypeDef*  USARTx, u8 Data) |
| 功能描述    | 通过外设  USARTx 发送单个数据                        |
| 输入参数  1 | **USARTx**：x 可以是 1，2 或者 3，来选择 USART  外设 |
| 输入参数  2 | Data: 待发送的数据                                   |
| 输出参数    | 无                                                   |
| 返回值      | 无                                                   |
| 先决条件    | 无                                                   |
| 被调用函数  | 无                                                   |

例： 

```c
/* Send one HalfWord on USART3 */ 
USART_SendData(USART3, 0x26); 
```

### 函数 USART_ReceiveData

**Table 13.** 函数 **USART_ReceiveData** 

| 函数名     | USART_ ReceiveData                               |
| ---------- | ------------------------------------------------ |
| 函数原形   | u8 USART_ReceiveData(USART_TypeDef*  USARTx)     |
| 功能描述   | 返回  USARTx 近接收到的数据                      |
| 输入参数   | USARTx：x 可以是 1，2 或者 3，来选择 USART  外设 |
| 输出参数   | 无                                               |
| 返回值     | 接收到的字                                       |
| 先决条件   | 无                                               |
| 被调用函数 | 无                                               |

例： 

```c
/* Receive one halfword on USART2 */ 
u16 RxData; 

RxData = USART_ReceiveData(USART2);
```

### 函数 USART_GetFlagStatus 

**Table 14.** 函数 **USART_ GetFlagStatus** 

| 函数名      | USART_ GetFlagStatus                                         |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | FlagStatus  USART_GetFlagStatus(USART_TypeDef* USARTx, u16 USART_FLAG) |
| 功能描述    | 检查指定的  USART 标志位设置与否                             |
| 输入参数  1 | **USARTx**：x 可以是 1，2 或者 3，来选择 USART  外设         |
| 输入参数  2 | **USART_FLAG**：待检查的 USART 标志位参阅 Section：USART_FLAG  查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | **USART_FLAG 的新状态（SET  或者 RESET）**                   |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**USART_FLAG** 

Table 15. 给出了所有可以被函数USART_ GetFlagStatus检查的标志位列表 

**Table 15. USART_FLAG** 值 

| **USART_FLAG**      | 描述                     |
| ------------------- | ------------------------ |
| USART_FLAG_CTS      | CTS 标志位               |
| USART_FLAG_LBD      | LIN 中断检测标志位       |
| **USART_FLAG_TXE**  | 发送数据寄存器空标志位   |
| **USART_FLAG_TC**   | 发送完成标志位           |
| **USART_FLAG_RXNE** | 接收数据寄存器非空标志位 |
| **USART_FLAG_IDLE** | 空闲总线标志位           |
| USART_FLAG_ORE      | 溢出错误标志位           |
| USART_FLAG_NE       | 噪声错误标志位           |
| USART_FLAG_FE       | 帧错误标志位             |
| USART_FLAG_PE       | 奇偶错误标志位           |

例： 

```c
/* Check if the transmit data register is full or not */ 

FlagStatus Status; 

Status = USART_GetFlagStatus(USART1, USART_FLAG_TXE); 
```

### 函数 USART_ClearFlag 

**Table 16.** 函数 **USART_ ClearFlag** 

| 函数名      | USART_ ClearFlag                                             |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void USART_ClearFlag(USART_TypeDef*  USARTx, u16 USART_FLAG) |
| 功能描述    | 清除  USARTx 的待处理标志位                                  |
| 输入参数  1 | USARTx：x 可以是 1，2 或者 3，来选择 USART  外设             |
| 输入参数  2 | USART_FLAG：待清除的 USART 标志位参阅 Section：USART_FLAG  查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Clear Overrun error flag */ 

USART_ClearFlag(USART1,USART_FLAG_OR);
```

### 函数 USART_GetITStatus 

**Table 17.** 函数 **USART_ GetITStatus** 

| 函数名      | USART_ GetITStatus                                           |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | ITStatus  USART_GetITStatus(USART_TypeDef* USARTx, u16 USART_IT) |
| 功能描述    | 检查指定的  USART 中断发生与否                               |
| 输入参数  1 | USARTx：x 可以是 1，2 或者 3，来选择 USART  外设             |
| 输入参数  2 | USART_IT：待检查的 USART 中断源参阅 Section：USART_IT  查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | USART_IT 的新状态                                            |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

#### 参数 USART_IT 

Table 18. 给出了所有可以被函数USART_ GetITStatus检查的中断标志位列表 

**Table 18. USART_IT** 值 

| **USART_IT**  |                  | 描述 |
| ------------- | ---------------- | ---- |
| USART_IT_PE   | 奇偶错误中断     |      |
| USART_IT_TXE  | 发送中断         |      |
| USART_IT_TC   | 发送完成中断     |      |
| USART_IT_RXNE | 接收中断         |      |
| USART_IT_IDLE | 空闲总线中断     |      |
| USART_IT_LBD  | LIN 中断探测中断 |      |
| USART_IT_CTS  | CTS 中断         |      |
| USART_IT_ORE  | 溢出错误中断     |      |
| USART_IT_NE   | 噪音错误中断     |      |
| USART_IT_FE   | 帧错误中断       |      |

例： 

```c
/* Get the USART1 Overrun Error interrupt status */ 

ITStatus ErrorITStatus; 

ErrorITStatus = USART_GetITStatus(USART1, USART_IT_OverrunError); 
```

### 函数 USART_ClearITPendingBit 

Table 19. 描述了函数USART_ ClearITPendingBit  

**Table 19.** 函数 **USART_ ClearITPendingBit** 

| 函数名      | USART_ ClearITPendingBit                                     |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  USART_ClearITPendingBit(USART_TypeDef* USARTx, u16 USART_IT) |
| 功能描述    | 清除  USARTx 的中断待处理位                                  |
| 输入参数  1 | **USARTx**：x 可以是 1，2 或者 3，来选择 USART  外设         |
| 输入参数  2 | **USART_IT**：待检查的 USART 中断源参阅 Section：USART_IT  查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Clear the Overrun Error interrupt pending bit */ 

USART_ClearITPendingBit(USART1,USART_IT_OverrunError); 
```









