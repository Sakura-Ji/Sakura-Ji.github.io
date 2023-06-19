# Makefile

## 什么是Makefile

我想说，在学习编程初阶段我们习惯性使用GCC/G++命令来帮助我们编译调试代码，可是当进行系统性编程的时候，编译和调试得复杂起来，我们可能需要许许多多的文件，那么命令可能是一大行并且可能自己都不知道那些需要编译，那些是刚刚修改过，只需要再次对进行修改，而不是将所有的文件再次进行编译，那么我们此时就需要使用到Makefile

## Makefile 规则

- make 会在当前目录下找到一个名字叫 `Makefile` 或 `makefile` 的文件
- 如果找到，它会找文件中第一个目标文件（target），并把这个文件作为最终的目标文件
- 如果 target 文件不存在，或是 target 文件依赖的 .o 文件(prerequities)的文件修改时间要比 target 这个文件新，就会执行后面所定义的命令 command 来生成 target 这个文件
- 如果 target 依赖的 .o 文件（prerequisties）也存在，make 会在当前文件中找到 target 为 .o 文件的依赖性，如果找到，再根据那个规则生成 .o 文件

## Makefile的使用语法

```makefile

target ... : prerequisites ...
    commend

```

??? note "用法解释"

    target 也就是一个目标文件，可以是 Object File，也可以是执行文件。还可以是一个标签（Label）prerequisites 就是，要生成那个 target 所需要的文件或是目标。command 也就是 make 需要执行的命令。（任意的 Shell 命令）

### 举例

创建一个文件夹，然后在里面建立一个**Makefile**的文件，在里面输入以下内容，保存后在终端输入`make debug`

```makefile title="最简单的例子"
debug :
    echo hello world
# (1)

```

1. echo前面空位必须使用`Tab`否则Makefile文件会报错,不想在终端显示echo，可在前面加上`@`，`#`这是makefile的注释符

![makefile](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/Makefile1.png)

## 伪目标

"伪目标" 不是一个文件，只是一个标签。我们要显示地指明这个 "目标" 才能让其生效

"伪目标" 的取名不能和文件名重名，否则不会执行命令

为了避免和文件重名的这种情况，我们可以使用一个特殊的标记 `.PHONY` 来显示地指明一个目标是“伪目标”，向 make 说明，不管是否有这个文件，这个目标就是 "伪目标"

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

## Makefile声明变量

为什么要声明变量，其实如果你学过(你肯定学过编程语言，不然你为什么来学习Makefile)C语言，那么如果不设定变量，
那么我们每次使用这个数值的时候，都要引用这个数值，那么我们要修改它，需要在原文中全部都修改，这样太麻烦了，
所以要引入变量，Makefile同理

声明时变量的名字可随意定，但最好**知名其意**：

```makefile
objects = main.o add.o printf.o
# (1)
edit : $(objects) 
gcc -o edit $(objects)
# (2)
clean : 
rm edit $(objects) 
```

1. : objects就是我们定义的变量，用`=`来赋值
2. : 使用`$(objects)`来使用这个变量

??? note "赋值符的多种使用"

    `:=`:其作用是不会使用后面的变量，只能使用前面已经定义好的

    `?=`:这个很像是#ifndef，例如`name?=sakura`意思是如果变量前面没有被定义，那么变量就是sakura,
    如果前面已经赋值过，那么就使用前面的赋值

    `+=`:






