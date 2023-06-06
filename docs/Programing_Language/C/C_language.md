
`C语言的基础模板`

```C title="start"
#include <stdio.h>

int main()
{
	
	return 0;
}
```

```C
#include <stdio.h>

int main()
{
	printf("我爱死GitHub了 \n");
	return 0;
}

char * My_strcpy(char *dest , const char *src)
{
	while(*src)
	{
		*dest = *src;
		dest++;
		src++;
	}
	return dest;
}
```



