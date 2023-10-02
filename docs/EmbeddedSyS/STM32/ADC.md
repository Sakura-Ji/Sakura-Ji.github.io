---
comments: true
---

# ADC-数模转换

学习资料：

* [江科大STM32入门教程](https://www.bilibili.com/video/BV1th411z7sn/?p=21&share_source=copy_web&vd_source=1f86b29b1eacf120a2143333a298e645)

## ADC介绍

ADC 即模拟数字转换器，英文详称 Analog-to-digital converter，可以将外部的模拟信号转换为数字信号。**STM32F103** 系列最少都拥有 2 个 ADC外设，最多拥有3个ADC外设。

**ADC的功能特性:**

* **输入电压**: ADC 输入范围 VREF–≤VIN≤VREF+，最终还是由 VREF–、VREF+、VDDA 和 VSSA 决定的,VDDA 和 VREF+接 VCC3.3，而 VSSA 和 VREF-是接地，所以 ADC 的输入范 围即 0~3.3V
* ADC 可以**独立使用**，其中 ADC1 和 ADC2 还可以组成**双重模式**（提高采样率）

  * 在引脚手册中可发现，ADC1和ADC2引脚是重合的，它们可单独使用亦可以组成双重模式
  * 双重模式，在双重模式下中还要很多模式，例如同步规则模式（两个ADC不可同时对一个通道进行采样），快速/慢速交叉模式（可对一个通道进行采样，即ADC2立即启动并且ADC1在延迟7个ADC时钟周期后启动。PS:参考看STM32F103中文参考手册 P166 图34 ）等，PS:还需加深理解 ~未待完续~
* ADC 是**12位逐次逼近型**的模拟数字转换器,

  * ADC的分辨率(采样精度)：12位，即电压范围是0v-3.3v的，转换器就会把0v-3.3v平均分成$$2^{21} = 4096$$份 
  * 设转换器所得到的值为数字量为x，所求电压值为y  公式是 $$ y = \cfrac {x}{4096}\times3.3$$
  * 采集的电压为０时，里面的刻度会显示是０，当采集的电压是3.3V时，里面的刻度会显示是$$ 2^{21}-1=4095 $$

  * STM32 的 ADC 最大的转换速率为 1Mhz，也就是转换时间为 1us（在 ADCCLK=14M,采样周期为 1.5 个ADC时钟下得到）
* 它有 **18 个通道**，可测量 16 个外部(GPIO)和 2 个内部信号源(温度传感器和内部参考电压)
* 各通道的 A/D 转换可以**单次、连续、扫描或间断模式**执行
* ADC 的结果可以 **左对齐** 或 **右对齐** 的方式以二进制形式 存储在 32 位数据寄存器中（只有在双重模式下才用到了高16位）

  * 左对齐: 二进制数据放在--> 高位
  * 右对齐: 正常形式放在右边 -->低位
* ADC的输入时钟**不得超过14MHz**，它是由PCLK2经分频产生
* ADC有一个**内置自校准模式**。校准可大幅减小因内部电容器组的变化而造成的准精度误差
* 模拟**看门狗**特性允许应用程序检测输入电压是否超出用户定义的高/低阀值

## ADC如何实现数模转换

以ADC0809芯片来讲解STM32内部的ADC外设是如何实现的(因为STM32并没有画出ADC内部结构)，ADC0809是一种典型的独立的8位A/D转换器芯片，广泛应用于计算机、仪器仪表等领域。

![ADC0809](https://pic.imgdb.cn/item/6513ce53c458853aef34d53b/ADC0809.png)

**DAC**：数模转换器，内部使用加权电阻网路来实现的转换 PS:更具体的知识点需要再学习，~未待完续~

**电压比较器**：它可以判断两个输入信号的电压的大小关系，然后输出一个电平来表示谁大谁小，它的两个通道一个是待测电压，另一个就是DAC的输出电压

**逐次逼近寄存器SAR：**通过比较器，我们就使SAR来调节DAC的数值使其逐渐和待测电压近似相等

**ADC0809是8位的ADC芯片:**采样精度 $$2^8 - 1 = 255$$，逐步逼近法采用2分法，在二进制上的表现就像0~255进行判断，总共找至少找8次就会找到值

> 1. 1000 0000 = 128 大了
> 2. 0100 0000 = 64  大了
> 3. 0010 0000 = 32  小了
> 4. 0011 0000 = 48 小了
> 5. 0011 1000 = 56 小了
> 6. 0011 1100 = 60 小了
> 7. 0011 1110 = 62 大了
> 8. 0011 1101 = 61 OK

当然如果说第一次就是128 就找到它的值了，那这不是一次就找到了吗？ 听JKD老师将，是从高到底依次判断8位二进制的每一位的位权，所以是 8个ADC的周期  也就是 虽然第一次就 OK了 但是还是需要 将接下来的每一位都进行判断 (我不是特别理解嗷) 所以下文中 12位的ADC 的 12 + 0.5个周期是采集12位AD时间是固定的(那0.5可能是杂事毕竟一个是理想状态一个是现实情况)

## STM32--ADC外设

### ADC的结构框图

![ADC_Struct](https://pic.imgdb.cn/item/6513ce52c458853aef34d4ff/ADC_Struct.png)

**规则通道组**：一次性最多选择16个通道，如果一次选择多个通道，最好使用DMA(数据转运小帮手)来配合使用，因为从上图的框图来看，规则通道只有一个数据寄存器，当有新的数据写入时，会覆盖上一次的数据，所以我们应该快速的将上一个通道的数据保存起来

**注入通道组**：一次性最多选择4个通道，并且可同时保存4个通道的数据，因为注入组有4个数据寄存器

**开始转换ADC的信号：**有两种，因为DAC经常需要固定时间来转换一次

* 第一种是：软件触发，即通过用户写入代码来触发开始ADC转换
* 第二种是：硬件触发，主要是来自于定时器,也可以选择外部中断触发，PS：最好使用定时器的主模式触发，即通过更新事件的TRGO来触发，因为这样就不会频繁的进入中断来影响主程序的进行

>  **主模式触发DAC的功能：**内部硬件在不受程序的控制下实现自动运行，通过更新事件映射到 触发控制器的TRGO 中，然后TRGO直接接到DAC的触发转换引脚上，整个过程不需要软件的的参与(利用中断机制，当某一条件达成，进入中断控制DAC)，实现了硬件的自动化 -- 可参考我的[STM32之定时器 - Sakura_Ji - 博客园](https://www.cnblogs.com/Sakura-Ji/p/17723325.html)那一章节的笔记

![ADC_STM32Info](https://pic.imgdb.cn/item/6513ce50c458853aef34d4b7/ADC_STM32Info.png)

### ADC的输入通道

![ADC_Channel](https://pic.imgdb.cn/item/6513ce50c458853aef34d47a/ADC_Channel.png)

### ADC的规则转换模式

>  * **EOC 转换结束位 (End of conversion) :** 该位由硬件在(规则或注入)通道组转换结束时设置，由软件清除或由读取ADC_DR时清除 0：转换未完成； 1：转换完成。
>  * **使用上DMA 切记** 进入中断后 不要再使用之前的判断条件来获取数据了  因为 **ADC的DR寄存器的读操作会清除EOC（转换结束）标志位,所以ADC的中断服务函数中判断不到EOC标志位**（清除了EOC标志位，但ADC的中断服务函数还是可以正常进入的。只是判断不到EOC标志了)  **举例:**
>    * 使用 连续转换非扫描的情况下，之前不使用DMA时   进入中断后 是判断`ADC_GetITStatus(ADC1, ADC_IT_EOC)==SET` 然后才获取/更新 数据 但是在你使用 DMA后 它会自动读取数据 无需再使用中断中的这个判断条件再获取了

#### 单次转换非扫描模式

<img src="https://pic.imgdb.cn/item/6513ce4fc458853aef34d43f/ADC_SingalNoScan.png" style="zoom:50%;" />

**解释:**

> * **单次转换：**每次转换都需要重新触发控制信号
> * **非扫描：**只有第一个序列1的位置有效，也就是只有在序列1位置的通道才是有效的通道

**过程展示:**

> * 触发转换，ADC会对在序列1中的通道进行模数转换
> * 转换完成后，转换结果将放在数据寄存器里，同时给EOC标志位 **置1**，转换结束
> * 通过判断EOC标志位是否是1，若标志位为1，可去数据寄存器里读出结果(因为这里就一个通道所以 可认为转换完成即 有数据，但请不要将EOC等同于转换一个通道就会置1，而是将序列表中的通道都转换完成才会置1 它叫 转换完成标志位 不懂请看下面的 单次转换连续模式中的 过程解释)
>
> * 若想再启动一次转换，需要再触发一次
>
> * 若想换其它通道进行转换，需在转换之前，把第一个位置的通道改成其他通道

#### 连续转换非扫描模式

<img src="https://pic.imgdb.cn/item/6513ce4ec458853aef34d3cd/ADC_ContinuousNoScan.png" style="zoom:50%;" />

**解释:**

> - **连续转换：**在一次转换结束后不会停止，而是立刻开始下一轮的转换，然后一直持续下去，只需要最开始触发一次，就可以一直转换
> - **非扫描：**只有第一个序列1的位置有效，也就是只有在序列1位置的通道才是有效的通道

**过程展示:**

> * 触发转换，只需要触发一次，ADC会对在序列1中的通道进行模数转换
> * 读取的时候不用判断是否结束，直接从数据寄存器读即可

#### 单次转换扫描模式

<img src="https://pic.imgdb.cn/item/6513ce4dc458853aef34d378/ADC_SingalScan.png" style="zoom:50%;" />

**解释：**

> * **单次转换：**每次转换都需要重新触发控制信号
>
> * **扫描模式：**现在不仅仅是序列1有效，而是在初始化结构体时由`ADC_InitStructure.ADC_NbrOfChannel`规定了顺序进行规则转换的 ADC 通道的数目(=序列号)，这个数目的取值范围是 1 到 16，那么在触发时就会转换多少个通道，序列中的通道顺序无规定要求，可随意设置

**过程展示:**

> * 触发转换，ADC会对序列1到序列7(以上图作为示例)中的通道进行模数转换
> * 转换完成(这7个通道都进行转换完成)后，转换结果也只有最后一个通道的 即上图中的 通道6 在数据寄存器里，同时给EOC标志位 **置1**，转换结束
>   * **EOC是在这7个通道都转换完成后置才置1**(侧面证明了EOC是转换完成标志位，而不是数据寄存器更新标志位)，所以我们需要使用DMA及时将数据移走，防止数据被覆盖，而且在上方的框图中我发现DMA请求信号 从 模数转换器触发的  但是呢 DMA读取数据肯定是从数据寄存器ADC_DR读取的 至于如何判断数据更新了  等DMA更新！   PS:这个地方还需深究等学完DMA看看能不能补充 ~未待完续~
> * 通过判断EOC标志位是否是1，若标志位为1，就可判断所有通道都转换结束了
>* 若想再启动一次转换，需要再触发一次，不读数据记得 软件清0 EOC

#### 连续转换扫描模式

<img src="https://pic.imgdb.cn/item/6513ce4dc458853aef34d334/ADC_ContinuousScan.png" style="zoom:50%;" />

**解释：**

> * **连续转换：**在一次转换结束后不会停止，而是立刻开始下一轮的转换，然后一直持续下去，只需要最开始触发一次，就可以一直转换
>
> * **扫描模式：**现在不仅仅是序列1有效，而是在初始化结构体时由`ADC_InitStructure.ADC_NbrOfChannel`规定了顺序进行规则转换的 ADC 通道的数目(=序列号)，这个数目的取值范围是 1 到 16，那么在触发时就会转换多少个通道，序列中的通道顺序无规定要求，可随意设置
>

**过程解释:**

> * 触发转换，只需要触发一次，ADC会对序列1到序列7(以上图作为示例)中的通道进行模数转换
> * 使用DMA进行读取数据

### ADC的触发控制

![ADC_Trigger](https://pic.imgdb.cn/item/6513ce4cc458853aef34d30f/ADC_Trigger.png)

> 以上就是ADC1，2的规则通道开始转换信号

### ADC的数据处理

![ADC_DataHandle](https://pic.imgdb.cn/item/6513ce45c458853aef34d0dc/ADC_DataHandle.png)

> * 右对齐读数据寄存器，就是转换结果
>
> * 左对齐读取数据寄存器，比实际大16倍 PS: 因为2进制中左移1位 就是 数据乘以2倍
>   * 左对齐应用：不想要这么高的分辨率，你觉得0-4095数太大了，左对齐后取高八位即可，就从12位的ADC退化为8位的ADC精度了

### ADC的转换时间

> * 不需要非常高的转换频率，可以将此时间忽略
>
> * AD转换的步骤：**1.采样，2.保持，3.量化，4.编码**
>
> * STM32 ADC的总转换时间为：  TCONV = 采样时间(采样+保持时间) + 12.5个ADC周期(12位的ADC需要12个周期 +0.5做其它事情的周期 )
>
> * 采样+保持时间越长，毛刺现象干扰越低，但是会使转换时间增加
>
> * 例如：当ADCCLK=14MHz，采样时间为1.5个ADC周期 ：TCONV = 1.5 + 12.5 = 14个ADC周期 = 1μs
>
>

### ADC的自校准

> * ADC有一个内置自校准模式。校准可大幅减小因内部电容器组的变化而造成的准精度误差。校准期间，在每个电容器上都会计算出一个误差修正码(数字值)，这个码用于消除在随后的转换中每个电容器上产生的误差
>
> * 建议在每次上电后执行一次校准
>
> * 启动校准前， ADC必须处于关电状态超过至少两个ADC时钟周期

### ADC的相关应用电路

![ADC_Apply](https://pic.imgdb.cn/item/65158f54c458853aefc92571/ADC_Apply.png)

* 电位器产生一个可调的电压的电路

> 中间的滑动端可以输出一个0~3.3伏可调的电压

* 分压方法输出传感器阻值的电路

> * 传感器输出电压的电路，例如光敏电阻、热敏电阻、红外接头管、麦克风等都可以等效为一个可变电阻
> * 那电阻阻值得通过和一个固定电阻串联分压，来得到一个反应电阻值电压的电路
> * 当传感器阻止变小时，下拉作用变强，输出端电压就下降
> * 传当感器组织变大时，下拉作用变弱，输出端受上拉电阻的作用，电压就会升高
> * 固定电阻建议选择和传感器阻值相近的电阻，才可以得到一个位于中间电压区域，比较好的输出
> * 此处传感器和固定电阻的位置也调换，输出电压的极性就反过来了

* 简单的电压转换电路

> * 由于ADC只能接收0~3.3V的电压，但是想测一个0-5V的VIN电压，就可以搭建第三种电路
> * 使用电阻分压，上面阻值17K，下面阻值33K，加一起50K，
> * 中间的电压就是VIN/50K*33K,得到的电压范围就是0-3.3伏,就可以进入ADC转换了
> * 想要其他范围（如5V、10V）的VIN电压可类似操作，电压再高一点就不建议了，不安全

## ADC的实战演习

### 单次(连续)转换非扫描模式 -- 电位器

代码为单次转换，连续转换的方法写在了最后，只需要改动三个地方即可，很简单。

`ADC.h`

```c
#ifndef  __ADC_H__//如果没有定义了则参加以下编译
#define  __ADC_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h" 

void Adc_Init(void);
uint16_t Adc_Getval(void);
#endif  //结束编译

```

`ADC.c`

```c
#include "ADC.h"

void Adc_Init(void)
{
  /*1.开启ADC和GPIO的时钟*/
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA|RCC_APB2Periph_ADC1, ENABLE);//使能时钟A和ADC1时钟
  
  RCC_ADCCLKConfig(RCC_PCLK2_Div6);//设置ADC预分频 -- ADC的输入时钟不得超过14M -- 此处是6分频 ADC 12MHZ
  /*2.初始化GPIOA*/
  //为初始化GPIO函数做准备
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0;//设置PA0引脚 -- 也就是ADC1通道0的位置
  
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN ;//设置GPIO为模拟输入
  
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  //初始化函数↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
  /*2.选择转换的通道*/
  /*选择规则组通道 -- 将第0个通道 放到 序列1上  -- 因为我们选择非扫描模式 所以要放到序列1上*/
  ADC_RegularChannelConfig(ADC1, ADC_Channel_0, 1, ADC_SampleTime_55Cycles5);//第四个参数是采样时间 -- 如果需要稳定转换 选采样时间长 本示例中无所谓 选择55.5个ADCCLK的采样时间
  /*3.ADC初始化*/
  ADC_InitTypeDef ADC_InitStructure; 

  ADC_InitStructure.ADC_Mode = ADC_Mode_Independent; //使用独立模式

  ADC_InitStructure.ADC_ScanConvMode = DISABLE; //是否开启扫描模式--否

  ADC_InitStructure.ADC_ContinuousConvMode = DISABLE; //选择连续转换还是单次转换

  ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;//不使用外部触发 -- 使用软件触发

  ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right; //数据对齐--选择右对齐

  ADC_InitStructure.ADC_NbrOfChannel = 1;//这个参数只有在扫描模式才有用 -- 选择通道数目(在非扫描模式下只有序列1才有用)

  ADC_Init(ADC1, &ADC_InitStructure); 
  /*4.开启ADC--上电*/
  ADC_Cmd(ADC1, ENABLE); 
  /*5.开启ADC校准*/
  ADC_ResetCalibration(ADC1); //上电复位校准
  /*
   *RSTCAL：复位校准 (Reset calibration) 
   *该位由软件设置并由硬件清除。在校准寄存器被初始化后该位将被清除。
   *0：校准寄存器已初始化；
   *1：初始化校准寄存器。
   *注：如果正在进行转换时设置RSTCAL，清除校准寄存器需要额外的周期。
  */
  while(ADC_GetResetCalibrationStatus(ADC2) == SET){}//获取复位校准后的状态 如果还是1 说明还没有校准成功 则一直等待
  ADC_StartCalibration(ADC1);//开启校准
  while(ADC_GetCalibrationStatus(ADC1)==SET){}//获取校准状态 等待校准完成
    
}

uint16_t Adc_Getval(void)
{
  ADC_SoftwareStartConvCmd(ADC1,ENABLE);//软件触发
  /*
   *EOC：转换结束位 (End of conversion) 
   *该位由硬件在(规则或注入)通道组转换结束时设置，由软件清除或由读取ADC_DR时清除
   *0：转换未完成；
   *1：转换完成。
  */
  while(ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET){} //等待转换结束 --> 55.5+12.5=68ADCCLK -->1/12MHZ*68 ~ 5.6微秒
  return ADC_GetConversionValue(ADC1);//返回  近一次 ADC1 规则组的转换结果
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "ADC.h"

uint16_t ADCvalue;//ADC返回的值
float Volatge;//转换成电压
int main(void)
{
  OLED_Init();
  Adc_Init();
  
  OLED_ShowString(1,1,"ADCValue:");
  OLED_ShowString(2,1,"Voltage:0.00V");
  while(1)
  {
    ADCvalue = Adc_Getval();
    Volatge = (float)ADCvalue / 4095 *3.3;//不必要太纠结4095 对应3.3V还是4096 -- 0~4095 = 4096
    OLED_ShowNum(1,10,ADCvalue,4);
    OLED_ShowNum(2,9,Volatge,1);//因为OLED.c中未包含显示小数的函数 所以折中了这种办法
    OLED_ShowNum(2,11,(uint16_t)(Volatge * 100 )% 100,2);
    Delay_ms(100);
  }
}
```

> 如果要转换成 连续模式 只需要
>
> ```c
> ADC_InitStructure.ADC_ContinuousConvMode = ENABLE; //选择连续转换
> ···
> ADC_SoftwareStartConvCmd(ADC1,ENABLE);//软件触发 --将这个函数写到初始化函数Adc_Init的最后
> 
> while(ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET){}//注释掉 等待转换结束这个判断 -- 无需判断直接读值
> ```

### 单次(连续)转换非扫描模式 -- 多通道转换

本章节不使用DMA这个数据转存小帮手，所以不使用扫描模式，因为EOC是在所有有效通道都转换完成才置1，而转换完成其它的通道时既没有标志位也没有中断的产生，所以不好判断是否这个通道转换完了，所以下方的代码采用单次非扫描模式，采用每次触发前改变通道

`ADC.h`

```c
#ifndef  __ADC_H__//如果没有定义了则参加以下编译
#define  __ADC_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h" 

void Adc_Init(void);
uint16_t Adc_Getval(uint8_t ADC_Channel);
#endif  //结束编译
```

`ADC.c`

```c
#include "ADC.h"

void Adc_Init(void)
{
  /*1.开启ADC和GPIO的时钟*/
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA|RCC_APB2Periph_ADC1, ENABLE);//使能时钟A和ADC1时钟
  
  RCC_ADCCLKConfig(RCC_PCLK2_Div6);//设置ADC预分频 -- ADC的输入时钟不得超过14M -- 此处是6分频 ADC 12MHZ
  /*2.初始化GPIOA*/
  //为初始化GPIO函数做准备
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0|GPIO_Pin_1|GPIO_Pin_2|GPIO_Pin_3;//设置PA0，1，2，3引脚 -- 也就是ADC1通道0，1，2，3的位置
  
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN ;//设置GPIO为模拟输入
  
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  //初始化函数↓
  GPIO_Init(GPIOA,&GPIO_InitStructure);//初始化
 
  /*2.ADC初始化*/
  ADC_InitTypeDef ADC_InitStructure; 

  ADC_InitStructure.ADC_Mode = ADC_Mode_Independent; //使用独立模式

  ADC_InitStructure.ADC_ScanConvMode = DISABLE; //是否开启扫描模式--否

  ADC_InitStructure.ADC_ContinuousConvMode = DISABLE; //选择连续转换还是单次转换

  ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;//不使用外部触发 -- 使用软件触发

  ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right; //数据对齐--选择右对齐

  ADC_InitStructure.ADC_NbrOfChannel = 1;//这个参数只有在扫描模式才有用 -- 选择通道数目(在非扫描模式下只有序列1才有用)

  ADC_Init(ADC1, &ADC_InitStructure); 
  /*3.开启ADC--上电*/
  ADC_Cmd(ADC1, ENABLE); 
  /*4.开启ADC校准*/
  ADC_ResetCalibration(ADC1); //上电复位校准
  /*
   *RSTCAL：复位校准 (Reset calibration) 
   *该位由软件设置并由硬件清除。在校准寄存器被初始化后该位将被清除。
   *0：校准寄存器已初始化；
   *1：初始化校准寄存器。
   *注：如果正在进行转换时设置RSTCAL，清除校准寄存器需要额外的周期。
  */
  while(ADC_GetResetCalibrationStatus(ADC2) == SET){}//获取复位校准后的状态 如果还是1 说明还没有校准成功 则一直等待
  ADC_StartCalibration(ADC1);//开启校准
  while(ADC_GetCalibrationStatus(ADC1)==SET){}//获取校准状态 等待校准完成
    
}

uint16_t Adc_Getval(uint8_t ADC_Channel)
{
   /*选择转换的通道*/
  /*选择规则组通道 因为我们选择非扫描模式 所以要放到序列1上*/
  ADC_RegularChannelConfig(ADC1, ADC_Channel, 1, ADC_SampleTime_55Cycles5);
  ADC_SoftwareStartConvCmd(ADC1,ENABLE);//软件触发
  /*
   *EOC：转换结束位 (End of conversion) 
   *该位由硬件在(规则或注入)通道组转换结束时设置，由软件清除或由读取ADC_DR时清除
   *0：转换未完成；
   *1：转换完成。
  */
  while(ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET){} //等待转换结束 --> 55.5+12.5=68ADCCLK -->1/12MHZ*68 ~ 5.6微秒
  return ADC_GetConversionValue(ADC1);//返回  近一次 ADC1 规则组的转换结果
}
```

`main.c`

```c
#include "stm32f10x.h"                  // Device header
#include "Delay.h"
#include "OLED.h"
#include "ADC.h"

uint16_t Adc0,Adc1,Adc2,Adc3;
int main(void)
{
  OLED_Init();
  Adc_Init();
  
  OLED_ShowString(1,1,"ADC0:");
  OLED_ShowString(2,1,"ADC1:");
  OLED_ShowString(3,1,"ADC2:");
  OLED_ShowString(4,1,"ADC3:");
  while(1)
  {
    Adc0 = Adc_Getval(ADC_Channel_0);//电阻器
    Adc1 = Adc_Getval(ADC_Channel_1);//光敏传感器
    Adc2 = Adc_Getval(ADC_Channel_2);//热敏传感器
    Adc3 = Adc_Getval(ADC_Channel_3);//反射式红外传感器
   
    OLED_ShowNum(1,6,Adc0,4);
    OLED_ShowNum(2,6,Adc1,4);
    OLED_ShowNum(3,6,Adc2,4);
    OLED_ShowNum(4,6,Adc3,4);
    
    Delay_ms(100);
  }
}
```

## ADC库函数 

**Table 1. ADC 固件库函数 **

| 函数名                                   | 描述                                                     |
| ---------------------------------------- | -------------------------------------------------------- |
| ADC_DeInit根据                           | 将外设 ADCx 的全部寄存器重设为缺省值                     |
| **ADC_Init**                             | ADC_InitStruct 中指定的参数初始化外设 ADCx 的寄存器      |
| ADC_StructInit                           | 把 ADC_InitStruct 中的每一个参数按缺省值填入             |
| **ADC_Cmd**                              | 使能或者失能指定的 ADC                                   |
| ADC_DMACmd                               | 使能或者失能指定的 ADC 的 DMA 请求                       |
| ADC_ITConfig                             | 使能或者失能指定的 ADC 的中断                            |
| **ADC_ResetCalibration**                 | 重置指定的  ADC 的校准寄存器                             |
| **ADC_GetResetCalibrationStatus**        | 获取  ADC 重置校准寄存器的状态                           |
| **ADC_StartCalibration**                 | 开始指定  ADC 的校准程序                                 |
| **ADC_GetCalibrationStatus**             | 获取指定  ADC 的校准状态                                 |
| **ADC_SoftwareStartConvCmd**             | 使能或者失能指定的  ADC 的软件转换启动功能               |
| **ADC_GetSoftwareStartConvStatus**       | 获取  ADC 软件转换启动状态                               |
| ADC_DiscModeChannelCountConfig           | 对 ADC 规则组通道配置间断模式                            |
| ADC_DiscModeCmd                          | 使能或者失能指定的  ADC 规则组通道的间断模式             |
| **ADC_RegularChannelConfig**             | 设置指定 ADC  的规则组通道，设置它们的转化顺序和采样时间 |
| ADC_ExternalTrigConvConfig               | 使能或者失能  ADCx 的经外部触发启动转换功能              |
| **ADC_GetConversionValue**               | 返回  近一次 ADCx 规则组的转换结果                       |
| ADC_GetDuelModeConversionValue           | 返回  近一次双 ADC 模式下的转换结果                      |
| ADC_AutoInjectedConvCmd                  | 使能或者失能指定 ADC 在规则组转化后自动开始注入组转换    |
| ADC_InjectedDiscModeCmd                  | 使能或者失能指定  ADC 的注入组间断模式                   |
| ADC_ExternalTrigInjectedConvConfig       | 配置  ADCx 的外部触发启动注入组转换功能                  |
| ADC_ExternalTrigInjectedConvCmd          | 使能或者失能  ADCx 的经外部触发启动注入组转换功能        |
| ADC_SoftwareStartinjectedConvCmd         | 使能或者失能  ADCx 软件启动注入组转换功能                |
| ADC_GetsoftwareStartinjectedConvStatus   | 获取指定  ADC 的软件启动注入组转换状态                   |
| ADC_InjectedChannleConfig                | 设置指定 ADC  的注入组通道，设置它们的转化顺序和采样时间 |
| ADC_InjectedSequencerLengthConfig        | 设置注入组通道的转换序列长度                             |
| ADC_SetinjectedOffset                    | 设置注入组通道的转换偏移值                               |
| ADC_GetInjectedConversionValue           | 返回  ADC 指定注入通道的转换结果                         |
| ADC_AnalogWatchdogCmd                    | 使能或者失能指定单个/全体，规则/注入组通道上的模拟看门狗 |
| ADC_AnalogWatchdongThresholdsConfig      | 设置模拟看门狗的高/低阈值                                |
| ADC_AnalogWatchdongSingleChannelCon  fig | 对单个  ADC 通道设置模拟看门狗                           |
| ADC_TampSensorVrefintCmd                 | 使能或者失能温度传感器和内部参考电压通道                 |
| ADC_GetFlagStatus                        | 检查制定  ADC 标志位置 1 与否                            |
| ADC_ClearFlag                            | 清除  ADCx 的待处理标志位                                |
| ADC_GetITStatus                          | 检查指定的  ADC 中断是否发生                             |
| ADC_ClearITPendingBit                    | 清除  ADCx 的中断待处理位                                |

### 函数 RCC_ADCCLKConfig 

| 函数名     | RCC_ADCCLKConfig                                             |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | void ADC_ADCCLKConfig(u32  RCC_ADCCLKSource)                 |
| 功能描述   | **设置  ADC 时钟（ADCCLK）**                                 |
| 输入参数   | RCC_ADCCLKSource: 定义 ADCCLK，该时钟源自 APB2 时钟（PCLK2）参阅  Section：RCC_ADCCLKSource 查阅更多该参数允许取值范围 |
| 输出参数   | 无                                                           |
| 返回值     | 无                                                           |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

**RCC_ADCCLKSource** 该参数设置了ADC时钟（ADCCLK），Table 362. 给出了该参数可取的值。

**Table 2. RCC_ADCCLKSource** 值 

| **RCC_ADCCLKSource** | 描述                |
| -------------------- | ------------------- |
| RCC_PCLK2_Div2       | ADC 时钟 = PCLK / 2 |
| RCC_PCLK2_Div4       | ADC 时钟 = PCLK / 4 |
| RCC_PCLK2_Div6       | ADC 时钟 = PCLK / 6 |
| RCC_PCLK2_Div8       | ADC 时钟 = PCLK / 8 |

例： 

```c
/* Configure ADCCLK such as ADCCLK = PCLK2/6 */ 

RCC_ADCCLKConfig(RCC_PCLK2_Div6); 
```

### 函数 ADC_RegularChannelConfig 

**Table 3.** 函数 **ADC_RegularChannelConfig** 

| 函数名      | ADC_RegularChannelConfig                                     |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  ADC_RegularChannelConfig(ADC_TypeDef* ADCx, u8 ADC_Channel, u8 Rank, u8  ADC_SampleTime) |
| 功能描述    | **设置指定  ADC 的规则组通道，设置它们的转化顺序和采样时间** |
| 输入参数  1 | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2       |
| 输入参数  2 | ADC_Channel：被设置的 ADC 通道参阅章节 ADC_Channel 查阅更多该参数允许取值范围 |
| 输入参数  3 | Rank：规则组采样顺序。取值范围 1 到 16。                     |
| 输入参数  4 | ADC_SampleTime：指定 ADC 通道的采样时间值参阅章节 ADC_SampleTime 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**ADC_Channel**

参数 ADC_Channel 指定了通过调用函数 ADC_RegularChannelConfig 来设置的 ADC 通道。Table 26. 列举了 ADC_Channel 可取的值： 

 **Table 4. ADC_Channel** 值 

| ADC_Channel    | 描述              |
| -------------- | ----------------- |
| ADC_Channel_0  | 选择 ADC 通道 0   |
| ADC_Channel_1  | 选择 ADC 通道 1   |
| ADC_Channel_2  | 选择 ADC 通道 2   |
| ADC_Channel_3  | 选择 ADC 通道 3   |
| ADC_Channel_4  | 选择 ADC 通道 4   |
| ADC_Channel_5  | 选择 ADC 通道 5   |
| ADC_Channel_6  | 选择  ADC 通道 6  |
| ADC_Channel_7  | 选择  ADC 通道 7  |
| ADC_Channel_8  | 选择  ADC 通道 8  |
| ADC_Channel_9  | 选择  ADC 通道 9  |
| ADC_Channel_10 | 选择  ADC 通道 10 |
| ADC_Channel_11 | 选择  ADC 通道 11 |
| ADC_Channel_12 | 选择  ADC 通道 12 |
| ADC_Channel_13 | 选择  ADC 通道 13 |
| ADC_Channel_14 | 选择  ADC 通道 14 |
| ADC_Channel_15 | 选择  ADC 通道 15 |
| ADC_Channel_16 | 选择  ADC 通道 16 |
| ADC_Channel_17 | 选择  ADC 通道 17 |

**ADC_SampleTime**

ADC_SampleTime 设定了选中通道的 ADC 采样时间。Table 27. 列举了 ADC_SampleTime 可取的值： 

**Table 5. ADC_SampleTime** 值： 

| **ADC_SampleTime**        | 描述                   |
| ------------------------- | ---------------------- |
| ADC_SampleTime_1Cycles5   | 采样时间为  1.5 周期   |
| ADC_SampleTime_7Cycles5   | 采样时间为  7.5 周期   |
| ADC_SampleTime_13Cycles5  | 采样时间为  13.5 周期  |
| ADC_SampleTime_28Cycles5  | 采样时间为  28.5 周期  |
| ADC_SampleTime_41Cycles5  | 采样时间为  41.5 周期  |
| ADC_SampleTime_55Cycles5  | 采样时间为  55.5 周期  |
| ADC_SampleTime_71Cycles5  | 采样时间为  71.5 周期  |
| ADC_SampleTime_239Cycles5 | 采样时间为  239.5 周期 |

例： 

```c
/* Configures ADC1 Channel2 as: first converted channel with an 7.5 cycles sample time */ 

ADC_RegularChannelConfig(ADC1, ADC_Channel_2, 1, ADC_SampleTime_7Cycles5); 

/* Configures ADC1 Channel8 as: second converted channel with an 1.5 cycles sample time */ 

ADC_RegularChannelConfig(ADC1, ADC_Channel_8, 2, ADC_SampleTime_1Cycles5); 
```

### 函数 ADC_Init

**Table 6.** 函数 **ADC_Init** 

| 函数名      | ADC_Init                                                     |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void ADC_Init(ADC_TypeDef* ADCx,  ADC_InitTypeDef* ADC_InitStruct) |
| 功能描述    | **根据 ADC_InitStruct 中指定的参数初始化外设 ADCx 的寄存器** |
| 输入参数  1 | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2       |
| 输入参数  2 | ADC_InitStruct：指向结构 ADC_InitTypeDef  的指针，包含了指定外设 ADC 的配置信息参阅：4.2.3 ADC_StructInit 获得 ADC_InitStruct 值的完整描述 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

#### 结构体ADC_InitTypeDef structure 

```c
//ADC_InitTypeDef 定义于文件“stm32f10x_adc.h”： 

typedef struct 

{ 
u32 ADC_Mode; 
FunctionalState ADC_ScanConvMode;
FunctionalState ADC_ContinuousConvMode;
u32 ADC_ExternalTrigConv; 
u32 ADC_DataAlign;
u8 ADC_NbrOfChannel; 
} ADC_InitTypeDef 
```

#### 参数 ADC_Mode 

ADC_Mode 设置 ADC 工作在独立或者双 ADC 模式。参阅 Table 8.获得这个参数的所有成员。

**Table 4.** 函数 **ADC_Mode** 定义 

| **ADC_Mode**                    | 描述                                           |
| ------------------------------- | ---------------------------------------------- |
| ADC_Mode_Independent            | ADC1 和 ADC2 工作在独立模式                    |
| ADC_Mode_RegInjecSimult         | ADC1 和 ADC2 工作在同步规则和同步注入模式      |
| ADC_Mode_RegSimult_AlterTrig    | ADC1 和  ADC2 工作在同步规则模式和交替触发模式 |
| ADC_Mode_InjecSimult_FastInterl | ADC1 和  ADC2 工作在同步规则模式和快速交替模式 |
| ADC_Mode_InjecSimult_SlowInterl | ADC1 和  ADC2 工作在同步注入模式和慢速交替模式 |
| ADC_Mode_InjecSimult            | ADC1 和 ADC2 工作在同步注入模式                |
| ADC_Mode_RegSimult              | ADC1 和 ADC2 工作在同步规则模式                |
| ADC_Mode_FastInterl             | ADC1 和 ADC2 工作在快速交替模式                |
| ADC_Mode_SlowInterl             | ADC1 和 ADC2 工作在慢速交替模式                |
| ADC_Mode_AlterTrig              | ADC1 和 ADC2 工作在交替触发模式                |

#### 参数 ADC_ScanConvMode

ADC_ScanConvMode 规定了模数转换工作在扫描模式（多通道）还是单次（单通道）模式。可以设置这个参数为 ENABLE 或者 DISABLE。

#### 参数 ADC_ContinuousConvMode

ADC_ContinuousConvMode 规定了模数转换工作在连续还是单次模式。可以设置这个参数为 ENABLE 或者 DISABLE。 

#### 参数 ADC_ExternalTrigConv

ADC_ExternalTrigConv 定义了使用外部触发来启动规则通道的模数转换，这个参数可以取的值见 Table 9. 

**Table 9. ADC_ExternalTrigConv** 定义表 

| **ADC_ExternalTrigConv**      | 描述                                        |
| ----------------------------- | ------------------------------------------- |
| ADC_ExternalTrigConv_T1_CC1   | 选择定时器  1 的捕获比较 1 作为转换外部触发 |
| ADC_ExternalTrigConv_T1_CC2   | 选择定时器  1 的捕获比较 2 作为转换外部触发 |
| ADC_ExternalTrigConv_T1_CC3   | 选择定时器  1 的捕获比较 3 作为转换外部触发 |
| ADC_ExternalTrigConv_T2_CC2   | 选择定时器  2 的捕获比较 2 作为转换外部触发 |
| ADC_ExternalTrigConv_T3_TRGO  | 选择定时器  3 的 TRGO 作为转换外部触发      |
| ADC_ExternalTrigConv_T4_CC4   | 选择定时器  4 的捕获比较 4 作为转换外部触发 |
| ADC_ExternalTrigConv_Ext_IT11 | 选择外部中断线  11 事件作为转换外部触发     |
| **ADC_ExternalTrigConv_None** | 转换由软件而不是外部触发启动                |

#### 参数 ADC_DataAlign

ADC_DataAlign 规定了 ADC 数据向左边对齐还是向右边对齐。这个参数可以取的值见 Table 10. 

**Table 10. ADC_DataAlign** 定义表 

| ADC_DataAlign       | 描述           |
| ------------------- | -------------- |
| ADC_DataAlign_Right | ADC 数据右对齐 |
| ADC_DataAlign_Left  | ADC 数据左对齐 |

#### 参数 ADC_NbrOfChannel

ADC_NbreOfChannel 规定了顺序进行规则转换的 ADC 通道的数目。这个数目的取值范围是 1 到 16。

**例：** 

```c
/* Initialize the ADC1 according to the ADC_InitStructure members */ 

ADC_InitTypeDef ADC_InitStructure; 

ADC_InitStructure.ADC_Mode = ADC_Mode_Independent; 

ADC_InitStructure.ADC_ScanConvMode = ENABLE; 

ADC_InitStructure.ADC_ContinuousConvMode = DISABLE; 

ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_Ext_IT11;

ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right; 

ADC_InitStructure.ADC_NbrOfChannel = 16;

ADC_Init(ADC1, &ADC_InitStructure); 
```

注意：为了能够正确地配置每一个 ADC 通道，用户在调用 ADC_Init()之后，必须调用 ADC_ChannelConfig() 来配置每个所使用通道的转换次序和采样时间。 

### 函数 ADC_Cmd 

**Table 13.** 函数 **ADC_Cmd** 

| 函数名      | ADC_Cmd                                                      |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void ADC_Cmd(ADC_TypeDef* ADCx,  FunctionalState NewState)   |
| 功能描述    | **使能或者失能指定的  ADC**                                  |
| 输入参数  1 | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2       |
| 输入参数  2 | NewState：外设 ADCx 的新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Enable ADC1 */ 

ADC_Cmd(ADC1, ENABLE); 
```

**注意**：函数 ADC_Cmd 只能在其他 ADC 设置函数之后被调用。

### 函数 ADC_ResetCalibration 

**Table 17.** 函数 **ADC_ResetCalibration** 

| 函数名     | ADC_ResetCalibration                                   |
| ---------- | ------------------------------------------------------ |
| 函数原形   | void ADC_ResetCalibration(ADC_TypeDef*  ADCx)          |
| 功能描述   | **重置指定的  ADC 的校准寄存器**                       |
| 输入参数   | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2 |
| 输出参数   | 无                                                     |
| 返回值     | 无                                                     |
| 先决条件   | 无                                                     |
| 被调用函数 | 无                                                     |

例： 

```c
/* Reset the ADC1 Calibration registers */

ADC_ResetCalibration(ADC1); 
```

### 函数 ADC_GetResetCalibrationStatus 

| 函数名     | ADC_ GetResetCalibrationStatus                               |
| ---------- | ------------------------------------------------------------ |
| 函数原形   | FlagStatus  ADC_GetResetCalibrationStatus(ADC_TypeDef* ADCx) |
| 功能描述   | **获取  ADC 重置校准寄存器的状态**                           |
| 输入参数   | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2       |
| 输出参数   | 无                                                           |
| 返回值     | ADC 重置校准寄存器的新状态（SET 或者 RESET）                 |
| 先决条件   | 无                                                           |
| 被调用函数 | 无                                                           |

例： 

```c
/* Get the ADC2 reset calibration registers status */ 

FlagStatus Status; 

Status = ADC_GetResetCalibrationStatus(ADC2); 
```

### 函数 ADC_StartCalibration 

**Table 19.** 函数 **ADC_StartCalibration** 

| 函数名     | ADC_StartCalibration                                   |
| ---------- | ------------------------------------------------------ |
| 函数原形   | void ADC_StartCalibration(ADC_TypeDef*  ADCx)          |
| 功能描述   | **开始指定  ADC 的校准状态**                           |
| 输入参数   | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2 |
| 输出参数   | 无                                                     |
| 返回值     | 无                                                     |
| 先决条件   | 无                                                     |
| 被调用函数 | 无                                                     |

例： 

```c 
/* Start the ADC2 Calibration */

ADC_StartCalibration(ADC2);
```

### 函数 ADC_GetCalibrationStatus 

**Table 20.** 函数 **ADC_GetCalibrationStatus** 

| 函数名     | ADC_GetCalibrationStatus                                |
| ---------- | ------------------------------------------------------- |
| 函数原形   | FlagStatus ADC_GetCalibrationStatus(ADC_TypeDef*  ADCx) |
| 功能描述   | **获取指定  ADC 的校准程序**                            |
| 输入参数   | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2  |
| 输出参数   | 无                                                      |
| 返回值     | ADC 校准的新状态（SET 或者 RESET）                      |
| 先决条件   | 无                                                      |
| 被调用函数 | 无                                                      |

例： 

```c
/* Get the ADC2 calibration status */ 

FlagStatus Status; 

Status = ADC_GetCalibrationStatus(ADC2);
```

### 函数 ADC_SoftwareStartConvCmd 

**Table 21.** 函数 **ADC_SoftwareStartConvCmd** 

| 函数名      | ADC_SoftwareStartConvCmd                                     |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | void  ADC_SoftwareStartConvCmd(ADC_TypeDef* ADCx, FunctionalState NewState) |
| 功能描述    | **使能或者失能指定的  ADC 的软件转换启动功能**               |
| 输入参数  1 | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2       |
| 输入参数  2 | NewState：指定 ADC 的软件转换启动新状态这个参数可以取：ENABLE 或者 DISABLE |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

例： 

```c
/* Start by software the ADC1 Conversion */ 

ADC_SoftwareStartConvCmd(ADC1, ENABLE); //软件触发
```

### 函数 ADC_GetFlagStatus 

**Table 48.** 函数 **ADC_GetFlagStatus** 

| 函数名      | ADC_GetFlagStatus                                            |
| ----------- | ------------------------------------------------------------ |
| 函数原形    | FlagStatus ADC_GetFlagStatus(ADC_TypeDef*  ADCx, u8 ADC_FLAG) |
| 功能描述    | **检查制定  ADC 标志位置 1 与否**                            |
| 输入参数  1 | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2       |
| 输入参数  2 | ADC_FLAG：指定需检查的标志位   参阅章节  ADC_FLAG 查阅更多该参数允许取值范围 |
| 输出参数    | 无                                                           |
| 返回值      | 无                                                           |
| 先决条件    | 无                                                           |
| 被调用函数  | 无                                                           |

**ADC_FLAG** 

Table 49. 给出了 ADC_FLAG 的值 

**Table 49. ADC_FLAG** 的值 

| **ADC_AnalogWatchdog** | 描述                 |
| ---------------------- | -------------------- |
| ADC_FLAG_AWD           | 模拟看门狗标志位     |
| **ADC_FLAG_EOC**       | 转换结束标志位       |
| ADC_FLAG_JEOC          | 注入组转换结束标志位 |
| ADC_FLAG_JSTRT         | 注入组转换开始标志位 |
| ADC_FLAG_STRT          | 规则组转换开始标志位 |

例： 

```c
/* Test if the ADC1 EOC flag is set or not */ 

FlagStatus Status; 

Status = ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC); 
```

### 函数 ADC_GetConversionValue 

**Table 29.** 函数 **ADC_GetConversionValue** 

| 函数名     | ADC_GetConversionValue                                 |
| ---------- | ------------------------------------------------------ |
| 函数原形   | u16  ADC_GetConversionValue(ADC_TypeDef* ADCx)         |
| 功能描述   | **返回  近一次 ADCx 规则组的转换结果**                 |
| 输入参数   | ADCx：x 可以是 1 或者 2 来选择 ADC  外设 ADC1 或  ADC2 |
| 输出参数   | 无                                                     |
| 返回值     | 转换结果                                               |
| 先决条件   | 无                                                     |
| 被调用函数 | 无                                                     |

例： 

```C
/*Returns the ADC1 Master data value of the last converted channel*/
u16 DataValue; 

DataValue = ADC_GetConversionValue(ADC1); 
```



 
