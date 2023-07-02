# 进程

## 理论

### 进程的定义

**定义:**

进程是一个运行着的程序，它包含了程序在运行时的各个资源，进程是操作系统进行调度的基本单位，也是
一个程序运行的基本单位。进程是一个程序一次执行的过程，是操作系统动态执行的基本单元。

**概念:**

1. 进程是一个实体,每个进程都有自己的虚拟地址空间
  
    * **代码区:** 文本区域存储处理器执行的代码
    * **数据区:** 存储变量和动态分配的内存
    * **堆栈区:** 存储活动进程动态申请的内存和局部变量及函数调用时的返回值

2. 进程是一个“执行中的程序”，它和程序有本质区别

    * 程序是静态的，它是一些保存在磁盘上的指令的有序集合（文件）
    * 进程是一个动态的概念，它是一个运行着的程序，包含了进程的动态创建、调度和消亡的过程，是 Linux 的基本调度单位

### 进程状态

进程是程序的执行过程，根据它的生命周期可以划分成 3 种状态。

* 执行态：该进程正在运行，即进程正在占用 CPU， 任何时候都只有一个进程。
* 就绪态：进程已经具备执行的一切条件，正在等待分配 CPU 的处理时间片。
* 等待态：进程正在等待某些事件，当前不能分配时间片，进程不能使用 CPU，若等待事件发生（等待的资源分配到）则可将其唤醒，变成就绪态。

``` mermaid
graph LR
  A[执行态] -->|CPU调度| B[就绪态];
  B -->|时间片用完了| A;
  B --> |等待某事件发生| C[等待态];
  C --> |事件发生| A;
```

==**注意:**== 等待态不能直接转换成执行态

### 进程描述

操作系统会为每个进程分配一个唯一的整型 ID,做为进程的标识号(pid)。

???+ note 

    进程标识是无法在用户层修改的（用户程序不能自己来修改自己的 pid,这是操作系统分配的）。
    
    进程除了自身的 ID 外,还有父进程ID(ppid)、0进程、init进程(1进程)、孤儿进程、僵尸进程,这些特殊进程。
    
    所有进程的祖先进程是同一个进程,它叫做 init 进程,ID 为 1，init 进程是内核启动后的运行的第一个进程。
    init 进程负责引导系统、启动守护（后台）进程并且运行必要的程序。它不是系统进程，但它以系统的超级用户特权运行

