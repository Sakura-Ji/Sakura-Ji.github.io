# 外部中断

## 前言

### 什么是中断

在主程序运行过程中，出现了特定的中断触发条件（**中断源**），使得CPU暂停当前正在运行的程序，转而去处理中断程序，处理完成后又返回原来被暂停的位置继续运行。**在STM32中有68个可屏蔽中断通道：包含EXTI、TIM、ADC、USART、SPI、I2C、RTC等多个外设**

![Interrupt_Flow](https://pic.imgdb.cn/item/6513ce94c458853aef34f3df/Interrupt_Flow.png)

### 外部中断的理论思维步骤

**1.STM32CPU使用 [NVIC(嵌套向量中断控制器)](#NVIC) 统一管理中断**

![NVIC](https://pic.imgdb.cn/item/6513ceb6c458853aef34fe61/NVIC.png)

**每个中断通道都拥有16个可编程的优先等级(每个中断源可以被分配的优先级级别个数)，可对优先级进行分组，进一步设置抢占优先级和响应优先级**

* NVIC的中断优先级由 **优先级寄存器的4位**（0~15）**决定**，这4位可以进行切分，分为**高 x 位的抢占优先级**和**低 4-x 位的响应优先级**

* 抢占优先级高的可以中断嵌套，响应优先级高的可以优先排队，抢占优先级和响应优先级均相同的按中断号排队

| 组   | AIRCR[10 : 8] | IP bit[7 : 4] 分配情况 | 分配结果                                               |
| ---- | ------------- | ---------------------- | ------------------------------------------------------ |
| 0    | 111           | 0：4                   | 0位抢占优先级(取值为0) ，    4位响应优先级(取值为0~15) |
| 1    | 110           | 1：3                   | 1位抢占优先级(取值为0~1) ，3位响应优先级(取值为0~7)    |
| 2    | 101           | 2：2                   | 2位抢占优先级(取值为0~3) ，2位响应优先级(取值为0~3)    |
| 3    | 100           | 3：1                   | 3位抢占优先级(取值为0~7) ，1位响应优先级(取值为0~1)    |
| 4    | 011           | 4：0                   | 4位抢占优先级(取值为0~15) ，0位响应优先级(取值为0)     |

**抢占优先级与响应优先级**的基本概念：

1. 高优先级的抢占优先级是可以打断正在进行的低抢占优先级中断的
2. 抢占优先级相同的中断，高响应优先级不可以打断低响应优先级的中断
3. 抢占优先级相同的中断，当两个中断同时发生的情况下，哪个响应优先级高，哪个先执行
4. 如果两个中断的抢占优先级和响应优先级都是一样的话，同时发生，则根据他们在中断表中的排位顺
   序决定先处理那一个；先后的话，则根据先来后到
5. 优先级数字越小，优先级越高，越先被执行

**NVIC的初始化中分组以及设置优先级的概念（举例）：**

**==1.设置 分组2，设置0-3为抢占优先级，0-3为响应优先级。==**

==**2.分组后，有抢占优先级通道4个，分别为0，1，2，3.**==

==**3.每个抢占优先级通道有4个响应优先级的通道，分别为0，1，2，3。**==

---

**2. STM32 的每个GPIO端口都可以作为 [外部中断(EXTI)](#EXTI)  的中断输入口**

>  所有端口都有外部中断能力。为了使用外部中断线，端口必须配置成输入模式 --> 《STM32中文参考手册》**8.1.3节**

![EXTI_BlockMap](https://pic.imgdb.cn/item/6513ceb5c458853aef34fdf1/EXTI_BlockMap.png)

---

**3. 每个外部中断/事件线(EXTI1~EXTI15)上对应了 P(A0~G0) ···· P(A15~G15)中的 7个IO 口(A~G),==EXTI中断线每次只能连接到 1 个 IO 口上==**

![EXTI](https://pic.imgdb.cn/item/6513ceb7c458853aef34feb5/EXTI.png)

---

**4. 需要通过配置 [AFIO_EXTICRx](#AFIO) 寄存器的EXTIx[3:0]来决定 ==外部中断/事件线(EXTI1~EXTI15)==  配置到哪个 GPIO引脚 上(x=1~4)**

![AFIO_EXTICR2](https://pic.imgdb.cn/item/6513ceb6c458853aef34fe29/AFIO_EXTICR2.png)

---

**5. 通过AFIO_EXTICRx配置GPIO线上的外部中断/事件，必须先==使能AFIO时钟==，AFIO时钟在APB2线上**

---

*通过对中断理论步骤的 **倒叙** ，我们就可以实践出 **外部中断EXTI** 的过程*

![Interrupt](https://pic.imgdb.cn/item/6513cea4c458853aef34fb01/Interrupt.png)

### 外部中断中有什么

* NVIC(嵌套向量中断控制器): CPU的小助手，帮助控制着芯片的中断相关功能
* 中断优先级：当有多个中断源同时申请中断时，CPU会根据中断源的轻重缓急进行裁决，优先响应更加紧急的中断源
* 中断嵌套：当一个中断程序正在运行时，又有新的更高优先级的中断源申请中断，CPU再次暂停当前中断程序，转而去处理新的中断程序，处理完成后依次进行返回
* EXTI(外部中断/事件控制器)：对请求中断的输入线进行配置
* AFIO(复用功能I/O和调试配置)：对GPIO设置成输入中断功能
* GPIO(通用输入输出IO口)：与外部硬件设备连接

### 中断设置完了，如何使用中断

在STM32中，中断函数的名字都是固定的，每个中断通道都对应一个中断函数，可以在启动文件`startup_stm32f10x_md.s`中的中断向量表中查找其名字

```c
/*

  中断函数不需要在.h文件中声明 因为系统会自动执行的
  中断函数中一般先定义一个中断判断标志位，以确保是我们想要的中断源触发的这个函数
  在中断程序结束后一定要清理中断函数标志位 否则如果中断标志位置依旧是1 系统就会一直调用这个中断函数

*/
void EXTI15_10_IRQHandler(void) //中断函数都是无参无返回值的
{
  if(EXTI_GetITStatus(EXTI_Line14) == SET)//判断中断标志位
  {
    
    EXTI_ClearITPendingBit(EXTI_Line14);//清理中断函数标志位
    
  }
}
```

## NVIC (嵌套向量中断控制器) {#NVIC}

嵌套向量中断控制器，控制着整个芯片中断相关的功能，是Cortex-M3内核里面的一个外设

## EXTI (外部中断/事件控制器) {#EXTI}

STM32F10x外部中断/事件控制器（EXTI）包含 20 个用于产生事件/中断请求的边沿检测器。EXTI的每根输入线都可单独进行配置，以选择类型（中断或事件）和相应的触发事件（上升沿触发、下降沿触发或边沿触发），还可独立地被屏蔽

## AFIO (复用功能I/O和调试配置) {#AFIO}

**在STM32中，AFIO主要完成两个任务：**

* 复用功能引脚重映射
* 中断引脚选择

## 外部中断的实战应用

### 基于红外对射模块的计数器

==**红外对射模块：**==

接好VCC和GND，模块电源指示灯会亮，**模块槽中无遮挡时，接收管导通，模块D0输出低电平**，开关指示灯亮，**遮挡时，DO输出高电平，开关指示灯灭**。模块D0可与继电器相连，组成限位开关等功能，也可以与有源蜂鸣器模块相连，组成报警器。D0输出接口可以与单片机10口直接相连，一般接外部中断，检测传感器是否有遮档，如用电机码盘则可检测电机的转速。

`IRED.h`

```c
#ifndef  __IRED_H__//如果没有定义了则参加以下编译
#define  __IRED_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"
void IRED_Init(void);
uint16_t CountSensor_Get(void);

#endif  //结束编译
```

`IRED.c`

```c
#include "IRED.h"

uint16_t CountSensor_Count;

void IRED_Init(void)
{
  //1.开启相关时钟
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB,ENABLE);//红外对射传感器所在的GPIOB时钟打开
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_AFIO,ENABLE);//打开端口复用AFIO时钟 --> 是为了中断引脚选择
  
  //2.初始化IO口
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_14;//设置PA1,PA2引脚
  
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU ;//设置为上拉输入（其他模式输入都可）
  
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ（可以不设置）
  //初始化函数↓
  GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
  
  //3.初始化AFIO-->确定中断引脚
  GPIO_EXTILineConfig(GPIO_PortSourceGPIOB, GPIO_PinSource14);//使用AFIO 配置中断引脚的选择 GPIOB-->Pin14
  
  //4.配置EXTI外部中断寄存器
  
  EXTI_InitTypeDef EXTI_InitStructure; 

  EXTI_InitStructure.EXTI_Line = EXTI_Line14; // GPIOB Pin14 所以选择第14条EXTI中断线 --> 连接外部中断线上
  EXTI_InitStructure.EXTI_Mode = EXTI_Mode_Interrupt;//模式选择 外部中断
  /*
  在本例程中 不遮挡 --> 遮挡 上升沿 ；
    	   遮挡 --> 不遮挡 下降沿
  */
  EXTI_InitStructure.EXTI_Trigger = EXTI_Trigger_Falling; //选择下降沿触发 --> 当这个GPIOB Pin14口满足这个条件时 就会触发中断 --> 进入中断函数
 // 如果选择 上升和下降都触发 则遮挡和移开时都加一
    
  EXTI_InitStructure.EXTI_LineCmd = ENABLE; //定义选中线的状态-->开启

  EXTI_Init(&EXTI_InitStructure); //初始化EXTI
  
  //5. 配置NVIC
  
  NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);//进行分组 -->整个芯片(一个项目中)只能进行一次中断分组 可以放到
  
  NVIC_InitTypeDef NVIC_InitStructure; //定义结构体
  
  NVIC_InitStructure.NVIC_IRQChannel = EXTI15_10_IRQn; //根据上面的我们所选取的GPIO-->Pin14在中断通道的EXTI14 所以这里选择 EXTI15_10_IRQn

  /*
  从上面的分组中可知 我们选则的是 抢占2位 和 响应2位
  抢占可以从 0~3 进行选择 响应也可以从 0~3 进行选择
  我们在这个项目中只使用了一个中断 所以可以随意设置这个模块中的中断的优先级 例如 抢占 位于第一位 / 响应 唯一第一位 
  1. 高优先级的抢占优先级是可以打断正在进行的低抢占优先级中断的
  2. 抢占优先级相同的中断，高响应优先级不可以打断低响应优先级的中断
  3. 抢占优先级相同的中断，当两个中断同时发生的情况下，哪个响应优先级高，哪个先执行
  4. 如果两个中断的抢占优先级和响应优先级都是一样的话，同时发生，则根据他们在中断表中的排位顺序决定先处理那一个；先后的话，则根据先来后到
  5. 优先级数字越小，优先级越高，越先被执行
   ==》抢占 0 响应 0
   ==》抢占 0 响应 1
   ==》抢占 0 响应 2
   ==》抢占 0 响应 3
  */
  NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;//这里选择的是抢占 1

  NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1; //这里选择的是响应1

  NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE; //使能指定的中断通道
  //初始化函数↓
  NVIC_Init(&NVIC_InitStructure);
}

/*
  中断函数不需要在.h文件中声明 因为系统会自动执行的
  中断函数中一般先定义一个中断判断标志位，以确保是我们想要的中断源触发的这个函数
  
  在中断程序结束后一定要清理中断函数标志位 因为只有中断标志位置1 他就会一直调用中断函数

*/
void EXTI15_10_IRQHandler(void) //中断函数都是无参无返回值的
{
  if(EXTI_GetITStatus(EXTI_Line14) == SET)
  {
    CountSensor_Count++;//对射触发一次，就进入一次中断 次数加一
    EXTI_ClearITPendingBit(EXTI_Line14);
    
  }
}

uint16_t CountSensor_Get(void)
{
  return CountSensor_Count;
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "IRED.h"

int main(void)
{
  OLED_Init();
  
  IRED_Init();
  
  OLED_ShowString(1,1,"Count:");
  
  while(1)
  {
    OLED_ShowNum(1,7,CountSensor_Get(),4);
  }
}
```

### 基于旋转编码器模块的计数器

**旋转编码器：**用来测量位置、速度或旋转方向的装置，当其旋转轴旋转时，其输出端可以输出与旋转速度和方向对应的方波信号，读取方波信号的频率和相位信息即可得知旋转轴的速度和方向

类型：机械触点式/霍尔传感器式/光栅式

<img src="https://pic.imgdb.cn/item/6513ce91c458853aef34f287/Rotary_encoder.jpg" alt="Rotary_encoder" style="zoom: 33%;" />

<img src="https://pic.imgdb.cn/item/6513ce91c458853aef34f20e/Rotary_encoder2.jpg" alt="Rotary_encoder2" style="zoom:40%;" />

<img src="https://pic.imgdb.cn/item/6513ce90c458853aef34f1d5/Rotary_encoder3.png" alt="Rotary_encoder3" style="zoom:50%;" />

![Rotary_encoder4](https://pic.imgdb.cn/item/6513ce90c458853aef34f140/Rotary_encoder4.png)

## 相关库函数

**Table 1. NVIC** 库函数 

| 函数名                       | 描述                                                     |
| ---------------------------- | -------------------------------------------------------- |
| NVIC_DeInit                  | 将外设  NVIC 寄存器重设为缺省值                          |
| **NVIC_PriorityGroupConfig** | 设置优先级分组：先占优先级和从优先级                     |
| **NVIC_Init**                | 根据  NVIC_InitStruct 中指定的参数初始化外设 NVIC 寄存器 |
| NVIC_SystemLPConfig          | 选择系统进入低功耗模式的条件                             |
| NVIC_SetVectorTable          | 设置向量表的位置和偏移                                   |

### 函数NVIC_PriorityGroupConfig 

**Table 2.** 函数 **NVIC_PriorityGroupConfig** 

| 函数名     | NVIC_PriorityGroupConfig                                     |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void NVIC_PriorityGroupConfig(u32  NVIC_PriorityGroup)       |
| 功能描述   | 设置优先级分组：抢占优先级和响应优先级                       |
| 输入参数   | NVIC_PriorityGroup：优先级分组位长度   参阅  Section：NVIC_PriorityGroup 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | **优先级分组只能设置一次**                                   |
| 被调用函数 | 无                                                           |

**NVIC_PriorityGroup** 该参数设置优先级分组位长度

**Table 3. NVIC_PriorityGroup** 值 

| **NVIC_PriorityGroup** | 描述                              |
| ---------------------- | --------------------------------- |
| NVIC_PriorityGroup_0   | 抢占优先级 0 位，响应优先级  4 位 |
| NVIC_PriorityGroup_1   | 抢占优先级 1 位，响应优先级  3 位 |
| NVIC_PriorityGroup_2   | 抢占优先级 2 位，响应优先级  2 位 |
| NVIC_PriorityGroup_3   | 抢占优先级 3 位，响应优先级  1 位 |
| NVIC_PriorityGroup_4   | 抢占优先级 4 位，响应优先级  0 位 |

函数原型：

```c title="函数原型"
/**
  * @brief  Configures the priority grouping: pre-emption priority and subpriority.
  * @param  NVIC_PriorityGroup: specifies the priority grouping bits length. 
  *   This parameter can be one of the following values:
  *     @arg NVIC_PriorityGroup_0: 0 bits for pre-emption priority
  *                                4 bits for subpriority
  *     @arg NVIC_PriorityGroup_1: 1 bits for pre-emption priority
  *                                3 bits for subpriority
  *     @arg NVIC_PriorityGroup_2: 2 bits for pre-emption priority
  *                                2 bits for subpriority
  *     @arg NVIC_PriorityGroup_3: 3 bits for pre-emption priority
  *                                1 bits for subpriority
  *     @arg NVIC_PriorityGroup_4: 4 bits for pre-emption priority
  *                                0 bits for subpriority
  * @retval None
  */
void NVIC_PriorityGroupConfig(uint32_t NVIC_PriorityGroup)
{
  /* Check the parameters */
  assert_param(IS_NVIC_PRIORITY_GROUP(NVIC_PriorityGroup));
  
  /* Set the PRIGROUP[10:8] bits according to NVIC_PriorityGroup value */
  SCB->AIRCR = AIRCR_VECTKEY_MASK | NVIC_PriorityGroup;
}
```

例： 

```c title="例"
/* Configure the Priority Grouping with 1 bit */ 

NVIC_PriorityGroupConfig(NVIC_PriorityGroup_1);
```

### 函数NVIC_Init

**Table 4.** 函数 **NVIC_Init** 

| 函数名     | NVIC_Init                                                    |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void NVIC_Init(NVIC_InitTypeDef*  NVIC_InitStruct)           |
| 功能描述   | 根据  NVIC_InitStruct 中指定的参数初始化外设 NVIC 寄存器     |
| 输入参数   | NVIC_InitStruct：指向结构 NVIC_InitTypeDef  的指针，包含了外设 GPIO 的配置信息参阅  Section：NVIC_InitTypeDef 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**NVIC_InitTypeDef structure** 

```C
NVIC_InitTypeDef 定义于文件“stm32f10x_nvic.h”： 

typedef struct 

{ 
u8 NVIC_IRQChannel; 
u8 NVIC_IRQChannelPreemptionPriority; 
u8 NVIC_IRQChannelSubPriority; 
FunctionalState NVIC_IRQChannelCmd; 
} NVIC_InitTypeDef; 
```

#### 参数 NVIC_IRQChannel

**该参数用以使能或者失能指定的 IRQ 通道。** 

**Table 5. NVIC_IRQChannel** 值 

| **NVIC_IRQChannel** | 描述                             |
| ------------------- | -------------------------------- |
| WWDG_IRQn           | 窗口看门狗中断                   |
| PVD_IRQn            | PVD 通过 EXTI 探测中断           |
| TAMPER_IRQn         | 篡改中断                         |
| RTC_IRQn            | RTC 全局中断                     |
| FlashItf_IRQn       | FLASH 全局中断                   |
| RCC_IRQn            | RCC 全局中断                     |
| EXTI0_IRQn          | 外部中断线  0 中断               |
| EXTI1_IRQnl         | 外部中断线  1 中断               |
| EXTI2_IRQn          | 外部中断线  2 中断               |
| EXTI3_IRQn          | 外部中断线  3 中断               |
| EXTI4_IRQn          | 外部中断线  4 中断               |
| DMAChannel1_IRQn    | DMA 通道 1 中断                  |
| DMAChannel2_IRQn    | DMA 通道 2 中断                  |
| DMAChannel3_IRQn    | DMA 通道 3 中断                  |
| DMAChannel4_IRQn    | DMA 通道 4 中断                  |
| DMAChannel5_IRQn    | DMA 通道 5 中断                  |
| DMAChannel6_IRQn    | DMA 通道 6 中断                  |
| DMAChannel7_IRQn    | DMA 通道 7 中断                  |
| ADC_IRQn            | ADC 全局中断                     |
| USB_HP_CANTX_IRQn   | USB 高优先级或者 CAN 发送中断    |
| USB_LP_CAN_RX0_IRQn | USB 低优先级或者 CAN 接收 0 中断 |
| CAN_RX1_IRQn        | CAN 接收 1 中断                  |
| CAN_SCE_IRQn        | CAN SCE 中断                     |
| EXTI9_5_IRQn        | 外部中断线  9-5 中断             |
| TIM1_BRK_IRQn       | TIM1 暂停中断                    |
| TIM1_UP_IRQn        | TIM1 刷新中断                    |
| TIM1_TRG_COM_IRQn   | TIM1 触发和通讯中断              |
| TIM1_CC_IRQn        | TIM1 捕获比较中断                |
| TIM2_IRQn           | TIM2 全局中断                    |
| TIM3_IRQn           | TIM3 全局中断                    |
| TIM4_IRQn           | TIM4 全局中断                    |
| I2C1_EV_IRQn        | I2C1 事件中断                    |
| I2C1_ER_IRQn        | I2C1 错误中断                    |
| I2C2_EV_IRQn        | I2C2 事件中断                    |
| I2C2_ER_IRQn        | I2C2 错误中断                    |
| SPI1_IRQn           | SPI1 全局中断                    |
| SPI2_IRQn           | SPI2 全局中断                    |
| USART1_IRQn         | USART1 全局中断                  |
| USART2_IRQn         | USART2 全局中断                  |
| USART3_IRQn         | USART3 全局中断                  |
| EXTI15_10_IRQn      | 外部中断线  15-10 中断           |
| RTCAlarm_IRQn       | RTC 闹钟通过 EXTI 线中断         |
| USBWakeUp_IRQn      | USB 通过 EXTI 线从悬挂唤醒中断   |

---

#### 参数 NVIC_IRQChannelPreemptionPriority

**该参数设置了成员 NVIC_IRQChannel 中的抢占优先级**

---

#### 参数 NVIC_IRQChannelSubPriority

 **该参数设置了成员 NVIC_IRQChannel 中的响应优先级**

下表给出了由函数 NVIC_PriorityGroupConfig 设置的抢占优先级和响应优先级可取的值

**Table 6.** 抢占优先级和响应优先级值

| **NVIC_PriorityGroup** | **NVIC_IRQChannel** 的抢占优先级 | **NVIC_IRQChannel** 的响应优先级 | 描述                              |
| ---------------------- | -------------------------------- | -------------------------------- | --------------------------------- |
| NVIC_PriorityGroup_0   | 0                                | 0-15                             | 抢占优先级 0 位，响应优先级  4 位 |
| NVIC_PriorityGroup_1   | 0-1                              | 0-7                              | 抢占优先级 1 位，响应优先级  3 位 |
| NVIC_PriorityGroup_2   | 0-3                              | 0-3                              | 抢占优先级 2 位，响应优先级  2 位 |
| NVIC_PriorityGroup_3   | 0-7                              | 0-1                              | 抢占优先级 3 位，响应优先级  1 位 |
| NVIC_PriorityGroup_4   | 0-15                             | 0                                | 抢占优先级 4 位，响应优先级  0 位 |

1. 选中NVIC_PriorityGroup_0，则参数NVIC_IRQChannelPreemptionPriority对中断通道的设置不产生影响。 
2. 选中 NVIC_PriorityGroup_4，则参数 NVIC_IRQChannelSubPriority 对中断通道的设置不产生影响。

---

####  参数 NVIC_IRQChannelCmd

 **该参数指定了在成员 NVIC_IRQChannel 中定义的 IRQ 通道被使能还是失能。**

这个参数取值为 ENABLE 或者 DISABLE。 

例：

```C 
NVIC_InitTypeDef NVIC_InitStructure; 

/* Configure the Priority Grouping with 1 bit */ 

NVIC_PriorityGroupConfig(NVIC_PriorityGroup_1);

/* Enable TIM3 global interrupt with Preemption Priority 0 and Sub 

Priority as 2 */ 

NVIC_InitStructure.NVIC_IRQChannel = TIM3_IRQn; 

NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 0;

NVIC_InitStructure.NVIC_IRQChannelSubPriority = 2; 

NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE; 

NVIC_Init(&NVIC_InitStructure);

/* Enable USART1 global interrupt with Preemption Priority 1 and Sub 

Priority as 5 */ 

NVIC_InitStructure.NVIC_IRQChannel = USART1_IRQn; 

NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1; 

NVIC_InitStructure.NVIC_IRQChannelSubPriority = 5; 

NVIC_Init(&NVIC_InitStructure);

/* Enable RTC global interrupt with Preemption Priority 1 and Sub 

Priority as 7 */ 

NVIC_InitStructure.NVIC_IRQChannel = RTC_IRQn; 

NVIC_InitStructure.NVIC_IRQChannelSubPriority = 7; 

NVIC_Init(&NVIC_InitStructure);

/* Enable EXTI4 interrupt with Preemption Priority 1 and Sub 

Priority as 7 */ 

NVIC_InitStructure.NVIC_IRQChannel = EXTI4_IRQn; 

NVIC_InitStructure.NVIC_IRQChannelSubPriority = 7; 

NVIC_InitStructure(&NVIC_InitStructure);

/* TIM3 interrupt priority is higher than USART1, RTC and EXTI4 interrupts priorities. USART1 interrupt priority is higher than RTC and EXTI4 interrupts priorities. RTC interrupt priority is higher than EXTI4 interrupt prioriy. */ 
```

**Table 7. EXTI** 库函数 

| 函数名                     | 描述                                                     |
| -------------------------- | -------------------------------------------------------- |
| EXTI_DeInit                | 将外设  EXTI 寄存器重设为缺省值                          |
| **EXTI_Init**              | 根据  EXTI_InitStruct 中指定的参数初始化外设 EXTI 寄存器 |
| EXTI_StructInit            | 把 EXTI_InitStruct 中的每一个参数按缺省值填入            |
| EXTI_GenerateSWInterrupt   | 产生一个软件中断                                         |
| **EXTI_GetFlagStatus**     | 检查指定的  EXTI 线路标志位设置与否                      |
| **EXTI_ClearFlag**         | 清除  EXTI 线路挂起标志位                                |
| **EXTI_GetITStatus**       | 检查指定的  EXTI 线路触发请求发生与否                    |
| **EXTI_ClearITPendingBit** | 清除  EXTI 线路挂起位                                    |

### 函数 EXTI_Init 

**Table 8.** 函数 **EXTI_Init** 

| 函数名     | EXTI_Init                                                    |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void EXTI_Init(EXTI_InitTypeDef*  EXTI_InitStruct)           |
| 功能描述   | 根据  EXTI_InitStruct 中指定的参数初始化外设 EXTI 寄存器     |
| 输入参数   | EXTI_InitStruct：指向结构 EXTI_InitTypeDef  的指针，包含了外设 EXTI 的配置信息参阅  Section：EXTI_InitTypeDef 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**EXTI_InitTypeDef structure** 

```c 
EXTI_InitTypeDef 定义于文件“stm32f10x_exti.h”： 

typedef struct 

{ 

u32 EXTI_Line; 

EXTIMode_TypeDef EXTI_Mode; 

EXTIrigger_TypeDef EXTI_Trigger; 

FunctionalState EXTI_LineCmd; 

} EXTI_InitTypeDef;
```

#### 参数 EXTI_Line 

EXTI_Line 选择了待使能或者失能的外部线路。

**Table 9. EXTI_Line** 值 

| **EXTI_Line** |               | 描述 |
| ------------- | ------------- | ---- |
| EXTI_Line0    | 外部中断线 0  |      |
| EXTI_Line1    | 外部中断线 1  |      |
| EXTI_Line2    | 外部中断线 2  |      |
| EXTI_Line3    | 外部中断线 3  |      |
| EXTI_Line4    | 外部中断线 4  |      |
| EXTI_Line5    | 外部中断线 5  |      |
| EXTI_Line6    | 外部中断线 6  |      |
| EXTI_Line7    | 外部中断线 7  |      |
| EXTI_Line8    | 外部中断线 8  |      |
| EXTI_Line9    | 外部中断线 9  |      |
| EXTI_Line10   | 外部中断线 10 |      |
| EXTI_Line11   | 外部中断线 11 |      |
| EXTI_Line12   | 外部中断线 12 |      |
| EXTI_Line13   | 外部中断线 13 |      |
| EXTI_Line14   | 外部中断线 14 |      |
| EXTI_Line15   | 外部中断线 15 |      |
| EXTI_Line16   | 外部中断线 16 |      |
| EXTI_Line17   | 外部中断线 17 |      |
| EXTI_Line18   | 外部中断线 18 |      |

#### 参数 EXTI_Mode 

EXTI_Mode 设置了被使能线路的模式。 

**Table 10. EXTI_Mode** 值 

| **EXTI_Mode**       | 描述                      |
| ------------------- | ------------------------- |
| EXTI_Mode_Event     | 设置  EXTI 线路为事件请求 |
| EXTI_Mode_Interrupt | 设置  EXTI 线路为中断请求 |

#### 参数 EXTI_Trigger

EXTI_Trigger 设置了被使能线路的触发边沿。

**Table 11. EXTI_Trigger** 值 

| **EXTI_Trigger**            | 描述                                 |
| --------------------------- | ------------------------------------ |
| EXTI_Trigger_Falling        | 设置输入线路下降沿为中断请求         |
| EXTI_Trigger_Rising         | 设置输入线路上升沿为中断请求         |
| EXTI_Trigger_Rising_Falling | 设置输入线路上升沿和下降沿为中断请求 |

#### 参数 EXTI_LineCmd

EXTI_LineCmd 用来定义选中线路的新状态。它可以被设为 ENABLE 或者 DISABLE。

例：

```c 
/* Enables external lines 12 and 14 interrupt generation on falling edge */ 

EXTI_InitTypeDef EXTI_InitStructure; 

EXTI_InitStructure.EXTI_Line = EXTI_Line12 | EXTI_Line14; 
EXTI_InitStructure.EXTI_Mode = EXTI_Mode_Interrupt;
EXTI_InitStructure.EXTI_Trigger = EXTI_Trigger_Falling; 
EXTI_InitStructure.EXTI_LineCmd = ENABLE; 

EXTI_Init(&EXTI_InitStructure); 
```

### 函数 EXTI_GetITStatus 

**Table 12.** 函数 **EXTI_GetITStatus** 

| 函数名     | EXTI_GetITStatus                                             |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | ITStatus EXTI_GetITStatus(u32  EXTI_Line)                    |
| 功能描述   | 检查指定的  EXTI 线路触发请求发生与否                        |
| 输入参数   | EXTI_Line：待检查 EXTI 线路的挂起位参阅 Section：EXTI_Line 查阅更多该参数允许取值范围（表） |
| 输出参数   | 无                                                           |
| 返回值     | **EXTI_Line 的新状态（SET  或者 RESET）**                    |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

函数原型：

```c title="函数原型"
/**
  * @brief  Checks whether the specified EXTI line is asserted or not.
  * @param  EXTI_Line: specifies the EXTI line to check.
  *   This parameter can be:
  *     @arg EXTI_Linex: External interrupt line x where x(0..19)
  * @retval The new state of EXTI_Line (SET or RESET).
  */
ITStatus EXTI_GetITStatus(uint32_t EXTI_Line)
{
  ITStatus bitstatus = RESET;
  uint32_t enablestatus = 0;
  /* Check the parameters */
  assert_param(IS_GET_EXTI_LINE(EXTI_Line));
  
  enablestatus =  EXTI->IMR & EXTI_Line;
  if (((EXTI->PR & EXTI_Line) != (uint32_t)RESET) && (enablestatus != (uint32_t)RESET))
  {
    bitstatus = SET;
  }
  else
  {
    bitstatus = RESET;
  }
  return bitstatus;
}
```

例： 

```c title="例"
/* Get the status of EXTI line 8 */ 

ITStatus EXTIStatus; 

EXTIStatus = EXTI_GetITStatus(EXTI_Line8); 
```

---

### 函数 EXTI_ClearITPendingBit 

**Table 13.** 函数 **EXTI_ClearITPendingBit** 

| 函数名     | EXTI_ClearITPendingBit                                       |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void EXTI_ClearITPendingBit(u32  EXTI_Line)                  |
| 功能描述   | 清除  EXTI 线路挂起位                                        |
| 输入参数   | EXTI_Line：待清除 EXTI 线路的挂起位参阅 Section：EXTI_Line 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

例： 

```c title="例"
/* Clears the EXTI line 2 interrupt pending bit */ 
EXTI_ClearITPendingBit(EXTI_Line2); 
```

### 函数 GPIO_EXTILineConfig

**Table 14.     GPIO_EXTILineConfig**

| 函数名      | GPIO_EXTILineConfig                                          |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void GPIO_EXTILineConfig(u8  GPIO_PortSource, u8 GPIO_PinSource) |
| 功能描述    | 选择 GPIO 管脚用作外部中断线路                               |
| 输入参数  1 | GPIO_PortSource: 选择用作外部中断线源的 GPIO 端口参阅 Section：GPIO_PortSource  查阅更多该参数允许取值范围 |
| 输入参数  2 | GPIO_PinSource：待设置的外部中断线路该参数可以取 GPIO_PinSourcex(x  可以是 0-15) |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**函数原型:**

```c title="函数原型"
/**
  * @brief  Selects the GPIO pin used as EXTI Line.
  * @param  GPIO_PortSource: selects the GPIO port to be used as source for EXTI lines.
  *   This parameter can be GPIO_PortSourceGPIOx where x can be (A..G).
  * @param  GPIO_PinSource: specifies the EXTI line to be configured.
  *   This parameter can be GPIO_PinSourcex where x can be (0..15).
  * @retval None
  */
void GPIO_EXTILineConfig(uint8_t GPIO_PortSource, uint8_t GPIO_PinSource)
{
  uint32_t tmp = 0x00;
  /* Check the parameters */
  assert_param(IS_GPIO_EXTI_PORT_SOURCE(GPIO_PortSource));
  assert_param(IS_GPIO_PIN_SOURCE(GPIO_PinSource));
  
  tmp = ((uint32_t)0x0F) << (0x04 * (GPIO_PinSource & (uint8_t)0x03));
  AFIO->EXTICR[GPIO_PinSource >> 0x02] &= ~tmp;
  AFIO->EXTICR[GPIO_PinSource >> 0x02] |= (((uint32_t)GPIO_PortSource) << (0x04 * (GPIO_PinSource & (uint8_t)0x03)));
}
```

**例：**

```c title="例子"
/* Selects PB.08 as EXTI Line 8 */ 

GPIO_EXTILineConfig(GPIO_PortSourceGPIOB, GPIO_PinSource8);//选择GPIOB8号引脚作为外部中断线路
```

---

 
