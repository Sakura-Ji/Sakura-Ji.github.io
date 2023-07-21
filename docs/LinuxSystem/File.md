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


## 基于非缓冲区的文件操作 {#FILE}

低级IO  open的返回值int

!!! example "函数定义"

    === "open"

        ```c 
        
        所属头文件:
        #include <sys/types.h>
        #include <sys/stat.h>
        #include <fcntl.h>
        函数原型:
        int open(const char *pathname, int flags);
        int open(const char *pathname, int flags, mode_t mode);
        
        形参:
        pathname -- 打开文件的路径
        
        flags：
        以下三个宏，必须有一个：
        O_RDONLY -- 只读
        O_WRONLY -- 只写
        O_RDWR  -- 读写
        
        下面的宏，可选：
        
        O_CREAT(创建)   (只要选择该宏，必须给第三个参数)
        1. 如果文件不存在，创建
        2. 如果文件存在，只打开，mode失效
        
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
    === "close"

        ```c 
        
        #include <unistd.h>
        
        int close(int fd);
        
        形参：open打开获取的文件描述符
        
        ```
    === "write->二进制文件"

        ```c 
        
        #include <unistd.h>
        
        ssize_t write(int fd, const void *buf, size_t count);
        
        形参：
        
        fildes -- open的返回值
        
        buf -- 你要写入到文件的内容
        
        count -- 写入的大小
        
        返回值：成功写入的字节数
                失败：-1
        
        ```
    === "read->二进制文件"

        ```c 
        
        #include <unistd.h>
        
        ssize_t read(int fildes, void *buf, size_t count);
        
        形参：fildes -- open的返回值
        buf -- 你读取到的内容存放的位置
        count -- 读取的大小
        
        返回值：成功返回读取的字节数
                失败：-1
        
        ```
    === "lseek光标偏移函数"
    
        ```c 
        
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

!!! example "函数举例"

    === "open举例"

        ```c 
        
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
    === "write举例"    
        
        ```c 
        
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
    === "读取复制" 

        ```c 
        
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
    === "使用结构体存放账号和密码"   

        ```c 
        
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

## 目录操作

### 函数

1. 打开目录的函数是: `opendir`
2. 关闭目录的函数是: `closedir`
3. 读取目录信息的函数是: `readdir`
4. 创建目录(文件夹)的函数是: `mkdir`
5. 删除目录(文件夹)的函数是: `rmdir`
6. 获取当前目录路径的函数是: `getcwd`
7. 切换目录的函数是: `chdir`
8. 更改目录文件的权限的函数是: `chmod`
9. 重新定位到目录文件的开头的函数是: `rewinddir`
10. 读取当前目录流的位置的函数是: `telldir`
11. 设置读取目录文件的位置的函数是: `seekdir`

