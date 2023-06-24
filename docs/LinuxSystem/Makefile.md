# Makefile

## 什么是Makefile

我想说，在学习编程初阶段我们习惯性使用GCC/G++命令来帮助我们编译调试代码，可是当进行系统性编程的时候，
编译和调试得复杂起来，我们可能需要许许多多的文件，那么命令可能是一大行并且可能自己都不知道那些需要编译，
那些是刚刚修改过，只需要再次对进行修改，而不是将所有的文件再次进行编译，那么我们此时就需要使用到`Makefile`

## Makefile的使用规则

```makefile

target ... : prerequisites ...
    commend

```

???+ quote "GUN中文手册-Make规则"
    
    **target:** 规则的目标。通常是 最后需要生成的文件名 或者 为了实现这个目的而必需
    的 中间过程文件名 ,可以是.o文件、也可以是最后的可执行程序的文件名等。另外，目
    标也可以是一个make执行的动作的名称，如目标“clean”，我们称这样的目标是“伪目标”。

    **prerequisites:** 规则的依赖。生成规则目标所需要的文件名列表。通常一个目标依
    赖于一个或者多个文件。

    **command:** 规则的命令行。是规则所要执行的动作（任意的 shell 命令或者是可在
    shell 下执行的程序）。它限定了 make 执行这条规则时所需要的动作。

    一个规则可以有多个命令行，每一条命令占一行。注意：每一个命令行必须以`Tab`
    字符开始，`Tab`字符告诉 make 此行是一个命令行。make 按照命令完成相应的动作。
    这也是书写 Makefile 中容易产生，而且比较隐蔽的错误。

    命令就是在任何一个目标的依赖文件发生变化后重建目标的动作描述。一个目标可
    以没有依赖而只有动作（指定的命令）。比如 Makefile 中的目标“clean”，此目标没有
    依赖，只有命令。它所定义的命令用来删除 make 过程产生的中间文件（进行清理工作）。

    在 Makefile 中“规则”就是描述在什么情况下、如何重建规则的目标文件，通常
    规则中包括了目标的依赖关系（目标的依赖文件）和重建目标的命令。make 执行重建
    目标的命令，来创建或者重建规则的目标（此目标文件也可以是触发这个规则的上一个
    规则中的依赖文件）。规则包含了文件之间的依赖关系和更新此规则目标所需要的命令。
    一个 Makefile 文件中通常还包含了除规则以外的很多东西。一个最简单的 Makefile 
    可能只包含规则。规则在有些 Makefile 中可能看起来非常复杂，但是无论规则的书写是
    多么的复杂，它都符合规则的基本格式。make 程序根据规则的依赖关系，决定是否执行
    规则所定义的命令的过程我们称之为执行规则。
??? tip 

    target 就是一个目标文件，可以是 Object File，也可以是执行文件。
    还可以是一个标签（Label）prerequisites 就是，要生成那个 target 所需要的文件或是目标。
    command 也就是 make 需要执行的命令。（任意的 Shell 命令）

### 举例

创建一个文件夹，然后在里面建立一个**Makefile**的文件，在里面输入以下内容，保存后在终端输入`make debug`

```makefile title="最简单的例子"
debug :
    echo hello world
# (1)

```

1. echo前面空位必须使用`Tab`否则Makefile文件会报错,不想在终端显示echo，可在前面加上`@`，`#`这是makefile的注释符

![makefile](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/Makefile1.png)

!!! example "示例1"

    === "c"
    
        ```c 
    
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
    
    === "makefile"
    
        ```makefile 
    
        main :main.c
            gcc main.c -o main
    
        ```

![makefile-demo1](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/makefile-demo1.png)

!!! example "示例二"

    === "main.c"
        
        ```c

        #include <stdio.h>
        
        extern int Func(void);
        
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

        ```

    === "Fun.c"
       
        ```c
        
        #include <stdio.h> 
        
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

    === "makefile"

        ```makefile

        main :main.c Fun.c
	        gcc main.c Fun.c -o main

        ```

![makefile-demo2](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/makefile-demo2.png)

