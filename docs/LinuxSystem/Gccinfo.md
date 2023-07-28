# Gcc编译器

> gcc [选项] [文件]

&emsp;&emsp;常用选项:

* -c：只编译不链接为可执行文件，编译器将输入的.c 文件编译为.o 的目标文件。
* -o：<输出文件名>用来指定编译结束以后的输出文件名，如果使用这个选项的话 GCC 默
认编译出来的可执行文件名字为 a.out。
* -g：添加调试信息，如果要使用调试工具(如 GDB)的话就必须加入此选项，此选项指示编
译的时候生成调试所需的符号信息。
* -l：添加静态库/动态库的路径
* -I：添加头文件路径
* -E：只进行预编译，不做其它处理
* -S：只编译不汇编，生成汇编源码
* -v：打印出编译器内部编译各个过程的命令行信息和编译器的版本
* -O：对程序进行优化编译，如果使用此选项的话整个源代码在编译、链接的的时候都会进
行优化，这样产生的可执行文件执行效率就高。
* -O2：比-O 更幅度更大的优化，生成的可执行效率更高，但是整个编译过程会很慢。
* -D：编译时将宏定义传入进去
* -Wall：打开所有类型的警告。

## GCC的编译过程

GCC 编译器的编译流程是：预处理、编译、汇编和链接。

* 预处理就是展开所有的头文件、替换程序中的宏、解析条件编译并添加到文件中。
* 编译是将经过预编译处理的代码编译成汇编代码，也就是我们常说的程序编译,检查代码规范性、语法错误等，在检查无误后把代码翻译成汇编语言
* 汇编就是将汇编语言文件编译成二进制目标文件。
* 链接就是将汇编出来的多个二进制目标文件链接在一起，形成最终的可执行文件，链接的时候还会涉及到静态库和动态库等问题

