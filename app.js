/* 算法可视化 —— 每个算法是一个生成器，逐步产出 {type, 索引} 动作。
   动画层只负责消费动作并渲染，算法本身零 DOM 依赖（也便于单测）。 */

"use strict";

// ---------- 算法生成器 ----------
// 约定：yield {type: "compare", i, j} 比较；{type: "swap", i, j} 交换；
//       {type: "set", i, value} 回写；{type: "pivot", i} 标记主元。
// 所有算法结束时数组升序。

function* bubbleSort(a) {
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      yield { type: "compare", i, j: i + 1 };
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
        yield { type: "swap", i, j: i + 1 };
      }
    }
    yield { type: "sorted", i: end };
    if (!swapped) {
      for (let k = 0; k < end; k++) yield { type: "sorted", i: k };
      return;
    }
  }
  yield { type: "sorted", i: 0 };
}

function* insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0) {
      yield { type: "compare", i: j, j: j + 1 };
      if (a[j] <= key) break;
      a[j + 1] = a[j];
      yield { type: "set", i: j + 1, value: a[j] };
      j--;
    }
    a[j + 1] = key;
    yield { type: "set", i: j + 1, value: key };
  }
  for (let k = 0; k < a.length; k++) yield { type: "sorted", i: k };
}

function* selectionSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {
      yield { type: "compare", i: min, j };
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      yield { type: "swap", i, j: min };
    }
    yield { type: "sorted", i };
  }
  yield { type: "sorted", i: a.length - 1 };
}

function* quickSort(a) {
  yield* qs(a, 0, a.length - 1);
  for (let k = 0; k < a.length; k++) yield { type: "sorted", i: k };
}

function* qs(a, lo, hi) {
  if (lo >= hi) {
    if (lo === hi) yield { type: "sorted", i: lo };
    return;
  }
  const pivot = a[hi];
  yield { type: "pivot", i: hi };
  let boundary = lo;
  for (let i = lo; i < hi; i++) {
    yield { type: "compare", i, j: hi };
    if (a[i] < pivot) {
      if (i !== boundary) {
        [a[i], a[boundary]] = [a[boundary], a[i]];
        yield { type: "swap", i, j: boundary };
      }
      boundary++;
    }
  }
  if (boundary !== hi) {
    [a[boundary], a[hi]] = [a[hi], a[boundary]];
    yield { type: "swap", i: boundary, j: hi };
  }
  yield { type: "sorted", i: boundary };
  yield* qs(a, lo, boundary - 1);
  yield* qs(a, boundary + 1, hi);
}

function* mergeSort(a) {
  yield* ms(a, 0, a.length - 1);
  for (let k = 0; k < a.length; k++) yield { type: "sorted", i: k };
}

function* ms(a, lo, hi) {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  yield* ms(a, lo, mid);
  yield* ms(a, mid + 1, hi);
  const merged = [];
  let i = lo, j = mid + 1;
  while (i <= mid && j <= hi) {
    yield { type: "compare", i, j };
    merged.push(a[i] <= a[j] ? a[i++] : a[j++]);
  }
  while (i <= mid) merged.push(a[i++]);
  while (j <= hi) merged.push(a[j++]);
  for (let k = 0; k < merged.length; k++) {
    a[lo + k] = merged[k];
    yield { type: "set", i: lo + k, value: merged[k] };
  }
}

function* heapSort(a) {
  const n = a.length;
  function* sift(root, size) {
    while (true) {
      let largest = root;
      const left = 2 * root + 1, right = 2 * root + 2;
      if (left < size) {
        yield { type: "compare", i: largest, j: left };
        if (a[left] > a[largest]) largest = left;
      }
      if (right < size) {
        yield { type: "compare", i: largest, j: right };
        if (a[right] > a[largest]) largest = right;
      }
      if (largest === root) return;
      [a[root], a[largest]] = [a[largest], a[root]];
      yield { type: "swap", i: root, j: largest };
      root = largest;
    }
  }
  for (let i = (n >> 1) - 1; i >= 0; i--) yield* sift(i, n);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    yield { type: "swap", i: 0, j: end };
    yield { type: "sorted", i: end };
    yield* sift(0, end);
  }
  yield { type: "sorted", i: 0 };
}

