# 堆栈

栈（stack）又名堆栈，它是一种运算受限的线性表，遵循先入后出（First In, Last Out）原则的线性数据结构，只能从表的一端读取数据，另一端是封闭的

* 栈顶(TOP): 线性表允许插入删除的一端
* 栈底(Bottom): 固定的，不允许插入和删除的一端
* 空栈: 不含任何元素的空表 

下方图片来源于[《hello 算法》](https://www.hello-algo.com/)可点击图片阅读**栈**这一节的内容，非常详细。

[![栈的规则](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/Mkdocs/main/hello.algo.png)](https://www.hello-algo.com/chapter_stack_and_queue/stack/)

## 顺序栈

顺序栈：采用顺序存储结构可以模拟栈存储数据的特点，从而实现栈存储结构，使用数组来实现

```c title="使用数组实现栈效果"

#include <stdio.h>
struct STACK {
  int sum[5];
  int top;
};
int Menu();
void PUSH(struct STACK *sta);
void PULL(struct STACK *sta);
int main()
{
  printf("请输入所要进行的操作\n");
  struct STACK sta = {.top = -1};//部分赋初值
  while(1)
  {
    switch (Menu())
    {
      case 1 : PUSH(&sta);break;//地址传递
      case 2 : PULL(&sta);break;
      case 0 : return 0;
    }
  }
}

void PUSH(struct STACK *sta)
{
  int i = 0;
  if(sta->top == 5)
  {
    printf("已存满\n");
    return;
  }
  sta->top++;
  printf("输入想要存进的数值\n");
  scanf("%d",&sta->sum[sta->top]);
  printf("已存入\n");
  }
}

void PULL(struct STACK *sta)
{
  if(sta->top ==  -1)
  {
    printf("已无存储的值\n");
    return;
  }
  printf("输出的值为:%d\n",sta->sum[sta->top]);
  sta->top--;  
}

int Menu()
{
  int num = 0;
  printf("1.进栈\n");
  printf("2.出栈\n");
  printf("0.退出\n");
  scanf("%d",&num);
  return num;
}

```

## 链栈

链栈：采用链式存储结构实现栈结构，使用的是链表

```c title="使用链表实现栈效果"

#include <stdio.h>
#include <stdlib.h>

struct STACK {
  int num;
  struct STACK *front;// (1) 
};

int Menu();
void PUSH(void);
void PULL();
struct STACK *top = NULL;// (2) 

int main()
{
  printf("请输入所要进行的操作\n");
  while(1)
  {
    switch (Menu())
    {
      case 1 : PUSH();break;
      case 2 : PULL();break;
      case 0 : return 0;
    }
  }
  
}

void PUSH()// (3)
{
  struct STACK *new = (struct STACK *)malloc(sizeof(struct STACK));
  printf("请输入存入的值\n");
  scanf("%d",&new->num);

  new->front = top;
  top = new;
}

void PULL()
{
  struct STACK *del = top;// (4) 
  if(top == NULL)
  {
    printf("栈区为空\n");
    return;
  }
  else
  {
    printf("PULL=%d\n",top->num);
    top = top->front;// (5)
    free(del);
  }
}

int Menu()
{
  int num = 0;
  printf("1.进栈\n");
  printf("2.出栈\n");
  printf("0.退出\n");
  scanf("%d",&num);
  return num;
}

```

1. :notes: 保存上一个STACK的地址
2. :dizzy: 定义一个全局变量的STACK的指针结构体top <-->相当于head 的链接
3. :point_down: 请阅读下方笔记
4. :smile_cat: 定义一个中间变量 来保存最初的地址 用来释放该地址的空间 
5. :pouting_cat: 输出栈区最上方的数值后,将top指向的地址更新

??? note "PUSH进栈的详解"

    首先给STACK类型`new`申请一块大小为STACK的结构体空间，将存入值赋给`new->num`
    
    35，36行，可将链接推动起来，每次都将top的地址更新，更新后赋值给最新的`new->front`，将top的地址赋给`new->front`
    然后将new的地址赋给top :muscle:
    
