# 文件

## 基于缓冲区的文件操作：

高级IO  FILE *文件描述

```c

 FILE *fopen(const char *path,const char *mode);

 mode: r r+ (不能创建文件) 
       w w+ (清空写)
       a a+ (追加写)

fclose(fp);
fputc(); fgetc();// (1)
fputs(); fgets();
fprintf(); fscanf();(配合使用)
fwrite(); fread();(二进制文件)
fewind(fp); (光标偏移到文章开头)
fseek(fp,±n,whence); ==> fseek(fp,0,SEEK_SET) == rewind(fp);
long num = ftell(fp);(计算光标当前位置到文件开头的偏移量)
fseek(fp,0,SEEK_END); long num = ftell(fp); -->计算文章大小
feof(fp);计算光标是否达到文件末尾 但会多走一遍

while(fgetc(fp) != -1)
{
    fseek(fp,-1,SEEK_CUR);
}

```

1. fgetc()函数的功能是从文件指针指定的文件中读入一个字符，该字符的ASCII值作为函数的返回值，若返回值为EOF，说明文件结束，
EOF是文件结束标志，值为-1。 语句“c=fgetc(fp);”是从文件指针fp指定的文件中读一个字符并存人c变量中，c是字符型变量。


## 基于非缓冲区的文件操作

低级IO  open的返回值int

```c title="open"

#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
int open(const char *pathname, int flags);
int open(const char *pathname, int flags, mode_t mode);

形参：pathname -- 打开文件的路径

flags：
以下三个宏，必须有一个：
O_RDONLY -- 只读
O_WRONLY -- 只写
O_RDWR  -- 读写

下面的宏，可选：

O_CREAT(创建)   (只要选择该宏，必须给第三个参数)
O_CREAT如果文件不存在，创建
O_CREAT如果文件存在，只打开，mode失效

O_APPEND（追加写）  append
O_TRUNC（清空写）  truncated
O_EXCL要和O_CREAT一块用，如果文件不存在，创建，如果文件存在，直接打开失败

mode：文件的权限  
真正的权限是：mode &(~umask) //umask 掩码 让其他用户没有写权限  
查看umask值的方法：终端输入umask
umask：0002 
~umask：111 111 101
举例：mode传入0777   
真正的权限：
        111 111 111
      & 111 111 101
        111 111 101    即rwx rwx r-x

返回值：成功返回int 类型的文件描述符
失败：-1

希望可读可写，并且如果文件不存在，创建：
flag ： O_RDWR|O_CREAT
希望可读可写，并且如果文件不存在，创建，清空写：
flag ： O_RDWR|O_CREAT|O_TRUNC
int fd= open(“./1.txt”,O_RDWR|O_CREAT|O_TRUNC,0644); rw-r--r--;


```

```c title="close"

#include <unistd.h>

int close(int fd);

形参：open打开获取的文件描述符

```

```c title="举例"

#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

int main()
{
    int fd = open("./1.txt",O_RDWR|O_CREAT|O_TRUNC,0666);
    printf("fd = %d\n",fd);

   //int fd = open("./1.txt",O_RDWR|O_CREAT|O_EXCL,0X666);//O_EXCL与O_CREAT结合使用
    //printf("fd = %d\n",fd); //fd = -1 失败
    
    close(fd);
    return 0;
}

```

```c title="write->二进制文件"

#include <unistd.h>

ssize_t write(int fd, const void *buf, size_t count);

形参：

fildes -- open的返回值

buf -- 你要写入到文件的内容

count -- 写入的大小

返回值：成功写入的字节数
        失败：-1

```

```c title="举例write"

#include <stdio.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

int main()
{
    char buf[100] = "hello world";
    int fd = open("./1.txt",O_RDWR|O_CREAT|O_TRUNC,0666);
    
    if(fd == -1)
    {
        perror("open");
        return 0;
    }
    
    write(fd,buf,strlen(buf));

    close(fd);
    return 0;
}

```

```c title="read->二进制文件"

#include <unistd.h>

ssize_t read(int fildes, void *buf, size_t count);

形参：fildes -- open的返回值
buf -- 你读取到的内容存放的位置
count -- 读取的大小

返回值：成功返回读取的字节数
        失败：-1

```

```c title="lseek光标偏移函数"

off_t lseek(int fildes, off_t offset, int whence);

形参：
fildes -- open的返回值

offset -- 偏移量
+ 往文件末尾方向偏移
- 往文件开头方向偏移

whence  
SEEK_SET  （0）
SEEK_CUR  （1）
SEEK_END  （2）

返回值：光标当前位置到文件开头的偏移量

int num = lseek(fd,0,2); //文件大小

```