[![B站UP主:九曲阑干截图](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/GCCinfo.png)](https://www.bilibili.com/video/BV1cD4y1D7uR/?spm_id_from=333.880.my_history.page.click&vd_source=27c45cfddc4cf8f7dcd366ab5b42214b)

### 预处理

```shell

gcc -E main.c #只进行预处理操作不省成.i文件
gcc -E main.c -o main.i #-o 指定预处理后生成的文件名 即 生成了main.i文件

```

![预处理](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gcc%20-E.png)

main.i 的内容

![main.i的内容](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/main-i.png)

### 编译(转汇编)

```shell

gcc -S main.i #自动生成了main.s
gcc -S main.i -o xxx.s #当然也可以生成指定名字的汇编文件

```

![编译](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/main-o.png)

### 汇编

```shell

as main.s #注意这样生成的a.out文件并不是我们平时见的可执行文件a.out 只是一个二进制文件并不可打开(或者说打开会报错)
as main.s -o main.o # (1) 


```

1. 一般使用-o命令 生成`.o`目标文件 这是因为:通常，一个高级语言的源文件都可对应一个目标文件。
目标文件在Linux 中默认后缀为“.o”（如“main.c”的目标文件为“main.o”）。 

![汇编](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/as-main.png)

### 链接

```shell

gcc a.out -o main #这就是未使用`-o`生成了a.out的二进制文件 
gcc main.o -o main #推荐使用

```

![链接](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/link-main.png)

### 从源码直接到目标文件

```shell

gcc -c main.c #直接生成mian.o文件(未链接，配合静态库/动态库)
gcc -c main.c -o xxx.o #生成指定名字的`.o`目标文件
gcc -c main.c add.c print.c #同时编译多个.c文件生成对应名字的`.o`文件
gcc -c *.c #将所有同一文件夹下的.c文件生成对应名字的`.o`目标文件

```

![源码直接到目标文件](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gcc-c.png)

### 从源码直接到可执行文件

```shell

gcc main.c #默认生成叫a.out的可执行文件 
gcc main.c -o xxx.o #生成指定名字的可执行文件
gcc *.c -o xxx.o -I(头文件路径) #

```

![源码直接到可执行文件](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gcc-main.png)

## 静态库

形成静态库的步骤:

1. : 将**功能函数.c** 分成生成 **.o的目标文件** (除mian.c文件)
2. : 将**功能函数.o** 文件打包生成库

> ar -rc lib库名.a *.o

3. : 验证库 

> gcc main.c -o -l 库名 -L 库的路径 -I 头文件路径

4. : 特点：以空间换时间

![静态库](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gcc-libstatic.png)

## 动态库

形成动态库的步骤:

1. : 将**功能函数.c** 分别生成 **.o目标文件**
2. : 将**功能函数.o** 打包成库

> gcc shared -fpic -o lib库名.so *.o

3. : 将动态库移动到`usr/lib`

> sudo cp ./lib库名.so /usr/lib

4. : 验证库

> gcc main.c -o main -l 库名

5. : 特点：以时间换空间

![动态库](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gcc-dynamic.png)

![usr/lib](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/dynamic-lib.png)

## gdb调试

**gdb的作用是:** 调试代码

**调试代码的步骤:**

* 测试：发现问题
* 固化：让bug重现
* 定位：找到bug所在位置
* 修改：修改问题
* 验证：printf打印/利用 `__FILE__,__LINE__,__FUNCTION__`进行程序调试 注意__是连续的两个/gdb调试

### gdb的使用

```c title="调试代码1"

#include <stdio.h>

int main(int argc, char *argv[])
{
  int i = 0,sum = 0;

  for(i = 0;i < 10;i++)
  {
    sum += i;
  }
  printf("sum = %d\n",sum);
  return 0;
}

```

**第一步:** 生成带有调试信息的可执行文件

> 使用 gcc -g xxx.c #生成带有调试信息的可执行文件

![gcc -g main.c](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gcc-g.png)

**第二步:** 进入调试界面

![gdb开始调试](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb.png)

### 关于gdb的使用命令

* `quit`/`q` 退出gdb调试

* `list`/`l` 打印源码到终端，一次最多10行 在`l`后可加行数 将其周围的代码显示出来

![gdb-list](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-list.png)

* `run`/`r` 运行

![gdb-run](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-run.png)

* `break + 行号`/`b + 行号` 设置断点

![gdb-break](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-break.png)

* `cont`/`c` 继续运行

* `print + 变量名`/`p + 变量名` 打印变量的值

![gdb-cont-print](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-cont-print.png)

* `info + b`/`i + b` 打印断点

![gdb-info](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-info.png)

* `enable + 断点的编号` 使能该断点

* `disable + 断点的编号` 失能该断点

![gdb-enable-disable](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-enable-disable.png)

* `clear + 行号` /`delete + 断点的编号` 删除断点

![gcb-clear-delete](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-clear-delete.png)

### 启动单步调试

* 启动单步调试: start

* n: 按步调式 -- 遇到函数不进入函数内部

* s: 按步调式 -- 遇到函数会进入函数内部

* finish: -- 结束当前函数，返回到调用点

![gdb-start](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-start.png)

```c title="调试代码2"

#include <stdio.h>

int Func(void);

int main(int argc, char *argv[])
{
  int sum = Func();
  printf("sum = %d\n",sum);
  return 0;
}

int Func(void)
{
  int i = 0,sum = 0;

  for(i = 0;i < 10;i++)
  {
    sum += i;
  }
  
  return sum;
}

```

![gdb-start-s](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-start-s.png)

### 带有主函数传参的gdb调试

> gdb -args ./执行文件+参数1+参数2

```c title="调试代码3"

#include <stdio.h>

int Func(void);

int main(int argc, char *argv[])
{
  for(int i = 0;i < argc;i++)
  {
    printf("%s\n",argv[i]);
  }
  int sum = Func();
  printf("sum = %d\n",sum);
  return 0;
}

int Func(void)
{
  int i = 0,sum = 0;

  for(i = 0;i < 10;i++)
  {
    sum += i;
  }
  
  return sum;
}

```

![gdb-main](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/gdb-main.png)

~~未待完序...~~