!!! example "函数定义"

    === "opendir"

        ```c

        所属头文件:
        #include <sys/types.h>
        #include <dirent.h>
        函数原型:DIR *opendir(const char *name);
        形参:name：目录的路径
        返回值:成功返回 - DIR * -- 目录流指针
              失败返回 NULL

        ```
    === "closedir"

        ```c
        
        所属头文件:
        #include <sys/types.h>
        #include <dirent.h>
        int closedir(DIR *dirp);
        参数：opendir的返回值
        返回值：成功返回0，失败返回-1

        ```

    === "readdir"

        ```c

        所属头文件:
        #include <sys/types.h>
        #include <dirent.h>
        函数原型：
        struct dirent *readdir(DIR *dirp);
        参数:
          打开目录后返回的目录流指针
        返回值:
          成功返回 读取到的目录的内容
            读取到目录结尾，也会返回NULL
          失败返回 NULL
        readdir:一个文件一个文件的读，一次调用，只能读取到一个文件的信息，返回文件信息的结构体指针

        struct dirent
        {
             long d_ino;   i节点号 
             off_t d_off;  在目录文件中的偏移
             unsigned short d_reclen; 文件名长 
             unsigned char d_type; 文件类型 
             char d_name[256]; 文件名，最长255字符 */
        }

        d_type的使用要用宏定义，不能使用%c

              DT_BLK      This is a block device.

              DT_CHR      This is a character device.

              DT_DIR      This is a directory.

              DT_FIFO     This is a named pipe (FIFO).

              DT_LNK      This is a symbolic link.

              DT_REG      This is a regular file.

              DT_SOCK     This is a UNIX domain socket.

              DT_UNKNOWN  The file type could not be determined.
        ```

    === "mkdir"

        ```c

        所属头文件:
        #include <sys/stat.h>
        #include <sys/types.h>
        函数原型：
        int mkdir(const char *pathname, mode_t mode);  
        参数：pathname：文件路径
            mode：直接使用数字即可（权限）
        真正的权限：mode & (~umask)
        返回值：
          成功返回0，错误返回-1

        ```

    === "rmdir"

        ```c
        
        所属头文件:
        #include <unistd.h>
        函数原型:
          int rmdir(const char *pathname);
        参数
          要删除的目录绝对路径，要求目录为空
        返回值：成功返回0，错误返回-1

        ```
    === "getcwd"

        ```c
        
        所属头文件:
        #include <unistd.h>
        函数原型：
        char *getcwd(char *buf, size_t size);
        参数  
          buf：获取到的路径，存放的位置
          size：buf最大为255字节
        返回值
          成功返回第一个参数
        失败返回NULL

        ```
    === "chdir"

        ```c
        
        所属头文件: 
        #include <unistd.h>
        功能：修改当前目录，即切换目录，相当于cd命令
        函数原型 int chdir(const char *path);
        参数：
        path：文件路径（~不识别）
        返回值
        成功返回0，失败返回-1
        
        ```
    === "chmod"

        ```c
        
        所属头文件:
        #include <sys/types.h>
        #include <sys/stat.h>
        原型
        int chmod(const char *path, mode_t mode);
        参数：
          path ：文件路径
          mode：权限（给什么就是什么）
        返回值
          成功返回0失败-1
        
        ```
    === "rewinddir"
        ```c
        
        所属头文件：
        #include <sys/types.h>
        #include <dirent.h>
        功能：重新定位到目录文件的头部
        函数原型：void rewinddir(DIR *dir);
        参数：打开目录后返回的文件指针
        返回值
        		成功返回指向dirp的指针dirent，错误返回NULL
       
        ```
    === "telldir"

        ```c
        
        所属头文件:
        #include <sys/types.h>
        #include <dirent.h>
        功能：设置参数dir 目录流目前的读取位置, 在调用readdir()时便从此新位置开始读取. 参数offset 代表距离目录文件开头的偏移量。
        函数原型：
        void seekdir(DIR *dir,off_t offset);
        返回值：无

        ```
    === "seekdir"

        ```c
        
        所属头文件:
        #include <sys/types.h>
        #include <dirent.h>
        功能：取得目录流的读取位置
        函数原型：off_t telldir(DIR *dir); 
        参数：打开目录后返回的文件指针
        返回值：成功返回距离目录文件开头的偏移量返回值返回下个读取位置, 有错误发生时返回-1

        ```

### 举例

