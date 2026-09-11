# __DISPLAY_NAME__

活字格 ReactCellType 前端扩展包包工作目录。

- id: __LIBRARY_ID__
- version: __VERSION__
- globalName: __GLOBAL_NAME__

## 顺序

~~~bash
npm ci
npm run build
npm run validate
npm run smoke
npm run pack
~~~

## 还需要人工完成的

- dist/types.d.ts：按 references/types-and-monaco.md 手写，声明 __GLOBAL_NAME__ 的真实门面。
- 类库最小功能测试、资源清理测试：见 references/verify-locally.md 第 3、8、9 项。
- 上传与设计器/运行时验证：见 references/upload-and-integrate.md。

