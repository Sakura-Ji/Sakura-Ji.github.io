# int main(int argc,char *argv[])

对main的解读:初始学习是，`main`后面一般是`(void)`,这对于初学习C语言的学者是非常友好的，但随着学习的深入，我们要了解
`main`的特殊用法，毕竟`main`也是一个函数

argc : 命令行自动统计argv的个数

char *argv[]:  ./a.out + 参数一 + 参数二

例如:

```c
#include <stdio.h>
#include <stdlib.h>

int main(int argc,char *argv[])
{
  if( argc != 4)
  {
    printf("参数有误\n");
    return 0;
  }
  int a = atoi(argv[1]);
  int b = atoi(argv[3]);

  switch(*argv[2])
  {
    case '+': printf("argv[1]+argv[3]=%d\n",a+b);break;
    case '-': printf("argv[1]-argv[3]=%d\n",a-b);break;
    case '*': printf("argv[1]*argv[3]=%d\n",a*b);break;// (1)
    case '/': 
      {
      if(atoi(argv[3]) != 0) 
        printf("argv[1]/argv[3]=%d\n",a/b);
      else 
        printf("argv[3]=0时不能当被除数\n");
      break;
      }
  }

  return 0;
}
```

1. :alien: 在命令行中使用 * 号需要使用 `'*'` 或者 `\*` 将其特殊含义取消

??? note "atoi"
    
    include<stdlib.h>库中含有int atoi(const char *nptr);

    用法：将字符串里的数字字符转化为整形数。返回整形值。

    注意：转化时跳过前面的空格字符，直到遇上数字或正负符号才开始做转换，而再遇到非数字或字符串结束时(’/0’)才结束转换，并将结果返回。

    
![folder](https://jsd.onmicrosoft.cn/gh/Sakura-Ji/MapDepot/Mkdocs/folder.png)