!!! example
    
    === "初识"

        ```c title="打开/关闭目录"
        
        #include <sys/types.h>
        #include <dirent.h>
        #include <stdio.h>
        
        int main(int argc,char *argv[])
        {
        
          if(argc != 2)
          {
            printf("参数有误\n");
            return -1;
          }
        
          DIR *fd = opendir(argv[1]); // opendir的返回值是DIR *类型的
        
          if(fd == NULL)
          {
            perror("打开失败\n");
            return -1;
          }
        
          struct dirent *file = NULL; // readdir的返回值是struct dirent *类型的
        
          while( (file=readdir(fd)) != NULL)
          {
            if(file->d_name[0] != '.') //不显示.隐藏文件
            {
              printf("%s:%ld\n",file->d_name,file->d_ino);  
            }
          }
          closedir(fd);
        }
        
        ```
    === "再探"

        ```c title="实现ls的功能"
        
        #include <sys/types.h>
        #include <dirent.h>
        #include <stdio.h>
        #include <string.h>
        
        int main(int argc,char *argv[])
        {
          char path[255] = {0};   //实现ls的功能
          if(argc < 2)
          {
            strcpy(path,".");
          }
          else if(argc == 2)
          {
            strcpy(path,argv[1]);
          }
          else
          {
            printf("参数有误\n");
            return -1;
          }
          
          DIR *fd = opendir(path); // opendir的返回值是DIR *类型的
          if(fd == NULL)
          {
            perror("打开失败\n");
            return -1;
          }
        
          struct dirent *file = NULL;// readdir的返回值是struct dirent *类型的
        
          while( (file=readdir(fd)) != NULL)
          {
            if(file->d_name[0] != '.') //不显示.隐藏文件
            {
              printf("%s:%ld\n",file->d_name,file->d_ino);  
            }
          }
          closedir(fd);
        }
        ```
    
        ![readdir](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/readdir.png)
    
    === "回眸"

        ```c title="查看文件类型"
        
        #include <sys/types.h>
        #include <dirent.h>
        #include <stdio.h>
        #include <string.h>
        
        int main(int argc,char *argv[])
        {
          char path[255] = {0};   //实现ls的功能
          if(argc < 2)
          {
            strcpy(path,".");
          }
          else if(argc == 2)
          {
            strcpy(path,argv[1]);
          }
          else
          {
            printf("参数有误\n");
            return -1;
          }
          
          printf("DT_REG\tDT_DIR\tDT_LNK\tDT_FIFO\tDT_SOCK\n%d\t%d\t%d\t%d\t%d\n",DT_REG,DT_DIR,DT_LNK,DT_FIFO,DT_SOCK); //根据宏显示的数字来显示文件类型
          
          DIR *fd = opendir(path); // opendir的返回值是DIR *类型的
          if(fd == NULL)
          {
            perror("打开失败\n");
            return -1;
          }
        
          struct dirent *file = NULL;// readdir的返回值是struct dirent *类型的
        
          while( (file=readdir(fd)) != NULL)
          {
            if(file->d_name[0] != '.') //不显示.隐藏文件
            {
              printf("%s:%d\n",file->d_name,file->d_type);  
            }
          }
          closedir(fd);
        }
        
        ```
        
        ![readdir-d_type](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/readdir-d_type.png){ width="400" }

    === "相识"

        ```c title="使用linux方式查看文件类型"
        #include <sys/types.h>
        #include <dirent.h>
        #include <stdio.h>
        #include <string.h>
        
        char Fun(unsigned char num);
        int main(int argc,char *argv[])
        {
          char path[255] = {0};   //实现ls的功能
          if(argc < 2)
          {
            strcpy(path,".");
          }
          else if(argc == 2)
          {
            strcpy(path,argv[1]);
          }
          else
          {
            printf("参数有误\n");
            return -1;
          }
          printf("DT_REG\tDT_DIR\tDT_LNK\tDT_FIFO\tDT_SOCK\n%d\t%d\t%d\t%d\t%d\n",DT_REG,DT_DIR,DT_LNK,DT_FIFO,DT_SOCK);
          DIR *fd = opendir(path); // opendir的返回值是DIR *类型的
          if(fd == NULL)
          {
            perror("打开失败\n");
            return -1;
          }
        
          struct dirent *file = NULL;// readdir的返回值是struct dirent *类型的
        
          while( (file=readdir(fd)) != NULL)
          {
            if(file->d_name[0] != '.') //不显示.隐藏文件
            {
              printf("%s:%c\n",file->d_name,Fun(file->d_type));  
            }
          }
          closedir(fd);
        }
        
        char Fun(unsigned char num)//将数字转换成linux中字符表示
        {
          if(num == DT_REG)
            return '-';
          else if(num == DT_DIR)
            return 'd';
          else if(num == DT_LNK)
            return 'l';
          else if(num == DT_SOCK)
            return 's';
          else if(num == DT_FIFO)
            return 'p';
          else 
          {
            return 0;
          }
        }
                
        ```
        
        ![readdir-d_type2](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/readdir-d_type2.png)

    === "再聚"

        ```c title="创建和删除文件夹"
        
        #include <sys/stat.h>
        #include <sys/types.h>
        #include <stdio.h>
        #include <unistd.h>
        int main()
        { 
          //创建
          int a = mkdir("./Test", 0666);
          if(a == -1 )
          {
            perror("mkdir");
            return -1;
          }
          //删除:要求目录的路径为空
          rmdir("./Test");
          perror("rmdir");
          return 0;
        }
        ```

        ![mkdir-rmdir](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/mkdir-rmdir.png)

    === "相会"

        ```c title="chmod/getcwd/chdir"

        #include <stdio.h>
        #include <unistd.h>
        #include <sys/types.h>
        #include <sys/stat.h>
        
        int main(int argc, char *argv[])
        {
        
          chmod(argv[1], 0777);//修改文件权限 
          perror("chmod");
          
          char buf[255] = {0};
          char *p = getcwd(buf, 255);//返回值和给buf存入的值是相同的
          printf("buf: %s\np: %s\n",buf,p);
          
          chdir("..");//切换路径,chdir后不认识~ 不能切换到~下的路径
          p = getcwd(buf,255);
          printf("更换后的路径buf: %s\n更换后的路径p: %s\n",buf,p);
          
          chdir("/");//切换路径
          p = getcwd(buf,255);
          printf("更换后的路径buf: %s\n更换后的路径p: %s\n",buf,p);
          
          return 0;
        }

        ```

        ![chmod-getcmd-chdir](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/chmod-getcmd-chdir.png)
    
    === "约定"

        ```c title="实现查找所有.txt文件，并将其加上路径"

        #include <stdio.h>
        #include <unistd.h>
        #include <sys/types.h>
        #include <dirent.h>
        #include <string.h>
        
        int main(int argc, char *argv[])
        {
          char path[255] = {0};   //实现ls的功能
        
          if(argc < 2)
          {
            strcpy(path,".");
          }
          else if(argc == 2)
          {
            strcpy(path,argv[1]);
          }
          else
          {
            printf("参数有误\n");
            return -1;
          }
        
          DIR *fd = opendir(path); // opendir的返回值是DIR *类型的
          if(fd == NULL)
          {
            perror("打开失败\n");
            return -1;
          }
        
          struct dirent *file = NULL;// readdir的返回值是struct dirent *类型的
          
          char buf[255] = {0};
          //将readdir读到的文件赋给file,读到文件末尾会返回NULL所以可以通过while来遍历当前目录下的文件
          while( (file=readdir(fd)) != NULL)
          {
            if(file->d_name[0] != '.') //不显示.隐藏文件
            {
              char *q = file->d_name;//获取文件名
              int num = strlen(q);//获取文件名的长度
              int a = strcmp(q+num-4,".txt");//比较后4个字母
        
              if(a == 0)
              {
                char *p = getcwd(buf, 255);//获取当前文件夹的路径，返回值*p和buf存入的值是相同的
                strcat(p,"/");
                char *t =strcat(p,q); //将文件名放到路径后面
                printf("%s\n",t);
        
              }  
            }
          }
          closedir(fd);
          return 0;
        }

        ```
        
        ![getcmd-txt](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/getcmd-txt.png)