!!! example "示例三"

    === "main.c"
        
        ```c

        #include <stdio.h>
        
        extern int Func(void);
        
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

        ```
    === "Fun.c"
       
        ```c
        
        #include <stdio.h> 
        
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

    === "makefile"

        ```makefile

        main:main.o Fun.o
        	gcc main.o Fun.o -o main
        main.o:main.c
        	gcc -c main.c -o main.o
        Fun.o:Fun.c
        	gcc -c Fun.c -o Fun.o

        ```

![makefile-demo3](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/makefile-demo3.png)

### Make的工作流

???+ quote "GNU中文手册-Make如何工作"

    **默认的情况下，make执行的是Makefile中的第一个规则，此规则的第一个目标称
    之为“最终目的”或者“终极目标”，就是一个Makefile最终需要更新或者创建的目标。**

    当在 shell 提示符下输入`make`命令以后。make 读取当前目录下的 Makefile 文
    件，并将 Makefile 文件中的第一个目标作为其执行的“终极目标”，开始处理第一个规
    则（终极目标所在的规则）

    在上面 *示例三* 中，第一个规则就是目标“main”所在的规则。
    规则描述了“main”的依赖关系，并定义了链接.o 文件生成目标“main”的命令；

    make在执行这个规则所定义的命令之前，首先处理目标“main”的所有的依赖文件（例子中
    的那些.o 文件）的更新规则（以这些.o 文件为目标的规则）

???+ quote inline ".o文件的处理规则"

    对这些.o 文件为目标的规则处理有下列三种情况：

    1. 目标.o 文件不存在，使用其描述规则创建它；

    2. 目标.o 文件存在，目标.o 文件所依赖的.c 源文件、.h 文件中的任何一个比目标.o
    文件“更新”（在上一次 make 之后被修改）。则根据规则重新编译生成它；
    
    3. 目标.o 文件存在，目标.o 文件比它的任何一个依赖文件（的.c 源文件、.h 文件）
    “更新”（它的依赖文件在上一次 make 之后没有被修改），则什么也不做。

???+ quote inlien end "目标文件的处理规则"

    make 程序将处理终极目标“main”所在的规则，分为以下三种情况：
    
    1. 目标文件“main”不存在，则执行规则以创建目标“main”。
    
    2. 目标文件“main”存在，其依赖文件中有一个或者多个文件比它“更新”，则根
    据规则重新链接生成“main”。
    
    3. 目标文件“main”存在，它比它的任何一个依赖文件都“更新”，则什么也不做。

** 在 Makefile 中一个规则的目标如果不是“终极目标”所依赖的（或者
“终极目标”的依赖文件所依赖的），那么这个规则将不会被执行，除非明确指定执行
这个规则（可以通过 make 的命令行指定重建目标，那么这个目标所在的规则就会被执
行，例如 [make clean](#clean)）**

---

???+ quote "GUN中文手册-Make检测"

    更新（或者创建）终极目标的过程中，如果任何一个规则执行出现错误 make 就立
    即报错并退出。整个过程 make 只是负责执行规则，而对具体规则所描述的依赖关系的
    正确性、规则所定义的命令的正确性不做任何判断。就是说，一个规则的依赖关系是否
    正确、描述重建目标的规则命令行是否正确，make 不做任何错误检查。
   
    因此，需要正确的编译一个工程。需要在提供给 make 程序的 Makefile 中来保证
    其依赖关系的正确性、和执行命令的正确性。

### 伪目标 {#clean} 

为何要使用伪目标？根据我目前的掌握知识，因为当我们使用make生成对应的目标文件时，我们不想要中间的生成文件
只想要最终的文件，或者说只想要源码，此时要是够通过主观意识去清空这些多好呀，这样伪目标就诞生了。

**Makefile中把那些没有任何依赖只有执行动作的目标称为 ==伪目标==（phony targets）**

???+ quote "Gun中文手册-Make clean"

    目标“clean”不是一个文件，它仅仅代表执行一个动作的标识。正常情况下，不
    需要执行这个规则所定义的动作，因此目标“clean”没有出现在其它任何规则的依赖
    列表中。因此在执行make时，它所指定的动作不会被执行。除非在执行make时明确地  
    指定它。而且目标“clean”没有任何依赖文件，它只有一个目的，就是通过这个目标
    名来执行它所定义的命令。

    需要执行“clean”目标所定义的命令，可在shell下输入：`make clean`

* "伪目标" 不是一个文件，只是一个标签。我们要显示地指明这个 "目标" 才能让其生效

* "伪目标" 的取名不能和文件名重名，否则不会执行命令

* 为了避免和文件重名的这种情况，我们可以使用一个特殊的标记 `.PHONY` 来显示地指明一个目标是“伪目标”，
向 make 说明，不管是否有这个文件，这个目标就是 "伪目标"

* 只要有这个声明，不管是否有“clean”文件，要运行 "clean" 这个目标，只有 `make clean` 这个命令

```makefile

