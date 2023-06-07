# 链表

### 初始化链表节点

在stdlib.h文件中给malloc函数提供库 [^1] ,string.h文件中给memset函数提供库[^2]
    
```c title="链表节点Struc.h文件"
#ifndef _STRUC_H_
#define _STRUC_H_

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
struct Stu {
    int id;
    char name[30];
    float grade;
};// (1) 
struct NODE{
  struct Stu stu;
  struct NODE *addr;
};// (2)
struct NODE *Creat_Head(void);
#endif // !DEBUG
```

1.  :woman_raising_hand: 定义学生结构体包括学号，姓名和成绩。
2.  :eyes: 定义链表，第一个存放学生结构体数据，第二个存放下一个节点的地址

```c title="链表节点.c函数"
#include "Struc.h"

struct NODE *Creat_head(void)// (1)
{
struct NODE *head = (struct NODE *)malloc(sizeof(struct NODE));
if(head == NULL)
 {  
 printf("创建失败"\n);// (2)
 return NULL;
 }
 memset(head,0,sizeof(struct Stu));// (3)
 head->addr = NULL;
 return head;

}
```

1.  :grinning: 初始化链表头部函数
2.  :neutral_face: malloc函数有可能申请空间失败，当然这种情况几乎不会存在但要知道
3.  :sparkles: memset函数对head地址中初始化数据Stu，并赋予0值，所以下边还要对addr进行赋NULL 当然你也可以直接初始化NODE

### 学生管理系统的主函数

```c title="主函数的头文件-main.h"
#ifndef _MAIN_H_
#define _MAIN_H_
#include <stdio.h>
#include <string.h>
#include "Struc.h"
#include "Menu.h"
#include "Add.h"
#include "Change.h"
#include "Fin.h"
#include "print.h"
#include "delt.h"
#include "rank1.h"
#include "insert.h"
enum{quit,add,del,chang,find,rank,prin,inser};
#endif // !DEBUG
```

```c title="main.c"
#include"main.h"

int main() 
{
  struct NODE *head = Creat_Head();
	if(head == NULL)
	{
		printf("开辟空间失败\n");
		return 0; 
	}
  while(1)
  {
    int num = Menu();
    switch(num)
    {
      case add :Add(head); break;
      case del :delt(head); break;
      case chang :change(head); break;
      case find : fin(head);break;
      case rank : rank1(head); break;
      case prin : print(head);break;
      case inser : insert(head);break;
      case quit : printf("欢迎下次使用\n");return 0;
      default: printf("输入有误请重新输入\n");
    }
  }
}

```
### 遍历学生管理系统

```c title="print.h文件"
#ifndef _PRINT_H_
#define _PRINT_H_
#include <stdio.h>
#include "Struc.h"

void print(struct NODE *head);

#endif // !DEBUG
```

```c title="print.函数"
#include "print.h"

void print(struct NODE *head)
{
  struct NODE *temp = head->addr;
  while(temp != NULL)
  {    
      printf("姓名是:%s 学号是:%d 成绩是:%.1f\n",temp->stu.name,temp->stu.id,temp->stu.grade);
      temp = temp->addr;
  }
}

```
### 排序学生管理系统

```c title="排序.c函数"
#include "rang1.h"

void rank1(struct NODE *head)
{
  struct NODE *tmp1,*tmp2;
  struct Stu a;

  for(tmp1 = head->addr;tmp1->addr != NULL;tmp1 = tmp1 ->addr)
  {
      for(tmp2= head->addr;tmp2->addr !=NULL;tmp2 = tmp2->addr)
      {
          if(tmp2->stu.grade < tmp2->addr->stu.grade)
          {
              a = tmp2->stu;
              tmp2->stu = tmp2->addr->stu;
              tmp2->addr->stu = a;
          }
      }
  }
  print(head);

}
```

??? node "对排序的理解"
    
    使用链表通过冒泡排序法，以成绩的高低对学生管理系统进行排序。其外环和内环的循环结构虽然一样，但意思有所不同。
    
    外环控制循环的次数，我们知道，在冒泡排序法中，一共进行**数据-1**次，由于我们头节点不存放函数(7个节点，6个有
    数据循环进行5次).所以tmp1 = head->addr;就将头节点排除，然后在条件中tmp1->addr,链接到下一个addr,尾节点没进去，
    所以判断中意思就变成了 {==tmp1->addr->addr==} 也就进行了减一次.
    
    内环控制两个数字的比较，其含义就和普通冒泡法一样，普通冒泡法我们根据规律知道两两组合，次数等于**剩余数据数量-1**
    和外环 **初始值+条件+判断** 组合一样，就是进行了减两次，这样就遍历成功啦！:innocent: 


### 遍历节点

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
struct NODE *head = Creat_Head();

struct NODE *tmp = head->addr; // (1)
while(tmp != NULL)
{
    printf("学生的姓名:%s,学生的学号:%d,学生的成绩:%.1f\n",tmp->Stu.name,tmp->Stu.id,tmp->Stu.grade);
    tmp = tmp->addr; // (2)
}
```

1.  :man_raising_hand: tmp指向的是节点中的地址 
2.  :man_raising_hand: 这里是每次tmp都将指向下一个节点的地址，这样就促成了链表的形成，这种是进入链表的方式

![头部不存放数据](https://pic.imgdb.cn/item/647f035b1ddac507ccd2c8d8.jpg)

###存放数据
```c title="链表通过遍历存放数据"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
struct NODE *head = Creat_Head();


```
[^1]: malloc函数定义：
[^2]: memset函数定义：
