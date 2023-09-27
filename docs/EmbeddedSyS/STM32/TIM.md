---
comments: true
---
# 定时器

## 前言

==**需要了解的基本知识:**==

1. **频率（frequency）**：是**单位时间内**完成**周期性变化**的**次数**，是描述周期运动频繁程度的**量**，常用符号  *f* 或 *ν*  表示，单位为秒分之一，符号为s^-1^。
2. **赫兹(HZ)**：是国际单位制中**频率的单位**，它是每秒钟的周期性变动重复次数的计量。

> 1MHz =1000kHz=1000 000 Hz。

3. **周期（T）**：物体作**往复运动**或**物理量作周而复始**的变化时，**重复一次**所经历的**时间**。物体或物理量（如交变电流、电压等）完成一次振动（或振荡）所经历的时间。

> 1s(秒) =1000毫秒=1000 000 (微秒) =1000 000 000 (纳秒)。

4. **频率与周期的关系式为f=1/T，二者成反比。**

==**从时钟源入手了解定时器：**==

> 用户可通过多个预分频器配置AHB、高速APB(APB2)和低速APB(APB1)域的频率。AHB和 APB2域的最大频率是72MHz。APB1域的最大允许频率是36MHz。

**时钟源相关的知识:** 通常情况下配置AHB=72MHz，APB1的预分频器的分频系数为2，刚好PCLK1=36MHz，此时TIMxCLK = （AHB/2）*2=72MHz。对于该**TIMxCLK时钟**是TIM2~7的公共时钟源，TIM1和TIM8则是在**APB2**,通常情况下也是72MHZ.

