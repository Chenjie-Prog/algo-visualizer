<div align="center">

# algo-visualizer

**排序算法可视化 —— 纯原生 JavaScript，零依赖，在线即开**

[在线演示](https://chenjie-prog.github.io/algo-visualizer/) ·
[源码](https://github.com/Chenjie-Prog/algo-visualizer) · MIT License

</div>

冒泡 / 插入 / 选择 / 快速 / 归并 / 堆 六种排序的可视化：每一次**比较**（黄）、
**写入**（红）、**落定**（绿）都以颜色实时呈现，附比较数、写入数与用时统计。

## 它的特别之处

- **算法与动画解耦**：每个排序算法是一个**生成器**，只产出
  `{type: "compare" | "swap" | "set" | "sorted", 索引}` 动作流；
  渲染层只消费动作。算法本身零 DOM 依赖，可直接做单元测试——
  这个设计本身就是"如何写出可测试的动画代码"的示例。
- **零依赖**：无构建、无框架、无 npm，三个文件（`index.html` /
  `style.css` / `app.js`），克隆即用。
- **中文界面**，深色主题，速度 5 档可调。

## 本地运行

不需要任何安装：

```bash
git clone https://github.com/Chenjie-Prog/algo-visualizer.git
# 直接双击 index.html，或：
cd algo-visualizer && python -m http.server 8000
# 打开 http://127.0.0.1:8000
```

## 支持的算法

| 算法 | 最好 | 平均 | 最坏 | 稳定 |
| :-- | :-- | :-- | :-- | :-- |
| 冒泡排序 | O(n) | O(n²) | O(n²) | ✅ |
| 插入排序 | O(n) | O(n²) | O(n²) | ✅ |
| 选择排序 | O(n²) | O(n²) | O(n²) | ❌ |
| 快速排序 | O(n log n) | O(n log n) | O(n²) | ❌ |
| 归并排序 | O(n log n) | O(n log n) | O(n log n) | ✅ |
| 堆排序 | O(n log n) | O(n log n) | O(n log n) | ❌ |

## 许可证

[MIT](LICENSE)
