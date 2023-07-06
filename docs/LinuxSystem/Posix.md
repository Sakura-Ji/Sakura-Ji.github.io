# 线程

## 理论

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
（uninitialized data），以及堆内存段（heap segment）
* 在线程中，任意线程非正常消亡，其他线程全挂掉。一死全死。
* 运行顺序由cpu决定。
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

## 函数

1. 用于创建一个新的线程的函数 `pthread_create`
2. 用于等待指定的线程结束，并获取其返回值(如果有)的函数 `pthread_join`
3. 用于终止当前线程，并可选择传递一个线程的退出状态的函数 `pthread_exit`
4. 用于获取调用它的线程的线程ID(Thread ID)的函数 `pthread_self`
5. 用于取消指定的线程的函数`pthread_cancel`
6. 用于在线程执行过程中注册清理函数的函数是 `pthread_cleanup_push`和`pthread_cleanup_pop`

!!! example "函数原型"

    === "pathread_create"

        ```c

        所属头文件:
        #include<pthread.h>
        函数原型:
        int pthread_create(
        pthread_t *thread,
        const pthread_attr_t *attr,
        void *(*start_routine)(void*),
        void *arg
        );
        参数: 
        thread: 指向 pthread_t 类型的指针，用于存储新线程的标识符，即线程ID
        attr: 指向 pthread_attr_t 类型的指针，用于指定新线程的属性。如果传入 NULL ，则使用默认属性。
        start_routine: 线程的入口函数，是一个指向返回 void* 的函数指针，接受一个 void* 类型的参数。
        arg: 传递给线程入口函数的参数，可以是任何类型的指针。
        返回值:
        成功 -- 0, 失败 -- 非0值；

        ```
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
    === "pthread_exit"

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        void pthread_exit(void *retval);
        参数:
        retval，用于传递线程的退出状态。可以是任意类型的指针。
        
        ```
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
    === "pthread_cancel"

        ```c

        所属头文件:
        #include <pthread.h>
        函数原型:
        int pthread_cancel(pthread_t thread);
        参数:
        thread，指定要取消的线程的线程ID（pthread_t类型）

        ```
    === "pthread_cleanup_push 和 pthread_cleanup_pop"

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