### 项目

!!! tip "控制MP3文件"

    === "只在主函数中完成"

        ```c

        #include <stdio.h>
        #include <unistd.h>
        #include <sys/types.h>
        #include <dirent.h>
        #include <string.h>
        
        int main(int argc, char *argv[])
        {
            char path[255] = {0};   //实现ls的功能
        
            if(argc < 2)
            {
                strcpy(path,".");
            }
            else if(argc == 2)
            {
                strcpy(path,argv[1]);
            }
            else
            {
                printf("参数有误\n");
                return -1;
            }
        
            DIR *fd = opendir(path); // opendir的返回值是DIR *类型的
            if(fd == NULL)
            {
                perror("打开失败\n");
                return -1;
            }
        
            struct dirent *file = NULL;// readdir的返回值是struct dirent *类型的
          
            int count = 0;
            char buf[255] = {0};
            char song[100][255] = {0};
            while( (file=readdir(fd)) != NULL)
            {
                if(file->d_name[0] != '.') //不显示.隐藏文件
                {
                    char *q = file->d_name;//获取文件名
                    int num = strlen(q);//获取文件名的长度
                    int a = strcmp(q+num-4,".mp3");//比较后4个字母
        
                    if(a == 0)
                    {
                        strcpy(song[count++],q);//一个小的知识点就是不能直接将字符串赋值给另一个字符串，详见下方note
                        char *p = getcwd(buf, 255);//获取当前文件夹的路径，返回值*p和buf存入的值是相同的
                        strcat(p,"/");
                        char *t =strcat(p,q); //将文件名放到路径后面
                        printf("%s\n",t);
                    }  
                }
            }
         
            closedir(fd);
        
            char ch = 0;//定义按键变量
            int cur = 0;//定义当前歌单在数组中的数字
            printf("%s\n",song[cur]);//先打印当前歌单
            while(1)
            {
                printf("w:上一首,s:下一首,q:退出\n");
                scanf("%c",&ch);//键盘收入
                getchar();//吸收回车键
                if(ch == 'w')//上一首
                {
                    cur--;//歌单移动
                    if(cur == -1)//判断是不是到头部
                    {
                        cur = count-1;//到尾部
                    }
                    printf("%s\n",song[cur]);
                }
                else if(ch == 's')//下一首
                {
                    cur++;//歌单移动
                    if(cur == count)//判断是不是到尾部
                    {
                        cur = 0;//到头部
                    }
                    printf("%s\n",song[cur]);
                }
                else if (ch == 'q')//退出
                {
                    return 0;
                }
            }
          return 0;
        }
        ```
    === "使用子函数实现"

        1. 最难的是将字符串数组传回主函数(下面写法不能将数组的大小传回，需已知数组大小)

        ```c

        #include <stdio.h>
        #include <unistd.h>
        #include <sys/types.h>
        #include <dirent.h>
        #include <string.h>
        
        DIR *openfile(int a,char *p);
        char *readfile(DIR *fp);
        int Keywords(char *z,int count);
        
        int main(int argc,char *argv[])
        {
          DIR *fp = openfile(argc,argv[1]); //打开目录
         
          if(fp == NULL ) //如果失败，程序退出
          {
            return -1;
          }
        
          char *z = readfile(fp);//读取目录,并返回歌单
          
          // for(int a = 0;a < 3;a++)
          // {
          //    printf("%s\n",z+(a*255));//测试
          // } 
        
          closedir(fp);
        
          int b = Keywords(z,3) ;//按键控制
          
          if(b == 1)
          {
            return 0;
          }
          
          return 0;
          
        }
        
        DIR *openfile(int a , char *p)
        {
          char path[255] = {0};
          if(a < 2)
          {
            strcpy(path, ".");
          }
          else if(a == 2)
          {
            strcpy(path,p);
          }
          else
          {
            printf("参数有误\n");
            return NULL;
          }
        
          DIR *fd = opendir(path);
          
          if(fd == NULL)
          {
            perror("opendir");
            return NULL;
          }
          printf("opendir打开成功\n");
          return fd;
        }
        
        char *readfile(DIR *fp)
        {
          struct dirent *file = NULL;// 承接readdir的返回值
          char buf[255] = {0}; //将获取到的文件路径存储到buf中 
          char house[600] = {0};//使用sprintf 存取文件路径+'/'+文件名,注意数组大小必须>=两个拼接的数组大小之和
          static char song[100][255] = {0};//将获取得到的.txt文件保存到二维数组指针里面
          int i = 0;
          while( (file=readdir(fp)) != NULL ) //将reddir读取到的文件名赋值给file
          {
            if(file->d_name[0] != '.' && file->d_type == DT_REG)//不显示.隐藏文件,且文件类型是普通文件
            {
              
              char *q = file->d_name;//获取文件名
        
              int num = strlen(q);//获取文件名的长度
        
              if(!strcmp(q+num-4,".mp3"))//比较后4个字母
              {
        
                strcpy(*(song+i),q);//将.mp3文件保存到数组里面
        
                //char *p = getcwd(buf, 255);//获取当前文件夹的路径，返回值*p和buf存入的值是相同的
                
                //strcat(p,"/");//在路径后面加个`/`使加上文件名后看着连贯
                
                //char *t =strcat(p,q); //将文件名放到路径后面
        
                getcwd(buf,255);
                
                sprintf(house,"%s/%s",buf,q);//使用sprintf进行拼接

                printf("%s\n",house);
        
                i++;
        
              }  
            }
          }
          return *song;
        }
        
        int Keywords(char *z,int count)
        {
            char ch = 0;//定义按键变量
            int cur = 0;//定义当前歌单在数组中的数字
            printf("当前的歌是%s\n",z+(cur*255));
            while(1)
            {
              printf("w: 上一首\ts: 下一首\tq: 退出\n");
              scanf("%c",&ch);//键盘收入
              getchar();//吸收回车
              if(ch == 'w')//上一首
              {
                cur--;//歌单移动
                if(cur == -1)//判断是不是到头部
                {
                  cur = count-1;//到尾部
                }
                printf("%s\n",z+(cur*255));
              }
              else if(ch == 's')//下一首
              {
                cur++;//歌单移动
                if(cur == count)//判断是不是到尾部
                {
                  cur = 0;//到头部
                }
                printf("%s\n",z+(cur*255));
              }
              else if (ch == 'q')
              {
                return 1;//返回主函数
              }  
            }    
        }
        ```

    ![TMP3-1](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/TMP3-1.png)

