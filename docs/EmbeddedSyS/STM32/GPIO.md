# GPIO

---

## 前言

==**STM32上的144个引脚分为:**==

* GPIO(General Purpose Input Output)通用输入输出IO口，112个
    * PA 16个 
    * PB 16个
    * PC 16个 
    * PD 16个
    * PE 16个
    * PF 16个
    * PG 16个
* 电源引脚，27个
    * VDD 11个 ：GND
    * VSS  11个 ：3.3V
    * Vref+ 1个 ：开发板模拟部分（ADC/DAC）的参考电压（Vref+和 Vref-）
    * Vref-  1个 ：开发板模拟部分（ADC/DAC）的参考电压（Vref+和 Vref-）
    * VDDA 1个： Vref+的输入 范围为：2.4~VDDA
    * VSSA 1个 ： Vref-必须和 VSSA 连接在一起
    * VBAT 1个 ：后备区域供电脚，采用纽扣电池和 VCC3.3 混合供电的方式VBAT 总是有电的，以保证 RTC 的走时以及后备寄存器的内容不丢失
* BOOT引脚 BOOT0 1个
* 复位引脚 NRST 1个，不做其它功能使用
* 晶振引脚OSC_IN 1个 ：输入引脚 I
* 晶振引脚OSC_OUT 1个：输出引脚 O
* 106号引脚NC  1个：NO Connect NC引脚悬空或者接地都可以,NC引脚预留是后面H7系列产品升级会在部分NC引脚中做其他功能。

![STM32f103x-pin](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/STM32f103x-pin.png){ width="400" }

==**寄存器:**== 寄存器就是一段特殊的存储器，内核可以通过APB2总线对寄存器进行读写，这样就可以完成输出电平和读取电平的功能了

---

## GPIO的介绍

GPIO(General Purpose Input Output)通用输入输出IO口，是由芯片直接可控制的引脚。GPIO的引脚通过与外部硬件设备连接，可实现与外部通讯、控制外部硬件或者采集外部硬件数据的功能。

---

## GPIO的基本结构

