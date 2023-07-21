# 线程

## 线程基础

### 理论

线程通常叫做轻量级进程,多个线程运行在同一个进程空间里面。线程也是能够被系统调度的。

**线程的特点:**

* 一个进程至少有一条线程，即 `main` 函数所代表的执行序列，称之为主线程
* Linux 的线程是通过用户级的函数库实现的，一般采用 `pthread` 线程库实现线程的访问和控制。它使用第三方
  `posix` 标准的 `pthread`，具有良好的可移植性，编译的时候要在后面加上  `-l pthread`    

```shell

gcc xxx.c -l pthread -o Test

```

* 主线程仅仅是代表进程执行的第一条线程,当主线程通过线程库创建出函数线程以后，两个线程就没有任何区别。
* 同一程序中的所有线程均会独立执行相同程序，且共享同一份全局内存区域，其中包括初始化数据段（initialized data）、未初始化数据段
（uninitialized data），以及堆内存段（heap segment）==只有栈区是自己的(局部变量)==
* 在线程中，任意线程非正常消亡，其他线程全挂掉。一死全死
* 运行顺序由cpu决定
* 并发运行
* 优点: 占用系统的资源少,通信简单
* 缺点: 调度没有进程方便,对资源的操作不安全

???+ note "线程和进程的区别和选择"

    **线程与进程的区别**

	进程有独立的地址空间，线程没有单独的地址空间。（同一进程内的线程共享进程的地址空间）
    
    启动一个进程所花费的空间远远大于启动一个线程所花费的空间（30倍左右），
    而且，线程间彼此切换所需的时间也远远小于进程间切换所需要的时间（>10倍）
	维护进程对内核的消耗远远大于线程

	线程间可以共享数据，更容易通信

    **如何选择:**

	1. 需要频繁创建销毁的优先用线程,因为对进程来说创建和销毁一个进程代价是很大的。
	2. 线程的切换速度快，所以在需要大量计算，切换频繁时用线程，还有耗时的操作使用线程可提高应用程序的响应
	3. 强相关的处理用线程，弱相关的处理用进程
	4. 因为对CPU系统的效率使用上线程更占优，所以可能要发展到多机分布的用进程，多核分布用线程；
	5. 需要更稳定安全时，适合选择进程；需要速度时，选择线程更好。

### 函数

1. 用于创建一个新的线程的函数 `pthread_create`
2. 用于等待指定的线程结束，并获取其返回值(如果有)的函数 `pthread_join`
3. 用于终止当前线程，并可选择传递一个线程的退出状态的函数 `pthread_exit`
4. 用于获取调用它的线程的线程ID(Thread ID)的函数 `pthread_self`
5. 用于取消指定的线程的函数`pthread_cancel`
6. 用于在线程执行过程中注册清理函数的函数是 `pthread_cleanup_push`和`pthread_cleanup_pop`
7. 用于向指定的线程发送信号的函数(同进程): `pthread_kill`