.PHONY : clean
# (1)
clean :
    rm -rf temp

```

1. :如果temp文件和**clean文件**都存在，且没有.PHONY命令的话，那么clean命令就进行不了了

由于我自己第一次尝试Makefile文件的时候，创建一个temp的文件夹，使用上面的代码，然后在终端敲入
`make clean`神奇的事情发生了，按照学习的文档来说本来temp文件不应该被删除，但结果是被删除了，
于是我陷入了沉思why？于是乎，我就查资料，找到了，原来是Makefile文件所在目录有下有文件名为
clean的文件时，不添加`.PHONY :clean`才会报错，执行`make clean`无效。同时理解了`.PHONY :XX`就是
用来保证目录下有文件名为`XX`的文件时，也能正常执行`make XX`

![标记.PHONY](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/Makefile2.png)

### Makefile声明变量

为什么要声明变量，其实如果你学过(你肯定学过编程语言，不然你为什么来学习Makefile)C语言，那么如果不设定变量，
那么我们每次使用这个数值的时候，都要引用这个数值，那么我们要修改它，需要在原文中全部都修改，这样太麻烦了，
所以要引入变量，Makefile同理

声明时变量的名字可随意定，但最好**知名其意**：

```makefile

objects = main.o Func.o
# (1)
main : $(objects) 
gcc $(objects) -o main
# (2)
clean : 
rm main $(objects)

```

1. objects就是我们定义的变量，用`=`来赋值
2. 使用`$(objects)`来使用这个变量

> 对一个目标文件是“N.o”，倚赖文件是“N.c”的规则，完全可以省略其规则的命令行，而由make自身决定使用默认命令。此默认规则称为make的隐含规则

![makefile-objects](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/makefile-objiects.png)

??? note "赋值符的多种使用"

    `:=`:其作用是不会使用后面的变量，只能使用前面已经定义好的

    `?=`:这个很像是#ifndef，例如`name?=sakura`意思是如果变量前面没有被定义，那么变量就是sakura,
    如果前面已经赋值过，那么就使用前面的赋值

    `+=`:

#### 自动变量

* %  :通配符
* $@ :目标文件(当前所在行的最近的目标文件)
* $^ :所有的依赖
* $< :所有依赖中的第一个依赖(不经常使用)。如果依赖是以模式(即`%`)定义的,即和`%`以及 `$@`配合,那么`$<`将是符合模式的一系列的文件集,
    **用相应的依赖，生成相应的目标** (很智能会自动一个一个的选取)

![makefile-rule](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/makfile-rule.png)

## Makefile的应用

### 静态库

```makefile

vpath %.c src
#(1)
main: main.c libstatic.a
	gcc main.c -o main -l static -L ./ -I ./include

libstatic.a: Add.o Change.o Fin.o Menu.o Struc.o delt.o insert.o print.o rank1.o
	ar -rc $@ $^
#(2)
%.o: %.c
	gcc -c $< -o $@ -I ./include
#(3)
clean:
	rm *.o main libstatic.a

```

1. vpath 的时候，搜索的条件中可以包含模式字符 %，这个符号的作用是匹配一个或者是多个字符，
   例如 %.c表示搜索路径下所有的 .c 结尾的文件。如果搜索条件中没有包含 % ，那么搜索的文件就是具体的文件名称。
2. `ar -rc %@ $^` 等同于 `ar -rc libstatic.a *.o`
3. `gcc -c $< -o $@ -I ./include` 等同于 `gcc -c 每一个.c文件 -o 每一个.o文件 -I ./include` 依次执行

![makefile-static](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/makefile-static.png)

### 动态库

~~未待完续~~

- [x] 1234

The HTML specification is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