* 可配置为[8种输入输出模式](#work)

* 引脚电平：0V~3.3V，部分引脚可容忍5V

* 输出模式下可控制端口输出高低电平，用以驱动LED、控制蜂鸣器、模拟通信协议输出时序等

* 输入模式下可读取端口的高低电平或电压，用于读取按键输入、外接模块电平信号输入、ADC电压采集、模拟通信协议接收数据等
* 在STM32中，所有的GPIO都是挂载在APB2外设的总线上的
* GPIO的MODE配置(输出模式的速度):GPIO的输出速度可以限制输出引脚的最大翻转速度，是为了低功耗和稳定性而设计的

![GPIO的基本结构](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIOBasicStructure.png)

**位带区域**：在STM32中专门分配有一段地址区域，这段地址映射了RAM和外设寄存器所有的位，读写这段地址中的数据，就相当于读写所映射位置的某一位，相当于51中的位寻址操作

**开漏模式**：可用作通信协议的驱动方式，eg：I2C；在多极通信的情况下，可避免各个设备的相互干扰，还可用于输出5V的电平信号：在I/O口外接一个上拉电阻(弱上拉)，在高阻态(开漏)模式下，可输出5V，在低电平时输出低电平。（开漏模式下低电平有驱动能力，高电平没有驱动能力）

**STM32片上外设举例：**

* 通用输入/输出（GPIO）：用于数字输入输出的引脚。

* 串行通信接口（SPI）：用于与其他设备进行高速异步串行通信。

* 串行同步接口（I2C）：用于与其他设备进行串行同步通信。

* 通用异步接收器/发送器（USART）：用于异步串行数据通信。

* 通用串行总线（USB）：用于USB连接和通信。

* 通用定时器/计数器（TIM）：用于定时和计数操作。

* 通用同步异步收发器（USART）：用于串行通信和数据传输。

* 多媒体卡接口（SDIO）：用于与SD存储卡进行通信。

* 同步异步接收器/发送器（UART）：用于异步串行通信。

* 时序控制器（RTC）：用于实时时钟和日历功能。

* 脉冲宽度调制器（PWM）：用于产生可调节脉冲宽度的信号。

* 模拟到数字转换器（ADC）：用于将模拟信号转换为数字信号。

* 数字到模拟转换器（DAC）：用于将数字信号转换为模拟信号。

* 以太网控制器（ETH）：用于以太网连接和通信。

* 控制器区域网络（CAN）：用于CAN总线通信。

---

## GPIO的工作模式 {#work}

* 输入模式：
    1. 浮空输入(数字输入)：可读取引脚电平，若引脚悬空，则电平不确定
    2. 上拉输入(数字输入)：可读取引脚电平，内部连接上拉电阻，悬空时默认高电平
    3. 下拉输入(数字输入)：可读取引脚电平，内部连接下拉电阻，悬空时默认低电平
    4. 模拟输入(模拟输入)：GPIO无效(下图中的左侧的所有寄存器)，引脚直接接入内部ADC

![GPIO数字输入配置](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIONumInputConfig.png)

![GPIO的模拟输入配置](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIOSimInputConfig.png)

* 输出模式(数字输出)：
    1. 开漏输出：可输出引脚电平，高电平为高阻态，低电平接VSS
    2. 推挽输出：可输出引脚电平，高电平接VDD，低电平接VSS
    3. 复用开漏输出：由片上外设控制，高电平为高阻态，低电平接VSS
    4. 复用推挽输出：由片上外设控制，高电平接VDD，低电平接VSS

![GPIO的输出配置](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIOOutputConfig.png)

![GPIO的复用输出配置](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIOMultiOutputConfig.png)

---

## GPIO的使用方法

![GPIO-Config](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIO-Config.png)

STM32 的每个 IO 端口都有 7 个寄存器来控制，常用的 IO 端口寄存器只有 4 个`CRL、CRH、IDR、ODR` :

* 端口配置寄存器：配置寄存器使用来设置GPIO端口和此端口的应用模式

    1. ==**端口配置低寄存器(GPIOx_CRL)(x=A..E):**== 

     ![GPIOx-CRL](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIOx-CRL.png)

     STM32 的 `CRL` 控制着PA~PG的低 8 位(IO0~IO7)的模式。 每个 IO 端口使用 `CRL` 的 4 个位，高两位为 `CNF`，低两位为 `MODE`

     ```c
       GPIOA->CRL &= ~(0xf<<4);//PA1-->端口配置低寄存器清0
       GPIOA->CRL |= (0x3<<4);//PA1-->端口配置低寄存器设置为:输出模式，最大速度50MHz，通用开漏输出模式
     ```

     ```c
       GPIOA->CRL &= ~(0xf<<4);//PA1-->端口配置低寄存器清0
       GPIOA->CRL |= (0x8<<4);//PA1-->端口配置低寄存器设置为:输入模式，上拉/下拉输入模式
       GPIOC->ODR = (0X1<<1); //设置成上拉输入。这里为什么是ODR 是因为手册上有说明 虽然在设置IO输入后，输出是断开的，但是不影响ODR数据寄存器的使用 可以设置其为上下拉输入 见端口位配置表
     ```

     **常用的配置:**
    ```c
     0X0 表示模拟输入模式（ADC 用）
     0X3 表示推挽输出模式（做输出口用， 50M 速率）
     0X8 表示上/下拉输入模式（做输入口用）
     0XB 表示复用输出（使用 IO 口的第二 功能，50M 速率）

    ```

    2. ==**端口配置高寄存器(GPIOx_CRH)(x=A..E):**==

     ![GPIOx-CRH](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIOx-CRH.png)

     STM32 的 `CRH` 控制着PA~PG的低 8 位(IO8~IO15)的模式。 每个 IO 端口使用 `CRH` 的 4 个位，高两位为 `CNF`，低两位为 `MODE`由于和CRL使用一样就不再赘述

* 端口数据寄存器：我自己的理解就是可以通过对以下的寄存器的配置就可以使IO口读取或者输出数据(0或1)

    3. ==**端口输入数据寄存器(GPIOx_IDR)(x=A..E):**==

     ![GPIOx-IDR](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIOx-IDR.png)

     `IDR` 是一个端口输入数据寄存器，只用了低 16 位。该寄存器为只读寄存器，并且只能以 16 位的形式读出

     ```c
     #define KEY1  (GPIOA->IDR & (0x1<<0)) //GPIOA->IDR输入数据  读取PA0的状态 和1相与 
     //①按键按下低电平 有效--> KEY1==0;②按键按下高电平 有效-->KEY1==1; 
       GPIOA->CRL &= ~(0xf<<0);//PA0-->端口配置低寄存器清0
       GPIOA->CRL |= (0x4<<0);//PA0-->端口配置低寄存器设置为:浮空输入模式
     ```

    4. ==**端口输出数据寄存器(GPIOx_ODR)(x=A..E):**==

     ![GPIOx-ODR](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GPIOx-ODR.png)

     `ODR `是一个端口输出数据寄存器，也只用了低 16 位。该寄存器为可读写，从该寄存器读出来的数据可以用于判断当前 IO 口的输出状态。而向该寄存器写数据，则可以控制某个 IO 口 的输出电平。

     ```c
       GPIOA->CRL &= ~(0xf<<4);//PA1-->端口配置低寄存器清0
       GPIOA->CRL |= (0x3<<4);//PA1-->端口配置低寄存器设置为:输出模式，最大速度50MHz，通用开漏输出模式
       //初始化后 默认的输出值为0 
       GPIOA->ODR |= 0X1<<4;//使其输出1
     ```

5. ==**端口位设置/清除寄存器(GPIOx_BSRR) (x=A..E)**==

6. ==**端口位清除寄存器(GPIOx_BRR) (x=A..E)**==

7. ==**端口配置锁定寄存器(GPIOx_LCKR) (x=A..E)**== 

---

## GPIO的库函数

**Table** 1. **GPIO** 库函数

| 函数名                     | 描述                                                      |
| -------------------------- | --------------------------------------------------------- |
| GPIO_DeInit                | 将外设  GPIOx 寄存器重设为缺省值                          |
| GPIO_AFIODeInit            | 将复用功能（重映射事件控制和  EXTI 设置）重设为缺省值     |
| **GPIO_Init**              | 根据  GPIO_InitStruct 中指定的参数初始化外设 GPIOx 寄存器 |
| GPIO_StructInit            | 把 GPIO_InitStruct 中的每一个参数按缺省值填入             |
| **GPIO_ReadInputDataBit**  | 读取指定端口管脚的输入                                    |
| **GPIO_ReadInputData**     | 读取指定的  GPIO 端口输入                                 |
| **GPIO_ReadOutputDataBit** | 读取指定端口管脚的输出                                    |
| **GPIO_ReadOutputData**    | 读取指定的  GPIO 端口输出                                 |
| **GPIO_SetBits**           | 设置指定的数据端口位                                      |
| **GPIO_ResetBits**         | 清除指定的数据端口位                                      |
| **GPIO_WriteBit**          | 设置或者清除指定的数据端口位                              |
| **GPIO_Write**             | 向指定  GPIO 数据端口写入数据                             |
| GPIO_PinLockConfig         | 锁定  GPIO 管脚设置寄存器                                 |
| GPIO_EventOutputConfig     | 选择  GPIO 管脚用作事件输出                               |
| GPIO_EventOutputCmd        | 使能或者失能事件输出                                      |
| GPIO_PinRemapConfig        | 改变指定管脚的映射                                        |
| GPIO_EXTILineConfig        | 选择  GPIO 管脚用作外部中断线路                           |

---

### GPIO_Init 函数

**Table 2.** 函数 **GPIO_Init** 

| 函数名     | GPIO_Init                                                    |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void GPIO_Init(GPIO_TypeDef* GPIOx,  GPIO_InitTypeDef* GPIO_InitStruct) |
| 功能描述   | 根据 GPIO_InitStruct 中指定的参数初始化外设 GPIOx 寄存器     |
| 输入参数 1 | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设         |
| 输入参数 2 | GPIO_InitStruct：指向结构 GPIO_InitTypeDef  的指针，包含了外设 GPIO 的配置信息参阅  Section：   GPIO_InitTypeDef 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

```c title="GPIO_InitTypeDef structure结构体:"
/*
GPIO_InitTypeDef 定义于文件"stm32f10x_gpio.h"： 
*/
typedef struct { 
u16 GPIO_Pin; 

GPIOSpeed_TypeDef GPIO_Speed; 

GPIOMode_TypeDef GPIO_Mode; 

} GPIO_InitTypeDef; 
```

---

#### GPIO_Pin

**GPIO_Pin** 该参数选择待设置的 GPIO 管脚，使用操作符“|”可以一次选中多个管脚。可以使用下表中的任意组合。

**Table 3. GPIO_Pin** 值 

| **GPIO_Pin**  |  选中引脚    | 描述 |
| ------------- | ------------ | ---- |
| GPIO_Pin_None | 无管脚被选中 |      |
| GPIO_Pin_0    | 选中管脚 0   |      |
| GPIO_Pin_1    | 选中管脚 1   |      |
| GPIO_Pin_2    | 选中管脚 2   |      |
| GPIO_Pin_3    | 选中管脚 3   |      |
| GPIO_Pin_4    | 选中管脚 4   |      |
| GPIO_Pin_5    | 选中管脚 5   |      |
| GPIO_Pin_6    | 选中管脚 6   |      |
| GPIO_Pin_7    | 选中管脚 7   |      |
| GPIO_Pin_8    | 选中管脚 8   |      |
| GPIO_Pin_9    | 选中管脚 9   |      |
| GPIO_Pin_10   | 选中管脚 10  |      |
| GPIO_Pin_11   | 选中管脚 11  |      |
| GPIO_Pin_12   | 选中管脚 12  |      |
| GPIO_Pin_13   | 选中管脚 13  |      |
| GPIO_Pin_14   | 选中管脚 14  |      |
| GPIO_Pin_15   | 选中管脚 15  |      |
| GPIO_Pin_All  | 选中全部管脚 |      |

---

#### GPIO_Speed 

GPIO_Speed 用以设置选中管脚的速率。Table 184. 给出了该参数可取的值 

**Table 4. GPIO_Speed** 值 

| **GPIO_Speed**   | 描述              |
| ---------------- | ----------------- |
| GPIO_Speed_10MHz | 高输出速率  10MHz |
| GPIO_Speed_2MHz  | 高输出速率  2MHz  |
| GPIO_Speed_50MHz | 高输出速率  50MHz |

---

####  GPIO_Mode 

GPIO_Mode 用以设置选中管脚的工作状态。Table 185. 给出了该参数可取的值 

**Table 5. GPIO_Mode** 值 

| **GPIO_Speed**        |   解释       | 描述 |
| --------------------- | ------------ | ---- |
| GPIO_Mode_AIN         | 模拟输入     |      |
| GPIO_Mode_IN_FLOATING | 浮空输入     |      |
| GPIO_Mode_IPD         | 下拉输入     |      |
| GPIO_Mode_IPU         | 上拉输入     |      |
| GPIO_Mode_Out_OD      | 开漏输出     |      |
| GPIO_Mode_Out_PP      | 推挽输出     |      |
| GPIO_Mode_AF_OD       | 复用开漏输出 |      |
| GPIO_Mode_AF_PP       | 复用推挽输出 |      |

注意： 

* 当某管脚设置为上拉或者下拉输入模式，使用寄存器 Px_BSRR 和 PxBRR 

* GPIO_Mode 允许同时设置 GPIO 方向（输入/输出）和对应的输入/输出设置，：位[7:4]对应 GPIO 方向，位[4:0]对应配置。GPIO 方向有如下索引

  * GPIO 输入模式 = 0x00 

  * GPIO 输出模式 = 0x01 

**Table 6. GPIO_Mode** 的索引和编码 

| **GPIO**方向          | 索引 | 模式             | 设置 | 模式代码 |
| --------------------- | ---- | ---------------- | ---- | -------- |
| GPIO Input            | 0x00 | GPIO_Mode_AIN    | 0x00 | 0x00     |
| GPIO_Mode_IN_FLOATING | 0x04 | 0x04             |      |          |
| GPIO_Mode_IPD         | 0x08 | 0x28             |      |          |
| GPIO_Mode_IPU         | 0x08 | 0x48             |      |          |
| GPIO Output           | 0x01 | GPIO_Mode_Out_OD | 0x04 | 0x14     |
| GPIO_Mode_Out_PP      | 0x00 | 0x10             |      |          |
| GPIO_Mode_AF_OD       | 0x0C | 0x1C             |      |          |
| GPIO_Mode_AF_PP       | 0x08 | 0x18             |      |          |


```c title="例"
/* Configure all the GPIOA in Input Floating mode */ 

GPIO_InitTypeDef GPIO_InitStructure; //初始化结构体

GPIO_InitStructure.GPIO_Pin = GPIO_Pin_All; //定义GPIO口

GPIO_InitStructure.GPIO_Speed = GPIO_Speed_10MHz;//设置输出速度？？

GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING; //设置浮空输入

GPIO_Init(GPIOA, &GPIO_InitStructure);//初始化函数
```

---

### GPIO_ReadInputDataBit 函数

**Table 7.** 函数 **GPIO_ReadInputDataBit** 

| 函数名     | GPIO_ReadInputDataBit                                        |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | uint8_t GPIO_ReadInputDataBit(GPIO_TypeDef*  GPIOx, uint16_t GPIO_Pin) |
| 功能描述   | **读取**指定端口管脚的**输入**                               |
| 输入参数 1 | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设         |
| 输入参数 2 | GPIO_Pin：待读取的端口位   参阅  Section：GPIO_Pin 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 输入端口管脚值                                               |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |
 

```c title="例"
/* Reads the seventh pin of the GPIOB and store it in ReadValue variable */ u8 ReadValue; 

ReadValue = GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_7); 
```

---

### GPIO_ReadInputData函数 

**Table 8.** 函数 **GPIO_ReadInputData** 

| 函数名     | GPIO_ReadInputData                                   |
| ---------- | ---------------------------------------------------- |
| 函数原形   | u16 GPIO_ReadInputData(GPIO_TypeDef*  GPIOx)         |
| 功能描述   | **读取**指定的  GPIO 端口**输入**                    |
| 输入参数   | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设 |
| 输出参数   | 无                                                   |
| 返回值     | GPIO 输入数据端口值                                  |
| 先决条件   | 无                                                   |
| 被调用函数 | 无                                                   |
 

```c title="例"
/*Read the GPIOC input data port and store it in ReadValue variable*/ u16 ReadValue; 

ReadValue = GPIO_ReadInputData(GPIOC); 
```

---

### GPIO_ReadOutputDataBit 

**Table 9.** 函数 **GPIO_ReadOutputDataBit** 

| 函数名     | GPIO_ReadOutputDataBit                                       |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | u8  GPIO_ReadOutputDataBit(GPIO_TypeDef* GPIOx, u16 GPIO_Pin) |
| 功能描述   | **读取**指定端口管脚的**输出**                               |
| 输入参数 1 | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设         |
| 输入参数 2 | GPIO_Pin：待读取的端口位   参阅  Section：GPIO_Pin 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 输出端口管脚值                                               |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |


```c title="例"
/* Reads the seventh pin of the GPIOB and store it in ReadValue variable */ u8 ReadValue; 

ReadValue = GPIO_ReadOutputDataBit(GPIOB, GPIO_Pin_7); 
```

---

### GPIO_ReadOutputData 函数

**Table 10.** 函数 **GPIO_ReadOutputData** 

| 函数名     | GPIO_ReadOutputData                                  |
| ---------- | ---------------------------------------------------- |
| 函数原形   | u16 GPIO_ReadOutputData(GPIO_TypeDef*  GPIOx)        |
| 功能描述   | **读取**指定的  GPIO 端口**输出**                    |
| 输入参数   | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设 |
| 输出参数   | 无                                                   |
| 返回值     | GPIO 输出数据端口值                                  |
| 先决条件   | 无                                                   |
| 被调用函数 | 无                                                   |
 

```c title="例"
/* Read the GPIOC output data port and store it in ReadValue variable */ u16 ReadValue; 

ReadValue = GPIO_ReadOutputData(GPIOC); 
```

---

### GPIO_SetBits 函数

**Table 11.** 函数 **GPIO_SetBits** 

| 函数名     | GPIO_SetBits                                                 |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void GPIO_SetBits(GPIO_TypeDef* GPIOx, u16  GPIO_Pin)        |
| 功能描述   | 设置指定的数据端口位                                         |
| 输入参数 1 | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设         |
| 输入参数 2 | GPIO_Pin：待设置的端口位该参数可以取 GPIO_Pin_x(x 可以是 0-15)的任意组合参阅 Section：GPIO_Pin 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

```c title="例"
/* Set the GPIOA port pin 10 and pin 15 */ 

GPIO_SetBits(GPIOA, GPIO_Pin_10 | GPIO_Pin_15); 
```

---

### GPIO_ResetBits 

**Table 12.     GPIO_ResetBits**

| 函数名     | GPIO_ResetBits                                               |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void GPIO_ResetBits(GPIO_TypeDef* GPIOx,  u16 GPIO_Pin)      |
| 功能描述   | 清除指定的数据端口位                                         |
| 输入参数 1 | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设         |
| 输入参数 2 | GPIO_Pin：待清除的端口位该参数可以取 GPIO_Pin_x(x 可以是 0-15)的任意组合参阅 Section：GPIO_Pin 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |
 
```c title="例"
/* Clears the GPIOA port pin 10 and pin 15 */ 

GPIO_ResetBits(GPIOA, GPIO_Pin_10 | GPIO_Pin_15); 
```

---

### GPIO_WriteBit 函数

**Table 13.** 函数 **GPIO_WriteBit** 

| 函数名     | GPIO_WriteBit                                                |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void GPIO_WriteBit(GPIO_TypeDef*  GPIOx, u16 GPIO_Pin, BitAction BitVal) |
| 功能描述   | 设置或者清除指定的数据端口位                                 |
| 输入参数 1 | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设         |
| 输入参数 2 | GPIO_Pin：待设置或者清除指的端口位该参数可以取 GPIO_Pin_x(x 可以是 0-15)的任意组合参阅 Section：GPIO_Pin 查阅更多该参数允许取值范围 |
| 输入参数 3 | BitVal:  该参数指定了待写入的值该参数必须取枚举  BitAction 的其中一个值   Bit_RESET: 清除数据端口位   Bit_SET: 设置数据端口位 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

```c title="例"
/* Set the GPIOA port pin 15 */ 

GPIO_WriteBit(GPIOA, GPIO_Pin_15, Bit_SET); 
```

---

### GPIO_Write 函数

**Table 14.     GPIO_Write** 

| 函数名     | GPIO_Write                                           |
| ---------- | ---------------------------------------------------- |
| 函数原形   | void GPIO_Write(GPIO_TypeDef* GPIOx, u16  PortVal)   |
| 功能描述   | 向指定 GPIO 数据端口写入数据                         |
| 输入参数 1 | GPIOx：x 可以是 A，B，C，D 或者 E，来选择 GPIO  外设 |
| 输入参数 2 | PortVal: 待写入端口数据寄存器的值                    |
| 输出参数   | 无                                                   |
| 返回值     | 无                                                   |
| 先决条件   | 无                                                   |
| 被调用函数 | 无                                                   |

```c title="例"
/* Write data to GPIOA data port */ 
GPIO_Write(GPIOA, 0x1101); 
```

---

## GPIO的实战应用

学习了以上知识，就可以使用STM32来开始我们的实战演练了

---

### 跑马灯(点灯大师第一步)（GPIO输出）

---

#### 使用寄存器来点亮LED

**==此点灯过程中默认LED灯正极是插在3.3V下的，也就是IO输出低电平点亮==**

=== "main.c"
    
    ```c 
    #include "stm32f10x.h" // Device header
    #include "led.h"
    
    int main(void)
    {
      Led_Init();
      Led_ON();
      
      while(1)
      {
        LED0TURN;//高阶玩法-->PA0闪烁
        Delay_ms(500);//见下方中delay.c和delay.h
      }
    }
    ```

=== "led.h"
    
    ```c
    #ifndef __LED_H__
    #define __LED_H__
    
    #include "stm32f10x.h"
    
    void Led_Init(void);
    void Led_ON(void);
    void Led_OFF(void);
    
    #endif
    ```
    
=== "led.c"
    
    ```c
    #include "led.h"
    
    void Led_Init(void)
    {
      RCC->APB2ENR |=  0x1<<2; //使能端口A时钟
      GPIOA->CRL &= ~(0xff<<0);//PA0,PA1-->端口配置低寄存器清0
      GPIOA->CRL |= (0x33<<0);//PA0,PA1-->端口配置低寄存器设置为:输出模式，最大速度50MHz，通用开漏输出模式
      GPIOA->ODR |= 0X3<<1;//初始化后将PA0,PA1--IO口置1
    }
    
    void Led_ON(void)
    {
      GPIOA->ODR &= ~(0X1<<1);//PA1置0
    }
    
    void Led_OFF(void)
    {
      GPIOA->ODR |= (0X1<<1);//PA1置1
    }
    ```
    
**高阶玩法：**

1. 使用宏定义带参数

```c
//写在led.h头文件中
/*
  x==1 灯亮
  x==0 灯灭
  宏定义带参数,采用三目运算法
*/

#define LED0(x) (x)?(GPIOA->ODR &= ~(0x1<<0)):(GPIOE->ODR |= (0x1<<0)) //PA0
#define LED1(x) (x)?(GPIOA->ODR &= ~(0x1<<1)):(GPIOE->ODR |= (0x1<<1)) //PA1
#define LED2(x) (x)?(GPIOA->ODR &= ~(0x1<<2)):(GPIOE->ODR |= (0x1<<2)) //PA2
#define LED3(x) (x)?(GPIOA->ODR &= ~(0x1<<3)):(GPIOE->ODR |= (0x1<<3)) //PA3
//在主函数直接使用LED1(1) 就可以将 PA0处的小灯点亮

/*
  使用 异或 来控制LED灯的亮灭
  相同为0，不同为1 
  与0异或，为其本身
  与1异或，0，1互换
  xxxx xxxx xxxx x1xx
  ^
  0000 0000 0000 0100
  xxxx xxxx xxxx x0xx
*/

#define LED0TURN  GPIOA->ODR ^= (0x1<<0)//PA0
#define LED1TURN  GPIOA->ODR ^= (0x1<<1)//PA1
#define LED2TURN  GPIOA->ODR ^= (0x1<<2)//PA2
#define LED3TURN  GPIOA->ODR ^= (0x1<<3)//PA3
//在主函数main.c的while(1)直接使用LED1TURN和延时函数可以实现LED闪烁
```

`delay.h`

```c
#ifndef __DELAY_H
#define __DELAY_H
#include "stdint.h" //加上就是可以让编译器找到uint32_t 这个关键字

void Delay_us(uint32_t us);
void Delay_ms(uint32_t ms);
void Delay_s(uint32_t s);

#endif
```

`delay.c`

```c
#include "stm32f10x.h"
#include "Delay.h"
/**
  * @brief  微秒级延时
  * @param  xus 延时时长，范围：0~233015
  * @retval 无
  */
void Delay_us(uint32_t xus)
{
	SysTick->LOAD = 72 * xus;				//设置定时器重装值
	SysTick->VAL = 0x00;					//清空当前计数值
	SysTick->CTRL = 0x00000005;				//设置时钟源为HCLK，启动定时器
	while(!(SysTick->CTRL & 0x00010000));	//等待计数到0
	SysTick->CTRL = 0x00000004;				//关闭定时器
}

/**
  * @brief  毫秒级延时
  * @param  xms 延时时长，范围：0~4294967295
  * @retval 无
  */
void Delay_ms(uint32_t xms)
{
	while(xms--)
	{
		Delay_us(1000);
	}
}
 
/**
  * @brief  秒级延时
  * @param  xs 延时时长，范围：0~4294967295
  * @retval 无
  */
void Delay_s(uint32_t xs)
{
	while(xs--)
	{
		Delay_ms(1000);
	}
} 
```



2. 使用位带操作

   ~~未待完续~~

---

#### 使用库函数来点亮LED

**==此点灯过程中默认LED灯正极是插在3.3V下的，也就是IO输出低电平点亮==**

=== "main.c"
    
    ```c
    #include "stm32f10x.h"                  // Device header
    #include "led.h"
    
    int main(void)
    {
      Led_Init();
      //GPIO_ResetBits(GPIOA, GPIO_Pin_0);//重新初始化PA0--IO，初始化后值为0，点亮
      GPIO_WriteBit(GPIOA,GPIO_Pin_0,Bit_SET); //第三项可直接赋值：枚举、Bit_SET--高电平熄灭/Bit_RESET--低电平点亮
      while(1)
      {
         //以下就可以使PA0--LED进行闪烁
         GPIO_ResetBits(GPIOA,GPIO_Pin_0); //输出低电平 点亮LED
         Delay_ms(500);
         GPIO_SetBits(GPIOA,GPIO_Pin_0);  //输出高电平，点灭LED
         Delay_ms(500);
         
         GPIO_WriteBit(GPIOA,GPIO_Pin_0,Bit_RESET);//输出低电平 点亮LED
         Delay_ms(500);
         GPIO_WriteBit(GPIOA,GPIO_Pin_0,Bit_SET);//输出高电平，点灭LED
         Delay_ms(500);
         
         GPIO_WriteBit(GPIOA,GPIO_Pin_0,(BitAction)0);//输出高电平，点灭LED,0前面要加上强制类型转换 转换成枚举类型
         Delay_ms(500);
         GPIO_WriteBit(GPIOA,GPIO_Pin_0,(BitAction)1);//输出高电平，点灭LED，1前面要加上强制类型转换 转换成枚举类型
         Delay_ms(500);
      }
    }
    ```

=== "led.h"
    
    ```c
    #ifndef __LED_H__
    #define __LED_H__
    
    #include "stm32f10x.h"
    
    void Led_Init(void); 
    
    #endif
    ```
    
=== "led.c"
    
    ```c
    #include "led.h"
    
    void Led_Init(void)
    {
      RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);//使能时钟A
      
      //为初始化函数做准备
      GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
      
      GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;//设置PA1引脚
      
      GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP ;//设置输出模式为推挽输出
      
      GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
      //初始化函数↓
      GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
      
      GPIO_SetBits(GPIOA,GPIO_Pin_0);  //初始化时默认低电平，我们主动设置输出高电平，点灭LED
    
    }
    ```
    

**==在推挽输出的模式下，此时可以将LED灯正极接到IO口，负极接到GND，发现LED会继续闪烁，证实了推挽输出高低电平都具有驱动能力，如果此时再将输出模式改为开漏模式，LED将不再闪烁，证实了开漏模式在IO输出高电平时为高阻态==**

---

##### 流水灯

*PA0-->PA7的流水灯*

=== "main.c"
    
    ```c
    #include "stm32f10x.h"                  // Device header
    #include "led.h"
    #include "Delay.h"
    
    int main(void)
    {
      Led_Init();
      unsigned int i = 0;
      while(1)
      {
        GPIO_Write(GPIOA,~0x0001); //0000 0000 0000 0001 <--二进制 GPIO_Write第二个参数必须是16进制 注释只是形象解释
        Delay_ms(500);
        GPIO_Write(GPIOA,~0x0002); //0000 0000 0000 0010 
        Delay_ms(500);
        GPIO_Write(GPIOA,~0x0004); //0000 0000 0000 0100 
        Delay_ms(500);
        GPIO_Write(GPIOA,~0x0008); //0000 0000 0000 1000 
        Delay_ms(500);
        GPIO_Write(GPIOA,~0x0010); //0000 0000 0001 0000 
        Delay_ms(500);
        GPIO_Write(GPIOA,~0x0020); //0000 0000 0010 0000 
        Delay_ms(500);
        GPIO_Write(GPIOA,~0x0040); //0000 0000 0100 0000 
        Delay_ms(500);
        GPIO_Write(GPIOA,~0x0080); //0000 0000 1000 0000 
        Delay_ms(500);
        //下面这个是上面的简易写法 同样实现PA0-->PA7的流水灯的效果 
        /*
        for(i=0;i<8;i++)
        {
         GPIO_Write(GPIOA,~(0x1<<i));
         Delay_ms(500);
        }
        */
      }
    }
    ```

=== "led.h"
    
    ```c
    #ifndef __LED_H__
    #define __LED_H__
    
    #include "stm32f10x.h"
    
    void Led_Init(void); 
    
    #endif
    ```
    
=== "led.c"
    
    ```c
    #include "led.h"
    
    void Led_Init(void)
    {
      RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);//使能时钟A
      
      //为初始化函数做准备
      GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
      
      GPIO_InitStructure.GPIO_Pin = GPIO_Pin_ALL;//设置PA1引脚
      
      GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP ;//设置输出模式为推挽输出
      
      GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
      //初始化函数↓
      GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
      
      GPIO_SetBits(GPIOA,GPIO_Pin_ALL);  //初始化时默认低电平，我们主动设置输出高电平，点灭LED
    
    }
    ```
    
---

### 蜂鸣器（GPIO输出）

==**有源蜂鸣器是有正负引脚的和IO口引脚的，在IO引脚加上电压信号就会发声，发出的声音音调单一、频率固定,本次使用的蜂鸣器是低电平触发**==

=== "main.c"
    
    ```c
    #include "stm32f10x.h"                  // Device header
    #include "led.h"
    #include "Delay.h"
    #include "Beep.h"
    
    int main(void)
    {
      Beep_Init();//蜂鸣器初始化，蜂鸣器的IO口设置在PB12
      while(1)
      {
        GPIO_Write(GPIOB,~(0X1<<12));
        Delay_ms(100);
        GPIO_Write(GPIOB,(0X1<<12));
        Delay_ms(100);
        GPIO_Write(GPIOB,~(0X1<<12));
        Delay_ms(100);
        GPIO_Write(GPIOB,(0X1<<12));
        Delay_ms(700);
      }
    }
    ```

=== "Beep.h"
    
    ```c
    #ifndef __BEEP_H__
    #define __BEEP_H__
    
    #include "stm32f10x.h"
    
    void Beep_Init(void); 
    
    #endif
    ```
    
=== "Beep.c"
    
    ```c
    #include "Beep.h"
    
    void Beep_Init(void)
    {
      RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);//使能时钟B
      
      //为初始化函数做准备
      GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
      
      GPIO_InitStructure.GPIO_Pin = GPIO_Pin_12;//设置PB的12引脚
      
      GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP ;//设置输出模式为推挽输出
      
      GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
      //初始化函数↓
      GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
      
      GPIO_SetBits(GPIOB,GPIO_Pin_12);  //初始化时默认低电平，我们主动设置输出高电平，使蜂鸣器不响
    
    }
    ```
    
---

### 按键（GPIO输入）

在GPIO的工作模式中我们知道，GPIO输入模式下有四种方式：浮空输入，上拉输入，下拉输入和模拟输入，前三种都属于数字输入，也是此章节所学习和使用的模式，模拟输入是在ADC章节中所学习使用，在后面的学习过程中介绍。

何时使用那种输入方式，其实是看所使用的场景和硬件设计要求

1. 下图中，**按键按下低电平有效**---->我们就要使GPIO的输入模式默认为上拉输入，也就是在空闲状态下默认高电平，此时不能使用浮空输入是因为 引脚悬空会造成电平不确定，而下拉更不能使用，因为下拉默认低电平，就会造成按键无用

![KEY-IPU](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/KEY-IPU.png)

2. 下图中，**按键按下低电平有效**---->此时因为有个上拉电阻R1的存在，PA0默认高电平，所以此时我们可以使GPIO的输入模式使用上拉输入或者浮空输入都可以

![KEY-IPU-IN-FLOATING](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/KEY-IPU-IN_FLOATING.png)

3. 下图中,**按键按下高电平有效**---->我们就要使GPIO的输入模式默认为下拉输入，也就是在空闲状态下默认低电平，此时不能使用浮空输入是因为 引脚悬空会造成电平不确定，而上拉更不能使用，因为上拉默认高电平，就会造成按键无用

![KEY-IPD](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/KEY-IPD.png)

4. 下图中，**按键按下高电平有效**---->此时因为有个下拉电阻R1的存在，PA0默认低电平，所以此时我们可以使GPIO的输入模式使用下拉输入或者浮空输入都可以

![KEY-IPD-IN-FLOATING](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/KEY-IPD-IN_FLOATING.png)

**按键的介绍：**

* 按键：常见的输入设备，按下导通，松手断开

* 按键抖动：由于按键内部使用的是机械式弹簧片来进行通断的，所以在按下和松手的瞬间会伴随有一连串的抖动

![Key-Dou](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/Key-Dou.png)

---

#### 使用寄存器按键来控制LED {#KEY}

==**以下示例是按键按下时低电平触发，IO引脚空闲状态为高电平，上拉输入**==

=== "main.c"
    
    ```c
    #include "stm32f10x.h"                  // Device header
    #include "led.h"
    #include "Delay.h"
    #include "Beep.h"
    #include "Key.h"
    
    int main(void)
    {
      uint8_t keyflag=0;//按键标志位
      Led_Init();
      Key_Init();
      while(1)
      {
        
        keyflag = Key_GetNum();
        switch(keyflag)
        {
          case 1:
                 LED1_Turn();break;
          case 2:
                 LED2_Turn();break;
          case 3:break;
          case 4:break;
        } 
      }
    }
    ```

=== "led.h"
    
    ```c
    #ifndef __LED_H__
    #define __LED_H__
    
    #include "stm32f10x.h"
    
    void Led_Init(void); 
    void LED1_ON(void);
    void LED2_ON(void);
    void LED1_OFF(void);
    void LED2_OFF(void);
    void LED1_Turn(void);
    void LED2_Turn(void);
    #endif
    ```
    
=== "led.c"
    
    ```c
    #include "led.h"
    
    void Led_Init(void)
    {
      RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);//使能时钟A
      
      //为初始化函数做准备
      GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
      
      GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1|GPIO_Pin_2;//设置PA1,PA2引脚
      
      GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP ;//设置输出模式为推挽输出
      
      GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
      //初始化函数↓
      GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
      
      GPIO_Write(GPIOA,(0X6));//初始化时默认低电平，我们主动设置输出高电平，点灭LED
      //GPIO_SetBits(GPIOA,GPIO_Pin_1|GPIO_Pin_2); //使用上面或者下面这种方式都可以将其设置为高电平
    }
    
    void LED1_ON(void)
    {
      GPIO_ResetBits(GPIOA,GPIO_Pin_1);
    }
      
    void LED1_OFF(void)
    {
      GPIO_SetBits(GPIOA,GPIO_Pin_1);
    }
    
    
    void LED1_Turn(void)//PA1状态翻转
    {
      if(GPIO_ReadOutputDataBit(GPIOA,GPIO_Pin_1) == 0)//这个函数就是用来检测端口输出状态的函数，当检测输出端口为0时，将PA1置1
      {
        GPIO_SetBits(GPIOA,GPIO_Pin_1);
      }
      else
      {
        GPIO_ResetBits(GPIOA,GPIO_Pin_1);//当检测输出端口为1时，将PA1置0
      }
    }
    
    void LED2_ON(void)
    {
      GPIO_ResetBits(GPIOA,GPIO_Pin_2);
    }
    void LED2_OFF(void)
    {
      GPIO_SetBits(GPIOA,GPIO_Pin_2);
    }
    void LED2_Turn(void)//PA2状态翻转
    {
      if(GPIO_ReadOutputDataBit(GPIOA,GPIO_Pin_2) == 0)//这个函数就是用来检测端口输出状态的函数，当检测输出端口为0时，将PA1置1
      {
        GPIO_SetBits(GPIOA,GPIO_Pin_2);
      }
      else
      {
        GPIO_ResetBits(GPIOA,GPIO_Pin_2);//当检测输出端口为1时，将PA1置0
      }
    }
    ```
    
=== "key.h"
    
    ```c
    #ifndef __KEY_H__
    #define __KEY_H__
    
    #include "stm32f10x.h"
    #include "Delay.h"
    
    void Key_Init(void); 
    uint8_t Key_GetNum(void);
    
    #define KEY1  (GPIOB->IDR & (0x1<<1)) //GPIOB->IDR输入数据  读取PB1的状态 和1相与 
    #define KEY2  (GPIOB->IDR & (0x1<<11)) //GPIOB->IDR输入数据  读取PB11的状态 和1相与 
    
    #endif
    ```
    
=== "key.c"
    
    ```c
    #include "Key.h"
    
    void Key_Init(void)
    {
      RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);//使能时钟B
      
      //为初始化函数做准备
      GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
      
      GPIO_InitStructure.GPIO_Pin = GPIO_Pin_11|GPIO_Pin_1;//设置PB的1号和11号引脚
      
      GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU ;//设置输出模式为上拉输入
      
      GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ，GPIO输入时此参数无效 但一般还是设置上
      //初始化函数↓
      GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
      
    }
    
    uint8_t Key_GetNum(void)
    {
      if(!KEY1)//与0x01相与后为0 --> 按键按下
      {
        Delay_ms(15);//延时消抖
        if(!KEY1)
        {
          while(!KEY1)//等待按键抬起
         {
           
         }
         Delay_ms(15);//延时消抖
          return 1;
        }
      }
      if(!KEY2)//与0x01相与后为0 --> 按键按下
      {
        Delay_ms(15);//延时消抖
        if(!KEY2)
        {
          while(!KEY2)//等待按键抬起
         {
           
         }
         Delay_ms(15);//延时消抖
          return 2;
        }
      }
      return 0;
    }
    ```

---

#### 使用库函数按键来控制LED

==**以下示例是按键按下时低电平触发，IO引脚空闲状态为高电平，上拉输入**==

`main.c`,`led.c`和`led.h`都与[使用寄存器按键来控制LED](#KEY)章节一致


=== "key.h"
    
    ```c
    #ifndef __KEY_H__
    #define __KEY_H__
    
    #include "stm32f10x.h"
    #include "Delay.h"
    
    void Key_Init(void); 
    uint8_t Key_GetNum(void);
    
    
    #endif
    ```
    
=== "key.c"
    
    ```c
    #include "Key.h"
    
    void Key_Init(void)
    {
      RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);//使能时钟B
      
      //为初始化函数做准备
      GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
      
      GPIO_InitStructure.GPIO_Pin = GPIO_Pin_11|GPIO_Pin_1;//设置PB的1号和11号引脚
      
      GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU ;//设置输出模式为上拉输入
      
      GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ，GPIO输入时此参数无效 但一般还是设置上
      //初始化函数↓
      GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
      
    }
    
    uint8_t Key_GetNum(void)
    {
      uint8_t KeyNum = 0;//设置一个返回值变量 未按下-->返回值==0 ； key1按下-->返回值1 key2按下-->返回值2
      
      if(GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_1) == 0)//GPIO_ReadInputDataBit的返回值是 读取IO引脚的状态值 那么按下时就是0所以 == 0为真
      {
        Delay_ms(20);//按下时防抖
        while(GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_1) == 0);//直到按键弹起 再进行下一步操作
        Delay_ms(20);//弹起时防抖
        KeyNum = 1;
      }
        if(GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_11) == 0)//GPIO_ReadInputDataBit的返回值是 读取IO引脚的状态值 那么按下时就是0所以 == 0为真
      {
        Delay_ms(20);//按下时防抖
        while(GPIO_ReadInputDataBit(GPIOB, GPIO_Pin_11) == 0);//直到按键弹起 再进行下一步操作
        Delay_ms(20);//弹起时防抖
        KeyNum = 2;
      }
      
      return KeyNum;
    }
    ```

---

#### 使用光敏传感器来控制蜂鸣器（库函数）

**==光源充足的时候蜂鸣器不鸣叫，光源较暗时蜂鸣器鸣叫==**

=== "main.c"
    
    ```c
    #include "stm32f10x.h"                  // Device header
    #include "led.h"
    #include "Delay.h"
    #include "Beep.h"
    #include "Key.h"
    #include "LightSensor.h"
    
    int main(void)
    {
      Beep_Init();
      LightSen_Init();
      while(1)
      {
        if(Lightsen_Get() == 1)//光线较暗时，蜂鸣器鸣叫，Lightsen_Get()返回的值是默认的上拉模式高电平
        {
          Beep_ON();
        }
        else 
        {
          Beep_OFF();
        }
      }
    }
    ```

=== "LightSensor.h"

    ```c
    #ifndef __LIGHTSENSOR_H__
    #define __LIGHTSENSOR_H__
    
    #include "stm32f10x.h"
     
    void LightSen_Init(void);
    uint8_t Lightsen_Get(void);
    
    #endif
    ``` 
=== "LightSensor.c"

    ```c
    #include "LightSensor.h"
    
    void LightSen_Init(void)
    {
      RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);//使能时钟B
      
      //为初始化函数做准备
      GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
      
      GPIO_InitStructure.GPIO_Pin = GPIO_Pin_13;//设置PB的12引脚
      
      GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IPU ;//设置上拉模式
      
      GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ，在输入模式下无效
      //初始化函数↓
      GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
      
    }
    uint8_t Lightsen_Get(void)
    {
      return GPIO_ReadInputDataBit(GPIOB,GPIO_Pin_13);
    }
    ```    
    
=== "Beep.h"

    ```c
    #ifndef __BEEP_H__
    #define __BEEP_H__
    
    #include "stm32f10x.h"
    
    void Beep_Init(void); 
    void Beep_ON(void);
    void Beep_OFF(void);
    void Beep_Turn(void);
    
    #endif
    ```
=== "Beep.c"
    
    ```c
    #include "Beep.h"
    
    void Beep_Init(void)
    {
      RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);//使能时钟B
      
      //为初始化函数做准备
      GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
      
      GPIO_InitStructure.GPIO_Pin = GPIO_Pin_12;//设置PB的12引脚
      
      GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP ;//设置输出模式为推挽输出
      
      GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
      //初始化函数↓
      GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
      
      GPIO_SetBits(GPIOB,GPIO_Pin_12);  //初始化时默认低电平，我们主动设置输出高电平，使蜂鸣器不响
    
    }

    void Beep_ON(void)
    {
      GPIO_ResetBits(GPIOB,GPIO_Pin_12);
    }
    
    void Beep_OFF(void)
    {
      GPIO_SetBits(GPIOB,GPIO_Pin_12);
    }
    
    void Beep_Turn(void)
    {
      if(GPIO_ReadOutputDataBit(GPIOB,GPIO_Pin_12) == 0)//这个函数就是用来检测端口输出状态的函数，当检测输出端口为0时，将PB12置1
      {
        GPIO_SetBits(GPIOB,GPIO_Pin_12);
      }
      else
      {
        GPIO_ResetBits(GPIOB,GPIO_Pin_12);//当检测输出端口为1时，将PA1置0
      }
    }
    ```
    
![LightSensor](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/LightSensor.png)
    
    