!!! example "函数原型"

    === "pathread_create"

        ```c

        所属头文件:
        #include<pthread.h>
        函数原型:
        int pthread_create(pthread_t *thread,const pthread_attr_t *attr,void *(*start_routine)(void*),void *arg);
        参数: 
        thread: 指向 pthread_t 类型的指针，用于存储新线程的标识符，即线程ID
        attr: 指向 pthread_attr_t 类型的指针，用于指定新线程的属性。如果传入 NULL ，则使用默认属性。
        start_routine: 线程的入口函数，是一个指向返回 void* 的函数指针，接受一个 void* 类型的参数。(void *)是一个万能指针
        arg: 传递给线程入口函数的参数，可以是任何类型的指针。
        返回值:
        成功 -- 0, 失败 -- 非0值；
        举例:
        pthread_t id = 0;
        pthread_create(&id,NULL,Func,NULL);

        ```
        === "举例1"
            ```c 

            #include <stdio.h>
            #include <pthread.h>
            #include <unistd.h>
            
            void *Func(void *p);
            
            int main()
            {
              pthread_t id = 0;//定义线程id
            
              pthread_create(&id, NULL, Func, NULL);//创建线程
            
              printf("我是main线程\n");
              
              sleep(1);//不加延时有可能子线程不会运行，因为main线程直接return 0会将进程直接结束
              return 0;
            
            }
            
            void *Func(void *p)
            {
              printf("我是子线程\n");
              return NULL; 
            }

            ```
            ![create](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_create.png)

        === "举例2"

            ```c

            #include <stdio.h>
            #include <pthread.h>
            #include <unistd.h>
            
            void *Func(void *p);
            
            int main()
            {
              pthread_t id = 0;//定义线程id
            
              pthread_create(&id, NULL, Func, "hello");//创建线程,传入参数
            
              printf("我是main线程\n");
              
              sleep(1);//不加延时有可能子线程不会显示，因为main线程直接return 0会将进程直接结束
              return 0;
            }
            
            void *Func(void *p)
            {
              printf("我是子线程,行数是:%d,传入的参数是:%s\n",__LINE__,(char *)p);
              return NULL; //结束子线程
            }
            ```
            ![pthread_create1](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_create1.png)

        === "举例3"

            ```c

            #include <stdio.h>
            #include <pthread.h>
            #include <unistd.h>
            
            void *Func(void *p);
            
            int main()
            {
              pthread_t id = 0;//定义线程id
              int num = 56;
              pthread_create(&id, NULL, Func, &num);//创建线程,传入局部变量的地址
            
              printf("我是main线程\n");
              
              sleep(1);//不加延时有可能子线程不会显示，因为main线程直接return 0会将进程直接结束
              return 0;
            }
            
            void *Func(void *p)
            {
              printf("我是子线程,行数是:%d,传入的参数是:%d\n",__LINE__,*((int *)p));
              //先将传入过来的void *参数强制转换成int *,然后再将其进行解指针操作
              return NULL; //结束子线程
            }
            ```
            ![pthread_create2](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_create2.png)

    === "pthread_join"

        1. 该函数是一个阻塞函数，一直等到参数 pthid 指定的线程返回；与多进程中的 wait 或 waitpid 类似
        ```c
        
        所属头文件:
        #include <pthread.h>
        函数原型:
        int pthread_join(pthread_t thread, void **retval);
        参数:
        thread: 要等待的线程的标识符（即pthread_t类型）。
        retval: 指向一个指针的指针，用于获取线程的返回值。如果不需要获取返回值，可以传入NULL。
        返回值:
        pthread_join()函数返回值为0表示成功等待线程结束，非零值表示等待失败。
        线程的返回值存储在retval指针所指向的位置，需要根据线程入口函数的返回类型进行类型转换。
        
        ```

        ```c

        #include <stdio.h>
        #include <pthread.h>
        #include <unistd.h>
            
        void *Func(void *p);
            
        int main()
        {
         pthread_t id = 0;//定义线程id
         int num = 56;
         pthread_create(&id, NULL, Func, &num);//创建线程,传入局部变量的地址
            
         printf("我是main线程\n");
             
         pthread_join(id, NULL);//等待子线程id结束
         printf("子线程结束了\n");
         return 0;
        }
            
        void *Func(void *p)
        {
         printf("我是子线程,行数是:%d,传入的参数是:%d\n",__LINE__,*((int *)p));
         //先将传入过来的void *参数强制转换成int *,然后再将其进行解指针操作
         sleep(2);
         return NULL; //结束子线程
        }
        ```
        ![pthread_join](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_join.png)
        
    === "pthread_exit"

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        void pthread_exit(void *retval);
        参数:
        retval，用于传递线程的退出状态。可以是任意类型的指针。
        
        ```
        === "举例一"

            ```c

            #include <stdio.h>
            #include <pthread.h>
            #include <unistd.h>
            
            void *Func(void *p);
            
            int main()
            {
              pthread_t id = 0;//定义线程id
              int num = 56;
              pthread_create(&id, NULL, Func, &num);//创建线程,传入局部变量的地址
            
              printf("我是main线程\n");
              
              void *a = NULL;//pthread_exit 传回来一个void *类型的参数 (地址)
              pthread_join(id, &a);//等待子线程id结束，join第二个参数是 void **类型的 所以再取一次地址
              //把buf的地址传过来了
              printf("子线程结束了,传回来的参数:%s\n",(char *)a);
              return 0;
            }
            
            void *Func(void *p)
            {
              printf("我是子线程,行数是:%d,传入的参数是:%d\n",__LINE__,*((int *)p));
              //先将传入过来的void *参数强制转换成int *,然后再将其进行解指针操作
              sleep(2);
              static char buf[100] = {"hello"};//需要使用静态变量，不能将buf空间释放，否则就传不回去了
              pthread_exit(buf); //结束子线程,并将参数传回去
            }

            ```
            ![pthread_exit](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/ptread_exit.png)
        === "举例2"

            ```c

            #include <stdio.h>
            #include <pthread.h>
            #include <unistd.h>
            
            void *Func(void *p);
            
            int main()
            {
              pthread_t id = 0;//定义线程id
              int num = 56;
              pthread_create(&id, NULL, Func, &num);//创建线程,传入局部变量的地址
            
              printf("我是main线程\n");
              
              void *a = NULL;//pthread_exit 传回来一个void *类型的参数 (地址)
              pthread_join(id, &a);//等待子线程id结束，join第二个参数是 void **类型的 所以再取一次地址
              //把&son的地址传过来了
              printf("子线程结束了,传回来的参数:%d\n",*((int *)a));
              //我的理解是，exit的传回类型是(void *),那么我们用void *类型的a承接
              //但按照规则等待函数join需要承接2级类型的指针，所以我们将a取地址放到第二个参数中
              //这样&a 里面 放的 是 &son的地址  ， a 里面放的 就是 &son
              // 所以 *a = son的值
              return 0;
            }
            
            void *Func(void *p)
            {
              printf("我是子线程,行数是:%d,传入的参数是:%d\n",__LINE__,*((int *)p));
              //先将传入过来的void *参数强制转换成int *,然后再将其进行解指针操作
              sleep(2);
              static int son = 67;//需要使用静态变量，不能将son空间释放，否则就传不回去了
              pthread_exit(&son); //结束子线程,并将参数传回去
            }

            ```
            ![pthread_exit2](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_exit2.png)
            
    === "pthread_self"

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        pthread_t pthread_self(void);
        形参:无
        返回值:
        当前线程的id，pthread_t 
        不同的线程pid一样，线程id不同；

        ```
        
        ```c title="举例"

        #include <stdio.h>
        #include <pthread.h>
        #include <unistd.h>
        
        void *Func(void *p);
        
        int main()
        {
          pthread_t id = 0;//定义线程id
        
          pthread_create(&id, NULL, Func, NULL);//创建线程
        
          printf("我是main线程,我的线程id是:%lu,我的进程id是:%d\n",pthread_self(),getpid());
        
          pthread_join(id, NULL);//等待子线程id结束
          printf("子线程结束了\n");
          return 0;
        }
        
        void *Func(void *p)
        {
          printf("我是子线程,所在函数名是:%s,我的线程id是:%lu,我的进程id是:%d\n",__FUNCTION__,pthread_self(),getpid());
          
          sleep(2);
        
          pthread_exit(NULL); //结束子线程
        }

        ```
        ![pthread_self](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_self.png)

    === "pthread_cancel"

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        int pthread_cancel(pthread_t thread);
        参数:
        thread，指定要取消的线程的线程ID（pthread_t类型）

        ```
        ```c title="举例"

        #include <stdio.h>
        #include <pthread.h>
        #include <unistd.h>
        
        void *Func(void *p);
        
        int main()
        {
          pthread_t id = 0;//定义线程id
        
          pthread_create(&id, NULL, Func, NULL);//创建线程
        
          sleep(5);
        
          pthread_cancel(id);//取消线程
          
          pthread_join(id, NULL);//等待子线程id结束
          printf("子线程结束了\n");
          return 0;
        }
        
        void *Func(void *p)
        {
        
          while(1)
          {
            printf("我是子线程\n");
            sleep(1);
          }
        
          pthread_exit(NULL); //结束子线程
        }

        ```
        ![pthread_cancel](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_cancel.png)

    === "pthread_cleanup_push 和 pthread_cleanup_pop"
        
        有三种情况线程清理函数 ==会被调用== :
        
        1. 线程还未执行 `pthread_cleanup_pop` 前 , 被 `pthread_cancel` 取消
        2. 线程还未执行 `pthread_cleanup_pop` 前 , 主动执行 `pthread_exit` 终止
        3. 线程执行 `pthread_cleanup_pop` , 且 `pthead_cleanup_pop` 的参数不为 0.

        **有多个cleanup清理函数时,遵循先进后出原则和进栈出栈一样,看示例4**

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        void pthread_cleanup_push(void (*routine)(void*), void *arg);
        参数:
        routine: 清理函数，当线程被取消或调用pthread_exit()函数时，会在清理函数中执行相应的清理操作。
        arg: 传递给清理函数的参数。
        
        ```

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        void pthread_cleanup_pop(int execute);
        参数:
        execute: 控制清理函数的执行。如果execute为非零值，表示执行清理函数；
                                   如果execute为零，表示不执行清理函数。

        ```

        === "举例1"

            ```c

            #include <stdio.h>
            #include <unistd.h>
            #include <pthread.h>
            
            void *Son_Pthread(void *p);//子线程
            
            void Clean_Fun(void *p);//清理函数
            
            int main()
            {
            	pthread_t id = 0;//定义子线程ID
              
            	pthread_create(&id,NULL,Son_Pthread,NULL);//创建子线程
            
              printf("i am main pthread!\n");
              
              sleep(3);
              
              pthread_cancel(id);//取消子线程继续进行
            	
              pthread_join(id,NULL);//等待子线程ID结束
              
            	return 0;
            }
            void *Son_Pthread(void *p)
            {
                pthread_cleanup_push(Clean_Fun,NULL);//创建子线程清理函数
                
                int count = 0;
                while(1)
                {
                    printf("%s线程被执行\n",__FUNCTION__);
                    sleep(1);
                    count++;
                    if(count == 5)
                        break;
                }
                pthread_exit(NULL);
                
                pthread_cleanup_pop(0);//和push进行组合
            }
            
            void Clean_Fun(void *p)
            {
                printf("%s被执行\n",__FUNCTION__);
            }

            ```
            ![pthread_push1](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_push1.png)

        === "举例2"

            ```c

            #include <stdio.h>
            #include <unistd.h>
            #include <pthread.h>
            
            void *Son_Pthread(void *p);//子线程
            
            void Clean_Fun(void *p);//清理函数
            
            int main()
            {
            	pthread_t id = 0;//定义子线程ID
              
            	pthread_create(&id,NULL,Son_Pthread,NULL);//创建子线程
            	
              printf("i am main pthread!\n");
             
              pthread_join(id,NULL);//等待子线程ID结束
              
            	return 0;
            }
            void *Son_Pthread(void *p)
            {
                pthread_cleanup_push(Clean_Fun,NULL);//创建子线程清理函数
                
                int count = 0;
                while(1)
                {
                    printf("%s线程被执行\n",__FUNCTION__);
                    sleep(1);
                    count++;
                    if(count == 5)
                        break;
                }
                pthread_exit(NULL);//pop前 正常退出
                
                pthread_cleanup_pop(0);//和push进行组合
            }
            
            void Clean_Fun(void *p)
            {
                printf("%s被执行\n",__FUNCTION__);
            }

            ```
            ![pthread_push2](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_push2.png)

        === "举例3"

            ```c

            #include <stdio.h>
            #include <unistd.h>
            #include <pthread.h>
            
            void *Son_Pthread(void *p);
            void Clean_Fun(void *p);
            int main()
            {
            	pthread_t id = 0;
            	pthread_create(&id,NULL,Son_Pthread,NULL);
            	printf("i am main pthread!\n");
              
              pthread_join(id,NULL);
            	return 0;
            }
            void *Son_Pthread(void *p)
            {
                pthread_cleanup_push(Clean_Fun,NULL);
                int count = 0;
                while(1)
                {
                    printf("%s线程被执行\n",__FUNCTION__);
                    sleep(1);
                    count++;
                    if(count == 5)
                        break;
                }
                // pthread_exit(NULL);//未正常退出
                pthread_cleanup_pop(1);//然后 参数为 非0值
            
            }
            
            void Clean_Fun(void *p)
            {
                printf("%s被执行\n",__FUNCTION__);
            }

            ```
            ![pthread_push3](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_push3.png)

        === "举例4"

            ```c

            #include <stdio.h>
            #include <unistd.h>
            #include <pthread.h>
            
            void *Son_Pthread(void *p);//子线程
            
            void Clean_Fun1(void *p);//清理函数
            void Clean_Fun2(void *p);//清理函数
            void Clean_Fun3(void *p);//清理函数
            
            int main()
            {
            	pthread_t id = 0;//定义子线程ID
              
            	pthread_create(&id,NULL,Son_Pthread,NULL);//创建子线程
            
              printf("i am main pthread!\n");
              	
              pthread_join(id,NULL);//等待子线程ID结束
              
            	return 0;
            }
            void *Son_Pthread(void *p)
            {
                pthread_cleanup_push(Clean_Fun1,NULL);//创建子线程清理函数
                pthread_cleanup_push(Clean_Fun2,NULL);//创建子线程清理函数
                pthread_cleanup_push(Clean_Fun3,NULL);//创建子线程清理函数
                
                int count = 0;
                while(1)
                {
                    printf("%s线程被执行\n",__FUNCTION__);
                    sleep(1);
                    count++;
                    if(count == 5)
                        break;
                }
                pthread_exit(NULL);
                
                pthread_cleanup_pop(1);//和push进行组合
                pthread_cleanup_pop(1);//和push进行组合
                pthread_cleanup_pop(1);//和push进行组合
            }
            
            void Clean_Fun1(void *p)
            {
                printf("%s被执行\n",__FUNCTION__);
            }
            void Clean_Fun2(void *p)
            {
                printf("%s被执行\n",__FUNCTION__);
            }
            void Clean_Fun3(void *p)
            {
                printf("%s被执行\n",__FUNCTION__);
            }
        
            ```
            ![pthread_push4](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_push4.png)
        
    === "pthread_kill"

        ```c

        所属头文件:
        #include <pthread.h>
        #include <signal.h>
        函数原型:
        int pthread_kill(pthread_t thread, int sig);
        参数:
        thread: 要发送信号的目标线程的线程ID（pthread_t类型）。
        sig: 要发送的信号的编号。
        返回值:
        成功,返回0
        失败,返回值为一个非零的错误码
        ```

        === "举例1"

            ```c

            #include <stdio.h>
            #include <pthread.h>
            #include <unistd.h>
            #include <signal.h>
            
            void *Func(void *p);
            
            int main()
            {
              pthread_t id = 0;//定义子线程ID号
              pthread_create(&id, NULL, Func, NULL);//创建子线程
            
              sleep(3);
              
              pthread_kill(id, 2);//向子线程传递2号信号
            
              pthread_join(id,NULL);//等待子线程
              printf("never find here!\n");//运行不到这里 ， 因为2号信号直接把进程杀死了
            
            }
            
            void *Func(void *p)
            {
              while(1)
              {
                printf("i am son\n");
                sleep(1);
              }
            }
            ```
            ![pthread_kill](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_kill.png)

        === "举例2"

            ```c

            #include <stdio.h>
            #include <pthread.h>
            #include <unistd.h>
            #include <signal.h>
            
            void *Func(void *p);
            void Cap(int a);
            
            int main()
            {
              pthread_t id = 0;//定义子线程ID号
              pthread_create(&id, NULL, Func, NULL);//创建子线程
            
              sleep(3);
              
              pthread_kill(id, 2);//向子线程传递2号信号
            
              pthread_join(id,NULL);//等待子线程
              printf("never find here!\n");//运行不到这里,因为子线程一直再循环
            
            }
            
            void *Func(void *p)
            {
              //signal(2,SIN_IGN);//忽略处理
              signal(2,Cap);//将2号信号捕获
              while(1)
              {
                printf("i am son\n");
                sleep(1);
              }
            }
            
            void Cap(int a)
            {
              printf("ctrl + c已经被捕获\n");
            }

            ```
            ![pthread_kill2](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/pthread_kill2.png)

### 举例

!!! example "使用有名管道进行双向通信"

    
    
    === "0号通信"
        ```c
            
        #include <stdio.h>
        #include <sys/stat.h>
        #include<sys/types.h>
        #include <unistd.h>
        #include <fcntl.h>
        #include <string.h>
        #include <pthread.h>
            
        #define TEXT "text.fifo"
        #define DATA "data.fifo"
            
        void *Func(void *p);
            
        int main()
        {
         // 检查text.fifo文件是否存在
         if (access(TEXT, F_OK) == 0)
          {
            printf("text.fifo File exists\n");//存在
          } 
          else
          {
            printf("text.fifo File does not exist,creat it\n");//不存在
            if(mkfifo(TEXT,0644) == -1)//创建文件
            {
              perror("mkfifo");
              return -1;
            }
          }
          // 检测data.fifo文件是否存在
          if (access(DATA, F_OK) == 0)
          {
            printf("data.fifo File exists\n");//存在
          } 
          else
          {
            printf("data.fifo File does not exist,creat it\n");//不存在
            if(mkfifo(DATA,0644) == -1)//创建文件
            {
              perror("mkfifo");
              return -1;
            }
          }
          //创建线程
          pthread_t id = 0;//创建线程ID
            
          pthread_create(&id, NULL, Func, NULL);
            
          //主线程 打开 -- 写
          printf("请向text.fifo管道文件中写入\n");
          int fd = open(TEXT,O_WRONLY);
          char w_buf[100] = {0};
          if(fd == -1)
          {
            perror("0hao write open");
            return -1;
          }
            
          while(1)
          {
            printf("0号正在向1号发送内容:\n");
            scanf("%s",w_buf);
            write(fd,w_buf,strlen(w_buf));
            if(!strcmp(w_buf, "quit"))//防止陷入当一端关闭，管道摧毁，另一端出现bug
            {
              pthread_exit(NULL);
            }
            memset(w_buf,0,100);
          }
          pthread_join(id,NULL);
          return 0;
        }
            
        void *Func(void *p)
        {
          // 子线程进行读取
          printf("0 hao 正在监听1号发送的内容\n");
          int fp = open(DATA,O_RDONLY);
          char r_buf[100] = {0};
        
          if(fp == -1)
          {
            perror("0 hao read open");
            pthread_exit(NULL);
          }
          while(1)
          {
            read(fp,r_buf,100);
            if(!strcmp(r_buf, "quit"))
            {
              printf("1号发送向->0号的通道结束\n");
              return NULL;
            }
            printf("0 hao 读取到的内容:%s\n",r_buf);
            memset(r_buf,0,100);
          }
          return NULL;
        }
    
        ```
    === "1号通信"
    
        ```c
    
        #include <stdio.h>
        #include <sys/stat.h>
        #include<sys/types.h>
        #include <unistd.h>
        #include <fcntl.h>
        #include <string.h>
        #include <pthread.h>
            
        #define TEXT "text.fifo"
        #define DATA "data.fifo"
            
        void *Func(void *p);
            
        int main()
        {
          // 检查text.fifo文件是否存在
          if (access(TEXT, F_OK) == 0)
          {
            printf("text.fifo File exists\n");//存在
          } 
          else
          {
            printf("text.fifo File does not exist,creat it\n");//不存在
            if(mkfifo(TEXT,0644) == -1)//创建文件
            {
              perror("mkfifo");
              return -1;
            }
           }
          // 检测data.fifo文件是否存在
          if (access(DATA, F_OK) == 0)
          {
            printf("data.fifo File exists\n");//存在
          } 
          else
          {
            printf("data.fifo File does not exist,creat it\n");//不存在
            if(mkfifo(DATA,0644) == -1)//创建文件
            {
              perror("mkfifo");
              return -1;
            }
          }
          //创建线程
          pthread_t id = 0;//创建线程ID
            
          pthread_create(&id, NULL, Func, NULL);
            
          //主线程 打开 -- 写
          printf("请向data.fifo管道文件中写入\n");
          int fd = open(DATA,O_WRONLY);
          char w_buf[100] = {0};
          if(fd == -1)
          {
            perror("1hao write open");
            return -1;
          }
            
          while(1)
          {
            printf("1号正在向0号发送内容:\n");
            scanf("%s",w_buf);
            write(fd,w_buf,strlen(w_buf));
            if(!strcmp(w_buf, "quit"))//防止陷入当一端关闭，管道摧毁，另一端出现bug
            {
              pthread_exit(NULL);
            }
            memset(w_buf,0,100);
          }
          pthread_join(id,NULL);
          return 0;
        }
            
        void *Func(void *p)
        {
          // 子线程进行读取
          printf("1 hao 正在监听0号发送的内容\n");
          int fp = open(TEXT,O_RDONLY);
          char r_buf[100] = {0};
            
          if(fp == -1)
          {
            perror("1 hao read open");
            pthread_exit(NULL);
          }
           while(1)
           {
            read(fp,r_buf,100);
            if(!strcmp(r_buf, "quit"))
            {
              printf("0号发送->0号的通道结束\n");
              return NULL;
            }
            printf("1 hao 读取到的内容:%s\n",r_buf);
            memset(r_buf,0,100);
          }
          return NULL;
        }
    
        ```
    ![Pthread](https://cdn.jsdelivr.net/gh/Sakura-Ji/MapDepot/Mkdocs/Pthread.png)    

## 同步和互斥

### 理论

线程的同步和互斥是并发编程中常用的两种技术，用于确保多个线程之间的正确执行顺序和共享资源的安全访问。

**同步(Synchronization):** 是指多个线程按照一定的顺序执行，保证线程之间的相对顺序和结果的正确性。
常见的同步机制有互斥锁、条件变量、信号量等。

**互斥(Mutual Exclusion):** 是指多个线程之间对共享资源的互斥访问，即同一时间只有一个线程可以访问共享资源，
其他线程需要等待。互斥机制可以防止多个线程同时访问共享资源导致的数据不一致或竞态条件等问题。常见的互斥机制有互斥锁、读写锁等。

在使用同步和互斥机制时，需要注意以下几点:

1. 临界区(Critical Section): 指访问共享资源的代码段。在进入临界区之前，需要通过互斥机制获取锁或信号量，以确保只有一个线程可以进入临界区执行。

2. [互斥锁(Mutex):](#mutex) 是最常用的同步机制。在进入临界区之前，线程尝试获取互斥锁，如果锁已被其他线程获取，则当前线程会被阻塞等待，直到获取到锁。

3. [条件变量(Condition Variable):](#cond) 用于线程之间的等待和通知。当线程等待某个条件时，可以通过条件变量暂时释放互斥锁，直到其他线程满足条件后通知等待的线程继续执行。

4. [信号量(Semaphore):](#sem) 用于控制同时访问某个资源的线程数量。通过信号量可以限制同时访问临界区的线程数量，实现资源的合理分配。

使用同步和互斥机制可以有效地管理线程之间的竞争和资源访问,确保多线程程序的正确性和性能。
但同时,使用不当可能会导致死锁、饥饿等问题,因此在编写并发程序时需要谨慎设计和调试。

### 互斥锁 {#mutex}

**含义:** 每次操作资源的时候，默认去检测锁

* 如果锁处于加锁状态等待锁解开
* 如果锁处于解锁状态，加锁使用，使用完毕后，解锁。

**分类:**
	
* 快速互斥锁:最常用的锁，符合以上的含义	
* 检测锁:	快速互斥锁的非阻塞版本
* 递归锁:	多次加锁

#### 互斥锁函数

1. 定义一个互斥锁: `pthread_mutex_t mutex`
2. 初始化一个互斥锁: `pthread_mutex_init`
3. 竞争占用互斥锁: `pthread_mutex_lock`
4. 释放互斥锁资源: `pthread_mutex_unlock`
5. 销毁互斥锁: `pthread_mutex_destroy`

!!! example "函数原型"

    === "pthread_mutex_init"

        ```c
        
        所属头文件:
        #include <pthread.h>
        函数原型:
        int pthread_mutex_init(pthread_mutex_t *mutex, const pthread_mutexattr_t *attr);
        参数:
        mutex:指向互斥锁对象的指针。该函数将初始化互斥锁对象，并将其赋值给mutex。
        attr:指向互斥锁属性的指针。如果传入NULL，表示使用默认的互斥锁属性。
            互斥锁属性影响互斥锁的行为，例如是否是递归锁（可以多次锁定同一个锁）等。
            如果要设置特定的属性，可以使用pthread_mutexattr_init函数进行初始化，
            并设置相关属性后将其传递给pthread_mutex_init函数
        返回值:
        0 表示成功
        非 0 表示失败
 
        ```
    === "pthread_mutex_lock"

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        int pthread_mutex_lock(pthread_mutex_t *mutex);
        形参:
        mutex:指向互斥锁对象的指针。该函数会尝试获取互斥锁,如果互斥锁已经被其他线程获取,则当前线程会被阻塞,直到成功获取到互斥锁为止。
        返回值:
        为 0 表示成功获取到互斥锁
        非 0 表示获取失败。
        
        ```
    === "pthread_mutex_trylock"

        ```c
        所属头文件:
        #include <pthread.h>
        函数原型:
        int pthread_mutex_trylock(pthread_mutex_t *mutex);
        参数:
        mutex：指向互斥锁对象的指针。该函数会尝试获取互斥锁,如果互斥锁已经被其他线程获取,则返回错误码,否则立即获取互斥锁并返回0。
        返回值:
        为 0 表示成功获取到互斥锁,否则表示获取失败
    
        ```
    === "pthread_mutex_unlock"

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        int pthread_mutex_unlock(pthread_mutex_t *mutex);
        形参:
        mutex:指向互斥锁对象的指针。该函数会释放当前线程持有的互斥锁。
        返回值:
        返回值为 0 表示成功释放互斥锁
        非 0 表示错误

        ```
    === "pthread_mutex_destroy"

        ```c
        所属头文件:
        #include <pthread.h>
        函数原型:
        int pthread_mutex_destroy(pthread_mutex_t *mutex);
        形参:
        mutex:指向互斥锁对象的指针。该函数会销毁互斥锁对象，并释放相关的资源。
        返回值:
        为 0 表示成功销毁互斥锁
        非 0 表示错误发生

        ```

### 条件变量 {#cond}

条件变量（Condition Variable）是一种线程同步的机制，用于在线程间进行通信和协调。
它允许线程在满足某个条件之前等待，并在条件满足时被唤醒继续执行。

条件变量通常与互斥锁一起使用，以实现复杂的线程同步和互斥操作。

**条件变量的使用通常包括以下几个步骤:**

1. **初始化条件变量和互斥锁:**
   在使用条件变量前，需要通过`pthread_cond_init`函数初始化条件变量，以及通过`pthread_mutex_init`函数初始化互斥锁。条件变量用于等待和唤醒线程，而互斥锁用于保护对共享资源的访问。

2. **等待条件:**
   在某个线程希望在特定条件满足之前等待时，可以调用`pthread_cond_wait`函数。此函数会自动将当前线程阻塞，并释放互斥锁。线程将一直等待，直到被其他线程通过`pthread_cond_signal`或`pthread_cond_broadcast`函数唤醒。

3. **唤醒线程:**
   当某个线程满足条件并希望唤醒等待的线程时，可以使用`pthread_cond_signal`函数向条件变量发送信号。这将唤醒等待队列中的一个线程。如果有多个线程等待，使用`pthread_cond_broadcast`函数会唤醒所有等待线程。

4. **重新检查条件:**
   等待的线程被唤醒后，它会再次获取互斥锁，并重新检查条件是否满足。如果条件仍然不满足，它将继续等待，否则可以继续执行。

5. **销毁条件变量和互斥锁:**
   在不再需要使用条件变量和互斥锁时，应使用`pthread_cond_destroy`函数销毁条件变量，并使用`pthread_mutex_destroy`函数销毁互斥锁。这将释放相关的资源。

#### 条件变量函数

1.  


### 信号量 {#sem}

#### 信号量函数