[特殊进程 :fontawesome-solid-paper-plane:](#teshu){ .md-button }

![shell-ps](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/shell-ps.png)

**ps 命令:** 类似任务管理器， ps 为我们提供了进程的一次性的查看，它所提供的查看结果并不动态连续的

**kill 命令:** 通常与 ps 命令一起使用，常用的形式： kill -9 进程 ID（表示向指定的进程 ID 发送 SIGKILL 的
信号。其中-9 表示强制终止，可以省略。它是信号代码，可以利用 kill –l 列出所有的信号。） 另外， pkill 进程名字(可以直接杀死指定进程名的进程)

**top 命令:** 和 ps 相比， top 是动态监视系统任务的工具， top 输出的结果是连续的，比如#top

**jobs 命令:** 观察后台进程。

![ps-ef](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/ps-ef.png)

![shell-top](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/shell-top.png)

### 进程的资源分配

* **代码区:** 加载的是可执行文件代码段， 可执行代码，在有操作系统支持时，程序员不需要关注这一位置。
代码区通常是只读的，只读的原因是防止程序意外地修改了它的指令。

* **数据段:** 
    * 已初始化数据区: 该区包含在程序中明确被初始化的全局变量，已经初始化的静态变量和常量数据。存储于该区的数据的生存周期为整个程序运行过程。
    * 未初始化数据区（ BSS 段）， 存入的是全局未初始化变量和未初始化静态变量还有初始值为 0 的变量。
    BSS 段的数据在程序开始之前的值都为 0，在程序退出时才释放。

* **栈区:** 由编译器自动分配释放，存放函数的参数值、返回值、局部变量等。在程序运行过程中实时加载和
释放，因此，局部变量的生存周期为申请到释放该段栈空间的过程。

* **堆区:** 用于动态内存分配。 堆区一般由程序员分配和释放，我们使用 malloc 申请的内存都属于堆区内存。

### 进程的特点

**动态性:** 进程的实质是程序的一次执行过程，进程是动态产生，动态消亡的

**并发性:** 任何进程都可以同其他进程一起并发执行

**独立性:** 进程是一个能独立运行的基本单位，同时也是系统分配资源和调度的独立单位;

**异步性:** 由于进程间的相互制约，使进程具有执行的间断性，即进程按各自独立的、不可预知的速度向前推进

### 进程的关系

父子关系 -- 该进程由谁产生，谁就是该进程的父进程，代码中往往是父进程管理子进程（父进程知道子进程的PID号）

### 特殊进程 {#teshu}

1. **父子进程:** 父进程帮助子进程收尸，回收资源，控制子进程，杀死子进程，暂停子进程，恢复子进程运行
2. **0号进程:** 系统启动的引导进程
3. **1号进程/祖先进程:** 操作系统启动起来的第一个程序
4. **孤儿进程:** 父进程结束，子进程还在运行 孤儿进程会被：/sbin/upstart --user 回收接管
5. **僵尸进程:** 子进程已经消亡，但是父进程为其收尸，没有做清理工作,放弃几乎所有资源，但是唯独占用pid号

## 实践

### 函数

1. 获取当前进程的PID函数: `getpid` 
2. 获取当前进程的父进程的PID函数: `getppid`
3. 创建进程的函数: `fork` `vfork`
4. 结束进程的方法:
    1. 信号:
        * 使用 ++ctrl+c++ 结束进程
        * 使用 kill -9 pid
    2. 在程序中用函数结束
        * 主函数 -- `return 0`
        * `exit(0)` -- 结束进程
        * `_exit(0)` --结束进程
5. 进程等待函数:
    * `wait` -- 阻塞等待任意子进程结束，为其收尸
    * `waitpid` --  等待指定子进程结束，为其收尸
6. `system`函数:接受一个命令字符串作为参数，并在操作系统中运行该命令
7. `exec`函数族:提供了一个在进程中启动另一个程序执行,会覆盖原有进程，一般和vfork连用,包含6个函数
    * int execl(const char *path, const char *arg, ...);
    * int execlp(const char *file, const char *arg, ...);
    * int execle(const char *path, const char *arg, ..., char * const envp[]);
    * int execv(const char *path, char *const argv[]);
    * int execvp(const char *file, char *const argv[]);
    * int execve(const char *path, char *const argv[], char *const envp[]);
8. 获取某一路径下的某种类型的文件函数:`glob`
    
!!! example "函数原型"

    === "getpid"
        
        ```c

        功能:获得进程id
        函数原型:pid _t getpid(void)
        所属头文件:
        #include <sys/types.h>
        #include <unistd.h>
        参数:无
        返回值:调用该函数的进程id

        ```
    === "getppid"

        ```c

        功能:获得进程id
        函数原型:pid_t getppid(void)
        所属头文件
        #include <sys/types.h>
        #include <unistd.h>
        参数:无
        返回:值调用该函数的进程的父进程id

        ```
    === "fork"

        ```c

        功能:创建新进程
        原型:pid_t fork(void)
        所属头文件
        #include <unistd.h>
        #include <sys/types.h>
        参数:无
        返回值:在父进程中返回子进程的PID，在子进程中返回0，失败返回-1
               0:子进程
               子进程PID(大于0的整数):父进程
               -1:出错

        特点:fork成功后，会创建一个子进程，子进程会复制父进程资源父子进程同时从fork函数
        以下开始并行运行。互不干扰。拥有独立的数据段、堆栈，但无法确定父子进程的运行顺序

        ```
    === "vfork"

        ```c

        功能:创建子进程，并且阻塞父进程
        原型:pid_t vfork(void)
        所属头文件
        #include <unistd.h>
        #include <sys/types.h>
        参数:无
        返回值:在父进程中返回子进程的PID，在子进程中返回0，失败返回-1
        特点:vfork成功后，会创建一个子进程，子进程共用(独占)父进程资源，
            子进程退出父进程才会得到执行。分享父进程的数据段、堆，一定是子进程先运行

        ```
    === "exit(0)"

        ```c

        函数原型:void exit(int status);
        所属头文件:
        #include <stdlib.h>
        形参:一般直接写0
        返回值:无
        结束的时候，会清理缓冲区

        ```
    === "_exit(0)"

        ```c
        
        函数原型:void _exit(int status)；
        所属头文件:
        #include <unistd.h>
        形参:一般直接写0
        返回值:无
        结束的时候，不会清理缓冲区

        ```
    === "wait"

        ```c

        所属头文件:
        #include <sys/types.h>
        #include <sys/wait.h>
        函数原型:pid_t wait(int *status);
        形参:NULL
        返回值:成功返回结束的子进程的pid号
        失败返回-1

        ```
    === "waitpid"

        ```c

        函数原型:pid_t waitpid(pid_t pid, int *status, int options);
        形参:
        pid:指定等待哪一个子进程	
        -1:等待任意子进程结束
        status:NULL
        options:
        0:同wait，阻塞等待子进程结束，返回值同wait
        WNOHANG:若由 pid 指定的子进程不立即可用，则 waitpid 不阻塞，此时返回值为 0
        返回值:
        options如果是0，即阻塞等待，成功返回子进程的pid，失败返回-1；
        options如果是WNOHANG，即不则测等待，
        成功返回子进程pid，没等到返回0，失败返回-1；
        
        wait(NULL) 等价的 waitpid(-1,NULL,0)；

        ```
    === "system"

        ```c
        
        所属头文件:
        #include <stdlib.h>
        int system(const char *command);
        形参:command -- 可执行程序
        
        执行操作:
        1.创建一个子进程来执行命令。
        2.在子进程中调用命令行解释器（shell），并将传入的命令作为参数传递给它。
        3.等待命令的执行完成。
        4.返回命令的退出状态码（返回值为命令的退出状态码）。
        
        system函数的返回值有以下几种情况:
        1.如果命令成功执行并正常退出，system函数返回命令的退出状态码。
        2.如果创建子进程失败或无法执行命令，system函数返回一个非零值。
        3.如果command为NULL，system函数会检查命令解释器是否可用。
        
        注意事项:
        在使用system函数时，要确保传递给它的命令字符串是可信任的，以防止命令注入安全漏洞。
        * system函数会阻塞当前进程，直到命令执行完成。
        * system函数的执行结果可能受到操作系统和命令行解释器的限制。
        * 可以通过检查返回值来判断命令是否成功执行。
        ```

        ```c title="举例"
        #include <stdio.h>
        #include <stdlib.h>
        
        int main()
        {
          printf("**Begin**\n");
          printf("\n");
          system("ls -a");//与exec函数族不同，调用后不会结束当前进程
          printf("\n");
          printf("**THE END**\n");
          return 0;
        }
        ```

        ![system](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/system.png)
        
    === "exec函数族"

        **exec函数族定义:** 

        是一组在操作系统中用于执行其他程序的函数。
        这些函数将当前进程替换为新的程序，新程序的代码、数据和堆栈会覆盖原来的进程。
        `exec`函数族通常与`fork`或`vfork`函数一起使用，用于在新的进程中执行不同的程序。

        **exec函数族使用场景:**

        在一个进程中，想执行另外一个程序的时候，`vfork/fork`+ `exec函数族`
        当该进程不能在为系统做出贡献的时候，可以用exec函数族让自己重生。

        **exec函数族的特点:**

        * **fork+exec函数族:** fork调用之后，会复制父进程资源，子进程中如果使用exec，
                               原本的fork的资源会被新的exec所带的程序替换，只有pid号保持不变。

        * **vfork+exec函数族:** 在调用exec函数族的时候，会重新得到新的空间，不再和父进程公共同一块空间，只有pid号保持不变。
        
        以上两种再使用exec函数族之后，使用的都是新的进程，并且与父进程都不是同一空间，所以经常使用的是vfork+exec函数族，这样
        一开始就不用复制父进程的资源了(相对于fork来说)

        **exec函数族包括以下函数:**

        所需头文件:`#include <unistd.h>`
        
        1. `int execl(const char *path, const char *arg, ...);`
            - `execl`函数使用 **可变参数列表** ，接受一个 ^^字符串参数列表^^ 来指定新程序的 ^^路径^^ 和 ^^命令行参数^^ 。参数列表以 ==NULL== 结尾。
            - path:可执行程序的路径，使用 ^^完整的文件目录^^ 来查找对应的 **可执行文件** 。注意目录必须以“/”开头，否则将其视为文件名  
            - arg: 可变传参(1. 写可执行程序自身 2. 写给执行程序传入的第一个参数 3. 写给执行程序传入的第二个参数···最后以NULL结尾)
            - 示例：`execl("/bin/ls", "ls", "-l", NULL);`
            
        
        2. `int execv(const char *path, char *const argv[]);`
            - `execv`函数接受一个 ^^字符串数组^^ 来指定新程序的 ^^路径^^ 和 ^^命令行参数^^ 。字符串数组的最后一个元素必须是 ==NULL== 。
            - 示例：`char *args[] = { "ls", "-l", NULL }; execv("/bin/ls", args);`
        
        3. `int execle(const char *path, const char *arg, ..., char *const envp[]);`
            - `execle`函数使用可变参数列表，并接受一个字符串参数列表和一个环境变量数组来指定新程序的路径、命令行参数和环境变量。
            - 示例：`execle("/bin/ls", "ls", "-l", NULL, envp);`
        
        4. `int execve(const char *path, char *const argv[], char *const envp[]);`
            - `execve`函数接受一个字符串数组和一个环境变量数组来指定新程序的路径、命令行参数和环境变量。
            - 示例：`char *args[] = { "ls", "-l", NULL }; execve("/bin/ls", args, envp);`
        
        5. `int execlp(const char *file, const char *arg, ...);`
            - `execlp`函数类似于`execl`，但会在系统的搜索路径中查找 **可执行文件** 。
            - 示例1：`execlp("ls", "ls", "-l", NULL);`
            - 示例2：`execlp("./hello","hello",NULL);`
        
        6. `int execvp(const char *file, char *const argv[]);`
            - `execvp`函数类似于`execv`，但会在系统的搜索路径中查找可执行文件。
            - 示例：`char *args[] = { "ls", "-l", NULL }; execvp("ls", args);`
        
        这些`exec`函数在调用成功时不会返回，只有在出错时才会返回-1，并设置错误码`errno`。它们会将当前进程的代码、数据和堆栈替换为要执行的新程序，并开始执行新程序的入口点。
        
        `exec`函数族提供了一种方便且常用的方式来执行其他程序，通常与`fork`或`vfork`函数一起使用，以实现进程的替换和程序的执行。

    === "glob"

        ```c
        所属头文件:
        #include <glob.h>
        函数原型:
        int glob(const char *pattern, int flags,int (*errfunc) (const char *epath, int eerrno), glob_t *pglob);
        函数形参: 
        pattern:  获取某一路径下的某种类型的文件
              	  举例："/home/sakuraji/mp3file/*.mp3"  
        flags：0
        errfunc：NULL
        pglob：要保存的位置glob_t *类型   （glob  如下）
        typedef struct {
            size_t gl_pathc; /*找到的文件个数*/
            char **gl_pathv;/*文件名:gl_pathv[0]  gl_pathv[1]  。。。。 */
            size_t   gl_offs; /* 不管 */
        } glob_t;

        ```

        ```c title="举例"

        #include <stdio.h>
        #include <glob.h>
        int main()
        {
            glob_t song; //定义结构体变量
            glob("/home/sakura-ji/Traing/mp3file/*.mp3",0,NULL,&song);
            for(int i = 0; i < song.gl_pathc; i++)
            {
                printf("%s\n",song.gl_pathv[i]);
            }
            return 0;
        }
        
        ```

        ![glob](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/glob.png)

### 创建进程

**方式一:** 通过运行一个可执行程序，就可以运行一个进程

![Multi-1](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/Multi-1.png)

**方式二:** 通过函数 `fork()` 或者 `vfork()`

!!! example
    
    === "初识fork" 
    
        1.fork的特点就是:fork会复制父进程，创建一个完全相同的子进程。
        父进程和子进程会在fork调用之后同时执行。(先后顺序不确定)

        ```c 
        #include <stdio.h>
        #include <unistd.h>
        #include <sys/types.h>
        int main()
        {
          pid_t pid = fork();
          if(pid == 0)
          {
            printf("i am son\n");
          }
          else if(pid > 0)
          {
            printf("i am father\n");
          }
        
        }
        
        ```

        ![Multi-fork1](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/Multi-fork1.png)
    
    === "初识Vfork"
        
        1.vfork的特点:共享父进程的资源,子进程会在父进程的地址空间中运行，
        直到子进程调用exec或者_exit函数后，子进程才会独立于父进程运行。

        ```c
        #include <sys/types.h>
        #include <unistd.h>
        #include <stdio.h>
        int main()
        {
          pid_t pid = vfork();//pid_t pid = fork();
          
          if(pid == 0)
          {
            sleep(2);//加入sleep，是为了证明会先子进程，父进程在等
            printf("i am son pid:%d and i start,my father's pid:%d \n",getpid(),getppid());
            sleep(2);
            printf("son pid:%d finish,my father's pid:%d \n",getpid(),getppid());
            _exit(0);//规定使用_exit(0)退出，防止出现核心已转储的错误
          }
          else if(pid > 0)
          {
            printf("i am farher process\n");
          }
          else 
          {
            perror("vfork");
            return -1;
          }
          
        }
        ```

        ![vfork](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/vfork.png)

    === "二者的区别"

        ```c

        #include <sys/types.h>
        #include <unistd.h>
        #include <stdio.h>
        int num = 100;
        int main()
        {
        
          pid_t pid = vfork();//pid_t pid = fork();
          
          if(pid == 0)
          {
            num++;
            printf("i am son,num = %d\n",num);
            _exit(0);//规定使用_exit(0)退出，防止出现核心已转储的错误
          }
          else if(pid > 0)
          {
            printf("i am father,num = %d\n",num);
          }
          else 
          {
            perror("vfork");
            return -1;
          }
          
        }
        ```
        
        ![vfork2](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/vfork2.png)

### 举例
!!! example
    
    === "使用fork打印8个nihao"
    
        === "使用3个fork"
        
            ```c
        
            #include <stdio.h>
            #include <sys/types.h>
            #include <unistd.h>
            int main()
            {
                fork();
                fork();
                fork();
                printf("nihao\n");
            }
        
            ```
        === "展开3个fork"
        
            ```c title="进程"
            
            #include <stdio.h>
            #include <sys/types.h>
            #include <unistd.h>
            
            int main()
            {
              pid_t pid1 = fork();//创建一个子进程并复制父进程
              
              if(pid1 == 0)
              {
                pid_t pid2 = fork();//创建一个子进程并复制父进程
                
                if(pid2 == 0)
                  {
                    pid_t pid3 =fork();//创建一个子进程并复制父进程
                    if(pid3 == 0 )
                      {
                        printf("nihao\n");
                      }
                    else if(pid3 > 0)
                      {
                        printf("nihao\n");
                      }
                  }
                else if(pid2 > 0)
                  {
                    pid_t pid4 =fork();//创建一个子进程并复制父进程
                    if(pid4 == 0 )
                      {
                        printf("nihao\n");
                      }
                    else if(pid4 > 0)
                      {
                        printf("nihao\n");
                      }
                  }
              }
              else if(pid1 > 0)
              {
                
                pid_t pid5 = fork();//创建一个子进程并复制父进程
                
                if(pid5 == 0)
                  {
                    pid_t pid6 =fork();//创建一个子进程并复制父进程
                    if(pid6 == 0 )
                      {
                        printf("nihao\n");
                      }
                    else if(pid6 > 0)
                      {
                        printf("nihao\n");
                      }
                  }
                else if(pid5 > 0)
                  {
                    pid_t pid7 =fork();//创建一个子进程并复制父进程
                    if(pid7 == 0 )
                      {
                        printf("nihao\n");
                      }
                    else if(pid7 > 0)
                      {
                        printf("nihao\n");
                      }
                  }
            
              }
              return 0;
            }
            
            ```

        ![3-fork](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/3-fork.png)

    === "父进程检测子进程状态" 

        ```c 
         
         #include <stdio.h>
         #include <sys/types.h>
         #include <unistd.h>
         #include <sys/wait.h>
         int main()
         {
           pid_t pid = fork();
           if(pid == 0)
           {
             printf("i am son,son-pid:%d\n",getpid());
             sleep(5);
             printf("son die\n");
           }
           else if(pid > 0)
           {
             printf("i am father,father-pid:%d\n",getpid());
             wait(NULL);
             printf("检测到son die，启动新的进程\n");
             pid_t pid1 = fork();
             if(pid1 == 0)
            {
              printf("这是新的子进程,新的子进程pid是:%d\n",getpid());
              sleep(5);
               printf("新的子进程死亡\n");
            }
             else if(pid1 > 0)
            {
              wait(NULL);
              printf("这是新的父进程,新的父进程pid是:%d",getpid());
            }
           }
         }
         
        ```
        ![father-son](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/father-son.png)

    === "exec函数族的使用"

        === "初使用"
        
            
            ```c
             
            #include <stdio.h>
            #include <unistd.h>
            #include <sys/types.h>
             
            int main()
            {
                printf("12345\n");
             
                execl("/home/sakuraji/Tring/Multi-process/hello", "hello",NULL);//启动另一个程序执行,覆盖原有进程
             
                printf("67890\n");//不进行
             
                return 0;
             
            }
            
            ```
            
            ![Exec-Func](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/Exec-Func.png)

        === "与vfork连用"

            ```c
            
            #include <stdio.h>
            #include <unistd.h>
            #include <sys/types.h>
            #include <sys/wait.h>
            int main()
            {
              pid_t pid = vfork();
            
              if(pid == 0)
              {
                printf("12345\n");
                
                execl("/home/sakuraji/Tring/Multi-process/hello", "hello",NULL);//启动另一个程序执行,覆盖原有进程
                
                printf("67890\n");//不运行
            
                _exit(0);//不运行
              }
              else if(pid > 0)
              {
                wait(NULL);//等待子进程消亡
                printf("i am father\n");
            }
            
              return 0;
            
            }
            ```

            ![exec-vfork](https://raw.githubusercontent.com/Sakura-Ji/MapDepot/main/Mkdocs/exec-vfork.png)


