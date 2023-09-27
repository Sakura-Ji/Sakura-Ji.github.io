  

# LCD

学习资料:

* [【正点原子】手把手教你学STM32 HAL库开发全集](https://www.bilibili.com/video/BV1bv4y1R7dp/?p=117&share_source=copy_web&vd_source=1f86b29b1eacf120a2143333a298e645)

## LCD基础知识

LCD(Liquid Crystal Display)，即液晶显示器，由：玻璃基板、背光、驱动IC等组成全彩LCD，是一种全彩显示屏（RGB565、RGB888），可以显示各种颜色

![LCD_Struct](https://pic.imgdb.cn/item/6513ce80c458853aef34e992/LCD_Struct.png)

**LCD接口分类:**

| **接口** | **分辨率** | **特性**                                           |
| -------- | ---------- | -------------------------------------------------- |
| **MCU**  | ≤800*480   | **自带SRAM**，无需频繁刷新，无需大内存，驱动简单   |
| **RGB**  | ≤1280*800  | 不带SRAM，需要实时刷新，需要大内存，驱动稍微复杂   |
| **MIPI** | 4K         | 不带SRAM，支持分辨率高，省电，大部分手机屏用此接口 |

**ILI9341芯片支持多种通信接口：**

* **MCU接口**（8/9/**16**/18位）--- LCD模组接口由厂家设计的决定，所以我们使用的是这个模式

* 3/4 线SPI接口

* RGB接口（6/16/18位）

**LCD驱动基本知识:**

1. LCD屏（MCU接口）驱动的核心是：驱动LCD驱动芯片

2. 8080时序，LCD驱动芯片一般使用8080时序控制，实现数据写入/读取

3. 初始化序列（数组），屏厂提供，用于初始化特定屏幕，不同屏幕厂家不完全相同！

4. 画点函数、读点函数（非必需），基于这两个函数可以实现各种绘图功能！


## 8080时序代码

**8080时序知识在OLED学习过了，就不再重复书写了**

通过8080时序，实现对**LCD读写的函数**代码如下:

### 8080写时序代码

数据（RS=1）/命令（RS=0）在WR的上升沿，写入LCD驱动IC，RD保持高电平

![LCD_Write](https://pic.imgdb.cn/item/6513fb3dc458853aef446b54/LCD_Write.png)

`lcd_wr_data`

```c
/**
 * @brief       LCD写数据 -- 这个就可以完成写入了
 * @param       data : 要写入的数据
 * @retval      无
 */
void lcd_wr_data(uint16_t data)
{
    LCD_RS(1);
    LCD_CS(0);
    LCD_DATA_OUT(data);
    LCD_WR(0);
    LCD_WR(1);
    LCD_CS(1);
}
```

`lcd_wr_regno`

```c
/**
 * @brief       LCD写寄存器编号/地址函数  -- 经过我的分析 这个就是单纯发送ILI9341指令的
 * @param       regno: 寄存器编号/地址
 * @retval      无
 */
__attribute__((always_inline)) void lcd_wr_regno(volatile uint16_t regno)
{
    LCD_RS(0);              /* RS=0,表示写寄存器 -- RS=0 不就是写命令吗 非要搞两个函数 一个cmd不就好了*/
    LCD_CS(0);
    LCD_DATA_OUT(regno);    /* 写入要写的寄存器序号 */
    LCD_WR(0);
    LCD_WR(1);
    LCD_CS(1);
}
```

一个知识点:**内联函数**

**__attribute__((always_inline))**的意思是强制内联，所有加了**__attribute__((always_inline))**的函数再被调用时不会被编译成函数调用而是直接扩展到调用函数体内

```cpp
__attribute__((always_inline)) void a(){
    print("a"); 
}

void b()
{
  a();
}
/*******************************************************************/
/*编译后是*/
 void b()
｛
      print("a"); 
｝
```

`lcd_write_reg`

```c
/**
 * @brief       LCD写寄存器  -- 经过我的分析 这个就是把上面两个函数结合一起 方便使用的
 * @param       regno:寄存器编号/地址
 * @param       data:要写入的数据
 * @retval      无
 */
void lcd_write_reg(uint16_t regno, uint16_t data)
{
    lcd_wr_regno(regno);    /* 写入要写的寄存器序号 */
    lcd_wr_data(data);      /* 写入数据 */
}
```

### 8080读时序代码

数据（RS=1）/命令（RS=0）在RD的上升沿，读取到MCU，WR保持高电平

![LCD_Read](https://pic.imgdb.cn/item/6513fa24c458853aef443c73/LCD_Read.png)

`lcd_rd_data`

```c
/**
 * @brief       LCD读数据
 * @param       无
 * @retval      读取到的数据
 */
static uint16_t lcd_rd_data(void)
{
    volatile uint16_t ram;  /* 防止被优化 */
    
    GPIO_InitTypeDef gpio_init_struct;
    /* LCD_DATA 引脚模式设置, 上拉输入, 准备接收数据 */
    gpio_init_struct.Pin = LCD_DATA_GPIO_PIN;
    gpio_init_struct.Mode = GPIO_MODE_INPUT;
    gpio_init_struct.Pull = GPIO_PULLUP;
    gpio_init_struct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(LCD_DATA_GPIO_PORT, &gpio_init_struct); 

    LCD_RS(1);              /* RS=1,表示操作数据 */
    LCD_CS(0);
    LCD_RD(0);
    lcd_opt_delay(2);
    ram = LCD_DATA_IN;      /* 读取数据 */
    LCD_RD(1);
    LCD_CS(1);
    
    /* LCD_DATA 引脚模式设置, 推挽输出, 恢复输出状态 */
    gpio_init_struct.Pin = LCD_DATA_GPIO_PIN;
    gpio_init_struct.Mode = GPIO_MODE_OUTPUT_PP;
    gpio_init_struct.Pull = GPIO_PULLUP;
    gpio_init_struct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(LCD_DATA_GPIO_PORT, &gpio_init_struct);

    return ram;
}
```

## LCD驱动芯片(ILI9341)指令

| **指令(HEX)** | **名称** | **作用**                          |
| ------------- | -------- | --------------------------------- |
| **0XD3**      | 读ID     | 用于读取LCD控制器的ID，区分型号用 |
| **0X36**      | 访问控制 | 设置GRAM读写方向，控制显示方向    |
| **0X2A**      | 列地址   | 一般用于设置X坐标                 |
| **0X2B**      | 页地址   | 一般用于设置Y坐标                 |
| **0X2C**      | 写GRAM   | 用于往LCD写GRAM数据               |
| **0X2E**      | 读GRAM   | 用于读取LCD的GRAM数据             |

### 读指令ID--0XD3

读取LCD控制器型号，通过型号可以执行不同LCD初始化，以兼容不同LCD

![LCD_ID](https://pic.imgdb.cn/item/6513ce80c458853aef34e949/LCD_ID.png)

```c
uint16_t id;        /* LCD ID */
/* 尝试9341 ID的读取 */
lcd_wr_regno(0xD3);
lcddev.id = lcd_rd_data();  /* dummy read */
lcddev.id = lcd_rd_data();  /* 读到0x00 */
lcddev.id = lcd_rd_data();  /* 读取93 */
lcddev.id <<= 8;
lcddev.id |= lcd_rd_data(); /* 读取41 */
```

### 访问控制指令（0X36）

实现GRAM读写方向控制，即：控制GRAM自增方向，从而控制显示方向

![LCD_DIR](https://pic.imgdb.cn/item/6513ce80c458853aef34e8ff/LCD_DIR.png)

![LCD_DIR_Crl](https://pic.imgdb.cn/item/6513ce7fc458853aef34e8b8/LCD_DIR_Crl.png)

`lcd_scan_dir`

```c
/**
 * @brief       设置LCD的自动扫描方向(对RGB屏无效)
 *   @note
 *               9341/5310/5510/1963/7789/7796/9806等IC已经实际测试
 *              注意:其他函数可能会受到此函数设置的影响(尤其是9341),
 *              所以,一般设置为L2R_U2D即可,如果设置为其他扫描方式,可能导致显示不正常.
 *
 * @param       dir:0~7,代表8个方向(具体定义见lcd.h)
 * @retval      无
 */
void lcd_scan_dir(uint8_t dir)
{
    uint16_t regval = 0;
    uint16_t dirreg = 0;
    uint16_t temp;
    
    /* 根据扫描方式 设置 0X36/0X3600 寄存器 bit 5,6,7 位的值 */
    switch (dir)
    {
        case L2R_U2D:/* 从左到右,从上到下 */
            regval |= (0 << 7) | (0 << 6) | (0 << 5);
            break;

        case L2R_D2U:/* 从左到右,从下到上 */
            regval |= (1 << 7) | (0 << 6) | (0 << 5);
            break;

        case R2L_U2D:/* 从右到左,从上到下 */
            regval |= (0 << 7) | (1 << 6) | (0 << 5);
            break;

        case R2L_D2U:/* 从右到左,从下到上 */
            regval |= (1 << 7) | (1 << 6) | (0 << 5);
            break;

        case U2D_L2R:/* 从上到下,从左到右 */
            regval |= (0 << 7) | (0 << 6) | (1 << 5);
            break;

        case U2D_R2L:/* 从上到下,从右到左 */
            regval |= (0 << 7) | (1 << 6) | (1 << 5);
            break;

        case D2U_L2R:/* 从下到上,从左到右 */
            regval |= (1 << 7) | (0 << 6) | (1 << 5);
            break;

        case D2U_R2L:/* 从下到上,从右到左 */
            regval |= (1 << 7) | (1 << 6) | (1 << 5);
            break;
    }

    dirreg = 0X36;  /* 对绝大部分驱动IC, 由0X36寄存器控制 */
    regval |= 0X08; /* 9341要设置BGR位 */

    lcd_write_reg(dirreg, regval);//设置BGR

    /*坐标处理*/
    if (regval & 0X20)
    {
        if (lcddev.width < lcddev.height)   /* 交换X,Y */
        {
            temp = lcddev.width;
            lcddev.width = lcddev.height;
            lcddev.height = temp;
        }
    }
    else
    {
        if (lcddev.width > lcddev.height)   /* 交换X,Y */
        {
            temp = lcddev.width;
            lcddev.width = lcddev.height;
            lcddev.height = temp;
        }
    }
  
    /* 设置显示区域(开窗)大小 -- 全屏设置*/
    lcd_wr_regno(lcddev.setxcmd);//lcddev.setxcmd == 0X2A
    lcd_wr_data(0);//设置起始坐标 高8位
    lcd_wr_data(0);//设置起始坐标 低8位
    lcd_wr_data((lcddev.width - 1) >> 8);//设置终点坐标 高8位
    lcd_wr_data((lcddev.width - 1) & 0XFF);//设置终点坐标 低8位
    lcd_wr_regno(lcddev.setycmd);//lcddev.setycmd == 0X2B
    lcd_wr_data(0);//设置起始坐标 高8位
    lcd_wr_data(0);//设置起始坐标 低8位
    lcd_wr_data((lcddev.height - 1) >> 8);//设置终点坐标 高8位
    lcd_wr_data((lcddev.height - 1) & 0XFF);//设置终点坐标 低8位

}
```

`lcd_display_dir`

```c
/**
 * @brief       设置LCD显示方向
 * @param       dir:0,竖屏; 1,横屏
 * @retval      无
 */
void lcd_display_dir(uint8_t dir)
{
    lcddev.dir = dir;   /* 竖屏/横屏 */

    if (dir == 0)       /* 竖屏 */
    {
        lcddev.width = 240;
        lcddev.height = 320;
        lcddev.wramcmd = 0X2C;
        lcddev.setxcmd = 0X2A;
        lcddev.setycmd = 0X2B;

    }
    else                /* 横屏 */
    {
        lcddev.width = 320;         /* 默认宽度 */
        lcddev.height = 240;        /* 默认高度 */
        lcddev.wramcmd = 0X2C;
        lcddev.setxcmd = 0X2A;
        lcddev.setycmd = 0X2B;

    }

    lcd_scan_dir(DFT_SCAN_DIR);     /* 默认竖屏扫描方向 */
}
```

### X坐标设置指令（0X2A）

列地址设置指令，一般用于设置X坐标

![LCD_X_Site](https://pic.imgdb.cn/item/6513ce7fc458853aef34e849/LCD_X_Site.png)

### Y坐标设置指令（0X2B）

页地址设置指令，一般用于设置Y坐标

![LCD_Y_Site](https://pic.imgdb.cn/item/6513ce7ec458853aef34e7ee/LCD_Y_Site.png)

X,Y都有了 --> 拥有一个窗口显示区域

`lcd_set_window设置窗口`

```c
/**
 * @brief       设置窗口(对RGB屏无效),并自动设置画点坐标到窗口左上角(sx,sy).
 * @param       sx,sy:窗口起始坐标(左上角)
 * @param       width,height:窗口宽度和高度,必须大于0!!
 *   @note      窗体大小:width*height.
 *
 * @retval      无
 */

void lcd_set_window(uint16_t sx, uint16_t sy, uint16_t width, uint16_t height)
{
    uint16_t twidth, theight;
    twidth = sx + width - 1;
    theight = sy + height - 1;

    lcd_wr_regno(lcddev.setxcmd);//lcddev.setxcmd == 0X2A
    lcd_wr_data(sx >> 8);//这个是为了要高8位SC15~8的数据 所以右移8位 <-- 参数1，2相当于把X起始坐标分成了高低两个参数
    lcd_wr_data(sx & 0XFF);//为了要低8位的数据  16位的sx & 0XFF 就只有了低8位
    lcd_wr_data(twidth >> 8);//和上面同理 设置终点坐标 高8位
    lcd_wr_data(twidth & 0XFF);//和上面同理 设置终点坐标 低8位
    lcd_wr_regno(lcddev.setycmd);//lcddev.setycmd == 0X2B
    lcd_wr_data(sy >> 8);
    lcd_wr_data(sy & 0XFF);
    lcd_wr_data(theight >> 8);
    lcd_wr_data(theight & 0XFF);  
}
```

`lcd_set_cursor设置坐标位置`

```c
/**
 * @brief       设置光标位置(对RGB屏无效)
 * @param       x,y: 坐标
 * @retval      无
 */
void lcd_set_cursor(uint16_t x, uint16_t y)
{
        lcd_wr_regno(lcddev.setxcmd);//lcddev.setxcmd == 0X2A 只设置了X起始坐标
        lcd_wr_data(x >> 8);//和上面同理 设置起始坐标 高8位
        lcd_wr_data(x & 0XFF);//和上面同理 设置起始坐标 低8位
        lcd_wr_regno(lcddev.setycmd);//lcddev.setycmd == 0X2B 只设置了Y起始坐标
        lcd_wr_data(y >> 8);//和上面同理 设置起始坐标 高8位
        lcd_wr_data(y & 0XFF);//和上面同理 设置起始坐标 低8位
}
```

### 三基色原理

无法通过其他颜色混合得到的颜色，称之为：基本色；通过三基色(红、绿、蓝)混合，可以得到自然界中绝大部分颜色！

![LCD_RGB](https://pic.imgdb.cn/item/6513ce7dc458853aef34e5bc/LCD_RGB.png)

### 写GRAM指令（0X2C）

发送该指令后，数据线变成16位，可以开始写入GRAM数据，支持地址自增

![LCD_GRAM](https://pic.imgdb.cn/item/6513ce7dc458853aef34e70a/LCD_GRAM.png)

`lcd_write_ram_prepare`

```c
/**
 * @brief       准备写GRAM -- 单纯包装了一下函数 写入0X2C命令
 * @param       无
 * @retval      无
 */
__attribute__((always_inline)) void lcd_write_ram_prepare(void)
{
    lcd_wr_regno(lcddev.wramcmd);//lcddev.wramcmd == 0X2C
}
```

### 读GRAM指令（0X2E）

发送该指令后，数据线变成16位，可以开始读取GRAM数据，支持地址自增

![LCD_GRAM_READ](https://pic.imgdb.cn/item/6513ce7cc458853aef34e4bf/LCD_GRAM_READ.png)

第一个点  读三次      空读 读R1G1 读B1 R2

第二个点  再读一次  读G2B2

第三个点  再读两次  读R3G3  读B3R4

第四个点  再读一次  读G4B4

第五个点 再度两次   读R5G5 读B5R6

······

```C
/**
 * @brief       读取个某点的颜色值 -- 读那个点都要调用一次这个函数 连读要根据上方规律重写一个函数
 * @param       x,y:坐标
 * @retval      此点的颜色(32位颜色,方便兼容LTDC)
 */
uint32_t lcd_read_point(uint16_t x, uint16_t y)
{
    uint16_t r = 0, g = 0, b = 0;

    if (x >= lcddev.width || y >= lcddev.height)return 0;   /* 超过了范围,直接返回 */

    lcd_set_cursor(x, y);       /* 设置坐标 */

    lcd_wr_regno(0X2E);     /* 9341/5310/1963/7789/7796/9806 等发送读GRAM指令 */

    r = lcd_rd_data();          /* 假读(dummy read) */
    r = lcd_rd_data();          /* 实际坐标颜色 */
    /* ILI9341 要分2次读出 */
    b = lcd_rd_data();
    g = r & 0XFF;       /* 对于 ILI9341, 第一次读取的是RG的值,R在前,G在后,各占8位 */
    g <<= 8;
    
    return (((r >> 11) << 11) | ((g >> 10) << 5) | (b >> 11));  /* ILI9341需要公式转换一下 */
}
```

## LCD画点

终于来到这一步了 通过以上的知识 我们现在画出一个点  就可以 写字写数字了！！

`lcd_draw_point`

```c
/**
 * @brief       画点
 * @param       x,y: 坐标
 * @param       color: 点的颜色(32位颜色,方便兼容LTDC)
 * @retval      无
 */
void lcd_draw_point(uint16_t x, uint16_t y, uint32_t color)
{
    lcd_set_cursor(x, y);       /* 设置光标位置 */
    lcd_write_ram_prepare();    /* 开始写入GRAM 就是输入0X2C命令*/
    lcd_wr_data(color);
}
```

`lcd_show_char`

```c
/**
 * @brief       在指定位置显示一个字符
 * @param       x,y  : 坐标
 * @param       chr  : 要显示的字符:" "--->"~"
 * @param       size : 字体大小 12/16/24/32
 * @param       mode : 叠加方式(1); 非叠加方式(0);
 * @param       color : 字符的颜色;
 * @retval      无
 */
void lcd_show_char(uint16_t x, uint16_t y, char chr, uint8_t size, uint8_t mode, uint16_t color)
{
    uint8_t temp, t1, t;
    uint16_t y0 = y;
    uint8_t csize = 0;
    uint8_t *pfont = NULL;

    csize = (size / 8 + ((size % 8) ? 1 : 0)) * (size / 2); /* 得到字体一个字符对应点阵集所占的字节数 */
    chr = chr - ' ';    /* 得到偏移后的值（ASCII字库是从空格开始取模，所以-' '就是对应字符的字库） */

    switch (size)
    {
        case 12:
            pfont = (uint8_t *)asc2_1206[chr];  /* 调用1206字体 */
            break;

        case 16:
            pfont = (uint8_t *)asc2_1608[chr];  /* 调用1608字体 */
            break;

        case 24:
            pfont = (uint8_t *)asc2_2412[chr];  /* 调用2412字体 */
            break;

        case 32:
            pfont = (uint8_t *)asc2_3216[chr];  /* 调用3216字体 */
            break;

        default:
            return ;
    }

    for (t = 0; t < csize; t++)
    {
        temp = pfont[t];    /* 获取字符的点阵数据 */

        for (t1 = 0; t1 < 8; t1++)   /* 一个字节8个点 */
        {
            if (temp & 0x80)        /* 有效点,需要显示 每次只判断一位 最高位 下面代码temp就移位了*/
            {
                lcd_draw_point(x, y, color);        /* 画点出来,要显示这个点 */
            }
            else if (mode == 0)     /* 无效点,不显示 */
            {
                lcd_draw_point(x, y, g_back_color); /* 画背景色,相当于这个点不显示(注意背景色由全局变量控制) */
            }

            temp <<= 1; /* 移位, 以便获取下一个位的状态 */
            y++;

            if (y >= lcddev.height)return;  /* 超区域了 */

            if ((y - y0) == size)   /* 显示完一列了? */
            {
                y = y0; /* y坐标复位 */
                x++;    /* x坐标递增 */

                if (x >= lcddev.width)return;   /* x坐标超区域了 */

                break;
            }
        }
    }
}

```

`lcd_clear`

```c
/**
 * @brief       清屏函数
 * @param       color: 要清屏的颜色
 * @retval      无
 */
void lcd_clear(uint16_t color)
{
    uint32_t index = 0;
    uint32_t totalpoint = lcddev.width;
    totalpoint *= lcddev.height;    /* 得到总点数 */
    lcd_set_cursor(0x00, 0x0000);   /* 设置光标位置 */
    lcd_write_ram_prepare();        /* 开始写入GRAM */

    /* 为了提高写入速度, 将lcd_wr_data函数进行拆分, 避免重复设置
     * RS, CS的操作, 从而提升速度, 从51帧提高到78帧左右, 提高50%
     * 测试条件: -O2优化, 纯刷屏
     * 在有速度要求的时候, 可以继续优化: lcd_fill, lcd_color_fill, 
     * lcd_set_cursor 和 lcd_draw_point 等函数, 大家可以自行优化
     */
    LCD_RS(1);                      /* RS=1,表示写数据 */
    LCD_CS(0);
    
    for (index = 0; index < totalpoint; index++)
    {
        LCD_DATA_OUT(color);        /* 写入要写的数据 */
        LCD_WR(0);
        LCD_WR(1);
    }
    
    LCD_CS(1);
}
```

---

## FSMC

~未待完续~
