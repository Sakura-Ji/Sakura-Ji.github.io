---
comments: true
---
# 文件学习

## 函数:函数名--功能--查

1.打开:fopen("./1.txt","r");

2.参数:

* r:只读，如果文件不存在，打开失败
* w:只写，如果文件不存在，创建并打开
* a:追加写，光标在文件末尾，如果文件不存在创建并打开
* r+:可读写，如果文件不存在，打开失败
* w+:可读写,如果文件不存在，创建并打开
* a+:可读可写，如果第一次对文件是读操作，光标在文件开头，如果第一次对文件是写操作，光标在文件末尾(追加写)，如果文件不存在，创建并打开

3.关闭:fclose("./1.txt")

4.读写:

* 单字符:fputc('S',fp); fgetc(fp);
* 字符串:fputs(char *s,fp); fgets(char *s,int size,fp);

5.格式化:

* fprintf(fp,"格式",...); fscanf(fp,"格式"，...); 
* fwrite(&地址,1次写多少,写几次,fp)；//以二进制写入文件
* fread(&地址,1次读多少,读几次,fp)；//以二进制读取文件

6.其他函数:

* rewind(fp);//光标移动到文件起始位置。
* fseek(fp,offset,whence);//实现偏移量offset，whence:SEEK_SET--0 SEEK_CUR--1 SEEK_END--2
* ftell(fp) -- 计算光标当前位置到文件开头的偏移量
* feof(fp): 判断文件是否达到文件末尾(依据上一次读的结果),文件结束，返回非零值;文件没结束，返回0      

```c  title="保存一个字符S到1.txt"
#include <stdio.h>

int main()
{
  FILE *fp = NULL;
  fp = fopen("./1.txt","w+");
  if(fp == NULL)
  {
    perror("fopen");
    return 0;
  }
  fputc('S', fp);
  fclose(fp);

}
while(fgetc(fp) !=-1 )
{
    fseek(fp,-1,1);
    fscanf(fp,"%d");//while循环是通过光标移动
}
```