```c title="读取复制"

#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

int main(int argc, char *argv[])
{

  int fp1 = open(argv[1], O_RDONLY); //./open1.txt

  if(fp1 == -1 )
  {
    perror("open");
    return 0;
  }

  int fp2 = open(argv[2], O_RDWR|O_CREAT|O_TRUNC,0644);//创建新的1.txt
  
  if(fp2 == -1 )
  {
    perror("open");
    return 0;
  }

  int num = lseek(fp1, 0, 2);
  
  char *p = (char *)malloc(num);

  lseek(fp1,0,0);
  
  read(fp1 , p , num);

  write(fp2, p, num);
  
  printf("%s\n",p);

  
  close(fp1);
  close(fp2);
  
  return 0;
}

```

```c title="使用结构体存放账号和密码"

#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

struct account{
    char name[32];
    char passwd[7];
};

int main(int argc,char *argv[])
{
    struct account per = {"sakura","123456"};

    struct account pe = {0};//读取放的地方

    int fd = open("./5.txt",O_RDWR|O_CREAT|O_TRUNC,0666);

    if(fd == -1)
    {
        perror("open");
        return 0;
    }
        
    write(fd,&per,sizeof(struct account));

    lseek(fd,0,0);//光标偏移到文件开头

    read(fd,&pe,sizeof(struct account)); 
    
    printf("姓名:%s 密码:%s\n",pe.name,pe.passwd);

    close(fd);

    return 0;

}

```

## 时间编程

### 指令

* data
* cal 

![time](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/time.png)

### 函数

> 日历时间: 1970-01-01 00:00:00 到现在的秒数

#### 1.获取日历时间的函数:`time`

```c title="time"

函数原型 time_t time(time_t *t);
所属头文件：<time.h>
参数 t - NULL
返回值:成功返回long int型的日历时间 秒数，失败返回-1

```

```c title="举例time"

#include <stdio.h>
#include <time.h>

int main()
{
  time_t t = time(NULL);
  printf("%ld\n",t);
  return 0;
  
}

```

![time-Func](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/time-Func.png)

#### 2.获取本地时间 `localtime`

```c title="localtime"

功能：将time指向的日历时间转换为本地时间
原型 
struct tm *localtime(const time_t *timep);
所属头文件：<time.h>
参数 timep:指向待转化日历时间
返回值：
   成功：返回以struct tm形式存储的本地时间，失败返回NULL
 struct tm {
     int tm_sec;    /* Seconds (0-60) */
     int tm_min;    /* Minutes (0-59) */
     int tm_hour;   /* Hours (0-23) */
     int tm_mday;   /* Day of the month (1-31) */
     int tm_mon;    /*Month(0-11)*/ +1
     int tm_year;   /*Year-1900*/ +1900
     int tm_wday;   /* Day of the week (0-6, Sunday = 0) */
    int tm_yday;   /* Day in the year (0-365, 1 Jan = 0) */
     int tm_isdst;  /*Daylight saving time */
  };

```

```c title="举例localtime"

#include <stdio.h>
#include <time.h>

int main()
{
  time_t t = time(NULL);
  printf("%ld\n",t);
  struct tm *p = localtime(&t);
  printf("%d-%d-%d %d:%d:%d\n",p->tm_year+1900,p->tm_mon+1,p->tm_mday,p->tm_hour,p->tm_min,p->tm_sec);
  return 0;
  
}

```

![Time-localtime](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/Time-localtime.png)

#### 3.获取格林威治时间`gmtime`

```c title="gmtime"

功能 将参数timep所指定的日历时间转换为标准时间
原型：
struct tm *gmtime(const time_t *timep);
所属头文件<time.h>
参数：timep待转化的日历时间
返回值 成功返回世界标准时间，以struct tm形式存储
 struct tm {
     int tm_sec;    /* Seconds (0-60) */
     int tm_min;    /* Minutes (0-59) */
     int tm_hour;   /*Hours(0-23)*/+8
     int tm_mday;   /* Day of the month (1-31) */
     int tm_mon;    /*Month(0-11)*/+1
     int tm_year;   /*Year-1900*/ +1900
     int tm_wday;   /* Day of the week (0-6, Sunday = 0) */
    int tm_yday;   /* Day in the year (0-365, 1 Jan = 0) */
     int tm_isdst;  /*Daylight saving time */
  };

```

```c title="举例gmtime"

#include <stdio.h>
#include <time.h>

int main()
{
  time_t t = time(NULL);
  printf("%ld\n",t);
  struct tm *p = gmtime(&t);
  printf("%d-%d-%d %d:%d:%d\n",p->tm_year+1900,p->tm_mon+1,p->tm_mday,p->tm_hour+8,p->tm_min,p->tm_sec);
  return 0;
  
}

```

![time-gtime](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/time-gmtime.png)

#### 4.日历转化成本地时间 `ctime`

