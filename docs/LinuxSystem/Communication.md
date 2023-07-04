# IPC通信

## IPC介绍

在Linux系统中，进程间通信（IPC，Inter-Process Communication）是指不同进程之间进行数据交换和共享信息的机制。
进程间通信对于实现协作和协调多个进程之间的工作至关重要。

**为什么进程间需要通信的一些常见原因:**

1. 数据共享: 不同进程可能需要共享数据，以便彼此之间进行信息传递、协作和同步操作。
2. 任务分解: 一个复杂的任务可能需要分解为多个进程来并行执行，进程间通信可以在不同的进程之间传递任务和结果数据。
3. 资源共享: 不同进程可能需要共享系统资源，如文件、网络连接、设备或内存等。
4. 进程控制: 一个进程可能需要控制其他进程的行为，例如启动、停止、暂停或发送信号给其他进程。

**常见的IPC通信方式包括:**

> 不同的IPC通信方式适用于不同的场景和需求,选择适合的方式取决于具体的应用需求和限制条件

1. [信号(signal)](#signal): 信号是Linux系统中用于通知进程发生某个事件的机制，进程可以通过捕捉和处理信号来与其他进程进行通信。
2. [管道(Pipe)](#Pipe): 管道是一种半双工的通信方式，它通过创建一个内核缓冲区，使得一个进程的输出直接变为另一个进程的输入。通常用于父子进程之间或者具有亲缘关系的进程之间的通信。
3. [有名管道(Named Pipe)](#Named): 命名管道允许无亲缘关系的进程之间进行通信，它是一种先进先出（FIFO）的特殊文件。进程可以通过打开这个文件进行读写操作。
4. [共享内存(Shared Memory)](#Shared): 共享内存允许多个进程共享同一块内存区域，它是一种高效的IPC方式，因为数据无需复制就可以在进程之间传递。但需要注意的是，使用共享内存时需要借助其他机制如信号量或互斥锁来确保数据的同步和互斥访问。
5. [信号量集(Semaphore)](#Semaphore): 信号量是一种计数器，用于多个进程之间的同步和互斥访问共享资源。它可以用来控制对共享内存的访问以及进程之间的顺序执行。
6. [消息队列(Message Queue)](#Message): 消息队列是一种存储在内核中的消息链表，进程可以通过往队列中写入消息和从队列中读取消息来进行通信。消息队列可以实现按照特定的优先级来处理消息。
7. 套接字(Socket): 套接字是一种用于在网络中进行进程间通信的通信机制，它可以用于不同主机上的进程相互通信，实现分布式应用程序之间的交互。

### 系统命令

使用命令查看系统中所有的IPC通信:

命令:`ipcs`

![ipcs](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/ipcs.png)

常用的`ipcs`命令选项包括：

* `-a`：显示系统中所有的IPC对象。
* `-m`：仅显示共享内存对象的信息。
* `-q`：仅显示消息队列对象的信息。
* `-s`：仅显示信号量对象的信息。
* `-t`：以可读的格式显示时间戳。
* `-u`：显示当前用户创建的IPC对象。

删除:

* `ipcrm -q id` 删除消息队列
* `ipcrm -m id` 删除共享内存
* `ipcrm -s id` 删除信号量集

### IPC键值

在进程间通信（IPC）中，键值（key）是一个用于标识和访问IPC对象的唯一值。键值充当了IPC对象的唯一索引，使得不同的进程可以通过键值来找到和访问相同的IPC对象。

在不同的IPC机制中，键值的定义和生成方法可能会略有差异。下面是一些常见的IPC机制以及对应的键值生成方式：

1. 信号（Signal）：
    * 信号没有显式的键值，而是使用信号编号来识别和处理。

2. 共享内存（Shared Memory）：
    * 使用[ftok](#ftok)函数将一个文件路径和项目标识符转换为键值。例如：`key_t key = ftok("/path/to/file", 'P');`
    * 文件路径通常是一个存在的文件，用于在不同的进程之间共享键值。

3. 消息队列（Message Queue）：
    * 使用一个整数作为键值，可以手动指定或根据应用程序的需求进行生成。

4. 信号量（Semaphore）：
    * 使用一个整数作为键值，可以手动指定或根据应用程序的需求进行生成。

5. 套接字（Socket）：
    * 使用网络地址（IP地址和端口号）作为连接套接字的键值。

注意，键值的选择要遵循一些准则:

* 键值在所有进程中必须是唯一的。
* 不同进程之间要使用相同的键值来访问相同的IPC对象。
* 键值应与应用程序的需求和逻辑相匹配，以确保正确的对象关联。

在使用IPC机制时，进程需要使用相同的键值才能访问和操作相同的IPC对象。
因此，确保在不同进程之间共享正确的键值是非常重要的。


## 信号 {#signal}

### 理论

**信号基本概念**

* 继承unix古老通信机制
* 软中断的模拟机制(接收一个信号会执行固定的操作)
* linux下62个信号，每一个信号都有自己独特的含义
    * 前31个信号继承unix的非实时信号,非实时信号不拥有排队机制
    * 后31个是linux自己扩展的实时信号,实时信号拥有排队机制
* 大部分信号都使进程凋亡

**使用系统命令查看**

* man 7 signal
* kill -l

![kill-l](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/kill-l.png)

**常见的信号**

* 信号2：SIGINT： ++ctrl+c++ 结束进程 
* 信号3：SIGQUIT：++ctrl++ + `\` 结束进程
* 信号9：SIGKILL：无条件终止进程的信号。使用SIGKILL信号将无法捕获或忽略，进程会立即被终止。(不能被改造)
* 信号10、12:用户预留的信号
* 信号14：SIGALRM：闹钟信号，用于定时
* 信号17：SIGCHLD：只要子进程状态发生变化，父进程就能够接收到17号信号
* 信号19：SIGSTOP：暂停信号
* 信号18:SIGCONT 是继续进程
* 信号20：SIGTSTP：暂停运行

**信号的产生**

* 用户自己发送: ++ctrl+c++ 或者 `kill -2 pid`
* 内核: 进程执行出现错误的时候
* 通过程序发送: `kill(pid,sig)`

### 信号函数

1. 用于向指定进程发送信号的函数 `kill`
2. 用于向当前进程发送指定信号函数`raise`
3. 用于设置一个定时器，在指定的时间后发送`SIGALRM`信号给当前进程的函数 `alarm`
4. 用于使当前进程暂时挂起，直到接收到一个信号的函数`pause`
5. 用于注册信号处理函数，用于处理特定信号的到来的函数 `signal`

!!! example "函数原型"

    === "kill"

        ```c
        
        所需头文件:
        #include <sys/types.h>
        #include <signal.h>
        函数原型:
        int kill(pid_t pid, int sig);
        形参:
        pid参数表示目标进程的进程ID
        sig参数表示要发送的信号

        * 如果 pid 大于 0，则向进程ID为pid的进程发送信号sig。
        * 如果 pid 等于 0，则信号将被发送到与调用进程属于同一进程组的所有进程。
        * 如果 pid 等于-1，则信号将被发送到除调用进程之外的所有具有权限的进程。
        * 如果 pid 小于-1，则信号将被发送到进程组ID等于pid绝对值的所有进程。

        sig参数可以是预定义的信号编号，也可以通过自定义信号处理器来捕获和处理。
        
        返回值:
        该函数的返回值为0表示成功，-1表示失败并设置errno变量来表示具体的错误信息。
        ```
        === "Test1"

            ```c 

            #include <sys/types.h>
            #include <signal.h>
            #include <stdio.h>
            #include <unistd.h>
            
            int main()
            {
              int count = 0;
              while(1)
              {
                printf("count = %d\n",count);
                sleep(1);
                count++;
                if(count == 5)
                {
                  kill(getpid(),2);
                }
              }
            }
            ```
            ![signal-kill](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/signal-kill.png)
        === "Test2"

            ```c

            #include <stdio.h>
            #include <sys/types.h>
            #include <signal.h>
            #include <unistd.h>
            #include <sys/types.h>
            int main()
            {
                pid_t pid = fork();//创建子进程
                if(pid == 0) 
                {
                    while(1)
                    {
                        printf("hello Sakura-Ji\n");
                        sleep(1);
                    }
                }
                else if(pid > 0)
                {
                    sleep(5);
                    kill(pid,9);//在父进程中使用信号9终止子进程
                }
                return 0;
            }
            ```
            ![signal-kill2](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/signal-kill2.png)
        
        === "Test3"

            ```c
            #include <stdio.h>
            #include <sys/types.h>
            #include <signal.h>
            #include <unistd.h>
            #include <sys/types.h>
            int main()
            {
                pid_t pid = fork();
                if(pid == 0) 
                {
                    while(1)
                    {
                        printf("hello Sakura-Ji\n");
                        sleep(1);
                    }
                }
                else if(pid > 0)
                {
                    sleep(3);
                    kill(pid,19);//暂停
                    sleep(5);
                    kill(pid,18);//继续
                    sleep(5);
                    kill(pid,9);//结束
                }
                return 0;
            }
                        
            ```
            ![signal-kill3](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/signal-kill3.png)


    === "raise"

        ```c
	    所属头文件:
		#include <sys/types.h>
        #include <signal.h>
	    原型:
		int raise(int sig);
	    参数:
		Sig信号类型
	    返回值:
		成功返回0 失败返回-1
        ```
    
    === "alarm"

        ```c

        所属头文件:
        #include <unistd.h>
        函数原型:
        unsigned int alarm(unsigned int seconds);
        形参:
        seconds参数表示定时器的时间，单位为秒。
        返回值:
        alarm函数的返回值是上一次设置的剩余时间，如果没有之前的定时器，则返回0。
        函数说明:
        alarm函数会设置一个定时器，在指定的时间（seconds秒）后，向当前进程发送SIGALRM信号。
        如果之前已经设置了定时器，则调用alarm函数会取消原有的定时器，并设置新的定时器。
        当定时器时间到达时，操作系统会向该进程发送SIGALRM信号，进程可以通过注册信号处理器来处理该信号。

        ```

    === "pause"

        ```c
        所属头文件:
        #include <unistd.h>
        函数原型:
        int pause(void);
        函数说明:
        pause函数不带任何参数，它会一直等待直到接收到一个信号。
        在收到信号之前，进程会一直处于挂起状态，不会执行任何代码。
        当进程接收到一个信号时，pause函数会返回-1，并将errno设置为EINTR。
        EINTR表示该系统调用被一个信号中断。

        ```
    === "signal"

        ```c
        
        所属头文件:
        #include <signal.h> 
        原型:
        typedef void (*sighandler_t)(int);
        sighandler_t signal(int signum, sighandler_t handler);
        参数:
        	signum：要操作的信号
        	handler:对应信号处理方式:
        默认处理：SIG_DFL
        忽略处理：SIG_IGN  -- 9号和19号不能被忽略的信号
        捕捉信号：执行信号处理函数  - 9号和19号不能被改造
        信号处理函数：形参int类型的信号，返回值void

        ```

        === "Test1"

            ```c
            #include <stdio.h>
            #include <sys/types.h>
            #include <signal.h>
            #include <unistd.h>
            #include <sys/types.h>
            int main()
            {
                signal(2,SIG_IGN);//使用ctrl+c不起作用了
                while(1)
                {
                    printf("hahaha\n");
                    sleep(1);
                }
                return 0;
            }
            ```
            ![signal-1](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/signal-1.png)
        
        === "Test2"

            ```c
            #include <stdio.h>
            #include <sys/types.h>
            #include <signal.h>
            #include <unistd.h>
            void Fun(int a);
            int main()
            {
                signal(2,Fun);//将2号信号使用信号处理函数进行处理
                while(1)
                {
                    printf("respect Sakura-Ji\n");
                    sleep(2);
                }
                return 0;
            }
            void Fun(int a)
            {
                printf("ctrl + c 被捕获\n");
            }
                        
            ```
            ![](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/signal-2.png)
        
        === "Test3"

            ```c
            #include <stdio.h>
            #include <sys/types.h>
            #include <signal.h>
            #include <unistd.h>
            void Fun(int a);
            int main()
            {
                signal(2,Fun);//将2号信号使用信号处理函数进行处理
                printf("在这里之后的10s内，2号信号都将被捕获\n");
                
                sleep(10);//如果在这10秒钟内按下Ctrl+C，SIGINT信号会被捕获，sleep函数会立即结束
                
                //我查阅了一些资料，有些资料显示，signal不应该被使用，因为按道理在sleep(10)中
                //按下ctrl+c signal应该都将2号信号捕获，使用信号处理方式进行处理 而不是sleep函数
                //被结束了，2号信号直接去默认处理，所以应该使用sigaction
                
                while(1)
                {
                    signal(2,SIG_DFL);//重新将2号信号做默认处理，则将使用最新的处理方式
                    printf("现在已经不能被捕获，而是处于默认处理方式\n");
                    sleep(1);
                }
                return 0;
            }
            void Fun(int a)
            {
                printf("ctrl + c 被捕获\n");
            }

            ```
            ![signal-3](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/signal-3.png)


        
## 无名管道 {#Pipe}

### 理论

管道（pipe）是一种进程间通信（IPC）机制，用于在两个相关进程之间传递数据。它提供了一个单向的、字节流的通道，其中一个进程可以将数据写入管道，另一个进程则可以从管道读取数据。

使用无名管道可以方便地实现父子进程之间的通信，或者通过创建多个管道实现多个进程之间的通信。

**通信方式**

单工通信: 广播

双工通信: 电话

半双工通信: 对讲机

**注意:** 

1. 无名管道只能用于父子进程之间或兄弟进程之间的通信，它没有文件系统中的名字，只是存在于内存中。
2. 无名管道 没有真实的介质文件存在，无名管道利用缓冲区进行数据传输
3. 在父子进程中,我们应该先创建管道,再创建子进程,否则子进程将不会继承文件描述符,原因如下
    1. 因为子进程是从fork()函数以下进行，如果我先创建子进程，再创建管道，那么子进程和父进程各自创建一个管道，从而不是一个管道
    2. 先创建管道，再创建子进程，那么父子进程使用的是同一个管道
4. 通信: 父进程关闭读或者写,子进程反之。
5. 因为管道的参数是使用`int`型的数组，所以使用`write`或者`read`读写管道中的文件
    * 当`read`没有读取到参数的时候，也就是没有写入时，是阻塞等待(看pipe示例1)
    * 当管道如果写满了，写会发生阻塞(64k = 1024 * 64 = 65536 byte)


### 无名管道函数

1. 创建无名管道的函数`pipe`

!!! example "函数原型"
    === "pipe"
        
        1. pipe函数创建一个管道，并将管道的读端和写端文件描述符分别存储到pipefd数组中。pipefd[0]表示管道的读端，pipefd[1]表示管道的写端。
        ```c
        
        所属头文件:
        #include <unistd.h>
        函数原型:
        int pipe(int pipefd[2]);
        形参:
        filedes：接收打开管道文件的文件描述符
        filedes[0]:存放管道文件的读端
        filedes[1]:存放管道文件的写端   
        返回值:
        成功返回0，失败返回-1

        ```
        === "Test1"

            ```c

            #include<stdio.h>
            #include <unistd.h>
            #include <string.h>
            
            int main()
            {
              int fd[2] = {0};
              char w_buf[100] = {0};
              char r_buf[100] = {0};
              if(pipe(fd) == -1)//在这运行了 pipe函数 并使用返回值判断是否成啦 并且将fd传入了pipe中
              {
                perror("pipe");
                return -1;
              }
              //fd[0] 读端的文件描述符 -- int -- read 
              //fd[1] 写端的文件描述符 -- int -- write
              pid_t pid = fork(); //一定要在fork之前创建管道
              if(pid < 0)
              {
                perror("fork");
                return -1;
              }
              else if(pid == 0)//子进程 写
              {
                close(fd[0]);//关闭读端
                while(1)
                //使用循环一直写入,可能会有bug，因为父进程只读了一次，但这是一个演示(所以在读取后加了一个kill)
                {
                  printf("请输入要写入的管道的内容\n");
                  scanf("%s",w_buf);
                  write(fd[1], w_buf, strlen(w_buf));//直接写到了管道里面
                  memset(w_buf,0,100);//清除的是数组，防止出现意想不到的错误
                }
              }
              else if(pid > 0)//父进程 读
              {
                close(fd[1]);//关闭写段
                sleep(5);//延迟5s再去读文件,也就是5s后将会执行下面的程序，父进程将结束,子进程将会变成孤儿进程
                read(fd[0],r_buf,100);//从fd[0]里面读，放到r_buf里面，不知道多大，所以直接放最大
                printf("read:%s\n",r_buf);
                memset(r_buf, 0, 100);
                kill(pid,9);
              }
            
            }
            ```
            ![pipe1](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/pipe1.png)
        === "Test2"

            ```c
            
            #include<stdio.h>
            #include <unistd.h>
            #include <string.h>
            #include <stdlib.h>
            
            int main()
            {
              int fd[2] = {0};
              char w_buf[100] = {0};
              char r_buf[100] = {0};
              if(pipe(fd) == -1)//在这运行了 pipe函数 并使用返回值判断是否成啦 并且将fd传入了pipe中
              {
                perror("pipe");
                return -1;
              }
              //fd[0] 读端的文件描述符 -- int -- read 
              //fd[1] 写端的文件描述符 -- int -- write
              pid_t pid = fork(); //一定要在fork之前创建管道
              if(pid < 0)
              {
                perror("fork");
                return -1;
              }
              else if(pid == 0)//子进程 写
              {
                close(fd[0]);//关闭读端
                while(1)//使用循环一直写入
                {
                  printf("请输入要写入的管道的内容\n");
                  scanf("%s",w_buf);
                  write(fd[1], w_buf, strlen(w_buf));//直接写到了管道里面
                  if(!strcmp(w_buf, "quit"))//如果是quit退出子进程，相等返回0，!0 == 1
                  {
                    exit(0);
                  }
                  memset(w_buf,0,100);//清除的是数组，防止出现意想不到的错误
                }
              }
              else if(pid > 0)//父进程 读
              {
                close(fd[1]);//关闭写段
                while(1)
                {
                  read(fd[0],r_buf,100);//从fd[0]里面读，放到r_buf里面，不知道多大，所以直接放最大
                  if(!strcmp(r_buf, "quit"))如果是quit，退出父进程
                  {
                    return 0;
                  }
                  printf("read:%s\n",r_buf);
                  memset(r_buf, 0, 100);
                }
              }
            }
            ```
            ![pipe2](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/pipe2.png)

## 有名管道 {#Named}

有名管道（Named Pipe），也被称为FIFO（First-In-First-Out），可以通过文件系统路径进行访问，允许 ==不相关的进程之间进行通信== 。

### 理论

**使用系统命令**

> mkfifo + 文件名.fifo

![mkfifo](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/mkfifo.png)

**注意事项:**

* FIFO遵循先进先出规则
* 对管道读从开始处返回数据
* 对管道写则把数据添加到末尾
* 不支持如lseek()等文件定位操作
* 打开进行读写: 必须读端和写端同时打开，open才能通过(即管道必须建立)
* 一般进行读操作管道内没有内容，会阻塞等待
* 如果读操作时，写端没有打开，读取失败，返回错误
* 如果写操作时读端没有打开，写操作会产生一个SIGPIPE信号

**FIFO vs 普通文件:**

* 读取FIFO文件的进程只能以RDONLY方式打开FIFO文件
* 写FIFO文件的进程只能以WRONLY的方式打开FIFO文件
* FIFO文件里面的内容被读取后就消失了，但普通文件的内容还会存在

### 函数

1. 检测用户对文件的权限(读，写，可执行)和检测文件是否存在的函数`access`
2. 创建有名管道的函数`mkfifo`
3. 删除文件的函数`unlink`

!!! example "函数原型"

    === "access"

        ```c

        所属头文件:
        #include <unistd.h>
        函数原型:
        int access(const char *pathname,int mode);
        形参:
        pathname: 是希望检验的文件名（包含路径）
        mode: 是欲检查的访问权限，如下所示
        F_OK 判断文件是否存在
        X_OK 判断对文件是可执行权限
        W_OK 判断对文件是否有写权限
        R_OK 判断对文件是否有读权限
        返回值: 
        成功0，失败-1

        注：后三种可以使用或“|”的方式，一起使用，如W_OK|R_OK，多个连用任意一个权限没有，就返回-1

        ```
        ```c title="举例"

        #include <stdio.h>
        #include <unistd.h>
        #include <sys/stat.h>
        #include<sys/types.h>
        
        int main() 
        {
          
          const char *path = "example.fifo";
          
          if(mkfifo(path,0644) == -1)//创建管道文件
          {
            perror("mkfifo");
            return -1;
          }
          // 检查文件是否存在
          if (access(path, F_OK) == 0)
          {
            printf("File exists\n");
            // 检查读权限
            if (access(path, R_OK) == 0) 
            {
              printf("Read permission granted\n");
            }
            else
            {
              printf("No read permission\n");
            }
        
            // 检查写权限
            if (access(path, W_OK) == 0)
            {
              printf("Write permission granted\n");
            }   
            else
            {
              printf("No write permission\n");
            }
        
            // 检查执行权限
            if (access(path, X_OK) == 0)
            {
              printf("Execute permission granted\n");
            }
            else
            {
              printf("No execute permission\n");
            }
        
          } 
          else
          {
            printf("File does not exist\n");
          }
        
          return 0;
        }
        ```
        ![access](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/access.png)

    === "mkfifo"

        ```c
	    
        所属头文件:
		#include <sys/stat.h>
        #include<sys/types.h>
    	原型:
		int mkfifo(const char * pathname,mode_t mode)
	    参数:
		pathname: 要创建的FIFO文件的名字（带路径）
		mode: 创建的FIFO文件的权限
	    返回值:
		成功返回0，失败返回-1。

        ```
        === "写入端"

            ```c
            #include <stdio.h>
            #include <unistd.h>
            #include <sys/stat.h>
            #include <sys/types.h>
            #include <fcntl.h>
            #include <string.h>
            
            int main() 
            {
              
              const char *path = "example.fifo";
              // 检查文件是否存在
              if (access(path, F_OK) == 0)
              {
                printf("File exists\n");//存在
              } 
              else
              {
                printf("File does not exist\n");//不存在
                if(mkfifo(path,0644) == -1)//创建文件
                {
                  perror("mkfifo");
                  return -1;
                }
              }
              //打开 -- 写
              int fd = open(path,O_WRONLY);
              char w_buf[100] = {0};
              if(fd == -1)
              {
                perror("open");
                return -1;
              }
            
              while(1)
              {
                printf("请输入要写入的内容:\n");
                scanf("%s",w_buf);
                write(fd,w_buf,strlen(w_buf));
                if(!strcmp(w_buf, "quit"))//防止陷入当一端关闭，管道摧毁，另一端出现bug
                {
                  return 0;
                }
                memset(w_buf,0,100);
              }
              
            
              return 0;
            }

            ```
        === "读取端"

            ```c
            #include <stdio.h>
            #include <unistd.h>
            #include <sys/stat.h>
            #include <sys/types.h>
            #include <fcntl.h>
            #include <string.h>
            int main() 
            {
              
              const char *path = "example.fifo";
              // 检查文件是否存在
              if (access(path, F_OK) == 0)
              {
                printf("File exists\n");//存在
              } 
              else
              {
                printf("File does not exist\n");//不存在
                if(mkfifo(path,0644) == -1)//创建文件
                {
                  perror("mkfifo");
                  return -1;
                }
              }
              //打开 -- 读
              char r_buf[100] = {0};
              int fd = open(path,O_RDONLY);
              if(fd == -1)
              {
                perror("open");
                return -1;
              }
              while(1)
              {
                read(fd,r_buf,100);
                if(!strcmp(r_buf, "quit"))
                {
                  return 0;
                }
                printf("read:%s\n",r_buf);
                memset(r_buf,0,100);
              }
            
              return 0;
            }

            ```
        ![mkfifo2](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/mkfifo2.png)

    === "unlink"

        ```c

	    所属头文件:
		#include <unistd.h>
	    原型:
		int unlink(const char * pathname)
	    参数:
		pathname:要删除的FIFO文件的名字（带路径）
	    返回值:
		成功返回0，失败返回-1。

        ```


## 共享内存 {#Shared}

### 理论

在IPC通信中，共享内存是一种高效的进程间通信机制。不同进程可以映射同一块共享内存区域到它们各自的地址空间中，从而实现数据的共享和直接访问。

使用共享内存进行进程间通信，通常会经过以下步骤：

1. 创建共享内存：首先，需要调用IPC函数（如`shmget`）创建一个共享内存区域，并指定所需的大小和权限。传递给`shmget`函数的参数包括键值、内存大小和标志等。

2. 连接(映射)共享内存：每个进程都需要调用IPC函数（如`shmat`）来连接到共享内存区域。`shmat`函数返回指向共享内存的指针，进程可以通过该指针进行直接的读写操作。

3. 进行数据交互：一旦进程连接到了共享内存，它们可以直接通过读写共享内存的方式进行数据交换。注意，需要确保进程之间对共享内存的访问同步和互斥，以避免数据的竞争和一致性问题。

4. 分离(解除)共享内存：当进程不再需要共享内存时，需要调用IPC函数（如`shmdt`）来分离共享内存区域。这样，进程就不再拥有对共享内存的访问权限。

5. 删除共享内存（可选）：如果不再需要使用共享内存，可以调用IPC函数（如`shmctl`）删除共享内存区域。这会释放相关的系统资源，并使得其他进程无法连接到该共享内存。

需要注意的是，共享内存作为一种进程间通信机制，存在一些潜在的问题，比如数据一致性、并发访问等。因此，在使用共享内存时要注意合理设计数据结构、使用同步机制（如信号量、互斥锁）来保证数据的正确性和安全性。

共享内存通信虽然高效，但也要谨慎使用。在设计中，除了共享内存，还可以结合其他IPC通信方式，如信号量、管道等，综合考虑选择适合的通信机制以满足具体需求。

### 共享内存函数 {#ftok}

1. 键值是一个整数，通常使用`ftok`函数将一个唯一的文件和一个项目标识符（project identifier）转换为键值
2. 用于创建或打开共享内存段的函数 `shmget`

!!! example "函数原型"

    === "ftok"
        
        注意:不同进程要访问同一个共享内存区域，需要使用相同的键值。
        ```c

        所需头文件:
        #include <sys/types.h>
        #include <sys/ipc.h>
        函数原型:key_t ftok(const char *pathname,int proj_id);
        参数:
        pathname:路径，任意的pathname就是你指定的文件名(该文件必须是存在而且可以访问的)
        proj_id:是子序号，虽然为int，但是只有8个比特被使用(0-255)
        返回值:当成功执行的时候，一个key_t值将会被返回，否则 -1 被返回
        
        ```

        ```c title="举例"

        #include <sys/types.h>
        #include <sys/ipc.h>
        #include <stdio.h>
        
        int main()
        {
          key_t a = ftok("/home", 99);//生成键值
          printf("1.c中的a=%d\n",a);//1.c与2.c不同处只有printf这里
          return 0;
        }

        ```
        ![shared-memory-key](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/shared-memory-key.png)

    === "shmget"

        ```c

        所需头文件:
        #include <sys/ipc.h>
        #include <sys/shm.h>
        函数原型:
        int shmget(key_t key, size_t size, int shmflg);
        形参:
        * key: 共享内存的键值，通常使用`ftok`函数生成。不同进程要访问同一块共享内存，需要使用相同的键值。
        * size: 共享内存段的大小，以字节为单位。
        * shmflg: 标志位，用于指定创建共享内存的权限和特性。
            示例: IPC_CREAT|0777 如果共享内存已经存在，就只打开，如果不存在，创建并打开
        返回值：成功返回一个int类型的标识符
                失败-1

        ```

    === "shmat"
        
        ```c
        所需头文件:
        #include <sys/types.h>
        #include <sys/shm.h>
        函数原型:
        void *shmat(int shmid, const void *shmaddr, int shmflg);
        形参:
        shmid -- 开辟好的共享内存的标识符。
        shmaddr -- NULL将共享内存映射到指定位置（若为(void *)0则表示把该段共享内存映射到调用进程的地址空间-由计算机自己分配）
        shmflg: 默认 0：共享内存可读写
        返回值:
        void *  万能指针，表示映射到当前进程的首地址（接下来随共享内存的都或者写，直接对该返回值操作即可）
        
        ```

    === "shmdt"
        
        ```c
        所需头文件:

        函数原型:
        int shmdt(const void *shmaddr);
        形参:
        shmaddr:shmat的返回值
        返回值:成功返回0，失败返回-1；
        注意:解除映射并不是删除共享内存。

        ```

    === "shmctl"
        
        ```c
        所需头文件:

        函数原型:
        int shmctl(int shmid, int cmd, struct shmid_ds *buf);
        参数:
        shmid ：shmget的返回值
        cmd：选择的操作
        IPC_RMID：删除共享内存，此时第三个参数为NULL
  	    buf -- NULL；
        返回值:
        成功返回0，失败返回-1

        ```
    === "memcpy"

        ```c

        函数原型:
        void*memcpy(void *str1,const void *str2,size_t n) 
        从存储区 str2 复制 n 个字节到存储区 str1。

        ```

## 信号量集 {#Semaphore}

## 消息队列 {#Message}

