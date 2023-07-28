# 数组

>数组是一个固定长度的存储相同数据类型的数据结构，数组中的元素被存储在一段连续的内存空间中。

**特点:**

* 定义相同类型的若干元素
* 数组各个元素地址空间连续
* 数组名是数组的首元素地址，也是整个数组的首地址

**声明数组:** 数据类型 变量名[元素个数]

* 数据类型: 表示的是数组中元素的数据类型，可以是*int、char、float*等等,也可以是*数组、指针、结构体*等
* 变量名: 符合标识符命名规则
* 元素个数: 只能是常量

**数组大小** = 元素大小*元素个数

**初始化数组:**

1. 数据类型  数组名[ 数组长度 ];
> 只定义不赋值，全局变量不赋值--默认是0,局部变量不赋值--默认为随机数
2. 数据类型  数组名[ 数组长度 ] = { 值1，值2 ...};
> 可完全初始化和部分初始化（未赋值的部分系统默认为0）
3. 数据类型  数组名[ ] = { 值1，值2 ...};
> 不带*数组长度*的初始化必定为完全初始化

**遍历数组:**

数组中的每一个元素都可以通过索引访问到。数组的索引通常从0开始，即数组中第一个元素的索引为0.数组的最后一个元素位于（n-1)个索引处。
我们将其称之为基于0的索引。数组也可以是基于其它数的，我们将其称之为基于n的索引。

## 一维数组

```c
int num[10] = {0}; //整型数组 --4*10
char ch[20] = {0};//字符型数组 --1*20
double fl[10] = {0};//浮点型数据 --8*10
```

```c title="验证数组首地址及元素地址连续"
#include <stdio.h>

int main()
{
  int num[10] = {1,2,3,4,5,6,7,8,9,0};
  printf("num的地址:%p\n",num);
  printf("&num的地址:%p\n",&num);
  printf("num[0]的地址:%p\n",&num[0]);
  for(int i = 0;i < 10;i++)
  {
    printf("num[%d]=%p\n",i,&num[i]);
  }
}
```

![](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/array1.png)

```c title="冒泡排序法"
#include <stdio.h>

int main()
{
  int num [10] ={0},i = 0,j = 0 ,temp = 0;
  int len = sizeof(num)/sizeof(num[0]);
  printf("请输入十个数字:\n");
  for(i = 0;i <len;i++)
  {
    scanf("%d",&num[i]);
  }
  for(i = 0;i<len-1;i++)
  {
    for(j = 0; j < len - i -1; j++ )
    {
      if(num[j] < num[j+1])
      {
        temp = num[j];
        num[j] = num[j+1];
        num[j+1] = temp;
      }
    }
  }
  for(i = 0;i <len;i++)
  {
    printf("%d ",num[i]);
  }
}
```

![](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/main/array2maopao.png)