```c title="ctime"

功能 将日历时间转化为本地时间
原型 char *ctime(const time_t *timep);
所属头文件
   <time.h>
参数 待转化为日历时间
返回值：返回一字符串表示目前当地的时间日期。

```
```c title="举例ctime"

#include <stdio.h>
#include <time.h>

int main()
{
  time_t t = time(NULL);
  printf("%ld\n",t);
  char *p = ctime(&t);
  printf("%s\n",p);
  return 0;
  
}

```

![time-ctime](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/time-ctime.png)

#### 5.将struct tm格式的时间转化为字符串`asctime`

```c title="asctime"

原型 char *asctime(const struct tm *tm);
所属头文件： <time.h>
参数：待转化的tm格式的时间
返回值：字符串显示的时间

```

```c title="举例asctime"

#include <stdio.h>
#include <time.h>

int main()
{
  time_t t = time(NULL);
  printf("%ld\n",t);
  struct tm *p = localtime(&t);//或 struct tm *p = gmtime(&t); 使用gmtime 显示时间与北京时间少8小时
  char *z = asctime(p);
  printf("%s\n",z);
  return 0;
  
}

```

![time-asctime](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/time-asctime.png)

#### 6.自由格式时间 `strftime`

```c title="strftime"

所属头文件:  #include <time.h>
功能: 字符串显示时间
原型: size_t strftime(char*s,size_t max, const char *format,const struct tm *tm);//printf(const char *format,...);
参数:
  s -- 存放格式化时间存放的位置。
  max -- 这是给 str 要复制的字符的最大数目。
  format -- “原样输出+格式控制符”
tm -- localtime/gmtime的返回值
 返回值：s指向缓冲区的字节长度，不包括‘\0’

time_t t = time(NULL);
char buf[100] = {0};
struct tm *p = localtime(&t);
strftime（buf,100,”%D/%y/%m/%d”,p）；
printf(“%s”，buf);

给定的格式FORMAT 控制着输出，解释序列如下：

  %a    当前locale 的星期名缩写(例如： 日，代表星期日)
  %A    当前locale 的星期名全称 (如：星期日)
  %b    当前locale 的月名缩写 (如：一，代表一月)
  %B    当前locale 的月名全称 (如：一月)
  %c    当前locale 的日期和时间 (如：2005年3月3日 星期四 23:05:25)
  %C    世纪；比如 %Y，通常为省略当前年份的后两位数字(例如：20)
  %d    按月计的日期(例如：01)
  %D    按月计的日期；等于%m/%d/%y
  %e    按月计的日期，添加空格，等于%_d
  %F    完整日期格式，等价于 %Y-%m-%d
  %g    ISO-8601 格式年份的最后两位 (参见%G)
  %G    ISO-8601 格式年份 (参见%V)，一般只和 %V 结合使用
  %h    等于%b
  %H    小时(00-23)
  %I    小时(00-12)
  %c    按年计的日期(001-366)
  %k    时(0-23)
  %l    时(1-12)
  %m    月份(01-12)
  %M    分(00-59)
  %n    换行
  %N    纳秒(000000000-999999999)
  %p    当前locale 下的"上午"或者"下午"，未知时输出为空
  %P    与%p 类似，但是输出小写字母
  %r    当前locale 下的 12 小时时钟时间 (如：11:11:04 下午)
  %R    24 小时时间的时和分，等价于 %H:%M
  %s    自UTC 时间 1970-01-01 00:00:00 以来所经过的秒数
  %S    秒(00-60)
  %t    输出制表符 Tab
  %T    时间，等于%H:%M:%S
  %u    星期，1 代表星期一
  %U    一年中的第几周，以周日为每星期第一天(00-53)
  %V    ISO-8601 格式规范下的一年中第几周，以周一为每星期第一天(01-53)
  %w    一星期中的第几日(0-6)，0 代表周一
  %W    一年中的第几周，以周一为每星期第一天(00-53)
  %x    当前locale 下的日期描述 (如：12/31/99)
  %X    当前locale 下的时间描述 (如：23:13:48)
  %y    年份最后两位数位 (00-99)
  %Y    年份
  %z +hhmm              数字时区(例如，-0400)
  %:z +hh:mm            数字时区(例如，-04:00)
  %::z +hh:mm:ss        数字时区(例如，-04:00:00)
  %:::z                 数字时区带有必要的精度 (例如，-04，+05:30)
  %Z                    按字母表排序的时区缩写 (例如，EDT)

```

```c title="举例strftime"

#include <stdio.h>
#include <time.h>

int main()
{
  time_t t = time(NULL);

  char buf[100] = {0};

  struct tm *p = localtime(&t);

  strftime(buf,100,"%y-%m-%d %H:%M:%S %p",p);

  printf("%s",buf);

  return 0;

}

```

![time-strftime](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/time-strftime.png)

~~未待完续~~
