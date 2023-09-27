---
comments: true
---
指针：

	指针就是一个{==数据类型==}，该数据类型就是专门用来存放地址的
	
	定义: 指针指向的空间类型 * 变量名；
	
解指针：

	通过指针，拿到指针指向的空间

函数的递归:

	函数自身调用自身：
	- 1.必须存在递归的结束条件
	- 2.一般会有递归的起始值
	- 3


``` C title="调用"
#include <stdio.h>

int main()
{
	int n = 5;
	int num = Fun(n);
	return 0;
}
int Fun(int n)
{
	int age = 0;
	if(n == 1)
	{
		age = 10;
	}
	else
	{
       age = Fun(n - 1) +2 ;	
	}
	return age;
}
```

```C title="实现n!阶乘"
#include <stdio.h>

int main()
{
	int n = 1;
	printf("请输入一个数值:\n");
	scanf("%d",&n);
	int num = Fun(n);
	return 0;
}

int Fun(int n)
{
	int num = 1;
	if(n = 1)
	{
		num = 1;
	}
	else 
	{
		num = Fun(n- 1) * n; // (1) 
	}
	return num;
}
```

1.  :man_raising_hand: 这里是循环调用的妙处所在


