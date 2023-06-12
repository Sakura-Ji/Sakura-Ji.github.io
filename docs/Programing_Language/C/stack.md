# 堆栈

```c title="使用数组实现堆栈效果"

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
  else 
  {
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
  else
  {
    printf("输出的值为:%d\n",sta->sum[sta->top]);
    sta->top--;
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

```c title="使用链表实现"

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

void PUSH()
{
  struct STACK *new = (struct STACK *)malloc(sizeof(struct STACK));// (3)
  printf("请输入存入的值\n");
  scanf("%d",&new->num);// (4) 
  // (5)
  new->front = top;// (6)
  top = new;//(7)  
}

void PULL()
{
  struct STACK *del = top;// (8) 
  if(top == NULL)
  {
    printf("栈区为空\n");
    return;
  }
  else
  {
    printf("PULL=%d\n",top->num);
    top = top->front;// (9)
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

1. : 保存上一个STACK的地址
2. : 定义一个全局变量的STACK的指针结构体top <-->相当于head 的链接
3. : 申请一块大小为STACK的结构体空间赋值给STACK类型的new
4. : 存入值给new->num
5. : 下面两句就可将链接推动起来 每次都将top的地址更新 更新后赋值给最新的new->front
6. : 将top的地址赋给new->front
7. : 然后将new的地址给top 
8. : 定义一个中间变量 来保存最初的地址 用来释放该地址的空间 
9. : 输出栈区最上方的数值后,将top指向的地址更新
