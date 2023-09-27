# 步进电机

学习资料:

* [野火电机应用开发实战指南](https://doc.embedfire.com/motor/motor_tutorial/zh/latest/index.html)
* [双极性步进电机（上）：控制模式 |文章 | MPS (monolithicpower.cn)](https://www.monolithicpower.cn/bipolar-stepper-motors-part-i-control-modes)
* [爱上半导体---步进电机的工作原理](https://www.bilibili.com/video/BV1cN4y197TG/?share_source=copy_web&vd_source=1f86b29b1eacf120a2143333a298e645)

## 步进电机的介绍

步进电机又称为脉冲电机，是一种将电脉冲信号转换成相应的角位移或线位移的电动机。

* 每输入一个脉冲信号，转子就转动一个角度或前进一步
* 其输出的角位移或线位移与输入的脉冲数成正比 
* 转速与脉冲频率成正比 

**从控制芯片来看(STM32芯片)上面的话:**

* 假如使用TIM输出比较中的PWM1向上计数模式，输出1个PWM波--脉冲信号-->转子转动一个角度
* 输入脉冲的数量 --> 一共输入多少个PWM波形 --> 计数器CNT从0加到重装栽植ARR(一个周期) == 一个PWM波形 --> 转子的角位移
* 单位时间输入脉冲的数量：
  * 500HZ --(1s发送500个脉冲)  2ms一个周期1个脉冲    快
  * 50HZ   -- (1s发送50个脉冲)   20ms一个周期1个脉冲  慢

---

## 步进电机的单极性和双极性

![StepMotor_Line](https://pic.imgdb.cn/item/6513ce8ec458853aef34ef7c/StepMotor_Line.png)

### 单极性步进电机

五线四相单极性: A、B、C、D四相，共阳极

![5line4xiang](https://pic.imgdb.cn/item/6513ce8dc458853aef34ef21/5line4xiang.png)

![single_StepMotor](https://pic.imgdb.cn/item/6513ce8cc458853aef34eed5/single_StepMotor.png)



在图示中分为 5 根线，分别为 A、B、C、D 和公 共端（+），公共端需要一直通电，剩下 ABCD 相中只要有一个相通电，即可形成回路产生磁场， 图中的通电顺序为A- >AB->B->BC->C->CD->D->DA，即可完成上图中的顺时针旋转，如果想要逆时针旋转只需要将 其倒序即可

### 双极性步进电机

![douStr_StepMotor](https://pic.imgdb.cn/item/6513ce8ac458853aef34ee1f/douStr_StepMotor.png)

![double_StepMotor](https://pic.imgdb.cn/item/6513ce8bc458853aef34ee6c/double_StepMotor.png)

1. A 相通电，B 相不通电
2. A、B 相全部通电，且电流相同，产生相同磁性 
3. B 相通电，A 断电 
4. B 相通电，A 相通电，且电流相等，产生相同磁性
5. A 相通电，B 断电
6. A、B 相全部通电，且电流相同，产生相同磁性
7. B 相通电，A 断电 
8. B 相通电，A 相通电，且电流相等，产生相同磁性

其中 1~4 步与 5~8 步的电流方向相反（电流相反，电磁的极性就相反）

## 步进电机的一些专业词

* **相数**：产生不同对极 N、S 磁场的激磁线圈对数，也可以理解为步进电机中线圈的组数，其中两相步进电机步距角为 1.8°，三相的步进电机步距角为 1.5°，相数越多的步进电机，其步距角就越小。

* **拍数**：完成一个磁场周期性变化所需脉冲数或导电状态用 n 表示，或指电机转过一个齿距角所需脉冲数，以四相电机为例，有四相四拍运行方式即 AB-BC-CD-DA-AB，四相八拍运行方式即 A-AB-B-BC-C-CD-D-DA-A。

* **步距角**：一个脉冲信号所对应的电机转动的角度，可以简单理解为一个脉冲信号驱动的角度，电机上都有写，一般 42 步进电机的步距角为 1.8°

* **定位转矩**：电机在不通电状态下，电机转子自身的锁定力矩（由磁场齿形的谐波以及机械误差造成的）。

* **静转矩**：电机在额定静态电压作用下，电机不作旋转运动时，电机转轴的锁定力矩。此力 矩是衡量电机体积的标准，与驱动电压及驱动电源等无关。
* **步距角精度**：步进电机转动一个步距角度的理论值与实际值的误差。用百分比表示：误差/步 距角 *100%。
* **失步**：电机运转时运转的步数，不等于理论上的步数。也可以叫做丢步，一般都是因负载太大或者是频率过快。
* **失调角**：转子齿轴线偏移定子齿轴线的角度，电机运转必存在失调角，由失调角产生的误 差，采用细分驱动是不能解决的。 
* **最大空载起动频率**：在不加负载的情况下，能够直接起动的最大频率。
* **最大空载的运行频率**：电机不带负载的最高转速频率。
* **运行转矩特性**：电机的动态力矩取决于电机运行时的平均电流（而非静态电流），平均电流 越大，电机输出力矩越大，即电机的频率特性越硬。 
* **电机正反转控制**：通过改变通电顺序而改变电机的正反转。

## 步进电机的进一步认知

从上面学习来看，我们实现一次的转动角度最小是45度，但是如果我们想实现更小的转动角度，那么如何实现呢，一般最先想到的是增加相数对吧，这最好理解了，但是呢没有采用说明复杂度太大?我后 

原来是:人们是通过设计机械结构来决定的 -->  在上面的示意图中，转子是由一根磁体，有N,S两级，步距角是45度，于是人们把转子改成一个拥有50个齿轮的全S极，然后设置定子的轮齿是48个

![StepMotor_go](https://pic.imgdb.cn/item/6513ce88c458853aef34ed97/StepMotor_go.png)

这样以 **单相步进** 完成一个 **4拍数** --> A-B-$\overline A$-$\overline B$ 前进了7.2度，一个脉冲信号所对应的电机转动的角度-->**步距角1.8度**

## 步进电机驱动器

为什么要使用驱动器 -- 因为驱动器起到将**控制器信号放大**或者**转换的作用**

![StepDriver](https://pic.imgdb.cn/item/6513ce88c458853aef34ed0b/StepDriver.png)

![MicrostepDriver](https://pic.imgdb.cn/item/6513ce57c458853aef34d614/MicrostepDriver.png)

### 细分器驱动原理

**细分的原理**就是：通过改变**定子的电流比例**，改变转子在一个整步中的不同位置，可以将一个整步分成多个小步来运行。

驱动器的细分设置由拨码开关的 SW1~SW3 来设定，默认为 2 细分，一般的**两相四线(A+、B+、A-、B-)制步进电机**的步进角都是1.8°，因此**电机旋转一圈需要 360° /1.8° =200 个脉冲**，这里 **2 细分转一圈**需要**200*2=400 个脉冲**。

![micro_StepDriver](https://pic.imgdb.cn/item/6513ce87c458853aef34ecaa/micro_StepDriver.png)

## STM32--步进电机实战演习

由以上学习可知，我们使用MCU--STM32控制步进电机，只需要给它两个控制信号，1个是方向信号，一个是脉冲信号

`StepMotor.h`

```c
#ifndef  __STEPMOTOR_H__//如果没有定义了则参加以下编译
#define  __STEPMOTOR_H__//一旦定义就有了定义 所以 其目的就是防止模块重复编译

#include "stm32f10x.h"

typedef struct{
	u32	  subdiv;					//细分值
	float speed;					//速度
	float angle;					//当前角度
	float targetangel;				//目标角度
	float pulseangle;				//单脉冲的角度
}STEPMOTOR_TypeDef;

typedef enum{
	DIR_LEFT=0,
	DIR_RIGHT,
}STEPDIR_Def;

#define STEPDIRGET()  (GPIOB->ODR & (1<<5)) //如果PB5输出是1 与1得1 右转 -- 输出0 与0得0 左转 
#define STEPDIR(x)    x?(GPIOB->ODR |= (1<<5)):(GPIOB->ODR &=~ (1<<5))//x=1 或1得1 ; x=0 与0得0

void StepMotor_Init (void);
void StepMontor_Move (float angle);
void StepMontor_Stop (void);
void StepMotor_SetSpeed(float angle);
u8 Step_MoveCheck(void);

#endif  //结束编译

```

`StepMotor.c`

```c
#include "StepMotor.h"

STEPMOTOR_TypeDef stepmotor = {1600,0,0,0,0};//初始化结构体

/**
  * @brief  StepMotor_Init()电机初始化函数
            PB5 --> DIR+方向 
            PB6 --> PUL+脉冲  
            标志脉冲是方波 所以占空比=50%
  * @param  无
  * @retval 无
  */
void StepMotor_Init(void)
{
  //1.开启时钟
  RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM4,ENABLE);//开启定时器4时钟
  RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB,ENABLE);//开启GPIOB时钟
  
  //2.初始化IO口 
  GPIO_InitTypeDef GPIO_InitStructure;//定义结构体
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6;//TIM4的PWM的OC1通道输出在PB6引脚 -- 看引脚手册
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP ;//设置为复用推挽输出 -- 使用片上外设输出
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
  
  GPIO_InitStructure.GPIO_Pin = GPIO_Pin_5;
  GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP ;//设置为推挽输出
  GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz ;//设置输出速度为50MHZ
  GPIO_Init(GPIOB,&GPIO_InitStructure);//初始化
  
  //3.初始化TIM定时器
  
  TIM_InternalClockConfig(TIM4); //设置TIM4使用内部时钟 -- 可不写 原因--STM32默认使用内部时钟
  
  TIM_TimeBaseInitTypeDef TIM_TimeBaseStructure; //定义定时器初始化结构体
  //CK_CNT_OV = CK_PSC / (PSC + 1) / (ARR + 1) 通过这个公式可得出 设置500HZ频率 每2ms加一，72000000/72/2000
  TIM_TimeBaseStructure.TIM_Period = 2000-1; //自动重装载寄存器周期的值 -- ARR 
  TIM_TimeBaseStructure.TIM_Prescaler = 72 - 1; //预分频值 -- PSC 
  TIM_TimeBaseStructure.TIM_ClockDivision = TIM_CKD_DIV1; //滤波频率 1分频 也就是 不分频 使用系统时钟频率
  TIM_TimeBaseStructure.TIM_RepetitionCounter = 0; //重复计数器只要高级定时器才有 --TIM1/TIM8
  TIM_TimeBaseStructure.TIM_CounterMode = TIM_CounterMode_Up; //定时器模式 -- 向上计数
  TIM_TimeBaseInit(TIM4, & TIM_TimeBaseStructure);//初始化定时器4
  
  //4.初始化输出比较 -->PWM1模式
  /* Configures the TIM4 OC1 in PWM1 Mode */ 
  TIM_OCInitTypeDef TIM_OCInitStructure; //定义结构体
  /*
  *因为  我们只需要给下面部分结构体成员设置初始值，而结构体里面的成员有些没有使用到(比如高级定时器的部分),导致一些不确定的因素
  *所以  为了避免这些不确定的因素 我们使用TIM_OCStructInit函数 设置默认值
  */
  TIM_OCStructInit(& TIM_OCInitStructure); 
  TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1; //设置输出模式
  /*
  *  TIM_OCPolarity_High , 高极性 极性不翻转 REF波形直接输出 高电平  (有效电平)
  *  TIM_OCPolarity_Low , 低极性，极性不翻转 REF波形直接输出 低电平  (有效电平)
  *  
  */
  TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High; //设置输出比较模式的极性
  TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;//设置输出使能
  TIM_OCInitStructure.TIM_Pulse = 0; //设置CCR --> 占空比 
  TIM_OC1Init(TIM4, & TIM_OCInitStructure); //选择TIM4 的 OC1通道 输出PWM波形  使用引脚手册查看输出到那个引脚上了  -- 这里是OC2 == CH2通道
  
  //5. 启动预装载寄存器 --> 写入的值不会立即生效而是更新事件时生效 --> 避免一些小问题
  TIM_OC1PreloadConfig(TIM4, TIM_OCPreload_Enable);
  TIM_ARRPreloadConfig(TIM4, ENABLE);
  TIM_SetCompare1(TIM4, 1000-1);/*单独更改TIM4_CCR1寄存器值的函数 --> 修改占空比50%*/
  
  //6.初始化步进电机速度
  StepMotor_SetSpeed(50);//初始速度为50°/s 
  StepMontor_Stop();//防止步进电机动
  
  TIM_ClearFlag(TIM4, TIM_FLAG_Update);//清除中断状态标志位
  //7.配置中断输出控制函数
  TIM_ITConfig(TIM4, TIM_IT_Update, ENABLE ); //TIM2配置中断输出控制 -- 更新中断
  //8.初始化外部中断函数
  NVIC_InitTypeDef NVIC_InitStructure; //定义结构体
  
  NVIC_InitStructure.NVIC_IRQChannel = TIM4_IRQn; //根据上面的我们所选取的是定时器2 -- 在中断通道的TIM2 所以这里选择 TIM2_IRQn

  NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 2;//这里选择的是抢占 2

  NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1; //这里选择的是响应1

  NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE; //使能指定的中断通道
  //初始化函数↓
  NVIC_Init(&NVIC_InitStructure);
  
  //TIM_Cmd(TIM4, ENABLE); //使能定时器4 -- 一开始并不初始化TIM4 因为一使能 一有脉冲数 电机就开始运动了 所以什么时候使用 什么时候使能 在不使用电机时 失能TIM4
}

/**
  * @brief  让步进电机旋转到指定角度 -- > 上电后默认初始时刻的角度为0°
  * @param  angle  被设置的角度值
  * @retval None
  */
void StepMontor_Move (float angle)
{
  stepmotor.targetangel = angle;//更新目标值
  
  float difvalue = stepmotor.angle - stepmotor.targetangel;//差度值 = 当前角度 - 目标角度
  
  if(difvalue < -stepmotor.pulseangle || difvalue > stepmotor.pulseangle)// 差度值的绝对值 必须大于 单脉冲的角度
  {
    /*目标角度 > 0 且 差度值 < 0  ==> 向右转 (举例:当前的角度10° 目标角度15° 差度值 = -5°)*/
    if(angle > 0 && difvalue < 0)
      STEPDIR(DIR_RIGHT);
    /*目标角度 >= 0 且 差度值 > 0  ==> 向左转 (举例:当前的角度10° 目标角度5° 差度值 = 5°)*/
    if((angle > 0 || angle == 0) && difvalue > 0)
      STEPDIR(DIR_LEFT);
    /*目标角度 <= 0 且 差度值 > 0  ==> 向右转 (举例:当前的角度-10° 目标角度-5° 差度值 =-5°)*/
    if((angle < 0 || angle == 0) && difvalue < 0)
      STEPDIR(DIR_RIGHT);
    /*目标角度 < 0 且 差度值 > 0  ==> 向左转 (举例:当前的角度-10° 目标角度-15° 差度值 = 5°)*/
    if(angle < 0 && difvalue > 0)
      STEPDIR(DIR_LEFT);
    
    TIM_Cmd(TIM4, ENABLE);//使能定时器
  }
  else
    TIM_Cmd(TIM4, DISABLE);
}
/**
  * @brief  判断步进电机是否移动到位
  * @param  
  * @retval 
  */
u8 Step_MoveCheck(void)
{
  float difvalue = stepmotor.angle - stepmotor.targetangel;
  if(difvalue < -stepmotor.pulseangle || difvalue > stepmotor.pulseangle)
    return 0;//没有移动到位
  else
    return 1;//移动到位
}
/**
  * @brief  失能步进电机 -- 停止
  * @param  
  * @retval 
  */
void StepMontor_Stop (void)
{
  TIM_Cmd(TIM4, DISABLE);
}


/********************************************
    设置: 步进电机的旋转速度
    解释: 发送脉冲的频率是由ARR和PSC决定的 角速度设置为每秒转多少度 - angle °/s  1个脉冲转 步进角(0.225°)
          1s多少个脉冲 ==> 频率HZ ==> 7200000/PSC+1/ARR+1
          频率HZ = angle / 步进角(单脉冲的角度) ==> 1s有多少个脉冲
          步进角 * 频率HZ(单位1/s) = 每1s转多少度 
    传参：angle °/s
*********************************************/
void StepMotor_SetSpeed(float angle)
{
  stepmotor.pulseangle = 360.0 / stepmotor.subdiv;//根据细分--求出单脉冲的角度 也就是步进角的度数 1600 - 0.225°
  
  stepmotor.speed = angle;//更新目标速度值

  /*根据速度求每秒钟的脉冲数 = 每秒钟的角度 / 单脉冲角度*/
  float pulsenum = angle / stepmotor.pulseangle + 0.5;//
  
  if(pulsenum < 0.16)
  {
    //如果每秒钟脉冲数小于0.16个，则设置速度为每秒0.16个脉冲 -- 连一个脉冲都不到
    TIM4->PSC = 7200 - 1;
    TIM_SetAutoreload(TIM4, 65535);
    TIM_SetCompare1(TIM4, 32768);
  }
  else if(pulsenum < 16)
  {
    //如果脉冲给的速度比 65.536ms 慢,那么我们可以重新修改分频值
    TIM4->PSC = 7200 - 1;
    TIM_SetAutoreload(TIM4, 10000.0f/pulsenum);
    TIM_SetCompare1(TIM4, 10000.0f/pulsenum/2);
  }
  else
  {
    //在1us一次的计数速率下，1s内的脉冲个数最快1us一次，最慢65.536ms一次
    TIM4->PSC = 72 - 1;//72分频，1us计数一下
    TIM_SetAutoreload(TIM4, 1000000.0f/pulsenum);
    TIM_SetCompare1(TIM4, 1000000.0f/pulsenum/2);
  }

}

//中断服务函数
//执行步进电机的旋转和停止
void TIM4_IRQHandler (void)
{
  TIM_ClearFlag(TIM4, TIM_FLAG_Update);//清除中断标志位
  
  if (STEPDIRGET())//判断 是左转还是右转 
    stepmotor.angle += stepmotor.pulseangle;//右转 --> 最后得出的角度值 = 之前角度值 + 单脉冲的角度值 
  else
    stepmotor.angle -= stepmotor.pulseangle;//右转 --> 最后得出的角度值 = 之前角度值 - 单脉冲的角度值

  /*差度值 = 当前角度 - 目标角度*/
  float difvalue = stepmotor.angle - stepmotor.targetangel;
  
  /*检测当前角度与目标角度差值，误差在一个±步进角度之间则表示角度一致，关闭定时器*/
  if(difvalue < -stepmotor.pulseangle || difvalue > stepmotor.pulseangle)
    TIM_Cmd(TIM4, ENABLE);//差度值的绝对值 必须大于 单脉冲的角度==步进角 才会继续打开定时器4  
  else
    TIM_Cmd(TIM4, DISABLE);
}

```











































