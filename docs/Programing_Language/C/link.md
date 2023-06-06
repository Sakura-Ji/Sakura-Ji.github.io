## 链表

```c title="初始化创建链表节点"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main()
{
    struct Stu{
        char name[50];
        int id;
        float grade;
    }
    struct NODE{
        struct Stu stu;
        struct Stu *addr;
    }
    struct NODE *Creat_head(void)
    {
        struct NODE *head = (struct NODE *)malloc(sizeof(struct NODE));
        if(head == NULL)
        {
            printf("创建失败"\n);
            return NULL;
        }
        memset(head,0,sizeof(struct Stu));
        head->addr = NULL;
        return head;
    }

}
```
###遍历节点
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