![RCC_TIM6-7](https://pic.imgdb.cn/item/6513ce9fc458853aef34fa13/RCC_TIM6-7.png)

## 定时器的介绍

从《STM32中文参考手册》的目录上我们就可以发现，STM32F103定时器可以分为**三种**(根据复杂度和应用场景):

| **类型**   | **编号**               | 计数器模式          | **总线** | **功能**                                                     |
| ---------- | ---------------------- | ------------------- | -------- | ------------------------------------------------------------ |
| 高级定时器 | TIM1、TIM8             | 向上、向下、向上/下 | APB2     | 拥有通用定时器全部功能，并额外具有重复计数器、死区生成、互补输出、刹车输入等功能 |
| 通用定时器 | TIM2、TIM3、TIM4、TIM5 | 向上、向下、向上/下 | APB1     | 拥有基本定时器全部功能，并额外具有内外时钟源选择、输入捕获、输出比较、编码器接口、主从触发模式等功能 |
| 基本定时器 | TIM6、TIM7             | 向上                | APB1     | 拥有定时中断、**主模式触发DAC的功能**、产生DMA请求           |

**计数器模式一共有三种:**

* **向上计数:**  计数器从0开始计数，一直加到重装载值，然后产生一个中断(溢出事件)，然后又从0开始计数，如此往复。

* **向下计数:**  跟向上计数是一个意思，就是过程反过来了，它从重装载值开始计数，一直减到到0，然后回到重装栽植，同时申请中断(溢出事件)，继续下一轮，如此往复

* **向上向下双向计数又称中央对齐计数:** 计数器从0开始计数到重装载值，产生一个中断(溢出事件)，然后又从重装载值开始递减到0，又产生一个中断(溢出事件)。

![CounteMode](https://pic.imgdb.cn/item/6513ce9ec458853aef34f945/CounteMode.png)

这三种模式，从本质上来说没有任何区别，一般使用向上计数模式。

### 基本定时器

---

#### 基本定时器的工作流程

---

从TIMxCLK时钟，到PSC预分频器，再到计数器，计数器从0不断自增，同时不断地与自动重装寄存器比较，值相等时，即定时时间到，这时就会产生一个更新中断/更新事件，计数器值重新变成0，就这样循始往复。

#### 基本定时器的结构

---

![Block_TIM6-7](https://pic.imgdb.cn/item/6513ce9fc458853aef34f9b6/Block_TIM6-7.png)

* ==**内部时钟(CK_INT)**==

  * 来自RCC的**TIMxCLK时钟** 通常时钟频率是72MHZ

* ==**时基单元**==

  * **预分频器寄存器 (TIMx_PSC)(16位寄存器)** --- 对输入的时钟频率进行预分频

    * >  **预分频** 可以以系数介于1至65536之间的任意数值对计数器时钟分频。它是通过一个16位寄存器 (TIMx_PSC)的计数实现分频。因为TIMx_PSC控制寄存器具有缓冲，可以在运行过程中改变它 的数值，新的预分频数值将在下一个更新事件时起作用。

    * > 框图有些寄存器带有**阴影效果** ---> 这表示在物理上这个寄存器对应2个寄存器：一个是我们可以可以写入或读出的寄存器，称为**预装载(控制)寄存器**，另一个是我们看不见的、无法真正对其读写操作的，但在使用中会起作用的寄存器，称为**影子寄存器**.

    * **预分频器控制寄存器:** 用来配置分频系数的寄存器 --> 我们直接操作写入的寄存器 --> 也就是我们认为的 TIMx_PSC

    * **预分频缓冲器(影子寄存器):** 作用是：定时器启动后 **再次更改** 分频值(TIMx_PSC)的值并不会立即影响当前定时器的时钟频率，要等到下一个更新事件（UEV）发生时才会生效  ~以后补充什么是更新事件~

    * **预分频计数器:** 定时器的 **时钟源TIMxCLK 每嘀嗒一次，预分频器计数器值+1，直到达到预分频器的设定值 -- TIMx_PSC(寄存器写入的值)，然后再嘀嗒一次后计数器归零**，同时，**TIMx_CNT计数器值+1**。

    * > * --> 向该寄存器写 0 实际上是系数 = 1分频 
      > * --> 向该寄存器写 1 实际上是系数 = 2分频
      > * ···
      > * --> 向该寄存器写 65535 实际上是系数 = 65536分频
      >
      > **预分频器的作用:** 
      >
      > 由于来自RCC的**TIMxCLK时钟** 时钟频率可能是72MHZ，体现在16位的定时器上的效果就是从0计数到65535上溢只需要0.9毫秒，如果我们需要更长时间的定时间隔，那么就需要预分频器对时钟进行分频处理，以降低定时器时钟(CK_CNT)的频率；亦或者可以通过调解预分频器来达到我们想要的计时效果。

    * ![PSC_SequenceChat](https://pic.imgdb.cn/item/6513ce99c458853aef34f677/PSC_SequenceChat.png)

    * > 通过上图我们就可以得出**计数器计数频率**：$$CK\underline{\phantom{l}}CNT = \cfrac {CK\underline{\phantom{l}PSC}}{PSC + 1 }$$（PS：CK_PSC是时钟源，PSC是向寄存器写入的分频数）

  * **计数器寄存器(TIMx_CNT)(16位寄存器)** --- 计数器使用预分频后的时钟频率 $$CK\underline{\phantom{l}}CNT = \cfrac {CK\underline{\phantom{l}PSC}}{PSC + 1 }$$ 进行计数，当计数时钟每来一个上升沿，计数器加一，计数器可以累计从 0--> 65535-->0 完成一个循环，当自增行为到达**目标值**时，就可以产生中断，完成了定时任务![CNT_SequenceChat](https://pic.imgdb.cn/item/6513ce97c458853aef34f5e7/CNT_SequenceChat.png)

    > 通过上图我们就可以知道**计数器溢出频率**: $$CK\underline{\phantom{l}}CNT\underline{\phantom{l}}OV = \cfrac {CK\underline{\phantom{l}CNT}}{ARR + 1 } = \cfrac{CK\underline{\phantom{l}}PSC}{{\cfrac{PSC + 1}{ARR + 1}}}$$ （PS：CK_PSC是时钟源，PSC是向寄存器写入的分频数，CK_CNT是计数器计数频率，ARR是重装栽值，因为ARR是从0开始增加的，所以是ARR+1）

  * **自动装载寄存器 (TIMx_ARR) **  --- 存储目标值的任务，**是固定的目标**，计数器从0累加计数到自动重装载数值(TIMx_ARR寄存器)，然后重新从0开始计数并产生一个计数器溢出事件。![TIMx_ARR--shadow](https://pic.imgdb.cn/item/6513ce97c458853aef34f568/TIMx_ARR--shadow.png)
  
    ![TIMx_ARR--shadow2](https://pic.imgdb.cn/item/6513ce95c458853aef34f4bb/TIMx_ARR--shadow2.png)
  
    > 自动装载寄存器(TIMx_ARR)可以控制ARPE来决定是否启用影子寄存器 -->函数 TIM_ARRPreloadConfig
  

> **定时器计时方法举例:**
>
> 我们将**预分频寄存器**和**自动重装载寄存器**都调到 65535，首先设置使用时钟源为 72MHz，然后经过设置PSC系数为 65536 分频，然后计数器 每次从 0 计数到 65535 触发一次中断，在此情况下为定时器**最长的计时时间**即为 $\cfrac{1}{{\cfrac{72MHZ}{65536}}}\times 65536 = 59.65s$  。

#### 基本定时器的功能(部分)

---

**主模式触发DAC的功能：**内部硬件在不受程序的控制下实现自动运行，通过更新事件映射到 触发控制器的TRGO 中，然后TRGO直接接到DAC的触发转换引脚上，整个过程不需要软件的的参与(利用中断机制，当某一条件达成，进入中断控制DAC)，实现了硬件的自动化

### 通用定时器

---

#### 通用定时器的工作流程

**选择时钟源**（来自RCC的TIMxCLK时钟源；TIMx_ETR引入的外部时钟源；TIM级联；使用TI1F_ED 边沿 输入捕获时钟源；使用TI1FP1或者TI2FP2引入输入捕获时钟源）到**PSC预分频器**，再到**计数器**，计数器从0不断自增，同时不断地与自动重装寄存器比较，值相等时，即定时时间到，这时就会产生一个更新中断/更新事件，计数器值重新变成0，就这样循始往复。

#### 通用定时器的结构

---

![Block_TIM2-5](https://pic.imgdb.cn/item/6513ce9ec458853aef34f8d3/Block_TIM2-5.png)

**在基础定时器的基础结构上增加: 更多的时钟源，输入捕获和输出捕获** 

**计数器时钟可由下列时钟源提供：** 

![TIM_RCC](https://pic.imgdb.cn/item/6513ce9cc458853aef34f79d/TIM_RCC.png)

* 内部时钟(CK_INT) 
  * 来自RCC的==**TIMxCLK时钟**== 通常时钟频率是72MHZ

* 外部时钟模式1：外部输入脚(TIx) 

  * TRGI(Trigger InPut)

    * 主要用做触发输入来使用，可以触发定时器的从模式

    * 也可以用作外部时钟来使用，**引入的时钟源有:**

      * ①可以使用==**ETR引脚**==引入的外部时钟，就是相当于 **外部时钟模式2** 只不过占用触发输入通道

      * ②使用==**ITR**(TIMx内部触发连接 也叫做 **内部触发输入(ITRx)**)==引入的时钟--->TIM的级联 -- 使用一个定时器作为另一个定时器的预分频器，如 可以配置一个定时 器Timer1而作为另一个定时器Timer2的预分频器。![TIMx_Cascade-Connection](https://pic.imgdb.cn/item/6513ce9cc458853aef34f801/TIMx_Cascade-Connection.png)

      * > 举例: 我们先初始化 TIM1，然后使用主模式把它的更新事件映射到 TRGO。然后看上表，TIM1 的TRGO 连接到了 TIM2 的 ITR0 上，所以我们接下来初始化 TIM2，选择 ITR0 通道，作为时钟源(TIM1)，并选择外部时钟模式 1，就完成了 TIM1 到 TIM2 的级联。

      * ③使用==**TI1F_ED**==(输入捕获单元的CH1引脚，ED(Edge边沿的意思))引入的时钟，通过这一路的时钟，上升沿和下降沿均有效

      * 使用==**④TI1FP1**和**⑤TI2FP2**==引入的时钟-->输入捕获的脉冲

  * ![ETR1_TIM2-5](https://pic.imgdb.cn/item/6513ce9cc458853aef34f7cf/ETR1_TIM2-5.png)

* 外部时钟模式2：外部触发输入(ETR)  
  * ==**TIMx_ETR(可通过引脚手册查询对应TIM的ETR引脚)**== 对应的引脚接入外部时钟(可以向其输入方波波形)供定时器使用![ETR2_TIM2-5](https://pic.imgdb.cn/item/6513ce9dc458853aef34f870/ETR2_TIM2-5.png)

---

### 高级定时器

#### 高级定时器的结构

---

![Block_TIM1_TIM8](https://pic.imgdb.cn/item/6513ce9ac458853aef34f74d/Block_TIM1_TIM8.png)

==**以下为通用定时器的基础上增加:**==

* **重复次数计数器**：可实现每隔几个计数周期，再发生中断或者事件 --> 相当于 对输出的更新信号再次做出分频

> 在上文中，我们在时钟源为72MHZ的情况下，最大的一次定时时间为59.65s，加上重复次数计数器后 这个数值可以变成
>
> $59.65s \times 65536 = 3909.37s = 65.156min $ 这样一个高级定时器一次定时时间最大可达1个多小时了。

* DTG(Dead Time Generate)死区生成电路：可在开关切换期间，生成一段时间的死区，防止直通现象
* TIMx_BKIN(Break IN)：刹车输入信号 和 时钟失效事件 --> 为了给电机驱动提供安全保障 
* 在输出比较中 新增两个互补输出

## 定时中断基本结构

![TIM_Interrupt](https://pic.imgdb.cn/item/6513ce9ac458853aef34f6cb/TIM_Interrupt.png)

## 定时器基础功能--实战演练

### 使用内部时钟--定时器计数

`Timer.h`

```c
#ifndef  __TIMER_H__//如果没有定义了则参加以下编译
#define  __TIMER_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h" 

void Timer_Init(void);

extern uint16_t num ;

#endif  //结束编译
```

`Timer.c`

```c
#include "Timer.h"

uint16_t num = 0; 

void Timer_Init(void)
{
  //1.开启时钟
  RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2,ENABLE);//开启定时器2时钟
  //2.初始化TIM定时器
  TIM_InternalClockConfig(TIM2); //设置TIM2使用内部时钟 -- 可不写 原因--STM32默认使用内部时钟
  
  TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure; //定义定时器初始化结构体

  //CK_CNT_OV = CK_PSC / (PSC + 1) / (ARR + 1) 通过这个公式可得出 设置1HZ频率 每1S更新中断加一，72000000/7200/10000
  TIM_TimeBaseStructure.TIM_Period = 10000 - 1; //自动重装载寄存器周期的值 

  TIM_TimeBaseStructure.TIM_Prescaler = 7200 - 1; //预分频值

  TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1; //滤波频率 1分频 也就是 不分频使用系统时钟频率
  
  TIM_TimeBaseStructure.TIM_RepetitionCounter = 0; //重复计数器只要高级定时器才有 --TIM1/TIM8
  
  TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up; //定时器模式 -- 向上计数
  
  TIM_TimeBaseInit(TIM2, & TIM_TimeBaseStructure);//初始化定时器2
  
  /*
  当调用初始化定时器函数后，函数内部最后有以下这个步骤， 
  
  Generate an update event to reload the Prescaler and the Repetition counter values immediately 
  
  翻译过来就是 -- 生成更新事件以立即重新加载预分频器和重复计数器值
  
  TIMx->EGR = TIM_PSCReloadMode_Immediate; 
  
  是因为预分频器是有一个 缓冲寄存器(影子寄存器)的，必须在更新事件后，向寄存器写入的分频数PSC才会起作用
  
  所以在最后手动启动了一个更新事件，这样预分频器的值就有效了，但是副作用就是，更新事件和更新中断，
  
  更新中断会置更新中断标志位，之后一旦初始化完成，更新中断会立刻进入 ==>刚一上电 就进入中断 数字显示1
  
  解决方法 在中断上面 加入 TIM_ClearFlag(TIM2, TIM_FLAG_Update);//清除中断状态标志位
  
  */
  
  TIM_ClearFlag(TIM2, TIM_FLAG_Update);//清除中断状态标志位
  //3.配置中断输出控制函数
  TIM_ITConfig(TIM2, TIM_IT_Update, ENABLE ); //TIM2配置中断输出控制 -- 更新中断
  //4.初始化外部中断函数
  NVIC_InitTypeDef NVIC_InitStructure; //定义结构体
  
  NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn; //根据上面的我们所选取的是定时器2 -- 在中断通道的TIM2 所以这里选择 TIM2_IRQn

  NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 2;//这里选择的是抢占 2

  NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1; //这里选择的是响应1

  NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE; //使能指定的中断通道
  //初始化函数↓
  NVIC_Init(&NVIC_InitStructure);
  
  TIM_Cmd(TIM2, ENABLE); //使能定时器2
}

void TIM2_IRQHandler(void)
{
    if(TIM_GetITStatus(TIM2,TIM_IT_Update) == SET)
  {
    
    num++;
    TIM_ClearITPendingBit(TIM2,TIM_IT_Update);
    
  }
  
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "IRED.h"
#include "Timer.h"


int main(void)
{
  OLED_Init();
  
  OLED_ShowString(1,1,"Count:");
    
  OLED_ShowString(2,1,"TIMCount:");
    
  NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);//进行分组 -->整个芯片(一个项目中)只能进行一次中断分组 
 
  Timer_Init();
  
  while(1)
  {
    OLED_ShowNum(1,7,num,4);//计数器累加
    OLED_ShowNum(2,10,TIM_GetCounter(TIM2),5);//CNT计数器值的变化 -- 0000 --> 9999 --> 0000
  }
}
```

### 使用外部时钟模式2 -- 定时器计数

==**注意：PA0引脚是TIM2的ETR引脚**==

`Timer.h`

```c
#ifndef  __TIMER_H__//如果没有定义了则参加以下编译
#define  __TIMER_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h" 

void Timer_Init(void);
uint16_t Timer_GetCounter(void);

extern uint16_t Num ;

#endif  //结束编译
```

`Timer.c`

```c
#include "Timer.h"

uint16_t Num = 0; 

void Timer_Init(void)
{
  //1.开启时钟
  RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2,ENABLE);//开启定时器2时钟
  
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA,ENABLE);
  
   //2.初始化IO口
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;//设置PA0引脚
  
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU ;//设置为上拉输入（防止电平跳动 而不适用手册中推荐的浮空输入 --> 在外部输入信号功率很小的时候 推荐使用浮空输入 防止上拉电阻影响）
  
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ（可以不设置）
  
  //初始化函数↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  
  //3.初始化TIM定时器
  TIM_ETRClockMode2Config(TIM2,TIM_ExtTRGPSC_OFF,TIM_ExtTRGPolarity_Inverted,0x04); //设置TIM2使用外部时钟，并且建议配置滤波频率，可以防止电平抖动 大于等于0X03基本上就稳定了
  
  TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure; //定义定时器初始化结构体

  TIM_TimeBaseStructure.TIM_Period = 10 - 1; //自动重装载寄存器周期的值 -- 每挡住10下 更新一次中断 Num+1

  TIM_TimeBaseStructure.TIM_Prescaler = 1 - 1; //预分频值 -- 手动的挡住红外对射的频率 -- 所以就不分频了

  TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1; //滤波频率 1分频 也就是 不分频使用我们上方定义的频率
  
  TIM_TimeBaseStructure.TIM_RepetitionCounter = 0; //重复计数器只要高级定时器才有 --TIM1/TIM8
  
  TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up; //定时器模式 -- 向上计数
  
  TIM_TimeBaseInit(TIM2, & TIM_TimeBaseStructure);//初始化定时器2
  
  TIM_ClearFlag(TIM2, TIM_FLAG_Update);//清除中断状态标志位
  
  //4.配置中断输出控制函数
    
  TIM_ITConfig(TIM2, TIM_IT_Update, ENABLE ); //TIM2配置中断输出控制 -- 更新中断
  
  //5.初始化外部中断函数

  NVIC_InitTypeDef NVIC_InitStructure; //定义结构体
  
  NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn; //根据上面的我们所选取的是定时器2 -- 在中断通道的TIM2 所以这里选择 TIM2_IRQn

  NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 2;//这里选择的是抢占 2

  NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1; //这里选择的是响应1

  NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE; //使能指定的中断通道
  //初始化函数↓
  NVIC_Init(&NVIC_InitStructure);
  
  TIM_Cmd(TIM2, ENABLE); //使能定时器2
}

uint16_t Timer_GetCounter(void)//封装一下函数 亦可以不要 直接使用 TIM_GetCounter(TIM2);这个函数
{
  return TIM_GetCounter(TIM2);//返回计数器的值
}

void TIM2_IRQHandler(void)
{
  if(TIM_GetITStatus(TIM2,TIM_IT_Update) == SET)
  {   
    Num++;
    TIM_ClearITPendingBit(TIM2,TIM_IT_Update);  
  }
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "IRED.h"
#include "Timer.h"

int main(void)
{
  NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);//进行分组 -->整个芯片(一个项目中)只能进行一次中断分组 
    
  OLED_Init();
  
  OLED_ShowString(1,1,"Count:");
    
  OLED_ShowString(2,1,"TIMCount:");
    
  Timer_Init();
  
  while(1)
  {
    OLED_ShowNum(1,7,Num,4);//计数器累加
    OLED_ShowNum(2,10,Timer_GetCounter(),5);//CNT计数器值的变化 -- 0000 --> 9999 --> 0000
  }
}
```



## 定时器进阶功能

### PWM--简介

**PWM（Pulse Width Modulation）脉冲宽度调制:**在具有==**惯性**==的系统中，可以通过对一系列脉冲的宽度进行调制，来等效地获得所需要的模拟参量，常应用于电机控速等领域

**PWM参数：**

* 脉冲周期（T）：单位是时间，比如秒（s）、纳秒（ns）、微妙（μs）、毫秒（ms）等；

* 脉冲频率（f）：单位是赫兹（Hz）、千赫兹（kHz）等，与脉冲周期成倒数关系，f=1/T；

* 脉冲宽度（W）：简称“脉宽”，是脉冲高电平持续的时间。单位是时间，比如秒（s）、纳秒（ns）、微妙（μs）、毫秒（ms）等；

* 占空比（D）：脉宽除以脉冲周期的值，百分数表示，比如50%。也常有小数或分数表示的，比如0.5或1/2。

![PWM](https://pic.imgdb.cn/item/6513ce93c458853aef34f33a/PWM.webp)

**PWM公式:**

* 脉宽:  $$W = Ton$$

* 周期:   $$T = Ton + Toff=\cfrac 1f$$

* 占空比：$$D = \cfrac{Ton}{Ton+Toff} = \cfrac{Ton}{T}$$

* 分辨率 = 占空比变化步距（占空比的最小变化单位）

### 定时器--输出比较

**OC（Output Compare）输出比较**:

输出比较可以通过比较CNT与CCR寄存器值的关系，来对输出电平进行置1、置0或翻转的操作，用于输出一定频率和占空比的PWM波形

**CC (Compare/Capture) 输入捕获和输出比较的单元:**

![CCR](https://pic.imgdb.cn/item/6513ce94c458853aef34f3ba/CCR.png)

每个高级定时器和通用定时器都拥有4个**输出比较通道**,高级定时器的前3个通道额外拥有死区生成和互补输出的功能

![OC_Flow](https://pic.imgdb.cn/item/6513ce92c458853aef34f2ff/OC_Flow.png)

**输出模式控制器的8种模式:**

| **模式**         | **描述**                                                     |
| ---------------- | ------------------------------------------------------------ |
| 冻结             | CNT=CCR时，REF保持为原状态                                   |
| 匹配时置有效电平 | CNT=CCR时，REF置有效电平                                     |
| 匹配时置无效电平 | CNT=CCR时，REF置无效电平                                     |
| 匹配时电平翻转   | CNT=CCR时，REF电平翻转  --> 占空比始终为50% -- 输出波形的频率 = 更新事件频率/2 (两次计数一个周期) |
| 强制为无效电平   | CNT与CCR无效，REF强制为无效电平                              |
| 强制为有效电平   | CNT与CCR无效，REF强制为有效电平                              |
| **PWM模式1**     | **向上计数**：CNT<CCR时，REF置有效电平，CNT≥CCR时，REF置无效电平                                                                       向下计数：CNT>CCR时，REF置无效电平，CNT≤CCR时，REF置有效电平 |
| PWM模式2         | 向上计数：CNT<CCR时，REF置无效电平，CNT≥CCR时，REF置有效电平                                                                 向下计数：CNT>CCR时，REF置有效电平，CNT≤CCR时，REF置无效电平 |

**一些输出比较的库函数：**

```c
TIM_OC1FastConfig(TIM_TypeDef* TIMx, uint16_t TIM_OCFast);//用来配置快速使能，在单模冲模式小节中有介绍

TIM_ClearOC1Ref(TIM_TypeDef* TIMx, uint16_t TIM_OCClear);//在外部事件时清除ref信号中有介绍

//单独数据更改

/*单独修改输出比较极性，带N的是高级定时器的互补配置，OC4没有互补通道*/
TIM_OC1PolarityConfig(TIM_TypeDef* TIMx, uint16_t TIM_OCPolarity);
TIM_OC1NPolarityConfig(TIM_TypeDef* TIMx, uint16_t TIM_OCNPolarity);

/*单独修改输出使能参数*/
TIM_CCxCmd(TIM_TypeDef* TIMx, uint16_t TIM_Channel, uint16_t TIM_CCx);
void TIM_CCxNCmd(TIM_TypeDef* TIMx, uint16_t TIM_Channel, uint16_t TIM_CCxN);

/*单独选择输出比较模式*/
TIM_SelectOCxM(TIM_TypeDef* TIMx, uint16_t TIM_Channel, uint16_t TIM_OCMode);

/*单独更改CCR寄存器值的函数 --> 修改占空比*/
TIM_SetCompare1(TIM_TypeDef* TIMx, uint16_t Compare1);
```

### 定时器--PWM功能

![PWM_STM32](https://pic.imgdb.cn/item/6513ce92c458853aef34f2db/PWM_STM32.png)

**PWM_STM32公式:**

PWM频率：$$Frep = \cfrac{CK\underline{\phantom{l}}PSC}{{\cfrac{PSC + 1}{ARR + 1}}}$$ （和**计数器溢出频率**大小是一样的）

PWM占空比：$$ Duty = \cfrac {CCR}{ARR+1}$$

PWM分辨率：$$RESO = \cfrac{1}{ARR+1}$$ (占空比变化的最小步距)

---

### AFIO--引脚重映射功能

```c
//注意：1. 并不是所有的功能都可以重映射的，只有在重定义表中查询到，才可以重映射
//     2. 在有的I/O口是上电后就默认有复用功能的，所以想将它默认使用普通GPIO时需要解除其之前的复用功能
RCC_APB2PeriphClockCmd(RCC_APB2Periph_AFIO,ENABLE);//开启AFIO时钟 -- 引脚重映射功能

/*
引脚重映射配置函数 
GPIO_PinRemapConfig(uint32_t GPIO_Remap, FunctionalState NewState);
*/

GPIO_PinRemapConfig(GPIO_PartialRemap1_TIM2,ENABLE);//选用部分重映射方式一 --> 使TIM2的OC1通道映射到PA15 -- 查看STM32中文参考手册 P119表43
   
/*
由于PA15是调试端口，不是普通的GPIO口，所以我们在使用前需要 解除其功能
    
其中有三个关于解除调试端口的参数：
              	* @arg GPIO_Remap_SWJ_NoJTRST  //关闭NJTRST -- 使PB4变成普通GPIO口    
              	* @arg GPIO_Remap_SWJ_JTAGDisable //关闭 JTAG的 --使PA15,PB3,PB4变成普通GPIO口
                * @arg GPIO_Remap_SWJ_Disable  //关闭所有的SW和JTAG的调试端口--PA13，PA14,PA15,PB3,PB4变成普通GPIO口 -- 慎用！！！下载程序后就会没有调试端口 -- 解决办法 使用串口下载进去新程序
    
其中:SWJ就是:SWD和JTAG这两种调试方式的含义
*/
GPIO_PinRemapConfig(GPIO_Remap_SWJ_JTAGDisable,ENABLE);//引脚重映射配置函数 -- 解除PA15的调试端口功能
```

![AFIO_Remap](https://pic.imgdb.cn/item/6513ce8fc458853aef34f0a6/AFIO_Remap.png)

![IO_AFIO](https://pic.imgdb.cn/item/6513ce8ec458853aef34eff8/IO_AFIO.png)

---

### 定时器进阶实战--呼吸灯小灯

==**注意:**==

1. ==**TIM2的PWM的OC1通道输出在PA0引脚 -- 看引脚手册**==
2. ==**PWM1模式是高电平有效 --> 高电平是占空比 --> 小灯正极接到PA0引脚**==

`PWM.h`

```c
#ifndef  __PWM_H__//如果没有定义了则参加以下编译
#define  __PWM_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"

void PWM_Init(void);
void PWM_SetCompare1(uint16_t Compare);

#endif  //结束编译
```

`PWM.c`

```c
#include "PWM.h"

void PWM_Init(void)
{
  //1.开启时钟
  RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2,ENABLE);//开启定时器2时钟
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA,ENABLE);//开启GPIOA时钟
  
   /*
  //这三句是为了使用一下重映射功能，如果要用--记得将下面GPIO初始化PA0改成PA15
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_AFIO,ENABLE);//开启AFIO时钟 -- 引脚重映射功能
  
  GPIO_PinRemapConfig(GPIO_PartialRemap1_TIM2,ENABLE);//引脚重映射配置函数 -- 选用部分重映射1 
  
  GPIO_PinRemapConfig(GPIO_Remap_SWJ_JTAGDisable,ENABLE);//引脚重映射配置函数 -- 解除PA15的调试端口功能
  
  */
    
  //2.初始化IO口 -- > 是因为TIM2的PWM的OC1通道输出在PA0引脚 -- 看引脚手册
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;//设置PA0引脚
  
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP ;//设置为复用推挽输出 -- 使用片上外设输出
  
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  
  //初始化函数↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  
  //3.初始化TIM定时器 -- 初始化 -- 设置PWM频率1000HZ 占空比0% 分辨率1%
  
  TIM_InternalClockConfig(TIM2); //设置TIM2使用内部时钟 -- 可不写 原因--STM32默认使用内部时钟
  
  TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure; //定义定时器初始化结构体

  //CK_CNT_OV = CK_PSC / (PSC + 1) / (ARR + 1) 通过这个公式可得出 设置1000HZ频率 每1ms加一，72000000/720/100
  TIM_TimeBaseStructure.TIM_Period = 100 - 1; //自动重装载寄存器周期的值 

  TIM_TimeBaseStructure.TIM_Prescaler = 720 - 1; //预分频值

  TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1; //滤波频率 1分频 也就是 不分频使用系统时钟频率
  
  TIM_TimeBaseStructure.TIM_RepetitionCounter = 0; //重复计数器只要高级定时器才有 --TIM1/TIM8
  
  TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up; //定时器模式 -- 向上计数
  
  TIM_TimeBaseInit(TIM2, & TIM_TimeBaseStructure);//初始化定时器2
  
  /* Configures the TIM2 OC1 in PWM1 Mode */ 

  TIM_OCInitTypeDef TIM_OCInitStructure; 

  /*
  *因为 我们只需要给下面部分结构体成员设置初始值,而结构体里面的成员有些没有使用到(比如高级定时器的部分),导致一些不确定的因素
  *所以 为了避免这些不确定的因素 我们使用TIM_OCStructInit函数 设置默认值
  */

  TIM_OCStructInit(& TIM_OCInitStructure); 

  TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1; //设置输出模式
  
  TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High; //设置输出比较模式的极性

 /*
  *  TIM_OCPolarity_High , 高极性 极性不翻转 REF波形直接输出 高电平  (有效电平)
  *  TIM_OCPolarity_Low , 低极性，极性不翻转 REF波形直接输出 低电平  (有效电平) 
  */
    
  TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;//设置输出使能
  
  TIM_OCInitStructure.TIM_Pulse = 0; //设置CCR --> 占空比 --> 正好对应主函数中呼吸灯从暗到灭
  
  TIM_OC1Init(TIM2, & TIM_OCInitStructure); //选择TIM2 的 OC1通道 输出PWM波形  使用引脚手册查看输出到那个引脚上了  -- 这里是OC1 == CH1通道
  
  TIM_Cmd(TIM2, ENABLE); //使能定时器2
  
}

void PWM_SetCompare1(uint16_t Compare)
{
  TIM_SetCompare1(TIM2,Compare);/*单独更改CCR1寄存器值的函数 --> 修改占空比*/
}

```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "PWM.h"

uint8_t i ;

int main(void)
{
  PWM_Init();
  while(1)
  {
    for(i = 0; i<100;i++)
    {
      PWM_SetCompare1(i);/*单独更改CCR寄存器值的函数 --> 修改占空比*/
      Delay_ms(10);
    }
    for(i = 0; i<100;i++)
    {
      PWM_SetCompare1(100-i);/*单独更改CCR寄存器值的函数 --> 修改占空比*/
      Delay_ms(10);
    }
  }
}
```

### 定时器进阶实战 -- 舵机控制

**舵机简介:**

舵机是一种根据输入PWM信号占空比来控制输出角度的装置,输入PWM信号要求：**周期为20ms，高电平宽度为0.5ms~2.5ms**

![SG90](https://pic.imgdb.cn/item/6513ce58c458853aef34d6aa/SG90.png)
![SG90_Struct](https://pic.imgdb.cn/item/6513ce58c458853aef34d659/SG90_Struct.png)

`PWM.h`

```c
#ifndef  __PWM_H__//如果没有定义了则参加以下编译
#define  __PWM_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"
void PWM_Init(void);
void PWM_SetCompare2(uint16_t Compare);
#endif  //结束编译

```

`PWM.c`

```c
#include "PWM.h"

void PWM_Init(void)
{
  //1.开启时钟
  RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2,ENABLE);//开启定时器2时钟
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA,ENABLE);//开启GPIOA时钟
  
  //2.初始化IO口 -- > 是因为TIM2的PWM的OC2通道输出在PA1引脚 -- 看引脚手册
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;//设置PA1引脚
  
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP ;//设置为复用推挽输出 -- 使用片上外设输出
  
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  
  //初始化函数↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  
  //3.初始化TIM定时器 -- 舵机要求20ms -- 50HZ 设置PWM频率50HZ  占空比CRR/ARR+1 分辨率1%
  
  TIM_InternalClockConfig(TIM2); //设置TIM2使用内部时钟 -- 可不写 原因--STM32默认使用内部时钟
  
  TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure; //定义定时器初始化结构体

  //CK_CNT_OV = CK_PSC / (PSC + 1) / (ARR + 1) 通过这个公式可得出 设置50HZ频率 每20ms加一，72000000/72/20000
  TIM_TimeBaseStructure.TIM_Period = 20000-1; //自动重装载寄存器周期的值 -- ARR 

  TIM_TimeBaseStructure.TIM_Prescaler = 72 - 1; //预分频值 -- PSC 

  TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1; //滤波频率 1分频 也就是 不分频使用系统时钟频率
  
  TIM_TimeBaseStructure.TIM_RepetitionCounter = 0; //重复计数器只要高级定时器才有 --TIM1/TIM8
  
  TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up; //定时器模式 -- 向上计数
  
  TIM_TimeBaseInit(TIM2, & TIM_TimeBaseStructure);//初始化定时器2
  
  /* Configures the TIM2 OC2 in PWM1 Mode */ 

  TIM_OCInitTypeDef TIM_OCInitStructure; //定义结构体

  /*
  *因为  我们只需要给下面部分结构体成员设置初始值，而结构体里面的成员有些没有使用到(比如高级定时器的部分),导致一些不确定的因素
  *所以  为了避免这些不确定的因素 我们使用TIM_OCStructInit函数 设置默认值
  */

  TIM_OCStructInit(& TIM_OCInitStructure); 

  TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1; //设置输出模式
  
  TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High; //设置输出比较模式的极性
 
 /*
  *  TIM_OCPolarity_High , 高极性 极性不翻转 REF波形直接输出 高电平  (有效电平)
  *  TIM_OCPolarity_Low , 低极性，极性不翻转 REF波形直接输出 低电平  (有效电平)
  *  
  */

  TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;//设置输出使能
  
  TIM_OCInitStructure.TIM_Pulse = 0; //设置CCR --> 占空比 --> 20000 对应 20ms 500对应0.5ms 2500 对应2.5ms
  
  TIM_OC2Init(TIM2, & TIM_OCInitStructure); //选择TIM2 的 OC2通道 输出PWM波形  使用引脚手册查看输出到那个引脚上了  -- 这里是OC2 == CH2通道
  
  TIM_Cmd(TIM2, ENABLE); //使能定时器2
  
  
}

void PWM_SetCompare2(uint16_t Compare)
{
  TIM_SetCompare2(TIM2,Compare);/*单独更改CCR2寄存器值的函数 --> 修改占空比*/
}

```

`Server.h`

```c
#ifndef  __SERVER_H__//如果没有定义了则参加以下编译
#define  __SERVER_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"
#include "PWM.h"
void Server_Init(void);
void Server_SetAngle(float Angle);

#endif  //结束编译

```

`Server.c`

```c
#include "Server.h"

void Server_Init(void)
{
  PWM_Init();
}
/*
  0°  -->  500
  180°-->  2500
  每一度 --> 2000/180
  1° -->  2000/180+500
*/

void Server_SetAngle(float Angle)//设置舵机角度
{
  PWM_SetCompare2(Angle * 2000 / 180 + 500);
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "Timer.h"
#include "Server.h"
#include "Key.h"//请看GPIO--库函数按键控制那一章节

uint8_t KeyNum ;
float Angle;

int main(void)
{
  OLED_Init();
  Key_Init();
  Server_Init();

  OLED_ShowString(1,1,"Angle:");
  
  while(1)
  {
    KeyNum = Key_GetNum();//按键控制舵机角度
    if(KeyNum == 1)
    {
      Angle += 30;
      if (Angle > 180)
      {
        Angle = 0;
      }
    }
    Server_SetAngle(Angle);
    OLED_ShowNum(1,7,Angle,3);
  }
}
```

### 定时器 -- 输入捕获



## 定时器库函数

**Table 458. TIM** 库函数 

| 函数名                          | 描述                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| TIM_DeInit                      | 将外设  TIMx 寄存器重设为缺省值                              |
| **TIM_TimeBaseInit**            | 根据  TIM_TimeBaseInitStruct 中指定的参数初始化 TIMx 的时间基数单位 |
| **TIM_OCxInit**                 | 根据  TIM_OCInitStruct 中指定的参数初始化外设 TIMx           |
| TIM_ICInit                      | 根据  TIM_ICInitStruct 中指定的参数初始化外设 TIMx           |
| TIM_TimeBaseStructInit          | 把 TIM_TimeBaseInitStruct 中的每一个参数按缺省值填入         |
| **TIM_OCStructInit**            | 把 TIM_OCInitStruct 中的每一个参数按缺省值填入               |
| TIM_ICStructInit                | 把 TIM_ICInitStruct 中的每一个参数按缺省值填入               |
| **TIM_Cmd**                     | 使能或者失能  TIMx 外设                                      |
| **TIM _ITConfig**               | 使能或者失能指定的  TIM 中断                                 |
| TIM_DMAConfig                   | 设置  TIMx 的 DMA 接口                                       |
| TIM_DMACmd                      | 使能或者失能指定的  TIMx 的 DMA 请求                         |
| **TIM_InternalClockConfig**     | 设置  TIMx 使用内部时钟                                      |
| **TIM_ITRxExternalClockConfig** | 设置  TIMx 内部触发为外部时钟模式                            |
| **TIM_TIxExternalClockConfig**  | 设置  TIMx 触发为外部时钟                                    |
| **TIM_ETRClockMode1Config**     | 配置  TIMx 外部时钟模式 1                                    |
| **TIM_ETRClockMode2Config**     | 配置  TIMx 外部时钟模式 2                                    |
| **TIM_ETRConfig**               | 配置  TIMx 外部触发(配置ETR引脚的预分频、极性、滤波器这些参数) |
| **TIM_SelectInputTrigger**      | 选择  TIMx 输入触发源 --- 此函数是为了单独配置参数而设置的 从而无需再初始化整个函数 |
| **TIM_PrescalerConfig**         | 设置  TIMx 预分频--- 此函数是为了单独配置参数而设置的 从而无需再初始化整个函数 |
| **TIM_CounterModeConfig**       | 设置  TIMx 计数器模式--- 此函数是为了单独配置参数而设置的 从而无需再初始化整个函数 |
| **TIM_ForcedOC1Config**         | 置 TIMx 输出  1 为活动或者非活动电平                         |
| TIM_ForcedOC2Config             | 置 TIMx 输出  2 为活动或者非活动电平                         |
| TIM_ForcedOC3Config             | 置 TIMx 输出  3 为活动或者非活动电平                         |
| TIM_ForcedOC4Config             | 置 TIMx 输出  4 为活动或者非活动电平                         |
| **TIM_ARRPreloadConfig**        | 使能或者失能  TIMx 在 ARR 上的预装载寄存器                   |
| **TIM_OC1PreloadConfig**        | 使能或者失能 TIMx 在 CCR1 上的预装载寄存器                   |
| TIM_SelectOutputTrigger         | 选择  TIMx 触发输出模式                                      |
| TIM_SelectSlaveMode             | 选择  TIMx 从模式                                            |
| TIM_SelectMasterSlaveMode       | 设置或者重置  TIMx 主/从模式                                 |
| **TIM_SetCounter**              | 设置  TIMx 计数器寄存器值                                    |
| **TIM_SetAutoreload**           | 设置  TIMx 自动重装载寄存器值                                |
| **TIM_GetCounter**              | 获得  TIMx 计数器的值                                        |
| **TIM_GetPrescaler**            | 获得  TIMx 预分频值                                          |
| **TIM_GetFlagStatus**           | 检查指定的  TIM 标志位设置与否                               |
| **TIM_ClearFlag**               | 清除  TIMx 的待处理标志位                                    |
| **TIM_GetITStatus**             | 检查指定的  TIM 中断发生与否                                 |
| **TIM_ClearITPendingBit**       | 清除  TIMx 的中断待处理位                                    |

### 函数 TIM_TimeBaseInit 

**Table 460.** 函数 **TIM_TimeBaseInit** 

| 函数名      | TIM_TimeBaseInit                                             |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void TIM_TimeBaseInit(TIM_TypeDef*  TIMx, TIM_TimeBaseInitTypeDef* TIM_TimeBaseInitStruct) |
| 功能描述    | 根据  TIM_TimeBaseInitStruct 中指定的参数初始化 TIMx 的时间基数单位 |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIMTimeBase_InitStruct：指向结构 TIM_TimeBaseInitTypeDef  的指针，包含了 TIMx 时间基数单位的配置信息    参阅  Section：TIM_TimeBaseInitTypeDef 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**TIM_TimeBaseInitTypeDef structure** 

```c
//TIM_TimeBaseInitTypeDef 定义于文件“stm32f10x_tim.h”： 

typedef struct 

{ 
	u16 TIM_Period;
    u16 TIM_Prescaler; 
    u8 TIM_ClockDivision; 
    u16 TIM_CounterMode; 

} TIM_TimeBaseInitTypeDef; 
```

#### 参数 TIM_Period 

TIM_Period 设置了在下一个更新事件装入活动的自动重装载寄存器周期的值。它的取值必须在 0x0000 和0xFFFF 之间。 

#### 参数 TIM_Prescaler

TIM_Prescaler 设置了用来作为 TIMx 时钟频率除数的预分频值。它的取值必须在 0x0000 和 0xFFFF 之间。 

#### 参数 TIM_ClockDivision

TIM_ClockDivision 设置了时钟分割 -- 这个是用于**滤波分频**的 -- 单片机内如何对进入的时钟进行滤波，剔除毛刺，使用的原理就是，采样频率和采样N个点，在这频率下N个点保持稳定就是稳定的状态，输出。这个频率就是由这个参数决定的，该参数取值见下表。 

**Table 461. TIM_ClockDivision** 值 

| **TIM_ClockDivision** |                  | 描述 |
| --------------------- | ---------------- | ---- |
| TIM_CKD_DIV1          | TDTS =  Tck_tim  |      |
| TIM_CKD_DIV2          | TDTS =  2Tck_tim |      |
| TIM_CKD_DIV4          | TDTS =  4Tck_tim |      |

#### 参数 TIM_CounterMode

TIM_CounterMode 选择了计数器模式。该参数取值见下表。 

**Table 462. TIM_CounterMode** 值 

| **TIM_CounterMode**            | 描述                        |
| ------------------------------ | --------------------------- |
| TIM_CounterMode_Up             | TIM 向上计数模式            |
| TIM_CounterMode_Down           | TIM 向下计数模式            |
| TIM_CounterMode_CenterAligned1 | TIM 中央对齐模式 1 计数模式 |
| TIM_CounterMode_CenterAligned2 | TIM 中央对齐模式 2 计数模式 |
| TIM_CounterMode_CenterAligned3 | TIM 中央对齐模式 3 计数模式 |

例： 

```c
TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure; 

TIM_TimeBaseStructure.TIM_Period = 0xFFFF; 

TIM_TimeBaseStructure.TIM_Prescaler = 0xF; 

TIM_TimeBaseStructure.TIM_ClockDivision = 0x0; 

TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up; 

TIM_TimeBaseInit(TIM2, & TIM_TimeBaseStructure); 
```

### 函数 TIM_OCxInit 

**Table 463.** 函数 **TIM_OCInit** 

| 函数名     | TIM_OCxInit                                                  |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void TIM_OC**x**Init(TIM_TypeDef* TIMx,  TIM_OCInitTypeDef* TIM_OCInitStruct)  **//TIM_OCxINIT x可选择1 2 3 4** |
| 功能描述   | 根据 TIM_OCInitStruct 中指定的参数初始化外设 TIMx            |
| 输入参数 1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数 2 | TIM_OCInitStruct：指向结构 TIM_OCInitTypeDef  的指针，包含了 TIMx 时间基数单位的配置信息    参阅 Section：TIM_OCInitTypeDef 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**TIM_OCInitTypeDef structure** 

```c
TIM_OCInitTypeDef 定义于文件***“stm32f10x_tim.h”\***： 

typedef struct 

{ 
    u16 TIM_OCMode;
    u16 TIM_Channel;
    u16 TIM_Pulse;
    u16 TIM_OCPolarity; 

} TIM_OCInitTypeDef;
```

#### 参数 TIM_OCMode 

TIM_OCMode 选择定时器模式。该参数取值见下表。 

**Table 464. TIM_OCMode** 定义 

| **TIM_OCMode**      | 描述                   |
| ------------------- | ---------------------- |
| TIM_OCMode_Timing   | TIM 输出比较时间模式   |
| TIM_OCMode_Active   | TIM 输出比较主动模式   |
| TIM_OCMode_Inactive | TIM 输出比较非主动模式 |
| TIM_OCMode_Toggle   | TIM 输出比较触发模式   |
| TIM_OCMode_PWM1     | TIM 脉冲宽度调制模式 1 |
| TIM_OCMode_PWM2     | TIM 脉冲宽度调制模式 2 |

#### 参数 TIM_Channel 

TIM_Channel 选择通道。该参数取值见下表。 

**Table 465. TIM_Channel** 值 

| **TIM_Channel** |                  | 描述 |
| --------------- | ---------------- | ---- |
| TIM_Channel_1   | 使用 TIM 通道  1 |      |
| TIM_Channel_2   | 使用 TIM 通道  2 |      |
| TIM_Channel_3   | 使用 TIM 通道  3 |      |
| TIM_Channel_4   | 使用 TIM 通道  4 |      |

#### 参数 TIM_Pulse

TIM_Pulse 设置了待装入捕获比较寄存器的脉冲值。它的取值必须在 0x0000 和 0xFFFF 之间。 

#### 参数 TIM_OCPolarity 

TIM_OCPolarity输出极性。该参数取值见下表。 

**Table 466. TIM_OCPolarity** 值 

| **TIM_OCPolarity**  | 描述               |
| ------------------- | ------------------ |
| TIM_OCPolarity_High | TIM 输出比较极性高 |
| TIM_OCPolarity_Low  | TIM 输出比较极性低 |

例： 

```c
/* Configures the TIM2 Channel1 in PWM Mode */ 

TIM_OCInitTypeDef TIM_OCInitStructure; 

TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1; 

TIM_OCInitStructure.TIM_Channel = TIM_Channel_1; 

TIM_OCInitStructure.TIM_Pulse = 0x3FFF; 

TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High; 

TIM_OCxInit(TIM2, & TIM_OCInitStructure); //X选择1 2 3 4
```

### 函数 TIM_OCStructInit 

Table 475. 描述了函数TIM_OCStructInit

**Table 475.** 函数 **TIM_TimeBaseStructInit** 

| 函数名     | TIM_TimeBaseStructInit                                       |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void  TIM_OCStructInit(TIM_OCInitTypeDef* TIM_OCInitStruct)  |
| 功能描述   | 把 TIM_OCInitStruct 中的每一个参数按缺省值填入               |
| 输入参数   | TIM_OCInitStruct：指向结构 TIM_OCInitTypeDef  的指针，待初始化 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

Table 476. 给出了TIM_OCInitStruct各个成员的缺省值 

**Table 476. TIM_OCInitStruct** 缺省值 

| 成员           | 缺省值               |
| -------------- | -------------------- |
| TIM_OCMode     | TIM_OCMode_Timing    |
| TIM_Channel    | TIM_Channel_1        |
| TIM_Pulse      | TIM_Pulse_Reset_Mask |
| TIM_OCPolarity | TIM_OCPolarity_High  |

例： 

```C
/* The following example illustrates how to initialize a 

TIM_OCInitTypeDef structure */ 

TIM_OCInitTypeDef TIM_OCInitStructure; 

TIM_OCStructInit(& TIM_OCInitStructure);
```

### 函数 TIM_Cmd 

**Table 479.** 函数 **TIM_Cmd** 

| 函数名      | TIM_Cmd                                                      |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void TIM_Cmd(TIM_TypeDef* TIMx,  FunctionalState NewState)   |
| 功能描述    | 使能或者失能  TIMx 外设                                      |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | NewState: 外设 TIMx 的新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Enables the TIM2 counter */ 

TIM_Cmd(TIM2, ENABLE); 
```

### 函数 TIM _ITConfig 

**Table 480.** 函数 **TIM_ITConfig** 

| 函数名     | TIM_ITConfig                                                 |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void TIM_ITConfig(TIM_TypeDef* TIMx, u16  TIM_IT, FunctionalState NewState) |
| 功能描述   | 使能或者失能指定的  TIM 中断                                 |
| 输入参数 1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数 2 | TIM_IT：待使能或者失能的 TIM 中断源   参阅  Section：TIM_IT 查阅更多该参数允许取值范围 |
| 输入参数 3 | NewState：TIMx 中断的新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

#### 参数 TIM_IT 

输入参数 TIM_IT 使能或者失能 TIM 的中断。可以取下表的一个或者多个取值的组合作为该参数的值。

**Table 481. TIM_IT** 值 

| **TIM_IT**     | 描述                                                         |
| -------------- | ------------------------------------------------------------ |
| TIM_IT_Update  | TIM 更新中断源(计数器向上溢出/向下溢出，计数器初始化)        |
| TIM_IT_CC1     | TIM 捕获/比较 1 中断源                                       |
| TIM_IT_CC2     | TIM 捕获/比较 2 中断源                                       |
| TIM_IT_CC3     | TIM 捕获/比较 3 中断源                                       |
| TIM_IT_CC4     | TIM 捕获/比较 4 中断源                                       |
| TIM_IT_Trigger | TIM 触发中断源 (计数器启动、停止、初始化或者由内部/外部触发计数) |

例： 

```c
/* Enables the TIM2 Capture Compare channel 1 Interrupt source */ 

TIM_ITConfig(TIM2, TIM_IT_CC1, ENABLE ); 
```



### 函数 TIM_InternalClockConfig 

**Table 487.** 函数 **TIM_InternalClockConfig** 

| 函数名     | TIM_InternalClockConfig                      |
| ---------- | -------------------------------------------- |
| 函数原形   | TIM_InternalClockConfig(TIM_TypeDef* TIMx);  |
| 功能描述   | 设置  TIMx 内部时钟                          |
| 输入参数   | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设 |
| 输出参数   | 无                                           |
| 返回值     | 无                                           |
| 先决条件   | 无                                           |
| 被调用函数 | 无                                           |

例： 

```c
/* Selects the internal clock for TIM2 */ 

TIM_InternalClockConfig(TIM2); 
```

### 函数 TIM_ITRxExternalClockConfig 

**Table 488.** 函数 **TIM_ITRxExternalClockConfig**

| 函数名      | TIM_ITRxExternalClockConfig                                  |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  TIM_ITRxExternalClockConfig(TIM_TypeDef* TIMx, u16 TIM_InputTriggerSource) |
| 功能描述    | 设置 TIMx 内部触发为外部时钟模式                             |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_InputTriggerSource：输入触发源   参阅  Section：TIM_InputTriggerSource 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

#### 参数 TIM_InputTriggerSource 

TIM_InputTriggerSource 选择 TIM 输入触发。

**Table 489. TIM_InputTriggerSource** 值 

| **TIM_InputTriggerSource** |                | 描述 |
| -------------------------- | -------------- | ---- |
| TIM_TS_ITR0                | TIM 内部触发 0 |      |
| TIM_TS_ITR1                | TIM 内部触发 1 |      |
| TIM_TS_ITR2                | TIM 内部触发 2 |      |
| TIM_TS_ITR3                | TIM 内部触发 3 |      |

例： 

```c
/* TIM2 internal trigger 3 used as clock source */ 

TIM_ITRxExternalClockConfig(TIM2, TIM_TS_ITR3);  
```

### 函数 TIM_TIxExternalClockConfig 

**Table 490.** 函数 **TIM_TIxExternalClockConfig**

| 函数名      | TIM_TIxExternalClockConfig                                   |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  TIM_TIxExternalClockConfig(TIM_TypeDef*  TIMx,  u16 TIM_TIxExternalCLKSource, u8  TIM_ICPolarity, u8 ICFilter) |
| 功能描述    | 设置  TIMx 触发为外部时钟                                    |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_ TIxExternalCLKSource：触发源   参阅  Section：TIM_ TIxExternalCLKSource 查阅更多该参数允许取值范围 |
| 输入参数  3 | TIM_ ICPolarity：指定的 TI  极性   参阅  Section：TIM_ ICPolarity 查阅更多该参数允许取值范围 |
| 输入参数  4 | ICFilter：指定的输入比较滤波器。该参数取值在 0x0 和 0xF 之间。 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

#### 参数 TIM_TIxExternalCLKSource 

TIM_TIxExternalCLKSource选择TIMx外部时钟源。

**Table 491. TIM_TIxExternalCLKSource** 值 

| **TIM_TIxExternalCLKSource** | 描述                             |
| ---------------------------- | -------------------------------- |
| TIM_TS_TI1FP1                | TIM IC1 连接到 TI1               |
| TIM_TS_TI1FP2                | TIM IC2 连接到 TI2               |
| TIM_TS_TI1F_ED               | TIM IC1 连接到 TI1：使用边沿探测 |

例： 

```c
/* Selects the TI1 as clock for TIM2: the external clock is connected to TI1 input pin, the rising edge is the active edge and no filter sampling is done (ICFilter = 0) */ 

TIM_TIxExternalClockConfig(TIM2, TIM_TS_TI1FP1, TIM_ICPolarity_Rising, 0); 
```

### 函数 TIM_ETRClockMode1Config 

**Table 492.** 函数 **TIM_ETRClockMode1Config** 

| 函数名      | TIM_ETRClockMode1Config                                      |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  TIM_ETRClockMode1Config(TIM_TypeDef* TIMx, u16 TIM_ExtTRGPrescaler, u16  TIM_ExtTRGPolarity, u16 ExtTRGFilter) |
| 功能描述    | 配置 TIMx 外部时钟模式  1                                    |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_ExtTRGPrescaler：外部触发预分频   参阅  Section：TIM_ExtTRGPrescaler 查阅更多该参数允许取值范围 |
| 输入参数  3 | TIM_ExtTRGPolarity：外部时钟极性   参阅 Section：TIM_ExtTRGPolarity 查阅更多该参数允许取值范围 |
| 输入参数  4 | ExtTRGFilter：外部触发滤波器。该参数取值在 0x0 和 0xF 之间。 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

#### 参数 TIM_ExtTRGPrescaler 

TIM_ExtTRGPrescaler设置TIMx外部触发预分频。见Table 493. 参阅该参数的取值。 

**Table 493. TIM_ExtTRGPrescaler** 值 

| **TIM_ExtTRGPrescaler** | 描述                 |
| ----------------------- | -------------------- |
| TIM_ExtTRGPSC_OFF       | TIM ETRP 预分频  OFF |
| TIM_ExtTRGPSC_DIV2      | TIM ETRP 频率除以 2  |
| TIM_ExtTRGPSC_DIV4      | TIM ETRP 频率除以 4  |
| TIM_ExtTRGPSC_DIV8      | TIM ETRP 频率除以 8  |

#### 参数 TIM_ExtTRGPolarity 

TIM_ExtTRGPolarity设置TIMx外部触发极性。见Table 494. 参阅该参数的取值。

**Table 494. TIM_ExtTRGPolarity** 值 

| **TIM_ExtTRGPolarity**         | 描述                                       |
| ------------------------------ | ------------------------------------------ |
| TIM_ExtTRGPolarity_Inverted    | TIM 外部触发极性翻转：低电平或下降沿有效   |
| TIM_ExtTRGPolarity_NonInverted | TIM 外部触发极性非翻转：高电平或上升沿有效 |

例： 

```c
/* Selects the external clock Mode 1 for TIM2: 
the external clock is connected to ETR input pin, the rising edge is the active edge, no filter sampling is done (ExtTRGFilter = 0) and the prescaler is fixed to TIM_ExtTRGPSC_DIV2 */ 

TIM_ExternalCLK1Config(TIM2, TIM_ExtTRGPSC_DIV2, TIM_ExtTRGPolarity_NonInverted, 0x0); 
```



###  函数 TIM_ETRClockMode2Config 

**Table 495.** 函数 **TIM_ETRClockMode2Config** 

| 函数名     | TIM_ETRClockMode2Config                                      |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void TIM_ETRClockMode2Config(TIM_TypeDef* TIMx, u16   TIM_ExtTRGPrescaler,  u16 TIM_ExtTRGPolarity, u16 ExtTRGFilter) |
| 功能描述   | 配置TIMx外部时钟模式2                                        |
| 输入参数1  | TIMx：x可以是1,2,3,4,5或者8，来选择TIM外设                   |
| 输入参数2  | TIM_ExtTRGPrescaler：外部触发预分频                          |
| 输入参数3  | TIM_ExtTRGPolarity：外部时钟极性                             |
| 输入参数4  | ExtTRGFilter：外部触发滤波器。该参数取值在0x0和0xF之间。     |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**函数原型：**

```c
/**
  * @brief  Configures the External clock Mode2
  * @param  TIMx: where x can be  1, 2, 3, 4, 5 or 8 to select the TIM peripheral.
  * @param  TIM_ExtTRGPrescaler: The external Trigger Prescaler.
  *   This parameter can be one of the following values:
  *     @arg TIM_ExtTRGPSC_OFF: ETRP Prescaler OFF. --不分频
  *     @arg TIM_ExtTRGPSC_DIV2: ETRP frequency divided by 2.
  *     @arg TIM_ExtTRGPSC_DIV4: ETRP frequency divided by 4.
  *     @arg TIM_ExtTRGPSC_DIV8: ETRP frequency divided by 8.
  * @param  TIM_ExtTRGPolarity: The external Trigger Polarity.
  *   This parameter can be one of the following values:
  *     @arg TIM_ExtTRGPolarity_Inverted: active low or falling edge active. -- 低电平或下降沿触发
  *     @arg TIM_ExtTRGPolarity_NonInverted: active high or rising edge active. -- 高电平或上升沿触发
  * @param  ExtTRGFilter: External Trigger Filter. -- 外部触发滤波器 参照 TIM_TimeBaseInit初始化函数中的											TIM_ClockDivision参数 从模式控制寄存器(TIMx_SMCR)中的 ETF
  *   This parameter must be a value between 0x00 and 0x0F
  * @retval None
  */
void TIM_ETRClockMode2Config(TIM_TypeDef* TIMx, uint16_t TIM_ExtTRGPrescaler, 
                             uint16_t TIM_ExtTRGPolarity, uint16_t ExtTRGFilter)
{
  /* Check the parameters */
  assert_param(IS_TIM_LIST3_PERIPH(TIMx));
  assert_param(IS_TIM_EXT_PRESCALER(TIM_ExtTRGPrescaler));
  assert_param(IS_TIM_EXT_POLARITY(TIM_ExtTRGPolarity));
  assert_param(IS_TIM_EXT_FILTER(ExtTRGFilter));
  /* Configure the ETR Clock source */
  TIM_ETRConfig(TIMx, TIM_ExtTRGPrescaler, TIM_ExtTRGPolarity, ExtTRGFilter);
  /* Enable the External clock mode2 */
  TIMx->SMCR |= TIM_SMCR_ECE;
}
```

![ETF](https://pic.imgdb.cn/item/6513ce95c458853aef34f44b/ExternalTriggerFilter.png)

例： 

```c
/* Selects the external clock Mode 2 for TIM2: 
the external clock is connected to ETR input pin, the rising edge is the active edge, no filter sampling is done (ExtTRGFilter = 0) and the prescaler isfixed to TIM_ExtTRGPSC_DIV2 */ 

TIM_ExternalCLK2Config(TIM2, TIM_ExtTRGPSC_DIV2, TIM_ExtTRGPolarity_NonInverted, 0x0); 
```

### 函数 TIM_ETRConfig 

**Table 496.** 函数 **TIM_ETRConfig** 

| 函数名      | TIM_ETRConfig                                                |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void TIM_ETRConfig(TIM_TypeDef* TIMx, u16 TIM_ExtTRGPrescaler, u16  TIM_ExtTRGPolarity, u8 ExtTRGFilter) |
| 功能描述    | 配置  TIMx 外部触发                                          |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_ExtTRGPrescaler：外部触发预分频   参阅  Section：TIM_ExtTRGPrescaler 查阅更多该参数允许取值范围 |
| 输入参数  3 | TIM_ExtTRGPolarity：外部时钟极性   参阅  Section：TIM_ExtTRGPolarity 查阅更多该参数允许取值范围 |
| 输入参数  4 | ExtTRGFilter：外部触发滤波器。该参数取值在 0x0 和 0xF 之间。 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Configure the External Trigger (ETR) for TIM2: 
the rising edge is the active edge, no filter sampling is done (ExtTRGFilter = 0) and the prescaler is fixed to TIM_ExtTRGPSC_DIV2 */ 

TIM_ExternalCLK2Config(TIM2, TIM_ExtTRGPSC_DIV2, TIM_ExtTRGPolarity_NonInverted, 0x0); 
```

### 函数 TIM_SelectInputTrigger 

**Table 497.** 函数 **TIM_SelectInputTrigger** 

| 函数名     | TIM_SelectInputTrigger                                       |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void TIM_SelectInputTrigger(TIM_TypeDef*  TIMx, u16 TIM_InputTriggerSource) |
| 功能描述   | 选择 TIMx 输入触发源                                         |
| 输入参数 1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数 2 | TIM_InputTriggerSource：输入触发源   参阅  Section：TIM_InputTriggerSource 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

#### 参数 TIM_InputTriggerSource 

TIM_InputTriggerSource选择TIMx输入触发源。见Table 498. 参阅该参数的取值。

**Table 498. TIM_InputTriggerSource** 值 

| **TIM_InputTriggerSource** | 描述                   |
| -------------------------- | ---------------------- |
| TIM_TS_ITR0                | TIM 内部触发 0         |
| TIM_TS_ITR1                | TIM 内部触发 1         |
| TIM_TS_ITR2                | TIM 内部触发 2         |
| TIM_TS_ITR3                | TIM 内部触发 3         |
| TIM_TS_TI1F_ED             | TIM TL1 边沿探测器     |
| TIM_TS_TI1FP1              | TIM 经滤波定时器输入 1 |
| TIM_TS_TI2FP2              | TIM 经滤波定时器输入 2 |
| TIM_TS_ETRF                | TIM 外部触发输入       |

例： 

```c 
/* Selects the Internal Trigger 3 as input trigger fot TIM2 */

void TIM_SelectInputTrigger(TIM2, TIM_TS_ITR3); 
```

### 函数 TIM_PrescalerConfig 

**Table 499.** 函数 **TIM_PrescalerConfig** 

| 函数名      | TIM_PrescalerConfig                                          |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void    TIM_PrescalerConfig(TIM_TypeDef*   TIMx,   u16   Prescaler,u16 TIM_PSCReloadMode) |
| 功能描述    | 设置  TIMx 预分频                                            |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | Prescaler要写入的预分频值                                    |
| 输入参数  3 | TIM_PSCReloadMode：预分频重载模式                            |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

#### 参数 TIM_PSCReloadMode 

TIM_PSCReloadMode选择预分频重载模式。见Table 500. 参阅该参数的取值。 

**Table 500. TIM_PSCReloadMode** 值 

| **TIM_PSCReloadMode**       | 描述                       |
| --------------------------- | -------------------------- |
| TIM_PSCReloadMode_Update    | TIM 预分频值在更新事件装入 |
| TIM_PSCReloadMode_Immediate | TIM 预分频值即时装入       |

例： 

```c
/* Configures the TIM2 new Prescaler value */

u16 TIMPrescaler = 0xFF00; 

TIM_PrescalerConfig(TIM2, TIMPrescaler, TIM_PSCReloadMode_Immediate); 
```

### 函数 TIM_CounterModeConfig 

**Table 501.** 函数 **TIM_CounterModeConfig** 

| 函数名      | TIM_CounterModeConfig                                        |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  TIM_CounterModeConfig(TIM_TypeDef* TIMx, u16 TIM_CounterMode) |
| 功能描述    | 设置  TIMx 计数器模式                                        |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_CounterMode：待使用的计数器模式   参阅  Section：TIM_CounterMode 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Selects the Center Aligned counter Mode 1 for the TIM2 */ 

TIM_CounterModeConfig(TIM2, TIM_Counter_CenterAligned1); 
```

### 函数 TIM_ForcedOC1Config 

**Table 502.** 函数 **TIM_ForcedOC1Config** 

| 函数名      | TIM_ForcedOC1Config                                          |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void TIM_ForcedOC1Config(TIM_TypeDef*  TIMx, u16 TIM_ForcedAction) |
| 功能描述    | 置 TIMx OC1 为活动或者非活动电平   -- **配置强制输出模式**   |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_ForcedAction：输出信号的设置动作   参阅  Section：TIM_ForcedAction 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**TIM_ForcedAction** 输出信号的设置动作取值见下表。 

**Table 503. TIM_ForcedAction** 值 

| **TIM_ForcedAction**      | 描述                        |
| ------------------------- | --------------------------- |
| TIM_ForcedAction_Active   | 置为  OCxREF 上的活动电平   |
| TIM_ForcedAction_InActive | 置为  OCxREF 上的非活动电平 |

例： 

```c
/* Forces the TIM2 Output Compare 1 signal to the active level */ 

TIM_ForcedOC1Config(TIM2, TIM_ForcedAction_Active); 
```

### 函数 TIM_ARRPreloadConfig 

**Table 507.** 函数 **TIM_ARRPreloadConfig** 

| 函数名      | TIM_ARRPreloadConfig                                         |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void TIM_ARRPreloadConfig(TIM_TypeDef*  TIMx, FunctionalState Newstate) |
| 功能描述    | 使能或者失能  TIMx 在 ARR 上的预装载寄存器                   |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | NewState: TIM_CR1 寄存器 ARPE  位的新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```C
/* Enables the TIM2 Preload on ARR Register */

TIM_ARRPreloadConfig(TIM2, ENABLE);
```

### 函数 TIM_OC1PreloadConfig 

**Table 509.** 函数 **TIM_OC1PreloadConfig** 

| 函数名      | TIM_OC1PreloadConfig                                         |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void TIM_OC1PreloadConfig(TIM_TypeDef*  TIMx, u16 TIM_OCPreload) |
| 功能描述    | 使能或者失能  TIMx 在 CCR1 上的预装载寄存器                  |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_OCPreload：输出比较预装载状态                            |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**TIM_OCPreload** 输出比较预装载状态可以使能或者失能如下表。 

**Table 510. TIM_OCPreload** 值 

| **TIM_OCPreload**     | 描述                              |
| --------------------- | --------------------------------- |
| TIM_OCPreload_Enable  | TIMx 在 CCR1 上的预装载寄存器使能 |
| TIM_OCPreload_Disable | TIMx 在 CCR1 上的预装载寄存器失能 |

例： 

```c
/* Enables the TIM2 Preload on CC1 Register */ 

TIM_OC1PreloadConfig(TIM2, TIM_OCPreload_Enable); 
```

### 函数 TIM_SetCounter 

**Table 544.** 函数 **TIM_SetCounter** 

| 函数名      | TIM_SetCounter                                       |
| ----------- | ---------------------------------------------------- |
| 函数原形    | void TIM_SetCounter(TIM_TypeDef* TIMx,  u16 Counter) |
| 功能描述    | 设置  TIMx 计数器寄存器值                            |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设         |
| 输入参数  2 | Counter：计数器寄存器新值                            |
| 输出参数    | 无                                                   |
| 返回值      | 无                                                   |
| 先决条件    | 无                                                   |
| 被调用函数  | 无                                                   |

例： 

/* Sets the TIM2 new Counter value */ u16 TIMCounter = 0xFFFF; TIM_SetCounter(TIM2, TIMCounter); 

### 函数 TIM_SetAutoreload 

**Table 545.** 函数 **TIM_ SetAutoreload** 

| 函数名      | TIM_ SetAutoreload                                   |
| ----------- | ---------------------------------------------------- |
| 函数原形    | void TIM_SetCounter(TIM_TypeDef* TIMx,  u16 Counter) |
| 功能描述    | 设置  TIMx 自动重装载寄存器值                        |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设         |
| 输入参数  2 | Autoreload：自动重装载寄存器新值                     |
| 输出参数    | 无                                                   |
| 返回值      | 无                                                   |
| 先决条件    | 无                                                   |
| 被调用函数  | 无                                                   |

例： 

```c
/* Sets the TIM2 new Autoreload value */ u16 TIMAutoreload = 0xFFFF; 

TIM_SetAutoreload(TIM2, TIMAutoreload); 
```

### 函数 TIM_GetCounter 

**Table 559.** 函数 **TIM_GetCounter** 

| 函数名     | TIM_GetCounter                               |
| ---------- | -------------------------------------------- |
| 函数原形   | u16 TIM_GetCounter(TIM_TypeDef* TIMx)        |
| 功能描述   | 获得  TIMx 计数器的值                        |
| 输入参数   | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设 |
| 输出参数   | 无                                           |
| 返回值     | 计数器的值                                   |
| 先决条件   | 无                                           |
| 被调用函数 | 无                                           |

例： 

```c
/* Gets TIM2 counter value */ 

u16 TIMCounter = TIM_GetCounter(TIM2); 
```

### 函数 TIM_GetPrescaler 

**Table 560.** 函数 **TIM_GetPrescaler** 

| 函数名     | TIM_GetPrescaler                             |
| ---------- | -------------------------------------------- |
| 函数原形   | u16 TIM_GetPrescaler (TIM_TypeDef*  TIMx)    |
| 功能描述   | 获得  TIMx 预分频值                          |
| 输入参数   | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设 |
| 输出参数   | 无                                           |
| 返回值     | 预分频的值                                   |
| 先决条件   | 无                                           |
| 被调用函数 | 无                                           |

例： 

```c 
/* Gets TIM2 prescaler value */

u16 TIMPrescaler = TIM_GetPrescaler(TIM2);
```

### 函数 TIM_GetFlagStatus 

**Table 561.** 函数 **TIM_ GetFlagStatus** 

| 函数名      | TIM_ GetFlagStatus                                           |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | FlagStatus TIM_GetFlagStatus(TIM_TypeDef*  TIMx, u16 TIM_FLAG) |
| 功能描述    | 检查指定的  TIM 标志位设置与否                               |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_FLAG：待检查的 TIM 标志位   参阅  Section：TIM_FLAG 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | TIM_FLAG 的新状态（SET  或者 RESET）                         |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

#### 参数 TIM_FLAG 

Table 562. 给出了所有可以被函数TIM_ GetFlagStatus检查的标志位列表  

**Table 562. TIM_FLAG** 值 

| **TIM_FLAG**     | 描述                       |
| ---------------- | -------------------------- |
| TIM_FLAG_Update  | TIM 更新标志位             |
| TIM_FLAG_CC1     | TIM 捕获/比较 1 标志位     |
| TIM_FLAG_CC2     | TIM 捕获/比较 2 标志位     |
| TIM_FLAG_CC3     | TIM 捕获/比较 3 标志位     |
| TIM_FLAG_CC4     | TIM 捕获/比较 4 标志位     |
| TIM_FLAG_Trigger | TIM 触发标志位             |
| TIM_FLAG_CC1OF   | TIM 捕获/比较 1 溢出标志位 |
| TIM_FLAG_CC2OF   | TIM 捕获/比较 2 溢出标志位 |
| TIM_FLAG_CC3OF   | TIM 捕获/比较 3 溢出标志位 |
| TIM_FLAG_CC4OF   | TIM 捕获/比较 4 溢出标志位 |

例： 

```c
/* Check if the TIM2 Capture Compare 1 flag is set or reset */

if(TIM_GetFlagStatus(TIM2, TIM_FLAG_CC1) == SET) 

{

}
```

### 函数 TIM_ClearFlag 

**Table 563.** 函数 **TIM_ ClearFlag** 

| 函数名      | TIM_ ClearFlag                                               |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void TIM_ClearFlag(TIM_TypeDef* TIMx,  u32 TIM_FLAG)         |
| 功能描述    | 清除  TIMx 的待处理标志位                                    |
| 输入参数  1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数  2 | TIM_FLAG：待清除的 TIM 标志位   参阅 Section：TIM_FLAG  查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Clear the TIM2 Capture Compare 1 flag */ 

TIM_ClearFlag(TIM2, TIM_FLAG_CC1); 
```

### 函数 TIM_GetITStatus 

**Table 564.** 函数 **TIM_ GetITStatus** 

| 函数名     | TIM_ GetITStatus                                             |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | ITStatus TIM_GetITStatus(TIM_TypeDef*  TIMx, u16 TIM_IT)     |
| 功能描述   | 检查指定的 TIM 中断发生与否                                  |
| 输入参数 1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数 2 | TIM_IT：待检查的 TIM 中断源   参阅  Section：TIM_IT 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | TIM_IT 的新状态                                              |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

例： 

```c
/* Check if the TIM2 Capture Compare 1 interrupt has occured or not 

*/ 

if(TIM_GetITStatus(TIM2, TIM_IT_CC1) == SET) 

{

} 
```

### 函数 TIM_ClearITPendingBit 

**Table 565.** 函数 **TIM_ ClearITPendingBit** 

| 函数名     | TIM_ ClearITPendingBit                                       |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void TIM_ClearITPendingBit(TIM_TypeDef*  TIMx, u16 TIM_IT)   |
| 功能描述   | 清除 TIMx 的中断待处理位                                     |
| 输入参数 1 | TIMx：x 可以是 2，3 或者 4，来选择 TIM  外设                 |
| 输入参数 2 | TIM_IT：待检查的 TIM 中断待处理位   参阅  Section：TIM_IT 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

例： 

```c
/* Clear the TIM2 Capture Compare 1 interrupt pending bit */ 

TIM_ClearITPendingBit(TIM2, TIM_IT_CC1);
```