??? note "字符串数组知识回顾"

    在C语言中，字符串被表示为字符数组。而字符数组是一种特殊的数组类型，它需要特殊的处理方式。

    在C语言中，字符串被表示为以空字符(`'\0'`)结尾的字符数组。这个空字符表示字符串的结束。
    
    当我们使用赋值操作符(`=`)将一个字符串直接赋值给另一个字符串时，实际上是将源字符串的内存地址赋给了目标字符串。这意味着目标字符串变量将指向与源字符串相同的内存地址，而不是复制源字符串的内容。
    
    例如：
    ```c
    char source[] = "Hello, World!";
    char destination[] = source;
    ```
    
    在上面的示例中，`destination`并没有拷贝`source`的内容，而是共享了同一个内存地址。这意味着如果修改了`source`数组的内容，`destination`也会受到影响。
    
    如果我们想要复制一个字符串的内容，我们可以使用标准库函数`strcpy`或者更安全的`strncpy`函数来实现：
    
    ```c
    #include <string.h>
    
    char source[] = "Hello, World!";
    char destination[20];
    
    strcpy(destination, source);
    ```
    
    在上面的示例中，`strcpy`函数将源字符串的内容复制到目标字符串中，确保两个字符串是独立的，互不干扰。
    
    总结起来，C语言中的字符串（字符数组）需要特殊处理，不能直接使用赋值操作符进行复制，而是需要使用字符串处理函数来完成字符串的复制操作。

## 文件属性

~~未待完续~~