const ALGORITHMS = {
  bubble: { gen: bubbleSort, note: "相邻比较、逐轮冒泡，最好 O(n)（已有序提前退出）。" },
  insertion: { gen: insertionSort, note: "把每个元素插入前方已排序区间，接近有序时极快。" },
  selection: { gen: selectionSort, note: "每轮选出最小值放到前面，交换次数最少。" },
  quick: { gen: quickSort, note: "以末尾为主元分区（红色），平均 O(n log n)。" },
  merge: { gen: mergeSort, note: "递归二分后回写合并结果，稳定 O(n log n)。" },
  heap: { gen: heapSort, note: "先建最大堆，再逐个取堆顶放到末尾。" },
};

// ---------- 渲染与动画 ----------

const els = {
  bars: document.getElementById("bars"),
  algorithm: document.getElementById("algorithm"),
  size: document.getElementById("size"),
  sizeLabel: document.getElementById("size-label"),
  speed: document.getElementById("speed"),
  speedLabel: document.getElementById("speed-label"),
  shuffle: document.getElementById("shuffle"),
  start: document.getElementById("start"),
  comparisons: document.getElementById("comparisons"),
  writes: document.getElementById("writes"),
  elapsed: document.getElementById("elapsed"),
  state: document.getElementById("state"),
  note: document.getElementById("note"),
};

const SPEED_MS = { 1: 120, 2: 60, 3: 25, 4: 8, 5: 1 };
let values = [];
let barEls = [];
let running = false;

function randomValues(size) {
  return Array.from({ length: size },
    () => 8 + Math.floor(Math.random() * 92));
}

function renderBars() {
  els.bars.innerHTML = "";
  barEls = values.map((v) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = v + "%";
    els.bars.appendChild(bar);
    return bar;
  });
}

function paint(i, cls) {
  if (barEls[i]) barEls[i].className = "bar" + (cls ? " " + cls : "");
}

function setBar(i, value) {
  values[i] = value;
  if (barEls[i]) barEls[i].style.height = value + "%";
}

function resetStats() {
  els.comparisons.textContent = "0";
  els.writes.textContent = "0";
  els.elapsed.textContent = "0.0s";
}

function shuffle() {
  if (running) return;
  values = randomValues(Number(els.size.value));
  renderBars();
  resetStats();
  els.state.textContent = "待命";
}

async function run() {
  if (running) return;
  running = true;
  els.start.disabled = true;
  els.start.textContent = "排序中…";
  els.state.textContent = "排序中";

  const algo = ALGORITHMS[els.algorithm.value];
  els.note.textContent = algo.note;
  resetStats();

  const steps = algo.gen(values.slice()); // 算法操作自己的副本，动作作用到真实数组
  const startClock = performance.now();
  const clockTimer = setInterval(() => {
    els.elapsed.textContent =
      ((performance.now() - startClock) / 1000).toFixed(1) + "s";
  }, 100);

  let comparisons = 0, writes = 0;
  let lastPaint = 0;
  const delay = SPEED_MS[Number(els.speed.value)];

  for (const action of steps) {
    if (action.type === "compare") {
      comparisons++;
      els.comparisons.textContent = comparisons;
      paint(action.i, "compare");
      paint(action.j, "compare");
    } else if (action.type === "swap") {
      writes += 2;
      els.writes.textContent = writes;
      const tmp = values[action.i];
      setBar(action.i, values[action.j]);
      setBar(action.j, tmp);
      paint(action.i, "swap");
      paint(action.j, "swap");
    } else if (action.type === "set") {
      writes++;
      els.writes.textContent = writes;
      setBar(action.i, action.value);
      paint(action.i, "swap");
    } else if (action.type === "sorted") {
      paint(action.i, "sorted");
    } else if (action.type === "pivot") {
      paint(action.i, "swap");
    }
    // 动作到达即推进；比较/交换后留一帧让颜色可见
    if (++lastPaint % 2 === 0) await sleep(Math.max(delay, 1));
  }

  clearInterval(clockTimer);
  els.elapsed.textContent =
    ((performance.now() - startClock) / 1000).toFixed(1) + "s";
  els.state.textContent = "完成";
  els.start.disabled = false;
  els.start.textContent = "开始排序";
  running = false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- 事件 ----------

els.size.addEventListener("input", () => {
  els.sizeLabel.textContent = els.size.value;
  shuffle();
});
els.speed.addEventListener("input", () => {
  els.speedLabel.textContent = ["很慢", "慢", "中", "快", "很快"][els.speed.value - 1];
});
els.algorithm.addEventListener("change", () => {
  if (!running) {
    shuffle();
    els.note.textContent = ALGORITHMS[els.algorithm.value].note;
  }
});
els.shuffle.addEventListener("click", shuffle);
els.start.addEventListener("click", run);

shuffle();
